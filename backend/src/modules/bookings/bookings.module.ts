import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { BookingsService } from './bookings.service';
import { PricingService } from './pricing.service';
import { BookingsController } from './bookings.controller';
import { Booking } from '../../database/entities/booking.entity';
import { Property } from '../../database/entities/property.entity';
import { BookingPhoto } from '../../database/entities/booking-photo.entity';
import { CleanerProfile } from '../../database/entities/cleaner-profile.entity';
import { PropertiesModule } from '../properties/properties.module';
import { BookingsGateway } from './bookings.gateway';
import { DispatchService } from './dispatch.service';
import { DispatchProcessor } from './dispatch.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Property,
      BookingPhoto,
      CleanerProfile,
    ]),
    BullModule.registerQueue({
      name: 'dispatch',
    }),
    JwtModule.register({}),
    PropertiesModule,
  ],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    PricingService,
    BookingsGateway,
    DispatchService,
    DispatchProcessor,
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
