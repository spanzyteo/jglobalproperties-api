/*
  Warnings:

  - You are about to drop the column `images` on the `lands` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."lands" DROP COLUMN "images";

-- CreateTable
CREATE TABLE "public"."land_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "landId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."land_images" ADD CONSTRAINT "land_images_landId_fkey" FOREIGN KEY ("landId") REFERENCES "public"."lands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
