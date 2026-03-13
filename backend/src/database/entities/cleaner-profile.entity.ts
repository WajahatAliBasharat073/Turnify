import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('cleaner_profiles')
export class CleanerProfile {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @OneToOne(() => User, user => user.cleaner_profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  approval_status: ApprovalStatus;

  @Column({ nullable: true })
  approval_note: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: 0 })
  years_experience: number;

  @Column('text', { array: true, default: [] })
  service_areas: string[];

  @Column('decimal', { precision: 4, scale: 2, default: 0 })
  rating_avg: number;

  @Column({ default: 0 })
  total_jobs: number;

  @Column({ name: 'stripe_account_id', nullable: true })
  stripe_account_id: string;

  @Column({ name: 'stripe_onboarding_complete', default: false })
  stripe_onboarding_complete: boolean;

  @Column({ name: 'is_available', default: false })
  is_available: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
