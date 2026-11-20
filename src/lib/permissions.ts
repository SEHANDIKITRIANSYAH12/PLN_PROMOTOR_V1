import { Role, UserProfile, WorkOrderRecord, SurveyRecord } from '@/types';

// ============================================================================
// DAFTAR AKUN PENGGUNA DEFAULT (SIMULASI RBAC TERPADU)
// ============================================================================
export const SEED_USERS: UserProfile[] = [
  {
    id: 'usr-superadmin',
    name: 'Budi Santoso, S.T.',
    username: 'superadmin',
    role: 'Super Admin',
    unit: 'UP3 Banten Selatan',
    nip: '8210342AB',
    phone: '0812-1000-0001',
    email: 'superadmin@pln.co.id',
    status: 'AKTIF',
  },
  {
    id: 'usr-surveyor',
    name: 'Ahmad Fauzi',
    username: 'surveyor',
    role: 'Admin Survey',
    unit: 'ULP Rangkasbitung',
    nip: '9518001EF',
    phone: '0813-2000-0002',
    email: 'survey.rangkas@pln.co.id',
    status: 'AKTIF',
  },
  {
    id: 'usr-daftung',
    name: 'Hendra Prasetyo',
    username: 'admindaftung',
    role: 'Admin Daftung',
    unit: 'UP3 Banten Selatan',
    nip: '9114002CD',
    phone: '0812-3000-0003',
    email: 'daftung.up3bts@pln.co.id',
    status: 'AKTIF',
  },
  {
    id: 'usr-adminwo',
    name: 'Faisal Reza, S.T.',
    username: 'adminwo',
    role: 'Admin WO',
    unit: 'UP3 Banten Selatan',
    nip: '8913003GH',
    phone: '0811-4000-0004',
    email: 'wo.up3bts@pln.co.id',
    status: 'AKTIF',
  },
  {
    id: 'usr-pengawas-hasian',
    name: 'Hasian Sitorus',
    username: 'pengawas.hasian',
    role: 'Pengawas',
    supervisorId: 'sup-1',
    supervisorName: 'Hasian Sitorus',
    unit: 'UP3 Banten Selatan (TC Lola Konstruksi)',
    nip: '8914234ZY',
    phone: '0812-3456-7890',
    email: 'hasian.sitorus@pln.co.id',
    status: 'AKTIF',
  },
  {
    id: 'usr-pengawas-daud',
    name: 'Daud Febrizer',
    username: 'pengawas.daud',
    role: 'Pengawas',
    supervisorId: 'sup-3',
    supervisorName: 'Daud Febrizer',
    unit: 'ULP Rangkasbitung (TL Teknik)',
    nip: '9417652CD',
    phone: '0811-2233-4455',
    email: 'daud.febrizer@pln.co.id',
    status: 'AKTIF',
  },
  {
    id: 'usr-vendor-hilman',
    name: 'Hilman Sukmana (PT. HILMAN)',
    username: 'vendor.hilman',
    role: 'Vendor',
    vendorId: 'v-1',
    vendorName: 'PT. HILMAN PRIMA PERKASA',
    phone: '(0252) 201889',
    email: 'kontrak@hilmanprima.co.id',
    status: 'AKTIF',
  },
  {
    id: 'usr-vendor-energi',
    name: 'Bambang Irawan (PT. ENERGI BANTEN)',
    username: 'vendor.energi',
    role: 'Vendor',
    vendorId: 'v-4',
    vendorName: 'PT. ENERGI BANTEN SEJAHTERA',
    phone: '(0254) 849200',
    email: 'info@energibanten.co.id',
    status: 'AKTIF',
  },
  {
    id: 'usr-gudang',
    name: 'Siti Rahmawati',
    username: 'admingudang',
    role: 'Admin Gudang',
    unit: 'Gudang Logistik UP3 Banten Selatan',
    nip: '9316004KL',
    phone: '0812-7000-0007',
    email: 'gudang.up3bts@pln.co.id',
    status: 'AKTIF',
  },
  {
    id: 'usr-asman',
    name: 'Wegig Didik Kurniawan',
    username: 'asman.konstruksi',
    role: 'Approval',
    unit: 'Asisten Manajer Konstruksi UP3 BTS',
    nip: '8511005MN',
    phone: '0811-9000-0009',
    email: 'asman.konstruksi@pln.co.id',
    status: 'AKTIF',
  },
];

