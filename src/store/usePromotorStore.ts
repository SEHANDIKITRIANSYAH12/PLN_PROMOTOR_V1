import { create } from 'zustand';
import {
  Role,
  SurveyRecord,
  DaftungRecord,
  WorkOrderRecord,
  StockMaterial,
  AuditRecord,
  PoleData,
  ApplyWoInputParams,
  VendorRecord,
  ContractRecord,
  WoMaterialItem,
  WoJasaItem,
  SupervisorRecord,
  MaterialContractRecord,
  WoMilestones,
  StandardConstructionRules,
  ReservationTransaction,
  VendorPickupTransaction,
  SweepingRecord
} from '@/types';
import { calculateRabFromSurvey } from '@/data/rabMasterData';
import {
  SEED_CONSTRUCTION_RULES,
  SEED_SURVEYS,
  SEED_DAFTUNGS,
  SEED_RESERVATION_TX,
  SEED_PICKUP_TX,
  SEED_WORK_ORDERS,
  SEED_STOCKS,
  SEED_MATERIAL_CODE_MAP,
  SEED_AUDITS,
  SEED_KHS_PRICES,
  SEED_VENDORS,
  SEED_CONTRACTS,
  SEED_MATERIAL_CONTRACTS,
  SEED_SUPERVISORS,
  SEED_SWEEPINGS,
} from '@/data/seedData';

