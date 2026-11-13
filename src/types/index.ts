export type Role = 'Admin Daftung' | 'Admin WO' | 'Pengawas' | 'Admin Gudang';

export interface PoleData {
  id: string; // T1, T2
  name: string;
  std: string;
  networkType?: 'JTM' | 'JTR' | 'SUTM' | 'SUTR'; // Default JTM (Jaringan Tegangan Menengah) atau JTR (Jaringan Tegangan Rendah)
  poleStatus?: 'RENCANA' | 'EXISTING'; // 'RENCANA' (Baru / Dibangun) atau 'EXISTING' (Tiang Sudah Ada / Hitam)
  poleType?: string; // Tiang beton (9m/11m/12m/13m/14m), dll
  tmConstruction?: string; // 1B, 2B, 3B ... Gardu Cantol, Gardu Portal, dll
  a3cs?: string; // 1x150, 1x240, 3x150, 3x240, meteran/span
  trConstruction?: string; // 1B, 2B, 3B, 4B, 10B AWAL, 10B AKHIR, STAY SET TR, dll
  lvTwisted?: string; // JTR 70, JTR 35, JTR 50, JTR 25, 2x16 mm², dll
  conductorLength?: number; // Panjang span bentangan (meter)
  materialOverrides?: Record<string, number | null>; // Override manual material per titik
  qty: number;
  coordStr: string;
  lat: number | null;
  lng: number | null;
  note: string;
  photo?: string;
}

export interface SurveyRecord {
  id: string;
  customerName: string;
  originalCustomerName?: string; // Nama pelanggan awal hasil survey jika terjadi balik nama/ganti nama
  isNameChanged?: boolean; // Penanda apakah ada pergantian nama pelanggan di AP2T
  namaDasar?: string; // Nama pelanggan / proyek / perumahan
  jumlahUnit?: number; // Jumlah unit
  dayaPerUnit?: string; // Daya per unit (VA)
  idpel?: string;
  jobType: string;
  location: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  coordStr?: string;
  // Alamat terstruktur
  kampung?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  officerName?: string;
  // Daya & Tarif (Lama vs Baru)
  dayaLama?: string;
  tarifLama?: string;
  dayaBaru?: string;
  tarifBaru?: string;
  // Data Teknis (Sesuai Isian Excel Baris 21-38)
  garduInduk?: string; // Baris 21: Gardu Induk
  penyulang?: string; // Baris 22: Penyulang
  gardu?: string; // Baris 23: Gardu
  ulp?: string; // Baris 24: ULP
  perluasanJTM?: string; // Baris 26: Perluasan JTM
  tipePembangunanGardu?: string; // Baris 27: Tipe Pembangunan Gardu
  tipeGardu?: string; // Alias
  kapasitasTrafo?: string; // Baris 28: Kapasitas Trafo
  jumlahKabelNaik?: string; // Baris 29: Jumlah Kabel Naik
  perluasanJTR?: string; // Baris 30: Perluasan JTR
  trafoLama?: string; // Baris 33: Mutasi Trafo Lama
  trafoBaru?: string; // Baris 34: Mutasi Trafo Baru
  jenisPekerjaanGardu?: string; // Baris 37: Gardu Beton Jenis Pekerjaan
  jumlahKubikelLBS?: string; // Baris 38: Jumlah Kubikel LBS
  daya?: string;
  tarif?: string;
  paymentStatus?: 'Sudah Bayar' | 'Belum Bayar';
  nidi?: boolean;
  slo?: boolean;
  status: 'Menunggu verifikasi Daftung' | 'Masuk Antrean AP2T' | 'Terverifikasi' | 'Draf' | 'Siap Apply WO';
  isOfflineDraft?: boolean; // Indikator survey disimpan saat blankspot / offline
  offlineCreatedAt?: string; // Waktu pembuatan draf di HP saat offline
  syncedAt?: string; // Waktu berhasil disinkronkan ke server
  poles: PoleData[];
  locationPhotos?: string[]; // Foto dokumentasi lokasi / survey lapangan umum
  createdAt: string;
  rabCustomOverrides?: Record<string, {
    volumeOverrides?: Record<string, number>; // itemId -> volume
    extraItems?: any[];
  }>;
}

export interface DaftungRecord {
  id: string;
  idpel: string;
  customerName: string;
  source: string;
  woIssued: string;
  nidi: boolean;
  slo: boolean;
  status: 'Siap Apply' | 'Menunggu Approval' | 'Perlu Revisi' | 'WO Terbit' | 'Selesai';
  surveyId?: string;
  rejectionReason?: string;
  daya?: string;
  tarif?: string;
  ulp?: string;
  location?: string;
}

