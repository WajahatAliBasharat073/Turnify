import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';

export enum PhotoType {
  BEFORE = 'before',
  AFTER = 'after',
}

@Entity('booking_photos')
export class BookingPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  booking_id: string;

  @ManyToOne(() => Booking, booking => booking.photos)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column('uuid')
  uploaded_by_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by: User;

  @Column({ type: 'enum', enum: PhotoType })
  photo_type: PhotoType;

  @Column()
  s3_key: string;

  @Column()
  s3_url: string;

  @Column({ nullable: true })
  cloudfront_url: string;

  @Column('int')
  file_size_bytes: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
