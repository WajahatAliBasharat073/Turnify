import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Booking, BookingStatus } from '../../database/entities/booking.entity';
import { Property } from '../../database/entities/property.entity';
import { CleanerProfile, ApprovalStatus } from '../../database/entities/cleaner-profile.entity';
import { BookingsGateway } from './bookings.gateway';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(CleanerProfile)
    private readonly cleanerProfileRepository: Repository<CleanerProfile>,
    @InjectQueue('dispatch') private dispatchQueue: Queue,
    private readonly bookingsGateway: BookingsGateway,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Calculates distance between two coordinates in miles using the Haversine formula
   */
  private haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 3958.8; // Radius of Earth in miles

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Master function triggered after payment confirmation to start the dispatching sequence.
   */
  async startDispatchSequence(bookingId: string) {
    this.logger.log(`Starting dispatch sequence for booking ${bookingId}`);
    
    // Set booking status to SEARCHING
    await this.bookingsRepository.update(
      { id: bookingId },
      { status: BookingStatus.SEARCHING }
    );

    // Initial dispatch queue job (round 1)
    await this.dispatchQueue.add('dispatch_job', {
      bookingId,
      round: 1,
      excludedCleanerIds: [],
    });
  }

  /**
   * Executed by the Bull Processor. Finds nearby cleaners and offers the job.
   */
  async dispatchJob(bookingId: string, round: number, excludedCleanerIds: string[]) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['property', 'host'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found during dispatch`);
    }

    // Stop dispatching if booking was cancelled or already assigned
    if (booking.status !== BookingStatus.SEARCHING) {
      this.logger.log(`Booking ${bookingId} is no longer SEARCHING (status: ${booking.status}). Halting dispatch.`);
      return;
    }

    if (round > 3) {
      this.logger.log(`Booking ${bookingId} exhausted 3 rounds. Marking as pending cancellation (No cleaners available).`);
      
      // Auto-cancel logic
      booking.status = BookingStatus.CANCELLED;
      booking.cancellation_reason = 'No cleaners available in your area at this time';
      await this.bookingsRepository.save(booking);

      this.bookingsGateway.emitToUser(
        booking.host_id,
        'booking:job_declined',
        { bookingId, message: booking.cancellation_reason }
      );
      
      // Note: Ideally hook into Stripe to refund the host here.
      return;
    }

    const { latitude, longitude, zip_code } = booking.property;

    if (!latitude || !longitude) {
      this.logger.error(`Property ${booking.property.id} is missing coordinates. Cannot dispatch.`);
      return;
    }

    // Query available cleaners
    let cleanersQuery = this.cleanerProfileRepository.createQueryBuilder('cleanerProfile')
      .leftJoinAndSelect('cleanerProfile.user', 'user')
      .where('cleanerProfile.is_available = :isAvailable', { isAvailable: true })
      .andWhere('cleanerProfile.approval_status = :status', { status: ApprovalStatus.APPROVED })
      .andWhere('cleanerProfile.stripe_onboarding_complete = :onboarded', { onboarded: true });

    if (excludedCleanerIds.length > 0) {
      cleanersQuery = cleanersQuery.andWhere('cleanerProfile.user_id NOT IN (:...excluded)', { excluded: excludedCleanerIds });
    }

    const availableCleaners = await cleanersQuery.getMany();

    // In a real scenario, we might want to check the zip_code against a defined service area array.
    // For this demonstration, we are computing distance for all active cleaners in the DB.

    const cleanersWithDistance = availableCleaners
      .filter((c) => c.latitude && c.longitude)
      .map((cleaner) => {
        const distance = this.haversineDistanceMiles(
          latitude,
          longitude,
          cleaner.latitude,
          cleaner.longitude,
        );
        return { cleaner, distance };
      });

    // Sort by rating_avg DESC, distance ASC
    cleanersWithDistance.sort((a, b) => {
      // Primary Sort: Rating
      const ratingDiff = b.cleaner.rating_avg - a.cleaner.rating_avg;
      if (ratingDiff !== 0) return ratingDiff;
      // Secondary Sort: Distance (closest first)
      return a.distance - b.distance;
    });

    // Select Top 5 for this round
    const topCleaners = cleanersWithDistance.slice(0, 5);

    if (topCleaners.length === 0) {
      this.logger.log(`No available cleaners found for booking ${bookingId} in round ${round}. Auto-skipping to next round.`);
      // Retry next round after delay
      await this.dispatchQueue.add(
        'dispatch_job',
        { bookingId, round: round + 1, excludedCleanerIds },
        { delay: 30000 } // wait 30 seconds
      );
      return;
    }

    const offeredIds = topCleaners.map(c => c.cleaner.user_id);
    this.logger.log(`Dispatching ${bookingId} to cleaners: ${offeredIds.join(', ')}`);

    const payload = {
      bookingId: booking.id,
      propertyType: booking.property.property_type,
      distance: topCleaners[0]?.distance, // Approximation, distinct per user natively
      duration: booking.estimated_duration_hours,
      payout: booking.cleaner_payout,
      scheduled_at: booking.scheduled_at,
    };

    topCleaners.forEach(tc => {
      // Emit WebSocket Event
      this.bookingsGateway.emitToUser(
        tc.cleaner.user_id,
        'booking:job_available',
        { ...payload, distance: tc.distance } // Overwrite specific distance
      );

      // Trigger Push Notification (Placeholder for OneSignal integration)
      this.logger.log(`[Push Notification Placeholder] Job offered to ${tc.cleaner.user.first_name}`);
    });

    // Queue Timeout Job: If no one accepts in 60 seconds
    const combinedExcluded = [...excludedCleanerIds, ...offeredIds];
    await this.dispatchQueue.add(
      'cleaner_timeout',
      {
        bookingId,
        round,
        offeredIds,
        combinedExcluded,
      },
      { delay: 60000 } // 60 seconds
    );
  }

  /**
   * Handle the timeout event generated if a cleaner doesn't respond in 60s
   */
  async handleCleanerTimeout(bookingId: string, round: number, offeredIds: string[], combinedExcluded: string[]) {
    // Check if it's still searching
    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    
    if (booking && booking.status === BookingStatus.SEARCHING) {
      this.logger.log(`Timeout hit for ${bookingId} round ${round}. Proceeding to next round.`);
      
      // Move to next round
      await this.dispatchQueue.add('dispatch_job', {
        bookingId,
        round: round + 1,
        excludedCleanerIds: combinedExcluded,
      });
    }
  }
}
