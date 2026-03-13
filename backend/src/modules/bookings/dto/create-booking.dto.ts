import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BookingType } from '../../../database/entities/booking.entity';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  property_id: string;

  @ApiProperty({ enum: BookingType })
  @IsEnum(BookingType)
  @IsNotEmpty()
  booking_type: BookingType;

  @ApiProperty({ example: '2026-12-01T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduled_at: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  special_requests?: string;
}
