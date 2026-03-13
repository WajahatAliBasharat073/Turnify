import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Property } from './property.entity';
import { Payment } from './payment.entity';
import { BookingPhoto } from './booking-photo.entity';
import { Review } from './review.entity';

export enum BookingType {
  INSTANT = 'instant',
  SCHEDULED = 'scheduled',
}

export enum BookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  SEARCHING = 'searching',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  property_id: string;

  @ManyToOne(() => Property, property => property.bookings)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column('uuid')
  host_id: string;

  @ManyToOne(() => User, user => user.host_bookings)
  @JoinColumn({ name: 'host_id' })
  host: User;

  @Column('uuid', { nullable: true })
  cleaner_id: string;

  @ManyToOne(() => User, user => user.cleaner_bookings)
  @JoinColumn({ name: 'cleaner_id' })
  cleaner: User;

  @Column({ type: 'enum', enum: BookingType })
  booking_type: BookingType;

  @Column({ type: 'enum', enum: BookingStatus })
  status: BookingStatus;

  @Column('timestamp')
  scheduled_at: Date;

  @Column('decimal', { precision: 4, scale: 2 })
  estimated_duration_hours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price_subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  platform_fee: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price_total: number;

  @Column('decimal', { precision: 10, scale: 2 })
  cleaner_payout: number;

  @Column('text', { nullable: true })
  special_requests: string;

  @Column('text', { nullable: true })
  cancellation_reason: string;

  @Column('timestamp', { nullable: true })
  host_confirmed_at: Date;

  @Column('timestamp', { nullable: true })
  completed_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToOne(() => Payment, payment => payment.booking)
  payment: Payment;

  @OneToMany(() => BookingPhoto, photo => photo.booking)
  photos: BookingPhoto[];

  @OneToMany(() => Review, review => review.booking)
  reviews: Review[];
}
