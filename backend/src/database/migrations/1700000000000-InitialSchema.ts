import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
    name = 'InitialSchema1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enums
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('host', 'cleaner', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."approval_status_enum" AS ENUM('pending', 'approved', 'rejected', 'suspended')`);
        await queryRunner.query(`CREATE TYPE "public"."property_type_enum" AS ENUM('apartment', 'house', 'condo', 'studio', 'villa', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."booking_type_enum" AS ENUM('instant', 'scheduled')`);
        await queryRunner.query(`CREATE TYPE "public"."booking_status_enum" AS ENUM('pending_payment', 'searching', 'assigned', 'in_progress', 'completed', 'cancelled', 'disputed')`);
        await queryRunner.query(`CREATE TYPE "public"."photo_type_enum" AS ENUM('before', 'after')`);
        await queryRunner.query(`CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded')`);
        await queryRunner.query(`CREATE TYPE "public"."reviewer_role_enum" AS ENUM('host', 'cleaner')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('booking_confirmed', 'job_available', 'job_accepted', 'job_declined', 'job_started', 'job_completed', 'payment_received', 'payout_sent', 'approval_approved', 'approval_rejected', 'system')`);

        // Extension for UUIDs
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Users
        await queryRunner.query(`CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "email" character varying NOT NULL,
            "password_hash" character varying NOT NULL,
            "role" "public"."user_role_enum" NOT NULL,
            "first_name" character varying NOT NULL,
            "last_name" character varying NOT NULL,
            "phone" character varying,
            "avatar_url" character varying,
            "stripe_customer_id" character varying,
            "is_active" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "uq_users_email" UNIQUE ("email"),
            CONSTRAINT "pk_users" PRIMARY KEY ("id")
        )`);

        // Cleaner Profiles
        await queryRunner.query(`CREATE TABLE "cleaner_profiles" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "approval_status" "public"."approval_status_enum" NOT NULL DEFAULT 'pending',
            "approval_note" character varying,
            "bio" text,
            "years_experience" integer NOT NULL DEFAULT 0,
            "service_areas" text array NOT NULL DEFAULT '{}',
            "rating_avg" numeric(4,2) NOT NULL DEFAULT 0,
            "total_jobs" integer NOT NULL DEFAULT 0,
            "stripe_account_id" character varying,
            "stripe_onboarding_complete" boolean NOT NULL DEFAULT false,
            "is_available" boolean NOT NULL DEFAULT false,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "uq_cleaner_profiles_user_id" UNIQUE ("user_id"),
            CONSTRAINT "pk_cleaner_profiles" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "cleaner_profiles" ADD CONSTRAINT "fk_cleaner_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Properties
        await queryRunner.query(`CREATE TABLE "properties" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "host_id" uuid NOT NULL,
            "name" character varying NOT NULL,
            "address_line1" character varying NOT NULL,
            "address_line2" character varying,
            "city" character varying NOT NULL,
            "state" character varying NOT NULL,
            "zip_code" character varying NOT NULL,
            "country" character varying NOT NULL DEFAULT 'US',
            "property_type" "public"."property_type_enum" NOT NULL,
            "size_sqft" integer NOT NULL,
            "num_bedrooms" integer NOT NULL,
            "num_bathrooms" numeric(2,1) NOT NULL,
            "special_instructions" text,
            "access_instructions" text,
            "latitude" numeric(10,7),
            "longitude" numeric(10,7),
            "is_active" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "pk_properties" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "fk_properties_host_id" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_properties_host_id" ON "properties" ("host_id")`);

        // Bookings
        await queryRunner.query(`CREATE TABLE "bookings" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "property_id" uuid NOT NULL,
            "host_id" uuid NOT NULL,
            "cleaner_id" uuid,
            "booking_type" "public"."booking_type_enum" NOT NULL,
            "status" "public"."booking_status_enum" NOT NULL,
            "scheduled_at" TIMESTAMP NOT NULL,
            "estimated_duration_hours" numeric(4,2) NOT NULL,
            "price_subtotal" numeric(10,2) NOT NULL,
            "platform_fee" numeric(10,2) NOT NULL,
            "price_total" numeric(10,2) NOT NULL,
            "cleaner_payout" numeric(10,2) NOT NULL,
            "special_requests" text,
            "cancellation_reason" text,
            "host_confirmed_at" TIMESTAMP,
            "completed_at" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "pk_bookings" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "fk_bookings_property_id" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "fk_bookings_host_id" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "fk_bookings_cleaner_id" FOREIGN KEY ("cleaner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_bookings_host_id" ON "bookings" ("host_id")`);
        await queryRunner.query(`CREATE INDEX "idx_bookings_cleaner_id" ON "bookings" ("cleaner_id")`);
        await queryRunner.query(`CREATE INDEX "idx_bookings_status" ON "bookings" ("status")`);
        await queryRunner.query(`CREATE INDEX "idx_bookings_scheduled_at" ON "bookings" ("scheduled_at")`);

        // Booking Photos
        await queryRunner.query(`CREATE TABLE "booking_photos" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "booking_id" uuid NOT NULL,
            "uploaded_by_id" uuid NOT NULL,
            "photo_type" "public"."photo_type_enum" NOT NULL,
            "s3_key" character varying NOT NULL,
            "s3_url" character varying NOT NULL,
            "cloudfront_url" character varying,
            "file_size_bytes" integer NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "pk_booking_photos" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "booking_photos" ADD CONSTRAINT "fk_booking_photos_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_photos" ADD CONSTRAINT "fk_booking_photos_uploaded_by_id" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Payments
        await queryRunner.query(`CREATE TABLE "payments" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "booking_id" uuid NOT NULL,
            "stripe_payment_intent_id" character varying NOT NULL,
            "stripe_charge_id" character varying,
            "stripe_transfer_id" character varying,
            "amount_cents" integer NOT NULL,
            "currency" character varying NOT NULL DEFAULT 'usd',
            "status" "public"."payment_status_enum" NOT NULL,
            "refund_amount_cents" integer NOT NULL DEFAULT 0,
            "stripe_refund_id" character varying,
            "metadata" jsonb,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "uq_payments_booking_id" UNIQUE ("booking_id"),
            CONSTRAINT "uq_payments_stripe_payment_intent_id" UNIQUE ("stripe_payment_intent_id"),
            CONSTRAINT "pk_payments" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_payments_stripe_payment_intent_id" ON "payments" ("stripe_payment_intent_id")`);

        // Reviews
        await queryRunner.query(`CREATE TABLE "reviews" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "booking_id" uuid NOT NULL,
            "reviewer_id" uuid NOT NULL,
            "reviewee_id" uuid NOT NULL,
            "reviewer_role" "public"."reviewer_role_enum" NOT NULL,
            "rating" integer NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
            "comment" text,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "pk_reviews" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_reviewer_id" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_reviewee_id" FOREIGN KEY ("reviewee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Notifications
        await queryRunner.query(`CREATE TABLE "notifications" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "booking_id" uuid,
            "type" "public"."notification_type_enum" NOT NULL,
            "title" character varying NOT NULL,
            "body" character varying NOT NULL,
            "data" jsonb,
            "is_read" boolean NOT NULL DEFAULT false,
            "read_at" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "pk_notifications" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_is_read" ON "notifications" ("is_read")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "booking_photos"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TABLE "properties"`);
        await queryRunner.query(`DROP TABLE "cleaner_profiles"`);
        await queryRunner.query(`DROP TABLE "users"`);

        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reviewer_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."photo_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."booking_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."booking_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."property_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."approval_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }
}
