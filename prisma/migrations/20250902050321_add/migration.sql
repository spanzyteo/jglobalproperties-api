/*
  Warnings:

  - You are about to drop the column `imageableType` on the `images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."images" DROP COLUMN "imageableType";

-- DropEnum
DROP TYPE "public"."ImageableType";
