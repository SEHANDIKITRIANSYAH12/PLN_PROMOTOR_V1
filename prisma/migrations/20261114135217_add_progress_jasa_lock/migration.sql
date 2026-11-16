-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "progressJasaLocked" BOOLEAN,
ADD COLUMN     "progressLockedAt" TEXT,
ADD COLUMN     "progressLockedBy" TEXT;