export interface WoMaterialItem {
  material: string;
  qtyReksis: number;
  qtyAllocated: number;
  qtyReserved?: number;
  qtyTaken?: number; // Jumlah yang diambil dari gudang
  isTaken?: boolean; // Status centang pengambilan di gudang
  takenAt?: string; // Waktu pengambilan
  qtyInstalled?: number; // Jumlah fisik terpasang di lapangan (input vendor & pengawas)
  qtyReturned?: number; // Jumlah sisa yang dikembalikan / retur ke gudang
  isVerified?: boolean; // Status verifikasi pengawas
  verificationNote?: string; // Catatan verifikasi material
  unit: string;
  kategori?: string;
  hargaSatuan?: number;
  kode?: string;
  // Tambahan substitusi & hold
  isReplaced?: boolean;
  originalMaterialName?: string;
  isHold?: boolean;
  holdReason?: string;
  vendorNotes?: string;
  stockType?: 'STOK' | 'NON_STOK'; // STOK = Ada di gudang, NON_STOK = Tidak ada di gudang
}

export interface WoJasaItem {
  id?: string;
  kode?: string;
  deskripsi: string;
  subKategori?: string;
  qtyTarget: number; // Volume target dari RAB (misal: 2.5 kms, 10 btg, 1 set)
  qtyRealisasi: number; // Volume aktual yang telah dikerjakan di lapangan
  unit: string;
  hargaSatuan?: number;
  bobotPersen?: number; // Bobot persentase item ini terhadap total paket jasa
  progresPersen?: number; // (qtyRealisasi / qtyTarget) * 100%
  catatan?: string;
}

export interface ApplyWoPackageInput {
  enabled: boolean;
  vendor: string;
  contractId?: string;
  noSpk?: string;
  validFrom?: string;
  validTo?: string;
  noWorkOrder: string;
  pengawas2?: string;
  pengawas1: string;
  narahubung?: string; // Khusus WO Tiang: PIC vendor
  phone?: string; // Khusus WO Tiang: No telepon/WA vendor
  materials?: WoMaterialItem[];
  jasaItems?: WoJasaItem[];
}

export interface ApplyWoSignatures {
  approverName: string; // Default: WEGIG DIDIK KURNIAWAN
  approverRole: string; // Default: ASMAN KONSTRUKSI
  approverSignature?: string; // Digital signature image data URL or SVG
  creatorName: string; // Default: HASIAN EFRAVODITUS SITORUS
  creatorRole: string; // Default: TC LOLA KONS
  creatorSignature?: string; // Digital signature image data URL or SVG
  catatan?: string;
}

export interface ApplyWoInputParams {
  daftungId: string;
  idpel: string;
  customerName: string;
  paket1?: ApplyWoPackageInput;
  paket2?: ApplyWoPackageInput;
  woTiang?: ApplyWoPackageInput;
  signatures?: ApplyWoSignatures;
  customerData?: {
    customerName?: string;
    idpel?: string;
    daya?: string;
    tarif?: string;
    alamat?: string;
  };
  technicalData?: {
    garduInduk?: string;
    penyulang?: string;
    gardu?: string;
    ulp?: string;
    tipePembangunanGardu?: string;
    kapasitasTrafo?: string;
    jumlahKabelNaik?: string;
  };
}

export interface VendorRecord {
  id: string;
  name: string; // Data perusahaan: Nama PT / CV
  director: string; // Data perusahaan: Direktur / PIC
  address: string; // Data perusahaan: Alamat
  npwp?: string; // Data perusahaan: NPWP
  phone: string; // Kontak: No Telepon / WA
  email: string; // Kontak: Email
  jenisPekerjaan: ('Tiang' | 'Paket 1' | 'Paket 2')[]; // Jenis pekerjaan (Tiang / Paket 1 / Paket 2)
  validFrom: string; // Masa berlaku
  validTo: string; // Masa berlaku
  status: 'AKTIF' | 'NONAKTIF';
  bankAccount?: string;
  paketType?: 'PAKET_1' | 'PAKET_2' | 'BOTH'; // backward compatibility
}

