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
  ApplyWoPackageInput,
  ApplyWoSignatures,
  VendorRecord,
  ContractRecord,
  WoMaterialItem,
  WoJasaItem,
  SupervisorRecord,
  MaterialContractRecord,
  MaterialContractItem,
  WoMilestones,
  StandardConstructionRules,
  ReservationTransaction,
  VendorPickupTransaction,
  SweepingRecord,
  SweepingMaterialItem
} from '@/types';

const DEFAULT_ASMAN_PARAF = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCI+PHBhdGggZD0iTSAzNSw0NSBDIDQ1LDgwIDU1LDg1IDYyLDM1IEMgNzAsNzUgODAsODAgODgsMzAgQyA5NSw0NSAxMTAsMjUgMTI1LDUwIEMgMTM1LDY4IDEyMCw4NSA5NSw4MCBNIDQ1LDkwIEwgMTQwLDg4IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDMzNjYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+";
const DEFAULT_HASIAN_PARAF = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCI+PHBhdGggZD0iTSA0MCw3MCBDIDUwLDUwIDcwLDI1IDc4LDEyIEMgODIsNSA3NSw4IDcwLDIyIEMgNjIsNDggNTUsODAgNDgsMTEyIE0gNTIsNzIgQyA2MCw0OCA3Miw0MCA4Miw0MiBDIDkwLDQ0IDg4LDYyIDg5LDc2IEMgOTIsMjggMTAyLDIwIDEwOCwzMCBDIDExMiwzOCAxMTAsNjggMTEyLDgwIEMgMTE2LDQ4IDEyNiw0NSAxMzIsNTYgQyAxMzYsNjYgMTM4LDgyIDE0NCwxMDIgTSA2Miw1OCBMIDEzMCw1NiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAzMzY2IiBzdHJva2Utd2lkdGg9IjIuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+";
import { calculateRabFromSurvey } from '@/data/rabMasterData';

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
  approveWorkOrder: (
    id: string,
    approverData?: { name?: string; role?: string; signature?: string; catatan?: string }
  ) => void;
  rejectWorkOrder: (id: string, reason: string) => void;
  resubmitWorkOrder: (id: string, updates?: Partial<WorkOrderRecord>) => void;
  updateWorkOrderFields: (id: string, updates: Partial<WorkOrderRecord>) => void;
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
    reservationNumberNonStock?: string,
    notesNonStock?: string
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
    materialsTaken: { material: string; qtyTaken: number }[],
    notes?: string,
    reservationNumber?: string,
    giNumber?: string,
    receiptPhotos?: string[]
  ) => void;
  pengawasVerifyReceipt: (
    woId: string,
    verifiedMaterials: { material: string; qtyTaken: number; note?: string }[],
    notes: string,
    verifierName: string
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

  // Save RAB overrides (Opsi B: penyesuaian volume / item ad-hoc sebelum disetujui Asman)
  saveRabOverrides: (params: {
    surveyId?: string;
    woId?: string;
    paket: 'paket1' | 'paket2';
    volumeOverrides: Record<string, number>;
    extraItems?: any[];
  }) => void;

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

export const usePromotorStore = create<PromotorState>((set, get) => ({
  // Aturan Master Standar Konstruksi (Sinkron ke Menu Survey)
  constructionRules: {
    jtm: {
      tiangLabel: "Tiang",
      konstruksiLabel: "Konstruksi TM (Standar)",
      conductorLabel: "Panjang Konduktor (m)",
      tiangList: [
        "12/200",
        "12/350",
        "12/350 (GARDU)",
        "11/200",
        "11/350",
        "11/500",
        "13/350",
        "14/350",
        "Tiang Besi 11m",
        "Tiang Besi 12m"
      ],
      konstruksiList: [
        "TM - 1B", "TM - 2B", "TM - 3B", "TM - 4B", "TM - 5B", "TM - 6B", "TM - 7B",
        "TM - 8B", "TM - 9B", "TM - 10B", "TM - 11B", "TM - 12B", "TM - 13B", "TM - 14B",
        "GARDU CANTOL DISTRIBUSI", "GARDU CANTOL KHUSUS", "GARDU PORTAL DISTRIBUSI", "GARDU PORTAL KHUSUS",
        "GARDU PORTAL RMU", "GARDU BETON", "STAYSET", "KONTRAMASK", "CO AFTAK"
      ]
    },
    jtr: {
      tiangLabel: "Tiang",
      konstruksiLabel: "Konstruksi TR (Standar)",
      conductorLabel: "JTR 70 (m)",
      tiangList: [
        "9/200",
        "9/350",
        "11/200",
        "Tiang Besi 9m",
        "Tiang Besi 11m"
      ],
      konstruksiList: [
        "TR - 1B", "TR - 2B", "TR - 3B", "TR - 4B", "TR - 5B", "TR - 6B", "TR - 7B",
        "TR - 8B", "TR - 9B", "TR - 10B AWAL", "TR - 10B AKHIR", "TR - 11B", "PEMBUMIAN TR", "STAY SET TR"
      ]
    }
  },
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
          tiangList: Array.from(new Set([...state.constructionRules[network].tiangList, ...tiangList.filter(Boolean)]))
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
          konstruksiList: Array.from(new Set([...state.constructionRules[network].konstruksiList, ...konstruksiList.filter(Boolean)]))
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

  surveys: [
    {
      id: "SRV-2026-0001",
      customerName: "PT BANTEN STEEL MANUFACTURING (Pasang Baru 197 kVA)",
      namaDasar: "PT BANTEN STEEL MANUFACTURING",
      idpel: "541011889901",
      dayaBaru: "197.000",
      tarifBaru: "I2",
      daya: "197.000 VA",
      tarif: "I2",
      location: "Kawasan Industri Modern Cikande Kav. 88, Serang",
      address: "Jl. Industri Modern Raya No. 88, Cikande",
      kampung: "Nambo Udik",
      desa: "Nambo Udik",
      kecamatan: "Cikande",
      kabupaten: "Kabupaten Serang",
      officerName: "Hasian Sitorus (Petugas Survey UP3)",
      jobType: "Pasang Baru",
      status: "Siap Apply WO",
      paymentStatus: "Sudah Bayar",
      nidi: true,
      slo: true,
      createdAt: "07 Feb 2026 09:30",
      garduInduk: "GI CIKANDE BARU",
      penyulang: "P.INDUSTRI",
      gardu: "CKD-088",
      ulp: "ULP Rangkasbitung",
      tipePembangunanGardu: "Gardu Portal Distribusi",
      kapasitasTrafo: "250 kVA",
      jumlahKabelNaik: "2",
      latitude: -6.1852,
      longitude: 106.3451,
      coordStr: "-6.185200, 106.345100",
      poles: [
        {
          id: "TM-1",
          name: "Tiang TM #1 (Awal Percabangan)",
          std: "Tiang 12/200",
          networkType: "JTM",
          poleStatus: "EXISTING",
          poleType: "12/200",
          tmConstruction: "TM - 1B",
          a3cs: "60 m",
          conductorLength: 60,
          qty: 1,
          coordStr: "-6.185200, 106.345100",
          lat: -6.1852,
          lng: 106.3451,
          note: "Titik sambung SUTM 20kV eksisting",
        },
        {
          id: "TM-2",
          name: "Tiang TM #2 (Sudut Tarikan)",
          std: "Tiang 12/350",
          networkType: "JTM",
          poleStatus: "RENCANA",
          poleType: "12/350",
          tmConstruction: "TM - 2B",
          a3cs: "50 m",
          conductorLength: 50,
          qty: 1,
          coordStr: "-6.185500, 106.345400",
          lat: -6.1855,
          lng: 106.3454,
          note: "Tiang sudut tarikan SUTM 20kV",
        },
        {
          id: "TM-3",
          name: "Tiang TM #3 (Gardu Portal Trafo 250 kVA)",
          std: "Tiang 12/350 (GARDU)",
          networkType: "JTM",
          poleStatus: "RENCANA",
          poleType: "12/350 (GARDU)",
          tmConstruction: "GARDU PORTAL DISTRIBUSI",
          a3cs: "40 m",
          conductorLength: 40,
          qty: 1,
          coordStr: "-6.185800, 106.345700",
          lat: -6.1858,
          lng: 106.3457,
          note: "Dudukan Gardu Portal Trafo 250 kVA 20kV/400V",
        },
        {
          id: "TR-1",
          name: "Tiang TR #1 (Distribusi Pabrik)",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/200",
          trConstruction: "TR - 1B",
          lvTwisted: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.186000, 106.345900",
          lat: -6.186,
          lng: 106.3459,
          note: "Saluran udara JTR LVTC 3x70+50 mm²",
        },
        {
          id: "TR-2",
          name: "Tiang TR #2 (Box APP TRPDU 197 kVA)",
          std: "Tiang 9/350",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/350",
          trConstruction: "TR - 11B",
          lvTwisted: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.186200, 106.346100",
          lat: -6.1862,
          lng: 106.3461,
          note: "Kabel opstig ke Box APP TRPDU Daya 197 kVA",
        },
      ],
    },
    {
      id: "SRV-2026-0002",
      customerName: "PD CHENDANA (Pasang Baru 33 kVA)",
      namaDasar: "PD CHENDANA",
      idpel: "541011889902",
      dayaBaru: "33.000",
      tarifBaru: "B2",
      daya: "33.000 VA",
      tarif: "B2",
      location: "Jl. Raya Malingping KM 2, Pasar Malingping, Lebak",
      address: "Jl. Raya Pasar Malingping No. 12",
      kampung: "Malingping Selatan",
      desa: "Malingping Selatan",
      kecamatan: "Malingping",
      kabupaten: "Kabupaten Lebak",
      officerName: "Reza Febriansyah (Surveyor ULP Malingping)",
      jobType: "Pasang Baru",
      status: "Siap Apply WO",
      paymentStatus: "Sudah Bayar",
      nidi: true,
      slo: true,
      createdAt: "08 Feb 2026 10:15",
      garduInduk: "GI MALINGPING",
      penyulang: "P.MALINGPING KOTA",
      gardu: "MLP-025",
      ulp: "ULP Malingping",
      tipePembangunanGardu: "Gardu Cantol",
      kapasitasTrafo: "50 kVA",
      jumlahKabelNaik: "1",
      latitude: -6.7781,
      longitude: 106.019689,
      coordStr: "-6.778100, 106.019689",
      poles: [
        {
          id: "TM-EX1",
          name: "Tiang TM SUTM Eksisting #01",
          std: "Tiang 12/200",
          networkType: "JTM",
          poleStatus: "EXISTING",
          poleType: "12/200",
          tmConstruction: "TM - 1B",
          a3cs: "50 m",
          conductorLength: 50,
          qty: 1,
          coordStr: "-6.778100, 106.019689",
          lat: -6.7781,
          lng: 106.019689,
          note: "Tiang SUTM 20kV existing penyulang kota",
        },
        {
          id: "TR-1",
          name: "Tiang SUTR Existing Titik Sambung",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "EXISTING",
          poleType: "9/200",
          trConstruction: "TR - 1B",
          lvTwisted: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.778250, 106.019950",
          lat: -6.77825,
          lng: 106.01995,
          note: "Tiang SUTR existing depan toko elektronik",
        },
        {
          id: "TR-2",
          name: "Tiang Beton 9m Rencana Baru #1",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/200",
          trConstruction: "TR - 1B",
          lvTwisted: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.778400, 106.020200",
          lat: -6.7784,
          lng: 106.0202,
          note: "Rencana tiang beton 9 meter JTR 70 mm²",
        },
        {
          id: "TR-3",
          name: "Tiang Beton 9m Rencana Baru #2",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/200",
          trConstruction: "TR - 2B",
          lvTwisted: "50 m",
          conductorLength: 50,
          qty: 1,
          coordStr: "-6.778550, 106.020450",
          lat: -6.77855,
          lng: 106.02045,
          note: "Tiang sudut rencana JTR menuju ruko PD Chendana",
        },
        {
          id: "TR-4",
          name: "Tiang Akhir Sambungan Rumah PD Chendana",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/200",
          trConstruction: "TR - 11B",
          lvTwisted: "40 m",
          conductorLength: 40,
          qty: 1,
          coordStr: "-6.778700, 106.020700",
          lat: -6.7787,
          lng: 106.0207,
          note: "Tiang akhir + Box APP 3 fasa 33 kVA",
        },
      ],
    },
    {
      id: "SRV-2026-0003",
      customerName: "PERUMAHAN LEBAK GREEN RESIDENCE (Pasang Baru 25 Unit / 32.500 VA)",
      namaDasar: "PERUMAHAN LEBAK GREEN RESIDENCE",
      jumlahUnit: 25,
      dayaPerUnit: "1300",
      idpel: "541011889903",
      dayaBaru: "32.500",
      tarifBaru: "R1T",
      daya: "32.500 VA",
      tarif: "R1T",
      location: "Kp. Pasir Sukarame RT 02 / RW 04, Rangkasbitung Barat",
      address: "Jl. Raya Narimbang No. 45, Rangkasbitung",
      kampung: "Pasir Sukarame",
      desa: "Rangkasbitung Barat",
      kecamatan: "Rangkasbitung",
      kabupaten: "Kabupaten Lebak",
      officerName: "Eko Prasetyo (Petugas Survey ULP Rangkasbitung)",
      jobType: "Pasang Baru",
      status: "Siap Apply WO",
      paymentStatus: "Sudah Bayar",
      nidi: true,
      slo: true,
      createdAt: "08 Feb 2026 14:00",
      garduInduk: "GI RANGKASBITUNG BARU",
      penyulang: "P.LEUWIDAMAR",
      gardu: "RKB-112",
      ulp: "ULP Rangkasbitung",
      tipePembangunanGardu: "Gardu Portal Distribusi",
      kapasitasTrafo: "100 kVA",
      jumlahKabelNaik: "2",
      latitude: -6.345652,
      longitude: 106.256804,
      coordStr: "-6.345652, 106.256804",
      poles: [
        {
          id: "TM-1",
          name: "Tiang TM SUTM Eksisting Sambung",
          std: "Tiang 12/200",
          networkType: "JTM",
          poleStatus: "EXISTING",
          poleType: "12/200",
          tmConstruction: "TM - 1B",
          a3cs: "50 m",
          conductorLength: 50,
          qty: 1,
          coordStr: "-6.345652, 106.256804",
          lat: -6.345652,
          lng: 106.256804,
          note: "Titik sadap SUTM 20kV existing pinggir jalan raya",
        },
        {
          id: "TM-2",
          name: "Tiang TM Percabangan Baru",
          std: "Tiang 12/350",
          networkType: "JTM",
          poleStatus: "RENCANA",
          poleType: "12/350",
          tmConstruction: "TM - 6B",
          a3cs: "50 m",
          conductorLength: 50,
          qty: 1,
          coordStr: "-6.345900, 106.257050",
          lat: -6.3459,
          lng: 106.25705,
          note: "Tiang percabangan baru ke gerbang perumahan",
        },
        {
          id: "TM-3",
          name: "Tiang Gardu Portal Trafo 100 kVA",
          std: "Tiang 12/350 (GARDU)",
          networkType: "JTM",
          poleStatus: "RENCANA",
          poleType: "12/350 (GARDU)",
          tmConstruction: "GARDU PORTAL DISTRIBUSI",
          a3cs: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.346150, 106.257300",
          lat: -6.34615,
          lng: 106.2573,
          note: "Gardu Portal 100 kVA supply cluster perumahan",
        },
        {
          id: "TR-1",
          name: "Tiang TR #1 Terusan Gardu",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "Terusan TM-3",
          trConstruction: "TR - 1B",
          lvTwisted: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.346150, 106.257300",
          lat: -6.34615,
          lng: 106.2573,
          note: "Underbuilt gardu distribusi saluran Blok A",
        },
        {
          id: "TR-2",
          name: "Tiang TR #2 Blok A",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/200",
          trConstruction: "TR - 1B",
          lvTwisted: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.346380, 106.257550",
          lat: -6.34638,
          lng: 106.25755,
          note: "JTR 70 mm² penopang Sambungan Tenaga Listrik 12 rumah",
        },
        {
          id: "TR-3",
          name: "Tiang TR #3 Blok B (Ujung)",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/200",
          trConstruction: "TR - 11B",
          lvTwisted: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.346600, 106.257800",
          lat: -6.3466,
          lng: 106.2578,
          note: "Tiang akhir JTR penopang STL 13 rumah",
        },
      ],
    },
    {
      id: "SRV-2026-0004",
      customerName: "PT KRAKATAU AGRO CEMERLANG (Pasang Baru 105 kVA)",
      namaDasar: "PT KRAKATAU AGRO CEMERLANG",
      idpel: "541011889904",
      dayaBaru: "105.000",
      tarifBaru: "I2",
      daya: "105.000 VA",
      tarif: "I2",
      location: "Kawasan Agro Cikande, Jl. Raya Industri No. 12, Serang",
      address: "Jl. Raya Industri Cikande No. 12",
      kampung: "Nambo Ilir",
      desa: "Cikande",
      kecamatan: "Cikande",
      kabupaten: "Kabupaten Serang",
      officerName: "Hasian Sitorus (Petugas Survey UP3)",
      jobType: "Pasang Baru",
      status: "Siap Apply WO",
      paymentStatus: "Sudah Bayar",
      nidi: true,
      slo: true,
      createdAt: "09 Feb 2026 09:15",
      garduInduk: "GI CIKANDE BARU",
      penyulang: "P.INDUSTRI",
      gardu: "CKD-102",
      ulp: "ULP Rangkasbitung",
      tipePembangunanGardu: "Gardu Cantol Distribusi",
      kapasitasTrafo: "100 kVA",
      jumlahKabelNaik: "1",
      latitude: -6.1895,
      longitude: 106.3482,
      coordStr: "-6.189500, 106.348200",
      poles: [
        {
          id: "TM-1",
          name: "Tiang TM SUTM Sadap Eksisting",
          std: "Tiang 12/200",
          networkType: "JTM",
          poleStatus: "EXISTING",
          poleType: "12/200",
          tmConstruction: "TM - 1B",
          a3cs: "50 m",
          conductorLength: 50,
          qty: 1,
          coordStr: "-6.189500, 106.348200",
          lat: -6.1895,
          lng: 106.3482,
          note: "Titik sambung percabangan SUTM 20kV",
        },
        {
          id: "TM-2",
          name: "Tiang TM Gardu Cantol Trafo 100 kVA",
          std: "Tiang 12/350 (GARDU)",
          networkType: "JTM",
          poleStatus: "RENCANA",
          poleType: "12/350 (GARDU)",
          tmConstruction: "GARDU CANTOL DISTRIBUSI",
          a3cs: "40 m",
          conductorLength: 40,
          qty: 1,
          coordStr: "-6.189750, 106.348500",
          lat: -6.18975,
          lng: 106.3485,
          note: "Gardu Cantol Trafo 100 kVA 20kV/400V suplai pabrik agro",
        },
        {
          id: "TR-1",
          name: "Tiang TR Distribusi Pabrik",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/200",
          trConstruction: "TR - 1B",
          lvTwisted: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.190000, 106.348750",
          lat: -6.19,
          lng: 106.34875,
          note: "Saluran udara JTR LVTC 3x70+50 mm²",
        },
        {
          id: "TR-2",
          name: "Tiang TR Akhir + Box APP 105 kVA",
          std: "Tiang 9/350",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/350",
          trConstruction: "TR - 11B",
          lvTwisted: "40 m",
          conductorLength: 40,
          qty: 1,
          coordStr: "-6.190200, 106.349000",
          lat: -6.1902,
          lng: 106.349,
          note: "Pemasangan Box APP TRPDU 105 kVA 3 Phasa",
        },
      ],
    },
    {
      id: "SRV-2026-0005",
      customerName: "CV SINAR BAHARI MENES (Pasang Baru 66 kVA)",
      namaDasar: "CV SINAR BAHARI MENES",
      idpel: "541011889905",
      dayaBaru: "66.000",
      tarifBaru: "B2",
      daya: "66.000 VA",
      tarif: "B2",
      location: "Jl. Perintis Kemerdekaan No. 88, Menes, Pandeglang",
      address: "Jl. Perintis Kemerdekaan No. 88",
      kampung: "Alun-alun Menes",
      desa: "Menes",
      kecamatan: "Menes",
      kabupaten: "Kabupaten Pandeglang",
      officerName: "Reza Febriansyah (Surveyor ULP Labuan)",
      jobType: "Pasang Baru",
      status: "Siap Apply WO",
      paymentStatus: "Sudah Bayar",
      nidi: true,
      slo: true,
      createdAt: "09 Feb 2026 13:45",
      garduInduk: "GI MENES",
      penyulang: "P.CIGEULIS",
      gardu: "MNS-058",
      ulp: "ULP Labuan",
      tipePembangunanGardu: "Gardu Portal Distribusi",
      kapasitasTrafo: "100 kVA",
      jumlahKabelNaik: "2",
      latitude: -6.3821,
      longitude: 105.9234,
      coordStr: "-6.382100, 105.923400",
      poles: [
        {
          id: "TM-1",
          name: "Tiang TM SUTM Sadap Titik Awal",
          std: "Tiang 12/200",
          networkType: "JTM",
          poleStatus: "EXISTING",
          poleType: "12/200",
          tmConstruction: "TM - 1B",
          a3cs: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.382100, 105.923400",
          lat: -6.3821,
          lng: 105.9234,
          note: "Sadap SUTM 20kV penyulang Cigeulis",
        },
        {
          id: "TM-2",
          name: "Tiang TM Gardu Portal Trafo 100 kVA",
          std: "Tiang 12/350 (GARDU)",
          networkType: "JTM",
          poleStatus: "RENCANA",
          poleType: "12/350 (GARDU)",
          tmConstruction: "GARDU PORTAL DISTRIBUSI",
          a3cs: "50 m",
          conductorLength: 50,
          qty: 1,
          coordStr: "-6.382400, 105.923700",
          lat: -6.3824,
          lng: 105.9237,
          note: "Gardu Portal Trafo 100 kVA cold storage & pengolahan ikan",
        },
        {
          id: "TR-1",
          name: "Tiang TR #1 JTR Kawasan",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/200",
          trConstruction: "TR - 1B",
          lvTwisted: "45 m",
          conductorLength: 45,
          qty: 1,
          coordStr: "-6.382650, 105.923950",
          lat: -6.38265,
          lng: 105.92395,
          note: "Saluran udara JTR LVTC 3x70+50 mm²",
        },
        {
          id: "TR-2",
          name: "Tiang TR Akhir + Box APP 66 kVA",
          std: "Tiang 9/200",
          networkType: "JTR",
          poleStatus: "RENCANA",
          poleType: "9/200",
          trConstruction: "TR - 11B",
          lvTwisted: "35 m",
          conductorLength: 35,
          qty: 1,
          coordStr: "-6.382900, 105.924200",
          lat: -6.3829,
          lng: 105.9242,
          note: "Box APP TRPDU 66 kVA 3 Phasa",
        },
      ],
    },
  ],

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
    set((state) => ({
      surveys: state.surveys.map((s) => (s.id === id ? { ...s, ...partial } : s)),
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

  daftungs: [
    {
      id: "DF-2026-0001",
      idpel: "541011889901",
      customerName: "PT BANTEN STEEL MANUFACTURING (Pasang Baru 197 kVA)",
      daya: "197.000",
      tarif: "I2",
      ulp: "ULP Rangkasbitung",
      location: "Kawasan Industri Modern Cikande Kav. 88, Serang",
      source: "REKSIS dari SRV-2026-0001",
      woIssued: "WO Terbit",
      nidi: true,
      slo: true,
      status: "WO Terbit",
      surveyId: "SRV-2026-0001",
    },
  ],

  addDaftungFromSurvey: (surveyId, finalName, finalIdpel) => {
    const newDf = `DF-2026-${String(Date.now()).slice(-4)}`;
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

  reservationTransactions: [],
  vendorPickupTransactions: [],

  workOrders: [
    {
      id: "001.11.WO.P1.2026",
      noWorkOrder: "001.11.WO.P1.2026",
      customerName: "PT BANTEN STEEL MANUFACTURING (Pasang Baru 197 kVA)",
      idpel: "541011889901",
      daya: "197.000",
      tarif: "I2",
      location: "Kawasan Industri Modern Cikande Kav. 88, Serang",
      address: "Jl. Industri Modern Raya No. 88, Cikande",
      garduInduk: "GI CIKANDE BARU",
      penyulang: "P.INDUSTRI",
      gardu: "CKD-088",
      ulp: "ULP Rangkasbitung",
      tipePembangunanGardu: "Gardu Portal Distribusi",
      kapasitasTrafo: "250 kVA",
      jumlahKabelNaik: "2",
      category: "WO Paket 1",
      vendor: "PT. HILMAN PRIMA PERKASA",
      spkNumber: "0021.PJ/DAN.02.03/UP3-BTS/2026",
      validFrom: "02 Jan 2026",
      validTo: "31 Des 2026",
      supervisor: "Hasian Sitorus (TC Lola Konstruksi)",
      supervisor1: "Hasian Sitorus (TC Lola Konstruksi)",
      supervisor2: "Daud Febrizer (TL Teknik ULP Rangkasbitung)",
      progress: 0,
      progressMaterial: 0,
      progressJasa: 0,
      status: "Konstruksi",
      approvalStatus: "APPROVED",
      appliedAt: "07 Feb 2026 10:00",
      approvedAt: "07 Feb 2026 11:30",
      daftungId: "DF-2026-0001",
      reservationStatus: "Belum Reservasi",
      approverName: "WEGIG DIDIK KURNIAWAN",
      approverRole: "ASMAN KONSTRUKSI",
      approverSignature: DEFAULT_ASMAN_PARAF,
      creatorName: "HASIAN EFRAVODITUS SITORUS",
      creatorRole: "TC LOLA KONS",
      creatorSignature: DEFAULT_HASIAN_PARAF,
      catatan: "Disetujui untuk dilaksanakan di lapangan sesuai SPK dan standar KHS 2026.",
      surveyId: "SRV-2026-0001",
      materials: [
        { material: "TRF DIS;;20kV/400V;3P;50kVA;Dyn5;OD", kode: "1030097", qtyReksis: 1, qtyAllocated: 1, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 45000000 },
        { material: "TRF DIS;D3;20kV/400V;3P;250kVA;Dyn5;OD", kode: "1030077", qtyReksis: 1, qtyAllocated: 1, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 145000000 },
        { material: "LVSB;DIST;3P;400V;630A;4LINE;OD", kode: "3260226", qtyReksis: 1, qtyAllocated: 1, unit: "set", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 28500000 },
        { material: "CABLE PWR;NYY;1X70MM2;0.6/1KV;OH", kode: "3110514", qtyReksis: 80, qtyAllocated: 80, unit: "mtr", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 110000 },
        { material: "CABLE PWR;NYY;1X240MM2;0.6/1KV;OH", kode: "3110517", qtyReksis: 44, qtyAllocated: 44, unit: "mtr", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 340000 },
        { material: "CABLE PWR ACC; CABLE-SHOE CU 70 MM2", kode: "3120114", qtyReksis: 8, qtyAllocated: 8, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 35000 },
        { material: "CABLE PWR ACC; CABLE-SHOE CU 240 MM2", kode: "3120009", qtyReksis: 8, qtyAllocated: 8, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 85000 },
        { material: "CABLE PWR ACC; CABLE-SHOE AL-CU 150 MM2", kode: "3120118", qtyReksis: 12, qtyAllocated: 12, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 65000 },
        { material: "TRF ACC;SERANDANG TRAFO 3P;2 TIANG", kode: "1060069", qtyReksis: 1, qtyAllocated: 1, unit: "set", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 12500000 },
        { material: "LA;20-24kV;K;10kA;POLYMER;;", kode: "2090032", qtyReksis: 3, qtyAllocated: 3, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 980000 },
        { material: "CUT OUT;24kV;6-100A;8kA;125kV", kode: "3190012", qtyReksis: 3, qtyAllocated: 3, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 1250000 },
        { material: "CUT OUT ACC;FUSE LINK 20kV 8A", kode: "3200017", qtyReksis: 3, qtyAllocated: 3, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 95000 },
        { material: "UNIV ACC;TRAVES TUMPU", kode: "3041017", qtyReksis: 3, qtyAllocated: 3, unit: "set", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 1450000 },
        { material: "UNIV ACC;TRAVES TUMPU DOUBLE", kode: "3041019", qtyReksis: 1, qtyAllocated: 1, unit: "set", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 2200000 },
        { material: "UNIV ACC;TRAVES AFSPAN", kode: "3041018", qtyReksis: 1, qtyAllocated: 1, unit: "set", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 1850000 },
        { material: "ISOLATOR;PINPOST;PORC;24kV;;12.5kN", kode: "3070151", qtyReksis: 15, qtyAllocated: 15, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 380000 },
        { material: "ISOLATOR;STRAIN KAP PIN;PORC;24kV;;70kN", kode: "3070160", qtyReksis: 3, qtyAllocated: 3, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 620000 },
        { material: "TOP TIES", kode: "3060167", qtyReksis: 9, qtyAllocated: 9, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 45000 },
        { material: "DOUBLE TIES", kode: "3060382", qtyReksis: 3, qtyAllocated: 3, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 55000 },
        { material: "UNIV ACC;GROUND ROD CU 5/8\"X2500mm", kode: "4190454", qtyReksis: 3, qtyAllocated: 3, unit: "BH", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 320000 },
        { material: "CABLE PWR ACC; CABLE-SHOE CU 50 MM2", kode: "3120017", qtyReksis: 6, qtyAllocated: 6, unit: "bh", kategori: "MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN", hargaSatuan: 28000 },
        { material: "CONDUCTOR;AAAC-S;150mm2;", kode: "3050084", qtyReksis: 165, qtyAllocated: 165, unit: "mtr", kategori: "MATERIAL SKTM/SUTM/SKUTM", hargaSatuan: 48500 },
        { material: "CONN;20kV;H;AL;150-150MM2;PRS;", kode: "3280185", qtyReksis: 9, qtyAllocated: 9, unit: "BH", kategori: "ACESSORIES SUTM, SKUTM, DAN INSTALASI GARDU", hargaSatuan: 75000 },
        { material: "COVER BUSHING TRAFO INPUT ATAS", kode: "—", qtyReksis: 3, qtyAllocated: 3, unit: "BH", kategori: "ACESSORIES SUTM, SKUTM, DAN INSTALASI GARDU", hargaSatuan: 220000 },
        { material: "COVER ISOLATOR", kode: "—", qtyReksis: 15, qtyAllocated: 15, unit: "BH", kategori: "ACESSORIES SUTM, SKUTM, DAN INSTALASI GARDU", hargaSatuan: 145000 },
        { material: "PIPA ARDE GALVANIZED 1\" - 6 METER", kode: "—", qtyReksis: 3, qtyAllocated: 3, unit: "BTG", kategori: "ACESSORIES SUTM, SKUTM, DAN INSTALASI GARDU", hargaSatuan: 385000 },
      ],
      jasaItems: [
        { id: "JSA-P1-01", kode: "JSA-TM-01", subKategori: "A. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN SUTM/SKUTM", deskripsi: "Pembuatan Pondasi Tiang 11 -13 m 350 daN Type A jenis 1 (tanah biasa)", qtyTarget: 3, qtyRealisasi: 0, unit: "bh", hargaSatuan: 114992, bobotPersen: 2.8, progresPersen: 0 },
        { id: "JSA-P1-02", kode: "JSA-TM-02", subKategori: "A. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN SUTM/SKUTM", deskripsi: "Pemasangan Travers Tunggal : UNP 12-1800 mm", qtyTarget: 3, qtyRealisasi: 0, unit: "bh", hargaSatuan: 64068, bobotPersen: 1.6, progresPersen: 0 },
        { id: "JSA-P1-03", kode: "JSA-TM-03", subKategori: "A. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN SUTM/SKUTM", deskripsi: "Pemasangan Travers Ganda : UNP 12-2200 mm", qtyTarget: 2, qtyRealisasi: 0, unit: "bh", hargaSatuan: 103502, bobotPersen: 1.7, progresPersen: 0 },
        { id: "JSA-P1-04", kode: "JSA-TM-04", subKategori: "A. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN SUTM/SKUTM", deskripsi: "Pemasangan PIN ISOLATOR", qtyTarget: 15, qtyRealisasi: 0, unit: "bh", hargaSatuan: 25756, bobotPersen: 3.1, progresPersen: 0 },
        { id: "JSA-P1-05", kode: "JSA-TM-05", subKategori: "A. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN SUTM/SKUTM", deskripsi: "Pemasangan HANG ISOLATOR", qtyTarget: 3, qtyRealisasi: 0, unit: "bh", hargaSatuan: 25756, bobotPersen: 0.6, progresPersen: 0 },
        { id: "JSA-P1-06", kode: "JSA-TM-06", subKategori: "A. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN SUTM/SKUTM", deskripsi: "PENARIKAN KAWAT HANTARAN/gwg (Jarak Mx.40 m) Kawat A3CS 3 x 35 s/d 150 mm2 (Berisolasi)", qtyTarget: 4, qtyRealisasi: 0, unit: "gwg", hargaSatuan: 575947, bobotPersen: 18.7, progresPersen: 0 },
        { id: "JSA-P1-07", kode: "JSA-TM-07", subKategori: "A. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN SUTM/SKUTM", deskripsi: "Pasang Top Ties (segala uk.)", qtyTarget: 9, qtyRealisasi: 0, unit: "bh", hargaSatuan: 16320, bobotPersen: 1.2, progresPersen: 0 },
        { id: "JSA-P1-08", kode: "JSA-TM-08", subKategori: "A. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN SUTM/SKUTM", deskripsi: "Pasang Double Side Ties (segala uk.)", qtyTarget: 3, qtyRealisasi: 0, unit: "bh", hargaSatuan: 16320, bobotPersen: 0.4, progresPersen: 0 },
        { id: "JSA-P1-09", kode: "JSA-GD-01", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - PERSIAPAN", deskripsi: "PEKERJAAN PERSIAPAN, Stripping, tebal 20 cm", qtyTarget: 12, qtyRealisasi: 0, unit: "m2", hargaSatuan: 3270, bobotPersen: 0.3, progresPersen: 0 },
        { id: "JSA-P1-10", kode: "JSA-GD-02", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - PERSIAPAN", deskripsi: "PEKERJAAN PERSIAPAN, Pasang Bouwplank", qtyTarget: 14, qtyRealisasi: 0, unit: "m2", hargaSatuan: 28193, bobotPersen: 3.2, progresPersen: 0 },
        { id: "JSA-P1-11", kode: "JSA-GD-03", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - TANAH", deskripsi: "PEKERJAAN GALIAN DAN URUGAN - Galian tanah keras", qtyTarget: 6, qtyRealisasi: 0, unit: "m3", hargaSatuan: 40904, bobotPersen: 2.0, progresPersen: 0 },
        { id: "JSA-P1-12", kode: "JSA-GD-04", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - BETON & PONDASI", deskripsi: "PEKERJAAN PASANGAN : Pasangan Pondasi batu kali ( 1PC : 3PS )", qtyTarget: 3.7854, qtyRealisasi: 0, unit: "m3", hargaSatuan: 552967, bobotPersen: 17.0, progresPersen: 0 },
        { id: "JSA-P1-13", kode: "JSA-GD-05", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - BETON & PONDASI", deskripsi: "PEKERJAAN BETON DAN PONDASI : Beton bertulang readymix 1 m3 (K.225) / 150 kg (pondasi plat)", qtyTarget: 1.2519, qtyRealisasi: 0, unit: "m3", hargaSatuan: 2499073, bobotPersen: 25.4, progresPersen: 0 },
        { id: "JSA-P1-14", kode: "JSA-GD-06", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - BETON & PONDASI", deskripsi: "PEKERJAAN PASANGAN : Pasangan batu bata, tebal 1 bata ( 1PC : 2 PS )", qtyTarget: 2.55, qtyRealisasi: 0, unit: "m2", hargaSatuan: 209798, bobotPersen: 4.3, progresPersen: 0 },
        { id: "JSA-P1-15", kode: "JSA-GD-07", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - BETON & PONDASI", deskripsi: "PEKERJAAN PLESTERAN : Plesteran 1PC : 2PS ( 15 mm )", qtyTarget: 2.6115, qtyRealisasi: 0, unit: "m2", hargaSatuan: 50824, bobotPersen: 1.1, progresPersen: 0 },
        { id: "JSA-P1-16", kode: "JSA-GD-08", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - BETON & PONDASI", deskripsi: "PEKERJAAN PLESTERAN : Acian beton", qtyTarget: 2.6115, qtyRealisasi: 0, unit: "m2", hargaSatuan: 10487, bobotPersen: 0.2, progresPersen: 0 },
        { id: "JSA-P1-17", kode: "JSA-GD-09", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - RANGKA & LENGKAPAN", deskripsi: "PEMBANGUNAN GARDU CANTOL & PORTAL : - Pasang Rangka Gardu Portal", qtyTarget: 1, qtyRealisasi: 0, unit: "set", hargaSatuan: 598547, bobotPersen: 4.9, progresPersen: 0 },
        { id: "JSA-P1-18", kode: "JSA-GD-10", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - RANGKA & LENGKAPAN", deskripsi: "PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan penghalang panjat", qtyTarget: 2, qtyRealisasi: 0, unit: "bh", hargaSatuan: 62408, bobotPersen: 1.0, progresPersen: 0 },
        { id: "JSA-P1-19", kode: "JSA-GD-11", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - RANGKA & LENGKAPAN", deskripsi: "PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan Tanda Kilat 20 Kv", qtyTarget: 2, qtyRealisasi: 0, unit: "bh", hargaSatuan: 31252, bobotPersen: 0.5, progresPersen: 0 },
        { id: "JSA-P1-20", kode: "JSA-GD-12", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - RANGKA & LENGKAPAN", deskripsi: "PEKERJAAN LAIN - LAIN : Pembuatan Tanda Gardu/nomer Gardu/ Tanda Jembatan", qtyTarget: 2, qtyRealisasi: 0, unit: "bh", hargaSatuan: 63873, bobotPersen: 1.0, progresPersen: 0 },
        { id: "JSA-P1-21", kode: "JSA-GD-13", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - INSTALASI", deskripsi: "PEMASANGAN ARRESTER DAN PENGADAAN DUDUKAN", qtyTarget: 1, qtyRealisasi: 0, unit: "set", hargaSatuan: 380990, bobotPersen: 3.1, progresPersen: 0 },
        { id: "JSA-P1-22", kode: "JSA-GD-14", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - INSTALASI", deskripsi: "PEMASANGAN CUT OUT DAN PENGADAAN DUDUKAN", qtyTarget: 1, qtyRealisasi: 0, unit: "set", hargaSatuan: 380990, bobotPersen: 3.1, progresPersen: 0 },
        { id: "JSA-P1-23", kode: "JSA-GD-15", subKategori: "B. PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI - INSTALASI", deskripsi: "PEKERJAAN PEMASANGAN INSTALASI GARDU : Pasang trafo 50 kva", qtyTarget: 1, qtyRealisasi: 0, unit: "bh", hargaSatuan: 573027, bobotPersen: 4.6, progresPersen: 0 },
      ],
    },
    {
      id: "002.11.WO.P2.2026",
      noWorkOrder: "002.11.WO.P2.2026",
      customerName: "PT BANTEN STEEL MANUFACTURING (Pasang Baru 197 kVA)",
      idpel: "541011889901",
      daya: "197.000",
      tarif: "I2",
      location: "Kawasan Industri Modern Cikande Kav. 88, Serang",
      address: "Jl. Industri Modern Raya No. 88, Cikande",
      garduInduk: "GI CIKANDE BARU",
      penyulang: "P.INDUSTRI",
      gardu: "CKD-088",
      ulp: "ULP Rangkasbitung",
      tipePembangunanGardu: "Gardu Portal Distribusi",
      kapasitasTrafo: "250 kVA",
      jumlahKabelNaik: "2",
      category: "WO Paket 2",
      vendor: "PT. TAWAKAL KARYA TEKNIK",
      spkNumber: "0022.PJ/DAN.02.03/UP3-BTS/2026",
      validFrom: "02 Jan 2026",
      validTo: "31 Des 2026",
      supervisor: "Winnetou Chandra Sadli (Officer Kinerja Konstruksi)",
      supervisor1: "Winnetou Chandra Sadli (Officer Kinerja Konstruksi)",
      supervisor2: "Daud Febrizer (TL Teknik ULP Rangkasbitung)",
      progress: 0,
      progressMaterial: 0,
      progressJasa: 0,
      status: "Konstruksi",
      approvalStatus: "APPROVED",
      appliedAt: "07 Feb 2026 10:00",
      approvedAt: "07 Feb 2026 11:30",
      daftungId: "DF-2026-0001",
      reservationStatus: "Belum Reservasi",
      approverName: "WEGIG DIDIK KURNIAWAN",
      approverRole: "ASMAN KONSTRUKSI",
      approverSignature: DEFAULT_ASMAN_PARAF,
      creatorName: "HASIAN EFRAVODITUS SITORUS",
      creatorRole: "TC LOLA KONS",
      creatorSignature: DEFAULT_HASIAN_PARAF,
      catatan: "Disetujui untuk dilaksanakan di lapangan sesuai SPK dan standar KHS 2026.",
      surveyId: "SRV-2026-0001",
      materials: [
        { material: "Kabel LVTC 3x70 + 50 mm²", qtyReksis: 90, qtyAllocated: 90, unit: "meter", kategori: "KABEL TR", hargaSatuan: 55000 },
        { material: "Box APP TRPDU 197 kVA 3 Phasa", qtyReksis: 1, qtyAllocated: 1, unit: "set", kategori: "APP", hargaSatuan: 12500000 },
        { material: "CT & Meter Elektronik 3 Phasa", qtyReksis: 1, qtyAllocated: 1, unit: "set", kategori: "METER", hargaSatuan: 6500000 },
      ],
      jasaItems: [
        { id: "JSA-P2-01", kode: "JSA-TR-01", subKategori: "A. JASA PEMASANGAN SUTR/SKUTR DAN LENGKAPAN", deskripsi: "Pemasangan Saluran Udara JTR TIC 3x70+50 mm²", qtyTarget: 0.09, qtyRealisasi: 0, unit: "kms", hargaSatuan: 4850000, bobotPersen: 26.1, progresPersen: 0 },
        { id: "JSA-P2-02", kode: "JSA-TR-02", subKategori: "B. JASA PEMASANGAN BOX APP DAN METERING", deskripsi: "Pemasangan Box APP TRPDU 197 kVA Lengkap", qtyTarget: 1, qtyRealisasi: 0, unit: "set", hargaSatuan: 850000, bobotPersen: 50.8, progresPersen: 0 },
        { id: "JSA-P2-03", kode: "JSA-TR-03", subKategori: "B. JASA PEMASANGAN BOX APP DAN METERING", deskripsi: "Pemasangan Sambungan Pelayanan & Pembumian APP", qtyTarget: 1, qtyRealisasi: 0, unit: "set", hargaSatuan: 385000, bobotPersen: 23.1, progresPersen: 0 },
      ],
    },
    {
      id: "003.11.WO.TB.2026",
      noWorkOrder: "003.11.WO.TB.2026",
      customerName: "PT BANTEN STEEL MANUFACTURING (Pasang Baru 197 kVA)",
      idpel: "541011889901",
      daya: "197.000",
      tarif: "I2",
      location: "Kawasan Industri Modern Cikande Kav. 88, Serang",
      address: "Jl. Industri Modern Raya No. 88, Cikande",
      garduInduk: "GI CIKANDE BARU",
      penyulang: "P.INDUSTRI",
      gardu: "CKD-088",
      ulp: "ULP Rangkasbitung",
      tipePembangunanGardu: "Gardu Portal Distribusi",
      kapasitasTrafo: "250 kVA",
      jumlahKabelNaik: "2",
      category: "WO Tiang",
      vendor: "PT. ENERGI BANTEN SEJAHTERA",
      narahubung: "Ir. Dedi Setiadi",
      phone: "(0252) 508219",
      spkNumber: "0023.PJ/DAN.02.03/UP3-BTS/2026",
      validFrom: "02 Jan 2026",
      validTo: "31 Des 2026",
      supervisor: "Hasian Sitorus (TC Lola Konstruksi)",
      supervisor1: "Hasian Sitorus (TC Lola Konstruksi)",
      supervisor2: "Daud Febrizer (TL Teknik ULP Rangkasbitung)",
      progress: 0,
      progressMaterial: 0,
      progressJasa: 0,
      status: "Konstruksi",
      approvalStatus: "APPROVED",
      appliedAt: "07 Feb 2026 10:00",
      approvedAt: "07 Feb 2026 11:30",
      daftungId: "DF-2026-0001",
      reservationStatus: "Belum Reservasi",
      approverName: "WEGIG DIDIK KURNIAWAN",
      approverRole: "ASMAN KONSTRUKSI",
      approverSignature: DEFAULT_ASMAN_PARAF,
      creatorName: "HASIAN EFRAVODITUS SITORUS",
      creatorRole: "TC LOLA KONS",
      creatorSignature: DEFAULT_HASIAN_PARAF,
      catatan: "Disetujui untuk dilaksanakan di lapangan sesuai SPK dan standar KHS 2026.",
      surveyId: "SRV-2026-0001",
      materials: [
        { material: "POLE;CONCRETE;20KV;CIRCL;12M;350DAN;(TERPASANG)", kode: "M-TNG-12-350", qtyReksis: 2, qtyAllocated: 2, unit: "btg", kategori: "D. TIANG BETON", hargaSatuan: 4200000 },
        { material: "POLE;CONCRETE;20KV;CIRCL;12M;200DAN;(TERPASANG)", kode: "M-TNG-12-200", qtyReksis: 1, qtyAllocated: 1, unit: "btg", kategori: "D. TIANG BETON", hargaSatuan: 3500000 },
        { material: "POLE;CONCRETE;20KV;CIRCL;9M;200DAN;(TERPASANG)", kode: "M-TNG-9-200", qtyReksis: 2, qtyAllocated: 2, unit: "btg", kategori: "D. TIANG BETON", hargaSatuan: 2400000 },
      ],
      jasaItems: [
        { id: "JSA-TB-01", kode: "JSA-TNG-12-350", subKategori: "A. PEKERJAAN PENDIRIAN & PENANAMAN TIANG BETON", deskripsi: "Pendirian & Penanaman Tiang Beton 12 Meter 350 daN", qtyTarget: 2, qtyRealisasi: 0, unit: "btg", hargaSatuan: 485000, bobotPersen: 45.1, progresPersen: 0 },
        { id: "JSA-TB-02", kode: "JSA-TNG-12-200", subKategori: "A. PEKERJAAN PENDIRIAN & PENANAMAN TIANG BETON", deskripsi: "Pendirian & Penanaman Tiang Beton 12 Meter 200 daN", qtyTarget: 1, qtyRealisasi: 0, unit: "btg", hargaSatuan: 425000, bobotPersen: 19.8, progresPersen: 0 },
        { id: "JSA-TB-03", kode: "JSA-TNG-09-200", subKategori: "A. PEKERJAAN PENDIRIAN & PENANAMAN TIANG BETON", deskripsi: "Pendirian & Penanaman Tiang Beton 9 Meter 200 daN", qtyTarget: 2, qtyRealisasi: 0, unit: "btg", hargaSatuan: 370000, bobotPersen: 35.1, progresPersen: 0 },
      ],
    },
  ],

  createWorkOrdersFromDaftung: (daftungId, idpel, customerName, customParams) => {
    let newWos: WorkOrderRecord[] = [];
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

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

    if (matchedSurvey && matchedSurvey.poles && matchedSurvey.poles.length > 0) {
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
      p1JasaItems = p1RawJasa.map((r) => {
        const itemVal = r.rencanaVol * (r.hargaSatuan || 0);
        const bobot = p1TotalJasaVal > 0 
          ? Math.round((itemVal / p1TotalJasaVal) * 1000) / 10 
          : (p1RawJasa.length > 0 ? Math.round((100 / p1RawJasa.length) * 10) / 10 : 0);
        return {
          kode: r.kode,
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
      p2JasaItems = p2RawJasa.map((r) => {
        const itemVal = r.rencanaVol * (r.hargaSatuan || 0);
        const bobot = p2TotalJasaVal > 0 
          ? Math.round((itemVal / p2TotalJasaVal) * 1000) / 10 
          : (p2RawJasa.length > 0 ? Math.round((100 / p2RawJasa.length) * 10) / 10 : 0);
        return {
          kode: r.kode,
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
          status: 'Menunggu Persetujuan Asman',
          approvalStatus: 'PENDING',
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
          status: 'Menunggu Persetujuan Asman',
          approvalStatus: 'PENDING',
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
          status: 'Menunggu Persetujuan Asman',
          approvalStatus: 'PENDING',
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
          status: 'Menunggu Persetujuan Asman',
          approvalStatus: 'PENDING',
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
          status: 'Menunggu Persetujuan Asman',
          approvalStatus: 'PENDING',
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
        const newDfId = `DF-2026-${String(Date.now()).slice(-4)}`;
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

  updateWorkOrderFields: (id, updates) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
    get().addAudit(`Edit data Work Order ${id} oleh Asman sebelum approval`, id, 'Work Order');
    get().showToast(`✓ Data Work Order ${id} berhasil diperbarui`);
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
          status: overall >= 100 ? 'Selesai' : 'Konstruksi',
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

  reserveMaterialWo: (woId, reservationNumber, reservationDate, updatedMaterials, isHold, holdReason, notes, reservationNumberNonStock, notesNonStock) => {
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
      reservationNumberStock: reservationNumber,
      reservationNumberNonStock: undefined,
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
        const taken = m.qtyTaken || 0;
        return {
          material: m.material,
          kode: m.kode,
          unit: m.unit,
          categoryType: isStok ? 'STOK' : 'NON_STOK',
          qtyMaterial: req,
          qtyReservedCurrent: curRes,
          qtySudahReservasi: curRes,
          qtyBelumReservasi: Math.max(0, req - curRes),
        };
      }),
    };

    set((state) => ({
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        return {
          ...w,
          reservationNumber,
          reservationNumberNonStock: undefined,
          reservationDate,
          reservationStatus: isHold ? ('Hold' as const) : ('Siap Ambil' as const),
          isHold: Boolean(isHold),
          holdReason: isHold ? holdReason : undefined,
          reservationNotes: notes,
          reservationNotesNonStock: undefined,
          materials: updatedMaterials || w.materials,
          reservationLink: `https://promotor.pln.co.id/r/${reservationNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        };
      }),
      reservationTransactions: [newTrx, ...state.reservationTransactions],
    }));
    if (isHold) {
      get().addAudit(`Pengawas menahan (HOLD) Reservasi Material WO ${woId}: ${holdReason || '-'}`, woId, 'Reservasi Material');
      get().showToast(`⚠️ Reservasi WO ${woId} ditahan (HOLD): ${holdReason || '-'}`);
    } else {
      get().addAudit(`Pengawas menerbitkan Reservasi Material ${reservationNumber} untuk WO ${woId}`, woId, 'Reservasi Material');
      get().showToast(`✓ Reservasi ${reservationNumber} berhasil diterbitkan. Status: Siap Ambil oleh Vendor.`);
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

    const sjList: string[] = Array.isArray(photoUrl)
      ? photoUrl
      : (photoUrl ? [photoUrl] : ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80']);
    const rcList: string[] = receiptPhotos && receiptPhotos.length > 0 ? receiptPhotos : (targetWo?.receiptPhotos || []);

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
      items: materialsTaken.map((t) => {
        const orig = (targetWo?.materials || []).find((m) => m.material === t.material);
        const isTiang = (orig?.kategori || '').toUpperCase().includes('TIANG') ||
          t.material.toLowerCase().includes('pole;concrete') ||
          t.material.toLowerCase().startsWith('tiang beton') ||
          (t.material.toLowerCase().includes('tiang') && !t.material.toLowerCase().includes('serandang')) ||
          (orig?.kode && orig.kode.toLowerCase().includes('tng'));
        const isStok = orig?.stockType ? orig.stockType === 'STOK' : !isTiang;
        const req = orig?.qtyReserved !== undefined ? orig.qtyReserved : (orig?.qtyAllocated || orig?.qtyReksis || 1);
        const prevTaken = orig?.qtyTaken || 0;
        const curTakenThisBatch = Math.max(0, t.qtyTaken - prevTaken);
        return {
          material: t.material,
          kode: orig?.kode,
          unit: orig?.unit || 'bh',
          categoryType: isStok ? 'STOK' : 'NON_STOK',
          qtyReserved: req,
          qtyTakenCurrent: curTakenThisBatch > 0 ? curTakenThisBatch : t.qtyTaken,
          totalTakenAccumulated: t.qtyTaken,
          sisaRemaining: Math.max(0, req - t.qtyTaken),
        };
      }),
    };

    set((state) => ({
      vendorPickupTransactions: [newPickupTrx, ...state.vendorPickupTransactions],
      workOrders: state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const updatedMats = (w.materials || []).map((m) => {
          const match = materialsTaken.find((t) => t.material === m.material);
          // Jika item di-hold, tetap isTaken: false & qtyTaken: 0
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
            return {
              ...m,
              isTaken: hasTaken,
              qtyTaken: taken,
              takenAt: hasTaken ? (m.takenAt || nowStr) : undefined,
            };
          }
          return m;
        });

        const totalReq = updatedMats.reduce(
          (acc, m) => acc + (m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1)),
          0
        );
        const totalTaken = updatedMats.reduce((acc, m) => acc + (m.qtyTaken || 0), 0);
        const hasHeld = updatedMats.some((m) => m.isHold);
        const hasRemainingToTake = updatedMats.some((m) => {
          if (m.isHold) return true;
          const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
          return (m.qtyTaken || 0) < req;
        });
        const isAllCompleted = !hasRemainingToTake && !hasHeld;

        const curMilestones = w.milestones || {
          material: 0,
          konstruksi: 0,
          konduktor: 0,
          gardu: 0,
          komisioning: 0,
          energize: 0,
        };

        // Hitung progres pemenuhan material secara proporsional per item
        let calculatedMatProgress = 0;
        if (updatedMats.length > 0) {
          const totalFulfillment = updatedMats.reduce((sum, m) => {
            if (m.isHold) return sum;
            const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
            const taken = m.qtyTaken || 0;
            return sum + (req > 0 ? Math.min(1, taken / req) : 0);
          }, 0);
          calculatedMatProgress = Math.round((totalFulfillment / updatedMats.length) * 100);
        }

        // HANYA 100% jika SEMUA item sudah selesai diambil penuh! Jika baru sebagian (bertahap), maksimal 99%
        const matProgress = isAllCompleted ? 100 : Math.min(99, Math.max(calculatedMatProgress > 0 ? 1 : 0, calculatedMatProgress));

        const prevSjList = w.suratJalanList || (w.suratJalanNumber ? [{
          suratJalanNumber: w.suratJalanNumber,
          suratJalanDate: w.suratJalanDate || nowStr,
          giNumber: w.giNumber,
          photos: w.suratJalanPhotos || (w.suratJalanPhoto ? [w.suratJalanPhoto] : []),
          notes: w.vendorReceiptNotes,
        }] : []);

        const newSjEntry = {
          suratJalanNumber: sjNumber,
          suratJalanDate: sjDate || nowStr,
          giNumber: giNumber !== undefined ? giNumber : w.giNumber,
          photos: sjList,
          notes: notes,
        };
        const updatedSjList = [newSjEntry, ...prevSjList.filter((s) => s.suratJalanNumber !== sjNumber)];

        return {
          ...w,
          suratJalanNumber: sjNumber,
          suratJalanDate: sjDate || nowStr,
          suratJalanPhoto: sjList[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
          suratJalanPhotos: sjList,
          suratJalanList: updatedSjList,
          reservationNumber: reservationNumber !== undefined ? reservationNumber : w.reservationNumber,
          giNumber: giNumber !== undefined ? giNumber : w.giNumber,
          receiptPhotos: rcList,
          vendorReceiptConfirmed: true,
          vendorReceiptDate: nowStr,
          vendorReceiptNotes: notes,
          reservationStatus: isAllCompleted ? ('Selesai' as const) : ('Siap Ambil Sebagian' as const),
          status: isAllCompleted ? ('Verifikasi SJ' as const) : ('Konstruksi' as const),
          sjVerificationStatus: 'BELUM_DIPERIKSA' as const,
          materials: updatedMats,
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

  pengawasVerifyReceipt: (woId, verifiedMaterials, notes, verifierName) => {
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    set((state) => {
      let hasSelisih = false;
      const updatedWos = state.workOrders.map((w) => {
        if (w.id !== woId) return w;
        const updatedMats = (w.materials || []).map((m) => {
          const match = verifiedMaterials.find((v) => v.material === m.material);
          if (match) {
            const alloc = m.qtyAllocated || m.qtyReksis;
            if (match.qtyTaken !== alloc) hasSelisih = true;
            return {
              ...m,
              qtyTaken: match.qtyTaken,
              isVerified: true,
              verificationNote: match.note || (match.qtyTaken !== alloc ? `Selisih fisik vs alokasi: ${match.qtyTaken} dari ${alloc}` : 'Sesuai fisik Surat Jalan'),
            };
          }
          return m;
        });

        const hasHeld = updatedMats.some((m) => m.isHold);
        const hasRemainingToTake = updatedMats.some((m) => {
          if (m.isHold) return true;
          const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
          return (m.qtyTaken || 0) < req;
        });
        const isAllCompleted = !hasRemainingToTake && !hasHeld;

        let calculatedMatProgress = 0;
        if (updatedMats.length > 0) {
          const totalFulfillment = updatedMats.reduce((sum, m) => {
            if (m.isHold) return sum;
            const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
            const taken = m.qtyTaken || 0;
            return sum + (req > 0 ? Math.min(1, taken / req) : 0);
          }, 0);
          calculatedMatProgress = Math.round((totalFulfillment / updatedMats.length) * 100);
        }
        const matProgress = isAllCompleted ? 100 : Math.min(99, Math.max(calculatedMatProgress > 0 ? 1 : 0, calculatedMatProgress));

        return {
          ...w,
          progressMaterial: matProgress,
          milestones: {
            ...(w.milestones || { material: 0, konstruksi: 0, konduktor: 0, gardu: 0, komisioning: 0, energize: 0 }),
            material: matProgress,
          },
          sjVerificationStatus: hasSelisih ? ('ADA_SELISIH' as const) : ('SESUAI' as const),
          sjVerifiedAt: nowStr,
          sjVerifiedBy: verifierName,
          sjVerificationNotes: notes,
          materials: updatedMats,
        };
      });
      return { workOrders: updatedWos };
    });
    get().addAudit(`Pengawas ${verifierName} memverifikasi fisik material Surat Jalan WO ${woId}`, woId, 'Menu Pengawas');
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
            suratJalanPhoto: photoUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
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
          status: 'Verifikasi SJ' as const,
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


  stocks: [
    { code: '1030097', name: "TRF DIS;;20kV/400V;3P;50kVA;Dyn5;OD", category: 'Trafo', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Unit', status: 'Aman' }, 
    { code: '1030074', name: "TRF DIS;;20kV/400V;3P;100kVA;Dyn5;OD", category: 'Trafo', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Unit', status: 'Aman' }, 
    { code: '1030075', name: "TRF DIS;;20kV/400V;3P;160kVA;Dyn5;OD", category: 'Trafo', qtyFisik: 1, qtyAlokasi: 0, qtySisa: 1, unit: 'Unit', status: 'Menipis' }, 
    { code: '1030077', name: "TRF DIS;D3;20kV/400V;3P;250kVA;Dyn5;OD", category: 'Trafo', qtyFisik: 2, qtyAlokasi: 0, qtySisa: 2, unit: 'Unit', status: 'Menipis' }, 
    { code: '1030114', name: "TRF DIS;D3;20kV/400V;3P;400kVA;Dyn5;OD", category: 'Trafo', qtyFisik: 5, qtyAlokasi: 1, qtySisa: 4, unit: 'Unit', status: 'Aman' }, 
    { code: '3260161', name: "LVSB;DIST;3P;400V;250A;2LINE;OD", category: 'Panel', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '3260237', name: "LVSB;DIST;3P;400V;400A;2LINE;OD", category: 'Panel', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '3260238', name: "LVSB;DIST;3P;400V;400A;4LINE;OD", category: 'Panel', qtyFisik: 8, qtyAlokasi: 2, qtySisa: 6, unit: 'Set', status: 'Aman' }, 
    { code: '3260226', name: "LVSB;DIST;3P;400V;630A;4LINE;OD", category: 'Panel', qtyFisik: 9, qtyAlokasi: 2, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '3110514', name: "CABLE PWR;NYY;1X70MM2;0.6/1KV;OH", category: 'Kabel', qtyFisik: 4009, qtyAlokasi: 1202, qtySisa: 2807, unit: 'Meter', status: 'Aman' }, 
    { code: '3110515', name: "CABLE PWR;NYY;1X95MM2;0.6/1KV;OH", category: 'Kabel', qtyFisik: 133, qtyAlokasi: 39, qtySisa: 94, unit: 'Meter', status: 'Aman' }, 
    { code: '3110517', name: "CABLE PWR;NYY;1X240MM2;0.6/1KV;OH", category: 'Kabel', qtyFisik: 887, qtyAlokasi: 266, qtySisa: 621, unit: 'Meter', status: 'Aman' }, 
    { code: '3110058', name: "CABLE PWR;NYFGBY;4X95mm2;0.6/1kV;UG", category: 'Kabel', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Meter', status: 'Aman' }, 
    { code: '3110010', name: "CABLE PWR;N2XSY;1X35mm2;20kV;UG", category: 'Kabel', qtyFisik: 231, qtyAlokasi: 69, qtySisa: 162, unit: 'Meter', status: 'Aman' }, 
    { code: '3120114', name: "CABLE PWR ACC; CABLE-SHOE CU 70 MM2", category: 'Kabel', qtyFisik: 748, qtyAlokasi: 224, qtySisa: 524, unit: 'Buah', status: 'Aman' }, 
    { code: '3120018', name: "CABLE PWR ACC; CABLE-SHOE CU 95 MM2", category: 'Kabel', qtyFisik: 1457, qtyAlokasi: 437, qtySisa: 1020, unit: 'Buah', status: 'Aman' }, 
    { code: '3120013', name: "CABLE PWR ACC; CABLE-SHOE CU 150 MM2", category: 'Kabel', qtyFisik: 295, qtyAlokasi: 88, qtySisa: 207, unit: 'Buah', status: 'Aman' }, 
    { code: '3120009', name: "CABLE PWR ACC; CABLE-SHOE CU 240 MM2", category: 'Kabel', qtyFisik: 100, qtyAlokasi: 30, qtySisa: 70, unit: 'Buah', status: 'Aman' }, 
    { code: '3120118', name: "CABLE PWR ACC; CABLE-SHOE AL-CU 150 MM2", category: 'Kabel', qtyFisik: 14, qtyAlokasi: 4, qtySisa: 10, unit: 'Buah', status: 'Aman' }, 
    { code: '3120007', name: "CABLE PWR ACC; CABLE-SHOE AL 150 MM2", category: 'Kabel', qtyFisik: 1045, qtyAlokasi: 313, qtySisa: 732, unit: 'Buah', status: 'Aman' }, 
    { code: '1060068', name: "TRF ACC;SERANDANG TRAFO 3P;1 TIANG", category: 'Trafo', qtyFisik: 14, qtyAlokasi: 4, qtySisa: 10, unit: 'Set', status: 'Aman' }, 
    { code: '1060069', name: "TRF ACC;SERANDANG TRAFO 3P;2 TIANG", category: 'Trafo', qtyFisik: 21, qtyAlokasi: 6, qtySisa: 15, unit: 'Set', status: 'Aman' }, 
    { code: '2090032', name: "LA;20-24kV;K;10kA;POLYMER;;", category: 'Proteksi', qtyFisik: 201, qtyAlokasi: 60, qtySisa: 141, unit: 'Buah', status: 'Aman' }, 
    { code: '3190012', name: "CUT OUT;24kV;6-100A;8kA;125kV", category: 'Proteksi', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Buah', status: 'Aman' }, 
    { code: '3200008', name: "CUT OUT ACC;FUSE LINK 20kV 2A", category: 'Proteksi', qtyFisik: 724, qtyAlokasi: 217, qtySisa: 507, unit: 'Buah', status: 'Aman' }, 
    { code: '3200023', name: "CUT OUT ACC;FUSE LINK 20kV 4A", category: 'Proteksi', qtyFisik: 358, qtyAlokasi: 107, qtySisa: 251, unit: 'Buah', status: 'Aman' }, 
    { code: '3200015', name: "CUT OUT ACC;FUSE LINK 20kV 6A", category: 'Proteksi', qtyFisik: 656, qtyAlokasi: 196, qtySisa: 460, unit: 'Buah', status: 'Aman' }, 
    { code: '3200017', name: "CUT OUT ACC;FUSE LINK 20kV 8A", category: 'Proteksi', qtyFisik: 527, qtyAlokasi: 158, qtySisa: 369, unit: 'Buah', status: 'Aman' }, 
    { code: '3200002', name: "CUT OUT ACC;FUSE LINK 20kV 12A", category: 'Proteksi', qtyFisik: 546, qtyAlokasi: 163, qtySisa: 383, unit: 'Buah', status: 'Aman' }, 
    { code: '3200004', name: "CUT OUT ACC;FUSE LINK 20kV 15A", category: 'Proteksi', qtyFisik: 157, qtyAlokasi: 47, qtySisa: 110, unit: 'Buah', status: 'Aman' }, 
    { code: '3041017', name: "UNIV ACC;TRAVES TUMPU", category: 'Aksesori', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '3041019', name: "UNIV ACC;TRAVES TUMPU DOUBLE", category: 'Aksesori', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '3041018', name: "UNIV ACC;TRAVES AFSPAN", category: 'Aksesori', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '3040035', name: "POLE ACC;CR ARM UNP100X50X6X2000mm GALV", category: 'Aksesori', qtyFisik: 89, qtyAlokasi: 26, qtySisa: 63, unit: 'Buah', status: 'Aman' }, 
    { code: '3070151', name: "ISOLATOR;PINPOST;PORC;24KV;;12.5kN", category: 'Isolator', qtyFisik: 2043, qtyAlokasi: 612, qtySisa: 1431, unit: 'Buah', status: 'Aman' }, 
    { code: '3070160', name: "ISOLATOR;STRAIN KAP PIN;PORC;24KV;;70kN", category: 'Isolator', qtyFisik: 94, qtyAlokasi: 28, qtySisa: 66, unit: 'Buah', status: 'Aman' }, 
    { code: '3060167', name: "TOP TIES", category: 'Aksesori', qtyFisik: 392, qtyAlokasi: 117, qtySisa: 275, unit: 'Buah', status: 'Aman' }, 
    { code: '3060382', name: "DOUBLE TIES", category: 'Aksesori', qtyFisik: 508, qtyAlokasi: 152, qtySisa: 356, unit: 'Buah', status: 'Aman' }, 
    { code: '3040329', name: "POLE ACC; STAYSET TM", category: 'Aksesori', qtyFisik: 66, qtyAlokasi: 19, qtySisa: 47, unit: 'Set', status: 'Aman' }, 
    { code: '3120017', name: "CABLE PWR ACC; CABLE-SHOE CU 50 MM2", category: 'Kabel', qtyFisik: 41, qtyAlokasi: 12, qtySisa: 29, unit: 'Buah', status: 'Aman' }, 
    { code: '2150150', name: "CUB;N ISO;CBOG;24kV;630A;16kA; (CT;20KV;K;10/5-5A;0.2S;30VA;ID)", category: 'APP', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '2150146', name: "CUB;N ISO;METERING;24kV;630A;16kA;", category: 'Aksesori', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '2150188', name: "CUB;N ISO;LBS;24kV;630A;16kA;", category: 'Aksesori', qtyFisik: 9, qtyAlokasi: 2, qtySisa: 7, unit: 'Buah', status: 'Aman' }, 
    { code: '2150605', name: "CUB;N ISO;TP;24KV;630A;16KA", category: 'Aksesori', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Buah', status: 'Aman' }, 
    { code: '3110015', name: "CABLE PWR;NA2XSEYBY;3X240mm2;20kV;UG", category: 'Kabel', qtyFisik: 392, qtyAlokasi: 117, qtySisa: 275, unit: 'Meter', status: 'Aman' }, 
    { code: '3050084', name: "CONDUCTOR;AAAC-S;150mm2;", category: 'Kabel', qtyFisik: 9215, qtyAlokasi: 2764, qtySisa: 6451, unit: 'Meter', status: 'Aman' }, 
    { code: '3110034', name: "CABLE PWR;NFA2XSY-T;;3x150+1x95;20kV;OH (MVTIC)", category: 'Kabel', qtyFisik: 2790, qtyAlokasi: 837, qtySisa: 1953, unit: 'Meter', status: 'Aman' }, 
    { code: '3280185', name: "CONN;20KV;H;AL;150-150MM2;PRS;", category: 'Aksesori', qtyFisik: 1244, qtyAlokasi: 373, qtySisa: 871, unit: 'Buah', status: 'Aman' }, 
    { code: '3060132', name: "COND ACC;NON TENSION JOINT AL 150mm2", category: 'Aksesori', qtyFisik: 1209, qtyAlokasi: 362, qtySisa: 847, unit: 'Buah', status: 'Aman' }, 
    { code: '3120060', name: "CABLE PWR ACC; LINK 25X25MM", category: 'Kabel', qtyFisik: 1066, qtyAlokasi: 319, qtySisa: 747, unit: 'Buah', status: 'Aman' }, 
    { code: '3120077', name: "POLE ACC; STAINLESS STEEL STRAP 20X0.7 MM", category: 'Aksesori', qtyFisik: 1199, qtyAlokasi: 359, qtySisa: 840, unit: 'Meter', status: 'Aman' }, 
    { code: '3120079', name: "CABLE PWR ACC; STOPPING BUCKLE SSS 20X40MM", category: 'Kabel', qtyFisik: 1285, qtyAlokasi: 385, qtySisa: 900, unit: 'Buah', status: 'Aman' }, 
    { code: '4120467', name: "BOX APP TRPDU LKP MCCB SHT TRIP;CT 0,5S;; 53 KVA", category: 'APP', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '4120468', name: "BOX APP TRPDU LKP MCCB SHT TRIP;CT 0,5S;; 66 KVA", category: 'APP', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '4120469', name: "BOX APP TRPDU LKP MCCB SHT TRIP;CT 0,5S; 82.5 KVA", category: 'APP', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '4120470', name: "BOX APP TRPDU LKP MCCB SHT TRIP;CT 0,5S;105 KVA", category: 'APP', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '4120471', name: "BOX APP TRPDU LKP MCCB SHT TRIP;CT 0,5S;131 KVA", category: 'APP', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '4120472', name: "BOX APP TRPDU LKP MCCB SHT TRIP;CT 0,5S;147 KVA", category: 'APP', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '4120473', name: "BOX APP TRPDU LKP MCCB SHT TRIP;CT 0,5S;164 KVA", category: 'APP', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '4120474', name: "BOX APP TRPDU LKP MCCB SHT TRIP;CT 0,5S;197 KVA", category: 'APP', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Set', status: 'Aman' }, 
    { code: '3110542', name: "CABLE PWR;NFA2X-T;3X70+1X70;0.6/1kV;OH", category: 'Kabel', qtyFisik: 9135, qtyAlokasi: 2740, qtySisa: 6395, unit: 'Meter', status: 'Aman' }, 
    { code: '3120092', name: "CABLE PWR ACC;SUSPENSION ASSY 70mm", category: 'Kabel', qtyFisik: 1754, qtyAlokasi: 526, qtySisa: 1228, unit: 'Buah', status: 'Aman' }, 
    { code: '3120058', name: "CABLE PWR ACC;LARGE ANGLE ASSY 70mm", category: 'Kabel', qtyFisik: 1117, qtyAlokasi: 335, qtySisa: 782, unit: 'Buah', status: 'Aman' }, 
    { code: '3120038', name: "CABLE PWR ACC;DEAD END ASSY FIXED 70mm", category: 'Kabel', qtyFisik: 1288, qtyAlokasi: 386, qtySisa: 902, unit: 'Buah', status: 'Aman' }, 
    { code: '3120033', name: "CABLE PWR ACC;DEAD END ASSY ADJ 70mm", category: 'Kabel', qtyFisik: 1135, qtyAlokasi: 340, qtySisa: 795, unit: 'Buah', status: 'Aman' }, 
    { code: '3120006', name: "CABLE PWR ACC;BUNDLE END PROTECTION", category: 'Kabel', qtyFisik: 96, qtyAlokasi: 28, qtySisa: 68, unit: 'Buah', status: 'Aman' }, 
    { code: '3280459', name: "CONN;1KV;CCO;AL;50-70/50-70;INSUL;PITA", category: 'Aksesori', qtyFisik: 500, qtyAlokasi: 150, qtySisa: 350, unit: 'Buah', status: 'Aman' }, 
    { code: '3060278', name: "COND ACC;JOINT ALCU 50-70mm2 INSUL", category: 'Aksesori', qtyFisik: 10, qtyAlokasi: 3, qtySisa: 7, unit: 'Buah', status: 'Aman' }, 
    { code: '3040330', name: "POLE ACC; STAYSET TR", category: 'Aksesori', qtyFisik: 130, qtyAlokasi: 39, qtySisa: 91, unit: 'Set', status: 'Aman' }, 
    { code: '3120115', name: "CABLE PWR ACC;CABLE SHOE AL-CU 70mm2", category: 'Kabel', qtyFisik: 1092, qtyAlokasi: 327, qtySisa: 765, unit: 'Buah', status: 'Aman' }, 
  ],

  materialCodeMap: {},

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

  audits: [
    { time: 'Baru saja', user: 'Admin Daftung', activity: 'Inisialisasi sistem Next.js modern', object: 'SYS-NEXTJS', source: 'Core System' },
    { time: '21 Okt 2026 14:20', user: 'Petugas Survey', activity: 'Input survey dan geotagging tiang', object: 'SRV-0284', source: 'Survey Lapangan' },
    { time: '21 Okt 2026 09:42', user: 'Admin Gudang', activity: 'Upload snapshot stok fisik gudang', object: 'STK-2026-1001', source: 'Stok Gudang' },
    { time: '21 Okt 2026 09:18', user: 'Pengawas 1', activity: 'Verifikasi Surat Jalan (SJ-0264-03)', object: 'SJ-0264-03', source: 'Pengawasan' },
  ],

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
  customKhsPrices: {},
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
  vendors: [
    {
      id: 'v-1',
      name: 'PT. HILMAN PRIMA PERKASA',
      director: 'Hilman Sukmana, S.T.',
      address: 'Jl. Raya Pandeglang Km. 4, Rangkasbitung, Banten',
      phone: '(0252) 201889',
      email: 'kontrak@hilmanprima.co.id',
      jenisPekerjaan: ['Tiang', 'Paket 1', 'Paket 2'],
      validFrom: '01 Jan 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
      bankAccount: 'Bank Mandiri 155-00-0988776-1',
      npwp: '01.442.891.2-419.000',
      paketType: 'BOTH',
    },
    {
      id: 'v-2',
      name: 'PT. TAWAKAL KARYA TEKNIK',
      director: 'H. Tubagus Mulyadi',
      address: 'Komp. Grand Banten Blok B No. 12, Serang, Banten',
      phone: '(0254) 849201',
      email: 'adm@tawakalkarya.com',
      jenisPekerjaan: ['Paket 2'],
      validFrom: '01 Jan 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
      bankAccount: 'BRI 0089-01-002345-50-8',
      npwp: '02.889.123.4-401.000',
      paketType: 'PAKET_2',
    },
    {
      id: 'v-3',
      name: 'PT. HALEYORA POWERINDO',
      director: 'Rizal Kurniawan, M.T.',
      address: 'Jl. Jenderal Sudirman No. 88, Cilegon, Banten',
      phone: '(0254) 391120',
      email: 'ops.banten@haleyorapower.co.id',
      jenisPekerjaan: ['Tiang', 'Paket 1'],
      validFrom: '15 Jan 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
      bankAccount: 'BNI 021-9988776',
      npwp: '03.112.556.7-418.000',
      paketType: 'PAKET_1',
    },
    {
      id: 'v-4',
      name: 'PT. ENERGI BANTEN SEJAHTERA',
      director: 'Ir. Dedi Setiadi',
      address: 'Jl. Raya Malingping-Bayah Km. 2, Lebak, Banten',
      phone: '(0252) 508219',
      email: 'admin@energibanten.com',
      jenisPekerjaan: ['Tiang'],
      validFrom: '01 Jan 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
      bankAccount: 'BJB 0012-34-567890-1',
      npwp: '01.993.441.8-419.000',
      paketType: 'BOTH',
    },
  ],

  contracts: [
    {
      id: 'c-1',
      spkNumber: '0021.PJ/DAN.02.03/UP3-BTS/2026',
      title: 'Kontrak KHS Jasa Konstruksi Distribusi JTM & Gardu Distribusi',
      vendorId: 'v-1',
      vendorName: 'PT. HILMAN PRIMA PERKASA',
      jenisPekerjaan: 'Paket 1',
      tipePengadaan: 'JASA',
      nilaiKontrak: 3500000000,
      totalPagu: 3500000000,
      usedPagu: 425000000,
      sisaPagu: 3075000000,
      validFrom: '02 Jan 2026',
      validTo: '31 Des 2026',
      nomorAmandemen: '0021.PJ.AMD-01/DAN.02.03/UP3-BTS/2026',
      amandemenWaktu: '31 Mar 2027',
      supervisorName: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisorRole: 'TC Lola Konstruksi',
      status: 'AKTIF',
      createdAt: '2026-01-02',
      paketType: 'PAKET_1',
    },
    {
      id: 'c-2',
      spkNumber: '0022.PJ/DAN.02.03/UP3-BTS/2026',
      title: 'Kontrak KHS Jasa Konstruksi Distribusi JTR & Sambungan Rumah (SR)',
      vendorId: 'v-2',
      vendorName: 'PT. TAWAKAL KARYA TEKNIK',
      jenisPekerjaan: 'Paket 2',
      tipePengadaan: 'JASA',
      nilaiKontrak: 2000000000,
      totalPagu: 2000000000,
      usedPagu: 280000000,
      sisaPagu: 1720000000,
      validFrom: '02 Jan 2026',
      validTo: '31 Des 2026',
      nomorAmandemen: '0022.PJ.AMD-01/DAN.02.03/UP3-BTS/2026',
      amandemenWaktu: '22 Nov 2026',
      supervisorName: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      supervisorRole: 'TL Teknik ULP Rangkasbitung',
      status: 'AKTIF',
      createdAt: '2026-01-02',
      paketType: 'PAKET_2',
    },
    {
      id: 'c-3',
      spkNumber: '0023.PJ/DAN.02.03/UP3-BTS/2026',
      title: 'Kontrak KHS Pengadaan Material Distribusi & Tiang Beton',
      vendorId: 'v-4',
      vendorName: 'PT. ENERGI BANTEN SEJAHTERA',
      jenisPekerjaan: 'Tiang',
      tipePengadaan: 'MATERIAL',
      nilaiKontrak: 1800000000,
      totalPagu: 1800000000,
      usedPagu: 320000000,
      sisaPagu: 1480000000,
      validFrom: '02 Jan 2026',
      validTo: '31 Des 2026',
      supervisorName: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
      supervisorRole: 'Officer Kinerja Konstruksi',
      status: 'AKTIF',
      createdAt: '2026-01-02',
      paketType: 'PAKET_1',
    },
    {
      id: 'c-4',
      spkNumber: '0024.PJ/DAN.02.03/UP3-BTS/2026',
      title: 'Kontrak KHS Jasa & Material Pemasangan Tiang Distribusi TM/TR',
      vendorId: 'v-3',
      vendorName: 'PT. HALEYORA POWERINDO',
      jenisPekerjaan: 'Tiang',
      tipePengadaan: 'JASA & MATERIAL',
      nilaiKontrak: 2500000000,
      totalPagu: 2500000000,
      usedPagu: 650000000,
      sisaPagu: 1850000000,
      validFrom: '15 Jan 2026',
      validTo: '31 Des 2026',
      nomorAmandemen: '0024.PJ.AMD-01/DAN.02.03/UP3-BTS/2026',
      amandemenWaktu: '25 Nov 2026',
      supervisorName: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      supervisorRole: 'TL Teknik ULP Rangkasbitung',
      status: 'AKTIF',
      createdAt: '2026-01-15',
      paketType: 'PAKET_1',
    },
  ],

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
  materialContracts: [
    {
      id: 'mc-1',
      notaDinas: '0128/DAN.02.01/UP3-BTS/2026',
      tanggalNotaDinas: '12 Jan 2026',
      judulPengadaan: 'Pengadaan Trafo Distribusi 20kV / 400V Tahap I Tahun 2026',
      nilaiRabNodin: 1520000000,
      nomorSpk: '0015.PJ/DAN.02.01/UP3-BTS/2026',
      namaVendor: 'PT. TRAFOINDO PRIMA PERKASA',
      nilaiSpk: 1445000000,
      validFrom: '20 Jan 2026',
      validTo: '30 Jun 2026',
      status: 'AKTIF',
      rincianMaterial: [
        {
          id: 'mi-1',
          kode: 'M-TRF-250',
          deskripsi: 'Trafo Distribusi 250 kVA 20kV / 400V 3 Phasa',
          satuan: 'Unit',
          volume: 4,
          hargaSatuan: 195000000,
          totalHarga: 780000000,
          keterangan: 'Garansi pabrikan 5 tahun, pengujian FAT lulus',
        },
        {
          id: 'mi-2',
          kode: 'M-TRF-160',
          deskripsi: 'Trafo Distribusi 160 kVA 20kV / 400V 3 Phasa',
          satuan: 'Unit',
          volume: 3,
          hargaSatuan: 145000000,
          totalHarga: 435000000,
          keterangan: 'Dilengkapi sertifikasi SPLN D3.002',
        },
        {
          id: 'mi-3',
          kode: 'M-TRF-100',
          deskripsi: 'Trafo Distribusi 100 kVA 20kV / 400V 3 Phasa',
          satuan: 'Unit',
          volume: 2,
          hargaSatuan: 115000000,
          totalHarga: 230000000,
          keterangan: 'Tingkat efisiensi tier-2 hermetically sealed',
        },
      ],
      keterangan: 'Pengadaan material utama trafo gardu distribusi UP3 Banten Selatan',
    },
    {
      id: 'mc-2',
      notaDinas: '0145/DAN.02.01/UP3-BTS/2026',
      tanggalNotaDinas: '18 Jan 2026',
      judulPengadaan: 'Pengadaan Tiang Beton Distribusi 9 Meter & 12 Meter',
      nilaiRabNodin: 980000000,
      nomorSpk: '0028.PJ/DAN.02.01/UP3-BTS/2026',
      namaVendor: 'PT. WIJAYA KARYA BETON Tbk',
      nilaiSpk: 935000000,
      validFrom: '25 Jan 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
      rincianMaterial: [
        {
          id: 'mi-4',
          kode: 'M-TNG-12-350',
          deskripsi: 'Tiang Beton Pre-stressed 12 Meter / 350 daN',
          satuan: 'Batang',
          volume: 80,
          hargaSatuan: 4500000,
          totalHarga: 360000000,
          keterangan: 'Kebutuhan utama SUTM 20kV',
        },
        {
          id: 'mi-5',
          kode: 'M-TNG-12-200',
          deskripsi: 'Tiang Beton Pre-stressed 12 Meter / 200 daN',
          satuan: 'Batang',
          volume: 75,
          hargaSatuan: 3800000,
          totalHarga: 285000000,
          keterangan: 'Tiang tumpu & penyangga distribusi',
        },
        {
          id: 'mi-6',
          kode: 'M-TNG-9-200',
          deskripsi: 'Tiang Beton Pre-stressed 9 Meter / 200 daN',
          satuan: 'Batang',
          volume: 100,
          hargaSatuan: 2900000,
          totalHarga: 290000000,
          keterangan: 'Tiang saluran udara tegangan rendah (SUTR)',
        },
      ],
      keterangan: 'Distribusi tiang beton ke ULP Labuan, Malingping, & Rangkasbitung',
    },
    {
      id: 'mc-3',
      notaDinas: '0188/DAN.02.01/UP3-BTS/2026',
      tanggalNotaDinas: '02 Feb 2026',
      judulPengadaan: 'Pengadaan Konduktor A3CS & Kabel Pilin Twisted LVTC',
      nilaiRabNodin: 1850000000,
      nomorSpk: '0039.PJ/DAN.02.01/UP3-BTS/2026',
      namaVendor: 'PT. SUPREME CABLE MANUFACTURING & COMMERCE Tbk',
      nilaiSpk: 1760000000,
      validFrom: '10 Feb 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
      rincianMaterial: [
        {
          id: 'mi-7',
          kode: 'M-KBL-A3CS-150',
          deskripsi: 'Konduktor Berisolasi Setengah A3CS 150 mm²',
          satuan: 'Meter',
          volume: 15000,
          hargaSatuan: 48000,
          totalHarga: 720000000,
          keterangan: 'Standar SPLN 41-10',
        },
        {
          id: 'mi-8',
          kode: 'M-KBL-A3CS-70',
          deskripsi: 'Konduktor Berisolasi Setengah A3CS 70 mm²',
          satuan: 'Meter',
          volume: 10000,
          hargaSatuan: 32000,
          totalHarga: 320000000,
          keterangan: 'Ekspansi jaringan SUTM 20kV',
        },
        {
          id: 'mi-9',
          kode: 'M-KBL-LVTC-70',
          deskripsi: 'Kabel Pilin Udara LVTC 3×70 + 1×50 mm²',
          satuan: 'Meter',
          volume: 12000,
          hargaSatuan: 45000,
          totalHarga: 540000000,
          keterangan: 'Kabel jaringan tegangan rendah (JTR)',
        },
        {
          id: 'mi-10',
          kode: 'M-KBL-LVTC-16',
          deskripsi: 'Kabel Saluran Masuk Pelanggan LVTC 2×16 mm²',
          satuan: 'Meter',
          volume: 10000,
          hargaSatuan: 18000,
          totalHarga: 180000000,
          keterangan: 'Penyambungan baru SR pelanggan',
        },
      ],
      keterangan: 'Stok cadang kabel & kawat konduktor penunjang pekerjaan pasang baru',
    },
    {
      id: 'mc-4',
      notaDinas: '0210/DAN.02.01/UP3-BTS/2026',
      tanggalNotaDinas: '15 Feb 2026',
      judulPengadaan: 'Pengadaan Panel Hubung Bagi PHB-TR & Fuse Cut Out (FCO)',
      nilaiRabNodin: 640000000,
      nomorSpk: '0052.PJ/DAN.02.01/UP3-BTS/2026',
      namaVendor: 'PT. SCHNEIDER INDONESIA',
      nilaiSpk: 612000000,
      validFrom: '20 Feb 2026',
      validTo: '30 Sep 2026',
      status: 'AKTIF',
      rincianMaterial: [
        {
          id: 'mi-11',
          kode: 'M-PHB-4J',
          deskripsi: 'Panel Hubung Bagi PHB-TR 4 Jurusan Lengkap Fuse NH',
          satuan: 'Set',
          volume: 12,
          hargaSatuan: 32000000,
          totalHarga: 384000000,
          keterangan: 'Perlengkapan gardu portal & cantol',
        },
        {
          id: 'mi-12',
          kode: 'M-FCO-24',
          deskripsi: 'Fuse Cut Out (FCO) 24 kV 100A Polymer Insulator',
          satuan: 'Set',
          volume: 40,
          hargaSatuan: 3200000,
          totalHarga: 128000000,
          keterangan: 'Proteksi transformator gardu distribusi',
        },
        {
          id: 'mi-13',
          kode: 'M-LA-24',
          deskripsi: 'Lightning Arrester 24 kV 10 kA Polymer',
          satuan: 'Set',
          volume: 40,
          hargaSatuan: 2500000,
          totalHarga: 100000000,
          keterangan: 'Proteksi surja petir gardu distribusi',
        },
      ],
      keterangan: 'Material proteksi & pembagi beban gardu distribusi',
    },
  ],

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

  supervisors: [
    {
      id: 'sup-1',
      name: 'Hasian Sitorus',
      role: 'TC Lola Konstruksi',
      category: 'Pengawas 1',
      unit: 'UP3 Banten Selatan',
      nip: '8914234ZY',
      phone: '0812-3456-7890',
      status: 'AKTIF',
    },
    {
      id: 'sup-2',
      name: 'Winnetou Chandra Sadli',
      role: 'Officer Kinerja Konstruksi',
      category: 'Pengawas 1',
      unit: 'UP3 Banten Selatan',
      nip: '9216781AB',
      phone: '0813-8888-9999',
      status: 'AKTIF',
    },
    {
      id: 'sup-3',
      name: 'Daud Febrizer',
      role: 'TL Teknik ULP Rangkasbitung',
      category: 'Pengawas 2',
      unit: 'ULP Rangkasbitung',
      nip: '9417652CD',
      phone: '0811-2233-4455',
      status: 'AKTIF',
    },
    {
      id: 'sup-4',
      name: 'Rahmat Hidayat',
      role: 'TL Teknik ULP Malingping',
      category: 'Pengawas 2',
      unit: 'ULP Malingping',
      nip: '9115432EF',
      phone: '0812-9988-7766',
      status: 'AKTIF',
    },
    {
      id: 'sup-5',
      name: 'Budi Santoso',
      role: 'TL Teknik ULP Pandeglang',
      category: 'Pengawas 2',
      unit: 'ULP Pandeglang',
      nip: '9014321GH',
      phone: '0815-4433-2211',
      status: 'AKTIF',
    },
    {
      id: 'sup-6',
      name: 'Ari Wibowo',
      role: 'TL Teknik ULP Labuan',
      category: 'Pengawas 2',
      unit: 'ULP Labuan',
      nip: '9316543JK',
      phone: '0817-6655-4433',
      status: 'AKTIF',
    },
  ],

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

  saveRabOverrides: ({ surveyId, woId, paket, volumeOverrides, extraItems }) => {
    // 1. Update di Surveys jika ada surveyId
    if (surveyId) {
      set((state) => ({
        surveys: state.surveys.map((srv) => {
          if (srv.id === surveyId) {
            const currentOverrides = srv.rabCustomOverrides || {};
            return {
              ...srv,
              rabCustomOverrides: {
                ...currentOverrides,
                [paket]: {
                  volumeOverrides,
                  extraItems: extraItems || [],
                },
              },
            };
          }
          return srv;
        }),
      }));
    }

    // 2. Update di WorkOrders jika ada woId
    if (woId) {
      set((state) => ({
        workOrders: state.workOrders.map((wo) => {
          if (wo.id === woId) {
            const currentOverrides = wo.rabCustomOverrides || {};
            return {
              ...wo,
              rabCustomOverrides: {
                ...currentOverrides,
                [paket]: {
                  volumeOverrides,
                  extraItems: extraItems || [],
                },
              },
            };
          }
          return wo;
        }),
      }));
    }

    get().addAudit(`Penyesuaian Manual RAB (${paket})`, surveyId || woId || 'RAB', 'RAB Document');
    get().showToast('✓ Penyesuaian RAB berhasil disimpan');
  },

  // Sweeping Material State & Actions
  sweepings: [
    {
      id: 'swp-001',
      nomorSweeping: 'SWP/UP3-BTS/2025/09/001',
      namaPekerjaan: 'PENGGANTIAN KUBIKEL RAWAN GANGGUAN',
      noSpk: '0142.SPK/DAN.01.02/F30020000/2025',
      tanggal: '01 September 2025',
      lokasi: 'UP3 BANTEN SELATAN',
      pelaksana: 'PT HAFIZH PUTRA PERKASA',
      woIds: ['001.11.WO.P1.2026'],
      status: 'DIVERIFIKASI_PENGAWAS',
      createdAt: '2025-09-01T09:00:00.000Z',
      ttdVendorName: 'Direktur PT Hafizh Putra Perkasa',
      ttdPengawasName: 'Hasian Sitorus (TC Lola Konstruksi)',
      ttdGudangName: 'Petugas Gudang UP3 Banten Selatan',
      catatan: 'Rekonsiliasi sweeping opname material kubikel 24kV & bongkaran material lama.',
      items: [
        {
          id: 'swp-it-1',
          material: 'CUB;N ISO;LBS MOTORIZE;24KV;630A;17KA',
          volPengambilan: 14,
          satPengambilan: 'SET',
          noTug9: '562102508089001',
          ketPengambilan: '14',
          volTerpasang: 14,
          satTerpasang: 'SET',
          ketTerpasang: 'Terpasang Baik',
          volDikembalikan: 14,
          satDikembalikan: 'SET',
          noTug10: '562402505227223',
          ketDikembalikan: 'BONGKARAN'
        },
        {
          id: 'swp-it-2',
          material: 'CUB;N ISO;LBS;24KV;630A;16KA',
          volPengambilan: 4,
          satPengambilan: 'SET',
          noTug9: '562102603096570',
          ketPengambilan: '4',
          volTerpasang: 4,
          satTerpasang: 'SET',
          ketTerpasang: 'Terpasang Baik',
          volDikembalikan: 4,
          satDikembalikan: 'SET',
          noTug10: '562402505166315',
          ketDikembalikan: 'BONGKARAN'
        },
        {
          id: 'swp-it-3',
          material: 'CUB;N ISO;TP;24KV;630A;16KA',
          volPengambilan: 4,
          satPengambilan: 'SET',
          noTug9: '562102603096570',
          ketPengambilan: '4',
          volTerpasang: 4,
          satTerpasang: 'SET',
          ketTerpasang: 'Terpasang Baik',
          volDikembalikan: 4,
          satDikembalikan: 'SET',
          noTug10: '562402505166314',
          ketDikembalikan: 'BONGKARAN'
        },
        {
          id: 'swp-it-4',
          material: 'CUB;N ISO;CBOG MOT MTR;24KV;630A;16KA',
          volPengambilan: 10,
          satPengambilan: 'SET',
          noTug9: '562102508089001',
          ketPengambilan: '10',
          volTerpasang: 10,
          satTerpasang: 'SET',
          ketTerpasang: 'Terpasang Baik',
          volDikembalikan: 10,
          satDikembalikan: 'SET',
          noTug10: '562402505166314',
          ketDikembalikan: 'BONGKARAN'
        }
      ]
    }
  ],

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
              status: overall >= 100 ? 'Selesai' : 'Konstruksi',
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

}));
