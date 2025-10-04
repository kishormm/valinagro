-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "uplineId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_uplineId_fkey" FOREIGN KEY ("uplineId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