export interface SupervisorRecord {
  id: string; // ID Pengawas (contoh: PENG-001)
  name: string; // Nama Pengawas
  role: string; // Jabatan (contoh: TC Lola Konstruksi, TL Teknik ULP Rangkasbitung)
  category: 'Pengawas 1' | 'Pengawas 2' | 'Semua'; // Kategori pengawas
  unit: string; // Unit kerja / ULP (contoh: UP3 Banten Selatan, ULP Rangkasbitung)
  nip?: string;
  phone?: string;
  status: 'AKTIF' | 'NONAKTIF';
}

export interface ContractRecord {
  id: string;
  spkNumber: string; // Nomor SPK / Kontrak
  title: string; // Judul Kontrak
  vendorId: string;
  vendorName: string;
  jenisPekerjaan: 'Tiang' | 'Paket 1' | 'Paket 2'; // Kontrak jasa per jenis pekerjaan (Tiang / Paket 1 / Paket 2)
  tipePengadaan: 'JASA' | 'MATERIAL' | 'JASA & MATERIAL'; // Kontrak material / Kontrak jasa
  nilaiKontrak: number; // Nilai kontrak (Rp)
  totalPagu: number; // alias untuk nilaiKontrak
  usedPagu: number; // Realisasi terpakai (Rp)
  sisaPagu: number; // Sisa pagu (Rp)
  validFrom: string; // Masa berlaku
  validTo: string; // Masa berlaku
  nomorAmandemen?: string; // Entry-an Nomor Amandemen (Addendum)
  amandemenWaktu?: string; // Inputan Amandemen Waktu (Batas akhir baru perpanjangan kontrak)
  supervisorId?: string; // Tautan ke SupervisorRecord.id (Master Pengawas)
  supervisorName?: string; // Nama Pengawas Lapangan
  supervisorRole?: string; // Jabatan Pengawas Lapangan
  status: 'AKTIF' | 'HABIS' | 'KEDALUWARSA';
  createdAt: string;
  paketType?: 'PAKET_1' | 'PAKET_2'; // backward compatibility
}

export interface WoMilestones {
  material: number;    // 1. Pengambilan Material (0 - 100%) - Bobot 15%
  konstruksi: number;  // 2. Pemasangan Konstruksi TM / TR (0 - 100%) - Bobot 25%
  konduktor: number;   // 3. Pemasangan / Penarikan Konduktor (0 - 100%) - Bobot 25%
  gardu: number;       // 4. Pembangunan Gardu (0 - 100%) - Bobot 20%
  komisioning: number; // 5. Komisioning (0 - 100%) - Bobot 10%
  energize: number;    // 6. Energize (0 - 100%) - Bobot 5%
}

