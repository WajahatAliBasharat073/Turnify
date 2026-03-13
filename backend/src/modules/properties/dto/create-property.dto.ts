import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PropertyType } from '../../../database/entities/property.entity';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Cozy Beachfront Condo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Ocean Drive' })
  @IsString()
  @IsNotEmpty()
  address_line1: string;

  @ApiProperty({ required: false, example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiProperty({ example: 'Miami' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'FL' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '33101' })
  @IsString()
  @IsNotEmpty()
  zip_code: string;

  @ApiProperty({ example: 'US', default: 'US' })
  @IsString()
  @IsNotEmpty()
  country: string = 'US';

  @ApiProperty({ enum: PropertyType, example: PropertyType.CONDO })
  @IsEnum(PropertyType)
  property_type: PropertyType;

  @ApiProperty({ example: 1200 })
  @IsInt()
  @Min(100)
  size_sqft: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  num_bedrooms: number;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0)
  num_bathrooms: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  special_instructions?: string;

  @ApiProperty({
    required: false,
    description: 'Sensitive access information like lockbox codes',
  })
  @IsOptional()
  @IsString()
  access_instructions?: string;
}
