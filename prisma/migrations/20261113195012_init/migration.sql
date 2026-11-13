-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "namaDasar" TEXT,
    "jumlahUnit" INTEGER,
    "dayaPerUnit" TEXT,
    "idpel" TEXT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "coordStr" TEXT,
    "kampung" TEXT,
    "desa" TEXT,
    "kecamatan" TEXT,
    "kabupaten" TEXT,
    "officerName" TEXT,
    "dayaLama" TEXT,
    "tarifLama" TEXT,
    "dayaBaru" TEXT,
    "tarifBaru" TEXT,
    "daya" TEXT,
    "tarif" TEXT,
    "garduInduk" TEXT,
    "penyulang" TEXT,
    "gardu" TEXT,
    "ulp" TEXT,
    "perluasanJTM" TEXT,
    "tipePembangunanGardu" TEXT,
    "tipeGardu" TEXT,
    "kapasitasTrafo" TEXT,
    "jumlahKabelNaik" TEXT,
    "perluasanJTR" TEXT,
    "trafoLama" TEXT,
    "trafoBaru" TEXT,
    "jenisPekerjaanGardu" TEXT,
    "jumlahKubikelLBS" TEXT,
    "paymentStatus" TEXT,
    "nidi" BOOLEAN,
    "slo" BOOLEAN,
    "originalCustomerName" TEXT,
    "isNameChanged" BOOLEAN,
    "isOfflineDraft" BOOLEAN,
    "offlineCreatedAt" TEXT,
    "syncedAt" TEXT,
    "locationPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rabCustomOverrides" JSONB NOT NULL DEFAULT '{}',
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyPole" (
    "surveyId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "std" TEXT NOT NULL,
    "networkType" TEXT,
    "poleStatus" TEXT,
    "poleType" TEXT,
    "tmConstruction" TEXT,
    "trConstruction" TEXT,
    "a3cs" TEXT,
    "lvTwisted" TEXT,
    "conductorLength" DOUBLE PRECISION,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "coordStr" TEXT NOT NULL DEFAULT '',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "note" TEXT NOT NULL DEFAULT '',
    "photo" TEXT,
    "materialOverrides" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "SurveyPole_pkey" PRIMARY KEY ("surveyId","id")
);

