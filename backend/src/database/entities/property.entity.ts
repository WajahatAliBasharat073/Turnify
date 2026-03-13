import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Booking } from './booking.entity';

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  CONDO = 'condo',
  STUDIO = 'studio',
  VILLA = 'villa',
  OTHER = 'other',
}

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  host_id: string;

  @ManyToOne(() => User, user => user.properties)
  @JoinColumn({ name: 'host_id' })
  host: User;

  @Column()
  name: string;

  @Column()
  address_line1: string;

  @Column({ nullable: true })
  address_line2: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  zip_code: string;

  @Column({ default: 'US' })
  country: string;

  @Column({ type: 'enum', enum: PropertyType })
  property_type: PropertyType;

  @Column({ type: 'int' })
  size_sqft: number;

  @Column({ type: 'int' })
  num_bedrooms: number;

  @Column('decimal', { precision: 2, scale: 1 })
  num_bathrooms: number;

  @Column('text', { nullable: true })
  special_instructions: string;

  @Column('text', { nullable: true })
  access_instructions: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Booking, booking => booking.property)
  bookings: Booking[];
}
