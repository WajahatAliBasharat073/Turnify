import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property, PropertyType } from '../../database/entities/property.entity';
import { BookingType } from '../../database/entities/booking.entity';
import { ConfigService } from '@nestjs/config';

export interface PriceBreakdownDetail {
  base_rate: number;
  size_multiplier: number;
  bedroom_adder: number;
  bathroom_adder: number;
  urgency_premium: number;
  subtotal_before_fee: number;
}

export interface PriceCalculationResult {
  price_subtotal: number;
  platform_fee: number;
  price_total: number;
  cleaner_payout: number;
  estimated_duration_hours: number;
  price_breakdown: PriceBreakdownDetail;
  price_subtotal_cents?: number;
  platform_fee_cents?: number;
  price_total_cents?: number;
  cleaner_payout_cents?: number;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
    private configService: ConfigService,
  ) {}

  private getBaseRate(type: PropertyType): number {
    switch (type) {
      case PropertyType.APARTMENT: return 45;
      case PropertyType.STUDIO: return 35;
      case PropertyType.CONDO: return 50;
      case PropertyType.HOUSE: return 65;
      case PropertyType.VILLA: return 95;
      case PropertyType.OTHER:
      default: return 50;
    }
  }

  private getSizeMultiplier(sqft: number): number {
    if (sqft <= 500) return 1.0;
    if (sqft <= 800) return 1.2;
    if (sqft <= 1200) return 1.5;
    if (sqft <= 1800) return 1.8;
    if (sqft <= 2500) return 2.2;
    return 2.8;
  }

  private round2(num: number): number {
    return Math.round(num * 100) / 100;
  }

  private toCents(num: number): number {
    return Math.round(num * 100);
  }

  async calculate(
    propertyId: string,
    bookingType: BookingType,
  ): Promise<PriceCalculationResult> {
    const property = await this.propertiesRepository.findOne({
      where: { id: propertyId, is_active: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // 1. Base Rate
    const base_rate = this.getBaseRate(property.property_type);

    // 2. Size Multiplier
    const size_multiplier = this.getSizeMultiplier(property.size_sqft);

    // 3. Bedroom Adder (above 1)
    const extraBedrooms = Math.max(0, property.num_bedrooms - 1);
    const bedroom_adder = extraBedrooms * 8;

    // 4. Bathroom Adder (above 1)
    const extraBathrooms = Math.max(0, Number(property.num_bathrooms) - 1);
    const bathroom_adder = extraBathrooms * 10;

    // 5. Subtotal before urgency
    const sizeAdjustedBase = base_rate * size_multiplier;
    const subtotal_before_fee = sizeAdjustedBase + bedroom_adder + bathroom_adder;

    // 6. Urgency Premium
    let urgency_premium = 0;
    if (bookingType === BookingType.INSTANT) {
      urgency_premium = subtotal_before_fee * 0.20;
    }

    // 7. Price Subtotal
    const price_subtotal = subtotal_before_fee + urgency_premium;

    // 8. Platform Fee
    const fee_percent = this.configService.get<number>('STRIPE_PLATFORM_FEE_PERCENT', 15);
    const platform_fee = price_subtotal * (fee_percent / 100);

    // 9. Price Total & Payout
    const price_total = price_subtotal + platform_fee;
    const cleaner_payout = price_subtotal;

    // 10. Estimated Duration
    let duration = (property.size_sqft / 400) + (property.num_bedrooms * 0.5) + (Number(property.num_bathrooms) * 0.25);
    if (duration < 1.5) duration = 1.5;
    if (duration > 8) duration = 8;
    
    // We do NOT use round2 on duration, as instructions simply say base_duration_hours math
    // But we should round or return standard float to match requirements. Let's round to 2 decimals.
    const estimated_duration_hours = this.round2(duration);

    return {
      price_subtotal: this.round2(price_subtotal),
      platform_fee: this.round2(platform_fee),
      price_total: this.round2(price_total),
      cleaner_payout: this.round2(cleaner_payout),
      estimated_duration_hours,
      price_breakdown: {
        base_rate: this.round2(base_rate),
        size_multiplier,
        bedroom_adder: this.round2(bedroom_adder),
        bathroom_adder: this.round2(bathroom_adder),
        urgency_premium: this.round2(urgency_premium),
        subtotal_before_fee: this.round2(subtotal_before_fee),
      },
      price_subtotal_cents: this.toCents(price_subtotal),
      platform_fee_cents: this.toCents(platform_fee),
      price_total_cents: this.toCents(price_total),
      cleaner_payout_cents: this.toCents(cleaner_payout),
    };
  }
}
