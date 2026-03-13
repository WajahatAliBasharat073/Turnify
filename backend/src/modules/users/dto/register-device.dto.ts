import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

export class RegisterDeviceDto {
  @ApiProperty({ example: 'b0e071c3-42e5-4b53-90dd-abc123456789' })
  @IsString()
  @IsNotEmpty()
  player_id: string;

  @ApiProperty({ enum: DevicePlatform, example: DevicePlatform.IOS })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}
