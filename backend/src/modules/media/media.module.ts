import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { BookingPhoto } from '../../database/entities/booking-photo.entity';
import { Booking } from '../../database/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BookingPhoto, Booking])],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
