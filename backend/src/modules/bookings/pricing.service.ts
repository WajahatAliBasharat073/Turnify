import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../../database/entities/property.entity';
import { BookingType } from '../../database/entities/booking.entity';
import { ConfigService } from '@nestjs/config';

export interface PriceBreakdown {
  estimated_duration_hours: number;
  price_subtotal: number;
  platform_fee: number;
  price_total: number;
  cleaner_payout: number;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
    private configService: ConfigService,
  ) {}

  /**
   * Calculate the estimated price for a booking based on property dimensions.
   * This is a simplified calculation model.
   */
  async calculate(
    propertyId: string,
    bookingType: BookingType,
  ): Promise<PriceBreakdown> {
    const property = await this.propertiesRepository.findOne({
      where: { id: propertyId, is_active: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // 1. Calculate Estimated Duration
    let estimatedDuration = (property.size_sqft / 500) + (property.num_bedrooms * 0.5) + (Number(property.num_bathrooms) * 0.75);
    
    // Minimum 2 hours
    if (estimatedDuration < 2) estimatedDuration = 2;

    // 2. Calculate Subtotal (Base Rate per hour)
    let hourlyRate = 30; // Base $30/hr
    if (bookingType === BookingType.INSTANT) {
      hourlyRate += 15; // $15 premium for instant booking
    }

    const priceSubtotal = estimatedDuration * hourlyRate;

    // 3. Platform Fee Calculation
    const platformFeePercent = this.configService.get<number>('STRIPE_PLATFORM_FEE_PERCENT', 15);
    const platformFee = priceSubtotal * (platformFeePercent / 100);

    // 4. Totals and Payout
    const priceTotal = priceSubtotal + platformFee;
    const cleanerPayout = priceSubtotal; // In this model, cleaner gets the full subtotal

    return {
      estimated_duration_hours: Number(estimatedDuration.toFixed(2)),
      price_subtotal: Number(priceSubtotal.toFixed(2)),
      platform_fee: Number(platformFee.toFixed(2)),
      price_total: Number(priceTotal.toFixed(2)),
      cleaner_payout: Number(cleanerPayout.toFixed(2)),
    };
  }
}
