/*
  Warnings:

  - You are about to drop the column `averageRating` on the `lands` table. All the data in the column will be lost.
  - You are about to drop the column `features` on the `lands` table. All the data in the column will be lost.
  - You are about to drop the column `landmarks` on the `lands` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTerms` on the `lands` table. All the data in the column will be lost.
  - You are about to drop the column `specialOffers` on the `lands` table. All the data in the column will be lost.
  - You are about to drop the column `titleType` on the `lands` table. All the data in the column will be lost.
  - You are about to drop the `land_images` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `houseId` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewableType` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."HouseCategory" AS ENUM ('FINISHED_HOMES', 'OFF_PLAN_HOMES');

-- CreateEnum
CREATE TYPE "public"."ReviewableType" AS ENUM ('LAND', 'HOUSE');

-- CreateEnum
CREATE TYPE "public"."ImageableType" AS ENUM ('LAND', 'HOUSE');

-- DropForeignKey
ALTER TABLE "public"."land_images" DROP CONSTRAINT "land_images_landId_fkey";

-- AlterTable
ALTER TABLE "public"."lands" DROP COLUMN "averageRating",
DROP COLUMN "features",
DROP COLUMN "landmarks",
DROP COLUMN "paymentTerms",
DROP COLUMN "specialOffers",
DROP COLUMN "titleType";

-- AlterTable
ALTER TABLE "public"."reviews" ADD COLUMN     "houseId" TEXT NOT NULL,
ADD COLUMN     "reviewableType" "public"."ReviewableType" NOT NULL;

-- DropTable
DROP TABLE "public"."land_images";

-- CreateTable
CREATE TABLE "public"."houses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "price" TEXT NOT NULL,
    "category" "public"."HouseCategory" NOT NULL DEFAULT 'FINISHED_HOMES',
    "averageRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."house_units" (
    "id" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'sqm',
    "price" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "houseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "house_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "imageableType" "public"."ImageableType" NOT NULL,
    "landId" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "houses_slug_key" ON "public"."houses"("slug");

-- AddForeignKey
ALTER TABLE "public"."house_units" ADD CONSTRAINT "house_units_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "public"."houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "public"."houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."images" ADD CONSTRAINT "images_landId_fkey" FOREIGN KEY ("landId") REFERENCES "public"."lands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."images" ADD CONSTRAINT "images_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "public"."houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
