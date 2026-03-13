import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Booking } from './booking.entity';

export enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  JOB_AVAILABLE = 'job_available',
  JOB_ACCEPTED = 'job_accepted',
  JOB_DECLINED = 'job_declined',
  JOB_STARTED = 'job_started',
  JOB_COMPLETED = 'job_completed',
  PAYMENT_RECEIVED = 'payment_received',
  PAYOUT_SENT = 'payout_sent',
  APPROVAL_APPROVED = 'approval_approved',
  APPROVAL_REJECTED = 'approval_rejected',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { nullable: true })
  booking_id: string;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column('jsonb', { nullable: true })
  data: Record<string, any>;

  @Column({ default: false })
  is_read: boolean;

  @Column('timestamp', { nullable: true })
  read_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
