import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  booking_id: string;

  @OneToOne(() => Booking, booking => booking.payment)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ unique: true })
  stripe_payment_intent_id: string;

  @Column({ nullable: true })
  stripe_charge_id: string;

  @Column({ nullable: true })
  stripe_transfer_id: string;

  @Column('int')
  amount_cents: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Column('int', { default: 0 })
  refund_amount_cents: number;

  @Column({ nullable: true })
  stripe_refund_id: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
