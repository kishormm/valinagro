-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "aadhar" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "crops" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "email" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "pincode" TEXT;