// ============================================================================
// HAK AKSES HALAMAN / MENU SIDEBAR
// ============================================================================
export const PAGE_PERMISSIONS: Record<string, Role[]> = {
  dashboard: ['Super Admin', 'Admin Survey', 'Admin Daftung', 'Admin WO', 'Pengawas', 'Vendor', 'Admin Gudang', 'Approval'],
  survey: ['Super Admin', 'Admin Survey', 'Admin Daftung', 'Admin WO'],
  pradaftung: ['Super Admin', 'Admin Daftung', 'Admin Survey', 'Admin WO'],
  wo: ['Super Admin', 'Admin WO', 'Admin Daftung', 'Pengawas', 'Vendor', 'Admin Gudang', 'Approval'],
  'persetujuan-wo': ['Super Admin', 'Approval', 'Admin WO'],
  daftung: ['Super Admin', 'Admin Daftung', 'Admin WO'],
  'reservasi-material': ['Super Admin', 'Pengawas', 'Admin Gudang', 'Admin WO', 'Vendor'],
  'verifikasi-pengawas': ['Super Admin', 'Pengawas', 'Admin WO', 'Vendor'],
  'vendor-ambil': ['Super Admin', 'Vendor', 'Pengawas', 'Admin WO', 'Admin Gudang'],
  'sweeping-material': ['Super Admin', 'Vendor', 'Pengawas', 'Admin Gudang', 'Admin WO'],
  'stok-gudang': ['Super Admin', 'Admin Gudang', 'Admin WO', 'Vendor'],
  'mutasi-material': ['Super Admin', 'Admin Gudang', 'Admin WO', 'Pengawas'],
  'analisis-material': ['Super Admin', 'Admin Daftung', 'Admin Gudang', 'Admin WO', 'Pengawas'],
  kontrak: ['Super Admin', 'Admin Daftung', 'Admin WO'],
  'master-material': ['Super Admin', 'Admin Daftung', 'Admin WO', 'Admin Gudang'],
  pengawas: ['Super Admin', 'Admin Daftung', 'Admin WO'],
  std: ['Super Admin', 'Admin Daftung', 'Admin WO', 'Pengawas'],
  audit: ['Super Admin', 'Admin Daftung', 'Admin WO', 'Approval'],
  pengaturan: ['Super Admin', 'Admin Daftung'],
};

export function canAccessPage(role: Role, pageId: string): boolean {
  if (role === 'Super Admin') return true;
  const allowed = PAGE_PERMISSIONS[pageId];
  if (!allowed) return true;
  return allowed.includes(role);
}

// ============================================================================
// FILTER DATA WORK ORDER BERDASARKAN KEPEMILIKAN / PENUGASAN (DATA SCOPING)
// ============================================================================
export function filterWorkOrdersForUser(
  workOrders: WorkOrderRecord[],
  user?: UserProfile | null
): WorkOrderRecord[] {
  if (!user || user.role === 'Super Admin' || user.role === 'Admin WO' || user.role === 'Admin Daftung' || user.role === 'Admin Gudang' || user.role === 'Approval') {
    return workOrders;
  }

  // Jika role Vendor: hanya tampilkan WO miliknya
  if (user.role === 'Vendor') {
    const targetVendor = (user.vendorName || '').toLowerCase().trim();
    return workOrders.filter((w) => {
      const matchName = (w.vendor || '').toLowerCase().trim() === targetVendor;
      const matchId = user.vendorId && (w.contractId === user.vendorId || w.vendor.includes(user.vendorId));
      return matchName || matchId;
    });
  }

  // Jika role Pengawas: hanya tampilkan WO yang ditugaskan kepadanya
  if (user.role === 'Pengawas') {
    const supName = (user.supervisorName || user.name || '').toLowerCase().trim();
    return workOrders.filter((w) => {
      const s1 = (w.supervisor1 || '').toLowerCase();
      const s2 = (w.supervisor2 || '').toLowerCase();
      const sGeneral = (w.supervisor || '').toLowerCase();
      return s1.includes(supName) || s2.includes(supName) || sGeneral.includes(supName);
    });
  }

  return workOrders;
}

// ============================================================================
// KUNCI BERTAHAP SURVEY LAPANGAN
// ============================================================================
export function isSurveyEditable(
  survey: SurveyRecord,
  role: Role,
  relatedWoCount: number = 0
): { editable: boolean; reason?: string } {
  // Super Admin selalu memiliki wewenang override
  if (role === 'Super Admin') {
    return { editable: true };
  }

  // Jika sudah terbit Work Order dari survey ini -> TERKUNCI PERMANEN
  if (relatedWoCount > 0) {
    return {
      editable: false,
      reason: 'Survey telah terbit Work Order resmi. Koreksi teknis hanya dapat dilakukan melalui revisi volume WO.',
    };
  }

  // Jika sedang diverifikasi AP2T atau sudah masuk Daftung -> TERKUNCI
  if (survey.status === 'Masuk Antrean AP2T') {
    return {
      editable: false,
      reason: 'Survey sedang dalam antrean verifikasi AP2T oleh Admin Daftung.',
    };
  }

  if (survey.status === 'Terverifikasi' || survey.status === 'Siap Apply WO') {
    return {
      editable: false,
      reason: 'Survey telah diverifikasi oleh Admin Daftung. Minta Admin Daftung mengembalikan status ke "Perlu Revisi" jika ingin mengubah.',
    };
  }

  // Status Draf atau Perlu Revisi -> BEBAS DIUBAH
  if (survey.status === 'Draf' || survey.status === 'Perlu Revisi' || survey.isOfflineDraft) {
    return { editable: true };
  }

  return { editable: true };
}
