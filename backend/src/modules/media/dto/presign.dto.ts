import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max } from 'class-validator';
import { PhotoType } from '../../../database/entities/booking-photo.entity';

export enum AllowedMimeTypes {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
  HEIC = 'image/heic',
}

export class PresignDto {
  @ApiProperty({ enum: PhotoType })
  @IsEnum(PhotoType)
  @IsNotEmpty()
  photo_type: PhotoType;

  @ApiProperty({ example: 'living_room_before.jpg' })
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @ApiProperty({ example: 5000000, description: 'File size in bytes (max 15MB)' })
  @IsInt()
  @Max(15728640) // 15MB
  @IsNotEmpty()
  file_size_bytes: number;

  @ApiProperty({ enum: AllowedMimeTypes })
  @IsEnum(AllowedMimeTypes)
  @IsNotEmpty()
  mime_type: AllowedMimeTypes;
}