export interface WorkOrderRecord {
  id: string; // No Work Order (misal: 537.10.WO.2026)
  customerName: string;
  idpel: string;
  daya?: string;
  tarif?: string;
  location?: string;
  address?: string;
  garduInduk?: string;
  penyulang?: string;
  gardu?: string;
  ulp?: string;
  tipePembangunanGardu?: string;
  kapasitasTrafo?: string;
  jumlahKabelNaik?: string;
  category: 'WO Tiang' | 'WO Paket 1' | 'WO Paket 2';
  vendor: string;
  contractId?: string;
  spkNumber?: string;
  validFrom?: string;
  validTo?: string;
  supervisor: string;
  supervisor1?: string; // Pengawas 1 (TC Lola Konstruksi / Officer Kinerja)
  supervisor2?: string; // Pengawas 2 (TL Teknik ULP)
  noWorkOrder?: string;
  narahubung?: string; // Khusus WO Tiang: PIC vendor
  phone?: string; // Khusus WO Tiang: No telepon/WA vendor
  progress: number; // Progres keseluruhan / rata-rata
  progressMaterial?: number; // Progres pengadaan & kesiapan material (%)
  progressJasa?: number; // Progres pelaksanaan pekerjaan / jasa fisik (%)
  milestones?: WoMilestones; // 6 Tahap Progres Fisik Standar PLN
  status: 'Menunggu Persetujuan Asman' | 'Dikembalikan' | 'Konstruksi' | 'Verifikasi SJ' | 'Selesai' | 'Draf';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  approvedAt?: string;
  appliedAt?: string;
  daftungId?: string;
  reservationStatus: 'Belum Reservasi' | 'Hold' | 'Reservasi Sebagian' | 'Siap Ambil' | 'Siap Ambil Sebagian' | 'Selesai' | 'Suplai Pabrikan';
  reservationLink?: string;
  reservationNumber?: string; // No Reservasi Material Stok (Gudang UP3)
  reservationNumberNonStock?: string; // No Reservasi Material Non-Stok (Pabrikan Rekanan UID)
  reservationDate?: string;
  reservationNotes?: string;
  reservationNotesNonStock?: string;
  giNumber?: string;
  giStatus?: 'Sistem' | 'Non-Sistem';
  giCatatan?: string;
  giInputDate?: string;
  giInputBy?: string;
  isHold?: boolean;
  holdReason?: string;
  materialSubstitutions?: {
    originalMaterial: string;
    replacementMaterial: string;
    qty: number;
    reason?: string;
    timestamp?: string;
  }[];
  vendorReceiptConfirmed?: boolean;
  vendorReceiptDate?: string;
  vendorReceiptNotes?: string;
  vendorRealizationSubmitted?: boolean;
  vendorRealizationDate?: string;
  vendorRealizationNotes?: string;
  pengawasRealizationVerified?: boolean;
  pengawasRealizationVerifiedAt?: string;
  pengawasRealizationVerifiedBy?: string;
  pengawasRealizationNotes?: string;
  suratJalanNumber?: string; // No Surat Jalan Stok (Gudang UP3)
  suratJalanNumberNonStock?: string; // No Surat Jalan Non-Stok (Pabrikan UID)
  suratJalanPhoto?: string;
  suratJalanPhotos?: string[];
  suratJalanList?: {
    suratJalanNumber: string;
    suratJalanDate: string;
    giNumber?: string;
    photos?: string[];
    notes?: string;
    items?: { material: string; qtyTaken: number }[];
  }[];
  receiptPhotos?: string[];
  suratJalanDate?: string;
  sjVerificationStatus?: 'BELUM_DIPERIKSA' | 'SESUAI' | 'ADA_SELISIH' | 'RETUR_GUDANG';
  sjVerifiedAt?: string;
  sjVerifiedBy?: string;
  sjVerificationNotes?: string;
  // Retur Material Rekanan (TUG-10)
  slipReturNumber?: string;
  slipReturDate?: string;
  slipReturPhotos?: string[];
  returStatus?: 'Draft' | 'MENUNGGU_VERIFIKASI_GUDANG' | 'RETUR_DISETUJUI' | 'RETUR_DITOLAK';
  returApprovedAt?: string;
  returApprovedBy?: string;
  returRejectedAt?: string;
  returRejectedBy?: string;
  returRejectionReason?: string;
  returNotes?: string;
  materials: WoMaterialItem[];
  jasaItems?: WoJasaItem[];
  rabCustomOverrides?: Record<string, {
    volumeOverrides?: Record<string, number>;
    extraItems?: any[];
  }>;
  // Data Penandatangan Dokumen
  approverName?: string;
  approverRole?: string;
  approverSignature?: string;
  creatorName?: string;
  creatorRole?: string;
  creatorSignature?: string;
  catatan?: string;
  surveyId?: string;
  // === Vendor Progress Submission ===
  pendingJasaItems?: WoJasaItem[];          // Draft progress dari vendor (belum disetujui pengawas)
  progressStatus?: 'IDLE' | 'MENUNGGU_VERIFIKASI_PROGRESS' | 'DISETUJUI' | 'DITOLAK';
  progressSubmittedAt?: string;             // Kapan vendor submit
  progressSubmittedBy?: string;             // Nama/label vendor yang submit
  progressVerifiedAt?: string;              // Kapan pengawas approve/tolak
  progressVerifiedBy?: string;              // Nama pengawas yang verifikasi
  progressRejectedReason?: string;          // Alasan penolakan (jika DITOLAK)
}

export interface MutasiMaterialRecord {
  id: string;             // woId sebagai ID
  woId: string;
  woNumber: string;
  spkNumber?: string;
  customerName: string;
  vendor: string;
  materials: Array<{
    kode: string;
    material: string;
    satuan: string;
    qtyReserved: number;
    qtyTaken: number;
  }>;
  reservationNumber?: string;
  reservationDate?: string;
  suratJalanNumber?: string;
  suratJalanDate?: string;
  giNumber?: string;
  giStatus: 'Sistem' | 'Non-Sistem';
  giInputDate?: string;
  giInputBy?: string;
  tglKeluar?: string;
  catatan?: string;
}

export interface StockMaterial {
  code: string;
  name: string;
  category: string;
  qtyFisik: number; // Stok Fisik aktual di gudang PLN (Dipakai untuk Reservasi WO)
  qtySap?: number; // Stok saldo sistem ERP SAP PLN
  qtyMrwi?: number; // Stok MRWI (Material Return Warehouse Inventory / Bekas Layak Pakai)
  qtyAlokasi: number;
  qtySisa: number; // Sisa bebas fisik = qtyFisik - qtyAlokasi
  unit: string;
  status: 'Aman' | 'Kritis' | 'Menipis';
}

