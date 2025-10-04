/*
  Warnings:

  - You are about to drop the column `stock` on the `UserInventory` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `UserInventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserInventory" DROP COLUMN "stock",
ADD COLUMN     "quantity" INTEGER NOT NULL;
