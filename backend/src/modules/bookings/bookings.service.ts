import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Booking,
  BookingStatus,
} from '../../database/entities/booking.entity';
import { Property } from '../../database/entities/property.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { BookingPhoto, PhotoType } from '../../database/entities/booking-photo.entity';
import { BookingsGateway } from './bookings.gateway';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PricingService } from './pricing.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
    @InjectRepository(BookingPhoto)
    private photosRepository: Repository<BookingPhoto>,
    private pricingService: PricingService,
    private bookingsGateway: BookingsGateway,
  ) {}

  /**
   * Helper to determine what property data a user can see
   */
  private maskBookingProperty(booking: Booking, user: User): Booking {
    if (!booking.property) return booking;

    // Host always sees full property details
    if (user.role === UserRole.HOST && booking.host_id === user.id) {
      return booking;
    }

    // Admins see full
    if (user.role === UserRole.ADMIN) {
      return booking;
    }

    // For cleaners: hide access instructions UNLESS they are assigned AND job is IN_PROGRESS
    if (user.role === UserRole.CLEANER) {
      const isAssigned = booking.cleaner_id === user.id;
      const isInProgress = booking.status === BookingStatus.IN_PROGRESS;

      if (!isAssigned || !isInProgress) {
        delete booking.property.access_instructions;
      }
    }

    return booking;
  }

  /**
   * Create a new booking
   */
  async create(host: User, createBookingDto: CreateBookingDto): Promise<Booking> {
    const { property_id, booking_type, scheduled_at, special_requests } =
      createBookingDto;

    const property = await this.propertiesRepository.findOne({
      where: { id: property_id, host_id: host.id, is_active: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found or does not belong to you');
    }

    const scheduledDate = new Date(scheduled_at);
    const now = new Date();
    const diffHours = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      throw new BadRequestException('Booking must be scheduled at least 2 hours in advance');
    }

    const priceBreakdown = await this.pricingService.calculate(
      property_id,
      booking_type,
    );

    const booking = this.bookingsRepository.create({
      property_id,
      host_id: host.id,
      booking_type,
      scheduled_at: scheduledDate,
      special_requests,
      status: BookingStatus.PENDING_PAYMENT,
      ...priceBreakdown,
    });

    return this.bookingsRepository.save(booking);
  }

  /**
   * Get all bookings relevant to a user
   */
  async findAll(user: User): Promise<Booking[]> {
    const query = this.bookingsRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.property', 'property')
      .leftJoinAndSelect('booking.cleaner', 'cleaner')
      .leftJoinAndSelect('booking.host', 'host');

    if (user.role === UserRole.HOST) {
      query.where('booking.host_id = :userId', { userId: user.id });
    } else if (user.role === UserRole.CLEANER) {
      query.where('booking.cleaner_id = :userId', { userId: user.id });
    }

    const bookings = await query.orderBy('booking.scheduled_at', 'ASC').getMany();
    return bookings.map((b) => this.maskBookingProperty(b, user));
  }

  /**
   * Get specific booking
   */
  async findOne(id: string, user: User): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['property', 'host', 'cleaner'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Role-based access check
    if (
      user.role === UserRole.HOST && booking.host_id !== user.id ||
      user.role === UserRole.CLEANER && booking.cleaner_id !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return this.maskBookingProperty(booking, user);
  }

  /**
   * Cancel booking (Host only)
   */
  async cancel(id: string, host: User): Promise<Booking> {
    const booking = await this.findOne(id, host);

    if (booking.status !== BookingStatus.SEARCHING && booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Booking cannot be cancelled at this stage');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancellation_reason = 'Cancelled by Host';
    return this.bookingsRepository.save(booking);
  }

  /**
   * Confirm booking completion (Host only)
   */
  async confirmCompletion(id: string, host: User): Promise<Booking> {
    const booking = await this.findOne(id, host);

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking must be marked as completed by the cleaner first');
    }

    booking.host_confirmed_at = new Date();
    // Here we would also trigger payouts
    return this.bookingsRepository.save(booking);
  }

  async acceptBooking(id: string, cleaner: User): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['property'],
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.SEARCHING) {
      throw new BadRequestException('Booking is no longer available');
    }

    booking.cleaner_id = cleaner.id;
    booking.status = BookingStatus.ASSIGNED;
    const savedBooking = await this.bookingsRepository.save(booking);

    this.bookingsGateway.emitToUser(
      booking.host_id,
      'booking:job_accepted',
      { bookingId: booking.id, cleanerId: cleaner.id }
    );

    return savedBooking;
  }

  async declineBooking(id: string, cleaner: User) {
    // This acknowledges the decline. The Bull Queue timer will proceed to the next round if all decline.
    return { success: true, message: 'Job declined successfully' };
  }

  async startBooking(id: string, cleaner: User): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({ where: { id } });
    if (!booking || booking.cleaner_id !== cleaner.id) {
      throw new NotFoundException('Booking not found or not assigned to you');
    }

    if (booking.status !== BookingStatus.ASSIGNED) {
      throw new BadRequestException('Booking cannot be started from its current status');
    }

    booking.status = BookingStatus.IN_PROGRESS;
    const savedBooking = await this.bookingsRepository.save(booking);

    this.bookingsGateway.emitToUser(
      booking.host_id,
      'booking:job_started',
      { bookingId: booking.id }
    );

    return savedBooking;
  }

  async completeBooking(id: string, cleaner: User): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({ where: { id } });
    if (!booking || booking.cleaner_id !== cleaner.id) {
      throw new NotFoundException('Booking not found or not assigned to you');
    }

    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Booking must be IN_PROGRESS to complete');
    }

    // Require AFTER photos to complete
    const afterPhotos = await this.photosRepository.find({
      where: { booking_id: id, photo_type: PhotoType.AFTER },
    });

    const confirmedAfterPhotos = afterPhotos.filter(p => p.s3_url !== null);
    if (confirmedAfterPhotos.length === 0) {
      throw new BadRequestException('You must upload and confirm at least one AFTER photo to complete the job');
    }

    booking.status = BookingStatus.COMPLETED;
    booking.completed_at = new Date();
    const savedBooking = await this.bookingsRepository.save(booking);

    this.bookingsGateway.emitToUser(
      booking.host_id,
      'booking:job_completed',
      { bookingId: booking.id }
    );

    return savedBooking;
  }
}
