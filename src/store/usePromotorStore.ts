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
  ApplyWoSignatures,
  VendorRecord,
  ContractRecord,
  WoMaterialItem,
  SupervisorRecord
} from '@/types';
import { calculateRabFromSurvey } from '@/data/rabMasterData';

interface PromotorState {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Surveys
  surveys: SurveyRecord[];
  addSurvey: (survey: Omit<SurveyRecord, 'id' | 'createdAt' | 'status'> & { poles: PoleData[] }) => string;
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
    customParams?: {
      paket1: {
        enabled: boolean;
        vendor: string;
        contractId?: string;
        noSpk?: string;
        validFrom?: string;
        validTo?: string;
        noWorkOrder: string;
        pengawas2?: string;
        pengawas1: string;
      };
      paket2: {
        enabled: boolean;
        vendor: string;
        contractId?: string;
        noSpk?: string;
        validFrom?: string;
        validTo?: string;
        noWorkOrder: string;
        pengawas2?: string;
        pengawas1: string;
      };
      signatures?: ApplyWoSignatures;
    }
  ) => void;
  approveWorkOrder: (
    id: string,
    approverData?: { name?: string; role?: string; signature?: string; catatan?: string }
  ) => void;
  rejectWorkOrder: (id: string, reason: string) => void;
  resubmitWorkOrder: (id: string, updates?: Partial<WorkOrderRecord>) => void;
  selectedDaftungIdForWo: string | null;
  setSelectedDaftungIdForWo: (id: string | null) => void;
  openApplyWoFromDaftung: (daftungId: string) => void;
  updateWoProgress: (id: string, progress: number, note?: string) => void;
  updateWoReservation: (id: string, status: WorkOrderRecord['reservationStatus']) => void;
  deleteWorkOrder: (id: string) => void;

  // Master Vendors & Kontrak
  vendors: VendorRecord[];
  addVendor: (vendor: Omit<VendorRecord, 'id'>) => void;
  updateVendor: (id: string, updates: Partial<VendorRecord>) => void;
  deleteVendor: (id: string) => void;

  contracts: ContractRecord[];
  addContract: (contract: Omit<ContractRecord, 'id' | 'usedPagu' | 'createdAt'>) => void;
  updateContract: (id: string, updates: Partial<ContractRecord>) => void;
  deleteContract: (id: string) => void;

  // Master Pengawas
  supervisors: SupervisorRecord[];
  addSupervisor: (supervisor: Omit<SupervisorRecord, 'id'>) => void;
  updateSupervisor: (id: string, updates: Partial<SupervisorRecord>) => void;
  deleteSupervisor: (id: string) => void;

  // Stocks
  stocks: StockMaterial[];

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
}

