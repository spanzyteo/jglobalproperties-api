-- AlterTable
ALTER TABLE "public"."images" ALTER COLUMN "landId" DROP NOT NULL,
ALTER COLUMN "houseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."reviews" ALTER COLUMN "landId" DROP NOT NULL,
ALTER COLUMN "houseId" DROP NOT NULL;
