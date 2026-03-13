import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Check } from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';

export enum ReviewerRole {
  HOST = 'host',
  CLEANER = 'cleaner',
}

@Entity('reviews')
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  booking_id: string;

  @ManyToOne(() => Booking, booking => booking.reviews)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column('uuid')
  reviewer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column('uuid')
  reviewee_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewee_id' })
  reviewee: User;

  @Column({ type: 'enum', enum: ReviewerRole })
  reviewer_role: ReviewerRole;

  @Column('int')
  rating: number;

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
