import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { CleanerProfile } from './cleaner-profile.entity';
import { Property } from './property.entity';
import { Booking } from './booking.entity';

export enum UserRole {
  HOST = 'host',
  CLEANER = 'cleaner',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'first_name' })
  first_name: string;

  @Column({ name: 'last_name' })
  last_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatar_url: string;

  @Column({ name: 'stripe_customer_id', nullable: true })
  stripe_customer_id: string;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToOne(() => CleanerProfile, profile => profile.user)
  cleaner_profile: CleanerProfile;

  @OneToMany(() => Property, property => property.host)
  properties: Property[];

  @OneToMany(() => Booking, booking => booking.host)
  host_bookings: Booking[];

  @OneToMany(() => Booking, booking => booking.cleaner)
  cleaner_bookings: Booking[];
}
