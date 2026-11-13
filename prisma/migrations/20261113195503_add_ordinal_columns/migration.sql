-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Daftung" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MaterialContract" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MaterialContractItem" ADD COLUMN     "idx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ReservationTransaction" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Supervisor" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SurveyPole" ADD COLUMN     "idx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Sweeping" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SweepingItem" ADD COLUMN     "idx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "VendorPickupTransaction" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "sysIdx" INTEGER NOT NULL DEFAULT 0;