-- CreateTable
CREATE TABLE "Daftung" (
    "id" TEXT NOT NULL,
    "idpel" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "woIssued" TEXT NOT NULL,
    "nidi" BOOLEAN NOT NULL DEFAULT false,
    "slo" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "surveyId" TEXT,
    "rejectionReason" TEXT,
    "daya" TEXT,
    "tarif" TEXT,
    "ulp" TEXT,
    "location" TEXT,
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Daftung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "idpel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "supervisor" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "reservationStatus" TEXT NOT NULL DEFAULT 'Belum Reservasi',
    "daya" TEXT,
    "tarif" TEXT,
    "location" TEXT,
    "address" TEXT,
    "garduInduk" TEXT,
    "penyulang" TEXT,
    "gardu" TEXT,
    "ulp" TEXT,
    "tipePembangunanGardu" TEXT,
    "kapasitasTrafo" TEXT,
    "jumlahKabelNaik" TEXT,
    "contractId" TEXT,
    "spkNumber" TEXT,
    "validFrom" TEXT,
    "validTo" TEXT,
    "supervisor1" TEXT,
    "supervisor2" TEXT,
    "noWorkOrder" TEXT,
    "narahubung" TEXT,
    "phone" TEXT,
    "progressMaterial" DOUBLE PRECISION,
    "progressJasa" DOUBLE PRECISION,
    "milestones" JSONB,
    "approvalStatus" TEXT,
    "rejectionReason" TEXT,
    "approvedAt" TEXT,
    "appliedAt" TEXT,
    "daftungId" TEXT,
    "surveyId" TEXT,
    "reservationLink" TEXT,
    "reservationExpiry" TIMESTAMP(3),
    "reservationNumber" TEXT,
    "reservationNumberNonStock" TEXT,
    "reservationDate" TEXT,
    "reservationNotes" TEXT,
    "reservationNotesNonStock" TEXT,
    "giNumber" TEXT,
    "giStatus" TEXT,
    "giCatatan" TEXT,
    "giInputDate" TEXT,
    "giInputBy" TEXT,
    "isHold" BOOLEAN,
    "holdReason" TEXT,
    "materialSubstitutions" JSONB NOT NULL DEFAULT '[]',
    "vendorReceiptConfirmed" BOOLEAN,
    "vendorReceiptDate" TEXT,
    "vendorReceiptNotes" TEXT,
    "vendorRealizationSubmitted" BOOLEAN,
    "vendorRealizationDate" TEXT,
    "vendorRealizationNotes" TEXT,
    "pengawasRealizationVerified" BOOLEAN,
    "pengawasRealizationVerifiedAt" TEXT,
    "pengawasRealizationVerifiedBy" TEXT,
    "pengawasRealizationNotes" TEXT,
    "suratJalanNumber" TEXT,
    "suratJalanNumberNonStock" TEXT,
    "suratJalanPhoto" TEXT,
    "suratJalanPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suratJalanList" JSONB NOT NULL DEFAULT '[]',
    "suratJalanDate" TEXT,
    "receiptPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sjVerificationStatus" TEXT,
    "sjVerifiedAt" TEXT,
    "sjVerifiedBy" TEXT,
    "sjVerificationNotes" TEXT,
    "slipReturNumber" TEXT,
    "slipReturDate" TEXT,
    "slipReturPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "returStatus" TEXT,
    "returApprovedAt" TEXT,
    "returApprovedBy" TEXT,
    "returRejectedAt" TEXT,
    "returRejectedBy" TEXT,
    "returRejectionReason" TEXT,
    "returNotes" TEXT,
    "rabCustomOverrides" JSONB NOT NULL DEFAULT '{}',
    "approverName" TEXT,
    "approverRole" TEXT,
    "approverSignature" TEXT,
    "creatorName" TEXT,
    "creatorRole" TEXT,
    "creatorSignature" TEXT,
    "catatan" TEXT,
    "pendingJasaItems" JSONB NOT NULL DEFAULT '[]',
    "progressStatus" TEXT,
    "progressSubmittedAt" TEXT,
    "progressSubmittedBy" TEXT,
    "progressVerifiedAt" TEXT,
    "progressVerifiedBy" TEXT,
    "progressRejectedReason" TEXT,
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WoMaterial" (
    "woId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "material" TEXT NOT NULL,
    "qtyReksis" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtyAllocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtyReserved" DOUBLE PRECISION,
    "qtyTaken" DOUBLE PRECISION,
    "isTaken" BOOLEAN,
    "takenAt" TEXT,
    "qtyInstalled" DOUBLE PRECISION,
    "qtyReturned" DOUBLE PRECISION,
    "isVerified" BOOLEAN,
    "verificationNote" TEXT,
    "unit" TEXT NOT NULL DEFAULT '',
    "kategori" TEXT,
    "hargaSatuan" DOUBLE PRECISION,
    "kode" TEXT,
    "isReplaced" BOOLEAN,
    "originalMaterialName" TEXT,
    "isHold" BOOLEAN,
    "holdReason" TEXT,
    "vendorNotes" TEXT,
    "stockType" TEXT,

    CONSTRAINT "WoMaterial_pkey" PRIMARY KEY ("woId","idx")
);

-- CreateTable
CREATE TABLE "WoJasa" (
    "woId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "id" TEXT,
    "kode" TEXT,
    "deskripsi" TEXT NOT NULL,
    "subKategori" TEXT,
    "qtyTarget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtyRealisasi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '',
    "hargaSatuan" DOUBLE PRECISION,
    "bobotPersen" DOUBLE PRECISION,
    "progresPersen" DOUBLE PRECISION,
    "catatan" TEXT,

    CONSTRAINT "WoJasa_pkey" PRIMARY KEY ("woId","idx")
);

-- CreateTable
CREATE TABLE "ReservationTransaction" (
    "id" TEXT NOT NULL,
    "woId" TEXT NOT NULL,
    "noWorkOrder" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reservationNumberStock" TEXT,
    "reservationNumberNonStock" TEXT,
    "notes" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPickupTransaction" (
    "id" TEXT NOT NULL,
    "woId" TEXT NOT NULL,
    "noWorkOrder" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "suratJalanNumber" TEXT NOT NULL,
    "reservationNumber" TEXT,
    "giNumber" TEXT,
    "suratJalanPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPickupTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "director" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "npwp" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jenisPekerjaan" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validFrom" TEXT NOT NULL,
    "validTo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bankAccount" TEXT,
    "paketType" TEXT,
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "spkNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "jenisPekerjaan" TEXT NOT NULL,
    "tipePengadaan" TEXT NOT NULL,
    "nilaiKontrak" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPagu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedPagu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sisaPagu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "validFrom" TEXT NOT NULL,
    "validTo" TEXT NOT NULL,
    "nomorAmandemen" TEXT,
    "amandemenWaktu" TEXT,
    "supervisorId" TEXT,
    "supervisorName" TEXT,
    "supervisorRole" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "paketType" TEXT,
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialContract" (
    "id" TEXT NOT NULL,
    "notaDinas" TEXT NOT NULL,
    "tanggalNotaDinas" TEXT,
    "judulPengadaan" TEXT,
    "nilaiRabNodin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nomorSpk" TEXT NOT NULL,
    "namaVendor" TEXT NOT NULL,
    "nilaiSpk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "validFrom" TEXT NOT NULL,
    "validTo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keterangan" TEXT,
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialContractItem" (
    "kontrakId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "kode" TEXT,
    "deskripsi" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hargaSatuan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHarga" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keterangan" TEXT,

    CONSTRAINT "MaterialContractItem_pkey" PRIMARY KEY ("kontrakId","id")
);

