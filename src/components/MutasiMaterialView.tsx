'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Boxes, 
  Building2, 
  Calendar, 
  Edit3, 
  Info, 
  X, 
  Database,
  ExternalLink,
  Tag,
  Check,
  FileCheck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { WorkOrderRecord } from '@/types';

export const MutasiMaterialView: React.FC = () => {
  const { workOrders, updateWoGiInfo } = usePromotorStore();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'BELUM_GI' | 'SISTEM' | 'NON_SISTEM'>('ALL');
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');

  // Modal Input / Edit GI state
  const [editingWo, setEditingWo] = useState<WorkOrderRecord | null>(null);
  const [giNumberInput, setGiNumberInput] = useState('');
  const [giStatusInput, setGiStatusInput] = useState<'Sistem' | 'Non-Sistem'>('Sistem');
  const [giCatatanInput, setGiCatatanInput] = useState('');

  // 1. Data Mutasi Material:
  // Work Order yang sudah ada reservasi atau sudah diambil vendor (vendorReceiptConfirmed / suratJalanNumber / reservationNumber)
  const mutasiWos = useMemo(() => {
    return workOrders.filter((wo) => {
      const hasReservation = Boolean(wo.reservationNumber || wo.reservationDate || wo.reservationStatus === 'Siap Ambil' || wo.reservationStatus === 'Selesai');
      const hasSj = Boolean(wo.suratJalanNumber || wo.vendorReceiptConfirmed);
      const hasMaterialsTaken = (wo.materials || []).some((m) => (m.qtyTaken || 0) > 0);
      return hasReservation || hasSj || hasMaterialsTaken;
    });
  }, [workOrders]);

  // Vendor list for filter
  const vendorList = useMemo(() => {
    const setV = new Set<string>();
    mutasiWos.forEach((w) => {
      if (w.vendor) setV.add(w.vendor);
    });
    return Array.from(setV);
  }, [mutasiWos]);

  // Statistik summary
  const stats = useMemo(() => {
    const total = mutasiWos.length;
    const sudahGi = mutasiWos.filter((w) => Boolean(w.giNumber?.trim()));
    const belumGi = mutasiWos.filter((w) => !w.giNumber?.trim());
    const sistemCount = mutasiWos.filter((w) => w.giStatus === 'Sistem').length;
    const nonSistemCount = mutasiWos.filter((w) => w.giStatus === 'Non-Sistem' || (!w.giStatus && !w.giNumber?.trim())).length;

    const totalItemKeluar = mutasiWos.reduce((acc, wo) => {
      const takenCount = (wo.materials || []).reduce((sum, m) => sum + (m.qtyTaken || 0), 0);
      return acc + takenCount;
    }, 0);

    return {
      total,
      sudahGiCount: sudahGi.length,
      belumGiCount: belumGi.length,
      sistemCount,
      nonSistemCount,
      totalItemKeluar,
    };
  }, [mutasiWos]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return mutasiWos.filter((wo) => {
      // Tab filter
      const hasGi = Boolean(wo.giNumber?.trim());
      const isSistem = wo.giStatus === 'Sistem';
      const isNonSistem = wo.giStatus === 'Non-Sistem' || (!wo.giStatus && !hasGi);

      if (activeTab === 'BELUM_GI' && hasGi) return false;
      if (activeTab === 'SISTEM' && !isSistem) return false;
      if (activeTab === 'NON_SISTEM' && !isNonSistem) return false;

      // Vendor filter
      if (selectedVendor !== 'ALL' && wo.vendor !== selectedVendor) return false;

      // Search term
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
  }, [mutasiWos, activeTab, selectedVendor, searchTerm]);

  // Handler open modal
  const handleOpenEditGi = (wo: WorkOrderRecord) => {
    setEditingWo(wo);
    setGiNumberInput(wo.giNumber || '');
    setGiStatusInput(wo.giStatus || (wo.giNumber ? 'Sistem' : 'Non-Sistem'));
    setGiCatatanInput(wo.giCatatan || '');
  };

  // Handler save modal
  const handleSaveGi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWo) return;

    updateWoGiInfo(
      editingWo.id,
      giNumberInput,
      giStatusInput,
      giCatatanInput,
      'Admin Gudang UP3'
    );

    setEditingWo(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 md:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-400/20">
              Logistik & Persediaan Gudang UP3
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight mt-2">
            Mutasi Material & Good Issue (GI) SAP
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Pencatatan pengeluaran fisik material gudang UP3, verifikasi status Sistem (posting SAP) vs Non-Sistem (manual), serta monitoring reservasi yang belum diterbitkan Good Issue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3.5 py-2.5 rounded-xl text-right">
            <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Total Item Keluar</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {stats.totalItemKeluar.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">unit/mtr</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div 
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'ALL' 
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total Mutasi WO</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-1">Seluruh WO yang bermutasi</div>
        </div>

        <div 
          onClick={() => setActiveTab('BELUM_GI')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'BELUM_GI' 
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Belum Ada No. GI</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono mt-2">{stats.belumGiCount}</div>
          <div className="text-[10px] text-rose-600 font-medium mt-1">Perlu diinput nomor GI SAP</div>
        </div>

        <div 
          onClick={() => setActiveTab('SISTEM')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'SISTEM' 
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Status: Sistem (SAP)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono mt-2">{stats.sistemCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Sudah ter-posting di SAP</div>
        </div>

        <div 
          onClick={() => setActiveTab('NON_SISTEM')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'NON_SISTEM' 
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Status: Non-Sistem</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono mt-2">{stats.nonSistemCount}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Keluar fisik belum posting SAP</div>
        </div>
      </div>

      {/* 3. Filter Bar & Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Mutasi ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BELUM_GI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'BELUM_GI'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Belum Input GI ({stats.belumGiCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SISTEM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'SISTEM'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sistem ({stats.sistemCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('NON_SISTEM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'NON_SISTEM'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Non-Sistem ({stats.nonSistemCount})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-800">{filteredRows.length}</span> dari {stats.total} mutasi
          </div>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
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

          {/* Vendor Filter */}
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

      {/* 4. Tabel Mutasi Material */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-3.5 min-w-[150px]">NO. WO & SPK</th>
                <th className="py-3 px-3.5 min-w-[160px]">PELANGGAN</th>
                <th className="py-3 px-3.5 min-w-[160px]">VENDOR</th>
                <th className="py-3 px-3.5 min-w-[150px]">NO. RESERVASI ERP</th>
                <th className="py-3 px-3.5 min-w-[150px]">SURAT JALAN (SJ)</th>
                <th className="py-3 px-3.5 min-w-[200px]">MATERIAL KELUAR</th>
                <th className="py-3 px-3.5 min-w-[160px] bg-blue-50/50">NOMOR GOOD ISSUE (GI)</th>
                <th className="py-3 px-3 text-center min-w-[120px] w-32">STATUS</th>
                <th className="py-3 px-3 min-w-[150px]">KETERANGAN POSTING</th>
                <th className="py-3 px-3 text-center min-w-[110px] w-28">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-500" />
                    Tidak ada data mutasi material sesuai filter
                  </td>
                </tr>
              ) : (
                filteredRows.map((wo) => {
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

                      {/* 8. STATUS POSTING (Sistem vs Non-Sistem) */}
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

      {/* 5. Modal Input / Edit Good Issue (GI) */}
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
              {/* Info WO */}
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

              {/* Dropdown Status: Sistem vs Non-Sistem */}
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
                <p className="text-[10px] text-slate-400 mt-1">
                  Pilih "Sistem" jika dokumen GI sudah berhasil di-posting di SAP, atau "Non-Sistem" jika masih manual.
                </p>
              </div>

              {/* Input Catatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Good Issue
                </label>
                <textarea
                  value={giCatatanInput}
                  onChange={(e) => setGiCatatanInput(e.target.value)}
                  placeholder="Tambahkan catatan posting SAP, nomor referensi manual, atau keterangan selisih..."
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
    </div>
  );
};
