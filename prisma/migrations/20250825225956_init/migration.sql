-- CreateEnum
CREATE TYPE "public"."LandStatus" AS ENUM ('FOR_SALE', 'SOLD', 'PENDING', 'OFF_MARKET', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."lands" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "titleType" TEXT NOT NULL,
    "images" TEXT[],
    "specialOffers" TEXT,
    "paymentTerms" TEXT,
    "landmarks" TEXT[],
    "features" TEXT[],
    "status" "public"."LandStatus" NOT NULL DEFAULT 'FOR_SALE',
    "averageRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."land_units" (
    "id" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'sqm',
    "price" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "landId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "landId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."favorites" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userAgent" TEXT,
    "landId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lands_slug_key" ON "public"."lands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_sessionId_landId_key" ON "public"."favorites"("sessionId", "landId");

-- AddForeignKey
ALTER TABLE "public"."land_units" ADD CONSTRAINT "land_units_landId_fkey" FOREIGN KEY ("landId") REFERENCES "public"."lands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_landId_fkey" FOREIGN KEY ("landId") REFERENCES "public"."lands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_landId_fkey" FOREIGN KEY ("landId") REFERENCES "public"."lands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
