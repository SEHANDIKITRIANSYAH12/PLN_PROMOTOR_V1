export type Role = 'Admin Daftung' | 'Admin WO' | 'Pengawas' | 'Admin Gudang';

export interface PoleData {
  id: string; // T1, T2
  name: string;
  std: string;
  networkType?: 'JTM' | 'JTR' | 'SUTM' | 'SUTR'; // Default JTM (Jaringan Tegangan Menengah) atau JTR (Jaringan Tegangan Rendah)
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
  namaDasar?: string; // Nama pelanggan / proyek / perumahan
  jumlahUnit?: number; // Jumlah unit
  dayaPerUnit?: string; // Daya per unit (VA)
  idpel?: string;
  jobType: string;
  location: string;
  address?: string;
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
  status: 'Menunggu verifikasi Daftung' | 'Masuk Antrean AP2T' | 'Terverifikasi' | 'Draf';
  poles: PoleData[];
  locationPhotos?: string[]; // Foto dokumentasi lokasi / survey lapangan umum
  createdAt: string;
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
}

export interface WoMaterialItem {
  material: string;
  qtyReksis: number;
  qtyAllocated: number;
  qtyReserved?: number;
  unit: string;
  kategori?: string;
  hargaSatuan?: number;
  kode?: string;
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
  paket1: ApplyWoPackageInput;
  paket2: ApplyWoPackageInput;
  signatures?: ApplyWoSignatures;
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
  status: 'AKTIF' | 'HABIS' | 'KEDALUWARSA';
  createdAt: string;
  paketType?: 'PAKET_1' | 'PAKET_2'; // backward compatibility
}

export interface WorkOrderRecord {
  id: string; // No Work Order (misal: 537.10.WO.2026)
  customerName: string;
  idpel: string;
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
  progress: number;
  status: 'Menunggu Persetujuan Asman' | 'Dikembalikan' | 'Konstruksi' | 'Verifikasi SJ' | 'Selesai' | 'Draf';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  approvedAt?: string;
  appliedAt?: string;
  daftungId?: string;
  reservationStatus: 'Belum Reservasi' | 'Reservasi Sebagian' | 'Siap Ambil' | 'Selesai';
  reservationLink?: string;
  materials: WoMaterialItem[];
  // Data Penandatangan Dokumen
  approverName?: string;
  approverRole?: string;
  approverSignature?: string;
  creatorName?: string;
  creatorRole?: string;
  creatorSignature?: string;
  catatan?: string;
  surveyId?: string;
}

export interface StockMaterial {
  code: string;
  name: string;
  category: string;
  qtyFisik: number;
  qtyAlokasi: number;
  qtySisa: number;
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
