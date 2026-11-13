'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileCheck2, 
  Search, 
  CheckCircle2, 
  Clock, 
  Building2, 
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  FileText,
  TrendingUp,
  Percent,
  Edit3,
  X,
  Eye,
  Camera,
  Layers,
  ArrowRight,
  HardHat,
  Calendar,
  Check,
  Info,
  Package,
  Zap,
  ChevronRight
} from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { WorkOrderRecord, WoMaterialItem, WoJasaItem } from '@/types';
import { calculateRabFromSurvey } from '@/data/rabMasterData';

const parseSupervisor = (s?: string) => {
  if (!s || s === '—' || s === '-') return { name: '—', role: '' };
  const parts = s.split('(');
  const name = parts[0].trim();
  const role = parts.length > 1 ? parts[1].replace(')', '').trim() : '';
  return { name, role };
};

export const VerifikasiPengawasView: React.FC = () => {
  const { 
    workOrders, 
    surveys,
    customKhsPrices,
    updateWoProgress,
    pengawasVerifyReceipt,
    pengawasVerifyRealization,
    pengawasApproveProgress,
    pengawasRejectProgress,
    showToast,
    setCurrentPage
  } = usePromotorStore();

  const [activeTab, setActiveTab] = useState<'all' | 'menunggu_verif_progress' | 'menunggu_sj' | 'jasa_belum_mulai' | 'konstruksi' | 'jasa_selesai' | 'realisasi'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectModalWo, setRejectModalWo] = useState<WorkOrderRecord | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');

  // --------------------------------------------------------------------------
  // Helper: Kelompok Jasa & Perhitungan Progres Riil per WO
  // --------------------------------------------------------------------------
  const getWoJasaItems = (wo: WorkOrderRecord): WoJasaItem[] => {
    // 1. Jika WO memiliki pengajuan pending dari vendor, utamakan pengajuan tersebut untuk diverifikasi
    if (wo.pendingJasaItems && wo.pendingJasaItems.length > 0) {
      return wo.pendingJasaItems;
    }

    // 2. Jika WO sudah memiliki jasaItems resmi dengan detail lengkap (lebih dari 2 item), pakai data WO
    if (wo.jasaItems && wo.jasaItems.length > 2) {
      return wo.jasaItems;
    }

    // 2. Hubungkan dengan survey terkait untuk mengambil Kelompok Jasa murni dari Dokumen WO / RAB
    const matchedSurvey = surveys.find(
      (s) => s.id === wo.surveyId || s.id === wo.daftungId || s.idpel === wo.idpel || s.customerName === wo.customerName
    ) || surveys[0];

    if (matchedSurvey) {
      const isPaket2 = wo.category === 'WO Paket 2';
      const isTiang = wo.category === 'WO Tiang';
      const paketKey = isPaket2 ? 'paket2' : 'paket1';

      if (isTiang) {
        return [
          { id: 'JSA-TB-01', kode: 'JSA-TNG-12-350', subKategori: 'A. PEKERJAAN PENDIRIAN & PENANAMAN TIANG BETON', deskripsi: 'Pendirian & Penanaman Tiang Beton 12 Meter 350 daN', qtyTarget: 2, qtyRealisasi: 0, unit: 'btg', hargaSatuan: 485000, bobotPersen: 45.1, progresPersen: 0 },
          { id: 'JSA-TB-02', kode: 'JSA-TNG-12-200', subKategori: 'A. PEKERJAAN PENDIRIAN & PENANAMAN TIANG BETON', deskripsi: 'Pendirian & Penanaman Tiang Beton 12 Meter 200 daN', qtyTarget: 1, qtyRealisasi: 0, unit: 'btg', hargaSatuan: 425000, bobotPersen: 19.8, progresPersen: 0 },
          { id: 'JSA-TB-03', kode: 'JSA-TNG-09-200', subKategori: 'A. PEKERJAAN PENDIRIAN & PENANAMAN TIANG BETON', deskripsi: 'Pendirian & Penanaman Tiang Beton 9 Meter 200 daN', qtyTarget: 2, qtyRealisasi: 0, unit: 'btg', hargaSatuan: 370000, bobotPersen: 35.1, progresPersen: 0 },
        ];
      }

      const rab = calculateRabFromSurvey(matchedSurvey, paketKey, customKhsPrices);
      const rawJasa = rab.filter((r) => !r.isHeader && r.section === 'JASA' && r.rencanaVol > 0);

      if (rawJasa.length > 0) {
        const totalVal = rawJasa.reduce((acc, r) => acc + (r.rencanaVol * (r.hargaSatuan || 0)), 0);
        return rawJasa.map((r, idx) => {
          const itemVal = r.rencanaVol * (r.hargaSatuan || 0);
          const bobot = totalVal > 0 
            ? Math.round((itemVal / totalVal) * 1000) / 10 
            : Math.round((100 / rawJasa.length) * 10) / 10;
          return {
            id: r.id || `JSA-${idx + 1}`,
            kode: r.kode || `JSA-${idx + 1}`,
            deskripsi: r.desc,
            subKategori: r.subSection || (isPaket2 ? 'KELOMPOK JASA JTR & APP' : 'KELOMPOK JASA SUTM & GARDU DISTRIBUSI'),
            qtyTarget: r.rencanaVol,
            qtyRealisasi: r.realisasiVol || 0,
            unit: r.sat || 'bh',
            hargaSatuan: r.hargaSatuan || 0,
            bobotPersen: bobot,
            progresPersen: r.realisasiVol && r.rencanaVol ? Math.min(100, Math.round((r.realisasiVol / r.rencanaVol) * 100)) : 0,
          };
        });
      }
    }

    if (wo.jasaItems && wo.jasaItems.length > 0) {
      return wo.jasaItems;
    }

    return [];
  };

  const calculateJasaProgress = (items: WoJasaItem[]): number => {
    if (!items || items.length === 0) return 0;
    
    // Perhitungan berbasis nilai rupiah (Rencana vs Realisasi)
    const totalRencanaRp = items.reduce((sum, it) => sum + (it.qtyTarget * (it.hargaSatuan || 0)), 0);
    const totalRealisasiRp = items.reduce((sum, it) => sum + ((it.qtyRealisasi || 0) * (it.hargaSatuan || 0)), 0);

    if (totalRencanaRp > 0) {
      return Math.min(100, Math.round((totalRealisasiRp / totalRencanaRp) * 100));
    }

    // Fallback: terbobot bobotPersen
    const totalBobot = items.reduce((sum, it) => sum + (it.bobotPersen || 0), 0);
    if (totalBobot > 0) {
      const weightedSum = items.reduce((sum, it) => {
        const pct = it.progresPersen !== undefined 
          ? it.progresPersen 
          : (it.qtyTarget > 0 ? Math.min(100, Math.round(((it.qtyRealisasi || 0) / it.qtyTarget) * 100)) : 0);
        return sum + (pct * (it.bobotPersen || 0));
      }, 0);
      return Math.min(100, Math.round(weightedSum / totalBobot));
    }

    // Fallback: rata-rata progres item
    const avg = items.reduce((sum, it) => {
      const pct = it.progresPersen !== undefined 
        ? it.progresPersen 
        : (it.qtyTarget > 0 ? Math.min(100, Math.round(((it.qtyRealisasi || 0) / it.qtyTarget) * 100)) : 0);
      return sum + pct;
    }, 0) / items.length;
    return Math.min(100, Math.round(avg));
  };

  const calculateMaterialProgress = (wo: WorkOrderRecord): number => {
    const mats = wo.materials || [];
    if (mats.length === 0) return wo.progressMaterial || 0;

    // Periksa apakah masih ada item yang ditahan atau belum diambil penuh
    const hasHeld = mats.some((m) => m.isHold);
    const hasRemainingToTake = mats.some((m) => {
      if (m.isHold) return true;
      const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
      return (m.qtyTaken || 0) < req;
    });

    // HANYA 100% jika SELURUH material WO sudah selesai diambil penuh dan tidak ada yang di-hold
    const isAllCompleted = !hasRemainingToTake && !hasHeld;
    if (isAllCompleted) return 100;

    // Jika belum ada pengambilan sama sekali
    const totalTaken = mats.reduce((acc, m) => acc + (m.qtyTaken || 0), 0);
    if (totalTaken === 0) return 0;

    // Hitung persentase riil material yang sudah diambil secara proporsional
    const totalFulfillment = mats.reduce((sum, m) => {
      if (m.isHold) return sum;
      const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
      const taken = m.qtyTaken || 0;
      return sum + (req > 0 ? Math.min(1, taken / req) : 0);
    }, 0);

    const calculatedPct = Math.round((totalFulfillment / mats.length) * 100);

    // Jika baru diambil sebagian, maksimal 99% (tidak boleh 100% sebelum semua selesai)
    return Math.min(99, Math.max(1, calculatedPct));
  };

  // --------------------------------------------------------------------------
  // MODAL 1: Verifikasi Material Diterima (Surat Jalan Vendor)
  // --------------------------------------------------------------------------
  const [verifSjWo, setVerifSjWo] = useState<WorkOrderRecord | null>(null);
  const [verifSjMaterials, setVerifSjMaterials] = useState<
    { material: string; unit: string; qtyAllocated: number; qtyVendorClaim: number; qtyTaken: number; note: string }[]
  >([]);
  const [verifSjNotes, setVerifSjNotes] = useState('');
  const [verifSjOfficer, setVerifSjOfficer] = useState('');
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // MODAL 2: Update Progres Jasa Lapangan Berbasis Kelompok Jasa WO
  // --------------------------------------------------------------------------
  const [progressWo, setProgressWo] = useState<WorkOrderRecord | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [progressNote, setProgressNote] = useState<string>('');
  const [progressJasaItems, setProgressJasaItems] = useState<WoJasaItem[]>([]);

  // --------------------------------------------------------------------------
  // MODAL 3: Detail Laporan Retur Sisa Material ke Gudang
  // --------------------------------------------------------------------------
  const [verifRealizationWo, setVerifRealizationWo] = useState<WorkOrderRecord | null>(null);
  const [verifRealizationItems, setVerifRealizationItems] = useState<
    { 
      material: string; 
      unit: string; 
      qtyTaken: number; 
      qtyVendorInstalled: number; 
      qtyVendorReturned: number; 
      qtyInstalled: number; 
      qtyReturned: number; 
      note: string 
    }[]
  >([]);
  const [verifRealizationNotes, setVerifRealizationNotes] = useState('');
  const [verifRealizationOfficer, setVerifRealizationOfficer] = useState('');

  // Filter WO yang berstatus APPROVED atau dalam tahap pengerjaan
  const activeWos = useMemo(() => {
    return workOrders.filter(
      (w) => w.approvalStatus === 'APPROVED' || w.status === 'Konstruksi' || w.status === 'Verifikasi SJ' || w.status === 'Selesai'
    );
  }, [workOrders]);

  // Tab Filtering
  const filteredWos = useMemo(() => {
    let list = activeWos;

    if (activeTab === 'menunggu_verif_progress') {
      list = list.filter((w) => w.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS');
    } else if (activeTab === 'menunggu_sj') {
      list = list.filter((w) => (w.vendorReceiptConfirmed || w.suratJalanNumber || w.suratJalanPhoto) && w.sjVerificationStatus !== 'SESUAI');
    } else if (activeTab === 'jasa_belum_mulai') {
      list = list.filter((w) => {
        const jProg = w.progressJasa !== undefined ? w.progressJasa : calculateJasaProgress(getWoJasaItems(w));
        return jProg === 0;
      });
    } else if (activeTab === 'konstruksi') {
      list = list.filter((w) => {
        const jProg = w.progressJasa !== undefined ? w.progressJasa : calculateJasaProgress(getWoJasaItems(w));
        return jProg > 0 && jProg < 100;
      });
    } else if (activeTab === 'jasa_selesai') {
      list = list.filter((w) => {
        const jProg = w.progressJasa !== undefined ? w.progressJasa : calculateJasaProgress(getWoJasaItems(w));
        return jProg >= 100;
      });
    } else if (activeTab === 'realisasi') {
      list = list.filter((w) => w.vendorRealizationSubmitted || (w.progress && w.progress >= 95));
    }

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter(
      (w) =>
        w.id.toLowerCase().includes(term) ||
        w.customerName.toLowerCase().includes(term) ||
        w.vendor.toLowerCase().includes(term) ||
        (w.spkNumber && w.spkNumber.toLowerCase().includes(term)) ||
        (w.suratJalanNumber && w.suratJalanNumber.toLowerCase().includes(term)) ||
        (w.supervisor1 && w.supervisor1.toLowerCase().includes(term)) ||
        (w.supervisor2 && w.supervisor2.toLowerCase().includes(term))
    );
  }, [activeWos, activeTab, searchTerm]);

  // Statistik Ringkasan
  const summaryStats = useMemo(() => {
    const total = activeWos.length;
    const menungguVerifProgress = activeWos.filter((w) => w.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS').length;
    const menungguSj = activeWos.filter((w) => (w.vendorReceiptConfirmed || w.suratJalanNumber || w.suratJalanPhoto) && w.sjVerificationStatus !== 'SESUAI').length;
    const jasaBelumMulai = activeWos.filter((w) => {
      const jProg = w.progressJasa !== undefined ? w.progressJasa : calculateJasaProgress(getWoJasaItems(w));
      return jProg === 0;
    }).length;
    const dalamKonstruksi = activeWos.filter((w) => {
      const jProg = w.progressJasa !== undefined ? w.progressJasa : calculateJasaProgress(getWoJasaItems(w));
      return jProg > 0 && jProg < 100;
    }).length;
    const jasaSelesai = activeWos.filter((w) => {
      const jProg = w.progressJasa !== undefined ? w.progressJasa : calculateJasaProgress(getWoJasaItems(w));
      return jProg >= 100;
    }).length;
    const menungguRealisasi = activeWos.filter((w) => w.vendorRealizationSubmitted && !w.pengawasRealizationVerified).length;
    return { total, menungguVerifProgress, menungguSj, jasaBelumMulai, dalamKonstruksi, jasaSelesai, menungguRealisasi };
  }, [activeWos]);

  // --------------------------------------------------------------------------
  // Handlers: Verifikasi Material Diterima (Surat Jalan)
  // --------------------------------------------------------------------------
  const handleOpenVerifSj = (wo: WorkOrderRecord) => {
    setVerifSjWo(wo);
    setVerifSjOfficer(wo.supervisor1 || wo.supervisor || 'Hasian Sitorus (TC Lola Konstruksi)');
    setVerifSjNotes(wo.sjVerificationNotes || '');

    const items = (wo.materials || []).map((m) => {
      const alloc = m.qtyAllocated || m.qtyReksis || 1;
      const vendorClaim = m.qtyTaken !== undefined ? m.qtyTaken : alloc;
      return {
        material: m.material,
        unit: m.unit || 'Buah',
        qtyAllocated: alloc,
        qtyVendorClaim: vendorClaim,
        qtyTaken: vendorClaim,
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

    showToast(`✅ Verifikasi Surat Jalan untuk ${verifSjWo.id} berhasil disimpan!`);
    setVerifSjWo(null);
  };

  // --------------------------------------------------------------------------
  // Handlers: Update Progres Jasa Lapangan Berbasis Kelompok Jasa WO
  // --------------------------------------------------------------------------
  const handleOpenProgressModal = (wo: WorkOrderRecord) => {
    setProgressWo(wo);
    const initialItems = getWoJasaItems(wo).map((it) => ({ ...it }));
    setProgressJasaItems(initialItems);
    const currentJasa = wo.progressJasa !== undefined ? wo.progressJasa : calculateJasaProgress(initialItems);
    setProgressVal(currentJasa);
    setProgressNote(wo.catatan || '');
  };

  const handleUpdateItemRealisasi = (idx: number, realisasiVal: number) => {
    setProgressJasaItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      const safeVal = Math.max(0, realisasiVal);
      item.qtyRealisasi = safeVal;
      item.progresPersen = item.qtyTarget > 0 ? Math.min(100, Math.round((safeVal / item.qtyTarget) * 100)) : (safeVal > 0 ? 100 : 0);
      copy[idx] = item;
      
      const newTotal = calculateJasaProgress(copy);
      setProgressVal(newTotal);
      return copy;
    });
  };

  const handleSetItemPercent = (idx: number, pct: number) => {
    setProgressJasaItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      item.progresPersen = pct;
      item.qtyRealisasi = Math.round(((item.qtyTarget * pct) / 100) * 1000) / 1000;
      copy[idx] = item;
      
      const newTotal = calculateJasaProgress(copy);
      setProgressVal(newTotal);
      return copy;
    });
  };

  const handleSetAll100Percent = () => {
    setProgressJasaItems((prev) => {
      const copy = prev.map((it) => ({
        ...it,
        qtyRealisasi: it.qtyTarget,
        progresPersen: 100,
      }));
      const newTotal = calculateJasaProgress(copy);
      setProgressVal(newTotal);
      return copy;
    });
  };

  const handleResetAll = () => {
    setProgressJasaItems((prev) => {
      const copy = prev.map((it) => ({
        ...it,
        qtyRealisasi: 0,
        progresPersen: 0,
      }));
      const newTotal = calculateJasaProgress(copy);
      setProgressVal(newTotal);
      return copy;
    });
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressWo) return;

    const matProg = calculateMaterialProgress(progressWo);
    const jasaProg = progressVal;

    updateWoProgress(
      progressWo.id,
      jasaProg,
      progressNote.trim(),
      matProg,
      jasaProg,
      progressJasaItems
    );

    showToast(`✅ Progres Jasa Konstruksi ${progressWo.id} berhasil diperbarui (${jasaProg}%)`);
    setProgressWo(null);
  };

  const handleApproveProgressVendor = () => {
    if (!progressWo) return;
    const verifierOfficer = progressWo.supervisor1 || progressWo.supervisor || 'Hasian Sitorus (TC Lola Konstruksi)';
    pengawasApproveProgress(progressWo.id, verifierOfficer, progressNote.trim(), progressJasaItems);
    setProgressWo(null);
  };

  const handleOpenRejectModal = () => {
    setRejectModalWo(progressWo);
    setRejectReasonInput('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalWo) return;
    if (!rejectReasonInput.trim()) {
      showToast('Harap masukkan alasan penolakan progres');
      return;
    }
    const verifierOfficer = rejectModalWo.supervisor1 || rejectModalWo.supervisor || 'Hasian Sitorus (TC Lola Konstruksi)';
    pengawasRejectProgress(rejectModalWo.id, verifierOfficer, rejectReasonInput.trim());
    setRejectModalWo(null);
    setProgressWo(null);
  };

  // --------------------------------------------------------------------------
  // Handlers: Verifikasi Realisasi Terpasang & Retur Gudang
  // --------------------------------------------------------------------------
  const handleOpenVerifRealization = (wo: WorkOrderRecord) => {
    setVerifRealizationWo(wo);
    setVerifRealizationOfficer(wo.supervisor1 || wo.supervisor || 'Hasian Sitorus (TC Lola Konstruksi)');
    setVerifRealizationNotes(wo.pengawasRealizationNotes || '');

    const items = (wo.materials || []).map((m) => {
      const taken = m.qtyTaken || m.qtyAllocated || m.qtyReksis || 1;
      const vInstalled = m.qtyInstalled !== undefined ? m.qtyInstalled : taken;
      const vReturned = m.qtyReturned !== undefined ? m.qtyReturned : 0;

      return {
        material: m.material,
        unit: m.unit || 'Buah',
        qtyTaken: taken,
        qtyVendorInstalled: vInstalled,
        qtyVendorReturned: vReturned,
        qtyInstalled: vInstalled,
        qtyReturned: vReturned,
        note: m.verificationNote || m.vendorNotes || '',
      };
    });
    setVerifRealizationItems(items);
  };

  const handleUpdateRealizationInstalled = (idx: number, valStr: string) => {
    const val = parseFloat(valStr);
    const num = isNaN(val) ? 0 : Math.max(0, val);
    setVerifRealizationItems((prev) => {
      const copy = [...prev];
      const autoRetur = Math.max(0, copy[idx].qtyTaken - num);
      copy[idx] = { ...copy[idx], qtyInstalled: num, qtyReturned: autoRetur };
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

  const handleSaveRealization = (e: React.FormEvent) => {
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

    showToast(`✅ Berita Acara Realisasi & Retur untuk ${verifRealizationWo.id} berhasil disahkan!`);
    setVerifRealizationWo(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Verifikasi & Progres Lapangan
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">
                Menu Pengawas Lapangan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifikasi fisik Surat Jalan material keluar gudang, pemantauan progres pengerjaan lapangan (%), dan pemantauan retur sisa material gudang.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage('reservasi-material')}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Ke Menu Reservasi Material</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'all' ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total WO Konstruksi</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summaryStats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Seluruh WO pengawasan lapangan</div>
        </div>

        <div 
          onClick={() => setActiveTab('menunggu_sj')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'menunggu_sj' ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Verifikasi Surat Jalan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{summaryStats.menungguSj}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Menunggu pencocokan fisik SJ</div>
        </div>

        <div 
          onClick={() => setActiveTab('konstruksi')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'konstruksi' ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Jasa Berjalan (1-99%)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700">{summaryStats.dalamKonstruksi}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Konstruksi aktif di lapangan</div>
        </div>

        <div 
          onClick={() => setActiveTab('realisasi')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'realisasi' ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Laporan Retur Sisa</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{summaryStats.menungguRealisasi}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Monitoring barang sisa ke gudang</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar (Clean, User-Friendly & No Ugly Scrollbar) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Baris 1: Pencarian & Info Total */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari No. WO, SPK, Pelanggan, Vendor, Surat Jalan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs"
            />
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 self-end sm:self-auto font-medium">
            <span>Menampilkan</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">{filteredWos.length}</span>
            <span>dari</span>
            <span className="font-bold text-slate-700 font-mono">{activeWos.length}</span>
            <span>Work Order</span>
          </div>
        </div>

        {/* Baris 2: Segmented Filter Pills yang Rapi & User Friendly (Flex Wrap tanpa scrollbar) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
          {/* 1. Tab Semua */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <span>Semua</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'all' ? 'bg-purple-700 text-purple-100' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {activeWos.length}
            </span>
          </button>

          {/* 2. Tab Verifikasi Progres Vendor */}
          <button
            type="button"
            onClick={() => setActiveTab('menunggu_verif_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'menunggu_verif_progress'
                ? 'bg-amber-500 text-white shadow-xs'
                : summaryStats.menungguVerifProgress > 0
                ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${activeTab === 'menunggu_verif_progress' ? 'text-white' : 'text-amber-600'}`} />
            <span>Verifikasi Progres Vendor</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'menunggu_verif_progress'
                ? 'bg-amber-600 text-white'
                : summaryStats.menungguVerifProgress > 0
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-slate-200/80 text-slate-600'
            }`}>
              {summaryStats.menungguVerifProgress}
            </span>
          </button>

          {/* 3. Tab Verifikasi SJ */}
          <button
            type="button"
            onClick={() => setActiveTab('menunggu_sj')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'menunggu_sj'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <FileCheck2 className={`w-3.5 h-3.5 ${activeTab === 'menunggu_sj' ? 'text-white' : 'text-slate-400'}`} />
            <span>Verifikasi SJ</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'menunggu_sj' ? 'bg-purple-700 text-purple-100' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {summaryStats.menungguSj}
            </span>
          </button>

          {/* 4. Tab Jasa Belum Mulai */}
          <button
            type="button"
            onClick={() => setActiveTab('jasa_belum_mulai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'jasa_belum_mulai'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <span>Belum Mulai</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'jasa_belum_mulai' ? 'bg-purple-700 text-purple-100' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {summaryStats.jasaBelumMulai}
            </span>
          </button>

          {/* 5. Tab Jasa Berjalan */}
          <button
            type="button"
            onClick={() => setActiveTab('konstruksi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'konstruksi'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${activeTab === 'konstruksi' ? 'text-white' : 'text-slate-400'}`} />
            <span>Jasa Berjalan</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'konstruksi' ? 'bg-purple-700 text-purple-100' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {summaryStats.dalamKonstruksi}
            </span>
          </button>

          {/* 6. Tab Jasa Tuntas 100% */}
          <button
            type="button"
            onClick={() => setActiveTab('jasa_selesai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'jasa_selesai'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${activeTab === 'jasa_selesai' ? 'text-white' : 'text-slate-400'}`} />
            <span>Tuntas 100%</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'jasa_selesai' ? 'bg-purple-700 text-purple-100' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {summaryStats.jasaSelesai}
            </span>
          </button>

          {/* 7. Tab Retur Sisa */}
          <button
            type="button"
            onClick={() => setActiveTab('realisasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'realisasi'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${activeTab === 'realisasi' ? 'text-white' : 'text-slate-400'}`} />
            <span>Retur Sisa</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'realisasi' ? 'bg-purple-700 text-purple-100' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {summaryStats.menungguRealisasi}
            </span>
          </button>
        </div>
      </div>

      {/* Tabel Verifikasi & Progres Lapangan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-3.5 min-w-[170px]">NO. WO & SPK</th>
                <th className="py-3 px-3.5 min-w-[165px]">PELANGGAN</th>
                <th className="py-3 px-3.5 min-w-[150px]">LOKASI</th>
                <th className="py-3 px-3.5 min-w-[160px]">VENDOR</th>
                <th className="py-3 px-3.5 min-w-[190px]">PENGAWAS</th>
                <th className="py-3 px-2.5 text-center min-w-[110px] w-28">SURAT JALAN (SJ)</th>
                <th className="py-3 px-2.5 text-center min-w-[130px] w-32">PROGRES MATERIAL</th>
                <th className="py-3 px-2.5 text-center min-w-[130px] w-32">PROGRES JASA</th>
                <th className="py-3 px-2.5 text-center min-w-[125px] w-32">RETUR SISA GUDANG</th>
                <th className="py-3 px-2.5 text-center min-w-[140px] w-36">AKSI PENGAWAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWos.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileCheck2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-500" />
                    Tidak ada data Work Order dalam kategori pengawasan ini
                  </td>
                </tr>
              ) : (
                filteredWos.map((wo) => {
                  const hasSj = Boolean(wo.vendorReceiptConfirmed || wo.suratJalanNumber || wo.suratJalanPhoto);
                  const sjVerified = wo.sjVerificationStatus === 'SESUAI';
                  const sjHasSelisih = wo.sjVerificationStatus === 'ADA_SELISIH';
                  const currentProg = wo.progress || 0;

                  const hasRealization = Boolean(wo.vendorRealizationSubmitted);
                  const realVerified = Boolean(wo.pengawasRealizationVerified);

                  // Pengawas 1 & Pengawas 2
                  const p1 = wo.supervisor1 || wo.supervisor || 'Hasian Sitorus (TC Lola Konstruksi)';
                  const p2 = wo.supervisor2 || (wo.category === 'WO Paket 2' ? 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)' : 'Daud Febrizer (TL Teknik ULP Rangkasbitung)');

                  return (
                    <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-200">
                      {/* 1. NO. WO & SPK */}
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-700 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs">{wo.id}</span>
                          <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold tracking-tight whitespace-nowrap ${
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
                          <div className="text-[10px] text-slate-500 font-normal font-sans mt-1">
                            <span className="text-slate-400 font-medium">SPK:</span>{' '}
                            <span className="font-mono text-[9.5px] text-slate-700">{wo.spkNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* 2. PELANGGAN (Kolom Sendiri) */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="font-semibold text-slate-900 leading-snug text-[11.5px]">{wo.customerName}</div>
                      </td>

                      {/* 2b. LOKASI */}
                      <td className="py-3 px-3.5 align-top">
                        {wo.location ? (
                          <div className="text-[10px] text-slate-500 flex items-start gap-1 leading-snug" title={wo.location}>
                            <span className="shrink-0 mt-0.5">📍</span>
                            <span className="line-clamp-3">{wo.location}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">—</span>
                        )}
                      </td>

                      {/* 3. VENDOR */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="text-xs font-bold text-slate-800 flex items-start gap-1.5 leading-snug">
                          <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <span>{wo.vendor}</span>
                        </div>
                        {wo.narahubung && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            Kontak: <span className="text-slate-700 font-medium">{wo.narahubung}</span>
                          </div>
                        )}
                      </td>

                      {/* 4. PENGAWAS (Pengawas 1 & 2) */}
                      <td className="py-3 px-3.5 align-top">
                        {(() => {
                          const s1 = parseSupervisor(p1);
                          const s2 = parseSupervisor(p2);
                          return (
                            <div className="flex flex-col gap-1.5 py-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">P1</span>
                                <div className="min-w-0 flex items-baseline gap-1 truncate">
                                  <span className="font-bold text-slate-800 text-[11px] truncate">{s1.name}</span>
                                  {s1.role && <span className="text-[9.5px] text-slate-500 font-medium truncate shrink-0">({s1.role})</span>}
                                </div>
                              </div>
                              {p2 && (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">P2</span>
                                  <div className="min-w-0 flex items-baseline gap-1 truncate">
                                    <span className="font-semibold text-slate-700 text-[10.5px] truncate">{s2.name}</span>
                                    {s2.role && <span className="text-[9.5px] text-slate-500 font-normal truncate shrink-0">({s2.role})</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 4. Status Surat Jalan */}
                      <td className="py-3 px-2.5 text-center align-top">
                        {hasSj ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold flex items-center gap-1 shadow-2xs whitespace-nowrap ${
                              sjVerified
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : sjHasSelisih
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              {sjVerified ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              ) : sjHasSelisih ? (
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              ) : (
                                <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                              )}
                              <span>
                                {sjVerified ? 'SJ SESUAI' : sjHasSelisih ? 'ADA SELISIH' : 'Menunggu Verif'}
                              </span>
                            </span>

                            {wo.suratJalanNumber && (
                              <span className="font-mono text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 max-w-[100px] truncate" title={wo.suratJalanNumber}>
                                {wo.suratJalanNumber}
                              </span>
                            )}

                            {wo.suratJalanPhoto && (
                              <button
                                type="button"
                                onClick={() => setPreviewPhotoModal(wo.suratJalanPhoto || null)}
                                className="text-[9.5px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5 mt-0.5"
                              >
                                <Camera className="w-3 h-3" />
                                <span>Foto SJ</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9.5px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap inline-block">
                            Belum Ada SJ
                          </span>
                        )}
                      </td>

                      {/* 5. Progres Material */}
                      <td className="py-3 px-2.5 text-center align-middle">
                        {(() => {
                          const matProg = calculateMaterialProgress(wo);
                          return (
                            <div className="flex flex-col items-center gap-1 w-24 mx-auto">
                              <span className={`text-[13px] font-black tabular-nums ${matProg === 100 ? 'text-emerald-600' : matProg > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                {matProg}%
                              </span>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${matProg === 100 ? 'bg-emerald-500' : matProg > 0 ? 'bg-amber-400' : 'bg-slate-300'}`}
                                  style={{ width: `${matProg}%` }}
                                />
                              </div>
                              <span className={`text-[9px] font-semibold ${matProg === 100 ? 'text-emerald-600' : matProg > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                {matProg === 100 ? '✓ Selesai' : matProg > 0 ? 'Sebagian' : 'Belum Diambil'}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 6. Progres Jasa Konstruksi */}
                      <td className="py-3 px-2.5 text-center align-middle">
                        {(() => {
                          const woJasaList = getWoJasaItems(wo);
                          const jasaProg = wo.progressJasa !== undefined ? wo.progressJasa : calculateJasaProgress(woJasaList);
                          const completedJasaItems = woJasaList.filter((j) => (j.progresPersen || 0) >= 100).length;
                          const pendingProg = wo.pendingJasaItems ? calculateJasaProgress(wo.pendingJasaItems) : null;
                          const isPending = wo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS';
                          const isApproved = wo.progressStatus === 'DISETUJUI';
                          const isRejected = wo.progressStatus === 'DITOLAK';

                          return (
                            <div className="flex flex-col items-center gap-1 w-28 mx-auto">
                              <span className={`text-[13px] font-black tabular-nums ${jasaProg === 100 ? 'text-emerald-600' : jasaProg > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                {jasaProg}%
                              </span>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${jasaProg === 100 ? 'bg-emerald-500' : jasaProg >= 50 ? 'bg-blue-500' : jasaProg > 0 ? 'bg-amber-400' : 'bg-slate-300'}`}
                                  style={{ width: `${jasaProg}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-500 font-medium tabular-nums">
                                {completedJasaItems}/{woJasaList.length} Selesai
                              </span>

                              {isPending && (
                                <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse mt-0.5" title="Vendor mengajukan progres baru">
                                  🟡 Vendor Lapor {pendingProg}%
                                </span>
                              )}
                              {isApproved && (
                                <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mt-0.5">
                                  ✓ Terverifikasi
                                </span>
                              )}
                              {isRejected && (
                                <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200 mt-0.5">
                                  ✗ Ditolak
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 6. Retur Sisa Gudang */}
                      <td className="py-3 px-2.5 text-center align-top">
                        {(() => {
                          const mats = wo.materials || [];
                          const returnedItems = mats.filter((m) => (m.qtyReturned || 0) > 0);
                          const isReported = Boolean(wo.vendorRealizationSubmitted);
                          const isAcknowledged = Boolean(wo.pengawasRealizationVerified);

                          if (isReported) {
                            if (returnedItems.length > 0) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenVerifRealization(wo)}
                                  className={`inline-flex flex-col items-center px-2 py-1 rounded-lg border text-left cursor-pointer transition ${
                                    isAcknowledged
                                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                      : 'bg-amber-50 border-amber-300 hover:bg-amber-100 shadow-2xs animate-pulse'
                                  }`}
                                  title="Klik untuk melihat rincian sisa material yang diretur ke gudang"
                                >
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 whitespace-nowrap">
                                    <RotateCcw className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>{returnedItems.length} Item Diretur</span>
                                  </span>
                                  <span className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap">
                                    {isAcknowledged ? '✓ Telah Diketahui' : '⚠️ Perlu Dilihat'}
                                  </span>
                                </button>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => handleOpenVerifRealization(wo)}
                                className="inline-flex flex-col items-center px-2 py-1 rounded-lg border bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-left cursor-pointer transition"
                                title="Vendor melaporkan seluruh material terpasang (Nihil Retur)"
                              >
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Nihil Retur</span>
                                </span>
                                <span className="text-[9px] text-emerald-700 mt-0.5 whitespace-nowrap">100% Terpasang</span>
                              </button>
                            );
                          }

                          return <span className="text-slate-300 text-[11px]">—</span>;
                        })()}
                      </td>

                      {/* 7. Aksi Pengawas */}
                      <td className="py-3 px-2.5 text-center align-top">
                        <div className="flex flex-col gap-1.5 items-center justify-center max-w-[150px] mx-auto">
                          {/* Tombol 1: Verifikasi Surat Jalan (Hanya ada jika vendor sudah upload/konfirmasi SJ) */}
                          {hasSj ? (
                            sjVerified ? (
                              <button
                                type="button"
                                onClick={() => handleOpenVerifSj(wo)}
                                className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer whitespace-nowrap"
                                title="Surat Jalan telah diverifikasi. Klik untuk melihat atau mengubah data."
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>SJ Sesuai ✓</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenVerifSj(wo)}
                                className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer whitespace-nowrap"
                                title="Vendor telah mengunggah Surat Jalan. Klik untuk verifikasi kesesuaian fisik lapangan."
                              >
                                <FileCheck2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Verifikasi SJ</span>
                              </button>
                            )
                          ) : (
                            <div
                              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-[10px] font-medium flex items-center justify-center gap-1 cursor-default select-none"
                              title="Aksi verifikasi belum tersedia karena vendor belum mengunggah Surat Jalan / konfirmasi pengambilan material dari gudang"
                            >
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Belum Upload SJ</span>
                            </div>
                          )}

                          {/* Tombol 2: Update / Verifikasi Progres % */}
                          {wo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProgressModal(wo)}
                              className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer whitespace-nowrap animate-pulse"
                              title={`Vendor ${wo.vendor} telah mengajukan progres. Klik untuk verifikasi.`}
                            >
                              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                              <span>Verif Progres Vendor</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenProgressModal(wo)}
                              className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                              <span>Update Progres %</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 1: VERIFIKASI SURAT JALAN MATERIAL KELUAR */}
      {/* ---------------------------------------------------------------------- */}
      {verifSjWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Verifikasi Surat Jalan (Material Diterima Lapangan): {verifSjWo.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pelanggan: <b className="text-slate-800">{verifSjWo.customerName}</b> | Vendor: <b className="text-slate-800">{verifSjWo.vendor}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifSjWo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Info Surat Jalan Vendor (Sesuai Data Asli Vendor Termasuk No Reservasi & No GI) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Nomor Surat Jalan:</span>
                  <span className="font-bold font-mono text-slate-800 text-sm truncate block" title={verifSjWo.suratJalanNumber}>
                    {verifSjWo.suratJalanNumber || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Nomor Reservasi:</span>
                  <span className="font-bold font-mono text-slate-800 truncate block" title={verifSjWo.reservationNumber}>
                    {verifSjWo.reservationNumber || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Nomor GI (Goods Issue):</span>
                  <span className="font-bold font-mono text-indigo-700 truncate block" title={verifSjWo.giNumber}>
                    {verifSjWo.giNumber || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Nomor SPK:</span>
                  <span className="font-bold font-mono text-slate-800 truncate block" title={verifSjWo.spkNumber}>
                    {verifSjWo.spkNumber || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Tanggal Pengambilan / SJ:</span>
                  <span className="font-bold text-slate-800">
                    {verifSjWo.suratJalanDate || verifSjWo.vendorReceiptDate || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Vendor Pelaksana:</span>
                  <span className="font-bold text-slate-800 truncate block" title={verifSjWo.vendor}>
                    {verifSjWo.vendor}
                  </span>
                </div>
              </div>

              {/* Catatan Vendor & Lampiran Berkas (Surat Jalan & Bukti Penerimaan) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/80 text-xs flex flex-col justify-between">
                  <div>
                    <span className="text-blue-800 block font-bold mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Catatan Penerimaan / Pengambilan dari Vendor:
                    </span>
                    <p className="text-slate-700 italic">
                      &quot;{verifSjWo.vendorReceiptNotes || 'Material diambil dari gudang sesuai alokasi Surat Jalan.'}&quot;
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Pengawas Pemeriksa:</span>
                    <input
                      type="text"
                      value={verifSjOfficer}
                      onChange={(e) => setVerifSjOfficer(e.target.value)}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 1. Berkas Lampiran Surat Jalan Vendor */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Foto Surat Jalan</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {(() => {
                          const list = verifSjWo.suratJalanPhotos && verifSjWo.suratJalanPhotos.length > 0
                            ? verifSjWo.suratJalanPhotos
                            : (verifSjWo.suratJalanPhoto ? [verifSjWo.suratJalanPhoto] : []);
                          return `${list.length} File`;
                        })()}
                      </span>
                    </div>

                    {(() => {
                      const list = verifSjWo.suratJalanPhotos && verifSjWo.suratJalanPhotos.length > 0
                        ? verifSjWo.suratJalanPhotos
                        : (verifSjWo.suratJalanPhoto ? [verifSjWo.suratJalanPhoto] : []);
                      if (list.length === 0) {
                        return <p className="text-[11px] text-slate-400 italic">Tidak ada foto fisik SJ</p>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {list.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`SJ ${idx + 1}`}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-300 shadow-2xs cursor-pointer hover:opacity-90"
                              onClick={() => setPreviewPhotoModal(url)}
                              title={`Klik perbesar Surat Jalan #${idx + 1}`}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {(() => {
                    const list = verifSjWo.suratJalanPhotos && verifSjWo.suratJalanPhotos.length > 0
                      ? verifSjWo.suratJalanPhotos
                      : (verifSjWo.suratJalanPhoto ? [verifSjWo.suratJalanPhoto] : []);
                    if (list.length > 0) {
                      return (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoModal(list[0])}
                          className="mt-2 text-center py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-blue-700 cursor-pointer"
                        >
                          Perbesar Surat Jalan
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* 2. Berkas Lampiran Bukti Penerimaan Material */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        <span>Bukti Penerimaan Material</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {(verifSjWo.receiptPhotos || []).length} File
                      </span>
                    </div>

                    {(() => {
                      const list = verifSjWo.receiptPhotos || [];
                      if (list.length === 0) {
                        return <p className="text-[11px] text-slate-400 italic">Tidak ada foto bukti serah terima</p>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {list.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Bukti ${idx + 1}`}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-300 shadow-2xs cursor-pointer hover:opacity-90"
                              onClick={() => setPreviewPhotoModal(url)}
                              title={`Klik perbesar Bukti Terima #${idx + 1}`}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {(() => {
                    const list = verifSjWo.receiptPhotos || [];
                    if (list.length > 0) {
                      return (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoModal(list[0])}
                          className="mt-2 text-center py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-blue-700 cursor-pointer"
                        >
                          Perbesar Bukti Terima
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Tabel Ceklis Material */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Uraian Material</th>
                      <th className="py-2.5 px-3 text-center">Alokasi SPK</th>
                      <th className="py-2.5 px-3 text-center">Klaim SJ Vendor</th>
                      <th className="py-2.5 px-3 text-center w-28">Fisik Diterima Lapangan</th>
                      <th className="py-2.5 px-3">Catatan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verifSjMaterials.map((it, idx) => {
                      const isSelisih = it.qtyTaken !== it.qtyAllocated;
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/50 ${isSelisih ? 'bg-amber-50/30' : ''}`}>
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {it.material}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                            {it.qtyAllocated} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700 font-mono">
                            {it.qtyVendorClaim} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={it.qtyTaken}
                              onChange={(e) => handleUpdateVerifSjQty(idx, e.target.value)}
                              className={`w-20 px-2 py-1 text-xs text-center font-bold rounded-lg border focus:outline-none focus:ring-2 ${
                                isSelisih
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 focus:ring-amber-500/20'
                                  : 'bg-white border-slate-300 text-slate-800 focus:ring-blue-500/20'
                              }`}
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={it.note}
                              onChange={(e) => handleUpdateVerifSjNote(idx, e.target.value)}
                              placeholder="Kondisi material (baik / cacat)..."
                              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Catatan Umum Verifikasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Berita Acara Penerimaan Material Lapangan
                </label>
                <textarea
                  rows={2}
                  value={verifSjNotes}
                  onChange={(e) => setVerifSjNotes(e.target.value)}
                  placeholder="Catatan pengawas mengenai fisik material saat tiba di lokasi proyek..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setVerifSjWo(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveVerifSj}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Hasil Verifikasi SJ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2: UPDATE PROGRES JASA LAPANGAN BERBASIS KELOMPOK JASA WO */}
      {/* ---------------------------------------------------------------------- */}
      {progressWo && (() => {
        const totalRencanaRp = progressJasaItems.reduce((acc, it) => acc + (it.qtyTarget * (it.hargaSatuan || 0)), 0);
        const totalRealisasiRp = progressJasaItems.reduce((acc, it) => acc + ((it.qtyRealisasi || 0) * (it.hargaSatuan || 0)), 0);
        
        // Deteksi Item Overrun (> Rencana) & Underrun (< Rencana)
        const overrunItems = progressJasaItems.filter((it) => (it.qtyRealisasi || 0) > it.qtyTarget);
        const underrunItems = progressJasaItems.filter((it) => (it.qtyRealisasi || 0) > 0 && (it.qtyRealisasi || 0) < it.qtyTarget);
        const exactItems = progressJasaItems.filter((it) => (it.qtyRealisasi || 0) === it.qtyTarget && it.qtyTarget > 0);

        // Kelompokkan item berdasarkan subKategori
        const subKategoriList: string[] = [];
        const groupedMap = new Map<string, { item: WoJasaItem; originalIndex: number }[]>();
        
        progressJasaItems.forEach((item, originalIndex) => {
          const sub = item.subKategori || 'KELOMPOK JASA';
          if (!groupedMap.has(sub)) {
            groupedMap.set(sub, []);
            subKategoriList.push(sub);
          }
          groupedMap.get(sub)!.push({ item, originalIndex });
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Modal */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 rounded-t-2xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        Update Progres Jasa Konstruksi Lapangan
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        progressWo.category === 'WO Paket 1'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : progressWo.category === 'WO Paket 2'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {progressWo.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No. WO: <b className="text-slate-800 font-mono">{progressWo.id}</b> • SPK: <b className="text-slate-800 font-mono">{progressWo.spkNumber || '-'}</b> • Vendor: <b className="text-slate-800">{progressWo.vendor}</b> • Pelanggan: <b className="text-slate-800">{progressWo.customerName}</b>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProgressWo(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Modal */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Banner Pengajuan Vendor yang Menunggu Verifikasi */}
                {progressWo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS' && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-950 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-amber-950 text-sm">
                          Laporan Progres dari Rekanan Vendor: {progressWo.vendor}
                        </span>
                        {progressWo.progressSubmittedAt && (
                          <span className="text-[10px] text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full font-mono">
                            Diajukan: {new Date(progressWo.progressSubmittedAt).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-amber-900 leading-relaxed">
                        Vendor telah mengisi volume realisasi fisik di bawah ini. Sebagai Pengawas Lapangan, silakan periksa kesesuaian fisik pekerjaan. Anda dapat mengoreksi volume jika ada yang belum sesuai, lalu klik <b>Setujui & Sahkan Progres</b> atau <b>Tolak Pengajuan</b> jika diperlukan revisi oleh vendor.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Kesiapan Material Gudang & Quick Action Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs">
                  {(() => {
                    const matProg = calculateMaterialProgress(progressWo);
                    return (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Package className={`w-4 h-4 shrink-0 ${matProg === 100 ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span>
                          Status Pasokan Material:{' '}
                          <b className={matProg === 100 ? 'text-emerald-700' : 'text-amber-700'}>
                            {matProg}%
                          </b>{' '}
                          {matProg === 100 ? '(Material Lengkap Diambil Vendor)' : '(Dalam Proses Gudang)'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Tombol Aksi Cepat / Shortcut Masal */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSetAll100Percent}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Set semua volume realisasi sama dengan target rencana (100%)"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Set Realisasi 100% Semua</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Reset semua volume realisasi ke 0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset 0%</span>
                    </button>
                  </div>
                </div>

                {/* Warning Alert Banner jika Terdeteksi Volume Lebih (Overrun) */}
                {overrunItems.length > 0 && (
                  <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        <span>⚠️ Terdeteksi Volume Tambah (Overrun) pada {overrunItems.length} item pekerjaan</span>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] bg-amber-200 text-amber-950 font-bold font-mono">
                          Selisih: +Rp {(totalRealisasiRp - totalRencanaRp > 0 ? totalRealisasiRp - totalRencanaRp : 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Sesuai ketentuan KHS PLN, selisih volume fisik lebih ini memerlukan dokumen <b>Justifikasi Teknis (Justek) Lapangan</b> dan persetujuan <b>Addendum WO</b> sebelum dapat disahkan untuk penagihan / pembayaran vendor.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabel Kelompok Jasa yang Ada di Isian WO */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Isian Kelompok Jasa Pekerjaan (Sesuai Dokumen WO / RAB Kontrak)
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                        {progressJasaItems.length} Item Jasa
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Input <b className="text-slate-800">Volume Realisasi</b> fisik lapangan untuk menghitung capaian progres jasa
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#f8fafc] text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3 min-w-[240px]">Uraian Item Kelompok Jasa</th>
                          <th className="py-2.5 px-3 text-center w-24">Satuan</th>
                          <th className="py-2.5 px-3 text-right w-32">Harga Satuan</th>
                          <th className="py-2.5 px-3 text-center w-32 bg-blue-50/40">Vol. Rencana (WO)</th>
                          <th className="py-2.5 px-3 text-center min-w-[190px] bg-amber-50/40">Vol. Realisasi (Fisik)</th>
                          <th className="py-2.5 px-3 text-right w-36">Nilai Realisasi (Rp)</th>
                          <th className="py-2.5 px-3 text-center w-28">Status & Capaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subKategoriList.map((subKatName) => {
                          const itemsInGroup = groupedMap.get(subKatName) || [];
                          return (
                            <React.Fragment key={subKatName}>
                              {/* Sub Header Kategori (Mirip Dokumen WO PLN) */}
                              <tr className="bg-slate-100/90 border-y border-slate-200">
                                <td colSpan={8} className="py-2 px-3">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                                    <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{subKatName}</span>
                                    <span className="text-[9.5px] text-slate-500 font-normal ml-1">
                                      ({itemsInGroup.length} item pekerjaan)
                                    </span>
                                  </div>
                                </td>
                              </tr>

                              {itemsInGroup.map(({ item, originalIndex }) => {
                                const rQty = item.qtyRealisasi !== undefined ? item.qtyRealisasi : 0;
                                const pct = item.qtyTarget > 0 ? Math.round((rQty / item.qtyTarget) * 100) : (rQty > 0 ? 100 : 0);
                                const isOver = rQty > item.qtyTarget;
                                const isExact = rQty === item.qtyTarget && item.qtyTarget > 0;
                                const isUnder = rQty > 0 && rQty < item.qtyTarget;
                                const isZero = rQty === 0;

                                const itemHarga = item.hargaSatuan || 0;
                                const nilaiRencana = item.qtyTarget * itemHarga;
                                const nilaiRealisasi = rQty * itemHarga;
                                const selisihNilai = nilaiRealisasi - nilaiRencana;

                                return (
                                  <tr 
                                    key={originalIndex} 
                                    className={`hover:bg-blue-50/30 transition-colors ${
                                      isOver 
                                        ? 'bg-amber-50/30' 
                                        : isExact 
                                        ? 'bg-emerald-50/20' 
                                        : isUnder 
                                        ? 'bg-blue-50/20' 
                                        : ''
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] align-middle">
                                      {originalIndex + 1}
                                    </td>
                                    <td className="py-2.5 px-3 align-middle">
                                      <div className="font-semibold text-slate-900 leading-snug">
                                        {item.deskripsi}
                                      </div>
                                      {item.kode && (
                                        <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                                          Kode: {item.kode}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-medium text-slate-600 align-middle">
                                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10.5px]">
                                        {item.unit}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 text-[11px] align-middle">
                                      Rp {itemHarga.toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-bold text-slate-800 bg-blue-50/20 font-mono align-middle">
                                      <span className="text-xs">{item.qtyTarget}</span>{' '}
                                      <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center bg-amber-50/20 align-middle">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <input
                                          type="number"
                                          min={0}
                                          max={item.qtyTarget * 2.5}
                                          step="any"
                                          value={rQty}
                                          onChange={(e) => handleUpdateItemRealisasi(originalIndex, parseFloat(e.target.value) || 0)}
                                          className={`w-24 px-2 py-1 text-xs text-center font-bold bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono transition ${
                                            isOver
                                              ? 'border-amber-400 text-amber-900 bg-amber-50/40 ring-1 ring-amber-300'
                                              : isExact 
                                              ? 'border-emerald-400 text-emerald-800 bg-emerald-50/30' 
                                              : isUnder
                                              ? 'border-blue-400 text-blue-900 bg-blue-50/30' 
                                              : 'border-slate-300 text-slate-700'
                                          }`}
                                        />
                                        <span className="text-[10.5px] text-slate-500 font-medium">{item.unit}</span>
                                      </div>
                                      {/* Shortcut Chips: 0%, 50%, 100% */}
                                      <div className="flex items-center justify-center gap-1 mt-1">
                                        <button
                                          type="button"
                                          onClick={() => handleSetItemPercent(originalIndex, 0)}
                                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                            isZero ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                          }`}
                                        >
                                          0%
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetItemPercent(originalIndex, 50)}
                                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                            pct === 50 ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                          }`}
                                        >
                                          50%
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetItemPercent(originalIndex, 100)}
                                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                            isExact ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                          }`}
                                        >
                                          100%
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-right align-middle font-mono">
                                      <div className={`font-bold text-[11px] ${
                                        isOver ? 'text-amber-700' : isExact ? 'text-emerald-700' : isUnder ? 'text-blue-700' : 'text-slate-500'
                                      }`}>
                                        Rp {nilaiRealisasi.toLocaleString('id-ID')}
                                      </div>
                                      <div className="text-[9.5px] text-slate-400">
                                        Target: Rp {nilaiRencana.toLocaleString('id-ID')}
                                      </div>
                                      {isOver && (
                                        <div className="text-[9px] font-bold text-amber-700 font-mono mt-0.5">
                                          +Rp {selisihNilai.toLocaleString('id-ID')} (Lebih)
                                        </div>
                                      )}
                                      {isUnder && (
                                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                          -Rp {Math.abs(selisihNilai).toLocaleString('id-ID')} (Kurang)
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-center align-middle">
                                      {isOver ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs whitespace-nowrap" title="Volume fisik lapangan melebihi target rencana (Memerlukan Justek)">
                                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                          <span>{pct}% (Over)</span>
                                        </span>
                                      ) : isExact ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                                          <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                          <span>100% Sesuai</span>
                                        </span>
                                      ) : isUnder ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs whitespace-nowrap">
                                          <span>{pct}% (Proses)</span>
                                        </span>
                                      ) : (
                                        <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono bg-slate-100 text-slate-500 whitespace-nowrap">
                                          0%
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ringkasan & Akumulasi Progres Total Jasa */}
                <div className="p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 rounded-2xl border border-blue-200 shadow-2xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-tight">Total Nilai Rencana WO</div>
                      <div className="text-base font-black text-slate-800 font-mono mt-0.5">
                        Rp {totalRencanaRp.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Kelompok Jasa WO</div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <div className="text-[10.5px] font-bold text-blue-700 uppercase tracking-tight">Total Realisasi Fisik Lapangan</div>
                      <div className="text-base font-black text-blue-700 font-mono mt-0.5">
                        Rp {totalRealisasiRp.toLocaleString('id-ID')}
                      </div>
                      {totalRealisasiRp > totalRencanaRp ? (
                        <div className="text-[10px] text-amber-700 font-bold mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Lebih: +Rp {(totalRealisasiRp - totalRencanaRp).toLocaleString('id-ID')} (Butuh Addendum)</span>
                        </div>
                      ) : totalRealisasiRp === totalRencanaRp && totalRencanaRp > 0 ? (
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Tepat 100% Sesuai Rencana WO</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-blue-500 mt-0.5">
                          Tercapai {progressVal}% dari rencana
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="text-[10.5px] font-bold text-indigo-700 uppercase tracking-tight">Akumulasi Progres Fisik</div>
                        <div className="text-2xl font-black text-blue-700 font-mono mt-0.5">{progressVal}%</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono shadow-2xs ${
                        progressVal > 100 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : progressVal === 100 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : progressVal >= 50 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                          : progressVal > 0 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {progressVal > 100 
                          ? `⚠️ OVERRUN (${progressVal}%)` 
                          : progressVal === 100 
                          ? '✓ TUNTAS 100%' 
                          : progressVal > 0 
                          ? 'DALAM PROSES' 
                          : 'BELUM MULAI'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-950">
                      <span>Akumulasi Capaian Jasa Fisik Lapangan</span>
                      <span className="font-mono">
                        {progressVal}% {progressVal > 100 ? '(Fisik > Target Kontrak)' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200/60 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progressVal > 100 ? 'bg-amber-500' : progressVal === 100 ? 'bg-emerald-500' : progressVal >= 50 ? 'bg-blue-600' : progressVal > 0 ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.min(100, progressVal)}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-500 italic">
                    ℹ️ *Ketentuan KHS PLN: Realisasi Kurang (Underrun) akan disahkan pada Berita Acara Rekonsiliasi Akhir (PLN hanya membayar fisik yang terpasang). Sedangkan Realisasi Lebih (Overrun) memerlukan dokumen Justifikasi Teknis (Justek) & Addendum WO untuk pengesahan penagihan.
                  </p>
                </div>

                {/* Catatan Lapangan / Kendala */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Pekerjaan / Kendala di Lapangan (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder="Contoh: Pekerjaan pondasi dan travers telah tuntas, penarikan kabel A3CS berlanjut besok..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => setProgressWo(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>

                {progressWo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenRejectModal}
                      className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <X className="w-4 h-4 text-rose-600" />
                      <span>Tolak (Minta Revisi Vendor)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveProgressVendor}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui & Sahkan Progres ({progressVal}%)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveProgress}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Progres Jasa ({progressVal}%)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dialog Konfirmasi Tolak Pengajuan Progres Vendor */}
      {rejectModalWo && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">Tolak Pengajuan Progres Vendor</h4>
                <p className="text-xs text-slate-500">WO: <span className="font-mono font-bold text-slate-700">{rejectModalWo.id}</span> • Vendor: {rejectModalWo.vendor}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alasan Penolakan / Catatan Revisi untuk Vendor:
              </label>
              <textarea
                rows={3}
                required
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Contoh: Volume penarikan kawat A3CS baru terpasang 1 gawang di lapangan, mohon sesuaikan volume sebelum diajukan kembali..."
                className="w-full p-3 text-xs border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRejectModalWo(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Kirim Penolakan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 3: DETAIL LAPORAN RETUR SISA MATERIAL GUDANG */}
      {/* ---------------------------------------------------------------------- */}
      {verifRealizationWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-50/60 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Laporan Retur Sisa Material ke Gudang
                  </h3>
                  <p className="text-xs text-slate-500">
                    WO: <b className="text-slate-800 font-mono">{verifRealizationWo.id}</b> | Vendor: <b className="text-slate-800">{verifRealizationWo.vendor}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifRealizationWo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Pelanggan:</span>
                  <span className="font-bold text-slate-800">{verifRealizationWo.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Waktu Lapor Vendor:</span>
                  <span className="font-bold text-slate-800">{verifRealizationWo.vendorRealizationDate || 'Baru Saja'}</span>
                </div>
                <div className="md:col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block font-medium">Catatan / Bukti Serah Terima Vendor:</span>
                  <p className="text-slate-700 italic mt-0.5">
                    "{verifRealizationWo.vendorRealizationNotes || 'Tidak ada catatan khusus dari vendor.'}"
                  </p>
                </div>
              </div>

              {/* Rincian Material */}
              {(() => {
                const returnedList = verifRealizationItems.filter((it) => it.qtyReturned > 0);
                const hasAnyRetur = returnedList.length > 0;

                if (!hasAnyRetur) {
                  return (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-emerald-900">
                          Seluruh Material Habis Terpasang (Nihil Retur)
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          Vendor mengonfirmasi bahwa 100% material yang diambil dari gudang telah terpasang di lapangan tanpa ada barang sisa yang dikembalikan.
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Daftar Sisa Material yang Diretur ke Gudang ({returnedList.length} Item)</span>
                      </span>
                      <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Wajib Masuk Gudang PLN
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3 w-10 text-center">No</th>
                            <th className="py-2 px-3">Nama Material</th>
                            <th className="py-2 px-3 text-center">Qty Diambil</th>
                            <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-800">Terpasang</th>
                            <th className="py-2 px-3 text-center bg-rose-50 text-rose-800">Diretur ke Gudang</th>
                            <th className="py-2 px-3">Keterangan / Kondisi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {verifRealizationItems.map((it, idx) => (
                            <tr key={idx} className={it.qtyReturned > 0 ? 'bg-amber-50/40 font-medium' : 'text-slate-500'}>
                              <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{it.material}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-700">
                                {it.qtyTaken} {it.unit}
                              </td>
                              <td className="py-2 px-3 text-center text-emerald-700 font-bold">
                                {it.qtyInstalled} {it.unit}
                              </td>
                              <td className="py-2 px-3 text-center text-rose-700 font-bold">
                                {it.qtyReturned > 0 ? (
                                  <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-300">
                                    {it.qtyReturned} {it.unit}
                                  </span>
                                ) : (
                                  '0'
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {it.note || (it.qtyReturned > 0 ? 'Sisa dikembalikan' : 'Terpasang penuh')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Catatan Tambahan Pengawas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Pengawas (Opsional):
                </label>
                <input
                  type="text"
                  value={verifRealizationNotes}
                  onChange={(e) => setVerifRealizationNotes(e.target.value)}
                  placeholder="Contoh: Sisa material telah diverifikasi fisik dan diserahterimakan ke gudang UP3..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setVerifRealizationWo(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleSaveRealization}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {verifRealizationWo.pengawasRealizationVerified ? 'Perbarui Konfirmasi' : '✓ Tandai Telah Diketahui Pengawas'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 4: PREVIEW FOTO SURAT JALAN VENDOR */}
      {/* ---------------------------------------------------------------------- */}
      {previewPhotoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Foto Fisik Surat Jalan Vendor</h3>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              <img
                src={previewPhotoModal}
                alt="Surat Jalan Vendor"
                className="max-h-[65vh] object-contain rounded-lg shadow-xs"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