export const usePromotorStore = create<PromotorState>((set, get) => ({
  currentRole: 'Admin Daftung',
  setCurrentRole: (role) => set({ currentRole: role }),
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  activeDaftungTab: 'ap2t',
  setActiveDaftungTab: (tab) => set({ activeDaftungTab: tab }),

  activeRabSurveyId: 'SRV-0285',
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
      id: 'SRV-SMPL-001',
      customerName: 'PT SINAR REJEKI ABADI (Portal 160 kVA, 105 kVA)',
      namaDasar: 'PT SINAR REJEKI ABADI',
      dayaBaru: '105000',
      tarifBaru: 'I2',
      location: 'Kawasan Industri Cikande, Serang',
      address: 'Blok C2 No. 15 Cikande',
      officerName: 'Agus Priyanto (Petugas Survey)',
      jobType: 'Pasang Baru',
      status: 'Terverifikasi',
      createdAt: '28 Okt 2026 08:30',
      tipePembangunanGardu: 'Gardu Portal Distribusi',
      kapasitasTrafo: '160 kVA',
      jumlahKabelNaik: '2',
      poles: [
        {
          id: 'TM-1',
          name: 'Tiang TM #1',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '80',
          conductorLength: 80,
          qty: 1,
          coordStr: '-6.185200, 106.345100',
          lat: -6.1852,
          lng: 106.3451,
          note: 'Penyulang TM eksisting',
        },
        {
          id: 'TM-2',
          name: 'Tiang TM #2 (Gardu Portal)',
          std: 'Tiang 12/350',
          networkType: 'JTM',
          poleType: '12/350',
          tmConstruction: 'GARDU PORTAL DISTRIBUSI',
          a3cs: '40',
          conductorLength: 40,
          qty: 1,
          coordStr: '-6.185500, 106.345400',
          lat: -6.1855,
          lng: 106.3454,
          note: 'Lokasi Gardu Portal 160 kVA',
        },
        {
          id: 'TR-1',
          name: 'Tiang TR #1',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '50',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.185700, 106.345600',
          lat: -6.1857,
          lng: 106.3456,
          note: 'Saluran TR pembagi',
        },
        {
          id: 'TR-2',
          name: 'Tiang TR #2 (Opstig Box APP)',
          std: 'Tiang 9/350',
          networkType: 'JTR',
          poleType: '9/350',
          trConstruction: 'TR - 11B',
          lvTwisted: '40',
          conductorLength: 40,
          qty: 1,
          coordStr: '-6.185900, 106.345800',
          lat: -6.1859,
          lng: 106.3458,
          note: 'Kabel naik ke Box APP TRPDU 105 kVA',
        },
      ],
    },
    {
      id: 'SRV-SMPL-002',
      customerName: 'CV BERKAH BERSAMA JAYA (Cantol 50 kVA, 53 kVA)',
      namaDasar: 'CV BERKAH BERSAMA JAYA',
      dayaBaru: '53000',
      tarifBaru: 'B2',
      location: 'Jl. Raya Labuan KM 5, Pandeglang',
      address: 'Ruko Sentra Niaga No. 8',
      officerName: 'Bambang Irawan (Petugas Survey)',
      jobType: 'Pasang Baru',
      status: 'Terverifikasi',
      createdAt: '29 Okt 2026 14:15',
      tipePembangunanGardu: 'Gardu Cantol Distribusi',
      kapasitasTrafo: '50 kVA',
      jumlahKabelNaik: '1',
      poles: [
        {
          id: 'TM-1',
          name: 'Tiang Cantol',
          std: 'Tiang 12/350',
          networkType: 'JTM',
          poleType: '12/350',
          tmConstruction: 'GARDU CANTOL DISTRIBUSI',
          a3cs: '40',
          conductorLength: 40,
          qty: 1,
          coordStr: '-6.312400, 106.104200',
          lat: -6.3124,
          lng: 106.1042,
          note: 'Pemasangan Gardu Cantol 50 kVA',
        },
        {
          id: 'TR-1',
          name: 'Tiang TR #1',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '45',
          conductorLength: 45,
          qty: 1,
          coordStr: '-6.312600, 106.104500',
          lat: -6.3126,
          lng: 106.1045,
          note: 'Saluran distribusi TR',
        },
        {
          id: 'TR-2',
          name: 'Tiang TR #2 (Akhir)',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 10 B AKHIR',
          lvTwisted: '35',
          conductorLength: 35,
          qty: 1,
          coordStr: '-6.312800, 106.104800',
          lat: -6.3128,
          lng: 106.1048,
          note: 'Tiang akhir & pembumian TR',
        },
      ],
    },
    {
      id: 'SRV-SMPL-003',
      customerName: 'PT KARYA MANDIRI STEEL (Portal RMU 250 kVA, 197 kVA)',
      namaDasar: 'PT KARYA MANDIRI STEEL',
      idpel: '541099887766',
      dayaBaru: '197000',
      tarifBaru: 'I2',
      location: 'Kawasan Industri Modern Cikande Kav. D-12, Serang',
      address: 'Jl. Raya Industri Modern No. 12',
      officerName: 'Suryadi (Petugas Survey)',
      jobType: 'Pasang Baru',
      status: 'Terverifikasi',
      createdAt: '30 Okt 2026 09:15',
      tipePembangunanGardu: 'Gardu Portal RMU',
      kapasitasTrafo: '250 kVA',
      jumlahKabelNaik: '2',
      poles: [
        {
          id: 'TM-1',
          name: 'Tiang TM #1',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '60',
          conductorLength: 60,
          qty: 1,
          coordStr: '-6.186100, 106.347200',
          lat: -6.1861,
          lng: 106.3472,
          note: 'Interkoneksi SUTM 20kV Jalur Utama',
        },
        {
          id: 'TM-2',
          name: 'Tiang TM #2',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.186350, 106.347500',
          lat: -6.18635,
          lng: 106.3475,
          note: 'Tiang tumpu lurus depan workshop',
        },
        {
          id: 'TM-3',
          name: 'Tiang TM #3',
          std: 'Tiang 12/350',
          networkType: 'JTM',
          poleType: '12/350',
          tmConstruction: 'TM - 2B',
          a3cs: '50',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.186600, 106.347800',
          lat: -6.1866,
          lng: 106.3478,
          note: 'Tiang sudut belokan ke tapak gardu',
        },
        {
          id: 'TM-4',
          name: 'Tiang TM #4 (Gardu Portal RMU)',
          std: 'Tiang 12/350 (GARDU)',
          networkType: 'JTM',
          poleType: '12/350 (GARDU)',
          tmConstruction: 'GARDU PORTAL DENGAN RMU',
          a3cs: '40',
          conductorLength: 40,
          qty: 1,
          coordStr: '-6.186850, 106.348100',
          lat: -6.18685,
          lng: 106.3481,
          note: 'Titik Gardu Portal RMU Motorized 250 kVA',
        },
        {
          id: 'TM-5',
          name: 'Tiang TM #5 (STAY)',
          std: 'Tiang 12/350 (GARDU)',
          networkType: 'JTM',
          poleType: '12/350 (GARDU)',
          tmConstruction: 'STAYSET TM',
          a3cs: '10',
          conductorLength: 10,
          qty: 1,
          coordStr: '-6.186900, 106.348150',
          lat: -6.1869,
          lng: 106.34815,
          note: 'Trekschub & penahan tarikan gawang portal',
        },
        {
          id: 'TR-1',
          name: 'Tiang TR #1',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '50',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.187100, 106.348350',
          lat: -6.1871,
          lng: 106.34835,
          note: 'Saluran distribusi TR ke Gedung Kantor & Mess',
        },
        {
          id: 'TR-2',
          name: 'Tiang TR #2 (Box APP TRPDU)',
          std: 'Tiang 9/350',
          networkType: 'JTR',
          poleType: '9/350',
          trConstruction: 'TR - 11B',
          lvTwisted: '50',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.187300, 106.348600',
          lat: -6.1873,
          lng: 106.3486,
          note: 'Kabel opstig ke Box APP Pelanggan Daya 197 kVA',
        },
      ],
    },
    {
      id: 'SRV-SMPL-004',
      customerName: 'PT MAKMUR SENTOSA BERSAMA (Simulasi Survey 250 kVA)',
      namaDasar: 'PT MAKMUR SENTOSA BERSAMA',
      idpel: '541077889900',
      dayaBaru: '197000',
      tarifBaru: 'I2',
      location: 'Jl. Industri Modern Cikande No. 99, Lebak',
      jobType: 'Pasang Baru',
      address: 'Kawasan Industri Cikande',
      officerName: 'Budi Santoso (Petugas Survey)',
      status: 'Terverifikasi',
      createdAt: '30 Okt 2026 10:30',
      garduInduk: 'GI RANGKASBITUNG BARU',
      penyulang: 'P.CITRA',
      gardu: 'MAJA088',
      ulp: 'ULP Rangkasbitung',
      tipePembangunanGardu: 'Gardu Portal Distribusi',
      kapasitasTrafo: '250 kVA',
      jumlahKabelNaik: '2',
      poles: [
        {
          id: 'TM-1',
          name: 'Tiang TM #1',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.200100, 106.300100',
          lat: -6.2001,
          lng: 106.3001,
          note: 'Pangkal feeder SUTM',
        },
        {
          id: 'TM-2',
          name: 'Tiang TM #2 (Gardu Portal)',
          std: 'Tiang 12/350 (GARDU)',
          networkType: 'JTM',
          poleType: '12/350 (GARDU)',
          tmConstruction: 'GARDU PORTAL DISTRIBUSI',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.200500, 106.300500',
          lat: -6.2005,
          lng: 106.3005,
          note: 'Tapak Gardu Portal 250 kVA',
        },
        {
          id: 'TR-1',
          name: 'Tiang TR #1',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '45 m',
          conductorLength: 45,
          qty: 1,
          coordStr: '-6.200800, 106.300800',
          lat: -6.2008,
          lng: 106.3008,
          note: 'Saluran distribusi TR pabrik',
        },
        {
          id: 'TR-2',
          name: 'Tiang TR #2 (Box APP)',
          std: 'Tiang 9/350',
          networkType: 'JTR',
          poleType: '9/350',
          trConstruction: 'TR - 11B',
          lvTwisted: '45 m',
          conductorLength: 45,
          qty: 1,
          coordStr: '-6.201000, 106.301000',
          lat: -6.201,
          lng: 106.301,
          note: 'Opstig Box APP TRPDU 197 kVA',
        },
      ],
    },
    {
      id: 'SRV-0285',
      customerName: 'Perumahan Mutiara Maja Cluster Beryl 212 x 1.300 VA',
      namaDasar: 'Perumahan Mutiara Maja Cluster Beryl',
      jumlahUnit: 212,
      dayaPerUnit: '1.300',
      dayaBaru: '1.300',
      tarifBaru: 'R1T',
      kampung: 'Curug Badak',
      desa: 'Curugbadak',
      kecamatan: 'Maja',
      kabupaten: 'Kabupaten Lebak',
      location: 'Curug Badak, Curugbadak, Maja, Kabupaten Lebak',
      address: 'Dekat Stasiun Maja',
      tipePembangunanGardu: 'Gardu Portal Distribusi',
      kapasitasTrafo: '250 kVA',
      jumlahKabelNaik: '2',
      officerName: 'Suryadi (Petugas Survey)',
      jobType: 'Pasang Baru',
      status: 'Menunggu verifikasi Daftung',
      createdAt: '23 Okt 2026 10:30',
      poles: [
        // JTM Poles
        {
          id: 'TM-1',
          name: 'Tiang TM #1',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.328120, 106.398410',
          lat: -6.32812,
          lng: 106.39841,
          note: 'Pangkal tarikan depan gerbang cluster',
        },
        {
          id: 'TM-2',
          name: 'Tiang TM #2',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.328350, 106.398850',
          lat: -6.32835,
          lng: 106.39885,
          note: 'Jalur utama Jl. Beryl Raya',
        },
        {
          id: 'TM-3',
          name: 'Tiang TM #3',
          std: 'Tiang 12/350',
          networkType: 'JTM',
          poleType: '12/350',
          tmConstruction: 'TM - 7B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.328600, 106.399200',
          lat: -6.3286,
          lng: 106.3992,
          note: 'Sudut belokan bundaran cluster',
        },
        {
          id: 'TM-4',
          name: 'Tiang TM #4',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.328850, 106.399550',
          lat: -6.32885,
          lng: 106.39955,
          note: 'Antar tiang lurus',
        },
        {
          id: 'TM-5',
          name: 'Tiang TM #5',
          std: 'Tiang 12/350',
          networkType: 'JTM',
          poleType: '12/350',
          tmConstruction: 'TM - 2B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.329100, 106.399900',
          lat: -6.3291,
          lng: 106.3999,
          note: 'Sudut kecil percabangan blok B',
        },
        {
          id: 'TM-6',
          name: 'Tiang TM #6',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.329350, 106.400250',
          lat: -6.32935,
          lng: 106.40025,
          note: 'Tumpu lurus Jl. Beryl Barat',
        },
        {
          id: 'TM-7',
          name: 'Tiang TM #7',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.329600, 106.400600',
          lat: -6.3296,
          lng: 106.4006,
          note: 'Tiang tumpu mendekati lokasi Gardu',
        },
        {
          id: 'TM-8',
          name: 'Tiang TM #8 (GARDU)',
          std: 'Tiang 12/350 (GARDU)',
          networkType: 'JTM',
          poleType: '12/350 (GARDU)',
          tmConstruction: 'GARDU PORTAL DISTRIBUSI',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.329850, 106.400950',
          lat: -6.32985,
          lng: 106.40095,
          note: 'Titik Gardu Portal Distribusi 250 kVA',
        },
        {
          id: 'TM-9',
          name: 'Tiang TM #9 (STAY)',
          std: 'Tiang 12/350 (GARDU)',
          networkType: 'JTM',
          poleType: '12/350 (GARDU)',
          tmConstruction: 'STAYSET',
          a3cs: '10 m',
          conductorLength: 10,
          qty: 1,
          coordStr: '-6.329900, 106.401000',
          lat: -6.3299,
          lng: 106.401,
          note: 'Penahan tiang portal gardu',
        },

        // JTR Poles
        {
          id: 'TR-1',
          name: 'Tiang TR #1',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '45 m',
          conductorLength: 45,
          qty: 1,
          coordStr: '-6.329880, 106.401100',
          lat: -6.32988,
          lng: 106.4011,
          note: 'Awal jaringan TR keluar dari gardu portal',
        },
        {
          id: 'TR-2',
          name: 'Tiang TR #2',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '45 m',
          conductorLength: 45,
          qty: 1,
          coordStr: '-6.330100, 106.401350',
          lat: -6.3301,
          lng: 106.40135,
          note: 'Tiang tumpu TR gang blok A',
        },
        {
          id: 'TR-3',
          name: 'Tiang TR #3',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 2B',
          lvTwisted: '40 m',
          conductorLength: 40,
          qty: 1,
          coordStr: '-6.330350, 106.401600',
          lat: -6.33035,
          lng: 106.4016,
          note: 'Sudut belokan TR blok A',
        },
        {
          id: 'TR-4',
          name: 'Tiang TR #4',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.330600, 106.401900',
          lat: -6.3306,
          lng: 106.4019,
          note: 'Tiang tumpu lurus TR blok B',
        },
        {
          id: 'TR-5',
          name: 'Tiang TR #5',
          std: 'Tiang 9/350',
          networkType: 'JTR',
          poleType: '9/350',
          trConstruction: 'TR - 10 B AKHIR',
          lvTwisted: '35 m',
          conductorLength: 35,
          qty: 1,
          coordStr: '-6.330850, 106.402200',
          lat: -6.33085,
          lng: 106.4022,
          note: 'Ujung akhir tarikan TR blok B',
        },
        {
          id: 'TR-6',
          name: 'Tiang TR #6',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'STAY SET TR',
          lvTwisted: '0 m',
          conductorLength: 0,
          qty: 1,
          coordStr: '-6.330880, 106.402250',
          lat: -6.33088,
          lng: 106.40225,
          note: 'Trekschut / stay penahan tiang akhir TR',
        },
      ],
    },
    {
      id: 'SRV-0284',
      customerName: 'PT Cipta Beton Sejahtera',
      namaDasar: 'PT Cipta Beton Sejahtera',
      idpel: '541098234112',
      jobType: 'Pasang Baru',
      kampung: 'Kawasan Industri Blok C3',
      desa: 'Cikande',
      kecamatan: 'Cikande',
      kabupaten: 'Kabupaten Serang',
      location: 'Kawasan Industri Cikande Blok C3, Serang',
      address: 'Dekat interchange tol',
      dayaBaru: '197,000',
      tarifBaru: 'I2',
      tipePembangunanGardu: 'Gardu Portal RMU',
      kapasitasTrafo: '250 kVA',
      jumlahKabelNaik: '2',
      officerName: 'Suryadi (Petugas Survey)',
      status: 'Menunggu verifikasi Daftung',
      createdAt: '21 Okt 2026 14:20',
      poles: [
        {
          id: 'T1',
          name: 'Tiang #1',
          std: 'Tiang A1',
          qty: 1,
          coordStr: '-6.185240, 106.350120',
          lat: -6.18524,
          lng: 106.35012,
          note: 'Tiang sudut depan gerbang utama',
        },
        {
          id: 'T2',
          name: 'Tiang #2',
          std: 'Tiang B2',
          qty: 1,
          coordStr: '-6.185450, 106.350890',
          lat: -6.18545,
          lng: 106.35089,
          note: 'Penarikan ke arah Gardu Beton',
        },
      ],
    },
    {
      id: 'SRV-0283',
      customerName: 'Bpk. Ahmad Fauzi',
      idpel: '541088761234',
      jobType: 'Perluasan Jaringan',
      location: 'Kp. Sukamaju RT 03/02 Ds. Sindangsari',
      dayaBaru: '41.500',
      tarifBaru: 'B1',
      tipePembangunanGardu: 'Gardu Cantol Distribusi',
      kapasitasTrafo: '50 kVA',
      jumlahKabelNaik: '1',
      officerName: 'Rahmat Hidayat',
      status: 'Terverifikasi',
      createdAt: '20 Okt 2026 10:15',
      poles: [
        // JTM Poles (Paket 1)
        {
          id: 'TM-1',
          name: 'Tiang TM #1',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.118920, 106.148200',
          lat: -6.11892,
          lng: 106.1482,
          note: 'Pangkal tarikan SUTM',
        },
        {
          id: 'TM-2',
          name: 'Tiang TM #2',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.119200, 106.148500',
          lat: -6.1192,
          lng: 106.1485,
          note: 'Tiang tumpu lurus',
        },
        {
          id: 'TM-3',
          name: 'Tiang TM #3',
          std: 'Tiang 12/350',
          networkType: 'JTM',
          poleType: '12/350',
          tmConstruction: 'TM - 7B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.119500, 106.148800',
          lat: -6.1195,
          lng: 106.1488,
          note: 'Tiang sudut belokan',
        },
        {
          id: 'TM-4',
          name: 'Tiang TM #4',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 2B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.119800, 106.149100',
          lat: -6.1198,
          lng: 106.1491,
          note: 'Tiang akhir SUTM ke arah trafo',
        },
        // JTR Poles (Paket 2)
        {
          id: 'TR-1',
          name: 'Tiang TR #1',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.120100, 106.149400',
          lat: -6.1201,
          lng: 106.1494,
          note: 'Pangkal tarikan JTR',
        },
        {
          id: 'TR-2',
          name: 'Tiang TR #2',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.120350, 106.149650',
          lat: -6.12035,
          lng: 106.14965,
          note: 'Tiang tumpu JTR',
        },
        {
          id: 'TR-3',
          name: 'Tiang TR #3',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 2B',
          lvTwisted: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.120600, 106.149900',
          lat: -6.1206,
          lng: 106.1499,
          note: 'Tiang sudut JTR',
        },
        {
          id: 'TR-4',
          name: 'Tiang TR #4',
          std: 'Tiang 9/350',
          networkType: 'JTR',
          poleType: '9/350',
          trConstruction: 'TR - 10B',
          lvTwisted: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.120850, 106.150150',
          lat: -6.12085,
          lng: 106.15015,
          note: 'Tiang akhir JTR sambungan pelanggan',
        },
      ],
    },
    {
      id: 'SRV-0286',
      customerName: 'CV Laut Selatan',
      namaDasar: 'CV Laut Selatan',
      idpel: '541012345678',
      jobType: 'Pasang Baru',
      kampung: 'Pelabuhan Perikanan',
      desa: 'Binuangeun',
      kecamatan: 'Wanasalam',
      kabupaten: 'Kabupaten Lebak',
      location: 'Pelabuhan Binuangeun, Wanasalam, Lebak',
      address: 'Kawasan Cold Storage & Pengolahan Ikan',
      dayaBaru: '131.000',
      tarifBaru: 'I2',
      tipePembangunanGardu: 'Gardu Portal Distribusi',
      kapasitasTrafo: '160 kVA',
      jumlahKabelNaik: '2',
      officerName: 'Suryadi (Petugas Survey)',
      status: 'Terverifikasi',
      createdAt: '22 Okt 2026 09:00',
      poles: [
        {
          id: 'TM-1',
          name: 'Tiang TM #1',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.834120, 105.901230',
          lat: -6.83412,
          lng: 105.90123,
          note: 'Penyulang Binuangeun',
        },
        {
          id: 'TM-2',
          name: 'Tiang TM #2',
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.834350, 105.901500',
          lat: -6.83435,
          lng: 105.9015,
          note: 'Tiang tumpu jalur utama',
        },
        {
          id: 'TM-3',
          name: 'Tiang TM #3 (GARDU)',
          std: 'Tiang 12/350 (GARDU)',
          networkType: 'JTM',
          poleType: '12/350 (GARDU)',
          tmConstruction: 'GARDU PORTAL DISTRIBUSI',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.834600, 105.901800',
          lat: -6.8346,
          lng: 105.9018,
          note: 'Titik Gardu Portal 160 kVA CV Laut Selatan',
        },
        {
          id: 'TR-1',
          name: 'Tiang TR #1',
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.834800, 105.902000',
          lat: -6.8348,
          lng: 105.902,
          note: 'Saluran TR ke Pabrik Es & Cold Storage',
        },
      ],
    },
  ],

  addSurvey: (data) => {
    const newId = `SRV-${String(Date.now()).slice(-4)}`;
    const newRecord: SurveyRecord = {
      ...data,
      id: newId,
      status: 'Menunggu verifikasi Daftung',
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    };
    set((state) => ({
      surveys: [newRecord, ...state.surveys],
    }));
    get().addAudit(`Survey baru ${newId} didaftarkan`, newId, 'Survey Lapangan');
    get().showToast(`✓ Survey ${newId} berhasil disimpan dengan Geotagging`);
    return newId;
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
      id: 'DF-2026-0148',
      idpel: '541012345678',
      customerName: 'CV Laut Selatan',
      source: 'Survey → REKSIS',
      woIssued: 'Belum dibuat',
      nidi: false,
      slo: false,
      status: 'Siap Apply',
    },
    {
      id: 'DF-2026-0145',
      idpel: '541088761234',
      customerName: 'Bpk. Ahmad Fauzi',
      source: 'SRV-0283',
      woIssued: 'Belum dibuat',
      nidi: true,
      slo: true,
      status: 'Siap Apply',
    },
    {
      id: 'DF-2026-0150',
      idpel: '541099887766',
      customerName: 'PT KARYA MANDIRI STEEL (Portal RMU 250 kVA, 197 kVA)',
      source: 'SRV-SMPL-003',
      woIssued: 'Belum dibuat',
      nidi: true,
      slo: true,
      status: 'Siap Apply',
      surveyId: 'SRV-SMPL-003',
    },
    {
      id: 'DF-2026-0151',
      idpel: '541077889900',
      customerName: 'PT MAKMUR SENTOSA BERSAMA (Simulasi Survey 250 kVA)',
      source: 'SRV-SMPL-004',
      woIssued: 'Belum dibuat',
      nidi: true,
      slo: true,
      status: 'Siap Apply',
      surveyId: 'SRV-SMPL-004',
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

  workOrders: [
    {
      id: '539.10.WO.2026',
      customerName: 'CV Laut Selatan',
      idpel: '541012345678',
      category: 'WO Paket 1',
      vendor: 'PT. HILMAN PRIMA PERKASA',
      supervisor: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor1: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 0,
      status: 'Menunggu Persetujuan Asman',
      approvalStatus: 'PENDING',
      appliedAt: '29 Okt 2026 10:15',
      daftungId: 'DF-2026-0148',
      surveyId: 'SRV-0286',
      reservationStatus: 'Belum Reservasi',
      materials: [
        { material: 'Tiang beton 11m / 200 daN', qtyReksis: 4, qtyAllocated: 4, qtyReserved: 0, unit: 'Batang' },
        { material: 'Cross arm UNP 2000 mm', qtyReksis: 4, qtyAllocated: 4, qtyReserved: 0, unit: 'Set' },
        { material: 'Isolator tumpu 20 kV', qtyReksis: 12, qtyAllocated: 12, qtyReserved: 0, unit: 'Buah' },
        { material: 'Kabel A3CS 150 mm²', qtyReksis: 200, qtyAllocated: 200, qtyReserved: 0, unit: 'Meter' },
      ],
    },
    {
      id: '540.10.WO.2026',
      customerName: 'Perumahan Mutiara Maja Cluster Beryl 212 x 1.300 VA',
      idpel: '541098234888',
      category: 'WO Paket 1',
      vendor: 'PT. HILMAN PRIMA PERKASA',
      supervisor: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor1: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 10,
      status: 'Konstruksi',
      approvalStatus: 'APPROVED',
      approvedAt: '25 Okt 2026 09:30',
      daftungId: 'DF-2026-0285',
      surveyId: 'SRV-0285',
      reservationStatus: 'Siap Ambil',
      reservationLink: 'https://promotor.pln.co.id/r/tk-540-10-wo-2026',
      materials: [
        { material: 'Tiang Beton 12 Meter / 350 daN', qtyReksis: 2, qtyAllocated: 2, qtyReserved: 2, unit: 'Batang' },
        { material: 'Trafo Distribusi 250 kVA 20kV / 400V', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 1, unit: 'Unit' },
        { material: 'PHB-TR 4 Jurusan', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 1, unit: 'Set' },
        { material: 'Kabel NYY 1x240 mm²', qtyReksis: 40, qtyAllocated: 40, qtyReserved: 40, unit: 'Meter' },
      ],
    },
    {
      id: '541.10.WO.2026',
      customerName: 'Perumahan Mutiara Maja Cluster Beryl 212 x 1.300 VA',
      idpel: '541098234888',
      category: 'WO Paket 2',
      vendor: 'PT. TAWAKAL KARYA TEKNIK',
      supervisor: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
      supervisor1: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
      supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 0,
      status: 'Konstruksi',
      approvalStatus: 'APPROVED',
      approvedAt: '25 Okt 2026 09:30',
      daftungId: 'DF-2026-0285',
      surveyId: 'SRV-0285',
      reservationStatus: 'Belum Reservasi',
      materials: [
        { material: 'Kabel LVTC (Twisted) 3x70 + 1x50 mm²', qtyReksis: 450, qtyAllocated: 450, qtyReserved: 0, unit: 'Meter' },
        { material: 'Tiang Beton 9 Meter / 200 daN', qtyReksis: 8, qtyAllocated: 8, qtyReserved: 0, unit: 'Batang' },
      ],
    },
    {
      id: '537.10.WO.2026',
      customerName: 'Bpk. Ahmad Fauzi',
      idpel: '541088761234',
      category: 'WO Paket 1',
      vendor: 'PT. HILMAN PRIMA PERKASA',
      supervisor: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor1: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 60,
      status: 'Konstruksi',
      approvalStatus: 'APPROVED',
      approvedAt: '24 Okt 2026 11:30',
      surveyId: 'SRV-0283',
      reservationStatus: 'Siap Ambil',
      reservationLink: 'https://promotor.pln.co.id/r/tk-537-10-wo-2026',
      materials: [
        { material: 'Tiang beton 11m / 200 daN', qtyReksis: 4, qtyAllocated: 4, qtyReserved: 4, unit: 'Batang' },
        { material: 'Cross arm UNP 2000 mm', qtyReksis: 4, qtyAllocated: 4, qtyReserved: 4, unit: 'Set' },
        { material: 'Isolator tumpu 20 kV', qtyReksis: 12, qtyAllocated: 12, qtyReserved: 12, unit: 'Buah' },
      ],
    },
    {
      id: '538.10.WO.2026',
      customerName: 'Bpk. Ahmad Fauzi',
      idpel: '541088761234',
      category: 'WO Paket 2',
      vendor: 'PT. TAWAKAL KARYA TEKNIK',
      supervisor: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
      supervisor1: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
      supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 20,
      status: 'Konstruksi',
      approvalStatus: 'APPROVED',
      approvedAt: '24 Okt 2026 11:30',
      surveyId: 'SRV-0283',
      reservationStatus: 'Belum Reservasi',
      materials: [
        { material: 'Kabel LVTC (Twisted) 3x70 + 1x50 mm²', qtyReksis: 350, qtyAllocated: 300, qtyReserved: 0, unit: 'Meter' },
        { material: 'Bracket kabel & Suspension Clamp', qtyReksis: 8, qtyAllocated: 8, qtyReserved: 0, unit: 'Buah' },
      ],
    },
    {
      id: '546.10.WO.2026',
      customerName: 'PT KARYA MANDIRI STEEL (Portal RMU 250 kVA, 197 kVA)',
      idpel: '541099887766',
      category: 'WO Paket 1',
      vendor: 'PT. HILMAN PRIMA PERKASA',
      supervisor: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor1: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 35,
      status: 'Konstruksi',
      approvalStatus: 'APPROVED',
      approvedAt: '30 Okt 2026 10:00',
      daftungId: 'DF-2026-0150',
      surveyId: 'SRV-SMPL-003',
      reservationStatus: 'Siap Ambil',
      reservationLink: 'https://promotor.pln.co.id/r/tk-546-10-wo-2026',
      materials: [
        { material: 'Tiang Beton 12 Meter / 350 daN', qtyReksis: 3, qtyAllocated: 3, qtyReserved: 3, unit: 'Batang' },
        { material: 'Tiang Beton 12 Meter / 200 daN', qtyReksis: 2, qtyAllocated: 2, qtyReserved: 2, unit: 'Batang' },
        { material: 'Trafo Distribusi 250 kVA 20kV / 400V', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 1, unit: 'Unit' },
        { material: 'RMU (Ring Main Unit) Motorized 24kV', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 1, unit: 'Set' },
        { material: 'Kabel NYY 1x240 mm²', qtyReksis: 40, qtyAllocated: 40, qtyReserved: 40, unit: 'Meter' },
      ],
    },
    {
      id: '547.10.WO.2026',
      customerName: 'PT KARYA MANDIRI STEEL (Portal RMU 250 kVA, 197 kVA)',
      idpel: '541099887766',
      category: 'WO Paket 2',
      vendor: 'PT. TAWAKAL KARYA TEKNIK',
      supervisor: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
      supervisor1: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
      supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 0,
      status: 'Konstruksi',
      approvalStatus: 'APPROVED',
      approvedAt: '30 Okt 2026 10:00',
      daftungId: 'DF-2026-0150',
      surveyId: 'SRV-SMPL-003',
      reservationStatus: 'Belum Reservasi',
      materials: [
        { material: 'Kabel LVTC (Twisted) 3x70 + 1x50 mm²', qtyReksis: 100, qtyAllocated: 100, qtyReserved: 0, unit: 'Meter' },
        { material: 'Tiang Beton 9 Meter / 200 daN', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 0, unit: 'Batang' },
        { material: 'Tiang Beton 9 Meter / 350 daN', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 0, unit: 'Batang' },
      ],
    },
    {
      id: '548.10.WO.2026',
      customerName: 'PT MAKMUR SENTOSA BERSAMA (Simulasi Survey 250 kVA)',
      idpel: '541077889900',
      category: 'WO Paket 1',
      vendor: 'PT. HILMAN PRIMA PERKASA',
      supervisor: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor1: 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 25,
      status: 'Konstruksi',
      approvalStatus: 'APPROVED',
      approvedAt: '30 Okt 2026 11:00',
      daftungId: 'DF-2026-0151',
      surveyId: 'SRV-SMPL-004',
      reservationStatus: 'Siap Ambil',
      reservationLink: 'https://promotor.pln.co.id/r/tk-548-10-wo-2026',
      materials: [
        { material: 'Tiang Beton 12 Meter / 350 daN', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 1, unit: 'Batang' },
        { material: 'Tiang Beton 12 Meter / 200 daN', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 1, unit: 'Batang' },
        { material: 'Trafo Distribusi 250 kVA 20kV / 400V', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 1, unit: 'Unit' },
        { material: 'PHB-TR 4 Jurusan', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 1, unit: 'Set' },
        { material: 'Kabel NYY 1x240 mm²', qtyReksis: 40, qtyAllocated: 40, qtyReserved: 40, unit: 'Meter' },
      ],
    },
    {
      id: '549.10.WO.2026',
      customerName: 'PT MAKMUR SENTOSA BERSAMA (Simulasi Survey 250 kVA)',
      idpel: '541077889900',
      category: 'WO Paket 2',
      vendor: 'PT. TAWAKAL KARYA TEKNIK',
      supervisor: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
      supervisor1: 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)',
      supervisor2: 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 0,
      status: 'Konstruksi',
      approvalStatus: 'APPROVED',
      approvedAt: '30 Okt 2026 11:00',
      daftungId: 'DF-2026-0151',
      surveyId: 'SRV-SMPL-004',
      reservationStatus: 'Belum Reservasi',
      materials: [
        { material: 'BOX APP TRPDU LKP MCCB SHT TRIP;CT 0,5S; 197 kVA', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 0, unit: 'Set' },
        { material: 'Kabel LVTC (Twisted) 3x70 + 1x50 mm²', qtyReksis: 90, qtyAllocated: 90, qtyReserved: 0, unit: 'Meter' },
        { material: 'Tiang Beton 9 Meter / 200 daN', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 0, unit: 'Batang' },
        { material: 'Tiang Beton 9 Meter / 350 daN', qtyReksis: 1, qtyAllocated: 1, qtyReserved: 0, unit: 'Batang' },
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

    // Hitung Material & Jasa murni dari data survey (HANYA item yang disurvey dengan volume > 0)
    let p1Materials: WoMaterialItem[] = [];
    let p2Materials: WoMaterialItem[] = [];

    if (matchedSurvey && matchedSurvey.poles && matchedSurvey.poles.length > 0) {
      const p1Rab = calculateRabFromSurvey(matchedSurvey, 'paket1', currentState.customKhsPrices);
      p1Materials = p1Rab
        .filter((r) => !r.isHeader && r.rencanaVol > 0)
        .map((r) => ({
          material: r.desc,
          qtyReksis: r.rencanaVol,
          qtyAllocated: r.rencanaVol,
          unit: r.sat || 'Buah',
          kategori: r.section,
          hargaSatuan: r.hargaSatuan,
          kode: r.kode,
        }));

      const p2Rab = calculateRabFromSurvey(matchedSurvey, 'paket2', currentState.customKhsPrices);
      p2Materials = p2Rab
        .filter((r) => !r.isHeader && r.rencanaVol > 0)
        .map((r) => ({
          material: r.desc,
          qtyReksis: r.rencanaVol,
          qtyAllocated: r.rencanaVol,
          unit: r.sat || 'Buah',
          kategori: r.section,
          hargaSatuan: r.hargaSatuan,
          kode: r.kode,
        }));
    }

    if (customParams) {
      if (customParams.paket1?.enabled) {
        newWos.push({
          id: customParams.paket1.noWorkOrder || '537.10.WO.2026',
          noWorkOrder: customParams.paket1.noWorkOrder || '537.10.WO.2026',
          customerName,
          idpel,
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
          materials: p1Materials,
        });
      }

      if (customParams.paket2?.enabled) {
        newWos.push({
          id: customParams.paket2.noWorkOrder || '538.10.WO.2026',
          noWorkOrder: customParams.paket2.noWorkOrder || '538.10.WO.2026',
          customerName,
          idpel,
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
          materials: p2Materials,
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
        },
      ];
    }

    const count = newWos.length;
    const woLabels = newWos.map((w) => w.id).join(' & ');

    set((state) => ({
      // Jika sebelumnya pernah ada WO untuk daftung ini (misal ditolak/dikembalikan), gantikan dengan yang baru diajukan
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

      // Sinkronkan status Daftung jika ada daftungId
      const updatedDaftungs = state.daftungs.map((d) => {
        if (targetDaftungId && d.id === targetDaftungId) {
          return {
            ...d,
            status: 'WO Terbit' as const,
            woIssued: 'WO Terbit',
          };
        }
        return d;
      });

      return {
        workOrders: updatedWos,
        daftungs: updatedDaftungs,
      };
    });

    get().addAudit(`Asman menyetujui Work Order ${id}: resmi berstatus Konstruksi (WO Terbit)`, id, 'Work Order');
    get().showToast(`✓ Work Order ${id} resmi disetujui oleh Asman Konstruksi dan berstatus Terbit`);
  },

  rejectWorkOrder: (id, reason) => {
    let affectedDaftungId: string | undefined;

    set((state) => {
      const updatedWos = state.workOrders.map((w) => {
        if (w.id === id) {
          affectedDaftungId = w.daftungId;
          return {
            ...w,
            status: 'Dikembalikan' as const,
            approvalStatus: 'REJECTED' as const,
            rejectionReason: reason,
          };
        }
        return w;
      });

      const updatedDaftungs = state.daftungs.map((d) => {
        if (affectedDaftungId && d.id === affectedDaftungId) {
          return {
            ...d,
            status: 'Perlu Revisi' as const,
            woIssued: `Dikembalikan Asman: ${reason}`,
            rejectionReason: reason,
          };
        }
        return d;
      });

      return {
        workOrders: updatedWos,
        daftungs: updatedDaftungs,
      };
    });

    get().addAudit(`Asman menolak/mengembalikan Work Order ${id}: ${reason}`, id, 'Work Order');
    get().showToast(`Work Order ${id} dikembalikan: ${reason}`);
  },

  resubmitWorkOrder: (id, updates) => {
    let affectedDaftungId: string | undefined;

    set((state) => {
      const updatedWos = state.workOrders.map((w) => {
        if (w.id === id) {
          affectedDaftungId = w.daftungId;
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

      const updatedDaftungs = state.daftungs.map((d) => {
        if (affectedDaftungId && d.id === affectedDaftungId) {
          return {
            ...d,
            status: 'Menunggu Approval' as const,
            woIssued: 'Revisi Diajukan ke Asman',
          };
        }
        return d;
      });

      return {
        workOrders: updatedWos,
        daftungs: updatedDaftungs,
      };
    });

    get().addAudit(`Work Order ${id} telah diperbaiki & diajukan ulang ke Asman Konstruksi`, id, 'Work Order');
    get().showToast(`✓ Work Order ${id} berhasil diajukan ulang ke Asman`);
  },

  updateWoProgress: (id, progress, note) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) => (w.id === id ? { ...w, progress, status: progress === 100 ? 'Selesai' : 'Konstruksi' } : w)),
    }));
    get().addAudit(`Update progress WO ${id} menjadi ${progress}%: ${note || '-'}`, id, 'Pengawasan');
  },

  updateWoReservation: (id, status) => {
    set((state) => ({
      workOrders: state.workOrders.map((w) => (w.id === id ? { ...w, reservationStatus: status, reservationLink: `https://promotor.pln.co.id/r/tk-${id.toLowerCase()}` } : w)),
    }));
    get().addAudit(`Reservasi material WO ${id} dibuat: status ${status}`, id, 'Gudang & Reservasi');
    get().showToast(`✓ Reservasi material ${id} berhasil diperbarui`);
  },

  deleteWorkOrder: (id) => {
    set((state) => ({
      workOrders: state.workOrders.filter((w) => w.id !== id),
    }));
    get().addAudit(`Hapus Work Order ${id}`, id, 'Work Order');
    get().showToast(`✓ Work Order ${id} berhasil dihapus`);
  },

  stocks: [
    { code: 'M-01', name: 'Tiang beton 9 m', category: 'Tiang', qtyFisik: 42, qtyAlokasi: 28, qtySisa: 14, unit: 'Unit', status: 'Aman' },
    { code: 'M-02', name: 'Kabel pilin 3×70 + 50 mm²', category: 'Kabel', qtyFisik: 3200, qtyAlokasi: 2800, qtySisa: 400, unit: 'Meter', status: 'Menipis' },
    { code: 'M-03', name: 'Trafo 100 kVA 20 kV/400 V', category: 'Trafo', qtyFisik: 3, qtyAlokasi: 3, qtySisa: 0, unit: 'Unit', status: 'Kritis' },
    { code: 'M-04', name: 'Cross arm UNP 100×50×5', category: 'Aksesori', qtyFisik: 86, qtyAlokasi: 52, qtySisa: 34, unit: 'Set', status: 'Aman' },
    { code: 'M-05', name: 'Isolator tumpu 20 kV', category: 'Isolator', qtyFisik: 120, qtyAlokasi: 96, qtySisa: 24, unit: 'Buah', status: 'Aman' },
  ],

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

  addVendor: (vendor) => {
    const newId = `v-${Date.now().toString().slice(-4)}`;
    set((state) => ({
      vendors: [{ ...vendor, id: newId }, ...state.vendors],
    }));
    get().addAudit(`Tambah Master Rekanan Vendor ${vendor.name}`, newId, 'Master Vendor');
    get().showToast(`✓ Rekanan ${vendor.name} berhasil ditambahkan`);
  },

  updateVendor: (id, updates) => {
    set((state) => ({
      vendors: state.vendors.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    }));
    get().addAudit(`Perbarui Master Rekanan Vendor ${id}`, id, 'Master Vendor');
    get().showToast(`✓ Data vendor berhasil diperbarui`);
  },

  deleteVendor: (id) => {
    const v = get().vendors.find((item) => item.id === id);
    set((state) => ({
      vendors: state.vendors.filter((item) => item.id !== id),
    }));
    get().addAudit(`Hapus Master Rekanan Vendor ${v?.name || id}`, id, 'Master Vendor');
    get().showToast(`✓ Rekanan vendor berhasil dihapus`);
  },

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
}));