export interface AuditRecord {
  time: string;
  user: string;
  activity: string;
  object: string;
  source: string;
}

// Histori Transaksi Reservasi Pengawas
export interface ReservationTransaction {
  id: string; // misal: TRX-RES-2026-0001
  woId: string;
  noWorkOrder: string;
  date: string;
  supervisorName: string;
  vendorName: string;
  customerName: string;
  category: string; // Paket 1 / Paket 2 / Tiang
  reservationNumberStock?: string;
  reservationNumberNonStock?: string;
  notes?: string;
  items: {
    material: string;
    kode?: string;
    unit: string;
    categoryType: 'STOK' | 'NON_STOK';
    qtyMaterial: number; // Kebutuhan WO
    qtyReservedCurrent: number; // Qty diajukan transaksi ini
    qtySudahReservasi: number; // Akumulasi
    qtyBelumReservasi: number; // Sisa
  }[];
}

// Histori Transaksi Pengambilan Bertahap Vendor
export interface VendorPickupTransaction {
  id: string; // misal: TRX-PKP-2026-0001
  woId: string;
  noWorkOrder: string;
  date: string;
  vendorName: string;
  supervisorName: string;
  customerName: string;
  suratJalanNumber: string;
  reservationNumber?: string;
  giNumber?: string;
  suratJalanPhotos?: string[];
  notes?: string;
  items: {
    material: string;
    kode?: string;
    unit: string;
    categoryType: 'STOK' | 'NON_STOK';
    qtyReserved: number;
    qtyTakenCurrent: number; // Diambil pada transaksi ini
    totalTakenAccumulated: number; // Akumulasi setelah transaksi ini
    sisaRemaining: number; // Sisa belum diambil
  }[];
}

// ==========================================
// KONTRAK MATERIAL (MASTER MATERIAL)
// ==========================================
export interface MaterialContractItem {
  id: string;
  kode?: string;
  deskripsi: string;
  satuan: string;
  volume: number;
  hargaSatuan: number;
  totalHarga: number;
  keterangan?: string;
}

export interface MaterialContractRecord {
  id: string;
  notaDinas: string;
  tanggalNotaDinas?: string;
  judulPengadaan?: string;
  nilaiRabNodin: number;
  nomorSpk: string;
  namaVendor: string;
  nilaiSpk: number;
  validFrom: string;
  validTo: string;
  status: 'AKTIF' | 'SELESAI' | 'KEDALUWARSA';
  rincianMaterial: MaterialContractItem[];
  keterangan?: string;
}

export interface StandardConstructionRules {
  jtm: {
    tiangLabel: string;
    konstruksiLabel: string;
    conductorLabel: string;
    tiangList: string[];
    konstruksiList: string[];
  };
  jtr: {
    tiangLabel: string;
    konstruksiLabel: string;
    conductorLabel: string;
    tiangList: string[];
    konstruksiList: string[];
  };
}

// ---------------------------------------------------------------------------
// SWEEPING MATERIAL TYPES (Rekonsiliasi Pengambilan TUG-9 vs Terpasang vs Retur TUG-10)
// ---------------------------------------------------------------------------
export interface SweepingMaterialItem {
  id: string;
  kode?: string;
  material: string;
  // Material Pengambilan (TUG 9)
  volPengambilan: number;
  satPengambilan: string;
  noTug9?: string;
  ketPengambilan?: string;
  // Material Terpasang
  volTerpasang: number;
  satTerpasang: string;
  ketTerpasang?: string;
  // Material Dikembalikan / Bongkaran (TUG 10)
  volDikembalikan: number;
  satDikembalikan: string;
  noTug10?: string;
  ketDikembalikan?: string; // e.g. 'BONGKARAN' | 'SISA MATERIAL'
}

export interface SweepingRecord {
  id: string;
  nomorSweeping: string;
  namaPekerjaan: string;
  noSpk: string;
  tanggal: string;
  lokasi: string;
  pelaksana: string; // Vendor
  woIds: string[]; // List of WO IDs included in sweeping
  items: SweepingMaterialItem[];
  status: 'DRAFT' | 'DIVERIFIKASI_PENGAWAS' | 'DISETUJUI_GUDANG';
  createdAt: string;
  catatan?: string;
  ttdVendorName?: string;
  ttdPengawasName?: string;
  ttdGudangName?: string;
}
