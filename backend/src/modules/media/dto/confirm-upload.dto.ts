import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ConfirmUploadDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  photo_id: string;
}
