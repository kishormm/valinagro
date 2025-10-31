-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "paymentProofUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isMember" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Commission" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "payoutNotes" TEXT,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Commission_userId_idx" ON "public"."Commission"("userId");

-- CreateIndex
CREATE INDEX "Commission_transactionId_idx" ON "public"."Commission"("transactionId");

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
