-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "lastUpdatedAt" TEXT;

-- AlterTable
ALTER TABLE "VendorPickupTransaction" ADD COLUMN     "status" TEXT,
ADD COLUMN     "verificationNotes" TEXT,
ADD COLUMN     "verifiedAt" TEXT,
ADD COLUMN     "verifiedBy" TEXT;

-- AlterTable
ALTER TABLE "WoJasa" ADD COLUMN     "evidenceCaption" TEXT,
ADD COLUMN     "evidencePhoto" TEXT,
ADD COLUMN     "kendala" TEXT;

-- AlterTable
ALTER TABLE "WoMaterial" ADD COLUMN     "qtyReservedNonSap" DOUBLE PRECISION,
ADD COLUMN     "qtyReservedSap" DOUBLE PRECISION;
