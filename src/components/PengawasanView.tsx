'use client';

import React, { useState, useMemo } from 'react';
import { 
  HardHat, 
  Package, 
  FileCheck2, 
  TrendingUp, 
  Search, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Calendar, 
  Boxes, 
  Wrench, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Layers, 
  RotateCcw,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Eye,
  ShieldAlert,
  Edit3,
  X,
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { WorkOrderRecord, WoJasaItem, WoMilestones, WoMaterialItem } from '@/types';
import { calculateRabFromSurvey } from '@/data/surveyRabCalculator';

// --------------------------------------------------------------------------
// 6 TAHAP MILESTONE STANDAR KONSTRUKSI PLN (Total Bobot = 100%)
// --------------------------------------------------------------------------
export interface MilestoneDef {
  key: keyof WoMilestones;
  no: number;
  title: string;
  weight: number;
  desc: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentBg: string;
}

export const MILESTONE_CONFIG: MilestoneDef[] = [
  {
    key: 'material',
    no: 1,
    title: 'Pengambilan Material',
    weight: 15, // 15%
    desc: 'Vendor mengambil material utama dari Gudang PLN dengan Surat Jalan',
    color: 'blue',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    borderColor: 'border-blue-200',
    accentBg: 'bg-blue-50/50',
  },
  {
    key: 'konstruksi',
    no: 2,
    title: 'Pemasangan Konstruksi TM / TR',
    weight: 25, // 25%
    desc: 'Penanaman tiang beton, pemasangan travers (cross arm), isolator & lengkapan tiang',
    color: 'amber',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
    accentBg: 'bg-amber-50/50',
  },
  {
    key: 'konduktor',
    no: 3,
    title: 'Pemasangan / Penarikan Konduktor',
    weight: 25, // 25%
    desc: 'Penarikan konduktor AAAC/A3CS (TM) atau kabel pilin LVTC (TR) & pengikatan (dead-end)',
    color: 'indigo',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    accentBg: 'bg-indigo-50/50',
  },
  {
    key: 'gardu',
    no: 4,
    title: 'Pembangunan Gardu',
    weight: 20, // 20%
    desc: 'Pemasangan trafo distribusi, dudukan portal/cantol, FCO, arrester, grounding & PHB-TR/LVSB',
    color: 'purple',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-200',
    accentBg: 'bg-purple-50/50',
  },
  {
    key: 'komisioning',
    no: 5,
    title: 'Komisioning',
    weight: 10, // 10%
    desc: 'Uji teknis tahanan isolasi (Megger), tahanan pembumian (Earth Tester) & uji keselamatan K3',
    color: 'teal',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    borderColor: 'border-teal-200',
    accentBg: 'bg-teal-50/50',
  },
  {
    key: 'energize',
    no: 6,
    title: 'Energize',
    weight: 5, // 5%
    desc: 'Pemberian tegangan listrik, penyambungan ke APP pelanggan hingga listrik menyala (COD)',
    color: 'emerald',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-200',
    accentBg: 'bg-emerald-50/50',
  },
];

// --------------------------------------------------------------------------
// Helper Kalkulasi Bobot & Kontribusi 6 Milestone
// --------------------------------------------------------------------------
export const computeMilestonesTotal = (ms?: WoMilestones | null) => {
  const m = ms?.material ?? 0;
  const k = ms?.konstruksi ?? 0;
  const c = ms?.konduktor ?? 0;
  const g = ms?.gardu ?? 0;
  const t = ms?.komisioning ?? 0;
  const e = ms?.energize ?? 0;

  const matContrib = Math.round(((m * 15) / 100) * 10) / 10;
  const jasContrib = Math.round((((k * 25) + (c * 25) + (g * 20) + (t * 10) + (e * 5)) / 100) * 10) / 10;
  const total = Math.min(100, Math.round(matContrib + jasContrib));

  // Tahap aktif saat ini
  let stageLabel = 'Tahap 1: Pengambilan Material';
  let stageNumber = 1;
  if (e >= 100) { stageLabel = 'Tahap 6: Energize (Selesai)'; stageNumber = 6; }
  else if (e > 0) { stageLabel = 'Tahap 6: Energize'; stageNumber = 6; }
  else if (t > 0) { stageLabel = 'Tahap 5: Komisioning'; stageNumber = 5; }
  else if (g > 0) { stageLabel = 'Tahap 4: Pembangunan Gardu'; stageNumber = 4; }
  else if (c > 0) { stageLabel = 'Tahap 3: Penarikan Konduktor'; stageNumber = 3; }
  else if (k > 0) { stageLabel = 'Tahap 2: Konstruksi TM/TR'; stageNumber = 2; }
  else if (m === 100) { stageLabel = 'Tahap 2: Konstruksi TM/TR'; stageNumber = 2; }

  // Persen Jasa (relatif dari pool 85%)
  const jasaPercent = Math.min(100, Math.round((jasContrib / 85) * 100));

  return {
    matContrib,
    jasContrib,
    total,
    jasaPercent,
    stageLabel,
    stageNumber
  };
};

export const calculateWoMaterialProgress = (wo: WorkOrderRecord): number => {
  const mats = wo.materials || [];
  if (mats.length === 0) return wo.progressMaterial || 0;

  const hasHeld = mats.some((m) => m.isHold);
  const hasRemainingToTake = mats.some((m) => {
    if (m.isHold) return true;
    const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
    return (m.qtyTaken || 0) < req;
  });

  const isAllCompleted = !hasRemainingToTake && !hasHeld;
  if (isAllCompleted) return 100;

  const totalTaken = mats.reduce((acc, m) => acc + (m.qtyTaken || 0), 0);
  if (totalTaken === 0) return 0;

  const totalFulfillment = mats.reduce((sum, m) => {
    if (m.isHold) return sum;
    const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
    const taken = m.qtyTaken || 0;
    return sum + (req > 0 ? Math.min(1, taken / req) : 0);
  }, 0);

  const calculatedPct = Math.round((totalFulfillment / mats.length) * 100);
  return Math.min(99, Math.max(1, calculatedPct));
};

export const getWoMilestones = (wo: WorkOrderRecord): WoMilestones => {
  const mat = calculateWoMaterialProgress(wo);
  if (wo.milestones) {
    return {
      ...wo.milestones,
      material: mat,
    };
  }
  if (wo.progress >= 100 && mat === 100) {
    return { material: 100, konstruksi: 100, konduktor: 100, gardu: 100, komisioning: 100, energize: 100 };
  }
  const jas = wo.progressJasa !== undefined ? wo.progressJasa : 0;
  return {
    material: mat,
    konstruksi: jas,
    konduktor: 0,
    gardu: 0,
    komisioning: 0,
    energize: 0,
  };
};

interface MaterialMonitoringRow {
  material: string;
  kode?: string;
  unit: string;
  kebutuhan: number;
  sdhReservasi: number;
  qtyReservasi: number;
}

export const PengawasanView: React.FC = () => {
  const { 
    workOrders, 
    surveys, 
    stocks, 
    customKhsPrices, 
    updateWoProgress, 
    reserveMaterialWo,
    replaceMaterialWo,
    holdMaterialWo,
    unholdMaterialWo,
    pengawasVerifyReceipt,
    pengawasVerifyRealization,
    showToast 
  } = usePromotorStore();

  const [activeTab, setActiveTab] = useState<'all' | 'reservasi' | 'verifikasi_sj' | 'realisasi_retur'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedWoId, setExpandedWoId] = useState<string | null>(null);
  
  // --------------------------------------------------------------------------
  // MODAL 1: Form Reservasi Material Gudang
  // --------------------------------------------------------------------------
  const [reservationWo, setReservationWo] = useState<WorkOrderRecord | null>(null);
  const [resNumber, setResNumber] = useState('');
  const [resDate, setResDate] = useState('');
  const [resNotes, setResNotes] = useState('');
  
  // Sub-modal Ganti Material
  const [substituteItem, setSubstituteItem] = useState<WoMaterialItem | null>(null);
  const [selectedAltStockCode, setSelectedAltStockCode] = useState('');
  const [substituteQty, setSubstituteQty] = useState<number>(1);
  const [substituteReason, setSubstituteReason] = useState('');

  // Sub-modal Hold Reservasi
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdReasonInput, setHoldReasonInput] = useState('');

  // --------------------------------------------------------------------------
  // MODAL 2: Verifikasi Material Diterima (Surat Jalan)
  // --------------------------------------------------------------------------
  const [verifSjWo, setVerifSjWo] = useState<WorkOrderRecord | null>(null);
  const [verifSjMaterials, setVerifSjMaterials] = useState<
    { material: string; unit: string; qtyAllocated: number; qtyVendorClaim: number; qtyTaken: number; note: string }[]
  >([]);
  const [verifSjNotes, setVerifSjNotes] = useState('');
  const [verifSjOfficer, setVerifSjOfficer] = useState('');
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // MODAL 3: Verifikasi Realisasi Terpasang & Retur Gudang
  // --------------------------------------------------------------------------
  const [verifRealizationWo, setVerifRealizationWo] = useState<WorkOrderRecord | null>(null);
  const [verifRealizationItems, setVerifRealizationItems] = useState<
    { material: string; unit: string; qtyTaken: number; qtyVendorInstalled: number; qtyVendorReturned: number; qtyInstalled: number; qtyReturned: number; note: string }[]
  >([]);
  const [verifRealizationNotes, setVerifRealizationNotes] = useState('');
  const [verifRealizationOfficer, setVerifRealizationOfficer] = useState('');

  // --------------------------------------------------------------------------
  // MODAL 4: Edit Progres Lapangan (6 Milestone Standar PLN & Rincian KHS)
  // --------------------------------------------------------------------------
  const [editingWo, setEditingWo] = useState<WorkOrderRecord | null>(null);
  const [editingMilestones, setEditingMilestones] = useState<WoMilestones>({
    material: 0,
    konstruksi: 0,
    konduktor: 0,
    gardu: 0,
    komisioning: 0,
    energize: 0,
  });
  const [activeModalTab, setActiveModalTab] = useState<'milestone' | 'rincianKHS'>('milestone');
  const [showMaterialTable, setShowMaterialTable] = useState<boolean>(false);
  const [inputNote, setInputNote] = useState<string>('');
  const [editingJasaItems, setEditingJasaItems] = useState<WoJasaItem[]>([]);
  const [editingMaterials, setEditingMaterials] = useState<MaterialMonitoringRow[]>([]);
  const [openActionDropdownId, setOpenActionDropdownId] = useState<string | null>(null);

  // Filter WO yang aktif / konstruksi / verifikasi
  const activeWos = workOrders.filter(
    (w) => w.approvalStatus === 'APPROVED' || w.status === 'Konstruksi' || w.status === 'Verifikasi SJ' || w.status === 'Selesai'
  );

  // Helper pencarian stok gudang secara cerdas
  const findMatchingStock = (matName: string, matKode?: string) => {
    const norm = matName.toLowerCase();
    // Tiang Beton disediakan langsung oleh Vendor Tiang (tidak melalui Gudang PLN)
    if (norm.includes('tiang') || (matKode && matKode.toLowerCase().includes('tng'))) {
      return null;
    }

    if (matKode) {
      const matchByCode = stocks.find((s) => s.code.toLowerCase() === matKode.toLowerCase());
      if (matchByCode) return matchByCode;
    }

    const exactOrSub = stocks.find((s) => {
      const sName = s.name.toLowerCase();
      return sName === norm || sName.includes(norm) || norm.includes(sName);
    });
    if (exactOrSub) return exactOrSub;

    // Pencocokan Cerdas Spesifik PLN UP3 Banten Selatan:
    if (norm.includes('a3cs') || (norm.includes('konduktor') && norm.includes('150')) || norm.includes('aaac-s')) {
      return stocks.find((s) => s.code === '3050084' || s.name.toLowerCase().includes('aaac-s;150'));
    }
    if (norm.includes('trafo') || norm.includes('trf')) {
      if (norm.includes('250')) return stocks.find((s) => s.code === '1030077' || s.name.includes('250kVA'));
      if (norm.includes('160')) return stocks.find((s) => s.code === '1030075' || s.name.includes('160kVA'));
      if (norm.includes('100')) return stocks.find((s) => s.code === '1030074' || s.name.includes('100kVA'));
      if (norm.includes('50'))  return stocks.find((s) => s.code === '1030097' || s.name.includes('50kVA'));
      if (norm.includes('400')) return stocks.find((s) => s.code === '1030114' || s.name.includes('400kVA'));
      return stocks.find((s) => s.category.toLowerCase() === 'trafo');
    }
    if (norm.includes('fco') || norm.includes('cut out') || norm.includes('fuse link')) {
      return stocks.find((s) => s.code === '3190012' || s.name.toLowerCase().includes('cut out'));
    }
    if (norm.includes('arrester') || norm.includes('(la)') || norm.includes('la 20') || norm.startsWith('la ')) {
      return stocks.find((s) => s.code === '2090032' || s.name.toLowerCase().startsWith('la;'));
    }
    if (norm.includes('travers') || norm.includes('cross arm') || norm.includes('crossarm') || norm.includes('cr arm')) {
      return stocks.find((s) => s.code === '3040035' || s.code === '3041017' || s.name.toLowerCase().includes('cr arm'));
    }
    if (norm.includes('isolator')) {
      if (norm.includes('tumpu') || norm.includes('pinpost') || norm.includes('pin post')) {
        return stocks.find((s) => s.code === '3070151');
      }
      if (norm.includes('tarik') || norm.includes('strain') || norm.includes('hang')) {
        return stocks.find((s) => s.code === '3070160');
      }
      return stocks.find((s) => s.category.toLowerCase() === 'isolator');
    }
    if (norm.includes('lvsb') || norm.includes('phb-tr') || norm.includes('phb tr')) {
      return stocks.find((s) => s.category.toLowerCase() === 'panel' || s.name.toLowerCase().includes('lvsb'));
    }
    if (norm.includes('lvtc') || norm.includes('twisted') || norm.includes('nfa2x')) {
      return stocks.find((s) => s.code === '3110542' || s.name.toLowerCase().includes('nfa2x'));
    }
    if (norm.includes('app') || norm.includes('kwh')) {
      return stocks.find((s) => s.category.toLowerCase() === 'app' || s.code === '4120474');
    }

    return null;
  };

  // Tab Filtering
  const filteredWos = useMemo(() => {
    let list = activeWos;

    if (activeTab === 'reservasi') {
      list = list.filter((w) => w.reservationStatus === 'Belum Reservasi' || w.reservationStatus === 'Hold' || !w.reservationStatus);
    } else if (activeTab === 'verifikasi_sj') {
      list = list.filter((w) => w.vendorReceiptConfirmed || w.status === 'Verifikasi SJ' || w.suratJalanPhoto);
    } else if (activeTab === 'realisasi_retur') {
      list = list.filter((w) => w.vendorRealizationSubmitted || (w.progress && w.progress >= 20));
    }

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter(
      (w) =>
        w.id.toLowerCase().includes(term) ||
        w.customerName.toLowerCase().includes(term) ||
        w.vendor.toLowerCase().includes(term) ||
        (w.supervisor1 && w.supervisor1.toLowerCase().includes(term)) ||
        (w.reservationNumber && w.reservationNumber.toLowerCase().includes(term))
    );
  }, [activeWos, activeTab, searchTerm]);

  // Hitungan badge tab
  const badgeCounts = useMemo(() => {
    const reservasiPending = activeWos.filter((w) => w.reservationStatus === 'Belum Reservasi' || w.reservationStatus === 'Hold' || !w.reservationStatus).length;
    const sjPending = activeWos.filter((w) => (w.vendorReceiptConfirmed || w.status === 'Verifikasi SJ') && w.sjVerificationStatus !== 'SESUAI').length;
    const realisasiPending = activeWos.filter((w) => w.vendorRealizationSubmitted && !w.pengawasRealizationVerified).length;
    return { reservasiPending, sjPending, realisasiPending };
  }, [activeWos]);

  // --------------------------------------------------------------------------
  // Handlers: Form Reservasi Material
  // --------------------------------------------------------------------------
  const handleOpenReservation = (wo: WorkOrderRecord) => {
    setReservationWo(wo);
    const nowStr = new Date().toISOString().split('T')[0];
    const defaultResNo = wo.reservationNumber || `RES/UP3-BTS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${wo.id.split('.').pop() || '001'}`;
    setResNumber(defaultResNo);
    setResDate(wo.reservationDate || nowStr);
    setResNotes(wo.reservationNotes || '');
  };

  const handleOpenSubstitute = (item: WoMaterialItem) => {
    setSubstituteItem(item);
    // Cari stock default yang mirip atau yang tersedia
    const available = stocks.filter((s) => s.qtySisa > 0);
    setSelectedAltStockCode(available[0]?.code || '');
    setSubstituteQty(item.qtyAllocated || item.qtyReksis || 1);
    setSubstituteReason(`Penyesuaian stok gudang: ${item.material} dialihkan ke material alternatif`);
  };

  const handleSaveSubstitute = () => {
    if (!reservationWo || !substituteItem) return;
    const altStock = stocks.find((s) => s.code === selectedAltStockCode);
    if (!altStock) {
      showToast('⚠️ Silakan pilih material pengganti yang tersedia!');
      return;
    }

    replaceMaterialWo(
      reservationWo.id,
      substituteItem.material,
      altStock.name,
      substituteQty,
      substituteReason
    );

    // Update reservationWo local state
    const updatedMats = (reservationWo.materials || []).map((m) => {
      if (m.material === substituteItem.material) {
        return {
          ...m,
          material: altStock.name,
          originalMaterialName: substituteItem.material,
          isReplaced: true,
          qtyAllocated: substituteQty,
          qtyReksis: substituteQty,
          unit: altStock.unit,
        };
      }
      return m;
    });

    setReservationWo({
      ...reservationWo,
      materials: updatedMats,
    });

    setSubstituteItem(null);
  };

  const handleConfirmHoldWo = () => {
    if (!reservationWo) return;
    if (!holdReasonInput.trim()) {
      showToast('⚠️ Masukkan alasan penahanan (HOLD) reservasi!');
      return;
    }
    holdMaterialWo(reservationWo.id, holdReasonInput.trim());
    setIsHoldModalOpen(false);
    setReservationWo(null);
  };

  const handleConfirmUnholdWo = (woId: string) => {
    unholdMaterialWo(woId);
    if (reservationWo && reservationWo.id === woId) {
      setReservationWo({
        ...reservationWo,
        reservationStatus: 'Siap Ambil',
        isHold: false,
        holdReason: undefined,
      });
    }
  };

  const handleSaveReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationWo) return;

    if (!resNumber.trim()) {
      showToast('⚠️ Mohon isi Nomor Reservasi ERP / TUG-9!');
      return;
    }

    reserveMaterialWo(
      reservationWo.id,
      resNumber.trim(),
      resDate,
      reservationWo.materials,
      false,
      undefined,
      resNotes.trim()
    );

    setReservationWo(null);
  };

  // Handler Ubah Jumlah Qty Reservasi per Material
  const handleQtyReservedChange = (idx: number, newQty: number) => {
    if (!reservationWo) return;
    const updatedMats = (reservationWo.materials || []).map((mat, i) => {
      if (i === idx) {
        return {
          ...mat,
          qtyReserved: newQty,
        };
      }
      return mat;
    });
    setReservationWo({ ...reservationWo, materials: updatedMats });
  };

  // --------------------------------------------------------------------------
  // Handlers: Verifikasi Material Diterima (Surat Jalan)
  // --------------------------------------------------------------------------
  const handleOpenVerifSj = (wo: WorkOrderRecord) => {
    setVerifSjWo(wo);
    setVerifSjOfficer(wo.supervisor1 || wo.supervisor || 'Pengawas Lapangan UP3 BTS');
    setVerifSjNotes(wo.sjVerificationNotes || '');

    const items = (wo.materials || []).map((m) => {
      const alloc = m.qtyAllocated || m.qtyReksis || 1;
      const vendorClaim = m.qtyTaken !== undefined ? m.qtyTaken : alloc;
      return {
        material: m.material,
        unit: m.unit || 'Buah',
        qtyAllocated: alloc,
        qtyVendorClaim: vendorClaim,
        qtyTaken: vendorClaim, // Default can be edited by pengawas
        note: m.verificationNote || '',
      };
    });
    setVerifSjMaterials(items);
  };

  const handleUpdateVerifSjQty = (idx: number, valStr: string) => {
    const val = parseFloat(valStr);
    const num = isNaN(val) ? 0 : Math.max(0, val);
    setVerifSjMaterials((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qtyTaken: num };
      return copy;
    });
  };

  const handleUpdateVerifSjNote = (idx: number, note: string) => {
    setVerifSjMaterials((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], note };
      return copy;
    });
  };

  const handleSaveVerifSj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifSjWo) return;

    pengawasVerifyReceipt(
      verifSjWo.id,
      verifSjMaterials.map((it) => ({
        material: it.material,
        qtyTaken: it.qtyTaken,
        note: it.note,
      })),
      verifSjNotes,
      verifSjOfficer
    );

    setVerifSjWo(null);
  };

  // --------------------------------------------------------------------------
  // Handlers: Verifikasi Realisasi Terpasang & Retur Gudang
  // --------------------------------------------------------------------------
  const handleOpenVerifRealization = (wo: WorkOrderRecord) => {
    setVerifRealizationWo(wo);
    setVerifRealizationOfficer(wo.supervisor1 || wo.supervisor || 'Pengawas Lapangan UP3 BTS');
    setVerifRealizationNotes(wo.pengawasRealizationNotes || '');

    const items = (wo.materials || []).map((m) => {
      const taken = m.qtyTaken !== undefined ? m.qtyTaken : (m.qtyAllocated || m.qtyReksis || 1);
      const vInstalled = m.qtyInstalled !== undefined ? m.qtyInstalled : taken;
      const vReturned = m.qtyReturned !== undefined ? m.qtyReturned : 0;
      return {
        material: m.material,
        unit: m.unit || 'Buah',
        qtyTaken: taken,
        qtyVendorInstalled: vInstalled,
        qtyVendorReturned: vReturned,
        qtyInstalled: vInstalled, // Pengawas can edit
        qtyReturned: vReturned,   // Pengawas can edit
        note: m.verificationNote || '',
      };
    });
    setVerifRealizationItems(items);
  };

  const handleUpdateRealizationInstalled = (idx: number, valStr: string) => {
    const val = parseFloat(valStr);
    const num = isNaN(val) ? 0 : Math.max(0, val);
    setVerifRealizationItems((prev) => {
      const copy = [...prev];
      const it = { ...copy[idx], qtyInstalled: num };
      // Auto adjust return if within taken
      if (num <= it.qtyTaken) {
        it.qtyReturned = Math.max(0, it.qtyTaken - num);
      }
      copy[idx] = it;
      return copy;
    });
  };

  const handleUpdateRealizationReturned = (idx: number, valStr: string) => {
    const val = parseFloat(valStr);
    const num = isNaN(val) ? 0 : Math.max(0, val);
    setVerifRealizationItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qtyReturned: num };
      return copy;
    });
  };

  const handleUpdateRealizationNote = (idx: number, note: string) => {
    setVerifRealizationItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], note };
      return copy;
    });
  };

  const handleSaveVerifRealization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifRealizationWo) return;

    pengawasVerifyRealization(
      verifRealizationWo.id,
      verifRealizationItems.map((it) => ({
        material: it.material,
        qtyInstalled: it.qtyInstalled,
        qtyReturned: it.qtyReturned,
        verificationNote: it.note,
      })),
      verifRealizationNotes,
      verifRealizationOfficer
    );

    setVerifRealizationWo(null);
  };

  // --------------------------------------------------------------------------
  // Handlers: 6 Milestone Progress Modal (Centang Cepat Standar PLN)
  // --------------------------------------------------------------------------
  const getOrInitJasaItems = (wo: WorkOrderRecord): WoJasaItem[] => {
    if (wo.jasaItems && wo.jasaItems.length > 0) {
      const totalVal = wo.jasaItems.reduce((acc, it) => acc + (it.qtyTarget * (it.hargaSatuan || 1)), 0);
      return wo.jasaItems.map((it) => {
        const bobot = it.bobotPersen !== undefined && it.bobotPersen > 0
          ? it.bobotPersen
          : totalVal > 0
          ? Math.round(((it.qtyTarget * (it.hargaSatuan || 1)) / totalVal) * 1000) / 10
          : Math.round((100 / wo.jasaItems!.length) * 10) / 10;
        const prog = it.progresPersen !== undefined
          ? it.progresPersen
          : Math.min(100, Math.round(((it.qtyRealisasi || 0) / (it.qtyTarget || 1)) * 100));
        return {
          ...it,
          bobotPersen: bobot,
          progresPersen: prog,
        };
      });
    }

    const matchedSurvey = surveys.find(
      (s) =>
        s.id === wo.surveyId ||
        s.id === wo.daftungId ||
        (wo.idpel && s.idpel === wo.idpel) ||
        s.customerName.toLowerCase() === wo.customerName.toLowerCase() ||
        s.customerName.toLowerCase().includes(wo.customerName.toLowerCase()) ||
        wo.customerName.toLowerCase().includes(s.customerName.toLowerCase())
    );

    let rawJasaItems: WoJasaItem[] = [];

    if (matchedSurvey && matchedSurvey.poles && matchedSurvey.poles.length > 0) {
      const paketType = wo.category === 'WO Paket 1' ? 'paket1' : 'paket2';
      const rab = calculateRabFromSurvey(matchedSurvey, paketType, customKhsPrices);
      const jasaRows = rab.filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'JASA');
      const totalCost = jasaRows.reduce((acc, r) => acc + (r.rencanaVol * (r.hargaSatuan || 0)), 0);

      rawJasaItems = jasaRows.map((r) => {
        const itemCost = r.rencanaVol * (r.hargaSatuan || 0);
        const bobot = totalCost > 0 
          ? Math.round((itemCost / totalCost) * 1000) / 10 
          : (jasaRows.length > 0 ? Math.round((100 / jasaRows.length) * 10) / 10 : 0);
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

    if (rawJasaItems.length === 0) {
      if (wo.category === 'WO Paket 1') {
        rawJasaItems = [
          { kode: 'JSA-SUTM-01', deskripsi: 'Penarikan Konduktor SUTM A3CS 150 mm²', qtyTarget: 1.8, qtyRealisasi: 0, unit: 'kms', bobotPersen: 45, progresPersen: 0, hargaSatuan: 18500000 },
          { kode: 'JSA-TNG-12', deskripsi: 'Pendirian Tiang Beton 12 Meter 350 daN', qtyTarget: 5, qtyRealisasi: 0, unit: 'btg', bobotPersen: 25, progresPersen: 0, hargaSatuan: 1200000 },
          { kode: 'JSA-ARM-01', deskripsi: 'Pemasangan Konstruksi Cross Arm & Isolator SUTM', qtyTarget: 5, qtyRealisasi: 0, unit: 'set', bobotPersen: 15, progresPersen: 0, hargaSatuan: 750000 },
          { kode: 'JSA-GRD-01', deskripsi: 'Pemasangan Trafo & Lengkapan Gardu Distribusi', qtyTarget: 1, qtyRealisasi: 0, unit: 'set', bobotPersen: 15, progresPersen: 0, hargaSatuan: 8500000 },
        ];
      } else {
        rawJasaItems = [
          { kode: 'JSA-LVTC-01', deskripsi: 'Penarikan Saluran Udara TR (LVTC 3x70+50 mm²)', qtyTarget: 1.2, qtyRealisasi: 0, unit: 'kms', bobotPersen: 50, progresPersen: 0, hargaSatuan: 12500000 },
          { kode: 'JSA-TNG-09', deskripsi: 'Pendirian Tiang Beton 9 Meter 200 daN', qtyTarget: 4, qtyRealisasi: 0, unit: 'btg', bobotPersen: 25, progresPersen: 0, hargaSatuan: 950000 },
          { kode: 'JSA-APP-01', deskripsi: 'Pemasangan Box APP TRPDU & CT Pengukuran', qtyTarget: 1, qtyRealisasi: 0, unit: 'set', bobotPersen: 25, progresPersen: 0, hargaSatuan: 4500000 },
        ];
      }
    }

    return rawJasaItems;
  };

  const computeCompositeJasa = (items: WoJasaItem[]): number => {
    if (items.length === 0) return 0;
    const total = items.reduce((acc, it) => {
      const prog = it.progresPersen || 0;
      const bbt = it.bobotPersen !== undefined ? it.bobotPersen : (100 / items.length);
      return acc + (prog * (bbt / 100));
    }, 0);
    return Math.min(100, Math.round(total));
  };

  const computeCompositeMaterial = (mats: MaterialMonitoringRow[]): number => {
    if (mats.length === 0) return 0;
    const totalRatio = mats.reduce((acc, it) => {
      const ratio = it.kebutuhan > 0 ? (it.sdhReservasi / it.kebutuhan) : 0;
      return acc + Math.min(1, Math.max(0, ratio));
    }, 0);
    return Math.min(100, Math.round((totalRatio / mats.length) * 100));
  };

  const handleOpenEdit = (wo: WorkOrderRecord) => {
    setEditingWo(wo);
    const ms = getWoMilestones(wo);
    setEditingMilestones(ms);
    setActiveModalTab('milestone');
    setShowMaterialTable(false);

    let initialMats: MaterialMonitoringRow[] = (wo.materials || []).map((m) => {
      const kebutuhan = m.qtyReksis || m.qtyAllocated || 1;
      const sdh = m.qtyTaken !== undefined 
        ? m.qtyTaken 
        : m.isTaken 
        ? (m.qtyAllocated || m.qtyReksis) 
        : (m.qtyReserved || 0);
      const qtyRes = Math.max(0, kebutuhan - sdh);
      return {
        material: m.material,
        kode: m.kode,
        unit: m.unit || 'Buah',
        kebutuhan,
        sdhReservasi: sdh,
        qtyReservasi: qtyRes,
      };
    });

    if (initialMats.length === 0) {
      if (wo.category === 'WO Paket 1') {
        initialMats = [
          { material: 'Tiang Beton 12 Meter / 350 daN', kode: 'M-TNG-12-350', unit: 'Batang', kebutuhan: 5, sdhReservasi: 5, qtyReservasi: 0 },
          { material: 'Konduktor A3CS 150 mm²', kode: 'M-KBL-A3CS-150', unit: 'Meter', kebutuhan: 1800, sdhReservasi: 900, qtyReservasi: 900 },
          { material: 'Trafo Distribusi 160 kVA 20kV / 400V', kode: 'M-TRF-160', unit: 'Unit', kebutuhan: 1, sdhReservasi: 0, qtyReservasi: 1 },
          { material: 'Travers Cross Arm UNP 2000 mm', kode: 'M-ARM-2000', unit: 'Set', kebutuhan: 5, sdhReservasi: 2, qtyReservasi: 3 },
        ];
      } else {
        initialMats = [
          { material: 'Tiang Beton 9m', kode: 'M-TNG-9-200', unit: 'Batang', kebutuhan: 10, sdhReservasi: 6, qtyReservasi: 4 },
          { material: 'Kabel NYY 4x35', kode: 'M-KBL-NYY-4X35', unit: 'Meter', kebutuhan: 500, sdhReservasi: 300, qtyReservasi: 200 },
          { material: 'Trafo 100 kVA', kode: 'M-TRF-100', unit: 'Unit', kebutuhan: 1, sdhReservasi: 0, qtyReservasi: 1 },
          { material: 'LVSB', kode: 'M-LVSB-4J', unit: 'Set', kebutuhan: 4, sdhReservasi: 2, qtyReservasi: 2 },
          { material: 'APP Box', kode: 'M-APP-BOX', unit: 'Set', kebutuhan: 8, sdhReservasi: 8, qtyReservasi: 0 },
        ];
      }
    }

    setEditingMaterials(initialMats);
    const items = getOrInitJasaItems(wo);
    setEditingJasaItems(items);
    setInputNote(wo.catatan || '');
  };

  const handleMilestoneChange = (key: keyof WoMilestones, val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setEditingMilestones((prev) => ({ ...prev, [key]: clamped }));

    if (key === 'material') {
      setEditingMaterials((prev) =>
        prev.map((m) => {
          const sdh = Math.round((m.kebutuhan * clamped) / 100);
          return {
            ...m,
            sdhReservasi: sdh,
            qtyReservasi: Math.max(0, m.kebutuhan - sdh),
          };
        })
      );
    }
  };

  const handleMilestoneToggle = (key: keyof WoMilestones) => {
    const isCurrentlyChecked = (editingMilestones[key] || 0) >= 100;
    handleMilestoneChange(key, isCurrentlyChecked ? 0 : 100);
  };

  const handleMilestoneCheckAll = (checkAll: boolean) => {
    const val = checkAll ? 100 : 0;
    setEditingMilestones({
      material: val,
      konstruksi: val,
      konduktor: val,
      gardu: val,
      komisioning: val,
      energize: val,
    });
    setEditingMaterials((prev) =>
      prev.map((m) => ({
        ...m,
        sdhReservasi: checkAll ? m.kebutuhan : 0,
        qtyReservasi: checkAll ? 0 : m.kebutuhan,
      }))
    );
  };

  const handleMaterialChange = (idx: number, field: 'sdhReservasi' | 'qtyReservasi', valStr: string) => {
    const val = parseFloat(valStr);
    const num = isNaN(val) ? 0 : Math.max(0, val);

    setEditingMaterials((prev) => {
      const updated = [...prev];
      const item = { ...updated[idx] };

      if (field === 'sdhReservasi') {
        const sdh = Math.min(item.kebutuhan, num);
        item.sdhReservasi = sdh;
        item.qtyReservasi = Math.max(0, item.kebutuhan - sdh);
      } else {
        const qtyRes = Math.min(item.kebutuhan, num);
        item.qtyReservasi = qtyRes;
        item.sdhReservasi = Math.max(0, item.kebutuhan - qtyRes);
      }

      updated[idx] = item;
      const computedMat = computeCompositeMaterial(updated);
      setEditingMilestones((m) => ({ ...m, material: computedMat }));
      return updated;
    });
  };

  const handleQtyRealisasiChange = (index: number, valStr: string) => {
    const val = parseFloat(valStr);
    const newQty = isNaN(val) ? 0 : Math.max(0, val);

    setEditingJasaItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.qtyRealisasi = newQty;
      const target = item.qtyTarget > 0 ? item.qtyTarget : 1;
      item.progresPersen = Math.min(100, Math.round((newQty / target) * 100));
      updated[index] = item;

      const newCompositeJasa = computeCompositeJasa(updated);
      setEditingMilestones((ms) => ({
        ...ms,
        konstruksi: newCompositeJasa,
      }));

      return updated;
    });
  };

  const handleSetQuickItem = (index: number, full: boolean) => {
    setEditingJasaItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.qtyRealisasi = full ? item.qtyTarget : 0;
      item.progresPersen = full ? 100 : 0;
      updated[index] = item;
      return updated;
    });
  };

  const currentCalcs = useMemo(() => {
    return computeMilestonesTotal(editingMilestones);
  }, [editingMilestones]);

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWo) return;

    const calcs = computeMilestonesTotal(editingMilestones);
    const overall = calcs.total;
    const progressMat = editingMilestones.material;
    const progressJas = calcs.jasaPercent;

    const updatedMaterials = (editingWo.materials || []).map((orig) => {
      const match = editingMaterials.find((em) => em.material === orig.material);
      if (match) {
        return {
          ...orig,
          qtyTaken: match.sdhReservasi,
          qtyReserved: match.sdhReservasi,
          isTaken: match.sdhReservasi >= match.kebutuhan,
        };
      }
      return orig;
    });

    updateWoProgress(
      editingWo.id, 
      overall, 
      inputNote, 
      progressMat, 
      progressJas, 
      editingJasaItems, 
      updatedMaterials,
      editingMilestones
    );

    showToast(
      `✓ Progres WO ${editingWo.id} berhasil disimpan: Total Fisik ${overall}% (${calcs.stageLabel}) — Otomatis tersinkron ke Daftung`
    );
    setEditingWo(null);
  };

  // Cek apakah form reservasi memiliki defisit stok
  const hasReservationDeficit = useMemo(() => {
    if (!reservationWo || !reservationWo.materials) return false;
    return reservationWo.materials.some((m) => {
      const alloc = m.qtyAllocated || m.qtyReksis || 1;
      const stock = findMatchingStock(m.material, m.kode);
      const qtySisa = stock ? stock.qtySisa : 0;
      return alloc > qtySisa;
    });
  }, [reservationWo, stocks]);

  return (
    <div className="space-y-6">
      {/* Header Utama Menu Pengawas */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <HardHat className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Menu Pengawas Lapangan (Teknik PLN)</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Penyelia & Pengendalian Konstruksi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Reservasi material gudang (cek ketersediaan & substitusi/hold), verifikasi fisik Surat Jalan, verifikasi realisasi terpasang/retur, dan pemantauan 6 milestone standar PLN.
            </p>
          </div>
        </div>

        {/* Input Pencarian */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No WO, Pelanggan, Vendor, Reservasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Tabs Filter Pengawas */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Semua WO Pengawasan</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 font-mono">{activeWos.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reservasi')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'reservasi'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4 text-amber-500" />
          <span>Perlu Reservasi Gudang</span>
          {badgeCounts.reservasiPending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold animate-pulse">
              {badgeCounts.reservasiPending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verifikasi_sj')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'verifikasi_sj'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-indigo-500" />
          <span>Verifikasi Surat Jalan (Material Diterima)</span>
          {badgeCounts.sjPending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-mono font-bold">
              {badgeCounts.sjPending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('realisasi_retur')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'realisasi_retur'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-emerald-600" />
          <span>Verifikasi Realisasi & Retur</span>
          {badgeCounts.realisasiPending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-mono font-bold">
              {badgeCounts.realisasiPending}
            </span>
          )}
        </button>
      </div>

      {/* Tabel Monitoring Work Order */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-3 w-8"></th>
                <th className="py-3 px-4 min-w-[190px]">NO. WO & SPK</th>
                <th className="py-3 px-4 min-w-[200px]">PELANGGAN</th>
                <th className="py-3 px-4 min-w-[240px]">VENDOR & PENGAWAS</th>
                <th className="py-3 px-3 text-center min-w-[140px]">STATUS RESERVASI</th>
                <th className="py-3 px-3 text-center min-w-[130px]">SURAT JALAN (SJ)</th>
                <th className="py-3 px-3 text-center min-w-[130px]">REALISASI / RETUR</th>
                <th className="py-3 px-3 text-center min-w-[100px]">TOTAL FISIK</th>
                <th className="py-3 px-3 text-center w-36">AKSI PENGAWAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <HardHat className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
                    Belum ada Work Order dalam kategori atau kata kunci ini
                  </td>
                </tr>
              ) : (
                filteredWos.map((wo) => {
                  const ms = getWoMilestones(wo);
                  const woCalcs = computeMilestonesTotal(ms);
                  const totalPct = wo.progress !== undefined ? wo.progress : woCalcs.total;
                  const isExpanded = expandedWoId === wo.id;

                  // Status Reservasi
                  const isHold = wo.isHold || wo.reservationStatus === 'Hold';
                  const isReserved = wo.reservationStatus === 'Siap Ambil' || wo.reservationStatus === 'Selesai';
                  const isPendingReservation = !wo.reservationStatus || wo.reservationStatus === 'Belum Reservasi';

                  // Status Surat Jalan (Hanya true jika vendor sudah upload/konfirmasi Surat Jalan)
                  const hasSj = Boolean(wo.vendorReceiptConfirmed || wo.suratJalanNumber || wo.suratJalanPhoto);
                  const sjVerified = wo.sjVerificationStatus === 'SESUAI';
                  const sjHasSelisih = wo.sjVerificationStatus === 'ADA_SELISIH';

                  // Status Realisasi
                  const hasRealization = Boolean(wo.vendorRealizationSubmitted);
                  const realVerified = Boolean(wo.pengawasRealizationVerified);

                  // Pengawas 1 & Pengawas 2
                  const p1 = wo.supervisor1 || wo.supervisor || 'Hasian Sitorus (TC Lola Konstruksi)';
                  const p2 = wo.supervisor2 || (wo.category === 'WO Paket 2' ? 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)' : 'Daud Febrizer (TL Teknik ULP Rangkasbitung)');

                  return (
                    <React.Fragment key={wo.id}>
                      <tr className={`hover:bg-slate-50/70 transition-colors divide-x divide-slate-200 ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                        {/* Expand Button */}
                        <td className="py-4 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedWoId(isExpanded ? null : wo.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            title={isExpanded ? "Tutup roadmap" : "Buka roadmap"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* 1. NO. WO & SPK */}
                        <td className="py-4 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{wo.id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-tight ${
                              wo.category === 'WO Paket 1'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : wo.category === 'WO Paket 2'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {wo.category === 'WO Paket 1' ? 'Paket 1 (TM)' : wo.category === 'WO Paket 2' ? 'Paket 2 (TR)' : 'Tiang Beton'}
                            </span>
                          </div>
                          {wo.spkNumber && (
                            <div className="text-[10px] text-slate-400 font-normal font-sans mt-1">SPK: <span className="font-mono text-slate-600">{wo.spkNumber}</span></div>
                          )}
                        </td>

                        {/* 2. PELANGGAN (Kolom Sendiri) */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-900">{wo.customerName}</div>
                          {wo.location && (
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate max-w-[200px]" title={wo.location}>
                              📍 {wo.location}
                            </div>
                          )}
                        </td>

                        {/* 3. VENDOR & PENGAWAS (Disatukan) */}
                        <td className="py-4 px-4">
                          <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{wo.vendor}</span>
                          </div>
                          {/* Box Pengawas 1 & 2 Lengkap */}
                          <div className="text-[10px] text-slate-600 font-sans mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200/80 space-y-1">
                            <div className="flex items-start gap-1">
                              <span className="text-slate-400 font-medium shrink-0">Pengawas 1:</span>
                              <b className="text-slate-800 leading-tight">{p1}</b>
                            </div>
                            <div className="flex items-start gap-1">
                              <span className="text-slate-400 font-medium shrink-0">Pengawas 2:</span>
                              <b className="text-slate-800 leading-tight">{p2}</b>
                            </div>
                          </div>
                        </td>

                        {/* Status Reservasi Gudang */}
                        <td className="py-4 px-4 text-center">
                          {isHold ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <PauseCircle className="w-3.5 h-3.5" />
                                <span>Reservasi DITAHAN (HOLD)</span>
                              </span>
                              {wo.holdReason && (
                                <span className="text-[10px] text-rose-600 mt-0.5 max-w-[150px] truncate" title={wo.holdReason}>
                                  {wo.holdReason}
                                </span>
                              )}
                            </div>
                          ) : isReserved ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{wo.reservationNumber ? 'Reservasi Terbit' : 'Siap Ambil'}</span>
                              </span>
                              {wo.reservationNumber && (
                                <span className="font-mono text-[9.5px] text-slate-500 mt-0.5">{wo.reservationNumber}</span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 justify-center">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Belum Reservasi</span>
                            </span>
                          )}
                        </td>

                        {/* Surat Jalan & Verifikasi Fisik */}
                        <td className="py-4 px-4 text-center">
                          {hasSj ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                sjVerified
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : sjHasSelisih
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                              }`}>
                                <FileText className="w-3 h-3" />
                                <span>{sjVerified ? 'SJ Terverifikasi' : sjHasSelisih ? 'SJ Ada Selisih' : 'SJ Diupload Vendor'}</span>
                              </span>
                              {wo.suratJalanNumber && (
                                <span className="font-mono text-[9px] text-slate-500 truncate max-w-[120px]" title={wo.suratJalanNumber}>
                                  {wo.suratJalanNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Menunggu Vendor</span>
                          )}
                        </td>

                        {/* Realisasi & Retur */}
                        <td className="py-4 px-4 text-center">
                          {hasRealization ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                realVerified
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}>
                                {realVerified ? 'Opname Selesai' : 'Vendor Melapor'}
                              </span>
                              <span className="text-[9.5px] text-slate-500">
                                {wo.vendorRealizationDate || 'Menunggu Pengawas'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Belum Lapor</span>
                          )}
                        </td>

                        {/* Total Fisik */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black font-mono bg-emerald-50 text-emerald-800 border border-emerald-300">
                              {totalPct}%
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-medium">
                              {woCalcs.stageLabel}
                            </span>
                          </div>
                        </td>

                        {/* Aksi Pengawas: Clean Minimalist Layout */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 relative">
                            {/* Tombol Utama: Update Progres Fisik (Prioritas Harian Pengawas) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(wo)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer border border-blue-200 flex items-center gap-1.5 shadow-2xs"
                              title="Update Progres Fisik (6 Milestone Konstruksi)"
                            >
                              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                              <span>Progres Fisik</span>
                            </button>

                            {/* Dropdown Menu untuk Aksi Terkait Material & Dokumen */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionDropdownId(openActionDropdownId === wo.id ? null : wo.id);
                                }}
                                className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                                  openActionDropdownId === wo.id
                                    ? 'bg-slate-200 border-slate-400 text-slate-800'
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                                }`}
                                title="Menu Aksi Pengawas Lainnya"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openActionDropdownId === wo.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-20 cursor-default"
                                    onClick={() => setOpenActionDropdownId(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Aksi Pengawas • {wo.category}
                                    </div>

                                    {/* 1. Reservasi Material */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionDropdownId(null);
                                        handleOpenReservation(wo);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-700 flex items-center gap-2 cursor-pointer transition"
                                    >
                                      <Boxes className="w-3.5 h-3.5 text-amber-600" />
                                      <span>{isHold ? 'Kelola Hold / Ganti MT' : isReserved ? 'Ubah Reservasi MT' : 'Reservasi Material'}</span>
                                    </button>

                                    {/* 2. Verifikasi Surat Jalan */}
                                    {hasSj ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionDropdownId(null);
                                          handleOpenVerifSj(wo);
                                        }}
                                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer transition border-t border-slate-100"
                                      >
                                        <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>{sjVerified ? 'Verifikasi SJ (Selesai ✓)' : 'Verifikasi Surat Jalan'}</span>
                                      </button>
                                    ) : (
                                      <div className="px-3 py-2 text-[11px] text-slate-400 flex items-center gap-2 border-t border-slate-100 bg-slate-50/50">
                                        <FileCheck2 className="w-3.5 h-3.5 opacity-40" />
                                        <span className="italic">SJ Belum Diupload Vendor</span>
                                      </div>
                                    )}

                                    {/* 3. Verifikasi Realisasi & Retur */}
                                    {hasRealization ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionDropdownId(null);
                                          handleOpenVerifRealization(wo);
                                        }}
                                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 cursor-pointer transition border-t border-slate-100"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>{realVerified ? 'Info Retur Sisa (Selesai ✓)' : 'Lihat Laporan Retur Sisa'}</span>
                                      </button>
                                    ) : (
                                      <div className="px-3 py-2 text-[11px] text-slate-400 flex items-center gap-2 border-t border-slate-100 bg-slate-50/50">
                                        <RotateCcw className="w-3.5 h-3.5 opacity-40" />
                                        <span className="italic">Vendor Belum Lapor Retur</span>
                                      </div>
                                    )}

                                    {/* 4. Lihat Rincian Roadmap */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionDropdownId(null);
                                        setExpandedWoId(isExpanded ? null : wo.id);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 flex items-center gap-2 cursor-pointer transition border-t border-slate-100"
                                    >
                                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                                      <span>{isExpanded ? 'Tutup Roadmap 6 Tahap' : 'Buka Roadmap 6 Tahap'}</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Sub-Row: Roadmap 6 Milestone Standar PLN */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-blue-600" />
                                  <h4 className="text-xs font-bold text-slate-800">
                                    Roadmap 6 Milestone Lapangan — {wo.id} ({wo.category})
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    {woCalcs.stageLabel}
                                  </span>
                                  <span className="text-[11px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Total: {totalPct}% / 100%
                                  </span>
                                </div>
                              </div>

                              {/* 6 Grid Milestone Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                                {MILESTONE_CONFIG.map((mDef) => {
                                  const progVal = ms[mDef.key] || 0;
                                  const contrib = Math.round((progVal * mDef.weight) / 100 * 10) / 10;
                                  const isDone = progVal >= 100;

                                  return (
                                    <div
                                      key={mDef.key}
                                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition ${
                                        isDone
                                          ? 'bg-emerald-50/40 border-emerald-300'
                                          : progVal > 0
                                          ? 'bg-blue-50/40 border-blue-300'
                                          : 'bg-slate-50/60 border-slate-200 opacity-75'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                            Tahap {mDef.no}
                                          </span>
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${mDef.badgeBg} ${mDef.badgeText}`}>
                                            Bobot {mDef.weight}%
                                          </span>
                                        </div>
                                        <h5 className="font-bold text-slate-900 text-[11px] leading-tight mb-1">
                                          {mDef.title}
                                        </h5>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                          {mDef.desc}
                                        </p>
                                      </div>

                                      <div className="mt-3 pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                                          <span className="text-slate-600 font-semibold">{progVal}%</span>
                                          <span className="font-bold text-emerald-700">+{contrib}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                              isDone ? 'bg-emerald-500' : progVal > 0 ? 'bg-blue-600' : 'bg-slate-300'
                                            }`}
                                            style={{ width: `${progVal}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: FORM RESERVASI MATERIAL GUDANG (PENGAWAS)
          - Cek Ketersediaan Stok Gudang
          - Defisit Alert
          - Opsi Ganti Material Alternatif
          - Opsi Hold Reservasi
         ========================================================================= */}
      {reservationWo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveReservation}
            className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Form Reservasi Material Gudang — {reservationWo.id}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pelanggan: <b className="text-slate-800">{reservationWo.customerName}</b> • Vendor: <b className="text-purple-700">{reservationWo.vendor}</b>
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {reservationWo.isHold ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
                    <PauseCircle className="w-4 h-4" />
                    <span>Status: HOLD</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {reservationWo.category}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Alert Defisit Stok Gudang */}
              {hasReservationDeficit && (
                <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-xl flex items-start gap-3 text-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-bold text-rose-900 text-sm">
                      Peringatan: Kebutuhan Material Melebihi Stok Gudang!
                    </h5>
                    <p className="text-rose-700 mt-1 leading-relaxed">
                      Ditemukan material dengan kebutuhan melebihi sisa stok fisik di Gudang PLN UP3 Banten Selatan. 
                      Pengawas dapat mengklik <b>&quot;Ganti Material&quot;</b> untuk memilih material pengganti dari stok yang ada, atau klik <b>&quot;Tahan Reservasi (HOLD)&quot;</b> hingga stok tersedia.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Input Reservasi ERP */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Reservasi ERP / TUG-9 *</label>
                  <input
                    type="text"
                    required
                    value={resNumber}
                    onChange={(e) => setResNumber(e.target.value)}
                    placeholder="Contoh: RES/UP3-BTS/2026/02/001"
                    className="w-full text-xs p-2 font-mono font-bold border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Terbit Reservasi *</label>
                  <input
                    type="date"
                    required
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Reservasi</label>
                  <input
                    type="text"
                    value={resNotes}
                    onChange={(e) => setResNotes(e.target.value)}
                    placeholder="Contoh: Pengambilan bertahap di Gudang Cikande..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Riwayat Substitusi Material jika ada */}
              {reservationWo.materialSubstitutions && reservationWo.materialSubstitutions.length > 0 && (
                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="font-bold text-purple-900 block flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Riwayat Pergantian Material:
                  </span>
                  {reservationWo.materialSubstitutions.map((sub, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-purple-100 flex items-center justify-between text-slate-700">
                      <div>
                        <span className="line-through text-slate-400">{sub.originalMaterial}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1.5 text-purple-600" />
                        <span className="font-bold text-purple-900">{sub.replacementMaterial}</span>
                        <span className="ml-2 font-mono text-[10px] bg-purple-100 px-1.5 py-0.5 rounded text-purple-800">Qty: {sub.qty}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Alasan: <i>&quot;{sub.reason}&quot;</i> ({sub.timestamp})
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabel Verifikasi Kebutuhan vs Stok Gudang */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-amber-600" />
                    Daftar Kebutuhan Material WO vs Stok Gudang PLN
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {(reservationWo.materials || []).length} Item Material Terdaftar
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                      <tr className="divide-x divide-slate-200">
                        <th className="py-2.5 px-3 w-8 text-center">NO</th>
                        <th className="py-2.5 px-3 min-w-[110px] text-center font-mono">NO MATERIAL</th>
                        <th className="py-2.5 px-3 min-w-[210px]">MATERIAL</th>
                        <th className="py-2.5 px-3 text-center">SAT</th>
                        <th className="py-2.5 px-3 text-right min-w-[90px]">KEBUTUHAN WO</th>
                        <th className="py-2.5 px-3 text-center min-w-[110px] bg-blue-100/80 text-blue-900 border-x border-blue-200">
                          <div>
                            <span>QTY RESERVASI</span>
                            <span className="block text-[8.5px] font-bold text-blue-700 normal-case">✎ Transaksi Ini</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center min-w-[100px] bg-slate-100 text-slate-800">
                          <div>
                            <span>SUDAH RESERVASI</span>
                            <span className="block text-[8.5px] font-normal text-slate-500 normal-case">(Sudah Diambil)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center min-w-[105px] bg-amber-50 text-amber-950 border-r border-amber-200">
                          <div>
                            <span>BELUM RESERVASI</span>
                            <span className="block text-[8.5px] font-normal text-amber-700 normal-case">(Sisa Kebutuhan)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center min-w-[110px] bg-blue-50/70 text-blue-900">
                          <div>
                            <span>STOK FISIK</span>
                            <span className="block text-[8.5px] font-bold text-blue-700 normal-case">✓ Acuan WO</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center min-w-[95px]">
                          <div>
                            <span>STOK SAP</span>
                            <span className="block text-[8.5px] font-normal text-slate-400 normal-case">(ERP PLN)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center min-w-[90px] bg-emerald-50 text-emerald-900 border-x border-emerald-200">
                          <div>
                            <span>PROGRESS</span>
                            <span className="block text-[8.5px] font-normal text-emerald-700 normal-case">(Realisasi %)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center min-w-[130px]">STATUS KETERSEDIAAN</th>
                        <th className="py-2.5 px-3 text-center min-w-[160px]">AKSI PENGAWAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(reservationWo.materials || []).map((m, idx) => {
                        const alloc = m.qtyAllocated || m.qtyReksis || 1;
                        const req = alloc;
                        const sudahReservasi = m.qtyTaken !== undefined ? m.qtyTaken : (m.isTaken ? req : 0);
                        const belumReservasi = Math.max(0, req - sudahReservasi);
                        const progress = req > 0 ? Math.min(100, Math.round((sudahReservasi / req) * 100)) : 0;
                        const qtyReservasi = m.qtyReserved !== undefined ? m.qtyReserved : belumReservasi;
                        const isTiangItem = m.material.toLowerCase().includes('tiang') || (m.kode && m.kode.toLowerCase().includes('tng'));
                        const matchingStock = findMatchingStock(m.material, m.kode);
                        const qtyFisik = matchingStock ? matchingStock.qtyFisik : 0;
                        const qtySap = matchingStock ? (matchingStock.qtySap ?? matchingStock.qtyFisik) : 0;
                        const isDeficit = !isTiangItem && alloc > qtyFisik;
                        const isItemHeld = Boolean(m.isHold);

                        return (
                          <tr key={idx} className={`hover:bg-slate-50/70 transition-colors divide-x divide-slate-200 ${
                            isItemHeld ? 'bg-rose-50/70 border-l-4 border-l-rose-500' : isDeficit ? 'bg-rose-50/40' : isTiangItem ? 'bg-emerald-50/30' : ''
                          }`}>
                            <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            
                            {/* Kolom No Material (sesuai data stok gudang) */}
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                              {matchingStock?.code || m.kode || '—'}
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{m.material}</div>
                              {m.originalMaterialName && (
                                <div className="text-[10px] text-purple-700 font-medium">
                                  Diganti dari: <span className="line-through">{m.originalMaterialName}</span>
                                </div>
                              )}
                              {isTiangItem && (
                                <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                                  ✓ Disediakan Vendor Tiang Rekanan
                                </div>
                              )}
                              {isItemHeld && (
                                <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                                  ⛔ Material Ditahan (Hold Item)
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center font-mono text-slate-600">{m.unit || 'Buah'}</td>
                            
                            {/* 1. Kebutuhan WO */}
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                              {alloc}
                            </td>

                            {/* 2. Qty Reservasi (Input Pengawas saat ini) */}
                            <td className="py-2.5 px-3 text-center align-middle bg-blue-50/40 border-x border-blue-100">
                              <div className="inline-flex items-center justify-center gap-1">
                                <input 
                                  type="number"
                                  min={0}
                                  max={belumReservasi}
                                  disabled={belumReservasi === 0}
                                  value={qtyReservasi}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(belumReservasi, Number(e.target.value) || 0));
                                    handleQtyReservedChange(idx, val);
                                  }}
                                  className={`w-16 px-2 py-1 text-xs text-center font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 shadow-2xs ${
                                    belumReservasi === 0 
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                      : 'bg-white text-blue-950 border-blue-300 focus:ring-blue-500'
                                  }`}
                                />
                                <span className="text-[10px] text-slate-500">{m.unit || 'Buah'}</span>
                              </div>
                            </td>

                            {/* 3. Sudah Reservasi (Akumulasi yang Sudah Diambil) */}
                            <td className="py-2.5 px-3 text-center align-middle bg-slate-50/70 font-mono font-semibold text-slate-700">
                              {sudahReservasi} <span className="font-sans font-normal text-slate-400 text-[10px]">{m.unit || 'Buah'}</span>
                            </td>

                            {/* 4. Belum Reservasi (Sisa Kebutuhan Belum Diambil) */}
                            <td className="py-2.5 px-3 text-center align-middle bg-amber-50/40 border-r border-amber-100 font-mono">
                              {belumReservasi > 0 ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                                  {belumReservasi} {m.unit || 'Buah'}
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  0 (Lengkap)
                                </span>
                              )}
                            </td>

                            {/* 5. Stok Fisik (Acuan Reservasi WO) */}
                            <td className="py-3 px-3 text-center font-mono font-bold bg-blue-50/30">
                              {isTiangItem ? (
                                <span className="text-emerald-700 font-bold text-[11px]">Pabrikan Tiang</span>
                              ) : matchingStock ? (
                                <div>
                                  <span className="text-blue-900 font-black">
                                    {matchingStock.qtyFisik} <span className="text-[10px] text-slate-400 font-normal">{matchingStock.unit}</span>
                                  </span>
                                  <span className="block text-[8.5px] font-bold text-blue-700 bg-blue-100 rounded px-1 mt-0.5">
                                    Dipakai WO
                                  </span>
                                </div>
                              ) : (
                                <span className="text-rose-500 font-bold text-[11px]">0</span>
                              )}
                            </td>

                            {/* 6. Stok SAP */}
                            <td className="py-3 px-3 text-center font-mono">
                              {isTiangItem ? (
                                <span className="text-slate-400 italic text-[11px]">Non-Gudang</span>
                              ) : matchingStock ? (
                                <span className="text-slate-700 font-semibold">
                                  {qtySap} <span className="text-[10px] text-slate-400 font-normal">{matchingStock.unit}</span>
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            {/* 7. Progress Pemenuhan */}
                            <td className="py-2.5 px-3 text-center align-middle bg-emerald-50/30 border-x border-emerald-100 font-mono">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-[11px] font-bold ${
                                  progress >= 100 ? 'text-emerald-700' : progress > 0 ? 'text-blue-700' : 'text-slate-400'
                                }`}>
                                  {progress}%
                                </span>
                                <div className="w-14 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      progress >= 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Status Ketersediaan */}
                            <td className="py-3 px-3 text-center">
                              {isItemHeld ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <PauseCircle className="w-3 h-3 text-rose-600" />
                                  <span>HOLD ITEM</span>
                                </span>
                              ) : isTiangItem ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  <span>Suplai Vendor Tiang</span>
                                </span>
                              ) : isDeficit ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Fisik Kurang ({alloc - qtyFisik})</span>
                                </span>
                              ) : matchingStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  <span>Tersedia ({qtyFisik})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <span>Stok Kosong</span>
                                </span>
                              )}
                            </td>

                            {/* Aksi Pengawas */}
                            <td className="py-3 px-3 text-center">
                              {isTiangItem ? (
                                <span className="text-slate-400 text-[11px] italic font-medium">—</span>
                              ) : (
                                <div className="flex items-center gap-1 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSubstitute(m)}
                                    className="px-2 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Ganti</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!reservationWo) return;
                                      const updated = (reservationWo.materials || []).map((it) => {
                                        if (it.material === m.material) {
                                          const next = !it.isHold;
                                          return { ...it, isHold: next, holdReason: next ? 'Material habis' : undefined };
                                        }
                                        return it;
                                      });
                                      setReservationWo({ ...reservationWo, materials: updated });
                                    }}
                                    className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                                      isItemHeld 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    }`}
                                  >
                                    {isItemHeld ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                                    <span>{isItemHeld ? 'Unhold' : 'Hold'}</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                {reservationWo.isHold ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmUnholdWo(reservationWo.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Buka Status HOLD (Unhold)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsHoldModalOpen(true)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <PauseCircle className="w-4 h-4 text-rose-600" />
                    <span>Tahan Reservasi (HOLD)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReservationWo(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Terbitkan Reservasi (Siap Ambil oleh Vendor)</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          SUB-MODAL: GANTI MATERIAL ALTERNATIF
         ========================================================================= */}
      {substituteItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-sm text-slate-900">Ganti Material Alternatif</h4>
              </div>
              <button
                type="button"
                onClick={() => setSubstituteItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Material Asli WO:</span>
                <div className="font-bold text-slate-900 text-sm">{substituteItem.material}</div>
                <div className="text-slate-500 mt-0.5">
                  Kebutuhan: <b>{substituteItem.qtyAllocated || substituteItem.qtyReksis} {substituteItem.unit}</b>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Material Pengganti (Tersedia di Gudang) *</label>
                <select
                  value={selectedAltStockCode}
                  onChange={(e) => setSelectedAltStockCode(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  {stocks.map((stk) => (
                    <option key={stk.code} value={stk.code}>
                      {stk.name} (Sisa Stok: {stk.qtySisa} {stk.unit}) [{stk.code}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah / Qty Pengganti *</label>
                <input
                  type="number"
                  min="1"
                  value={substituteQty}
                  onChange={(e) => setSubstituteQty(parseFloat(e.target.value) || 1)}
                  className="w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Pergantian Material *</label>
                <textarea
                  rows={2}
                  required
                  value={substituteReason}
                  onChange={(e) => setSubstituteReason(e.target.value)}
                  placeholder="Contoh: Stok trafo 100 kVA kosong, disubstitusi trafo 160 kVA atas arahan Asman..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubstituteItem(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSubstitute}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan Pergantian</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-MODAL: TAHAN RESERVASI (HOLD)
         ========================================================================= */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-rose-700">
              <PauseCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm">Tahan Reservasi Material (HOLD)</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Status WO akan di-HOLD dan vendor tidak dapat mengambil material di gudang sampai pengawas membuka kembali status penahanan (unhold).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Penahanan (HOLD) *</label>
              <textarea
                rows={3}
                required
                value={holdReasonInput}
                onChange={(e) => setHoldReasonInput(e.target.value)}
                placeholder="Contoh: Stok material utama (Trafo 100 kVA) habis di Gudang UP3 BTS, menunggu drop UID..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHoldModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmHoldWo}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Konfirmasi HOLD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VERIFIKASI MATERIAL DITERIMA BERDASARKAN FOTO SURAT JALAN
          - Tampilkan foto surat jalan fisik
          - Editable kuantitas material diterima
          - Selisih alert & pencatatan
         ========================================================================= */}
      {verifSjWo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveVerifSj}
            className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-slate-100 pb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Verifikasi Material Diterima (Surat Jalan) — {verifSjWo.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periksa kesesuaian fisik antara Surat Jalan Gudang dan klaim vendor. Anda dapat mengedit kuantitas jika ada selisih fisik.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Vendor: {verifSjWo.vendor}
              </span>
            </div>

            {/* Body */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Info Surat Jalan & Foto Fisik */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Kolom Kiri: Detail SJ */}
                <div className="lg:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Nomor Surat Jalan:</span>
                      <span className="font-mono font-bold text-indigo-900 text-sm">
                        {verifSjWo.suratJalanNumber || 'Belum diisi vendor'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Tanggal Surat Jalan:</span>
                      <span className="font-bold text-slate-800">
                        {verifSjWo.suratJalanDate || '-'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Catatan Penerimaan Vendor:</span>
                      <p className="text-slate-700 mt-0.5 italic">
                        &quot;{verifSjWo.vendorReceiptNotes || 'Tidak ada catatan khusus dari vendor'}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pengawas Verifikator *</label>
                      <input
                        type="text"
                        required
                        value={verifSjOfficer}
                        onChange={(e) => setVerifSjOfficer(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Hasil Verifikasi Pengawas</label>
                      <input
                        type="text"
                        value={verifSjNotes}
                        onChange={(e) => setVerifSjNotes(e.target.value)}
                        placeholder="Contoh: Fisik material lengkap dan segel pabrik utuh..."
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Foto Fisik Surat Jalan */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      Foto Fisik Surat Jalan
                    </span>
                    {verifSjWo.suratJalanPhoto ? (
                      <div className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-300 bg-black/5 aspect-4/3 flex items-center justify-center">
                        <img
                          src={verifSjWo.suratJalanPhoto}
                          alt="Surat Jalan Fisik"
                          className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
                          onClick={() => setPreviewPhotoModal(verifSjWo.suratJalanPhoto || null)}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye className="w-4 h-4" />
                          <span>Klik Perbesar</span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-4/3 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-3">
                        <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                        <span>Vendor belum mengunggah foto surat jalan</span>
                      </div>
                    )}
                  </div>
                  {verifSjWo.suratJalanPhoto && (
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoModal(verifSjWo.suratJalanPhoto || null)}
                      className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 justify-center py-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Foto Dokumen Penuh</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabel Verifikasi & Edit Kuantitas Fisik */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="bg-indigo-50/70 px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    Tabel Checklist & Edit Qty Verifikasi Pengawas
                  </span>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    Ketik langsung di kolom <b>&quot;Qty Diterima (Verif Pengawas)&quot;</b> jika fisik berbeda dengan klaim vendor
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                      <tr className="divide-x divide-slate-200">
                        <th className="py-2.5 px-3 w-8 text-center">NO</th>
                        <th className="py-2.5 px-3">NAMA MATERIAL</th>
                        <th className="py-2.5 px-3 text-center">SAT</th>
                        <th className="py-2.5 px-3 text-right">QTY ALOKASI WO</th>
                        <th className="py-2.5 px-3 text-right">KLAIM VENDOR</th>
                        <th className="py-2.5 px-3 text-center w-36 bg-indigo-50/40">QTY DITERIMA (VERIFIKASI PENGAWAS)</th>
                        <th className="py-2.5 px-3 text-center">STATUS SELISIH</th>
                        <th className="py-2.5 px-3">CATATAN PEMERIKSAAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {verifSjMaterials.map((it, idx) => {
                        const selisih = it.qtyTaken - it.qtyAllocated;
                        const isMatch = selisih === 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-200">
                            <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-3 font-semibold text-slate-900">{it.material}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-500">{it.unit}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{it.qtyAllocated}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">{it.qtyVendorClaim}</td>
                            
                            {/* Editable Qty Verifikasi Pengawas */}
                            <td className="py-2 px-3 text-center bg-indigo-50/20">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={it.qtyTaken}
                                onChange={(e) => handleUpdateVerifSjQty(idx, e.target.value)}
                                className="w-24 text-center font-mono font-bold text-xs py-1.5 px-2 border-2 border-indigo-400 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 shadow-2xs"
                              />
                            </td>

                            <td className="py-3 px-3 text-center">
                              {isMatch ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  <span>Sesuai Alokasi</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Selisih ({selisih > 0 ? `+${selisih}` : selisih})</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={it.note}
                                onChange={(e) => handleUpdateVerifSjNote(idx, e.target.value)}
                                placeholder="Catatan kondisi fisik / nomor seri..."
                                className="w-full text-xs py-1 px-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-hidden"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setVerifSjWo(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Sahkan Verifikasi Fisik Surat Jalan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: VERIFIKASI REALISASI MATERIAL TERPASANG & RETUR GUDANG
          - Verifikasi & edit Qty Terpasang
          - Verifikasi & edit Qty Retur
          - Berita acara opname lapangan
         ========================================================================= */}
      {verifRealizationWo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveVerifRealization}
            className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-slate-100 pb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Verifikasi Realisasi Material Terpasang & Retur — {verifRealizationWo.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lakukan opname fisik lapangan: verifikasi dan edit jumlah material yang terpasang serta material sisa yang wajib diretur ke Gudang PLN.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                Vendor: {verifRealizationWo.vendor}
              </span>
            </div>

            {/* Body */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Info Pelaporan Vendor */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tanggal Laporan Vendor:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {verifRealizationWo.vendorRealizationDate || 'Baru saja dilaporkan'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Catatan Pelaksanaan Vendor:</span>
                  <p className="text-slate-700 italic mt-0.5">
                    &quot;{verifRealizationWo.vendorRealizationNotes || 'Semua pekerjaan konstruksi telah selesai sesuai spesifikasi teknis.'}&quot;
                  </p>
                </div>

                <div className="sm:col-span-1 pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pengawas Verifikator *</label>
                  <input
                    type="text"
                    required
                    value={verifRealizationOfficer}
                    onChange={(e) => setVerifRealizationOfficer(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Berita Acara Opname Fisik</label>
                  <input
                    type="text"
                    value={verifRealizationNotes}
                    onChange={(e) => setVerifRealizationNotes(e.target.value)}
                    placeholder="Contoh: Seluruh tiang dan trafo telah diopname fisik, material sisa kabel telah dihitung dan masuk karantina retur..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tabel Verifikasi Realisasi vs Retur */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="bg-emerald-50/70 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Opname Fisik Material: Terpasang vs Diretur
                  </span>
                  <span className="text-[11px] text-emerald-800 font-medium">
                    Pastikan <b>(Qty Terpasang + Qty Retur = Qty Diambil)</b>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                      <tr className="divide-x divide-slate-200">
                        <th className="py-2.5 px-3 w-8 text-center">NO</th>
                        <th className="py-2.5 px-3">MATERIAL</th>
                        <th className="py-2.5 px-3 text-center">SAT</th>
                        <th className="py-2.5 px-3 text-right">DIAMBIL (SJ)</th>
                        <th className="py-2.5 px-3 text-center bg-blue-50/40 w-32">QTY TERPASANG (PENGAWAS)</th>
                        <th className="py-2.5 px-3 text-center bg-amber-50/40 w-32">QTY RETUR GUDANG</th>
                        <th className="py-2.5 px-3 text-center">STATUS KESEIMBANGAN</th>
                        <th className="py-2.5 px-3">CATATAN OPNAME</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {verifRealizationItems.map((it, idx) => {
                        const sum = it.qtyInstalled + it.qtyReturned;
                        const isBalanced = sum === it.qtyTaken;
                        const diff = sum - it.qtyTaken;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-200">
                            <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-3 font-semibold text-slate-900">{it.material}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-500">{it.unit}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{it.qtyTaken}</td>

                            {/* Editable Qty Terpasang */}
                            <td className="py-2 px-3 text-center bg-blue-50/20">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={it.qtyInstalled}
                                onChange={(e) => handleUpdateRealizationInstalled(idx, e.target.value)}
                                className="w-24 text-center font-mono font-bold text-xs py-1.5 px-2 border-2 border-blue-400 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 shadow-2xs"
                              />
                            </td>

                            {/* Editable Qty Retur */}
                            <td className="py-2 px-3 text-center bg-amber-50/20">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={it.qtyReturned}
                                onChange={(e) => handleUpdateRealizationReturned(idx, e.target.value)}
                                className="w-24 text-center font-mono font-bold text-xs py-1.5 px-2 border-2 border-amber-400 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-600 shadow-2xs"
                              />
                            </td>

                            <td className="py-3 px-3 text-center">
                              {isBalanced ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  <span>{it.qtyReturned > 0 ? `Retur ${it.qtyReturned}` : '100% Terpasang'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Selisih Opname ({diff > 0 ? `+${diff}` : diff})</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={it.note}
                                onChange={(e) => handleUpdateRealizationNote(idx, e.target.value)}
                                placeholder="Keterangan fisik / kondisi retur..."
                                className="w-full text-xs py-1 px-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-hidden"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setVerifRealizationWo(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Sahkan Hasil Opname Realisasi & Retur</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: UPDATE PROGRES LAPANGAN (6 MILESTONE STANDAR PLN)
         ========================================================================= */}
      {editingWo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveProgress}
            className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">
                    Update Progres Lapangan — {editingWo.id}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    editingWo.category === 'WO Paket 1' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}>
                    {editingWo.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pelanggan: <b className="text-slate-800">{editingWo.customerName}</b> • Vendor: <b className="text-purple-700">{editingWo.vendor}</b>
                </p>
              </div>

              {/* Total Fisik Akumulasi Badge */}
              <div className="bg-emerald-50 border border-emerald-300 px-4 py-2 rounded-xl text-right shrink-0 shadow-2xs">
                <span className="text-[10px] text-emerald-800 font-semibold block uppercase tracking-wider">
                  Total Fisik Komposit
                </span>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {currentCalcs.total}%
                </span>
              </div>
            </div>

            {/* Modal Body Scrollable */}
            <div className="overflow-y-auto space-y-5 pr-1 flex-1">
              {/* Banner Multi-Segment Progress Bar */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 rounded-xl shadow-md border border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-blue-300 font-bold block">
                      Akumulasi 6 Tahap Progres WO Menuju 100%
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black font-mono text-emerald-400">
                        {currentCalcs.total}%
                      </span>
                      <span className="text-xs text-slate-300">
                        • {currentCalcs.stageLabel}
                      </span>
                    </div>
                  </div>

                  {/* Porsi Chip */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="bg-blue-900/60 border border-blue-400/40 px-3 py-1.5 rounded-lg text-center">
                      <span className="text-[10px] text-blue-200 block font-semibold">1. Material (Bobot 15%)</span>
                      <span className="font-mono font-bold text-white">+{currentCalcs.matContrib}%</span>
                    </div>
                    <div className="bg-amber-900/60 border border-amber-400/40 px-3 py-1.5 rounded-lg text-center">
                      <span className="text-[10px] text-amber-200 block font-semibold">2-6. Jasa (Bobot 85%)</span>
                      <span className="font-mono font-bold text-white">+{currentCalcs.jasContrib}%</span>
                    </div>
                  </div>
                </div>

                {/* Multi-segmented Progress Bar */}
                <div className="mt-3 bg-slate-800/90 h-3 rounded-full overflow-hidden flex border border-slate-700">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${currentCalcs.matContrib}%` }}
                    title={`Pengambilan Material: +${currentCalcs.matContrib}%`}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${Math.round((editingMilestones.konstruksi * 25) / 100 * 10) / 10}%` }}
                    title={`Pemasangan Konstruksi TM/TR: +${Math.round((editingMilestones.konstruksi * 25) / 100 * 10) / 10}%`}
                  />
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${Math.round((editingMilestones.konduktor * 25) / 100 * 10) / 10}%` }}
                    title={`Penarikan Konduktor: +${Math.round((editingMilestones.konduktor * 25) / 100 * 10) / 10}%`}
                  />
                  <div
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${Math.round((editingMilestones.gardu * 20) / 100 * 10) / 10}%` }}
                    title={`Pembangunan Gardu: +${Math.round((editingMilestones.gardu * 20) / 100 * 10) / 10}%`}
                  />
                  <div
                    className="bg-teal-500 h-full transition-all duration-300"
                    style={{ width: `${Math.round((editingMilestones.komisioning * 10) / 100 * 10) / 10}%` }}
                    title={`Komisioning: +${Math.round((editingMilestones.komisioning * 10) / 100 * 10) / 10}%`}
                  />
                  <div
                    className="bg-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${Math.round((editingMilestones.energize * 5) / 100 * 10) / 10}%` }}
                    title={`Energize: +${Math.round((editingMilestones.energize * 5) / 100 * 10) / 10}%`}
                  />
                </div>
              </div>

              {/* Tab Navigasi: Milestone Standar vs Rincian KHS */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('milestone')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeModalTab === 'milestone'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>6 Tahap Milestone Lapangan (Standar PLN)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono">100%</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('rincianKHS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeModalTab === 'rincianKHS'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Rincian Item Jasa KHS (Volume Lapangan)</span>
                </button>
              </div>

              {/* TAB 1: 6 TAHAP MILESTONE LAPANGAN */}
              {activeModalTab === 'milestone' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="text-xs text-slate-700">
                        Klik <b>centang</b> pada tahapan yang sudah selesai. Persentase fisik langsung bertambah otomatis menuju <b>100%</b>:
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMilestoneCheckAll(true)}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Centang Semua (100%)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMilestoneCheckAll(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        Reset (0%)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {MILESTONE_CONFIG.map((mDef) => {
                      const isChecked = (editingMilestones[mDef.key] || 0) >= 100;

                      return (
                        <div
                          key={mDef.key}
                          className={`rounded-2xl border-2 transition-all select-none overflow-hidden ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                          }`}
                        >
                          <div
                            onClick={() => handleMilestoneToggle(mDef.key)}
                            className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isChecked
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                    : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                                }`}
                              >
                                <Check className="w-5 h-5 stroke-[3]" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    Tahap {mDef.no}
                                  </span>
                                  <h4 className={`text-sm ${isChecked ? 'font-black text-emerald-950' : 'font-bold text-slate-900'}`}>
                                    {mDef.title}
                                  </h4>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-1">
                                  {mDef.desc}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div
                                className={`px-3.5 py-1.5 rounded-xl font-bold font-mono text-xs border transition-all ${
                                  isChecked
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {isChecked ? `+${mDef.weight}% (Centang)` : `+0% (Bobot ${mDef.weight}%)`}
                              </div>
                              <span className="text-[10px] font-medium block mt-1 text-slate-400">
                                {isChecked ? '✓ Tahap Selesai' : 'Klik untuk centang'}
                              </span>
                            </div>
                          </div>

                          {mDef.key === 'material' && (
                            <div className="px-4 pb-3 pt-1 border-t border-slate-100 bg-white/60">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMaterialTable(!showMaterialTable);
                                  }}
                                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer py-1"
                                >
                                  <Boxes className="w-3.5 h-3.5" />
                                  <span>{showMaterialTable ? 'Sembunyikan' : 'Lihat'} Kebutuhan Material Gudang</span>
                                  {showMaterialTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {showMaterialTable && (
                                <div className="overflow-x-auto bg-white rounded-xl border border-blue-200 shadow-2xs mt-2">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-[#f0f6ff] border-b border-blue-200 text-blue-900 uppercase text-[10px] font-bold tracking-wider">
                                      <tr className="divide-x divide-blue-200">
                                        <th className="py-2 px-3">Material</th>
                                        <th className="py-2 px-3 text-right">Kebutuhan</th>
                                        <th className="py-2 px-3 text-right">Sdh Reservasi</th>
                                        <th className="py-2 px-3 text-center w-32">Qty Reservasi</th>
                                        <th className="py-2 px-3 text-center">Satuan</th>
                                        <th className="py-2 px-3 text-center">Status Ambil</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-100/70 font-sans">
                                      {editingMaterials.map((m, idx) => {
                                        const isComplete = m.sdhReservasi >= m.kebutuhan;
                                        const pct = m.kebutuhan > 0 ? Math.round((m.sdhReservasi / m.kebutuhan) * 100) : 0;
                                        return (
                                          <tr key={idx} className="hover:bg-blue-50/30 transition-colors divide-x divide-blue-100">
                                            <td className="py-2 px-3">
                                              <div className="font-bold text-slate-900">{m.material}</div>
                                              {m.kode && <div className="text-[10px] font-mono text-slate-400">{m.kode}</div>}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-700 text-xs">
                                              {m.kebutuhan}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-700 text-xs">
                                              {m.sdhReservasi}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                              <input
                                                type="number"
                                                min="0"
                                                max={m.kebutuhan}
                                                value={m.qtyReservasi}
                                                onChange={(e) => handleMaterialChange(idx, 'qtyReservasi', e.target.value)}
                                                className="w-20 text-center font-mono font-bold text-xs py-1 px-1 border border-blue-300 rounded bg-blue-50/40 focus:bg-white focus:outline-hidden"
                                              />
                                            </td>
                                            <td className="py-2 px-3 text-center font-mono text-slate-500">{m.unit}</td>
                                            <td className="py-2 px-3 text-center">
                                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                isComplete
                                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                  : pct > 0
                                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                  : 'bg-slate-100 text-slate-600'
                                              }`}>
                                                {isComplete ? 'Lengkap (100%)' : pct > 0 ? `${pct}% Diambil` : 'Belum Diambil'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: RINCIAN ITEM JASA KHS */}
              {activeModalTab === 'rincianKHS' && (
                <div className="border border-amber-200/90 bg-amber-50/30 p-4 rounded-xl space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-950">
                          Rincian Volume Riil Item Jasa KHS ({editingWo.category})
                        </h4>
                        <p className="text-[11px] text-amber-700/90 mt-0.5">
                          Isi volume riil aktual jika Anda ingin memverifikasi per satuan pekerjaan jasa.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                        <tr className="divide-x divide-slate-200">
                          <th className="py-2.5 px-3 w-8">NO</th>
                          <th className="py-2.5 px-3">URAIAN PEKERJAAN JASA</th>
                          <th className="py-2.5 px-3 text-right">TARGET</th>
                          <th className="py-2.5 px-3 text-center w-36">REALISASI LAPANGAN</th>
                          <th className="py-2.5 px-3 text-center">SAT</th>
                          <th className="py-2.5 px-3 text-right">BOBOT</th>
                          <th className="py-2.5 px-3 text-center w-24">PROGRES</th>
                          <th className="py-2.5 px-3 text-right">KONTRIBUSI</th>
                          <th className="py-2.5 px-3 text-center w-20">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {editingJasaItems.map((item, idx) => {
                          const prog = item.progresPersen || 0;
                          const bbt = item.bobotPersen !== undefined ? item.bobotPersen : (100 / editingJasaItems.length);
                          const contribution = Math.round((prog * (bbt / 100)) * 10) / 10;
                          const isFull = prog >= 100;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-200">
                              <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">
                                <div>{item.deskripsi}</div>
                                {item.kode && (
                                  <div className="text-[10px] font-mono text-slate-400 font-normal">{item.kode}</div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                                {item.qtyTarget}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={item.qtyRealisasi}
                                  onChange={(e) => handleQtyRealisasiChange(idx, e.target.value)}
                                  className="w-24 text-center font-mono font-bold text-xs py-1 px-2 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-slate-500">{item.unit}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-600 font-semibold">{bbt}%</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-mono font-bold ${
                                  isFull
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : prog > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {prog}%
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                                +{contribution}%
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSetQuickItem(idx, true)}
                                    className="p-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition cursor-pointer"
                                  >
                                    100%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetQuickItem(idx, false)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Catatan Pengawas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Pengawas Lapangan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Tiang 12m sudah ditanam 5 batang, penarikan kabel A3CS telah selesai 0.9 kms, vendor menunggu izin melintas..."
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setEditingWo(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Progres Lapangan ({currentCalcs.total}%)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL PREVIEW FOTO SURAT JALAN FULLSCREEN
         ========================================================================= */}
      {previewPhotoModal && (
        <div 
          onClick={() => setPreviewPhotoModal(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-70 p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Dokumen Fisik Surat Jalan Pengambilan Gudang
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center bg-slate-900/10">
              <img
                src={previewPhotoModal}
                alt="Foto Fisik Surat Jalan"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
