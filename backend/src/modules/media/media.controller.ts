import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { PresignDto } from './dto/presign.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'bookings/:bookingId/photos', version: '1' })
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presign')
  @Roles(UserRole.HOST, UserRole.CLEANER)
  @ApiOperation({ summary: 'Get a pre-signed URL to upload a photo directly to S3' })
  @ApiResponse({ status: 201, description: 'Returns pre-signed URL and temporary photo ID' })
  getPresignedUrl(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() presignDto: PresignDto,
    @GetUser() user: User,
  ) {
    return this.mediaService.generatePresignedUrl(bookingId, presignDto, user);
  }

  @Post('confirm')
  @Roles(UserRole.HOST, UserRole.CLEANER)
  @ApiOperation({ summary: 'Confirm a photo upload is complete' })
  @ApiResponse({ status: 200, description: 'Returns the confirmed photo record' })
  confirmUpload(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() confirmDto: ConfirmUploadDto,
    @GetUser() user: User,
  ) {
    return this.mediaService.confirmUpload(bookingId, confirmDto, user);
  }

  @Get()
  @Roles(UserRole.HOST, UserRole.CLEANER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all confirmed photos for a booking' })
  @ApiResponse({ status: 200, description: 'Returns arrays of before/after photos' })
  getPhotos(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @GetUser() user: User,
  ) {
    return this.mediaService.getBookingPhotos(bookingId, user);
  }

  @Delete(':photoId')
  @Roles(UserRole.HOST, UserRole.CLEANER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete a photo' })
  @ApiResponse({ status: 200, description: 'Successfully removed photo' })
  removePhoto(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @GetUser() user: User,
  ) {
    return this.mediaService.remove(bookingId, photoId, user);
  }
}
