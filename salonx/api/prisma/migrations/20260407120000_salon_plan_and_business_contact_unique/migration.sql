-- CreateEnum
CREATE TYPE "SalonPlan" AS ENUM ('FREE', 'PRO');

-- AlterTable
ALTER TABLE "Salon" ADD COLUMN "plan" "SalonPlan" NOT NULL DEFAULT 'FREE';

-- Normalize existing emails so uniqueness matches app logic
UPDATE "SalonBusinessProfile" SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;

-- Globally unique business email / phone across salons (partial: non-empty only)
CREATE UNIQUE INDEX "SalonBusinessProfile_email_unique_partial" ON "SalonBusinessProfile" (LOWER(TRIM(email)))
WHERE email IS NOT NULL AND TRIM(email) <> '';

CREATE UNIQUE INDEX "SalonBusinessProfile_phone_unique_partial" ON "SalonBusinessProfile" (phone)
WHERE phone IS NOT NULL AND TRIM(phone) <> '';
