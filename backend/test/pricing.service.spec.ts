import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from '../src/modules/bookings/pricing.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Property, PropertyType } from '../src/database/entities/property.entity';
import { BookingType } from '../src/database/entities/booking.entity';
import { ConfigService } from '@nestjs/config';

describe('PricingService', () => {
  let service: PricingService;
  let mockPropertiesRepository: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockPropertiesRepository = {
      findOne: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn().mockReturnValue(15), // Default platform fee 15%
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getRepositoryToken(Property),
          useValue: mockPropertiesRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  const generateProperty = (overrides: Partial<Property>) => ({
    id: 'prop-id',
    is_active: true,
    property_type: PropertyType.APARTMENT,
    size_sqft: 800,
    num_bedrooms: 1,
    num_bathrooms: 1,
    ...overrides,
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calculates baseline apartment (500 sqft, 1 bed, 1 bath, scheduled)', async () => {
    mockPropertiesRepository.findOne.mockResolvedValue(generateProperty({
      property_type: PropertyType.APARTMENT,
      size_sqft: 500, // multiplier 1.0x
      num_bedrooms: 1, // adder 0
      num_bathrooms: 1, // adder 0
    }));

    const result = await service.calculate('prop-id', BookingType.SCHEDULED);
    
    // base: 45 * 1.0 = 45. Adders: 0. Subtotal: 45
    // Platform fee 15%: 45 * 0.15 = 6.75
    // Total: 51.75
    // Payout: 45
    expect(result.price_subtotal).toBe(45);
    expect(result.platform_fee).toBe(6.75);
    expect(result.price_total).toBe(51.75);
    expect(result.cleaner_payout).toBe(45);
    expect(result.price_subtotal_cents).toBe(4500);
    expect(result.price_breakdown.subtotal_before_fee).toBe(45);
  });

  it('applies property type base rates correctly', async () => {
    const types = [
      { type: PropertyType.STUDIO, expected: 35 },
      { type: PropertyType.CONDO, expected: 50 },
      { type: PropertyType.HOUSE, expected: 65 },
      { type: PropertyType.VILLA, expected: 95 },
      { type: PropertyType.OTHER, expected: 50 },
    ];

    for (const t of types) {
      mockPropertiesRepository.findOne.mockResolvedValue(generateProperty({
        property_type: t.type,
        size_sqft: 500, // 1.0x
      }));
      const result = await service.calculate('prop-id', BookingType.SCHEDULED);
      expect(result.price_breakdown.base_rate).toBe(t.expected);
      expect(result.price_subtotal).toBe(t.expected);
    }
  });

  it('applies size multipliers correctly', async () => {
    const sizes = [
      { sqft: 500, mult: 1.0 },
      { sqft: 600, mult: 1.2 },
      { sqft: 1000, mult: 1.5 },
      { sqft: 1500, mult: 1.8 },
      { sqft: 2000, mult: 2.2 },
      { sqft: 3000, mult: 2.8 },
    ];

    for (const s of sizes) {
      mockPropertiesRepository.findOne.mockResolvedValue(generateProperty({
        property_type: PropertyType.APARTMENT, // base 45
        size_sqft: s.sqft,
      }));
      const result = await service.calculate('prop-id', BookingType.SCHEDULED);
      expect(result.price_breakdown.size_multiplier).toBe(s.mult);
      expect(result.price_breakdown.subtotal_before_fee).toBe(45 * s.mult);
    }
  });

  it('calculates multiple adders and instant booking premium', async () => {
    mockPropertiesRepository.findOne.mockResolvedValue(generateProperty({
      property_type: PropertyType.HOUSE, // base 65
      size_sqft: 2000, // mult 2.2 -> 65 * 2.2 = 143
      num_bedrooms: 3, // 2 extra -> 16
      num_bathrooms: 2.5, // 1.5 extra -> 15 
    }));

    // For instantaneous:
    const result = await service.calculate('prop-id', BookingType.INSTANT);
    
    // Subtotal before fee: 143 + 16 + 15 = 174
    expect(result.price_breakdown.subtotal_before_fee).toBe(174);
    
    // Urgency premium: 174 * 0.20 = 34.8
    expect(result.price_breakdown.urgency_premium).toBe(34.8);
    
    // Price subtotal: 174 + 34.8 = 208.8
    expect(result.price_subtotal).toBe(208.8);

    // Platform fee (15% of 208.8) = 31.32
    expect(result.platform_fee).toBe(31.32);

    // Total: 208.8 + 31.32 = 240.12
    expect(result.price_total).toBe(240.12);

    // Payout: 208.8
    expect(result.cleaner_payout).toBe(208.8);
    
    // Cents representation
    expect(result.price_subtotal_cents).toBe(20880);
    expect(result.price_total_cents).toBe(24012);
  });

  it('handles dimension edge cases (minimums and maximums)', async () => {
    mockPropertiesRepository.findOne.mockResolvedValue(generateProperty({
      property_type: PropertyType.STUDIO, // base 35
      size_sqft: 300, // duration: 300/400 = 0.75 + 0.5(1) + 0.25(1) = 1.5 -> min is 1.5
      num_bedrooms: 1,
      num_bathrooms: 1,
    }));
    let result = await service.calculate('prop-id', BookingType.SCHEDULED);
    expect(result.estimated_duration_hours).toBe(1.5);

    mockPropertiesRepository.findOne.mockResolvedValue(generateProperty({
      property_type: PropertyType.VILLA, 
      size_sqft: 5000, 
      num_bedrooms: 6, // 3 
      num_bathrooms: 5, // 1.25 -> large duration
    }));
    result = await service.calculate('prop-id', BookingType.SCHEDULED);
    expect(result.estimated_duration_hours).toBe(8); // capped at 8 max
  });
});
