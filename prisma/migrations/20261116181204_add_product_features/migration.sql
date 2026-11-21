-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "customFields" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "display" TEXT,
ADD COLUMN     "filterValues" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "processor" TEXT,
ADD COLUMN     "rearCameras" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
