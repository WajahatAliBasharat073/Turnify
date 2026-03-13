import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../database/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @Length(8, 100)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. Must contain uppercase, number, and special character.',
  })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @Length(2, 50)
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @Length(2, 50)
  last_name: string;

  @ApiProperty({ enum: ['host', 'cleaner'] })
  @IsEnum([UserRole.HOST, UserRole.CLEANER], {
    message: 'Role must be either host or cleaner',
  })
  role: UserRole;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}
