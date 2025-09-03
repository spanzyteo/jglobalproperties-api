/*
  Warnings:

  - You are about to drop the column `reviewableType` on the `reviews` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."reviews" DROP COLUMN "reviewableType";

-- DropEnum
DROP TYPE "public"."ReviewableType";