-- CreateTable
CREATE TABLE "Supervisor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "nip" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL,
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "qtyFisik" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtySap" DOUBLE PRECISION,
    "qtyMrwi" DOUBLE PRECISION,
    "qtyAlokasi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qtySisa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "MaterialCodeMapping" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "MaterialCodeMapping_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Sweeping" (
    "id" TEXT NOT NULL,
    "nomorSweeping" TEXT NOT NULL,
    "namaPekerjaan" TEXT NOT NULL,
    "noSpk" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "pelaksana" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "catatan" TEXT,
    "ttdVendorName" TEXT,
    "ttdPengawasName" TEXT,
    "ttdGudangName" TEXT,
    "woIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sysCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sweeping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SweepingItem" (
    "sweepingId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "kode" TEXT,
    "material" TEXT NOT NULL,
    "volPengambilan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "satPengambilan" TEXT NOT NULL DEFAULT '',
    "noTug9" TEXT,
    "ketPengambilan" TEXT,
    "volTerpasang" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "satTerpasang" TEXT NOT NULL DEFAULT '',
    "ketTerpasang" TEXT,
    "volDikembalikan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "satDikembalikan" TEXT NOT NULL DEFAULT '',
    "noTug10" TEXT,
    "ketDikembalikan" TEXT,

    CONSTRAINT "SweepingItem_pkey" PRIMARY KEY ("sweepingId","id")
);

-- CreateTable
CREATE TABLE "ConstructionRule" (
    "network" TEXT NOT NULL,
    "tiangLabel" TEXT NOT NULL,
    "konstruksiLabel" TEXT NOT NULL,
    "conductorLabel" TEXT NOT NULL,
    "tiangList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "konstruksiList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sysUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionRule_pkey" PRIMARY KEY ("network")
);

-- CreateTable
CREATE TABLE "KhsPrice" (
    "itemId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "KhsPrice_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "Audit" (
    "seq" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("seq")
);

-- CreateIndex
CREATE INDEX "Survey_status_idx" ON "Survey"("status");

-- CreateIndex
CREATE INDEX "Survey_idpel_idx" ON "Survey"("idpel");

-- CreateIndex
CREATE INDEX "Daftung_surveyId_idx" ON "Daftung"("surveyId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_daftungId_idx" ON "WorkOrder"("daftungId");

-- CreateIndex
CREATE INDEX "WorkOrder_surveyId_idx" ON "WorkOrder"("surveyId");

-- CreateIndex
CREATE INDEX "WorkOrder_contractId_idx" ON "WorkOrder"("contractId");

-- CreateIndex
CREATE INDEX "ReservationTransaction_woId_idx" ON "ReservationTransaction"("woId");

-- CreateIndex
CREATE INDEX "VendorPickupTransaction_woId_idx" ON "VendorPickupTransaction"("woId");

-- CreateIndex
CREATE INDEX "Contract_vendorId_idx" ON "Contract"("vendorId");

-- CreateIndex
CREATE INDEX "Contract_spkNumber_idx" ON "Contract"("spkNumber");

-- CreateIndex
CREATE INDEX "MaterialContract_nomorSpk_idx" ON "MaterialContract"("nomorSpk");

-- CreateIndex
CREATE INDEX "Stock_category_idx" ON "Stock"("category");

-- CreateIndex
CREATE INDEX "Sweeping_noSpk_idx" ON "Sweeping"("noSpk");

-- CreateIndex
CREATE INDEX "Audit_time_idx" ON "Audit"("time");

-- AddForeignKey
ALTER TABLE "SurveyPole" ADD CONSTRAINT "SurveyPole_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WoMaterial" ADD CONSTRAINT "WoMaterial_woId_fkey" FOREIGN KEY ("woId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WoJasa" ADD CONSTRAINT "WoJasa_woId_fkey" FOREIGN KEY ("woId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialContractItem" ADD CONSTRAINT "MaterialContractItem_kontrakId_fkey" FOREIGN KEY ("kontrakId") REFERENCES "MaterialContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SweepingItem" ADD CONSTRAINT "SweepingItem_sweepingId_fkey" FOREIGN KEY ("sweepingId") REFERENCES "Sweeping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
