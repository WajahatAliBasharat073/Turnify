import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

import {
  BookingPhoto,
  PhotoType,
} from '../../database/entities/booking-photo.entity';
import { Booking, BookingStatus } from '../../database/entities/booking.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { PresignDto } from './dto/presign.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';

@Injectable()
export class MediaService {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(MediaService.name);
  private readonly bucketName: string;
  private readonly cloudfrontUrl: string;

  constructor(
    @InjectRepository(BookingPhoto)
    private photosRepository: Repository<BookingPhoto>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    this.cloudfrontUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL');

    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Generates a pre-signed URL for direct S3 uploads.
   */
  async generatePresignedUrl(
    bookingId: string,
    dto: PresignDto,
    user: User,
  ): Promise<{ presigned_url: string; s3_key: string; photo_id: string; expires_in: number }> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Authorization
    const isHost = user.role === UserRole.HOST && booking.host_id === user.id;
    const isAssignedCleaner =
      user.role === UserRole.CLEANER && booking.cleaner_id === user.id;

    if (!isHost && !isAssignedCleaner) {
      throw new ForbiddenException('You do not have permission to upload photos for this booking');
    }

    // Business Rules for Photo Types
    if (dto.photo_type === PhotoType.BEFORE) {
      if (
        booking.status !== BookingStatus.ASSIGNED &&
        booking.status !== BookingStatus.IN_PROGRESS
      ) {
        throw new BadRequestException(
          'Before photos can only be uploaded when booking is assigned or in progress',
        );
      }
    } else if (dto.photo_type === PhotoType.AFTER) {
      if (booking.status !== BookingStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'After photos can only be uploaded when booking is in progress',
        );
      }
    }

    // S3 Key Generation: photos/{bookingId}/{photo_type}/{uuid}.{ext}
    const ext = dto.mime_type.split('/')[1]; // e.g., 'jpeg', 'png'
    const uuid = uuidv4();
    const s3Key = `photos/${bookingId}/${dto.photo_type}/${uuid}.${ext}`;

    // Create pending database record
    // Note: s3_url is null initially, meaning unconfirmed
    const pendingPhoto = this.photosRepository.create({
      booking_id: bookingId,
      uploaded_by_id: user.id,
      photo_type: dto.photo_type,
      file_size_bytes: dto.file_size_bytes,
      s3_key: s3Key,
      s3_url: null, // Will be set on confirmation
      cloudfront_url: null,
    });

    const savedPhoto = await this.photosRepository.save(pendingPhoto);

    // Generate Pre-signed URL
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: dto.mime_type,
      ContentLength: dto.file_size_bytes,
    });

    try {
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 300, // 5 minutes
      });

      return {
        presigned_url: presignedUrl,
        s3_key: s3Key,
        photo_id: savedPhoto.id,
        expires_in: 300,
      };
    } catch (error) {
      this.logger.error(`Error generating pre-signed URL: ${error.message}`);
      // Cleanup pending record if we failed
      await this.photosRepository.delete(savedPhoto.id);
      throw new BadRequestException('Failed to generate upload URL');
    }
  }

  /**
   * Confirms an upload was successful by checking S3 and updating the record.
   */
  async confirmUpload(
    bookingId: string,
    dto: ConfirmUploadDto,
    user: User,
  ): Promise<BookingPhoto> {
    const photo = await this.photosRepository.findOne({
      where: { id: dto.photo_id, booking_id: bookingId },
    });

    if (!photo) {
      throw new NotFoundException('Pending photo record not found');
    }

    // Verify it belongs to this user (they initiated the upload)
    if (photo.uploaded_by_id !== user.id) {
      throw new ForbiddenException('You cannot confirm an upload you did not initiate');
    }

    // Verify if it already exists in S3
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: photo.s3_key,
      });
      await this.s3Client.send(headCommand);
    } catch (error) {
      this.logger.error(`Confirmation failed. S3 HeadObject error: ${error.message}`);
      throw new BadRequestException('File does not exist in the storage bucket. Did the upload finish?');
    }

    // Mark as confirmed
    photo.s3_url = `https://${this.bucketName}.s3.amazonaws.com/${photo.s3_key}`;
    // Optionally use CloudFront if configured
    if (this.cloudfrontUrl) {
      photo.cloudfront_url = `${this.cloudfrontUrl}/${photo.s3_key}`;
    }

    return this.photosRepository.save(photo);
  }

  /**
   * Get all photos for a booking, grouped by type.
   * Only returns fully confirmed photos.
   */
  async getBookingPhotos(bookingId: string, user: User) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isHost = user.role === UserRole.HOST && booking.host_id === user.id;
    const isAssignedCleaner =
      user.role === UserRole.CLEANER && booking.cleaner_id === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isHost && !isAssignedCleaner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to view these photos');
    }

    const photos = await this.photosRepository.find({
      where: { booking_id: bookingId },
      relations: ['uploaded_by'],
    });

    // Filter ONLY confirmed photos (i.e. s3_url is not null)
    const confirmedPhotos = photos.filter((p) => p.s3_url !== null);

    // Map output to prefer CloudFront and strip direct S3 paths, include uploader info
    const formattedPhotos = confirmedPhotos.map((p) => ({
      id: p.id,
      photo_type: p.photo_type,
      url: p.cloudfront_url || p.s3_url, // Prefer CDN, fallback to raw S3 URL if CDN not configured
      file_size_bytes: p.file_size_bytes,
      created_at: p.created_at,
      uploaded_by: {
        id: p.uploaded_by.id,
        name: `${p.uploaded_by.first_name || ''} ${p.uploaded_by.last_name || ''}`.trim(),
        role: p.uploaded_by.role,
      },
    }));

    return {
      before: formattedPhotos.filter((p) => p.photo_type === PhotoType.BEFORE),
      after: formattedPhotos.filter((p) => p.photo_type === PhotoType.AFTER),
    };
  }

  /**
   * Soft delete photo
   */
  async remove(bookingId: string, photoId: string, user: User) {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId, booking_id: bookingId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isUploader = photo.uploaded_by_id === user.id;

    if (!isAdmin && !isUploader) {
      throw new ForbiddenException('You can only delete your own photos');
    }

    // Physically delete from Database
    // (Actual S3 object deletion could stay for historical legal reasons, or run via an async job, here keeping simple)
    await this.photosRepository.delete(photoId);

    return { success: true };
  }
}
