'use client';

import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  Plus,
  Printer,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  X,
  Check,
  ShieldCheck,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { usePromotorStore, deriveVendorOptions } from '@/store/usePromotorStore';
import { SweepingRecord, SweepingMaterialItem } from '@/types';
import { generateWorkTitlePln } from '@/data/surveyRabCalculator';

export const SweepingMaterialView: React.FC = () => {
  const { 
    sweepings, 
    workOrders, 
    surveys,
    vendors, 
    addSweeping, 
    updateSweeping, 
    deleteSweeping 
  } = usePromotorStore();

  // Daftar rekanan: seed master + vendor yang benar-benar punya WO, karena
  // pilihan ini dipakai untuk menyaring WO yang masuk sweeping.
  const vendorOptions = useMemo(
    () => deriveVendorOptions(vendors, workOrders.map((w) => ({ vendorName: w.vendor }))),
    [vendors, workOrders]
  );

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'DIVERIFIKASI_PENGAWAS' | 'DISETUJUI_GUDANG'>('ALL');

  // Modal State: Create New Sweeping
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedWoIds, setSelectedWoIds] = useState<string[]>([]);
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const [noSpk, setNoSpk] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }));
  const [lokasi, setLokasi] = useState('UP3 BANTEN SELATAN');
  const [catatan, setCatatan] = useState('');
  const [draftItems, setDraftItems] = useState<SweepingMaterialItem[]>([]);

  // Preview & Print Document Modal State
  const [previewSweeping, setPreviewSweeping] = useState<SweepingRecord | null>(null);

  // WOs for selected vendor
  const availableWosForVendor = useMemo(() => {
    if (!selectedVendor) return [];
    return workOrders.filter((wo) => {
      const matchVendor = (wo.vendor || '').toLowerCase() === selectedVendor.toLowerCase();
      return matchVendor;
    });
  }, [workOrders, selectedVendor]);

  // Handler toggle WO selection
  const handleToggleWo = (woId: string) => {
    setSelectedWoIds((prev) => {
      const isSelected = prev.includes(woId);
      const next = isSelected ? prev.filter((id) => id !== woId) : [...prev, woId];
      return next;
    });
  };

  // Handler select all WOs
  const handleToggleSelectAllWos = () => {
    if (selectedWoIds.length === availableWosForVendor.length) {
      setSelectedWoIds([]);
    } else {
      setSelectedWoIds(availableWosForVendor.map((w) => w.id));
    }
  };

  // Generate Sweeping Items automatically when progressing to Step 2
  const handleProceedToStep2 = () => {
    if (selectedWoIds.length === 0) return;

    const chosenWos = workOrders.filter((w) => selectedWoIds.includes(w.id));
    
    // Auto populate SPK & Nama Pekerjaan
    const spk = chosenWos[0]?.spkNumber || '0142.SPK/DAN.01.02/F30020000/2026';
    const firstWo = chosenWos[0];
    const firstCust = firstWo?.customerName || 'PENGGANTIAN MATERIAL DISTRIBUSI';
    setNoSpk(spk);
    if (!namaPekerjaan) {
      // Judul dari data survey terkait (lebih lengkap), fallback ke data WO.
      const linkedSurvey = firstWo && surveys.find(
        (s) => (firstWo.surveyId && s.id === firstWo.surveyId) || (firstWo.idpel && s.idpel === firstWo.idpel)
      );
      const paket = firstWo?.category === 'WO Tiang' ? 'tiang' : firstWo?.category === 'WO Paket 2' ? 'paket2' : 'paket1';
      const generatedTitle = generateWorkTitlePln(linkedSurvey || firstWo, paket);
      setNamaPekerjaan(generatedTitle && generatedTitle !== '-' ? generatedTitle : `PENGGANTIAN DAN REKONSILIASI MATERIAL - ${firstCust}`);
    }

    // Aggregate materials from chosen WOs
    const matMap = new Map<string, SweepingMaterialItem>();

    chosenWos.forEach((wo) => {
      (wo.materials || []).forEach((m) => {
        const matKey = m.material.trim();
        const taken = m.qtyTaken || m.qtyReserved || 0;
        const installed = m.qtyInstalled !== undefined ? m.qtyInstalled : Math.max(0, taken - (m.qtyReturned || 0));
        const returned = m.qtyReturned || 0;
        const tug9 = wo.suratJalanNumber || wo.reservationNumber || 'TUG-9/GDG';
        const tug10 = wo.slipReturNumber || (returned > 0 ? 'TUG-10/BKR' : '—');

        if (!matMap.has(matKey)) {
          matMap.set(matKey, {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            kode: m.kode,
            material: matKey,
            volPengambilan: taken,
            satPengambilan: (m.unit || 'SET').toUpperCase(),
            noTug9: tug9,
            ketPengambilan: String(taken),
            volTerpasang: installed,
            satTerpasang: (m.unit || 'SET').toUpperCase(),
            ketTerpasang: 'Terpasang Normal',
            volDikembalikan: returned,
            satDikembalikan: (m.unit || 'SET').toUpperCase(),
            noTug10: tug10,
            ketDikembalikan: returned > 0 ? 'BONGKARAN' : '—'
          });
        } else {
          const existing = matMap.get(matKey)!;
          existing.volPengambilan += taken;
          existing.ketPengambilan = String(existing.volPengambilan);
          existing.volTerpasang += installed;
          existing.volDikembalikan += returned;
          if (returned > 0) existing.ketDikembalikan = 'BONGKARAN';
        }
      });
    });

    setDraftItems(Array.from(matMap.values()));
    setStep(2);
  };

  // Add custom extra item (e.g. Bongkaran kubikel lama)
  const handleAddCustomItem = () => {
    const newItem: SweepingMaterialItem = {
      id: `custom-${Date.now()}`,
      material: '',
      volPengambilan: 0,
      satPengambilan: 'SET',
      noTug9: '—',
      ketPengambilan: '0',
      volTerpasang: 0,
      satTerpasang: 'SET',
      ketTerpasang: '—',
      volDikembalikan: 1,
      satDikembalikan: 'SET',
      noTug10: '562402505227223',
      ketDikembalikan: 'BONGKARAN'
    };
    setDraftItems([...draftItems, newItem]);
  };

  // Update draft item row
  const handleUpdateDraftItem = <K extends keyof SweepingMaterialItem>(index: number, field: K, value: SweepingMaterialItem[K]) => {
    setDraftItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Remove draft item
  const handleRemoveDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset and open modal
  const handleOpenCreateModal = () => {
    const defaultVendor = vendors[0]?.name || 'PT. HILMAN PRIMA PERKASA';
    setSelectedVendor(defaultVendor);
    setSelectedWoIds([]);
    setNamaPekerjaan('');
    setNoSpk('');
    setCatatan('');
    setDraftItems([]);
    setStep(1);
    setIsCreateModalOpen(true);
  };

  // Save Sweeping Record
  const handleSaveSweeping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || selectedWoIds.length === 0) return;

    const count = sweepings.length + 1;
    const nomorSweeping = `SWP/UP3-BTS/2026/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(count).padStart(3, '0')}`;

    addSweeping({
      nomorSweeping,
      namaPekerjaan: namaPekerjaan || 'PENGGANTIAN DAN REKONSILIASI MATERIAL DISTRIBUSI',
      noSpk: noSpk || '0142.SPK/DAN.01.02/F30020000/2026',
      tanggal,
      lokasi,
      pelaksana: selectedVendor,
      woIds: selectedWoIds,
      items: draftItems,
      status: 'DIVERIFIKASI_PENGAWAS',
      catatan,
      ttdVendorName: `Direktur ${selectedVendor}`,
      ttdPengawasName: 'Hasian Sitorus (TC Lola Konstruksi)',
      ttdGudangName: 'Petugas Gudang Logistik UP3 BTS'
    });

    setIsCreateModalOpen(false);
  };

  // Filtered rows
  const filteredSweepings = useMemo(() => {
    return sweepings.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const m1 = s.nomorSweeping.toLowerCase().includes(q);
        const m2 = s.namaPekerjaan.toLowerCase().includes(q);
        const m3 = s.noSpk.toLowerCase().includes(q);
        const m4 = s.pelaksana.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  }, [sweepings, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = sweepings.length;
    const verified = sweepings.filter((s) => s.status === 'DIVERIFIKASI_PENGAWAS').length;
    const approved = sweepings.filter((s) => s.status === 'DISETUJUI_GUDANG').length;
    const draft = sweepings.filter((s) => s.status === 'DRAFT').length;
    return { total, verified, approved, draft };
  }, [sweepings]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-5 md:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-400/20">
              Rekonsiliasi Material Pekerjaan
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight mt-2">
            Sweeping Material (Opname TUG 9 vs Terpasang vs TUG 10)
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Format resmi PLN rekonsiliasi opname material: Vendor memilih WO yang dimasukkan kedalam sweeping untuk membandingkan Material Pengambilan (TUG 9), Material Terpasang, dan Material Dikembalikan/Bongkaran (TUG 10).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Sweeping Material Baru</span>
        </button>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            statusFilter === 'ALL' 
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total Sweeping</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-1">Seluruh berkas sweeping</div>
        </div>

        <div 
          onClick={() => setStatusFilter('DIVERIFIKASI_PENGAWAS')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            statusFilter === 'DIVERIFIKASI_PENGAWAS' 
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">Verifikasi Pengawas</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-800 font-mono mt-2">{stats.verified}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-1">Sesuai fisik lapangan</div>
        </div>

        <div 
          onClick={() => setStatusFilter('DISETUJUI_GUDANG')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            statusFilter === 'DISETUJUI_GUDANG' 
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Disetujui Gudang</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono mt-2">{stats.approved}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">TUG 9 & TUG 10 valid</div>
        </div>

        <div 
          onClick={() => setStatusFilter('DRAFT')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            statusFilter === 'DRAFT' 
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Draft Vendor</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono mt-2">{stats.draft}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Belum ditandatangani</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Nomor Sweeping, Nomor SPK, Nama Pekerjaan, atau Vendor Pelaksana..."
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

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DIVERIFIKASI_PENGAWAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'DIVERIFIKASI_PENGAWAS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Diverifikasi Pengawas ({stats.verified})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DISETUJUI_GUDANG')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'DISETUJUI_GUDANG'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Disetujui Gudang ({stats.approved})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tabel Daftar Sweeping Material */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 uppercase text-[10.5px] font-bold tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-3.5 min-w-[160px]">NO. SWEEPING</th>
                <th className="py-3 px-3.5 min-w-[220px]">NAMA PEKERJAAN & LOKASI</th>
                <th className="py-3 px-3.5 min-w-[170px]">NO. SPK & TANGGAL</th>
                <th className="py-3 px-3.5 min-w-[170px]">PELAKSANA (VENDOR)</th>
                <th className="py-3 px-3.5 min-w-[160px]">WO TERPILIH</th>
                <th className="py-3 px-2.5 text-center min-w-[100px]">ITEM MATERIAL</th>
                <th className="py-3 px-3 text-center min-w-[140px]">STATUS</th>
                <th className="py-3 px-3 text-center min-w-[140px] w-40">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSweepings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-500" />
                    Belum ada data Sweeping Material. Klik &quot;Buat Sweeping Material Baru&quot; untuk memulai.
                  </td>
                </tr>
              ) : (
                filteredSweepings.map((swp) => {
                  return (
                    <tr key={swp.id} className="hover:bg-slate-50/80 transition-colors divide-x divide-slate-200">
                      {/* 1. NO. SWEEPING */}
                      <td className="py-3 px-3.5 align-top">
                        <span className="font-mono font-bold text-blue-700 text-xs block">
                          {swp.nomorSweeping}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Dibuat: {new Date(swp.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      {/* 2. NAMA PEKERJAAN */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="font-semibold text-slate-900 leading-snug text-xs line-clamp-2" title={swp.namaPekerjaan}>
                          {swp.namaPekerjaan}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <span>📍</span>
                          <span>{swp.lokasi}</span>
                        </div>
                      </td>

                      {/* 3. NO. SPK & TANGGAL */}
                      <td className="py-3 px-3.5 align-top font-mono">
                        <div className="text-xs font-bold text-slate-800 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                          {swp.noSpk}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-sans flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{swp.tanggal}</span>
                        </div>
                      </td>

                      {/* 4. VENDOR */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="text-xs font-bold text-slate-800 flex items-start gap-1.5 leading-snug">
                          <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <span>{swp.pelaksana}</span>
                        </div>
                      </td>

                      {/* 5. WO TERPILIH */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="flex flex-wrap gap-1">
                          {swp.woIds.map((id) => (
                            <span key={id} className="font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {id}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">
                          {swp.woIds.length} Work Order tercakup
                        </div>
                      </td>

                      {/* 6. JUMLAH ITEM */}
                      <td className="py-3 px-2.5 text-center align-middle">
                        <span className="font-bold text-slate-800 text-xs">
                          {swp.items.length}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Jenis Material</span>
                      </td>

                      {/* 7. STATUS */}
                      <td className="py-3 px-3 text-center align-middle">
                        {swp.status === 'DISETUJUI_GUDANG' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Disetujui Gudang</span>
                          </span>
                        ) : swp.status === 'DIVERIFIKASI_PENGAWAS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            <span>Verifikasi Pengawas</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Draft Belum Final</span>
                          </span>
                        )}
                      </td>

                      {/* 8. AKSI */}
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            type="button"
                            onClick={() => setPreviewSweeping(swp)}
                            className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10.5px] flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Cetak Format PLN</span>
                          </button>
                          
                          <div className="flex items-center gap-1 w-full">
                            {swp.status !== 'DISETUJUI_GUDANG' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStatus = swp.status === 'DRAFT' ? 'DIVERIFIKASI_PENGAWAS' : 'DISETUJUI_GUDANG';
                                  updateSweeping(swp.id, { status: nextStatus });
                                }}
                                title="Lanjutkan status persetujuan"
                                className="flex-1 py-1 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[9.5px] font-bold transition cursor-pointer"
                              >
                                {swp.status === 'DRAFT' ? 'Verifikasi' : 'Setujui Gudang'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus dokumen sweeping ${swp.nomorSweeping}?`)) {
                                  deleteSweeping(swp.id);
                                }
                              }}
                              title="Hapus Dokumen"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* 5. MODAL: BUAT SWEEPING MATERIAL BARU */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="text-sm font-bold">Buat Dokumen Sweeping Material</h3>
                  <p className="text-[11px] text-blue-200">
                    Step {step} dari 2: {step === 1 ? 'Pilih Vendor & Centang WO yang Dimasukkan' : 'Review & Rekapitulasi Material TUG 9 vs Terpasang vs TUG 10'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              {step === 1 && (
                <div className="space-y-4">
                  {/* Pilih Vendor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      1. Pilih Rekanan Vendor Pelaksana <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedVendor}
                      onChange={(e) => {
                        setSelectedVendor(e.target.value);
                        setSelectedWoIds([]);
                      }}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {vendorOptions.map((v) => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Checklist WO yang dimasukkan kedalam Sweeping */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="text-xs font-bold text-slate-800">
                          2. Centang WO yang Dimasukkan ke Dokumen Sweeping <span className="text-rose-500">*</span>
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Pilih satu atau beberapa Work Order untuk direkonsiliasi materialnya secara bersamaan.
                        </p>
                      </div>
                      {availableWosForVendor.length > 0 && (
                        <button
                          type="button"
                          onClick={handleToggleSelectAllWos}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition"
                        >
                          {selectedWoIds.length === availableWosForVendor.length ? 'Batalkan Semua' : 'Pilih Semua WO'}
                        </button>
                      )}
                    </div>

                    {availableWosForVendor.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                        Tidak ada Work Order untuk vendor {selectedVendor}.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                        {availableWosForVendor.map((wo) => {
                          const isChecked = selectedWoIds.includes(wo.id);
                          const totalMats = (wo.materials || []).length;
                          const takenMats = (wo.materials || []).filter((m) => (m.qtyTaken || 0) > 0).length;

                          return (
                            <label
                              key={wo.id}
                              className={`flex items-start gap-3 p-3 transition cursor-pointer ${
                                isChecked ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleWo(wo.id)}
                                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-bold text-blue-700 text-xs">
                                    {wo.id}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    SPK: {wo.spkNumber || '-'}
                                  </span>
                                  <span className="text-[9.5px] px-1.5 py-0.2 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {wo.category || 'Paket WO'}
                                  </span>
                                </div>
                                <div className="font-semibold text-slate-800 text-[11px] mt-0.5 truncate">
                                  {wo.customerName}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1">
                                  <span>📦 {totalMats} Material ({takenMats} sudah diambil)</span>
                                  <span>•</span>
                                  <span>SJ: {wo.suratJalanNumber || 'Belum terbit'}</span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {/* Header Form Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                        Nama Pekerjaan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={namaPekerjaan}
                        onChange={(e) => setNamaPekerjaan(e.target.value)}
                        placeholder="Contoh: PENGGANTIAN KUBIKEL RAWAN GANGGUAN"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                        Nomor SPK <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={noSpk}
                        onChange={(e) => setNoSpk(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                        Tanggal Sweeping
                      </label>
                      <input
                        type="text"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                        Lokasi / Unit
                      </label>
                      <input
                        type="text"
                        value={lokasi}
                        onChange={(e) => setLokasi(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Tabel Preview Rekonsiliasi Material */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-xs">
                        Rincian Material: Pengambilan (TUG 9) vs Terpasang vs Dikembalikan (TUG 10)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="px-2.5 py-1 text-[10.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Baris Bongkaran / Material Lain</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-[11px] border-collapse min-w-[800px]">
                        <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase sticky top-0 z-10">
                          <tr className="divide-x divide-slate-200">
                            <th className="p-2 w-8 text-center">NO</th>
                            <th className="p-2 min-w-[200px]">JENIS MATERIAL</th>
                            <th className="p-2 w-20 text-center bg-blue-50/50">VOL AMBIL</th>
                            <th className="p-2 w-28 bg-blue-50/50">NO. TUG 9</th>
                            <th className="p-2 w-20 text-center bg-emerald-50/50">PASANG</th>
                            <th className="p-2 w-20 text-center bg-amber-50/50">RETUR</th>
                            <th className="p-2 w-28 bg-amber-50/50">NO. TUG 10</th>
                            <th className="p-2 w-24 bg-amber-50/50">KET RETUR</th>
                            <th className="p-2 w-10 text-center">AKSI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {draftItems.map((item, idx) => (
                            <tr key={item.id} className="divide-x divide-slate-200 hover:bg-slate-50">
                              <td className="p-1.5 text-center font-bold text-slate-600">{idx + 1}</td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={item.material}
                                  onChange={(e) => handleUpdateDraftItem(idx, 'material', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded font-semibold text-slate-800 text-xs"
                                  placeholder="Nama/Spesifikasi Material..."
                                />
                              </td>
                              <td className="p-1.5 bg-blue-50/20">
                                <input
                                  type="number"
                                  value={item.volPengambilan}
                                  onChange={(e) => handleUpdateDraftItem(idx, 'volPengambilan', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 border border-blue-200 rounded text-center font-bold font-mono text-blue-900"
                                />
                              </td>
                              <td className="p-1.5 bg-blue-50/20">
                                <input
                                  type="text"
                                  value={item.noTug9 || ''}
                                  onChange={(e) => handleUpdateDraftItem(idx, 'noTug9', e.target.value)}
                                  className="w-full px-1 py-0.5 border border-blue-200 rounded font-mono text-[10px]"
                                  placeholder="No. TUG 9"
                                />
                              </td>
                              <td className="p-1.5 bg-emerald-50/20">
                                <input
                                  type="number"
                                  value={item.volTerpasang}
                                  onChange={(e) => handleUpdateDraftItem(idx, 'volTerpasang', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 border border-emerald-200 rounded text-center font-bold font-mono text-emerald-900"
                                />
                              </td>
                              <td className="p-1.5 bg-amber-50/20">
                                <input
                                  type="number"
                                  value={item.volDikembalikan}
                                  onChange={(e) => handleUpdateDraftItem(idx, 'volDikembalikan', Number(e.target.value))}
                                  className="w-full px-1 py-0.5 border border-amber-200 rounded text-center font-bold font-mono text-amber-900"
                                />
                              </td>
                              <td className="p-1.5 bg-amber-50/20">
                                <input
                                  type="text"
                                  value={item.noTug10 || ''}
                                  onChange={(e) => handleUpdateDraftItem(idx, 'noTug10', e.target.value)}
                                  className="w-full px-1 py-0.5 border border-amber-200 rounded font-mono text-[10px]"
                                  placeholder="No. TUG 10"
                                />
                              </td>
                              <td className="p-1.5 bg-amber-50/20">
                                <input
                                  type="text"
                                  value={item.ketDikembalikan || ''}
                                  onChange={(e) => handleUpdateDraftItem(idx, 'ketDikembalikan', e.target.value)}
                                  className="w-full px-1 py-0.5 border border-amber-200 rounded text-[10px] font-semibold text-amber-900"
                                  placeholder="BONGKARAN"
                                />
                              </td>
                              <td className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDraftItem(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Pilih WO</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
              )}

              {step === 1 ? (
                <button
                  type="button"
                  disabled={selectedWoIds.length === 0}
                  onClick={handleProceedToStep2}
                  className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
                    selectedWoIds.length > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Lanjut Rekap Material ({selectedWoIds.length} WO)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveSweeping}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Terbitkan Dokumen Sweeping</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL PREVIEW & CETAK DOKUMEN SWEEPING RESMI (PERSIS FOTO PLN) */}
      {previewSweeping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-300 overflow-hidden my-auto max-h-[96vh] flex flex-col print:border-none print:shadow-none print:max-w-none print:max-h-none print:m-0 print:rounded-none">
            {/* Header Toolbar (Hidden when printing) */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs">
                  Preview Dokumen Cetak Sweeping Material ({previewSweeping.nomorSweeping})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen (Print / PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSweeping(null)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Printable Paper Area */}
            <div className="p-6 md:p-10 overflow-y-auto flex-1 bg-white text-black font-sans print:p-4 print:overflow-visible text-[11px] leading-normal">
              {/* Document Title */}
              <div className="text-center font-bold text-base md:text-lg tracking-wider mb-5 uppercase underline decoration-1 underline-offset-4">
                SWEEPING MATERIAL
              </div>

              {/* Two Column Metadata Header Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs mb-4 font-semibold">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-36 text-slate-700">NAMA PEKERJAAN</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-slate-900 uppercase flex-1">{previewSweeping.namaPekerjaan}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700">NO SPK</span>
                    <span className="mr-2">:</span>
                    <span className="font-mono font-bold text-slate-900 flex-1">{previewSweeping.noSpk}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700">TANGGAL</span>
                    <span className="mr-2">:</span>
                    <span className="text-slate-900 flex-1">{previewSweeping.tanggal}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-32 text-slate-700">LOKASI</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-slate-900 flex-1">{previewSweeping.lokasi}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-700">PELAKSANA</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-slate-900 flex-1 uppercase">{previewSweeping.pelaksana}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-700">NO. DOKUMEN</span>
                    <span className="mr-2">:</span>
                    <span className="font-mono text-slate-700 flex-1">{previewSweeping.nomorSweeping}</span>
                  </div>
                </div>
              </div>

              {/* Exact PLN Sweeping Table Layout */}
              <div className="overflow-x-auto border border-black mb-6">
                <table className="w-full border-collapse text-[10px] text-center">
                  <thead>
                    {/* Row 1 Headers */}
                    <tr className="border-b border-black font-bold uppercase bg-slate-50 print:bg-transparent">
                      <th rowSpan={2} className="border-r border-black p-2 w-8">NO</th>
                      <th rowSpan={2} className="border-r border-black p-2 min-w-[220px] text-left">JENIS MATERIAL</th>
                      <th colSpan={4} className="border-r border-black p-1.5">MATERIAL PENGAMBILAN</th>
                      <th colSpan={3} className="border-r border-black p-1.5">MATERIAL TERPASANG</th>
                      <th colSpan={4} className="p-1.5">MATERIAL DIKEMBALIKAN</th>
                    </tr>
                    {/* Row 2 Sub-Headers */}
                    <tr className="border-b border-black font-bold uppercase text-[9.5px] bg-slate-50 print:bg-transparent">
                      {/* Material Pengambilan */}
                      <th className="border-r border-black p-1 w-12">VOL</th>
                      <th className="border-r border-black p-1 w-12">SAT</th>
                      <th className="border-r border-black p-1 min-w-[120px]">RESERVASI / TUG 9<br/><span className="text-[8.5px] font-normal">NOMOR</span></th>
                      <th className="border-r border-black p-1 w-16">KETERANGAN</th>

                      {/* Material Terpasang */}
                      <th className="border-r border-black p-1 w-12">VOL</th>
                      <th className="border-r border-black p-1 w-12">SAT</th>
                      <th className="border-r border-black p-1 min-w-[100px]">KETERANGAN</th>

                      {/* Material Dikembalikan */}
                      <th className="border-r border-black p-1 w-12">VOL</th>
                      <th className="border-r border-black p-1 w-12">SAT</th>
                      <th className="border-r border-black p-1 min-w-[120px]">RESERVASI / TUG 10<br/><span className="text-[8.5px] font-normal">NOMOR</span></th>
                      <th className="p-1 w-24">KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSweeping.items.map((it, idx) => (
                      <tr key={it.id || idx} className="border-b border-black">
                        <td className="border-r border-black p-1.5 font-bold">{idx + 1}</td>
                        <td className="border-r border-black p-1.5 text-left font-semibold uppercase">{it.material}</td>
                        
                        {/* Pengambilan */}
                        <td className="border-r border-black p-1.5 font-mono">{it.volPengambilan || 0}</td>
                        <td className="border-r border-black p-1.5 uppercase">{it.satPengambilan || 'SET'}</td>
                        <td className="border-r border-black p-1.5 font-mono text-[9px]">{it.noTug9 || '—'}</td>
                        <td className="border-r border-black p-1.5">{it.ketPengambilan || it.volPengambilan || '—'}</td>

                        {/* Terpasang */}
                        <td className="border-r border-black p-1.5 font-mono">{it.volTerpasang || 0}</td>
                        <td className="border-r border-black p-1.5 uppercase">{it.satTerpasang || 'SET'}</td>
                        <td className="border-r border-black p-1.5 text-left text-[9px]">{it.ketTerpasang || '—'}</td>

                        {/* Dikembalikan */}
                        <td className="border-r border-black p-1.5 font-mono">{it.volDikembalikan || 0}</td>
                        <td className="border-r border-black p-1.5 uppercase">{it.satDikembalikan || 'SET'}</td>
                        <td className="border-r border-black p-1.5 font-mono text-[9px]">{it.noTug10 || '—'}</td>
                        <td className="p-1.5 text-[9px] font-semibold uppercase">{it.ketDikembalikan || '—'}</td>
                      </tr>
                    ))}

                    {/* Summary Total Row */}
                    <tr className="border-t-2 border-black font-bold bg-slate-100 print:bg-transparent">
                      <td colSpan={2} className="border-r border-black p-2 text-right uppercase">TOTAL VOLUME :</td>
                      <td className="border-r border-black p-2 font-mono">
                        {previewSweeping.items.reduce((s, i) => s + (i.volPengambilan || 0), 0)}
                      </td>
                      <td colSpan={3} className="border-r border-black p-2"></td>
                      <td className="border-r border-black p-2 font-mono">
                        {previewSweeping.items.reduce((s, i) => s + (i.volTerpasang || 0), 0)}
                      </td>
                      <td colSpan={2} className="border-r border-black p-2"></td>
                      <td className="border-r border-black p-2 font-mono">
                        {previewSweeping.items.reduce((s, i) => s + (i.volDikembalikan || 0), 0)}
                      </td>
                      <td colSpan={2} className="p-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan 3 Pihak Sesuai SOP PLN */}
              <div className="grid grid-cols-3 gap-6 text-center text-xs mt-8 pt-4">
                <div className="space-y-16">
                  <div>
                    <span className="text-slate-600 block">Dibuat Oleh:</span>
                    <b className="uppercase">{previewSweeping.pelaksana}</b>
                  </div>
                  <div>
                    <div className="border-b border-black w-40 mx-auto"></div>
                    <span className="font-bold text-[11px] block mt-1">{previewSweeping.ttdVendorName || 'Penanggung Jawab Vendor'}</span>
                    <span className="text-[10px] text-slate-500">Pelaksana Pekerjaan</span>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-600 block">Diperiksa Oleh:</span>
                    <b className="uppercase">PENGAWAS LAPANGAN</b>
                  </div>
                  <div>
                    <div className="border-b border-black w-40 mx-auto"></div>
                    <span className="font-bold text-[11px] block mt-1">{previewSweeping.ttdPengawasName || 'Hasian Sitorus'}</span>
                    <span className="text-[10px] text-slate-500">TC Lola Konstruksi UP3</span>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-600 block">Disetujui Oleh:</span>
                    <b className="uppercase">PETUGAS GUDANG LOGISTIK</b>
                  </div>
                  <div>
                    <div className="border-b border-black w-40 mx-auto"></div>
                    <span className="font-bold text-[11px] block mt-1">{previewSweeping.ttdGudangName || 'Admin Gudang UP3'}</span>
                    <span className="text-[10px] text-slate-500">PLN UP3 Banten Selatan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
