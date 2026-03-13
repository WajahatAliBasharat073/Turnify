import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { PricingService } from './pricing.service';
import { BookingsController } from './bookings.controller';
import { Booking } from '../../database/entities/booking.entity';
import { Property } from '../../database/entities/property.entity';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Property]), PropertiesModule],
  controllers: [BookingsController],
  providers: [BookingsService, PricingService],
})
export class BookingsModule {}
