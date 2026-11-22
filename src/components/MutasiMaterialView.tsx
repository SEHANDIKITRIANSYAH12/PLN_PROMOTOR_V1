'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Boxes,
  Building2,
  Calendar,
  Edit3,
  X,
  Database,
  Check,
  AlertCircle,
  PackageMinus,
  PackagePlus,
  FileCheck2,
  Camera,
  Eye,
  XCircle,
  FileText,
  RotateCcw
} from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { WorkOrderRecord } from '@/types';

export const MutasiMaterialView: React.FC = () => {
  const {
    workOrders,
    updateWoGiInfo,
    adminGudangApproveRetur,
    adminGudangRejectRetur,
    currentUser,
    currentRole
  } = usePromotorStore();

  // 1. Main Navigation: 2 TAB UTAMA (Barang Keluar vs Barang Masuk)
  const [mainTab, setMainTab] = useState<'KELUAR' | 'MASUK'>('KELUAR');

  // Sub-filter state per tab
  const [subTabKeluar, setSubTabKeluar] = useState<'ALL' | 'BELUM_GI' | 'SISTEM' | 'NON_SISTEM'>('ALL');
  const [subTabMasuk, setSubTabMasuk] = useState<'ALL' | 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK'>('ALL');

  // Search & Vendor dropdown
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');

  // Modal 1: Input / Edit GI SAP (Barang Keluar)
  const [editingWo, setEditingWo] = useState<WorkOrderRecord | null>(null);
  const [giNumberInput, setGiNumberInput] = useState('');
  const [giStatusInput, setGiStatusInput] = useState<'Sistem' | 'Non-Sistem'>('Sistem');
  const [giCatatanInput, setGiCatatanInput] = useState('');

  // Modal 2: Verifikasi / Detail Retur Gudang (Barang Masuk)
  const [returModalWo, setReturModalWo] = useState<WorkOrderRecord | null>(null);
  const [returActionNotes, setReturActionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Modal 3: Foto Viewer Lightbox
  const [viewPhoto, setViewPhoto] = useState<{ url: string; title: string } | null>(null);

  // ==========================================
  // DATA POOL: BARANG KELUAR
  // WO yang sudah ada reservasi fisik, surat jalan, atau material diambil
  // ==========================================
  const mutasiKeluarWos = useMemo(() => {
    return workOrders.filter((wo) => {
      const hasReservation = Boolean(
        wo.reservationNumber ||
        wo.reservationDate ||
        wo.reservationStatus === 'Siap Ambil' ||
        wo.reservationStatus === 'Selesai'
      );
      const hasSj = Boolean(wo.suratJalanNumber || wo.vendorReceiptConfirmed);
      const hasMaterialsTaken = (wo.materials || []).some((m) => (m.qtyTaken || 0) > 0);
      return hasReservation || hasSj || hasMaterialsTaken;
    });
  }, [workOrders]);

  // Statistik Barang Keluar
  const statsKeluar = useMemo(() => {
    const total = mutasiKeluarWos.length;
    const sudahGiCount = mutasiKeluarWos.filter((w) => Boolean(w.giNumber?.trim())).length;
    const belumGiCount = mutasiKeluarWos.filter((w) => !w.giNumber?.trim()).length;
    const sistemCount = mutasiKeluarWos.filter((w) => w.giStatus === 'Sistem').length;
    const nonSistemCount = mutasiKeluarWos.filter(
      (w) => w.giStatus === 'Non-Sistem' || (!w.giStatus && !w.giNumber?.trim())
    ).length;

    const totalItemKeluar = mutasiKeluarWos.reduce((acc, wo) => {
      const takenCount = (wo.materials || []).reduce(
        (sum, m) => sum + (m.qtyTaken || m.qtyReserved || 0),
        0
      );
      return acc + takenCount;
    }, 0);

    return {
      total,
      sudahGiCount,
      belumGiCount,
      sistemCount,
      nonSistemCount,
      totalItemKeluar,
    };
  }, [mutasiKeluarWos]);

  // ==========================================
  // DATA POOL: BARANG MASUK (RETUR)
  // WO yang memiliki sisa material diretur, status retur, atau berkas slip retur
  // ==========================================
  const mutasiMasukWos = useMemo(() => {
    return workOrders.filter((wo) => {
      const hasReturnedMaterials = (wo.materials || []).some((m) => (m.qtyReturned || 0) > 0);
      const hasReturStatus = Boolean(wo.returStatus);
      const hasSlipRetur = Boolean(wo.slipReturNumber);
      return hasReturnedMaterials || hasReturStatus || hasSlipRetur;
    });
  }, [workOrders]);

  // Statistik Barang Masuk (Retur)
  const statsMasuk = useMemo(() => {
    const total = mutasiMasukWos.length;
    const menungguCount = mutasiMasukWos.filter(
      (w) => w.returStatus === 'MENUNGGU_VERIFIKASI_GUDANG'
    ).length;
    const disetujuiCount = mutasiMasukWos.filter(
      (w) => w.returStatus === 'RETUR_DISETUJUI'
    ).length;
    const ditolakCount = mutasiMasukWos.filter(
      (w) => w.returStatus === 'RETUR_DITOLAK'
    ).length;

    const totalItemRetur = mutasiMasukWos.reduce((acc, wo) => {
      const retCount = (wo.materials || []).reduce(
        (sum, m) => sum + (m.qtyReturned || 0),
        0
      );
      return acc + retCount;
    }, 0);

    return {
      total,
      menungguCount,
      disetujuiCount,
      ditolakCount,
      totalItemRetur,
    };
  }, [mutasiMasukWos]);

  // Daftar Vendor (gabungan dari kedua tab)
  const vendorList = useMemo(() => {
    const setV = new Set<string>();
    const pool = mainTab === 'KELUAR' ? mutasiKeluarWos : mutasiMasukWos;
    pool.forEach((w) => {
      if (w.vendor) setV.add(w.vendor);
    });
    return Array.from(setV);
  }, [mainTab, mutasiKeluarWos, mutasiMasukWos]);

  // ==========================================
  // FILTERED ROWS UNTUK MASING-MASING TAB
  // ==========================================
  const filteredKeluarRows = useMemo(() => {
    return mutasiKeluarWos.filter((wo) => {
      const hasGi = Boolean(wo.giNumber?.trim());
      const isSistem = wo.giStatus === 'Sistem';
      const isNonSistem = wo.giStatus === 'Non-Sistem' || (!wo.giStatus && !hasGi);

      if (subTabKeluar === 'BELUM_GI' && hasGi) return false;
      if (subTabKeluar === 'SISTEM' && !isSistem) return false;
      if (subTabKeluar === 'NON_SISTEM' && !isNonSistem) return false;

      if (selectedVendor !== 'ALL' && wo.vendor !== selectedVendor) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchWo = wo.id.toLowerCase().includes(q);
        const matchSpk = (wo.spkNumber || '').toLowerCase().includes(q);
        const matchCust = (wo.customerName || '').toLowerCase().includes(q);
        const matchVendor = (wo.vendor || '').toLowerCase().includes(q);
        const matchRes = (wo.reservationNumber || '').toLowerCase().includes(q);
        const matchSj = (wo.suratJalanNumber || '').toLowerCase().includes(q);
        const matchGi = (wo.giNumber || '').toLowerCase().includes(q);
        if (!matchWo && !matchSpk && !matchCust && !matchVendor && !matchRes && !matchSj && !matchGi) {
          return false;
        }
      }
      return true;
    });
  }, [mutasiKeluarWos, subTabKeluar, selectedVendor, searchTerm]);

  const filteredMasukRows = useMemo(() => {
    return mutasiMasukWos.filter((wo) => {
      if (subTabMasuk === 'MENUNGGU' && wo.returStatus !== 'MENUNGGU_VERIFIKASI_GUDANG') return false;
      if (subTabMasuk === 'DISETUJUI' && wo.returStatus !== 'RETUR_DISETUJUI') return false;
      if (subTabMasuk === 'DITOLAK' && wo.returStatus !== 'RETUR_DITOLAK') return false;

      if (selectedVendor !== 'ALL' && wo.vendor !== selectedVendor) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchWo = wo.id.toLowerCase().includes(q);
        const matchSpk = (wo.spkNumber || '').toLowerCase().includes(q);
        const matchCust = (wo.customerName || '').toLowerCase().includes(q);
        const matchVendor = (wo.vendor || '').toLowerCase().includes(q);
        const matchSlip = (wo.slipReturNumber || '').toLowerCase().includes(q);
        const matchNotes = (wo.returNotes || '').toLowerCase().includes(q);
        if (!matchWo && !matchSpk && !matchCust && !matchVendor && !matchSlip && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [mutasiMasukWos, subTabMasuk, selectedVendor, searchTerm]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleOpenEditGi = (wo: WorkOrderRecord) => {
    setEditingWo(wo);
    setGiNumberInput(wo.giNumber || '');
    setGiStatusInput(wo.giStatus || (wo.giNumber ? 'Sistem' : 'Non-Sistem'));
    setGiCatatanInput(wo.giCatatan || '');
  };

  const handleSaveGi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWo) return;

    updateWoGiInfo(
      editingWo.id,
      giNumberInput,
      giStatusInput,
      giCatatanInput,
      currentUser?.name || 'Admin Gudang UP3'
    );
    setEditingWo(null);
  };

  const handleOpenReturModal = (wo: WorkOrderRecord) => {
    setReturModalWo(wo);
    setReturActionNotes(wo.returNotes || '');
    setRejectReason(wo.returRejectionReason || '');
    setIsRejecting(false);
  };

  const handleApproveRetur = () => {
    if (!returModalWo) return;
    const adminName = currentUser?.name || 'Admin Gudang UP3';
    adminGudangApproveRetur(returModalWo.id, adminName, returActionNotes);
    setReturModalWo(null);
  };

  const handleRejectRetur = () => {
    if (!returModalWo) return;
    if (!rejectReason.trim()) {
      alert('Mohon cantumkan alasan penolakan retur material.');
      return;
    }
    const adminName = currentUser?.name || 'Admin Gudang UP3';
    adminGudangRejectRetur(returModalWo.id, adminName, rejectReason);
    setReturModalWo(null);
  };

  // Cek otorisasi verifikasi gudang (Admin Gudang / Super Admin)
  const canVerifyRetur = currentRole === 'Admin Gudang' || currentRole === 'Super Admin' || !currentRole;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner Dinamis Berdasarkan Tab */}
      <div className={`rounded-2xl p-5 md:p-6 text-white shadow-xl transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        mainTab === 'KELUAR'
          ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900'
          : 'bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl border ${
              mainTab === 'KELUAR'
                ? 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                : 'bg-purple-500/20 border-purple-400/30 text-purple-300'
            }`}>
              {mainTab === 'KELUAR' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              mainTab === 'KELUAR'
                ? 'text-blue-300 bg-blue-500/10 border-blue-400/20'
                : 'text-purple-300 bg-purple-500/10 border-purple-400/20'
            }`}>
              Logistik & Persediaan Gudang UP3
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-black tracking-tight mt-2">
            {mainTab === 'KELUAR'
              ? 'Barang Keluar dari Gudang & Good Issue (GI) SAP'
              : 'Barang Masuk (Retur Material Proyek) ke Gudang'}
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {mainTab === 'KELUAR'
              ? 'Pencatatan pengeluaran fisik material gudang UP3 ke rekanan vendor, verifikasi status Sistem (SAP ERP) vs Non-Sistem (manual), serta monitoring reservasi yang belum diterbitkan Good Issue.'
              : 'Penerimaan fisik sisa material/bongkaran dari vendor berdasarkan Slip Retur TUG-10, verifikasi fisik barang masuk, penambahan stok gudang otomatis, dan berita acara serah terima retur.'}
          </p>
        </div>

        {/* Metric Pill di Header */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl text-right">
            <div className={`text-[10px] uppercase font-bold tracking-wider ${
              mainTab === 'KELUAR' ? 'text-blue-200' : 'text-purple-200'
            }`}>
              {mainTab === 'KELUAR' ? 'Total Item Keluar Fisik' : 'Total Fisik Diretur'}
            </div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {mainTab === 'KELUAR'
                ? statsKeluar.totalItemKeluar.toLocaleString('id-ID')
                : statsMasuk.totalItemRetur.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-normal text-slate-300">unit/mtr</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-TAB SWITCHER (SEGMENTED CONTROL) */}
      <div className="bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setMainTab('KELUAR');
            setSelectedVendor('ALL');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all duration-200 cursor-pointer ${
            mainTab === 'KELUAR'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-500'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <PackageMinus className="w-4 h-4 shrink-0" />
          <span>Barang Keluar dari Gudang (GI SAP)</span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ml-1.5 ${
            mainTab === 'KELUAR' ? 'bg-blue-800 text-blue-100' : 'bg-slate-300 text-slate-800'
          }`}>
            {statsKeluar.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainTab('MASUK');
            setSelectedVendor('ALL');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all duration-200 cursor-pointer ${
            mainTab === 'MASUK'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-500'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <PackagePlus className="w-4 h-4 shrink-0" />
          <span>Barang Masuk (Retur) ke Gudang</span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ml-1.5 ${
            mainTab === 'MASUK' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-300 text-slate-800'
          }`}>
            {statsMasuk.total}
          </span>
          {statsMasuk.menungguCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" title="Ada retur menunggu verifikasi" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* KONTEN TAB 1: BARANG KELUAR DARI GUDANG */}
      {/* ========================================================================= */}
      {mainTab === 'KELUAR' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* KPI Summary Cards Keluar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div
              onClick={() => setSubTabKeluar('ALL')}
              className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                subTabKeluar === 'ALL'
                  ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Total Mutasi Keluar</span>
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-2">{statsKeluar.total}</div>
              <div className="text-[10px] text-slate-500 mt-1">Seluruh WO bermutasi keluar</div>
            </div>

            <div
              onClick={() => setSubTabKeluar('BELUM_GI')}
              className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                subTabKeluar === 'BELUM_GI'
                  ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700">Belum Ada No. GI</span>
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono mt-2">{statsKeluar.belumGiCount}</div>
              <div className="text-[10px] text-rose-600 font-medium mt-1">Perlu diinput nomor GI SAP</div>
            </div>

            <div
              onClick={() => setSubTabKeluar('SISTEM')}
              className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                subTabKeluar === 'SISTEM'
                  ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Status: Sistem (SAP)</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-800 font-mono mt-2">{statsKeluar.sistemCount}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-1">Sudah ter-posting di SAP</div>
            </div>

            <div
              onClick={() => setSubTabKeluar('NON_SISTEM')}
              className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                subTabKeluar === 'NON_SISTEM'
                  ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">Status: Non-Sistem</span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-800 font-mono mt-2">{statsKeluar.nonSistemCount}</div>
              <div className="text-[10px] text-amber-600 font-medium mt-1">Keluar fisik belum posting SAP</div>
            </div>
          </div>

          {/* Filter Bar & Sub-Tabs Keluar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSubTabKeluar('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    subTabKeluar === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Keluar ({statsKeluar.total})
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabKeluar('BELUM_GI')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    subTabKeluar === 'BELUM_GI'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Belum Input GI ({statsKeluar.belumGiCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabKeluar('SISTEM')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    subTabKeluar === 'SISTEM'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sistem ({statsKeluar.sistemCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabKeluar('NON_SISTEM')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    subTabKeluar === 'NON_SISTEM'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Non-Sistem ({statsKeluar.nonSistemCount})</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-800">{filteredKeluarRows.length}</span> dari {statsKeluar.total} pengeluaran
              </div>
            </div>

            {/* Search & Vendor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari No. WO, SPK, Pelanggan, Vendor, No. Reservasi, Surat Jalan, No. GI..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                >
                  <option value="ALL">Semua Vendor Rekanan ({vendorList.length})</option>
                  {vendorList.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabel Barang Keluar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <tr className="divide-x divide-slate-200">
                    <th className="py-3 px-3.5 min-w-[150px]">NO. WO & SPK</th>
                    <th className="py-3 px-3.5 min-w-[160px]">PELANGGAN & LOKASI</th>
                    <th className="py-3 px-3.5 min-w-[160px]">VENDOR</th>
                    <th className="py-3 px-3.5 min-w-[150px]">NO. RESERVASI ERP</th>
                    <th className="py-3 px-3.5 min-w-[150px]">SURAT JALAN (SJ)</th>
                    <th className="py-3 px-3.5 min-w-[220px]">MATERIAL KELUAR</th>
                    <th className="py-3 px-3.5 min-w-[160px] bg-blue-50/50">NOMOR GOOD ISSUE (GI)</th>
                    <th className="py-3 px-3 text-center min-w-[120px] w-32">STATUS POSTING</th>
                    <th className="py-3 px-3 min-w-[150px]">KETERANGAN</th>
                    <th className="py-3 px-3 text-center min-w-[110px] w-28">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKeluarRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <PackageMinus className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-500" />
                        <div className="font-semibold text-slate-600">Tidak ada data pengeluaran material (Barang Keluar)</div>
                        <div className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter status GI.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredKeluarRows.map((wo) => {
                      const hasGi = Boolean(wo.giNumber?.trim());
                      const isSistem = wo.giStatus === 'Sistem';
                      const mats = wo.materials || [];
                      const takenMats = mats.filter((m) => (m.qtyTaken || 0) > 0);
                      const displayMats = takenMats.length > 0 ? takenMats : mats.slice(0, 3);

                      return (
                        <tr
                          key={wo.id}
                          className={`hover:bg-slate-50/80 transition-colors divide-x divide-slate-200 ${
                            !hasGi ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* 1. NO. WO & SPK */}
                          <td className="py-3 px-3.5 align-top">
                            <div className="font-mono font-bold text-blue-700 text-xs">
                              {wo.id}
                            </div>
                            {wo.spkNumber && (
                              <div className="font-mono text-[10px] text-slate-500 mt-1">
                                SPK: <span className="text-slate-700 font-semibold">{wo.spkNumber}</span>
                              </div>
                            )}
                            <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-bold mt-1 border ${
                              wo.category === 'WO Paket 1'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : wo.category === 'WO Paket 2'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {wo.category || 'WO Konstruksi'}
                            </span>
                          </td>

                          {/* 2. PELANGGAN */}
                          <td className="py-3 px-3.5 align-top">
                            <div className="font-semibold text-slate-900 leading-snug text-[11.5px]">
                              {wo.customerName}
                            </div>
                            {wo.location && (
                              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2" title={wo.location}>
                                📍 {wo.location}
                              </div>
                            )}
                          </td>

                          {/* 3. VENDOR */}
                          <td className="py-3 px-3.5 align-top">
                            <div className="text-xs font-bold text-slate-800 flex items-start gap-1.5 leading-snug">
                              <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                              <span>{wo.vendor || '—'}</span>
                            </div>
                            {wo.narahubung && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                Kontak: <span className="text-slate-700 font-medium">{wo.narahubung}</span>
                              </div>
                            )}
                          </td>

                          {/* 4. NO. RESERVASI ERP */}
                          <td className="py-3 px-3.5 align-top">
                            {wo.reservationNumber ? (
                              <div>
                                <span className="font-mono text-[10.5px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block truncate" title={wo.reservationNumber}>
                                  {wo.reservationNumber}
                                </span>
                                {wo.reservationDate && (
                                  <div className="text-[9.5px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{wo.reservationDate}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-xs">—</span>
                            )}
                          </td>

                          {/* 5. NO. SURAT JALAN (SJ) */}
                          <td className="py-3 px-3.5 align-top">
                            {wo.suratJalanNumber ? (
                              <div>
                                <span className="font-mono text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block truncate" title={wo.suratJalanNumber}>
                                  {wo.suratJalanNumber}
                                </span>
                                {wo.suratJalanDate && (
                                  <div className="text-[9.5px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{wo.suratJalanDate}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-600 text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium inline-block">
                                Belum Ada SJ
                              </span>
                            )}
                          </td>

                          {/* 6. MATERIAL KELUAR */}
                          <td className="py-3 px-3.5 align-top">
                            <div className="space-y-1">
                              {displayMats.slice(0, 3).map((m, idx) => (
                                <div key={idx} className="text-[10px] flex items-start justify-between gap-2 border-b border-slate-100 pb-0.5 last:border-0">
                                  <span className="text-slate-700 truncate max-w-[140px]" title={m.material}>
                                    • {m.material}
                                  </span>
                                  <span className="font-mono font-bold text-slate-900 shrink-0">
                                    {m.qtyTaken || m.qtyReserved || 0} {m.unit || 'bh'}
                                  </span>
                                </div>
                              ))}
                              {displayMats.length > 3 && (
                                <div className="text-[9.5px] text-blue-600 font-semibold">
                                  + {displayMats.length - 3} material lainnya
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 7. NOMOR GOOD ISSUE (GI SAP) */}
                          <td className="py-3 px-3.5 align-top bg-blue-50/20">
                            {hasGi ? (
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="font-mono font-black text-xs text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-300 shadow-2xs">
                                    {wo.giNumber}
                                  </span>
                                </div>
                                {wo.giInputDate && (
                                  <div className="text-[9px] text-slate-400 mt-1">
                                    Input: {new Date(wo.giInputDate).toLocaleDateString('id-ID')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[10px] font-bold">Belum Input GI</span>
                              </div>
                            )}
                          </td>

                          {/* 8. STATUS POSTING */}
                          <td className="py-3 px-3 text-center align-middle">
                            {isSistem ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Sistem (SAP)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs whitespace-nowrap">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Non-Sistem</span>
                              </span>
                            )}
                          </td>

                          {/* 9. KETERANGAN POSTING */}
                          <td className="py-3 px-3 align-top text-slate-600">
                            {wo.giCatatan ? (
                              <div className="text-[10px] leading-snug line-clamp-2" title={wo.giCatatan}>
                                {wo.giCatatan}
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">—</span>
                            )}
                            {wo.giInputBy && (
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                Oleh: <span className="font-medium text-slate-600">{wo.giInputBy}</span>
                              </div>
                            )}
                          </td>

                          {/* 10. AKSI */}
                          <td className="py-3 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleOpenEditGi(wo)}
                              className={`w-full py-1.5 px-2 rounded-lg font-bold text-[10.5px] flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer whitespace-nowrap ${
                                hasGi
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              <Edit3 className="w-3 h-3 shrink-0" />
                              <span>{hasGi ? 'Edit GI' : 'Input GI'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KONTEN TAB 2: BARANG MASUK (RETUR) KE GUDANG */}
      {/* ========================================================================= */}
      {mainTab === 'MASUK' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* KPI Summary Cards Masuk / Retur */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div
              onClick={() => setSubTabMasuk('ALL')}
              className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                subTabMasuk === 'ALL'
                  ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Total WO Ada Retur</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-2">{statsMasuk.total}</div>
              <div className="text-[10px] text-slate-500 mt-1">Total WO dengan pengembalian material</div>
            </div>

            <div
              onClick={() => setSubTabMasuk('MENUNGGU')}
              className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                subTabMasuk === 'MENUNGGU'
                  ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">Menunggu Verifikasi</span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-800 font-mono mt-2">{statsMasuk.menungguCount}</div>
              <div className="text-[10px] text-amber-700 font-medium mt-1">Perlu dicek fisik oleh Admin Gudang</div>
            </div>

            <div
              onClick={() => setSubTabMasuk('DISETUJUI')}
              className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                subTabMasuk === 'DISETUJUI'
                  ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Retur Disetujui</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-800 font-mono mt-2">{statsMasuk.disetujuiCount}</div>
              <div className="text-[10px] text-emerald-700 font-medium mt-1">Fisik diterima & stok bertambah</div>
            </div>

            <div
              onClick={() => setSubTabMasuk('DITOLAK')}
              className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
                subTabMasuk === 'DITOLAK'
                  ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">Retur Ditolak</span>
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-800 font-mono mt-2">{statsMasuk.ditolakCount}</div>
              <div className="text-[10px] text-rose-700 font-medium mt-1">Fisik selisih/ditolak gudang</div>
            </div>
          </div>

          {/* Filter Bar & Sub-Tabs Masuk */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSubTabMasuk('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    subTabMasuk === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Retur ({statsMasuk.total})
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabMasuk('MENUNGGU')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    subTabMasuk === 'MENUNGGU'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Menunggu Verifikasi ({statsMasuk.menungguCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabMasuk('DISETUJUI')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    subTabMasuk === 'DISETUJUI'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Disetujui ({statsMasuk.disetujuiCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabMasuk('DITOLAK')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    subTabMasuk === 'DITOLAK'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Ditolak ({statsMasuk.ditolakCount})</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-800">{filteredMasukRows.length}</span> dari {statsMasuk.total} transaksi retur
              </div>
            </div>

            {/* Search & Vendor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari No. WO, SPK, Pelanggan, Vendor, No. Slip Retur (TUG-10)..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                >
                  <option value="ALL">Semua Vendor Rekanan ({vendorList.length})</option>
                  {vendorList.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabel Barang Masuk (Retur) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <tr className="divide-x divide-slate-200">
                    <th className="py-3 px-3.5 min-w-[150px]">NO. WO & SPK</th>
                    <th className="py-3 px-3.5 min-w-[160px]">PELANGGAN & LOKASI</th>
                    <th className="py-3 px-3.5 min-w-[150px]">VENDOR REKANAN</th>
                    <th className="py-3 px-3.5 min-w-[160px] bg-indigo-50/40">SLIP RETUR (TUG-10)</th>
                    <th className="py-3 px-3.5 min-w-[220px]">MATERIAL MASUK (RETUR)</th>
                    <th className="py-3 px-3 text-center min-w-[100px] w-24">FOTO BUKTI</th>
                    <th className="py-3 px-3 text-center min-w-[140px] w-36">STATUS RETUR GUDANG</th>
                    <th className="py-3 px-3 min-w-[160px]">KETERANGAN & VERIFIKATOR</th>
                    <th className="py-3 px-3 text-center min-w-[130px] w-32">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMasukRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <PackagePlus className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                        <div className="font-semibold text-slate-600">Tidak ada data pengembalian material (Barang Masuk / Retur)</div>
                        <div className="text-[11px] text-slate-400 mt-1">Vendor belum mengajukan retur sisa material atau filter tidak cocok.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredMasukRows.map((wo) => {
                      const mats = wo.materials || [];
                      const returnedMats = mats.filter((m) => (m.qtyReturned || 0) > 0);
                      const isMenunggu = wo.returStatus === 'MENUNGGU_VERIFIKASI_GUDANG';
                      const isDisetujui = wo.returStatus === 'RETUR_DISETUJUI';
                      const isDitolak = wo.returStatus === 'RETUR_DITOLAK';
                      const photos = wo.slipReturPhotos || [];

                      return (
                        <tr
                          key={wo.id}
                          className={`hover:bg-slate-50/80 transition-colors divide-x divide-slate-200 ${
                            isMenunggu ? 'bg-amber-50/25' : ''
                          }`}
                        >
                          {/* 1. NO. WO & SPK */}
                          <td className="py-3 px-3.5 align-top">
                            <div className="font-mono font-bold text-indigo-700 text-xs">
                              {wo.id}
                            </div>
                            {wo.spkNumber && (
                              <div className="font-mono text-[10px] text-slate-500 mt-1">
                                SPK: <span className="text-slate-700 font-semibold">{wo.spkNumber}</span>
                              </div>
                            )}
                            <span className="inline-block text-[9px] px-1.5 py-0.2 rounded font-bold mt-1 border bg-slate-100 text-slate-700 border-slate-200">
                              {wo.category || 'WO Konstruksi'}
                            </span>
                          </td>

                          {/* 2. PELANGGAN */}
                          <td className="py-3 px-3.5 align-top">
                            <div className="font-semibold text-slate-900 leading-snug text-[11.5px]">
                              {wo.customerName}
                            </div>
                            {wo.location && (
                              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2" title={wo.location}>
                                📍 {wo.location}
                              </div>
                            )}
                          </td>

                          {/* 3. VENDOR */}
                          <td className="py-3 px-3.5 align-top">
                            <div className="text-xs font-bold text-slate-800 flex items-start gap-1.5 leading-snug">
                              <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                              <span>{wo.vendor || '—'}</span>
                            </div>
                            {wo.narahubung && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                Kontak: <span className="text-slate-700 font-medium">{wo.narahubung}</span>
                              </div>
                            )}
                          </td>

                          {/* 4. SLIP RETUR (TUG-10) */}
                          <td className="py-3 px-3.5 align-top bg-indigo-50/20">
                            {wo.slipReturNumber ? (
                              <div>
                                <span className="font-mono text-[11px] font-bold text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 block truncate" title={wo.slipReturNumber}>
                                  {wo.slipReturNumber}
                                </span>
                                {wo.slipReturDate && (
                                  <div className="text-[9.5px] text-slate-500 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-indigo-500" />
                                    <span>{wo.slipReturDate}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-700 text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold inline-block">
                                Belum Ada Slip TUG-10
                              </span>
                            )}
                          </td>

                          {/* 5. MATERIAL RETUR */}
                          <td className="py-3 px-3.5 align-top">
                            {returnedMats.length === 0 ? (
                              <span className="text-slate-400 italic text-[10.5px]">Nihil item retur</span>
                            ) : (
                              <div className="space-y-1">
                                <div className="text-[9.5px] font-bold text-indigo-800 mb-1 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                  <span>{returnedMats.length} Material Dikembalikan:</span>
                                </div>
                                {returnedMats.map((m, idx) => (
                                  <div key={idx} className="text-[10px] flex items-start justify-between gap-2 border-b border-indigo-100/60 pb-0.5 last:border-0">
                                    <span className="text-slate-700 truncate max-w-[140px]" title={m.material}>
                                      ↩ {m.material}
                                    </span>
                                    <span className="font-mono font-black text-indigo-900 shrink-0 bg-indigo-50 px-1.5 py-0.2 rounded">
                                      {m.qtyReturned} {m.unit || 'bh'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* 6. BUKTI FOTO */}
                          <td className="py-3 px-3 text-center align-middle">
                            {photos.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => setViewPhoto({ url: photos[0], title: `Foto Retur WO ${wo.id} (${wo.slipReturNumber || 'TUG-10'})` })}
                                className="group relative inline-flex flex-col items-center justify-center p-1 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition cursor-pointer"
                                title="Klik untuk lihat bukti foto"
                              >
                                <Camera className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-bold text-indigo-700 mt-0.5">
                                  {photos.length} Foto
                                </span>
                              </button>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">Tidak ada</span>
                            )}
                          </td>

                          {/* 7. STATUS RETUR GUDANG */}
                          <td className="py-3 px-3 text-center align-middle">
                            {isMenunggu && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs whitespace-nowrap animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Menunggu Verifikasi</span>
                              </span>
                            )}
                            {isDisetujui && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Retur Disetujui</span>
                              </span>
                            )}
                            {isDitolak && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs whitespace-nowrap">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Retur Ditolak</span>
                              </span>
                            )}
                            {!isMenunggu && !isDisetujui && !isDitolak && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                Draft / Nihil
                              </span>
                            )}
                          </td>

                          {/* 8. KETERANGAN & VERIFIKATOR */}
                          <td className="py-3 px-3 align-top text-slate-600">
                            {isDisetujui && (
                              <div className="space-y-1 text-[10px]">
                                <div className="text-emerald-700 font-bold flex items-center gap-1">
                                  <FileCheck2 className="w-3 h-3" />
                                  <span>Fisik Diterima Gudang</span>
                                </div>
                                {wo.returApprovedBy && (
                                  <div className="text-[9px] text-slate-500">
                                    Oleh: <span className="font-semibold text-slate-700">{wo.returApprovedBy}</span>
                                  </div>
                                )}
                                {wo.returApprovedAt && (
                                  <div className="text-[9px] text-slate-400">
                                    {wo.returApprovedAt}
                                  </div>
                                )}
                              </div>
                            )}
                            {isDitolak && (
                              <div className="space-y-1 text-[10px]">
                                <div className="text-rose-700 font-bold flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  <span>Ditolak</span>
                                </div>
                                {wo.returRejectionReason && (
                                  <div className="text-[9.5px] text-rose-600 italic line-clamp-2" title={wo.returRejectionReason}>
                                    &ldquo;{wo.returRejectionReason}&rdquo;
                                  </div>
                                )}
                              </div>
                            )}
                            {isMenunggu && (
                              <div className="text-[10px] text-amber-700 font-medium">
                                Menunggu inspeksi fisik gudang & persetujuan TUG-10
                              </div>
                            )}
                            {!isMenunggu && !isDisetujui && !isDitolak && (
                              <span className="text-slate-300 italic text-[10px]">—</span>
                            )}
                          </td>

                          {/* 9. AKSI */}
                          <td className="py-3 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleOpenReturModal(wo)}
                              className={`w-full py-1.5 px-2.5 rounded-lg font-bold text-[10.5px] flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer whitespace-nowrap ${
                                isMenunggu && canVerifyRetur
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>{isMenunggu && canVerifyRetur ? 'Verifikasi' : 'Detail'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INPUT / EDIT GOOD ISSUE (GI) SAP (BARANG KELUAR) */}
      {/* ========================================================================= */}
      {editingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-300" />
                <h3 className="text-sm font-bold">Input / Edit Good Issue (GI) SAP</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWo(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGi} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Nomor WO:</span>
                  <span className="font-mono font-bold text-blue-700">{editingWo.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Pelanggan:</span>
                  <span className="font-bold text-slate-800 text-right truncate max-w-[200px]" title={editingWo.customerName}>
                    {editingWo.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Rekanan Vendor:</span>
                  <span className="font-semibold text-slate-700">{editingWo.vendor}</span>
                </div>
                {editingWo.reservationNumber && (
                  <div className="flex items-center justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-500 font-medium">No. Reservasi ERP:</span>
                    <span className="font-mono font-semibold text-slate-800">{editingWo.reservationNumber}</span>
                  </div>
                )}
                {editingWo.suratJalanNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">No. Surat Jalan:</span>
                    <span className="font-mono font-semibold text-blue-700">{editingWo.suratJalanNumber}</span>
                  </div>
                )}
              </div>

              {/* Input Nomor GI */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Good Issue (GI) SAP <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Database className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={giNumberInput}
                    onChange={(e) => setGiNumberInput(e.target.value)}
                    placeholder="Contoh: 4900123456 atau 5000234567"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Nomor dokumen pengeluaran material resmi hasil posting di SAP ERP.
                </p>
              </div>

              {/* Status Posting */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Posting Transaksi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={giStatusInput}
                  onChange={(e) => setGiStatusInput(e.target.value as 'Sistem' | 'Non-Sistem')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                >
                  <option value="Sistem">✓ Sistem (Sudah Ter-posting di SAP ERP)</option>
                  <option value="Non-Sistem">⏱ Non-Sistem (Pengeluaran Fisik / Belum Ter-posting)</option>
                </select>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Good Issue
                </label>
                <textarea
                  value={giCatatanInput}
                  onChange={(e) => setGiCatatanInput(e.target.value)}
                  placeholder="Tambahkan catatan posting SAP atau keterangan dokumen..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingWo(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data GI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VERIFIKASI / DETAIL RETUR GUDANG (BARANG MASUK) */}
      {/* ========================================================================= */}
      {returModalWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="text-sm font-bold">Verifikasi Penerimaan Barang Masuk (Retur)</h3>
                  <p className="text-[11px] text-slate-300">Pengecekan fisik material sisa proyek & dokumen Slip Retur TUG-10</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturModalWo(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Header Info Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Nomor WO</div>
                  <div className="font-mono font-bold text-indigo-700 mt-0.5">{returModalWo.id}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Pelanggan</div>
                  <div className="font-semibold text-slate-800 truncate mt-0.5" title={returModalWo.customerName}>
                    {returModalWo.customerName}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Vendor Rekanan</div>
                  <div className="font-semibold text-slate-800 truncate mt-0.5" title={returModalWo.vendor}>
                    {returModalWo.vendor || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">No. Slip TUG-10</div>
                  <div className="font-mono font-bold text-slate-900 truncate mt-0.5">
                    {returModalWo.slipReturNumber || '—'}
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                returModalWo.returStatus === 'RETUR_DISETUJUI'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : returModalWo.returStatus === 'RETUR_DITOLAK'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-center gap-2">
                  {returModalWo.returStatus === 'RETUR_DISETUJUI' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {returModalWo.returStatus === 'RETUR_DITOLAK' && <XCircle className="w-4 h-4 text-rose-600" />}
                  {returModalWo.returStatus === 'MENUNGGU_VERIFIKASI_GUDANG' && <Clock className="w-4 h-4 text-amber-600" />}
                  <span className="font-bold">
                    {returModalWo.returStatus === 'RETUR_DISETUJUI' && 'Penerimaan Retur Telah Disetujui (Stok Fisik Bertambah)'}
                    {returModalWo.returStatus === 'RETUR_DITOLAK' && 'Pengajuan Retur Ditolak oleh Gudang'}
                    {returModalWo.returStatus === 'MENUNGGU_VERIFIKASI_GUDANG' && 'Menunggu Verifikasi Fisik oleh Petugas Gudang'}
                  </span>
                </div>
                {returModalWo.returApprovedBy && (
                  <span className="text-[10px] font-semibold text-slate-500">
                    Oleh: {returModalWo.returApprovedBy}
                  </span>
                )}
              </div>

              {/* Tabel Material yang Diretur */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <span>Daftar Rincian Material yang Dikembalikan (Retur)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Total: {(returModalWo.materials || []).filter((m) => (m.qtyReturned || 0) > 0).length} item
                  </span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Nama Material</th>
                      <th className="py-2 px-3 text-center">Keluar Awal</th>
                      <th className="py-2 px-3 text-center">Terpasang</th>
                      <th className="py-2 px-3 text-center bg-indigo-50/60 text-indigo-900 font-black">DIRETUR KE GUDANG</th>
                      <th className="py-2 px-3 text-center">Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {((returModalWo.materials || []).filter((m) => (m.qtyReturned || 0) > 0)).map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {m.material}
                          {m.kode && <div className="text-[9.5px] font-mono text-slate-400">{m.kode}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {m.qtyTaken || m.qtyAllocated || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {m.qtyInstalled || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-indigo-900 bg-indigo-50/40">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                            +{m.qtyReturned}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500">
                          {m.unit || 'bh'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bukti Foto Retur */}
              {(returModalWo.slipReturPhotos || []).length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Foto Bukti Fisik Material & Dokumen TUG-10</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {returModalWo.slipReturPhotos?.map((photo, i) => (
                      <div
                        key={i}
                        onClick={() => setViewPhoto({ url: photo, title: `Bukti Foto ${i + 1} - WO ${returModalWo.id}` })}
                        className="relative group border border-slate-200 rounded-xl overflow-hidden aspect-video bg-slate-100 cursor-pointer hover:border-indigo-400 transition"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Perbesar</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Catatan Admin Gudang (Jika Masih Menunggu Verifikasi) */}
              {returModalWo.returStatus === 'MENUNGGU_VERIFIKASI_GUDANG' && canVerifyRetur && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  {!isRejecting ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Catatan Persetujuan Gudang (Opsional)
                      </label>
                      <textarea
                        value={returActionNotes}
                        onChange={(e) => setReturActionNotes(e.target.value)}
                        placeholder="Contoh: Fisik material lengkap sesuai TUG-10 dan telah disimpan di rak gudang B-04."
                        rows={2}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white resize-none"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                      <label className="block text-xs font-bold text-rose-800">
                        Alasan Penolakan Retur Material <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Sebutkan alasan penolakan (misal: jumlah fisik tiang selisih 1 batang, kabel rusak tidak dapat diterima, dll)..."
                        rows={2}
                        className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setReturModalWo(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>

              {returModalWo.returStatus === 'MENUNGGU_VERIFIKASI_GUDANG' && canVerifyRetur && (
                <div className="flex items-center gap-2">
                  {!isRejecting ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsRejecting(true)}
                        className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak Retur</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveRetur}
                        className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Terima Retur & Tambah Stok Fisik</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsRejecting(false)}
                        className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                      >
                        Kembali
                      </button>
                      <button
                        type="button"
                        onClick={handleRejectRetur}
                        className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Konfirmasi Penolakan</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LIGHTBOX PREVIEW FOTO */}
      {/* ========================================================================= */}
      {viewPhoto && (
        <div
          onClick={() => setViewPhoto(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
          >
            <div className="p-3 bg-slate-950/80 text-white flex items-center justify-between text-xs font-bold">
              <span>{viewPhoto.title}</span>
              <button
                type="button"
                onClick={() => setViewPhoto(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex-1 flex items-center justify-center overflow-auto bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewPhoto.url}
                alt={viewPhoto.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
