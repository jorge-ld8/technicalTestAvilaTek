/*
  Warnings:

  - You are about to drop the column `stock_availability` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "stock_availability",
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;