export function generateDaftungId(existingDaftungs: { id?: string }[] = []): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());

  let maxSeq = 0;
  for (const d of existingDaftungs) {
    if (!d.id) continue;
    const parts = d.id.split('-');
    // Cocokkan pola DF-{pelanggan keberapa}-{bulan}-{tahun}
    if (parts.length === 4 && parts[0] === 'DF' && parts[2] === mm && parts[3] === yyyy) {
      const seq = parseInt(parts[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  // Jika belum ada pada pola baru, jadikan pelanggan ke (jumlah data + 1)
  const nextSeq = maxSeq > 0 ? maxSeq + 1 : (existingDaftungs.length + 1);
  return `DF-${nextSeq}-${mm}-${yyyy}`;
}

interface PromotorState {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Surveys
  surveys: SurveyRecord[];
  addSurvey: (survey: Omit<SurveyRecord, 'id' | 'createdAt' | 'status'> & { poles: PoleData[]; isOfflineDraft?: boolean }) => string;
  syncOfflineSurvey: (id: string) => void;
  syncAllOfflineSurveys: () => void;
  updateSurvey: (id: string, partial: Partial<SurveyRecord>) => void;
  updateSurveyPoles: (id: string, poles: PoleData[]) => void;
  updateSurveyStatus: (id: string, status: SurveyRecord['status']) => void;
  deleteSurvey: (id: string) => void;

  // Daftung
  daftungs: DaftungRecord[];
  activeDaftungTab: 'ap2t' | 'daftung';
  setActiveDaftungTab: (tab: 'ap2t' | 'daftung') => void;
  addDaftungFromSurvey: (surveyId: string, finalName: string, finalIdpel: string) => string;
  updateDaftungDoc: (id: string, doc: 'nidi' | 'slo', val: boolean) => void;
  deleteDaftung: (id: string) => void;
  revertDaftungToAp2t: (id: string) => void;

  // Work Orders
  workOrders: WorkOrderRecord[];
  createWorkOrdersFromDaftung: (
    daftungId: string,
    idpel: string,
    customerName: string,
    customParams?: Omit<ApplyWoInputParams, 'daftungId' | 'idpel' | 'customerName'>
  ) => void;
  /** `false` berarti sistem menolak persetujuan (WO hilang / pagu tidak cukup). */
  approveWorkOrder: (
    id: string,
    approverData?: { name?: string; role?: string; signature?: string; catatan?: string }
  ) => boolean;
  rejectWorkOrder: (id: string, reason: string) => void;
  resubmitWorkOrder: (id: string, updates?: Partial<WorkOrderRecord>) => void;
  submitWoToAsman: (id: string) => void;
  /**
   * Revisi volume rencana oleh Asman sebelum WO disetujui. Array volume mengikuti
   * urutan `materials` dan `jasaItems` WO. `false` = ditolak (bukan antrean / tidak valid).
   */
  updateWoVolumes: (
    id: string,
    volumes: { materials: number[]; jasaItems: number[] },
    editedBy?: string
  ) => boolean;
  removeWoMaterialItem: (woId: string, itemIndex: number) => void;
  removeWoJasaItem: (woId: string, itemIndex: number) => void;
  updateWoSignatures: (
    woId: string,
    signatures: {
      approverName?: string;
      approverRole?: string;
      approverSignature?: string;
      creatorName?: string;
      creatorRole?: string;
      creatorSignature?: string;
    }
  ) => void;
  selectedDaftungIdForWo: string | null;
  setSelectedDaftungIdForWo: (id: string | null) => void;
  openApplyWoFromDaftung: (daftungId: string) => void;
  updateWoProgress: (
    id: string, 
    progress: number, 
    note?: string, 
    progressMaterial?: number, 
    progressJasa?: number, 
    updatedJasaItems?: WoJasaItem[], 
    updatedMaterials?: WoMaterialItem[],
    milestones?: WoMilestones
  ) => void;
  updateWoReservation: (id: string, status: WorkOrderRecord['reservationStatus']) => void;
  reserveMaterialWo: (
    woId: string,
    reservationNumber: string,
    reservationDate: string,
    updatedMaterials?: WoMaterialItem[],
    isHold?: boolean,
    holdReason?: string,
    notes?: string,
    reservationNumberNonStock?: string
  ) => void;
  updateWoMaterialItem: (
    woId: string,
    materialName: string,
    updates: Partial<WoMaterialItem>
  ) => void;
  replaceMaterialWo: (
    woId: string,
    originalMaterial: string,
    replacementMaterial: string,
    qty: number,
    reason: string
  ) => void;
  holdMaterialWo: (woId: string, holdReason: string) => void;
  unholdMaterialWo: (woId: string) => void;
  vendorConfirmMaterialTaken: (
    woId: string,
    sjNumber: string,
    sjDate: string,
    photoUrl: string | string[],
    materialsTaken: {
      material: string;
      qtyTaken: number;
      qtyTakenSap?: number;
      qtyTakenNonSap?: number;
      qtyTakenBatch?: number;
      channel?: 'SAP' | 'NON_SAP';
    }[],
    notes?: string,
    reservationNumber?: string,
    giNumber?: string,
    receiptPhotos?: string[]
  ) => void;
  pengawasVerifyReceipt: (
    woId: string,
    verifiedMaterials: { material: string; qtyTaken: number; qtyVendorClaim?: number; note?: string }[],
    notes: string,
    verifierName: string,
    suratJalanNumber?: string
  ) => void;
  updateWoGiInfo: (
    woId: string,
    giNumber: string,
    giStatus: 'Sistem' | 'Non-Sistem',
    catatan?: string,
    userInputBy?: string
  ) => void;
  vendorSubmitRealization: (
    woId: string,
    items: { material: string; qtyInstalled: number; qtyReturned: number; notes?: string }[],
    vendorNotes: string,
    slipReturNumber?: string,
    slipReturDate?: string,
    slipReturPhotos?: string[]
  ) => void;
  adminGudangApproveRetur: (
    woId: string,
    adminName: string,
    notes?: string
  ) => void;
  adminGudangRejectRetur: (
    woId: string,
    adminName: string,
    reason: string
  ) => void;

  // Histori Transaksi Reservasi & Pengambilan Bertahap
  reservationTransactions: ReservationTransaction[];
  vendorPickupTransactions: VendorPickupTransaction[];
  pengawasVerifyRealization: (
    woId: string,
    verifiedItems: { material: string; qtyInstalled: number; qtyReturned: number; verificationNote?: string }[],
    notes: string,
    verifierName: string
  ) => void;
  toggleMaterialTaken: (woId: string, materialName: string, isTaken: boolean) => void;
  uploadSuratJalan: (woId: string, sjNumber: string, photoUrl?: string) => void;
  verifySuratJalan: (
    woId: string,
    verifiedMaterials: {
      material: string;
      qtyInstalled: number;
      qtyReturned: number;
      verificationNote?: string;
    }[],
    generalNotes?: string,
    verifierName?: string
  ) => void;
  deleteWorkOrder: (id: string) => void;

  // Master Vendors & Kontrak
  // Vendor tidak punya layar CRUD tersendiri: identitasnya diturunkan dari
  // Master Kontrak / WO / Kontrak Material lewat deriveVendorOptions().
  vendors: VendorRecord[];

  contracts: ContractRecord[];
  addContract: (contract: Omit<ContractRecord, 'id' | 'usedPagu' | 'createdAt'>) => void;
  updateContract: (id: string, updates: Partial<ContractRecord>) => void;
  deleteContract: (id: string) => void;

  // Master Material (Kontrak Material)
  materialContracts: MaterialContractRecord[];
  addMaterialContract: (contract: Omit<MaterialContractRecord, 'id'>) => void;
  updateMaterialContract: (id: string, updates: Partial<MaterialContractRecord>) => void;
  deleteMaterialContract: (id: string) => void;

  // Master Pengawas
  supervisors: SupervisorRecord[];
  addSupervisor: (supervisor: Omit<SupervisorRecord, 'id'>) => void;
  updateSupervisor: (id: string, updates: Partial<SupervisorRecord>) => void;
  deleteSupervisor: (id: string) => void;

  // Stocks
  stocks: StockMaterial[];
  materialCodeMap: Record<string, string>; // mapping id -> nomorMaterial atau oldCode -> newCode
  updateMaterialCodeMapping: (materialIdOrOldCode: string, newCode: string) => void;
  updateStock: (oldCode: string, updates: Partial<StockMaterial> & { newCode?: string }) => void;
  addStock: (stock: StockMaterial) => void;
  deleteStock: (code: string) => void;

  // Audits
  audits: AuditRecord[];
  addAudit: (activity: string, object: string, source: string) => void;
  clearAudits: () => void;

  // Master KHS Custom Prices
  customKhsPrices: Record<string, number>;
  updateKhsPrice: (id: string, newPrice: number, reason?: string) => void;
  resetKhsPrice: (id: string) => void;
  resetAllKhsPrices: () => void;

  // Active RAB state
  activeRabSurveyId: string | null;
  activeRabPaket: 'paket1' | 'paket2';
  openRabForSurvey: (surveyId: string, paket?: 'paket1' | 'paket2') => void;

  // Toast notification
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;

  // Standard Construction Rules (Aturan Master Standar untuk Menu Survey)
  constructionRules: StandardConstructionRules;
  updateConstructionRuleLabels: (
    network: 'jtm' | 'jtr',
    labels: { tiangLabel?: string; konstruksiLabel?: string; conductorLabel?: string }
  ) => void;
  updateConstructionTiangList: (
    network: 'jtm' | 'jtr',
    tiangList: string[]
  ) => void;
  updateConstructionKonstruksiList: (
    network: 'jtm' | 'jtr',
    konstruksiList: string[]
  ) => void;

  // Sweeping Material
  sweepings: SweepingRecord[];
  addSweeping: (record: Omit<SweepingRecord, 'id' | 'createdAt'>) => string;
  updateSweeping: (id: string, updates: Partial<SweepingRecord>) => void;
  deleteSweeping: (id: string) => void;

  // === Vendor Progress Submission & Verifikasi Pengawas ===
  vendorSubmitProgress: (woId: string, draftItems: WoJasaItem[], vendorLabel: string) => void;
  pengawasApproveProgress: (woId: string, verifierName: string, catatan?: string, verifiedJasaItems?: WoJasaItem[]) => void;
  pengawasRejectProgress: (woId: string, verifierName: string, alasan: string) => void;
  pengawasLockProgressJasa: (woId: string, pengawasName: string) => void;
  pengawasUnlockProgressJasa: (woId: string, pengawasName: string) => void;
}

/**
 * Sumber identitas vendor tunggal untuk pilihan (dropdown/datalist) di modul hilir.
 *
 * Rekanan vendor tidak lagi memiliki layar master tersendiri — namanya cukup lahir
 * dari Master Kontrak (SPK), Work Order, atau Kontrak Material. Fungsi ini
 * menggabungkan daftar vendor seed dengan nama-nama yang muncul pada dokumen-dokumen
 * tersebut, sekaligus melengkapi jenis pekerjaan bila belum terdaftar.
 */
export const deriveVendorOptions = (
  base: VendorRecord[],
  sources: { vendorName?: string; jenisPekerjaan?: string }[]
): VendorRecord[] => {
  const byName = new Map<string, VendorRecord>();
  for (const v of base || []) {
    const name = (v?.name || '').trim();
    if (name) byName.set(name.toLowerCase(), v);
  }

  for (const s of sources || []) {
    const name = (s?.vendorName || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const jenis = s.jenisPekerjaan as VendorRecord['jenisPekerjaan'][number] | undefined;
    const existing = byName.get(key);

    if (existing) {
      const currentJenis = existing.jenisPekerjaan || [];
      if (jenis && !currentJenis.includes(jenis)) {
        byName.set(key, { ...existing, jenisPekerjaan: [...currentJenis, jenis] });
      }
      continue;
    }

    byName.set(key, {
      id: `VND-${key.replace(/[^a-z0-9]+/g, '-')}`,
      name,
      director: '—',
      address: '—',
      phone: '—',
      email: '—',
      jenisPekerjaan: jenis ? [jenis] : [],
      validFrom: '—',
      validTo: '—',
      status: 'AKTIF',
    });
  }

  return Array.from(byName.values());
};

/* ==========================================================================
   REALISASI PAGU KONTRAK
   Angka tidak pernah ditambah/dikurangi secara manual. Selalu dihitung ulang
   dari Work Order saat dibaca, sehingga tidak mungkin melayang karena approve
   ganda, delete, atau perpindahan kontrak.
   ========================================================================== */

/** Nilai kelompok Jasa suatu WO (Rp) dari volume rencana x harga satuan KHS. */
export const getWoJasaValue = (wo: WorkOrderRecord): number =>
  (wo.jasaItems || []).reduce(
    (total, item) => total + ((item.qtyTarget || 0) * (item.hargaSatuan || 0)),
    0
  );

/** Nilai kelompok Material suatu WO (Rp) dari volume rencana x harga satuan. */
export const getWoMaterialValue = (wo: WorkOrderRecord): number =>
  (wo.materials || []).reduce((total, m) => {
    const qty = m.qtyReksis || m.qtyAllocated || 0;
    return total + qty * (m.hargaSatuan || 0);
  }, 0);

/** Status WO yang sudah mengikat anggaran kontrak. */
const WO_COMMITTED_STATUSES: WorkOrderRecord['status'][] = ['Konstruksi', 'Verifikasi SJ', 'Selesai', 'Closeout'];

export const isWoCommittingPagu = (wo: WorkOrderRecord): boolean =>
  wo.approvalStatus === 'APPROVED' || WO_COMMITTED_STATUSES.includes(wo.status);

/** WO dalam tahap belum disetujui (Draf / Pengajuan ke Asman) yang volumenya masih boleh diedit. */
export const isWoEditable = (wo: WorkOrderRecord): boolean =>
  wo.status === 'Draf' ||
  wo.status === 'Menunggu Persetujuan Asman' ||
  wo.approvalStatus === 'DRAFT' ||
  wo.approvalStatus === 'PENDING';

/** WO di antrean Persetujuan Asman (tahap verifikasi oleh Asman Konstruksi). */
export const isWoPendingApproval = (wo: WorkOrderRecord): boolean =>
  wo.status === 'Menunggu Persetujuan Asman' || wo.approvalStatus === 'PENDING';

/**
 * Status WO yang sedang Closeout (progres jasa dikunci) tidak boleh tergeser oleh
 * alur lain; status hasil alur itu disimpan dan baru berlaku saat kunci dibuka.
 */
const applyWoStatus = (
  w: WorkOrderRecord,
  next: Exclude<WorkOrderRecord['status'], 'Closeout'>
): Pick<WorkOrderRecord, 'status' | 'statusBeforeCloseout'> =>
  w.progressJasaLocked ? { status: 'Closeout', statusBeforeCloseout: next } : { status: next };

/**
 * Pencocokan WO ke kontrak. `contractId` dipakai lebih dahulu; `spkNumber` hanya
 * jadi fallback untuk WO seed yang terbit sebelum tautan kontrak tersedia.
 */
export const woBelongsToContract = (wo: WorkOrderRecord, contract: ContractRecord): boolean => {
  if (wo.contractId) return wo.contractId === contract.id;
  return Boolean(wo.spkNumber) && wo.spkNumber === contract.spkNumber;
};

/** Beban WO ke kontrak mengikuti jenis pengadaan kontrak (jasa / material / keduanya). */
export const getWoContractValue = (wo: WorkOrderRecord, contract: ContractRecord): number => {
  switch (contract.tipePengadaan) {
    case 'MATERIAL':
      return getWoMaterialValue(wo);
    case 'JASA & MATERIAL':
      return getWoJasaValue(wo) + getWoMaterialValue(wo);
    case 'JASA':
    default:
      return getWoJasaValue(wo);
  }
};

export interface ContractRealization {
  nilaiPagu: number;
  terpakai: number;
  sisa: number;
  persen: number;
  woList: WorkOrderRecord[];
}

/** Realisasi sebuah kontrak, diturunkan dari WO yang tertaut dan sudah disetujui. */
export const getContractRealization = (
  contract: ContractRecord,
  workOrders: WorkOrderRecord[]
): ContractRealization => {
  const woList = (workOrders || []).filter(
    (w) => woBelongsToContract(w, contract) && isWoCommittingPagu(w)
  );
  const nilaiPagu = contract.nilaiKontrak || contract.totalPagu || 0;
  const terpakai = woList.reduce((sum, w) => sum + getWoContractValue(w, contract), 0);
  return {
    nilaiPagu,
    terpakai,
    sisa: nilaiPagu - terpakai,
    persen: nilaiPagu > 0 ? Math.round((terpakai / nilaiPagu) * 1000) / 10 : 0,
    woList,
  };
};

/** Realisasi seluruh kontrak dalam satu kali jalan (untuk kartu KPI). */
export const sumContractRealization = (
  contracts: ContractRecord[],
  workOrders: WorkOrderRecord[]
): { totalPagu: number; terpakai: number; sisa: number; persen: number } => {
  const rows = (contracts || []).map((c) => getContractRealization(c, workOrders));
  const totalPagu = rows.reduce((s, r) => s + r.nilaiPagu, 0);
  const terpakai = rows.reduce((s, r) => s + r.terpakai, 0);
  return {
    totalPagu,
    terpakai,
    sisa: totalPagu - terpakai,
    persen: totalPagu > 0 ? Math.round((terpakai / totalPagu) * 1000) / 10 : 0,
  };
};

export interface WoPaguCheck {
  /** OK = muat, LEBIH = melewati sisa pagu, TANPA_KONTRAK = WO tidak tertaut SPK mana pun. */
  status: 'OK' | 'LEBIH' | 'TANPA_KONTRAK';
  contract?: ContractRecord;
  beban: number;
  sisa: number;
  nilaiPagu: number;
}

/** Cek apakah beban pagu suatu WO masih muat pada sisa pagu kontraknya. */
export const checkWoPagu = (
  wo: WorkOrderRecord,
  contracts: ContractRecord[],
  workOrders: WorkOrderRecord[]
): WoPaguCheck => {
  const contract = (contracts || []).find((c) => woBelongsToContract(wo, c));
  if (!contract) return { status: 'TANPA_KONTRAK', beban: 0, sisa: 0, nilaiPagu: 0 };
  const realisasi = getContractRealization(contract, workOrders);
  const beban = getWoContractValue(wo, contract);
  return {
    status: beban > realisasi.sisa ? 'LEBIH' : 'OK',
    contract,
    beban,
    sisa: realisasi.sisa,
    nilaiPagu: realisasi.nilaiPagu,
  };
};

/** Rp 1.234.567 — dipakai pada pesan validasi agar angka audit presisi. */
const formatRpPresisi = (num: number) => 'Rp' + Math.round(num).toLocaleString('id-ID');

/** Nomor WO standar: [URUT].[BULAN].WO.[KODE].[TAHUN] — harus sama dengan Menu Work Order. */
export const buildWoNumber = (urut: number, bulan: string, kode: string, tahun: string): string =>
  `${String(urut).padStart(3, '0')}.${String(bulan).padStart(2, '0')}.WO.${kode}.${tahun}`;

/**
 * No. urut dasar pertama yang ketiga nomornya (P1, P2, TB) masih bebas.
 * Dijaga agar WO baru tidak pernah berbagi id dengan WO yang sudah ada —
 * satu id untuk dua dokumen akan membuat persetujuan & pagu salahhitung.
 */
export const nextFreeWoBase = (
  existingIds: string[],
  bulan: string,
  tahun: string
): number => {
  const taken = new Set(existingIds || []);
  for (let base = 1; base <= 999; base++) {
    const bebas = ['P1', 'P2', 'TB'].every(
      (kode, i) => !taken.has(buildWoNumber(base + i, bulan, kode, tahun))
    );
    if (bebas) return base;
  }
  return 1;
};

export const usePromotorStore = create<PromotorState>((set, get) => ({
  // Aturan Master Standar Konstruksi (Sinkron ke Menu Survey)
  constructionRules: SEED_CONSTRUCTION_RULES,
  updateConstructionRuleLabels: (network, labels) => {
    set((state) => ({
      constructionRules: {
        ...state.constructionRules,
        [network]: {
          ...state.constructionRules[network],
          ...labels
        }
      }
    }));
  },
  updateConstructionTiangList: (network, tiangList) => {
    set((state) => ({
      constructionRules: {
        ...state.constructionRules,
        [network]: {
          ...state.constructionRules[network],
          tiangList: Array.from(new Set(tiangList.filter(Boolean)))
        }
      }
    }));
  },
  updateConstructionKonstruksiList: (network, konstruksiList) => {
    set((state) => ({
      constructionRules: {
        ...state.constructionRules,
        [network]: {
          ...state.constructionRules[network],
          konstruksiList: Array.from(new Set(konstruksiList.filter(Boolean)))
        }
      }
    }));
  },
  currentRole: 'Admin Daftung',
  setCurrentRole: (role) => set({ currentRole: role }),
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  activeDaftungTab: 'ap2t',
  setActiveDaftungTab: (tab) => set({ activeDaftungTab: tab }),

  activeRabSurveyId: 'SRV-2026-0001',
  activeRabPaket: 'paket2',
  openRabForSurvey: (surveyId, paket = 'paket2') => {
    set({
      activeRabSurveyId: surveyId,
      activeRabPaket: paket,
      currentPage: 'rab',
    });
  },

  selectedDaftungIdForWo: null,
  setSelectedDaftungIdForWo: (id) => set({ selectedDaftungIdForWo: id }),
  openApplyWoFromDaftung: (daftungId) => {
    set({
      selectedDaftungIdForWo: daftungId,
      currentPage: 'wo',
    });
  },

  toastMessage: null,
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 3000);
  },
  clearToast: () => set({ toastMessage: null }),

  surveys: SEED_SURVEYS,

  addSurvey: (data) => {
    const isOffline = Boolean(data.isOfflineDraft);
    const newId = isOffline ? `SRV-OFFLINE-${String(Date.now()).slice(-4)}` : `SRV-${String(Date.now()).slice(-4)}`;
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const newRecord: SurveyRecord = {
      ...data,
      id: newId,
      status: isOffline ? 'Draf' : 'Masuk Antrean AP2T',
      createdAt: nowStr,
      isOfflineDraft: isOffline,
      offlineCreatedAt: isOffline ? nowStr : undefined,
    };
    set((state) => ({
      surveys: [newRecord, ...state.surveys],
    }));
    if (isOffline) {
      get().addAudit(`Survey offline (Blankspot) ${newId} disimpan di memori perangkat`, newId, 'Survey Lapangan');
      get().showToast(`📶 [Mode Blankspot] Survey ${newId} tersimpan aman di perangkat. Siap disinkronkan saat ada sinyal.`);
    } else {
      get().addAudit(`Survey baru ${newId} didaftarkan ke server (Masuk Antrean Verifikasi AP2T)`, newId, 'Survey Lapangan');
      get().showToast(`✓ Survey ${newId} berhasil disimpan & langsung masuk ke Verifikasi AP2T`);
    }
    return newId;
  },

  syncOfflineSurvey: (id: string) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => ({
      surveys: state.surveys.map((s) => {
        if (s.id === id && s.isOfflineDraft) {
          return {
            ...s,
            isOfflineDraft: false,
            status: 'Masuk Antrean AP2T' as const,
            syncedAt: nowStr,
          };
        }
        return s;
      }),
    }));
    get().addAudit(`Survey offline ${id} berhasil disinkronkan ke server pusat (Masuk Verifikasi AP2T)`, id, 'Sinkronisasi Offline');
    get().showToast(`✓ Survey ${id} disinkronkan & masuk ke antrean Verifikasi AP2T!`);
  },

  syncAllOfflineSurveys: () => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const currentOfflines = get().surveys.filter((s) => s.isOfflineDraft);
    if (currentOfflines.length === 0) {
      get().showToast('Semua data survey sudah tersinkronkan.');
      return;
    }
    set((state) => ({
      surveys: state.surveys.map((s) => {
        if (s.isOfflineDraft) {
          return {
            ...s,
            isOfflineDraft: false,
            status: 'Masuk Antrean AP2T' as const,
            syncedAt: nowStr,
          };
        }
        return s;
      }),
    }));
    get().addAudit(`${currentOfflines.length} survey offline berhasil disinkronkan serentak (Masuk Verifikasi AP2T)`, 'MULTI-SYNC', 'Sinkronisasi Offline');
    get().showToast(`✓ Berhasil menyinkronkan ${currentOfflines.length} data survey offline ke Verifikasi AP2T!`);
  },

  updateSurvey: (id, partial) => {
    // Identitas pelanggan (nama, daya, alamat) ikut diperbarui di Daftung & WO turunan survey ini,
    // supaya dokumen RAB/WO dan tabel-tabelnya selalu memakai data verifikasi AP2T terakhir.
    const identity: Partial<Pick<WorkOrderRecord, 'customerName' | 'daya' | 'location' | 'address'>> = {};
    if (partial.customerName !== undefined) identity.customerName = partial.customerName;
    if (partial.daya !== undefined) identity.daya = partial.daya;
    if (partial.location !== undefined) identity.location = partial.location;
    if (partial.address !== undefined) identity.address = partial.address;
    const hasIdentity = Object.keys(identity).length > 0;

    set((state) => ({
      surveys: state.surveys.map((s) => (s.id === id ? { ...s, ...partial } : s)),
      ...(hasIdentity && {
        workOrders: state.workOrders.map((w) =>
          w.surveyId === id || w.daftungId === id ? { ...w, ...identity } : w
        ),
        daftungs: state.daftungs.map((d) =>
          d.surveyId === id || d.id === id
            ? {
                ...d,
                ...(identity.customerName !== undefined && { customerName: identity.customerName }),
                ...(identity.daya !== undefined && { daya: identity.daya }),
              }
            : d
        ),
      }),
    }));
  },

  updateSurveyPoles: (id, poles) => {
    set((state) => ({
      surveys: state.surveys.map((s) => (s.id === id ? { ...s, poles } : s)),
    }));
  },

  updateSurveyStatus: (id, status) => {
    set((state) => ({
      surveys: state.surveys.map((s) => (s.id === id ? { ...s, status } : s)),
    }));
  },

  deleteSurvey: (id) => {
    set((state) => ({
      surveys: state.surveys.filter((s) => s.id !== id),
    }));
    get().addAudit(`Hapus data survey ${id}`, id, 'Survey');
    get().showToast(`✓ Data survey ${id} berhasil dihapus`);
  },

  daftungs: SEED_DAFTUNGS,

  addDaftungFromSurvey: (surveyId, finalName, finalIdpel) => {
    const currentDaftungs = get().daftungs;
    const newDf = generateDaftungId(currentDaftungs);
    const newRec: DaftungRecord = {
      id: newDf,
      idpel: finalIdpel,
      customerName: finalName,
      source: `REKSIS dari ${surveyId}`,
      woIssued: 'Belum dibuat',
      nidi: false,
      slo: false,
      status: 'Siap Apply',
      surveyId,
    };
    set((state) => ({
      daftungs: [newRec, ...state.daftungs],
      surveys: state.surveys.map((s) => (s.id === surveyId ? { ...s, status: 'Terverifikasi' } : s)),
    }));
    get().addAudit(`Survey ${surveyId} diverifikasi AP2T -> Terbit Daftung ${newDf}`, newDf, 'Daftung');
    get().showToast(`✓ Daftung ${newDf} berhasil dibuat dari ${surveyId}`);
    return newDf;
  },

  updateDaftungDoc: (id, doc, val) => {
    set((state) => ({
      daftungs: state.daftungs.map((d) => (d.id === id ? { ...d, [doc]: val } : d)),
    }));
    get().addAudit(`Update status ${doc.toUpperCase()} pada ${id}`, id, 'Daftung');
  },

  deleteDaftung: (id) => {
    set((state) => ({
      daftungs: state.daftungs.filter((d) => d.id !== id),
    }));
    get().addAudit(`Hapus data Daftung ${id}`, id, 'Daftung');
    get().showToast(`✓ Data Daftung ${id} berhasil dihapus`);
  },

  revertDaftungToAp2t: (id) => {
    const daftung = get().daftungs.find((d) => d.id === id);
    if (!daftung) return;

    const existingSurvey = get().surveys.find(
      (s) => s.id === daftung.surveyId || s.idpel === daftung.idpel || s.customerName === daftung.customerName
    );

    set((state) => {
      let updatedSurveys = [...state.surveys];
      if (existingSurvey) {
        updatedSurveys = updatedSurveys.map((s) =>
          s.id === existingSurvey.id ? { ...s, status: 'Masuk Antrean AP2T' } : s
        );
      } else {
        const newSurvey: SurveyRecord = {
          id: daftung.surveyId || `SRV-${daftung.id}`,
          customerName: daftung.customerName,
          idpel: daftung.idpel,
          jobType: 'Pasang Baru',
          location: 'Wilayah Kerja UP3 Banten Selatan',
          status: 'Masuk Antrean AP2T',
          poles: [],
          createdAt: new Date().toISOString().split('T')[0],
        };
        updatedSurveys = [newSurvey, ...updatedSurveys];
      }

      return {
        daftungs: state.daftungs.filter((d) => d.id !== id),
        surveys: updatedSurveys,
      };
    });

    get().addAudit(`Daftung ${id} (${daftung.customerName}) dikembalikan ke antrean Verifikasi AP2T`, id, 'Daftung');
    get().showToast(`✓ Pelanggan ${daftung.customerName} berhasil dikembalikan ke antrean Verifikasi AP2T`);
  },

  reservationTransactions: SEED_RESERVATION_TX,
  vendorPickupTransactions: SEED_PICKUP_TX,

  workOrders: SEED_WORK_ORDERS,

  createWorkOrdersFromDaftung: (daftungId, idpel, customerName, customParams) => {
    let newWos: WorkOrderRecord[] = [];
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    // Nomor WO dipakai sebagai id record. Bila nomor yang sama dipakai dua dokumen,
    // satu persetujuan akan mengubah dua WO sekaligus dan realisasi pagu salahhitung.
    const nomorDiajukan = [
      customParams?.paket1?.enabled ? customParams.paket1.noWorkOrder?.trim() : '',
      customParams?.paket2?.enabled ? customParams.paket2.noWorkOrder?.trim() : '',
      customParams?.woTiang?.enabled ? customParams.woTiang.noWorkOrder?.trim() : '',
    ].filter(Boolean) as string[];
    const bentrok = nomorDiajukan.filter((no) =>
      get().workOrders.some((w) => w.id === no && w.daftungId !== daftungId)
    );
    if (bentrok.length > 0) {
      get().addAudit(
        `Penerbitan WO untuk ${customerName} DITOLAK sistem: nomor ${bentrok.join(', ')} sudah dipakai WO lain.`,
        daftungId,
        'Work Order'
      );
      get().showToast(
        `⚠ Nomor WO ${bentrok.join(', ')} sudah dipakai. Ubah No. Urut WO lalu ajukan lagi.`
      );
      return;
    }

    // Temukan survey terkait dari daftungId / idpel / customerName
    const currentState = get();
    const targetDaftung = currentState.daftungs.find((d) => d.id === daftungId || d.idpel === idpel);
    const matchedSurvey = currentState.surveys.find(
      (s) =>
        s.id === daftungId ||
        (targetDaftung?.surveyId && s.id === targetDaftung.surveyId) ||
        (idpel && s.idpel === idpel) ||
        s.customerName.toLowerCase() === customerName.toLowerCase() ||
        s.customerName.toLowerCase().includes(customerName.toLowerCase()) ||
        customerName.toLowerCase().includes(s.customerName.toLowerCase())
    );

    // Hitung Material murni dari data survey (HANYA Kelompok Material fisik yang diambil di Gudang PLN)
    let p1Materials: WoMaterialItem[] = [];
    let p2Materials: WoMaterialItem[] = [];
    // Hitung Kelompok Jasa murni dari data survey untuk monitoring progres fisik konstruksi
    let p1JasaItems: WoJasaItem[] = [];
    let p2JasaItems: WoJasaItem[] = [];

    // Survey tanpa tiang tetap dihitung (mis. hanya mutasi trafo / gardu / box APP).
    if (matchedSurvey) {
      const p1Rab = calculateRabFromSurvey(matchedSurvey, 'paket1', currentState.customKhsPrices);
      p1Materials = p1Rab
        .filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'MATERIAL')
        .map((r) => ({
          material: r.desc,
          qtyReksis: r.rencanaVol,
          qtyAllocated: r.rencanaVol,
          unit: r.sat || 'Buah',
          kategori: r.subSection || r.section || 'KELOMPOK MATERIAL',
          hargaSatuan: r.hargaSatuan,
          kode: r.kode,
        }));

      const p1RawJasa = p1Rab.filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'JASA');
      const p1TotalJasaVal = p1RawJasa.reduce((acc, r) => acc + (r.rencanaVol * (r.hargaSatuan || 0)), 0);
      p1JasaItems = p1RawJasa.map((r, idx) => {
        const itemVal = r.rencanaVol * (r.hargaSatuan || 0);
        const bobot = p1TotalJasaVal > 0 
          ? Math.round((itemVal / p1TotalJasaVal) * 1000) / 10 
          : (p1RawJasa.length > 0 ? Math.round((100 / p1RawJasa.length) * 10) / 10 : 0);
        return {
          id: r.id || `p1-jsa-${idx + 1}`,
          kode: r.kode || r.id,
          subKategori: r.subSection,
          deskripsi: r.desc,
          qtyTarget: r.rencanaVol,
          qtyRealisasi: 0,
          unit: r.sat || 'kms',
          hargaSatuan: r.hargaSatuan,
          bobotPersen: bobot,
          progresPersen: 0,
        };
      });

      const p2Rab = calculateRabFromSurvey(matchedSurvey, 'paket2', currentState.customKhsPrices);
      p2Materials = p2Rab
        .filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'MATERIAL')
        .map((r) => ({
          material: r.desc,
          qtyReksis: r.rencanaVol,
          qtyAllocated: r.rencanaVol,
          unit: r.sat || 'Buah',
          kategori: r.subSection || r.section || 'KELOMPOK MATERIAL',
          hargaSatuan: r.hargaSatuan,
          kode: r.kode,
        }));

      const p2RawJasa = p2Rab.filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'JASA');
      const p2TotalJasaVal = p2RawJasa.reduce((acc, r) => acc + (r.rencanaVol * (r.hargaSatuan || 0)), 0);
      p2JasaItems = p2RawJasa.map((r, idx) => {
        const itemVal = r.rencanaVol * (r.hargaSatuan || 0);
        const bobot = p2TotalJasaVal > 0 
          ? Math.round((itemVal / p2TotalJasaVal) * 1000) / 10 
          : (p2RawJasa.length > 0 ? Math.round((100 / p2RawJasa.length) * 10) / 10 : 0);
        return {
          id: r.id || `p2-jsa-${idx + 1}`,
          kode: r.kode || r.id,
          subKategori: r.subSection,
          deskripsi: r.desc,
          qtyTarget: r.rencanaVol,
          qtyRealisasi: 0,
          unit: r.sat || 'kms',
          hargaSatuan: r.hargaSatuan,
          bobotPersen: bobot,
          progresPersen: 0,
        };
      });
    }

    if (customParams) {
      const finalCustomerName = customParams?.customerData?.customerName || customerName;
      const finalIdpel = customParams?.customerData?.idpel || idpel;
      const finalDaya = customParams?.customerData?.daya || matchedSurvey?.dayaBaru || matchedSurvey?.daya;
      const finalTarif = customParams?.customerData?.tarif || matchedSurvey?.tarifBaru || matchedSurvey?.tarif;
      const finalAlamat = customParams?.customerData?.alamat || matchedSurvey?.address || matchedSurvey?.location;
      const finalGI = customParams?.technicalData?.garduInduk || matchedSurvey?.garduInduk;
      const finalPenyulang = customParams?.technicalData?.penyulang || matchedSurvey?.penyulang;
      const finalGardu = customParams?.technicalData?.gardu || matchedSurvey?.gardu;
      const finalUlp = customParams?.technicalData?.ulp || matchedSurvey?.ulp;
      const finalTipeGardu = customParams?.technicalData?.tipePembangunanGardu || matchedSurvey?.tipePembangunanGardu;
      const finalKapasitasTrafo = customParams?.technicalData?.kapasitasTrafo || matchedSurvey?.kapasitasTrafo;
      const finalJumlahKabel = customParams?.technicalData?.jumlahKabelNaik || matchedSurvey?.jumlahKabelNaik;

      if (customParams.paket1?.enabled) {
        newWos.push({
          id: customParams.paket1.noWorkOrder || '537.10.WO.2026',
          noWorkOrder: customParams.paket1.noWorkOrder || '537.10.WO.2026',
          customerName: finalCustomerName,
          idpel: finalIdpel,
          daya: finalDaya,
          tarif: finalTarif,
          location: finalAlamat,
          address: finalAlamat,
          garduInduk: finalGI,
          penyulang: finalPenyulang,
          gardu: finalGardu,
          ulp: finalUlp,
          tipePembangunanGardu: finalTipeGardu,
          kapasitasTrafo: finalKapasitasTrafo,
          jumlahKabelNaik: finalJumlahKabel,
          category: 'WO Paket 1',
          vendor: customParams.paket1.vendor || 'PT. HILMAN PRIMA PERKASA',
          contractId: customParams.paket1.contractId,
          spkNumber: customParams.paket1.noSpk || '0021.PJ/DAN.02.03/UP3-BTS/2026',
          validFrom: customParams.paket1.validFrom || '02 Jan 2026',
          validTo: customParams.paket1.validTo || '31 Des 2026',
          supervisor: customParams.paket1.pengawas1 || 'Hasian Sitorus (TC Lola Konstruksi)',
          supervisor1: customParams.paket1.pengawas1 || 'Hasian Sitorus (TC Lola Konstruksi)',
          supervisor2: customParams.paket1.pengawas2 || 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
          progress: 0,
          status: 'Draf',
          approvalStatus: 'DRAFT',
          appliedAt: nowStr,
          daftungId,
          reservationStatus: 'Belum Reservasi',
          approverName: customParams?.signatures?.approverName || 'WEGIG DIDIK KURNIAWAN',
          approverRole: customParams?.signatures?.approverRole || 'ASMAN KONSTRUKSI',
          approverSignature: customParams?.signatures?.approverSignature,
          creatorName: customParams?.signatures?.creatorName || 'HASIAN EFRAVODITUS SITORUS',
          creatorRole: customParams?.signatures?.creatorRole || 'TC LOLA KONS',
          creatorSignature: customParams?.signatures?.creatorSignature,
          catatan: customParams?.signatures?.catatan,
          surveyId: matchedSurvey?.id || daftungId,
          materials: customParams.paket1.materials || p1Materials,
          jasaItems: customParams.paket1.jasaItems || p1JasaItems,
        });
      }

      if (customParams.paket2?.enabled) {
        newWos.push({
          id: customParams.paket2.noWorkOrder || '538.10.WO.2026',
          noWorkOrder: customParams.paket2.noWorkOrder || '538.10.WO.2026',
          customerName: finalCustomerName,
          idpel: finalIdpel,
          daya: finalDaya,
          tarif: finalTarif,
          location: finalAlamat,
          address: finalAlamat,
          garduInduk: finalGI,
          penyulang: finalPenyulang,
          gardu: finalGardu,
          ulp: finalUlp,
          tipePembangunanGardu: finalTipeGardu,
          kapasitasTrafo: finalKapasitasTrafo,
          jumlahKabelNaik: finalJumlahKabel,
          category: 'WO Paket 2',
          vendor: customParams.paket2.vendor || 'PT. TAWAKAL KARYA TEKNIK',
          contractId: customParams.paket2.contractId,
          spkNumber: customParams.paket2.noSpk || '0022.PJ/DAN.02.03/UP3-BTS/2026',
          validFrom: customParams.paket2.validFrom || '02 Jan 2026',
          validTo: customParams.paket2.validTo || '31 Des 2026',
          supervisor: customParams.paket2.pengawas1 || 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
          supervisor1: customParams.paket2.pengawas1 || 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
          supervisor2: customParams.paket2.pengawas2 || '',
          progress: 0,
          status: 'Draf',
          approvalStatus: 'DRAFT',
          appliedAt: nowStr,
          daftungId,
          reservationStatus: 'Belum Reservasi',
          approverName: customParams?.signatures?.approverName || 'WEGIG DIDIK KURNIAWAN',
          approverRole: customParams?.signatures?.approverRole || 'ASMAN KONSTRUKSI',
          approverSignature: customParams?.signatures?.approverSignature,
          creatorName: customParams?.signatures?.creatorName || 'HASIAN EFRAVODITUS SITORUS',
          creatorRole: customParams?.signatures?.creatorRole || 'TC LOLA KONS',
          creatorSignature: customParams?.signatures?.creatorSignature,
          catatan: customParams?.signatures?.catatan,
          surveyId: matchedSurvey?.id || daftungId,
          materials: customParams.paket2.materials || p2Materials,
          jasaItems: customParams.paket2.jasaItems || p2JasaItems,
        });
      }

      if (customParams.woTiang?.enabled) {
        let tiangMaterials = customParams.woTiang.materials || [...p1Materials, ...p2Materials].filter(
          (m) => m.material.toLowerCase().includes('tiang') || m.kategori?.toLowerCase().includes('tiang')
        );
        if (tiangMaterials.length === 0) {
          tiangMaterials = [
            { kode: "M-TNG-9-200", material: "Tiang Beton 9 Meter / 200 daN", kategori: "TIANG BETON", qtyReksis: 2, qtyAllocated: 2, qtyReserved: 0, qtyTaken: 0, qtyInstalled: 0, qtyReturned: 0, isTaken: false, unit: "Batang" },
            { kode: "M-TNG-12-350", material: "Tiang Beton 12 Meter / 350 daN", kategori: "TIANG BETON", qtyReksis: 1, qtyAllocated: 1, qtyReserved: 0, qtyTaken: 0, qtyInstalled: 0, qtyReturned: 0, isTaken: false, unit: "Batang" },
          ];
        }
        let tiangJasa = customParams.woTiang.jasaItems || [...p1JasaItems, ...p2JasaItems].filter(
          (j) => j.deskripsi.toLowerCase().includes('tiang')
        );
        if (tiangJasa.length === 0) {
          tiangJasa = [
            { kode: "JSA-TNG-09", deskripsi: "Pendirian & Penanaman Tiang Beton 9 Meter", qtyTarget: 2, qtyRealisasi: 0, unit: "btg", bobotPersen: 60, progresPersen: 0 },
            { kode: "JSA-TNG-12", deskripsi: "Pendirian & Penanaman Tiang Beton 12 Meter", qtyTarget: 1, qtyRealisasi: 0, unit: "btg", bobotPersen: 40, progresPersen: 0 },
          ];
        }

        newWos.push({
          id: customParams.woTiang.noWorkOrder || '003.11.WO.TB.2026',
          noWorkOrder: customParams.woTiang.noWorkOrder || '003.11.WO.TB.2026',
          customerName: finalCustomerName,
          idpel: finalIdpel,
          daya: finalDaya,
          tarif: finalTarif,
          location: finalAlamat,
          address: finalAlamat,
          garduInduk: finalGI,
          penyulang: finalPenyulang,
          gardu: finalGardu,
          ulp: finalUlp,
          tipePembangunanGardu: finalTipeGardu,
          kapasitasTrafo: finalKapasitasTrafo,
          jumlahKabelNaik: finalJumlahKabel,
          category: 'WO Tiang',
          vendor: customParams.woTiang.vendor || 'PT. ENERGI BANTEN SEJAHTERA',
          narahubung: customParams.woTiang.narahubung,
          phone: customParams.woTiang.phone,
          contractId: customParams.woTiang.contractId,
          spkNumber: customParams.woTiang.noSpk || '0023.PJ/DAN.02.03/UP3-BTS/2026',
          validFrom: customParams.woTiang.validFrom || '02 Jan 2026',
          validTo: customParams.woTiang.validTo || '31 Des 2026',
          supervisor: customParams.woTiang.pengawas1 || 'Hasian Sitorus (TC Lola Konstruksi)',
          supervisor1: customParams.woTiang.pengawas1 || 'Hasian Sitorus (TC Lola Konstruksi)',
          supervisor2: customParams.woTiang.pengawas2 || '',
          progress: 0,
          status: 'Draf',
          approvalStatus: 'DRAFT',
          appliedAt: nowStr,
          daftungId,
          reservationStatus: 'Belum Reservasi',
          approverName: customParams?.signatures?.approverName || 'WEGIG DIDIK KURNIAWAN',
          approverRole: customParams?.signatures?.approverRole || 'ASMAN KONSTRUKSI',
          approverSignature: customParams?.signatures?.approverSignature,
          creatorName: customParams?.signatures?.creatorName || 'HASIAN EFRAVODITUS SITORUS',
          creatorRole: customParams?.signatures?.creatorRole || 'TC LOLA KONS',
          creatorSignature: customParams?.signatures?.creatorSignature,
          catatan: customParams?.signatures?.catatan,
          surveyId: matchedSurvey?.id || daftungId,
          materials: tiangMaterials,
          jasaItems: tiangJasa,
        });
      }
    } else {
      const ts = String(Date.now()).slice(-3);
      newWos = [
        {
          id: `537.${ts}.WO.2026`,
          customerName,
          idpel,
          category: 'WO Paket 1',
          vendor: 'PT. HILMAN PRIMA PERKASA',
          supervisor: 'Hasian Sitorus (TC Lola Konstruksi)',
          supervisor1: 'Hasian Sitorus (TC Lola Konstruksi)',
          supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
          progress: 0,
          status: 'Draf',
          approvalStatus: 'DRAFT',
          appliedAt: nowStr,
          daftungId,
          reservationStatus: 'Belum Reservasi',
          approverName: 'WEGIG DIDIK KURNIAWAN',
          approverRole: 'ASMAN KONSTRUKSI',
          creatorName: 'HASIAN EFRAVODITUS SITORUS',
          creatorRole: 'TC LOLA KONS',
          surveyId: matchedSurvey?.id || daftungId,
          materials: p1Materials,
          jasaItems: p1JasaItems,
        },
        {
          id: `538.${ts}.WO.2026`,
          customerName,
          idpel,
          category: 'WO Paket 2',
          vendor: 'PT. TAWAKAL KARYA TEKNIK',
          supervisor: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
          supervisor1: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
          supervisor2: '',
          progress: 0,
          status: 'Draf',
          approvalStatus: 'DRAFT',
          appliedAt: nowStr,
          daftungId,
          reservationStatus: 'Belum Reservasi',
          approverName: 'WEGIG DIDIK KURNIAWAN',
          approverRole: 'ASMAN KONSTRUKSI',
          creatorName: 'HASIAN EFRAVODITUS SITORUS',
          creatorRole: 'TC LOLA KONS',
          surveyId: matchedSurvey?.id || daftungId,
          materials: p2Materials,
          jasaItems: p2JasaItems,
        },
      ];
    }

    const count = newWos.length;
    const woLabels = newWos.map((w) => w.id).join(' & ');

    set((state) => ({
      // Jika sebelumnya pernah ada WO untuk daftung ini (misal ditolak/dikembalikan), gantikan dengan yang baru diajukan
      reservationTransactions: [],
  vendorPickupTransactions: [],

  workOrders: [...newWos, ...state.workOrders.filter((w) => w.daftungId !== daftungId)],
      daftungs: state.daftungs.map((d) => 
        d.id === daftungId 
          ? { ...d, woIssued: `${count} Diajukan ke Asman`, status: 'Menunggu Approval' as const, rejectionReason: undefined } 
          : d
      ),
      selectedDaftungIdForWo: null,
    }));
    get().addAudit(`Permohonan Apply WO Daftung ${daftungId} berhasil dibuat (${count} WO: ${woLabels}), menunggu persetujuan Asman`, daftungId, 'Work Order');
    get().showToast(`✓ Permohonan ${count} Work Order (${woLabels}) berhasil diajukan. Menunggu persetujuan Asman Konstruksi.`);
  },

  approveWorkOrder: (id, approverData) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    let targetDaftungId: string | undefined;

    // Penjaga pagu. Hanya dijalankan untuk WO yang belum memotong pagu, supaya
    // persetujuan ulang tidak dihitung dua kali terhadap sisa pagu yang sama.
    const woSemula = get().workOrders.find((w) => w.id === id);
    if (!woSemula) {
      get().showToast(`✗ Work Order ${id} tidak ditemukan — persetujuan dibatalkan`);
      return false;
    }
    if (!isWoCommittingPagu(woSemula)) {
      const cekPagu = checkWoPagu(woSemula, get().contracts, get().workOrders);
      if (cekPagu.status === 'LEBIH') {
        const pesan =
          `beban pagu ${formatRpPresisi(cekPagu.beban)} melebihi sisa pagu SPK ` +
          `${cekPagu.contract?.spkNumber} sebesar ${formatRpPresisi(cekPagu.sisa)}`;
        get().addAudit(`Persetujuan WO ${id} DIBATALKAN SISTEM: ${pesan}.`, id, 'Work Order');
        get().showToast(
          `⚠ Persetujuan WO ${id} dibatalkan — ${pesan}. Sesuaikan RAB atau tambah pagu kontrak.`
        );
        return false;
      }
      if (cekPagu.status === 'TANPA_KONTRAK') {
        get().addAudit(
          `Persetujuan WO ${id}: validasi pagu dilewati karena WO tidak tertaut SPK di Master Kontrak.`,
          id,
          'Work Order'
        );
      }
    }

    set((state) => {
      const targetWo = state.workOrders.find((w) => w.id === id);
      targetDaftungId = targetWo?.daftungId;

      const updatedWos = state.workOrders.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            status: 'Konstruksi' as const,
            approvalStatus: 'APPROVED' as const,
            approvedAt: nowStr,
            approverName: approverData?.name || w.approverName || 'WEGIG DIDIK KURNIAWAN',
            approverRole: approverData?.role || w.approverRole || 'ASMAN KONSTRUKSI',
            approverSignature: approverData?.signature || w.approverSignature,
            catatan: approverData?.catatan || w.catatan,
          };
        }
        return w;
      });

      // Sinkronkan status Daftung atau daftarkan otomatis ke Daftung resmi jika belum ada
      let updatedDaftungs = [...state.daftungs];
      const existingDf = state.daftungs.find(
        (d) => (targetDaftungId && d.id === targetDaftungId) || (targetWo && d.idpel === targetWo.idpel)
      );

      if (existingDf) {
        updatedDaftungs = updatedDaftungs.map((d) => {
          if (d.id === existingDf.id) {
            return {
              ...d,
              status: 'WO Terbit' as const,
              woIssued: 'WO Terbit',
            };
          }
          return d;
        });
      } else if (targetWo) {
        const matchedSrv = state.surveys.find((s) => s.idpel === targetWo.idpel || s.id === targetWo.daftungId);
        const newDfId = generateDaftungId(updatedDaftungs);
        const newDaftungItem: DaftungRecord = {
          id: newDfId,
          idpel: targetWo.idpel,
          customerName: targetWo.customerName,
          source: targetWo.id,
          woIssued: 'WO Terbit',
          nidi: true,
          slo: true,
          status: 'WO Terbit',
          surveyId: matchedSrv?.id || targetWo.daftungId,
          daya: matchedSrv?.dayaBaru || matchedSrv?.daya || '160.000 VA',
          tarif: matchedSrv?.tarifBaru || matchedSrv?.tarif || 'S3',
          ulp: matchedSrv?.ulp || 'UP3 Banten Selatan',
          location: matchedSrv?.location || 'Wilayah Kerja UP3 Banten Selatan',
        };
        updatedDaftungs = [newDaftungItem, ...updatedDaftungs];
      }

      return {
        workOrders: updatedWos,
        daftungs: updatedDaftungs,
      };
    });

    get().addAudit(`Asman menyetujui Work Order ${id}: resmi berstatus Konstruksi (WO Terbit)`, id, 'Work Order');
    get().showToast(`✓ Work Order ${id} resmi disetujui oleh Asman Konstruksi dan berstatus Terbit`);
    return true;
  },

  rejectWorkOrder: (id, reason) => {
    set((state) => {
      const updatedWos = state.workOrders.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            status: 'Dikembalikan' as const,
            approvalStatus: 'REJECTED' as const,
            rejectionReason: reason,
          };
        }
        return w;
      });

      return {
        workOrders: updatedWos,
      };
    });

    get().addAudit(`Asman menolak/mengembalikan Work Order ${id} ke Admin WO: ${reason}`, id, 'Work Order');
    get().showToast(`Work Order ${id} dikembalikan ke Admin WO: ${reason}`);
  },

  resubmitWorkOrder: (id, updates) => {
    set((state) => {
      const updatedWos = state.workOrders.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            ...updates,
            status: 'Menunggu Persetujuan Asman' as const,
            approvalStatus: 'PENDING' as const,
            appliedAt: new Date().toISOString(),
          };
        }
        return w;
      });

      return {
        workOrders: updatedWos,
      };
    });

    get().addAudit(`Admin WO memperbaiki & mengajukan ulang Work Order ${id} ke Asman Konstruksi`, id, 'Work Order');
    get().showToast(`✓ Work Order ${id} berhasil diajukan ulang ke Asman`);
  },

  submitWoToAsman: (id) => {
    set((state) => {
      const nowStr = new Date().toLocaleString('id-ID');
      const updatedWos = state.workOrders.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            status: 'Menunggu Persetujuan Asman' as const,
            approvalStatus: 'PENDING' as const,
            submittedToAsmanAt: nowStr,
          };
        }
        return w;
      });

      return {
        workOrders: updatedWos,
      };
    });

    get().addAudit(`Admin WO mengajukan Work Order ${id} ke meja Asman Konstruksi untuk persetujuan`, id, 'Work Order');
    get().showToast(`✓ Work Order ${id} berhasil diajukan ke Asman Konstruksi!`);
  },

  updateWoVolumes: (id, volumes, editedBy) => {
    const wo = get().workOrders.find((w) => w.id === id);
    if (!wo) {
      get().showToast(`✗ Work Order ${id} tidak ditemukan`);
      return false;
    }
    if (!isWoEditable(wo)) {
      get().showToast(`⚠ Volume WO ${id} hanya dapat direvisi pada tahap Draf atau Menunggu Persetujuan Asman`);
      return false;
    }

    const materials = wo.materials || [];
    const jasaItems = wo.jasaItems || [];
    // Item yang sejak awal bervolume 0 boleh tetap 0; volume yang diubah wajib > 0.
    const isValidVolume = (v: number, current: number) => Number.isFinite(v) && (v > 0 || v === current);
    if (
      volumes.materials.length !== materials.length ||
      volumes.jasaItems.length !== jasaItems.length ||
      !materials.every((m, i) => isValidVolume(volumes.materials[i], m.qtyAllocated || m.qtyReksis || 0)) ||
      !jasaItems.every((j, i) => isValidVolume(volumes.jasaItems[i], j.qtyTarget || 0))
    ) {
      get().showToast('⚠ Volume harus berupa angka lebih dari 0 untuk setiap item');
      return false;
    }

    const changedMaterials = materials.filter((m, i) => (m.qtyAllocated || m.qtyReksis || 0) !== volumes.materials[i]).length;
    const changedJasa = jasaItems.filter((j, i) => (j.qtyTarget || 0) !== volumes.jasaItems[i]).length;

    const updatedMaterials = materials.map((m, i) => ({
      ...m,
      qtyReksis: volumes.materials[i],
      qtyAllocated: volumes.materials[i],
    }));

    // Bobot jasa mengikuti porsi nilai rupiah tiap item, sama seperti saat WO dibuat.
    const totalJasaVal = jasaItems.reduce((acc, j, i) => acc + volumes.jasaItems[i] * (j.hargaSatuan || 0), 0);
    const updatedJasa = jasaItems.map((j, i) => {
      const vol = volumes.jasaItems[i];
      return {
        ...j,
        qtyTarget: vol,
        bobotPersen: totalJasaVal > 0
          ? Math.round(((vol * (j.hargaSatuan || 0)) / totalJasaVal) * 1000) / 10
          : Math.round((100 / jasaItems.length) * 10) / 10,
        progresPersen: vol > 0
          ? Math.min(100, Math.round(((j.qtyRealisasi || 0) / vol) * 100))
          : j.progresPersen || 0,
      };
    });

    const nilaiSemula = getWoJasaValue(wo) + getWoMaterialValue(wo);
    const revised = { ...wo, materials: updatedMaterials, jasaItems: updatedJasa };
    const nilaiBaru = getWoJasaValue(revised) + getWoMaterialValue(revised);
    const editor = editedBy?.trim() || wo.approverName || 'ASMAN KONSTRUKSI';
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === id
          ? {
              ...w,
              materials: updatedMaterials,
              jasaItems: wo.jasaItems ? updatedJasa : w.jasaItems,
              volumeEditedAt: nowStr,
              volumeEditedBy: editor,
            }
          : w
      ),
    }));

    get().addAudit(
      `${editor} merevisi volume WO ${id} (${changedMaterials} material, ${changedJasa} jasa): ` +
        `nilai rencana ${formatRpPresisi(nilaiSemula)} → ${formatRpPresisi(nilaiBaru)}`,
      id,
      'Work Order'
    );
    get().showToast(`✓ Volume WO ${id} berhasil direvisi`);
    return true;
  },

  removeWoMaterialItem: (woId, itemIndex) => {
    const wo = get().workOrders.find((w) => w.id === woId);
    if (!wo) {
      get().showToast(`✗ Work Order ${woId} tidak ditemukan`);
      return;
    }
    if (!isWoEditable(wo)) {
      get().showToast(`⚠ Item WO ${woId} hanya dapat dihapus sebelum disetujui`);
      return;
    }

    const mats = wo.materials || [];
    if (itemIndex < 0 || itemIndex >= mats.length) return;
    const removedItem = mats[itemIndex];
    const newMats = mats.filter((_, idx) => idx !== itemIndex);

    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === woId
          ? {
              ...w,
              materials: newMats,
              volumeEditedAt: nowStr,
              volumeEditedBy: 'Admin WO',
            }
          : w
      ),
    }));

    get().addAudit(
      `Admin WO menghapus material "${removedItem.material}" dari WO ${woId}`,
      woId,
      'Work Order'
    );
    get().showToast(`✓ Material "${removedItem.material}" berhasil dihapus dari WO`);
  },

  removeWoJasaItem: (woId, itemIndex) => {
    const wo = get().workOrders.find((w) => w.id === woId);
    if (!wo) {
      get().showToast(`✗ Work Order ${woId} tidak ditemukan`);
      return;
    }
    if (!isWoEditable(wo)) {
      get().showToast(`⚠ Item WO ${woId} hanya dapat dihapus sebelum disetujui`);
      return;
    }

    const jasa = wo.jasaItems || [];
    if (itemIndex < 0 || itemIndex >= jasa.length) return;
    const removedItem = jasa[itemIndex];
    const newJasa = jasa.filter((_, idx) => idx !== itemIndex);

    // Recalculate bobot persen
    const totalJasaVal = newJasa.reduce((acc, j) => acc + (j.qtyTarget || 0) * (j.hargaSatuan || 0), 0);
    const reweightedJasa = newJasa.map((j) => {
      const vol = j.qtyTarget || 0;
      return {
        ...j,
        bobotPersen: totalJasaVal > 0
          ? Math.round(((vol * (j.hargaSatuan || 0)) / totalJasaVal) * 1000) / 10
          : (newJasa.length > 0 ? Math.round((100 / newJasa.length) * 10) / 10 : 0),
      };
    });

    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === woId
          ? {
              ...w,
              jasaItems: reweightedJasa,
              volumeEditedAt: nowStr,
              volumeEditedBy: 'Admin WO',
            }
          : w
      ),
    }));

    get().addAudit(
      `Admin WO menghapus jasa "${removedItem.deskripsi}" dari WO ${woId}`,
      woId,
      'Work Order'
    );
    get().showToast(`✓ Jasa "${removedItem.deskripsi}" berhasil dihapus dari WO`);
  },

  updateWoSignatures: (woId, signatures) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === woId
          ? {
              ...w,
              ...(signatures.approverName && { approverName: signatures.approverName }),
              ...(signatures.approverRole && { approverRole: signatures.approverRole }),
              ...(signatures.approverSignature !== undefined && { approverSignature: signatures.approverSignature }),
              ...(signatures.creatorName && { creatorName: signatures.creatorName }),
              ...(signatures.creatorRole && { creatorRole: signatures.creatorRole }),
              ...(signatures.creatorSignature !== undefined && { creatorSignature: signatures.creatorSignature }),
            }
          : w
      ),
    }));
  },

  updateWoProgress: (id, progress, note, progressMaterial, progressJasa, updatedJasaItems, updatedMaterials, milestones) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== id) return w;
        const mat = progressMaterial !== undefined ? progressMaterial : (w.progressMaterial || progress);
        const jas = progressJasa !== undefined ? progressJasa : (w.progressJasa || progress);
        const overall = progress !== undefined ? progress : Math.round((mat + jas) / 2);

        return {
          ...w,
          progress: overall,
          progressMaterial: mat,
          progressJasa: jas,
          milestones: milestones || w.milestones,
          jasaItems: updatedJasaItems || w.jasaItems,
          materials: updatedMaterials || w.materials,
          ...applyWoStatus(w, overall >= 100 ? 'Selesai' : 'Konstruksi'),
        };
      }),
    }));
    get().addAudit(`Update progress WO ${id} (Total: ${progress}%, Material: ${progressMaterial}%, Jasa: ${progressJasa}%): ${note || '-'}`, id, 'Pengawasan');
  },

  updateWoReservation: (id, status) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) => (w.id === id ? { ...w, reservationStatus: status, reservationLink: `https://promotor.pln.co.id/r/tk-${id.toLowerCase()}` } : w)),
    }));
    get().addAudit(`Reservasi material WO ${id} dibuat: status ${status}`, id, 'Gudang & Reservasi');
    get().showToast(`✓ Reservasi material ${id} berhasil diperbarui`);
  },

  reserveMaterialWo: (woId, reservationNumber, reservationDate, updatedMaterials, isHold, holdReason, notes, reservationNumberNonStock) => {
    const targetWo = get().workOrders.find((w) => w.id === woId);
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const trxId = `TRX-RES-${Date.now().toString().slice(-6)}`;

    // Buat histori transaksi reservasi pengawas
    const matsToRecord = updatedMaterials || targetWo?.materials || [];
    const newTrx: ReservationTransaction = {
      id: trxId,
      woId,
      noWorkOrder: targetWo?.noWorkOrder || woId,
      date: reservationDate || nowStr,
      supervisorName: targetWo?.supervisor || 'Pengawas Lapangan',
      vendorName: targetWo?.vendor || 'Vendor Rekanan',
      customerName: targetWo?.customerName || '-',
      category: targetWo?.category || 'WO',
      reservationNumberStock: reservationNumber || undefined,
      reservationNumberNonStock: reservationNumberNonStock || undefined,
      notes: notes,
      items: matsToRecord.map((m) => {
        const isTiang = (m.kategori || '').toUpperCase().includes('TIANG') ||
          m.material.toLowerCase().includes('pole;concrete') ||
          m.material.toLowerCase().startsWith('tiang beton') ||
          (m.material.toLowerCase().includes('tiang') && !m.material.toLowerCase().includes('serandang')) ||
          (m.kode && m.kode.toLowerCase().includes('tng'));
        const isStok = m.stockType ? m.stockType === 'STOK' : !isTiang;
        const req = m.qtyAllocated || m.qtyReksis || 1;
        const curRes = m.qtyReserved !== undefined ? m.qtyReserved : req;
        const prevTaken = m.qtyTaken || 0;
        const batchRes = Math.max(0, curRes - prevTaken);
        return {
          material: m.material,
          kode: m.kode,
          unit: m.unit,
          categoryType: isStok ? 'STOK' : 'NON_STOK',
          qtyMaterial: req,
          qtyReservedCurrent: batchRes > 0 ? batchRes : curRes,
          qtySudahReservasi: curRes,
          qtyBelumReservasi: Math.max(0, req - curRes),
        };
      }),
    };

    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const finalMats = updatedMaterials || w.materials || [];
        const hasAnySapRes = finalMats.some((m) => (m.qtyReservedSap || 0) > 0);
        const hasAnyNonSapRes = finalMats.some((m) => (m.qtyReservedNonSap || 0) > 0);
        const finalResNo = reservationNumber || (hasAnySapRes ? w.reservationNumber : undefined) || undefined;
        const finalResNoNonStock = reservationNumberNonStock || (hasAnyNonSapRes ? w.reservationNumberNonStock : undefined) || undefined;
        const primaryResNo = finalResNo || finalResNoNonStock || `RES/UP3-BTS/${new Date().getFullYear()}/${woId.split('.').pop() || '001'}`;

        const isAllTaken = finalMats.length > 0 && finalMats.every((m) => !m.isHold && (m.qtyTaken || 0) >= (m.qtyAllocated || m.qtyReksis || 1));
        const hasTakenAny = finalMats.some((m) => (m.qtyTaken || 0) > 0);
        const nextResStatus = isHold
          ? ('Hold' as const)
          : isAllTaken
          ? ('Selesai' as const)
          : hasTakenAny
          ? ('Siap Ambil Sebagian' as const)
          : ('Siap Ambil' as const);

        return {
          ...w,
          reservationNumber: finalResNo,
          reservationNumberNonStock: finalResNoNonStock,
          reservationDate,
          reservationStatus: nextResStatus,
          isHold: Boolean(isHold),
          holdReason: isHold ? holdReason : undefined,
          reservationNotes: notes,
          reservationNotesNonStock: undefined,
          materials: finalMats,
          reservationLink: `https://promotor.pln.co.id/r/${primaryResNo.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        };
      }),
      reservationTransactions: [newTrx, ...state.reservationTransactions],
    }));
    if (isHold) {
      get().addAudit(`Pengawas menahan (HOLD) Reservasi Material WO ${woId}: ${holdReason || '-'}`, woId, 'Reservasi Material');
      get().showToast(`⚠️ Reservasi WO ${woId} ditahan (HOLD): ${holdReason || '-'}`);
    } else {
      const resLabel = [reservationNumber && `SAP: ${reservationNumber}`, reservationNumberNonStock && `Non-SAP: ${reservationNumberNonStock}`].filter(Boolean).join(' & ');
      get().addAudit(`Pengawas menerbitkan Reservasi Material (${resLabel}) untuk WO ${woId}`, woId, 'Reservasi Material');
      get().showToast(`✓ Reservasi (${resLabel}) berhasil diterbitkan. Status: Siap Ambil oleh Vendor.`);
    }
  },

  updateWoMaterialItem: (woId, materialName, updates) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const updatedMats = (w.materials || []).map((m) => {
          if (m.material === materialName) {
            return { ...m, ...updates };
          }
          return m;
        });

        // Hitung status penahanan dan pengambilan
        const hasUnheldToTake = updatedMats.some((m) => !m.isHold && (!m.isTaken || (m.qtyTaken || 0) === 0));
        const hasTakenAny = updatedMats.some((m) => m.isTaken && (m.qtyTaken || 0) > 0);
        let nextResStatus = w.reservationStatus;
        if (hasUnheldToTake) {
          nextResStatus = hasTakenAny ? ('Siap Ambil Sebagian' as const) : ('Siap Ambil' as const);
        }

        return { ...w, materials: updatedMats, reservationStatus: nextResStatus };
      }),
    }));
    get().addAudit(`Edit item material ${materialName} pada WO ${woId}`, woId, 'Reservasi Material');
    get().showToast(`✓ Data material ${materialName} berhasil diperbarui.`);
  },

  replaceMaterialWo: (woId, originalMaterial, replacementMaterial, qty, reason) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const currentSubs = w.materialSubstitutions || [];
        const updatedMats = (w.materials || []).map((m) => {
          if (m.material === originalMaterial) {
            return {
              ...m,
              material: replacementMaterial,
              originalMaterialName: originalMaterial,
              isReplaced: true,
              qtyAllocated: qty,
              qtyReksis: qty,
              verificationNote: `Diganti dari ${originalMaterial}: ${reason}`,
            };
          }
          return m;
        });

        return {
          ...w,
          materials: updatedMats,
          materialSubstitutions: [
            ...currentSubs,
            {
              originalMaterial,
              replacementMaterial,
              qty,
              reason,
              timestamp: nowStr,
            },
          ],
        };
      }),
    }));
    get().addAudit(`Pengawas mengganti material ${originalMaterial} -> ${replacementMaterial} (Qty: ${qty}) untuk WO ${woId}`, woId, 'Reservasi Material');
    get().showToast(`✓ Material berhasil diganti menjadi ${replacementMaterial}`);
  },

  holdMaterialWo: (woId, holdReason) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        return {
          ...w,
          reservationStatus: 'Hold' as const,
          isHold: true,
          holdReason,
        };
      }),
    }));
    get().addAudit(`Pengawas menahan (HOLD) WO ${woId}: ${holdReason}`, woId, 'Reservasi Material');
    get().showToast(`⚠️ WO ${woId} berstatus HOLD: ${holdReason}`);
  },

  unholdMaterialWo: (woId) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        return {
          ...w,
          reservationStatus: 'Siap Ambil' as const,
          isHold: false,
          holdReason: undefined,
        };
      }),
    }));
    get().addAudit(`Pengawas membuka status HOLD WO ${woId}`, woId, 'Reservasi Material');
    get().showToast(`✓ WO ${woId} telah dibuka dari HOLD (Siap Ambil)`);
  },

  vendorConfirmMaterialTaken: (
    woId,
    sjNumber,
    sjDate,
    photoUrl,
    materialsTaken,
    notes,
    reservationNumber,
    giNumber,
    receiptPhotos
  ) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const targetWo = get().workOrders.find((w) => w.id === woId);
    const pkpTrxId = `TRX-PKP-${Date.now().toString().slice(-6)}`;

    const sjList: string[] = (Array.isArray(photoUrl)
      ? photoUrl
      : (photoUrl ? [photoUrl] : [])
    ).filter((u) => Boolean(u) && !u.includes('photo-1586528116311-ad8dd3c8310d'));
    const rcList: string[] = (receiptPhotos || []).filter(
      (u) => Boolean(u) && !u.includes('photo-1586528116311-ad8dd3c8310d')
    );

    const allBatchItems = materialsTaken.map((t) => {
      const orig = (targetWo?.materials || []).find((m) => m.material === t.material);
      const isTiang = (orig?.kategori || '').toUpperCase().includes('TIANG') ||
        t.material.toLowerCase().includes('pole;concrete') ||
        t.material.toLowerCase().startsWith('tiang beton') ||
        (t.material.toLowerCase().includes('tiang') && !t.material.toLowerCase().includes('serandang')) ||
        (orig?.kode && orig.kode.toLowerCase().includes('tng'));
      const isStok = t.channel ? t.channel === 'SAP' : (orig?.stockType ? orig.stockType === 'STOK' : !isTiang);
      const req = orig?.qtyAllocated || orig?.qtyReksis || orig?.qtyReserved || 1;
      const prevTaken = orig?.qtyTaken || 0;
      const curTakenThisBatch = t.qtyTakenBatch !== undefined
        ? Math.max(0, t.qtyTakenBatch)
        : Math.max(0, t.qtyTaken - prevTaken);
      return {
        material: t.material,
        kode: orig?.kode,
        unit: orig?.unit || 'bh',
        categoryType: (isStok ? 'STOK' : 'NON_STOK') as 'STOK' | 'NON_STOK',
        qtyReserved: req,
        qtyTakenCurrent: curTakenThisBatch,
        totalTakenAccumulated: t.qtyTaken,
        sisaRemaining: Math.max(0, req - t.qtyTaken),
      };
    });

    // Hanya catat material yang benar-benar diambil pada batch Surat Jalan ini (qtyTakenCurrent > 0).
    // Jika semua 0 (mis. hanya edit nomor SJ tanpa tambah volume), fallback ke item yang sudah pernah diambil.
    const activeBatchItems = allBatchItems.filter((it) => it.qtyTakenCurrent > 0);
    const trxItems = activeBatchItems.length > 0
      ? activeBatchItems
      : allBatchItems
          .filter((it) => it.totalTakenAccumulated > 0)
          .map((it) => ({ ...it, qtyTakenCurrent: it.totalTakenAccumulated }));

    const newPickupTrx: VendorPickupTransaction = {
      id: pkpTrxId,
      woId,
      noWorkOrder: targetWo?.noWorkOrder || woId,
      date: sjDate || nowStr,
      vendorName: targetWo?.vendor || 'Vendor Rekanan',
      supervisorName: targetWo?.supervisor || 'Pengawas Lapangan',
      customerName: targetWo?.customerName || '-',
      suratJalanNumber: sjNumber,
      reservationNumber: reservationNumber !== undefined ? reservationNumber : targetWo?.reservationNumber,
      giNumber: giNumber !== undefined ? giNumber : targetWo?.giNumber,
      suratJalanPhotos: sjList,
      notes: notes,
      items: trxItems,
    };

    set((state) => ({
      vendorPickupTransactions: [newPickupTrx, ...state.vendorPickupTransactions],
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const updatedMats = (w.materials || []).map((m) => {
          const match = materialsTaken.find((t) => t.material === m.material);
          if (m.isHold) {
            return {
              ...m,
              isTaken: false,
              qtyTaken: 0,
            };
          }
          if (match) {
            const taken = match.qtyTaken;
            const hasTaken = taken > 0;
            // Item yang volumenya tidak berubah di batch ini mempertahankan status verifikasi sebelumnya
            const isUnchanged = (m.qtyTaken || 0) === taken && Boolean(m.isVerified);
            return {
              ...m,
              isTaken: hasTaken,
              qtyTaken: taken,
              qtyTakenSap: match.qtyTakenSap !== undefined ? match.qtyTakenSap : m.qtyTakenSap,
              qtyTakenNonSap: match.qtyTakenNonSap !== undefined ? match.qtyTakenNonSap : m.qtyTakenNonSap,
              takenAt: hasTaken ? (m.takenAt || nowStr) : undefined,
              isVerified: isUnchanged ? true : false,
            };
          }
          return m;
        });

        const hasHeld = updatedMats.some((m) => m.isHold);
        const hasRemainingToTake = updatedMats.some((m) => {
          if (m.isHold) return true;
          const fullReq = m.qtyAllocated || m.qtyReksis || 1;
          return (m.qtyTaken || 0) < fullReq;
        });
        const isAllTakenByVendor = !hasRemainingToTake && !hasHeld;

        const curMilestones = w.milestones || {
          material: 0,
          konstruksi: 0,
          konduktor: 0,
          gardu: 0,
          komisioning: 0,
          energize: 0,
        };

        // Progres material HANYA bertambah dari material yang SUDAH diverifikasi pengawas (isVerified === true)
        const verifiedMats = updatedMats.filter((m) => m.isVerified && !m.isHold);
        let matProgress = 0;
        if (updatedMats.length > 0 && verifiedMats.length > 0) {
          const hasRemainingToVerify = updatedMats.some((m) => {
            if (m.isHold || !m.isVerified) return true;
            const fullReq = m.qtyAllocated || m.qtyReksis || 1;
            return (m.qtyTaken || 0) < fullReq;
          });
          const isAllVerifiedAndCompleted = !hasRemainingToVerify && !hasHeld;

          const totalFulfillment = updatedMats.reduce((sum, m) => {
            if (m.isHold || !m.isVerified) return sum;
            const fullReq = m.qtyAllocated || m.qtyReksis || 1;
            const taken = m.qtyTaken || 0;
            return sum + (fullReq > 0 ? Math.min(1, taken / fullReq) : 0);
          }, 0);
          const calculatedMatProgress = Math.round((totalFulfillment / updatedMats.length) * 100);
          matProgress = isAllVerifiedAndCompleted ? 100 : Math.min(99, calculatedMatProgress);
        }

        const prevSjList = w.suratJalanList || (w.suratJalanNumber ? [{
          suratJalanNumber: w.suratJalanNumber,
          suratJalanDate: w.suratJalanDate || nowStr,
          reservationNumber: w.reservationNumber,
          giNumber: w.giNumber,
          photos: w.suratJalanPhotos || (w.suratJalanPhoto ? [w.suratJalanPhoto] : []),
          notes: w.vendorReceiptNotes,
          status: w.sjVerificationStatus === 'SESUAI' ? ('SESUAI' as const) : ('BELUM_DIPERIKSA' as const),
        }] : []);

        const newSjEntry = {
          suratJalanNumber: sjNumber,
          suratJalanDate: sjDate || nowStr,
          reservationNumber: reservationNumber !== undefined ? reservationNumber : w.reservationNumber,
          giNumber: giNumber !== undefined ? giNumber : w.giNumber,
          photos: sjList,
          receiptPhotos: rcList,
          notes: notes,
          items: trxItems.map((it) => ({
            material: it.material,
            qtyTaken: it.qtyTakenCurrent,
          })),
          status: 'BELUM_DIPERIKSA' as const,
        };
        const updatedSjList = [newSjEntry, ...prevSjList.filter((s) => s.suratJalanNumber !== sjNumber)];

        const overallProgress = Math.round((matProgress + (w.progressJasa || 0)) / 2);

        return {
          ...w,
          suratJalanNumber: sjNumber,
          suratJalanDate: sjDate || nowStr,
          suratJalanPhoto: sjList[0] || undefined,
          suratJalanPhotos: sjList,
          suratJalanList: updatedSjList,
          giNumber: giNumber !== undefined ? giNumber : w.giNumber,
          receiptPhotos: rcList,
          vendorReceiptConfirmed: true,
          vendorReceiptDate: nowStr,
          vendorReceiptNotes: notes,
          reservationStatus: isAllTakenByVendor ? ('Selesai' as const) : ('Siap Ambil Sebagian' as const),
          ...applyWoStatus(w, 'Verifikasi SJ'),
          sjVerificationStatus: 'BELUM_DIPERIKSA' as const,
          materials: updatedMats,
          progress: overallProgress,
          progressMaterial: matProgress,
          milestones: {
            ...curMilestones,
            material: matProgress,
          },
        };
      }),
    }));
    get().addAudit(`Vendor mengonfirmasi penerimaan material & Surat Jalan ${sjNumber} (No. Reservasi: ${reservationNumber || '-'}, No. GI: ${giNumber || '-'}) untuk WO ${woId}`, woId, 'Menu Vendor');
    get().showToast(`✓ Material diterima & Surat Jalan ${sjNumber} tersimpan. Menunggu verifikasi Pengawas.`);
  },

  pengawasVerifyReceipt: (woId, verifiedMaterials, notes, verifierName, suratJalanNumber) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => {
      let hasSelisih = false;
      const targetWo = state.workOrders.find((w) => w.id === woId);
      const targetSjNo = suratJalanNumber || targetWo?.suratJalanNumber;

      // Cek selisih berdasarkan klaim Surat Jalan vs fisik yang diterima pengawas
      verifiedMaterials.forEach((v) => {
        if (v.qtyVendorClaim !== undefined && v.qtyTaken !== v.qtyVendorClaim) {
          hasSelisih = true;
        }
      });

      // 1. Update status & item fisik pada transaksi vendorPickupTransactions
      const updatedPickupTxs = state.vendorPickupTransactions.map((tx) => {
        if (tx.woId === woId && (!targetSjNo || tx.suratJalanNumber === targetSjNo)) {
          const updatedTxItems = (tx.items || []).map((it) => {
            const match = verifiedMaterials.find((v) => v.material === it.material);
            if (!match) return it;
            const delta = match.qtyTaken - (match.qtyVendorClaim ?? it.qtyTakenCurrent);
            return {
              ...it,
              qtyTakenCurrent: match.qtyTaken,
              totalTakenAccumulated: Math.max(0, (it.totalTakenAccumulated || 0) + delta),
            };
          });
          return {
            ...tx,
            items: updatedTxItems,
            status: (hasSelisih ? 'ADA_SELISIH' : 'SESUAI') as 'ADA_SELISIH' | 'SESUAI',
            verifiedAt: nowStr,
            verifiedBy: verifierName,
            verificationNotes: notes,
          };
        }
        return tx;
      });

      // 2. Update status pada workOrders
      const updatedWos = state.workOrders.map((w) => {
        if (w.id !== woId) return w;

        // Gabungkan list Surat Jalan dari suratJalanList & vendorPickupTransactions yang ada
        const woPickupTxs = updatedPickupTxs.filter((tx) => tx.woId === woId);
        const existingList = w.suratJalanList || [];

        const allKnownSjNos = Array.from(new Set([
          ...existingList.map((s) => s.suratJalanNumber),
          ...woPickupTxs.map((t) => t.suratJalanNumber),
          ...(w.suratJalanNumber ? [w.suratJalanNumber] : []),
          ...(targetSjNo ? [targetSjNo] : []),
        ])).filter(Boolean);

        const updatedSjList = allKnownSjNos.map((sjNo) => {
          const matchedExisting = existingList.find((s) => s.suratJalanNumber === sjNo);
          const matchedTx = woPickupTxs.find((t) => t.suratJalanNumber === sjNo);
          const isTarget = sjNo === targetSjNo;

          const currentStatus = isTarget
            ? ((hasSelisih ? 'ADA_SELISIH' : 'SESUAI') as 'ADA_SELISIH' | 'SESUAI')
            : (matchedExisting?.status || matchedTx?.status || 'BELUM_DIPERIKSA');

          const prevItems = matchedExisting?.items || matchedTx?.items?.map((it) => ({
            material: it.material,
            qtyTaken: it.qtyTakenCurrent,
          }));
          const updatedSjItems = isTarget
            ? verifiedMaterials
                .filter((v) => (v.qtyVendorClaim || 0) > 0 || v.qtyTaken > 0)
                .map((v) => ({ material: v.material, qtyTaken: v.qtyTaken, note: v.note }))
            : prevItems;

          return {
            suratJalanNumber: sjNo,
            suratJalanDate: matchedExisting?.suratJalanDate || matchedTx?.date || w.suratJalanDate || nowStr,
            reservationNumber: matchedExisting?.reservationNumber || matchedTx?.reservationNumber || w.reservationNumber,
            giNumber: matchedExisting?.giNumber || matchedTx?.giNumber || w.giNumber,
            photos: matchedExisting?.photos || matchedTx?.suratJalanPhotos || w.suratJalanPhotos || [],
            receiptPhotos: matchedExisting?.receiptPhotos || w.receiptPhotos || [],
            notes: matchedExisting?.notes || matchedTx?.notes || w.vendorReceiptNotes,
            items: updatedSjItems,
            status: currentStatus as 'BELUM_DIPERIKSA' | 'SESUAI' | 'ADA_SELISIH',
            verifiedAt: isTarget ? nowStr : (matchedExisting?.verifiedAt || matchedTx?.verifiedAt),
            verifiedBy: isTarget ? verifierName : (matchedExisting?.verifiedBy || matchedTx?.verifiedBy),
            verificationNotes: isTarget ? notes : (matchedExisting?.verificationNotes || matchedTx?.verificationNotes),
          };
        });

        // Hitung status verifikasi global WO
        const allVerified = updatedSjList.length > 0 && updatedSjList.every((sj) => sj.status === 'SESUAI');
        const allInspected = updatedSjList.length > 0 && updatedSjList.every((sj) => sj.status === 'SESUAI' || sj.status === 'ADA_SELISIH');
        const anySelisih = updatedSjList.some((sj) => sj.status === 'ADA_SELISIH');

        // Deteksi apakah SJ yang diverifikasi ini adalah jalur Non-SAP
        const targetSjObj = updatedSjList.find((s) => s.suratJalanNumber === targetSjNo);
        const isNonSapSj = Boolean(
          (targetSjObj?.reservationNumber && w.reservationNumberNonStock && targetSjObj.reservationNumber === w.reservationNumberNonStock) ||
          (targetSjNo && targetSjNo.toLowerCase().includes('nonsap'))
        );

        // Akumulasi qtyTaken secara benar (tidak menimpa pengambilan tahap sebelumnya dengan angka SJ tahap ini saja!)
        const updatedMats = (w.materials || []).map((m) => {
          const match = verifiedMaterials.find(
            (v) => v.material === m.material && ((v.qtyVendorClaim !== undefined ? v.qtyVendorClaim > 0 : false) || v.qtyTaken > 0)
          );
          if (match) {
            const claim = match.qtyVendorClaim !== undefined ? match.qtyVendorClaim : match.qtyTaken;
            const delta = match.qtyTaken - claim;
            const isItemSelisih = delta !== 0;

            // Jika WO hanya punya 1 SJ, pakai langsung match.qtyTaken; jika multi-SJ bertahap, sesuaikan total akumulasi dengan delta
            const prevTotalTaken = m.qtyTaken !== undefined && (m.qtyTaken || 0) >= claim ? (m.qtyTaken || 0) : claim;
            const newTotalTaken = updatedSjList.length <= 1
              ? match.qtyTaken
              : Math.max(0, prevTotalTaken + delta);

            let nextTakenSap = m.qtyTakenSap;
            let nextTakenNonSap = m.qtyTakenNonSap;
            if (delta !== 0) {
              if (isNonSapSj && nextTakenNonSap !== undefined) {
                nextTakenNonSap = Math.max(0, nextTakenNonSap + delta);
              } else if (!isNonSapSj && nextTakenSap !== undefined) {
                nextTakenSap = Math.max(0, nextTakenSap + delta);
              }
            }

            return {
              ...m,
              isTaken: newTotalTaken > 0,
              qtyTaken: newTotalTaken,
              qtyTakenSap: nextTakenSap,
              qtyTakenNonSap: nextTakenNonSap,
              isVerified: newTotalTaken > 0,
              verificationNote: match.note || (isItemSelisih ? `Selisih fisik vs klaim SJ: ${match.qtyTaken} dari ${claim}` : 'Sesuai fisik Surat Jalan'),
            };
          }

          // Jika material tidak diambil pada SJ tahap ini tetapi sudah diambil pada SJ tahap sebelumnya:
          // bila seluruh SJ sudah diperiksa, pastikan isVerified = true
          if (allInspected && (m.qtyTaken || 0) > 0 && !m.isVerified) {
            return {
              ...m,
              isVerified: true,
              verificationNote: m.verificationNote || 'Sesuai fisik Surat Jalan',
            };
          }
          return m;
        });

        // Hitung progres pemenuhan material terhadap kebutuhan penuh WO (qtyAllocated / qtyReksis)
        const hasHeld = updatedMats.some((m) => m.isHold);
        const hasRemainingToTakeOrVerify = updatedMats.some((m) => {
          if (m.isHold) return true;
          if (!m.isVerified) return true;
          const fullReq = m.qtyAllocated || m.qtyReksis || 1;
          return (m.qtyTaken || 0) < fullReq;
        });
        const isAllCompleted = !hasRemainingToTakeOrVerify && !hasHeld && allVerified;

        let matProgress = 0;
        if (updatedMats.length > 0) {
          const totalFulfillment = updatedMats.reduce((sum, m) => {
            if (m.isHold || !m.isVerified) return sum;
            const fullReq = m.qtyAllocated || m.qtyReksis || 1;
            const taken = m.qtyTaken || 0;
            return sum + (fullReq > 0 ? Math.min(1, taken / fullReq) : 0);
          }, 0);
          const calculatedMatProgress = Math.round((totalFulfillment / updatedMats.length) * 100);
          matProgress = isAllCompleted ? 100 : Math.min(99, calculatedMatProgress);
        }

        const overallProgress = Math.round((matProgress + (w.progressJasa || 0)) / 2);
        const nextStatus: Exclude<WorkOrderRecord['status'], 'Closeout'> =
          overallProgress >= 100
            ? 'Selesai'
            : (w.status === 'Verifikasi SJ' && allVerified
                ? 'Konstruksi'
                : (w.status === 'Closeout' ? (w.statusBeforeCloseout || 'Konstruksi') : w.status));

        return {
          ...w,
          ...applyWoStatus(w, nextStatus),
          reservationStatus: isAllCompleted ? ('Selesai' as const) : w.reservationStatus,
          progress: overallProgress,
          progressMaterial: matProgress,
          milestones: {
            ...(w.milestones || { material: 0, konstruksi: 0, konduktor: 0, gardu: 0, komisioning: 0, energize: 0 }),
            material: matProgress,
          },
          sjVerificationStatus: anySelisih ? ('ADA_SELISIH' as const) : allVerified ? ('SESUAI' as const) : ('BELUM_DIPERIKSA' as const),
          sjVerifiedAt: nowStr,
          sjVerifiedBy: verifierName,
          sjVerificationNotes: notes,
          suratJalanList: updatedSjList,
          materials: updatedMats,
        };
      });

      return {
        workOrders: updatedWos,
        vendorPickupTransactions: updatedPickupTxs,
      };
    });
    get().addAudit(`Pengawas ${verifierName} memverifikasi fisik material Surat Jalan ${suratJalanNumber || ''} WO ${woId}`, woId, 'Menu Pengawas');
    get().showToast(`✓ Verifikasi material diterima untuk WO ${woId} berhasil disimpan.`);
  },

  updateWoGiInfo: (woId, giNumber, giStatus, catatan, userInputBy) => {
    const nowStr = new Date().toISOString();
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === woId
          ? {
              ...w,
              giNumber: giNumber.trim(),
              giStatus,
              giCatatan: catatan,
              giInputDate: nowStr,
              giInputBy: userInputBy || 'Admin Gudang UP3',
            }
          : w
      ),
    }));
    get().addAudit(`No. GI ${giNumber || '-'} (${giStatus}) diperbarui untuk WO ${woId}`, woId, 'Mutasi Material');
    get().showToast(`✓ Data Good Issue (GI) untuk WO ${woId} berhasil disimpan.`);
  },

  vendorSubmitRealization: (woId, items, vendorNotes, slipReturNumber, slipReturDate, slipReturPhotos) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const hasAnyReturned = items.some((it) => (it.qtyReturned || 0) > 0);

    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const updatedMats = (w.materials || []).map((m) => {
          const match = items.find((it) => it.material === m.material);
          if (match) {
            return {
              ...m,
              qtyInstalled: match.qtyInstalled,
              qtyReturned: match.qtyReturned,
              vendorNotes: match.notes,
            };
          }
          return m;
        });

        return {
          ...w,
          vendorRealizationSubmitted: true,
          vendorRealizationDate: nowStr,
          vendorRealizationNotes: vendorNotes,
          slipReturNumber: slipReturNumber || w.slipReturNumber,
          slipReturDate: slipReturDate || (hasAnyReturned ? nowStr : w.slipReturDate),
          slipReturPhotos: slipReturPhotos || w.slipReturPhotos,
          returStatus: hasAnyReturned ? ('MENUNGGU_VERIFIKASI_GUDANG' as const) : w.returStatus,
          materials: updatedMats,
        };
      }),
    }));
    get().addAudit(`Vendor mengirim konfirmasi realisasi material terpasang & retur untuk WO ${woId}${hasAnyReturned ? ` (Slip Retur: ${slipReturNumber || '-'})` : ''}`, woId, 'Menu Vendor');
    get().showToast(`✓ Realisasi material terpasang & retur berhasil dikirim.${hasAnyReturned ? ' Berkas Slip Retur TUG-10 diteruskan ke Gudang.' : ''}`);
  },

  adminGudangApproveRetur: (woId, adminName, notes) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => {
      const targetWo = state.workOrders.find((w) => w.id === woId);
      if (!targetWo) return state;

      // Tambah stok fisik gudang untuk setiap material yang diretur
      const returnedItems = (targetWo.materials || []).filter((m) => (m.qtyReturned || 0) > 0);
      const updatedStocks = state.stocks.map((stock) => {
        const matchItem = returnedItems.find(
          (m) => (m.kode && m.kode.trim() === stock.code.trim()) || m.material.toLowerCase() === stock.name.toLowerCase()
        );
        if (matchItem && matchItem.qtyReturned) {
          const addedQty = Number(matchItem.qtyReturned) || 0;
          return {
            ...stock,
            qtyFisik: stock.qtyFisik + addedQty,
            qtySisa: stock.qtySisa + addedQty,
          };
        }
        return stock;
      });

      const updatedWorkOrders = state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        return {
          ...w,
          returStatus: 'RETUR_DISETUJUI' as const,
          returApprovedAt: nowStr,
          returApprovedBy: adminName,
          returNotes: notes,
        };
      });

      return {
        stocks: updatedStocks,
        workOrders: updatedWorkOrders,
      };
    });
    get().addAudit(`Admin Gudang (${adminName}) menyetujui pengembalian fisik material WO ${woId}. Stok gudang bertambah.`, woId, 'Gudang & Persediaan');
    get().showToast(`✓ Retur fisik material WO ${woId} disetujui. Stok fisik gudang berhasil ditambah.`);
  },

  adminGudangRejectRetur: (woId, adminName, reason) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        return {
          ...w,
          returStatus: 'RETUR_DITOLAK' as const,
          returRejectedAt: nowStr,
          returRejectedBy: adminName,
          returRejectionReason: reason,
        };
      }),
    }));
    get().addAudit(`Admin Gudang (${adminName}) menolak retur material WO ${woId}: ${reason}`, woId, 'Gudang & Persediaan');
    get().showToast(`⚠️ Pengajuan retur WO ${woId} ditolak.`);
  },

  pengawasVerifyRealization: (woId, verifiedItems, notes, verifierName) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => {
      let hasRetur = false;
      let hasSelisih = false;

      const updatedWos = state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const updatedMats = (w.materials || []).map((m) => {
          const match = verifiedItems.find((it) => it.material === m.material);
          if (match) {
            const taken = m.qtyTaken || m.qtyAllocated || m.qtyReksis;
            if (match.qtyReturned > 0) hasRetur = true;
            if (match.qtyInstalled + match.qtyReturned !== taken) hasSelisih = true;

            return {
              ...m,
              qtyInstalled: match.qtyInstalled,
              qtyReturned: match.qtyReturned,
              isVerified: true,
              verificationNote: match.verificationNote || (match.qtyReturned > 0 ? `Retur gudang: ${match.qtyReturned} ${m.unit}` : 'Terpasang 100%'),
            };
          }
          return m;
        });

        let newStatus: 'SESUAI' | 'ADA_SELISIH' | 'RETUR_GUDANG' = 'SESUAI';
        if (hasSelisih) {
          newStatus = 'ADA_SELISIH';
        } else if (hasRetur) {
          newStatus = 'RETUR_GUDANG';
        }

        return {
          ...w,
          pengawasRealizationVerified: true,
          pengawasRealizationVerifiedAt: nowStr,
          pengawasRealizationVerifiedBy: verifierName,
          pengawasRealizationNotes: notes,
          sjVerificationStatus: newStatus,
          materials: updatedMats,
        };
      });

      return { workOrders: updatedWos };
    });
    get().addAudit(`Pengawas ${verifierName} mengesahkan realisasi material & retur WO ${woId}`, woId, 'Menu Pengawas');
    get().showToast(`✓ Realisasi material terpasang & retur WO ${woId} berhasil disahkan Pengawas.`);
  },

  toggleMaterialTaken: (woId, materialName, isTaken) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    set((state) => {
      const updatedWos = state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const updatedMats = (w.materials || []).map((m) => {
          if (m.material === materialName) {
            return {
              ...m,
              isTaken,
              takenAt: isTaken ? nowStr : undefined,
              qtyTaken: isTaken ? (m.qtyAllocated || m.qtyReksis) : 0,
            };
          }
          return m;
        });

        const totalMats = updatedMats.length;
        const takenMats = updatedMats.filter((m) => m.isTaken).length;

        let newReservationStatus = w.reservationStatus;
        if (takenMats === 0) {
          newReservationStatus = 'Siap Ambil';
        } else if (takenMats === totalMats) {
          newReservationStatus = 'Selesai';
        } else {
          newReservationStatus = 'Reservasi Sebagian';
        }

        return {
          ...w,
          materials: updatedMats,
          reservationStatus: newReservationStatus,
        };
      });

      return { workOrders: updatedWos };
    });
  },

  uploadSuratJalan: (woId, sjNumber, photoUrl) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id === woId) {
          return {
            ...w,
            suratJalanNumber: sjNumber,
            suratJalanPhoto: photoUrl || undefined,
            suratJalanDate: nowStr,
            reservationStatus: 'Selesai' as const,
          };
        }
        return w;
      }),
    }));
    get().addAudit(`Vendor mengupload Surat Jalan ${sjNumber} untuk WO ${woId}`, woId, 'Pengambilan Material');
    get().showToast(`✓ Surat Jalan ${sjNumber} berhasil diupload. Siap diverifikasi Pengawas.`);
  },

  verifySuratJalan: (woId, verifiedMaterials, generalNotes, verifierName) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => {
      let hasDiscrepancy = false;
      let totalReturned = 0;

      const updatedWos = state.workOrders.map((w) => {
        if (w.id !== woId) return w;

        const updatedMats = (w.materials || []).map((m) => {
          const match = verifiedMaterials.find((v) => v.material === m.material);
          if (match) {
            const taken = m.qtyTaken || m.qtyAllocated || m.qtyReksis;
            const diff = taken - (match.qtyInstalled + match.qtyReturned);
            if (diff !== 0) hasDiscrepancy = true;
            if (match.qtyReturned > 0) totalReturned += match.qtyReturned;

            return {
              ...m,
              qtyInstalled: match.qtyInstalled,
              qtyReturned: match.qtyReturned,
              isVerified: true,
              verificationNote: match.verificationNote,
            };
          }
          return m;
        });

        let newStatus: 'SESUAI' | 'ADA_SELISIH' | 'RETUR_GUDANG' = 'SESUAI';
        if (hasDiscrepancy) {
          newStatus = 'ADA_SELISIH';
        } else if (totalReturned > 0) {
          newStatus = 'RETUR_GUDANG';
        }

        return {
          ...w,
          ...applyWoStatus(w, 'Verifikasi SJ'),
          sjVerificationStatus: newStatus,
          sjVerifiedAt: nowStr,
          sjVerifiedBy: verifierName || 'Hasian Sitorus (TC Lola Konstruksi)',
          sjVerificationNotes: generalNotes,
          materials: updatedMats,
        };
      });

      return { workOrders: updatedWos };
    });

    get().addAudit(`Pengawas memverifikasi Surat Jalan WO ${woId}`, woId, 'Verifikasi Surat Jalan');
    get().showToast(`✓ Verifikasi Surat Jalan ${woId} berhasil disimpan`);
  },

  deleteWorkOrder: (id) => {
    set((state) => ({
      workOrders: state.workOrders.filter((w) => w.id !== id),
    }));
    get().addAudit(`Hapus Work Order ${id}`, id, 'Work Order');
    get().showToast(`✓ Work Order ${id} berhasil dihapus`);
  },


  stocks: SEED_STOCKS,

  materialCodeMap: SEED_MATERIAL_CODE_MAP,

  updateMaterialCodeMapping: (materialIdOrOldCode: string, newCode: string) => {
    set((state) => ({
      materialCodeMap: {
        ...state.materialCodeMap,
        [materialIdOrOldCode]: newCode,
      },
    }));
  },

  updateStock: (oldCode, updates) => {
    const targetNewCode = updates.newCode ? updates.newCode.trim() : (updates.code ? updates.code.trim() : oldCode);
    set((state) => {
      const newMap = { ...state.materialCodeMap };
      if (targetNewCode && targetNewCode !== oldCode) {
        newMap[oldCode] = targetNewCode;
      }
      return {
        materialCodeMap: newMap,
        stocks: state.stocks.map((s) => {
          if (s.code === oldCode) {
            const updated = { ...s, ...updates, code: targetNewCode };
            const qtyFisik = updated.qtyFisik ?? s.qtyFisik;
            const qtySap = updated.qtySap !== undefined ? updated.qtySap : (s.qtySap ?? qtyFisik);
            const qtyMrwi = updated.qtyMrwi !== undefined ? updated.qtyMrwi : (s.qtyMrwi ?? 0);
            const qtyAlokasi = updated.qtyAlokasi ?? s.qtyAlokasi;
            const qtySisa = Math.max(0, qtyFisik - qtyAlokasi);
            const status: 'Aman' | 'Menipis' | 'Kritis' = qtySisa > 3 ? 'Aman' : (qtySisa > 0 ? 'Menipis' : 'Kritis');
            return { ...updated, qtyFisik, qtySap, qtyMrwi, qtyAlokasi, qtySisa, status };
          }
          return s;
        }),
      };
    });
    get().addAudit(`Update material gudang: ${oldCode}${targetNewCode !== oldCode ? ` -> ${targetNewCode}` : ''}`, targetNewCode, 'Stok Gudang');
    get().showToast(`✓ Nomor & Data Material ${targetNewCode} berhasil diperbarui di gudang & WO`);
  },

  addStock: (stock) => {
    const qtyFisik = stock.qtyFisik || 0;
    const qtySap = stock.qtySap !== undefined ? stock.qtySap : qtyFisik;
    const qtyMrwi = stock.qtyMrwi || 0;
    const qtyAlokasi = stock.qtyAlokasi || 0;
    const qtySisa = Math.max(0, qtyFisik - qtyAlokasi);
    const status: 'Aman' | 'Menipis' | 'Kritis' = qtySisa > 3 ? 'Aman' : (qtySisa > 0 ? 'Menipis' : 'Kritis');
    const newStock: StockMaterial = { ...stock, qtyFisik, qtySap, qtyMrwi, qtyAlokasi, qtySisa, status };
    set((state) => ({
      stocks: [newStock, ...state.stocks],
    }));
    get().addAudit(`Tambah material baru di gudang: ${stock.code}`, stock.code, 'Stok Gudang');
    get().showToast(`✓ Material ${stock.code} berhasil ditambahkan ke gudang`);
  },

  deleteStock: (code) => {
    set((state) => ({
      stocks: state.stocks.filter((s) => s.code !== code),
    }));
    get().addAudit(`Hapus material dari gudang: ${code}`, code, 'Stok Gudang');
    get().showToast(`✓ Material ${code} berhasil dihapus dari gudang`);
  },

  audits: SEED_AUDITS,

  addAudit: (activity, object, source) => {
    const user = get().currentRole;
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      audits: [{ time: `Hari ini ${time}`, user, activity, object, source }, ...state.audits],
    }));
  },

  clearAudits: () => {
    set({ audits: [] });
    get().showToast('✓ Riwayat log aktivitas berhasil dibersihkan');
  },

  // Master KHS Custom Prices Implementation
  customKhsPrices: SEED_KHS_PRICES,
  updateKhsPrice: (id, newPrice, reason) => {
    set((state) => ({
      customKhsPrices: {
        ...state.customKhsPrices,
        [id]: newPrice,
      },
    }));
    get().addAudit(`Amandemen harga KHS item ${id} menjadi Rp ${newPrice.toLocaleString('id-ID')}${reason ? ` (${reason})` : ''}`, id, 'Master KHS');
    get().showToast(`✓ Harga KHS berhasil diperbarui menjadi Rp ${newPrice.toLocaleString('id-ID')}`);
  },
  resetKhsPrice: (id) => {
    set((state) => {
      const copy = { ...state.customKhsPrices };
      delete copy[id];
      return { customKhsPrices: copy };
    });
    get().showToast(`✓ Harga KHS item ${id} dikembalikan ke standar awal 2026`);
  },
  resetAllKhsPrices: () => {
    set({ customKhsPrices: {} });
    get().showToast('✓ Seluruh harga KHS berhasil di-reset ke standar awal 2026');
  },

  // Master Vendors & Kontrak Implementation
  vendors: SEED_VENDORS,

  contracts: SEED_CONTRACTS,

  addContract: (contract) => {
    const newId = `c-${Date.now().toString().slice(-4)}`;
    const nilai = contract.nilaiKontrak || contract.totalPagu || 0;
    const used = 0;
    const sisa = contract.sisaPagu !== undefined ? contract.sisaPagu : nilai;
    set((state) => ({
      contracts: [
        {
          ...contract,
          id: newId,
          nilaiKontrak: nilai,
          totalPagu: nilai,
          usedPagu: used,
          sisaPagu: sisa,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...state.contracts,
      ],
    }));
    get().addAudit(`Tambah Kontrak KHS No. ${contract.spkNumber}`, newId, 'Master Kontrak');
    get().showToast(`✓ Kontrak ${contract.spkNumber} berhasil ditambahkan`);
  },

  updateContract: (id, updates) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id === id) {
          const nilai = updates.nilaiKontrak !== undefined ? updates.nilaiKontrak : (updates.totalPagu !== undefined ? updates.totalPagu : (c.nilaiKontrak || c.totalPagu));
          const used = updates.usedPagu !== undefined ? updates.usedPagu : c.usedPagu;
          const sisa = updates.sisaPagu !== undefined ? updates.sisaPagu : (nilai - used);
          return {
            ...c,
            ...updates,
            nilaiKontrak: nilai,
            totalPagu: nilai,
            usedPagu: used,
            sisaPagu: sisa,
          };
        }
        return c;
      }),
    }));
    get().addAudit(`Perbarui Kontrak KHS ${id}`, id, 'Master Kontrak');
    get().showToast(`✓ Data kontrak berhasil diperbarui`);
  },

  deleteContract: (id) => {
    const c = get().contracts.find((item) => item.id === id);
    set((state) => ({
      contracts: state.contracts.filter((item) => item.id !== id),
    }));
    get().addAudit(`Hapus Kontrak KHS ${c?.spkNumber || id}`, id, 'Master Kontrak');
    get().showToast(`✓ Kontrak berhasil dihapus`);
  },

  // ==========================================
  // MASTER MATERIAL (KONTRAK MATERIAL)
  // ==========================================
  materialContracts: SEED_MATERIAL_CONTRACTS,

  addMaterialContract: (contract) => {
    const newId = `mc-${Date.now().toString().slice(-4)}`;
    set((state) => ({
      materialContracts: [
        {
          ...contract,
          id: newId,
        },
        ...state.materialContracts,
      ],
    }));
    get().addAudit(`Tambah Kontrak Material SPK ${contract.nomorSpk} (Nodin: ${contract.notaDinas})`, newId, 'Master Material');
    get().showToast(`✓ Kontrak Material ${contract.nomorSpk} berhasil ditambahkan`);
  },

  updateMaterialContract: (id, updates) => {
    set((state) => ({
      materialContracts: state.materialContracts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    get().addAudit(`Perbarui Kontrak Material ${id}`, id, 'Master Material');
    get().showToast(`✓ Kontrak Material berhasil diperbarui`);
  },

  deleteMaterialContract: (id) => {
    const c = get().materialContracts.find((item) => item.id === id);
    set((state) => ({
      materialContracts: state.materialContracts.filter((item) => item.id !== id),
    }));
    get().addAudit(`Hapus Kontrak Material ${c?.nomorSpk || id}`, id, 'Master Material');
    get().showToast(`✓ Kontrak Material berhasil dihapus`);
  },

  supervisors: SEED_SUPERVISORS,

  addSupervisor: (supervisor) => {
    const newId = `sup-${Date.now().toString().slice(-4)}`;
    set((state) => ({
      supervisors: [{ ...supervisor, id: newId }, ...state.supervisors],
    }));
    get().addAudit(`Tambah Master Pengawas ${supervisor.name}`, newId, 'Master Pengawas');
    get().showToast(`✓ Pengawas ${supervisor.name} berhasil ditambahkan`);
  },

  updateSupervisor: (id, updates) => {
    set((state) => ({
      supervisors: state.supervisors.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    get().addAudit(`Perbarui Master Pengawas ${id}`, id, 'Master Pengawas');
    get().showToast(`✓ Data pengawas berhasil diperbarui`);
  },

  deleteSupervisor: (id) => {
    const s = get().supervisors.find((item) => item.id === id);
    set((state) => ({
      supervisors: state.supervisors.filter((item) => item.id !== id),
    }));
    get().addAudit(`Hapus Master Pengawas ${s?.name || id}`, id, 'Master Pengawas');
    get().showToast(`✓ Pengawas berhasil dihapus`);
  },

  // Sweeping Material State & Actions
  sweepings: SEED_SWEEPINGS,

  addSweeping: (record) => {
    const newId = `swp-${Date.now().toString().slice(-4)}`;
    const newRecord = {
      ...record,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      sweepings: [newRecord, ...state.sweepings],
    }));
    get().addAudit(`Buat Dokumen Sweeping Material No. ${record.nomorSweeping} (SPK: ${record.noSpk})`, newId, 'Sweeping Material');
    get().showToast(`✓ Dokumen Sweeping Material ${record.nomorSweeping} berhasil dibuat`);
    return newId;
  },

  updateSweeping: (id, updates) => {
    set((state) => ({
      sweepings: state.sweepings.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    get().addAudit(`Perbarui Dokumen Sweeping Material ${id}`, id, 'Sweeping Material');
    get().showToast('✓ Dokumen Sweeping Material berhasil diperbarui');
  },

  deleteSweeping: (id) => {
    const swp = get().sweepings.find((s) => s.id === id);
    set((state) => ({
      sweepings: state.sweepings.filter((s) => s.id !== id),
    }));
    get().addAudit(`Hapus Dokumen Sweeping Material ${swp?.nomorSweeping || id}`, id, 'Sweeping Material');
    get().showToast('✓ Dokumen Sweeping Material berhasil dihapus');
  },

  // === Vendor Submit Progress (draft, belum resmi) ===
  vendorSubmitProgress: (woId, draftItems, vendorLabel) => {
    // Pengawas bisa mengunci progres jasa; setelah terkunci vendor tidak boleh kirim lagi.
    const target = get().workOrders.find((w) => w.id === woId);
    if (target?.progressJasaLocked) {
      get().showToast(
        `🔒 Progres jasa WO ${woId} sudah dikunci oleh ${target.progressLockedBy || 'Pengawas'} — update vendor tidak disimpan.`
      );
      get().addAudit(
        `Vendor ${vendorLabel} DITOLAK sistem: progres jasa WO ${woId} dalam keadaan terkunci oleh ${target.progressLockedBy || 'Pengawas'}`,
        woId,
        'Progress Jasa'
      );
      return;
    }
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === woId
          ? {
              ...wo,
              pendingJasaItems: draftItems,
              progressStatus: 'MENUNGGU_VERIFIKASI_PROGRESS' as const,
              progressSubmittedAt: new Date().toISOString(),
              progressSubmittedBy: vendorLabel,
              progressRejectedReason: undefined,
            }
          : wo
      ),
    }));
    get().addAudit(
      `Vendor ${vendorLabel} mengajukan update progress jasa WO ${woId} → Menunggu Verifikasi Pengawas`,
      woId,
      'Progress Jasa'
    );
    get().showToast('✅ Progress berhasil diajukan. Menunggu verifikasi pengawas.');
  },

  // === Pengawas Setujui Progress ===
  pengawasApproveProgress: (woId, verifierName, catatan, verifiedJasaItems) => {
    const wo = get().workOrders.find((w) => w.id === woId);
    if (!wo) return;

    const newJasaItems = verifiedJasaItems || wo.pendingJasaItems || wo.jasaItems || [];
    const totalRencanaRp = newJasaItems.reduce((sum, it) => sum + (it.qtyTarget * (it.hargaSatuan || 0)), 0);
    const totalRealisasiRp = newJasaItems.reduce((sum, it) => sum + ((it.qtyRealisasi || 0) * (it.hargaSatuan || 0)), 0);
    let jas = 0;
    if (totalRencanaRp > 0) {
      jas = Math.min(100, Math.round((totalRealisasiRp / totalRencanaRp) * 100));
    } else {
      const avg = newJasaItems.reduce((sum, it) => sum + (it.progresPersen || 0), 0) / (newJasaItems.length || 1);
      jas = Math.min(100, Math.round(avg));
    }
    const mat = wo.progressMaterial !== undefined ? wo.progressMaterial : (wo.progress || 0);
    const overall = Math.round((mat + jas) / 2);

    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === woId
          ? {
              ...w,
              jasaItems: newJasaItems,             // Resmi update
              pendingJasaItems: undefined,         // Clear draft
              progressJasa: jas,
              progress: overall,
              ...applyWoStatus(w, overall >= 100 ? 'Selesai' : 'Konstruksi'),
              progressStatus: 'DISETUJUI' as const,
              progressVerifiedAt: new Date().toISOString(),
              progressVerifiedBy: verifierName,
              progressRejectedReason: undefined,
              catatan: catatan ? `${w.catatan ? w.catatan + ' | ' : ''}Pengawas (${verifierName}): ${catatan}` : w.catatan,
            }
          : w
      ),
    }));
    get().addAudit(
      `Pengawas ${verifierName} menyetujui progress jasa WO ${woId} (Progres Jasa: ${jas}%)${catatan ? ` — Catatan: ${catatan}` : ''}`,
      woId,
      'Progress Jasa'
    );
    get().showToast(`✅ Progress WO (${jas}%) disetujui oleh ${verifierName}`);
  },

  // === Pengawas Tolak Progress ===
  pengawasRejectProgress: (woId, verifierName, alasan) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === woId
          ? {
              ...w,
              pendingJasaItems: undefined,           // Clear draft
              progressStatus: 'DITOLAK' as const,
              progressVerifiedAt: new Date().toISOString(),
              progressVerifiedBy: verifierName,
              progressRejectedReason: alasan,
            }
          : w
      ),
    }));
    get().addAudit(
      `Pengawas ${verifierName} menolak progress jasa WO ${woId} — Alasan: ${alasan}`,
      woId,
      'Progress Jasa'
    );
    get().showToast(`❌ Progress WO ditolak. Vendor dapat merevisi dan mengajukan ulang.`);
  },

  // === Pengawas Kunci Progres Jasa → Closeout ===
  // Setelah dikunci, vendor tidak bisa mengirim update progres jasa untuk WO ini
  // dan WO langsung berstatus Closeout. Hanya pengawas yang boleh membuka kembali kuncinya.
  pengawasLockProgressJasa: (woId, pengawasName) => {
    const target = get().workOrders.find((w) => w.id === woId);
    if (!target || target.progressJasaLocked) return;
    // Pengajuan vendor yang masih menggantung harus diputuskan dulu supaya tidak hilang.
    if (target.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS') {
      get().showToast(
        `⚠️ WO ${woId} masih punya pengajuan progres vendor. Setujui atau tolak dulu sebelum dikunci.`
      );
      return;
    }
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === woId
          ? {
              ...w,
              progressJasaLocked: true,
              progressLockedAt: new Date().toISOString(),
              progressLockedBy: pengawasName,
              status: 'Closeout' as const,
              statusBeforeCloseout: w.status === 'Closeout' ? w.statusBeforeCloseout : w.status,
            }
          : w
      ),
    }));
    get().addAudit(
      `Pengawas ${pengawasName} MENGUNCI progres jasa WO ${woId} (${target.progressJasa ?? 0}%) — vendor tidak dapat update lagi, WO masuk Closeout`,
      woId,
      'Progress Jasa'
    );
    get().showToast(`🔒 Progres jasa WO ${woId} dikunci. WO masuk Closeout, vendor tidak bisa update lagi.`);
  },

  // === Pengawas Buka Kunci Progres Jasa ===
  pengawasUnlockProgressJasa: (woId, pengawasName) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const restored = w.statusBeforeCloseout || ((w.progress || 0) >= 100 ? 'Selesai' : 'Konstruksi');
        return {
          ...w,
          progressJasaLocked: false,
          progressLockedAt: undefined,
          progressLockedBy: undefined,
          status: w.status === 'Closeout' ? restored : w.status,
          statusBeforeCloseout: undefined,
        };
      }),
    }));
    get().addAudit(
      `Pengawas ${pengawasName} MEMBUKA KUNCI progres jasa WO ${woId} — Closeout dibatalkan, vendor dapat update kembali`,
      woId,
      'Progress Jasa'
    );
    get().showToast(`🔓 Progres jasa WO ${woId} dibuka. Closeout dibatalkan, vendor dapat update kembali.`);
  },

}));
