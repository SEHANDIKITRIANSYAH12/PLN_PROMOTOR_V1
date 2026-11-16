'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { 
  HS_WO_PAKET_1_DATA, 
  HS_WO_PAKET_2_DATA,
  HsWoRowItem
} from '@/data/hsWoMasterData';
import {
  Search,
  Filter,
  Edit3,
  RotateCcw,
  Download,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  Coins
} from 'lucide-react';

export const MasterKhsView: React.FC = () => {
  const { customKhsPrices, updateKhsPrice, resetKhsPrice, resetAllKhsPrices } = usePromotorStore();

  const [activeTab, setActiveTab] = useState<'paket1' | 'paket2'>('paket1');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubKategori, setSelectedSubKategori] = useState<string>('ALL');
  const [kategoriFilter, setKategoriFilter] = useState<'ALL' | 'MATERIAL' | 'JASA'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CUSTOM'>('ALL');
  const [viewMode, setViewMode] = useState<'sheet' | 'paginated'>('sheet');

  // Pagination for paginated mode
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<{
    id: string;
    no: string;
    nomorMaterial: string;
    uraian: string;
    sat: string;
    defaultPrice: number;
    currentPrice: number;
  } | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  // Active raw dataset
  const activeDataset: HsWoRowItem[] = useMemo(() => {
    return activeTab === 'paket1' ? HS_WO_PAKET_1_DATA : HS_WO_PAKET_2_DATA;
  }, [activeTab]);

  // Distinct sub-kategori for filter pills
  const subKategoris = useMemo(() => {
    const set = new Set<string>();
    activeDataset.forEach((it) => {
      if (it.subKategori && it.subKategori.trim() && it.subKategori !== 'KELOMPOK MATERIAL' && it.subKategori !== 'KELOMPOK JASA') {
        set.add(it.subKategori.trim());
      }
    });
    return Array.from(set);
  }, [activeDataset]);

  // Item counts
  const totalItems = useMemo(() => {
    return activeDataset.filter((i) => !i.isHeader).length;
  }, [activeDataset]);

  const totalMaterialCount = useMemo(() => {
    return activeDataset.filter((i) => !i.isHeader && i.kategori === 'MATERIAL').length;
  }, [activeDataset]);

  const totalJasaCount = useMemo(() => {
    return activeDataset.filter((i) => !i.isHeader && i.kategori === 'JASA').length;
  }, [activeDataset]);

  const customItemsInTab = useMemo(() => {
    return activeDataset.filter((i) => !i.isHeader && customKhsPrices[i.id] !== undefined).length;
  }, [activeDataset, customKhsPrices]);

  const totalCustomAcrossAll = useMemo(() => {
    return Object.keys(customKhsPrices).length;
  }, [customKhsPrices]);

  // Filtered rows for Sheet / Interactive view
  const filteredRows = useMemo(() => {
    if (!searchTerm && selectedSubKategori === 'ALL' && kategoriFilter === 'ALL' && statusFilter === 'ALL') {
      return activeDataset;
    }

    const q = searchTerm.toLowerCase();

    return activeDataset.filter((item) => {
      // Sub-kategori filter
      if (selectedSubKategori !== 'ALL' && item.subKategori !== selectedSubKategori) {
        return false;
      }

      // Kategori filter (MATERIAL / JASA)
      if (kategoriFilter !== 'ALL' && !item.isHeader && item.kategori !== kategoriFilter) {
        return false;
      }

      // Status filter (Adendum)
      if (statusFilter === 'CUSTOM' && (item.isHeader || customKhsPrices[item.id] === undefined)) {
        return false;
      }

      // Search term
      if (q) {
        const matchUraian = item.uraian.toLowerCase().includes(q);
        const matchNo = item.no.toLowerCase().includes(q);
        const matchKode = item.nomorMaterial.toLowerCase().includes(q);
        const matchKet = item.keterangan.toLowerCase().includes(q);
        if (!matchUraian && !matchNo && !matchKode && !matchKet) {
          return false;
        }
      }

      return true;
    });
  }, [activeDataset, searchTerm, selectedSubKategori, kategoriFilter, statusFilter, customKhsPrices]);

  // Paginated items for 'paginated' mode (only non-headers)
  const paginatedRows = useMemo(() => {
    const nonHeaders = filteredRows.filter((r) => !r.isHeader);
    const start = (currentPage - 1) * pageSize;
    return nonHeaders.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.ceil(
    (viewMode === 'paginated' 
      ? filteredRows.filter((r) => !r.isHeader).length 
      : filteredRows.length) / pageSize
  ) || 1;

  // Open Edit Modal
  const handleOpenEdit = (item: HsWoRowItem) => {
    const currentPrice = customKhsPrices[item.id] !== undefined ? customKhsPrices[item.id] : item.hargaSatuan;
    setEditingItem({
      id: item.id,
      no: item.no,
      nomorMaterial: item.nomorMaterial,
      uraian: item.uraian,
      sat: item.sat,
      defaultPrice: item.hargaSatuan,
      currentPrice,
    });
    setEditPriceInput(currentPrice.toString());
    setEditReason('');
  };

  // Save Edit Price
  const handleSavePrice = () => {
    if (!editingItem) return;
    const num = parseFloat(editPriceInput.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num < 0) {
      alert('Harap masukkan angka harga yang valid');
      return;
    }
    updateKhsPrice(editingItem.id, num, editReason.trim() || undefined);
    setEditingItem(null);
  };

  // Print sheet
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['No', 'Nomor Material', 'Uraian Material & Jasa', 'Satuan', 'Kategori', 'Harga Satuan Standar 2026 (Rp)', 'Harga Satuan Aktif (Rp)', 'Keterangan', 'Status'],
      ...activeDataset.map((it) => {
        if (it.isHeader) {
          return [it.no || '', '', `"${it.uraian.replace(/"/g, '""')}"`, '', 'HEADER', '', '', '', 'HEADER'];
        }
        const isCustom = customKhsPrices[it.id] !== undefined;
        const activePrice = isCustom ? customKhsPrices[it.id] : it.hargaSatuan;
        return [
          it.no || '',
          it.nomorMaterial || '',
          `"${it.uraian.replace(/"/g, '""')}"`,
          it.sat,
          it.kategori,
          it.hargaSatuan.toString(),
          activePrice.toString(),
          it.keterangan || '',
          isCustom ? 'Diset Khusus (Adendum)' : 'Standar KHS 2026'
        ];
      })
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_HS_${activeTab === 'paket1' ? 'WO_Paket_1_SUTM_SKTM_Gardu' : 'WO_Paket_2_SUTR_SKTR_BoxAPP'}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls & Navigation (Hidden on Print) */}
      <div className="print:hidden space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-sky-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Katalog Resmi Harga Satuan Work Order (HS WO 2026)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PLN UID BANTEN • UP3 BANTEN SELATAN
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Master HS WO Paket 1 dan 2
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Katalog rincian harga satuan material dan jasa Work Order Pengadaan Paket 1 dan Paket 2 PLN Banten 2026. Data bersumber langsung dari sheet <b>WO PAKET 1</b> dan <b>WO PAKET 2</b> pada dokumen KHS Excel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {totalCustomAcrossAll > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin mengembalikan SEMUA (${totalCustomAcrossAll}) penyesuaian harga adendum ke standar awal KHS 2026?`)) {
                      resetAllKhsPrices();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Semua Adendum ({totalCustomAcrossAll})
                </button>
              )}

              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 backdrop-blur-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                Cetak / Simpan PDF
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 backdrop-blur-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-400" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher: WO Paket 1 vs WO Paket 2 */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-3">
          <button
            onClick={() => {
              setActiveTab('paket1');
              setSelectedSubKategori('ALL');
              setKategoriFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'paket1'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            WO PAKET 1: Jasa Konstruksi SKTM, SUTM & Gardu (Tegangan Menengah)
            <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              {HS_WO_PAKET_1_DATA.filter((i) => !i.isHeader).length} Item
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('paket2');
              setSelectedSubKategori('ALL');
              setKategoriFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'paket2'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            WO PAKET 2: Jasa Konstruksi SKTR, SUTR & Box APP (Tegangan Rendah)
            <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
              {HS_WO_PAKET_2_DATA.filter((i) => !i.isHeader).length} Item
            </span>
          </button>
        </div>

        {/* Filters and View Controls Bar */}
        <div className="bg-white p-4 rounded-b-xl border-x border-b border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari uraian material, nomor material, atau pekerjaan..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            {/* Kategori Filter (Material vs Jasa) */}
            <div>
              <select
                value={kategoriFilter}
                onChange={(e) => {
                  setKategoriFilter(e.target.value as typeof kategoriFilter);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="ALL">Semua Kategori (Material & Jasa)</option>
                <option value="MATERIAL">Hanya Material ({totalMaterialCount})</option>
                <option value="JASA">Hanya Jasa ({totalJasaCount})</option>
              </select>
            </div>

            {/* Sub-kategori filter */}
            <div>
              <select
                value={selectedSubKategori}
                onChange={(e) => {
                  setSelectedSubKategori(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">Semua Sub-Kelompok</option>
                {subKategoris.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">Semua Status Harga</option>
                <option value="CUSTOM">Hanya Harga Adendum ({customItemsInTab})</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Pills */}
          {subKategoris.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 text-xs">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Sub-Kelompok:
              </span>
              <button
                onClick={() => {
                  setSelectedSubKategori('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full font-semibold transition shrink-0 cursor-pointer ${
                  selectedSubKategori === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({totalItems})
              </button>
              {subKategoris.slice(0, 6).map((sub) => {
                const count = activeDataset.filter((i) => !i.isHeader && i.subKategori === sub).length;
                return (
                  <button
                    key={sub}
                    onClick={() => {
                      setSelectedSubKategori(sub);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-full font-semibold transition shrink-0 cursor-pointer ${
                      selectedSubKategori === sub
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sub} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* View Mode Toggle & Counter */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>Menampilkan <b>{filteredRows.filter((r) => !r.isHeader).length}</b> dari total <b>{totalItems}</b> item ({totalMaterialCount} Material, {totalJasaCount} Jasa)</span>
              {customItemsInTab > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {customItemsInTab} Harga Adendum
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600">Mode Tampilan:</span>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode('sheet')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    viewMode === 'sheet'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Format Sheet Asli Excel
                </button>
                <button
                  onClick={() => {
                    setViewMode('paginated');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    viewMode === 'paginated'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tabel Paginated
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Document / Sheet Paper Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Official PLN Document Header Block (Persis Format Sheet Excel) */}
        <div className="p-6 border-b-2 border-black bg-white print:p-0">
          <div className="flex items-start justify-between pb-3 border-b border-black">
            <div className="flex items-center gap-3">
              <img
                src="/Logo_PLN.png"
                alt="Logo PLN"
                className="h-10 w-auto object-contain shrink-0"
              />
              <div>
                <div className="font-bold text-sm tracking-wide text-black">PT. PLN (PERSERO)</div>
                <div className="font-bold text-sm tracking-wide text-black">UID BANTEN • UP3 BANTEN SELATAN</div>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-mono">
              <div>KHS TAHUN 2026</div>
              <div>SHEET: {activeTab === 'paket1' ? 'WO PAKET 1' : 'WO PAKET 2'}</div>
            </div>
          </div>

          {/* Document Title Block Centered */}
          <div className="text-center py-3 space-y-1">
            <h2 className="font-extrabold text-base uppercase text-black tracking-wide">
              {activeTab === 'paket1'
                ? 'WORK ORDER JASA PEMASARAN PAKET 1 UP3 BANTEN SELATAN'
                : 'WORK ORDER JASA PEMASARAN PAKET 2 UP3 BANTEN SELATAN'}
            </h2>
            <h3 className="font-bold text-xs text-black">
              {activeTab === 'paket1'
                ? 'PENGADAAN PEKERJAAN JASA KONSTRUKSI PAKET 1 (SKTM, SUTM, SIPIL GARDU DAN JEMBATAN KABEL, INSTALASI GARDU)'
                : 'PENGADAAN PEKERJAAN JASA KONSTRUKSI PAKET 2 (SKTR, SUTR, DAN BOX APP)'}
            </h3>
            <p className="font-semibold text-xs text-slate-600 pt-0.5 italic">
              Harga Satuan Pekerjaan & Material (Belum Termasuk PPN 11%)
            </p>
          </div>
        </div>

        {/* Master HS Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border-2 border-black bg-white">
            {/* Table Header matching Excel Column Colors */}
            <thead>
              <tr className="bg-[#B4C6E7] text-black font-bold border-b-2 border-black divide-x-2 divide-black">
                <th className="py-2.5 px-3 w-14 text-center">
                  NO
                </th>
                <th className="py-2.5 px-3 w-28 text-center font-mono">
                  NOMOR MATERIAL
                </th>
                <th className="py-2.5 px-4 min-w-[340px] text-center">
                  URAIAN MATERIAL & JASA
                </th>
                <th className="py-2.5 px-3 w-16 text-center">
                  SAT
                </th>
                <th className="py-2.5 px-3 w-24 text-center">
                  KATEGORI
                </th>
                <th className="py-2.5 px-4 w-44 text-center">
                  HARGA SATUAN (RP)
                </th>
                <th className="py-2.5 px-3 w-32 text-center">
                  KETERANGAN
                </th>
                <th className="py-2.5 px-3 w-20 text-center print:hidden">
                  AKSI
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black text-black">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 italic">
                    Tidak ada item atau sub-kelompok yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                (viewMode === 'paginated' ? paginatedRows : filteredRows).map((item) => {
                  const isCustom = customKhsPrices[item.id] !== undefined;
                  const activePrice = isCustom ? customKhsPrices[item.id] : item.hargaSatuan;

                  // 1. SECTION ROMAN HEADER (e.g. I. KELOMPOK MATERIAL / II. KELOMPOK JASA)
                  if (item.headerLevel === 'SECTION_ROMAN') {
                    return (
                      <tr key={item.id} className="bg-[#B4C6E7] border-y-2 border-black font-bold">
                        <td className="py-2 px-3 text-center border-r-2 border-black font-bold text-sm">
                          {item.no}
                        </td>
                        <td className="py-2 px-4 border-r-2 border-black font-bold uppercase tracking-wide text-sm" colSpan={6}>
                          {item.uraian}
                        </td>
                        <td className="py-2 px-2 border-r border-black print:hidden" />
                      </tr>
                    );
                  }

                  // 2. GROUP LETTER HEADER (e.g. A. MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN)
                  if (item.headerLevel === 'GROUP_LETTER') {
                    return (
                      <tr key={item.id} className="bg-slate-100 font-bold border-t-2 border-black">
                        <td className="py-1.5 px-3 text-center border-r-2 border-black font-bold">
                          {item.no}
                        </td>
                        <td className="py-1.5 px-4 border-r-2 border-black font-bold uppercase text-xs text-slate-900" colSpan={6}>
                          {item.uraian}
                        </td>
                        <td className="py-1.5 px-2 border-r border-black print:hidden" />
                      </tr>
                    );
                  }

                  // 3. REGULAR ITEM ROW (Material / Jasa)
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-blue-50/50 transition-colors divide-x divide-slate-300 ${
                        isCustom ? 'bg-amber-50/70 font-semibold' : ''
                      }`}
                    >
                      {/* NO */}
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-mono text-slate-700">
                        {item.no || '-'}
                      </td>

                      {/* NOMOR MATERIAL */}
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-mono font-bold text-slate-800 text-[11px]">
                        {item.nomorMaterial || '—'}
                      </td>

                      {/* URAIAN MATERIAL & JASA */}
                      <td className="py-2 px-4 border-r border-slate-300">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {item.uraian}
                        </div>
                        {item.subKategori && (
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                            {item.subKategori}
                          </div>
                        )}
                      </td>

                      {/* SATUAN */}
                      <td className="py-2 px-3 text-center border-r border-slate-300 font-semibold text-slate-600">
                        {item.sat || '—'}
                      </td>

                      {/* KATEGORI */}
                      <td className="py-2 px-3 text-center border-r border-slate-300 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.kategori === 'MATERIAL'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.kategori}
                        </span>
                      </td>

                      {/* HARGA SATUAN (RP) */}
                      <td className="py-2 px-4 text-right border-r border-slate-300 tabular-nums">
                        {activePrice > 0 ? (
                          <div>
                            <span className="font-bold text-slate-900">
                              Rp {activePrice.toLocaleString('id-ID')}
                            </span>
                            {isCustom && (
                              <div className="text-[10px] text-amber-700 font-normal italic">
                                Standar: Rp {item.hargaSatuan.toLocaleString('id-ID')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* KETERANGAN */}
                      <td className="py-2 px-3 text-center border-r border-slate-300 text-[11px] text-slate-600 font-medium">
                        {item.keterangan || (item.kategori === 'MATERIAL' ? 'LOG UP3 BTS' : 'Kontrak SPK')}
                      </td>

                      {/* AKSI EDIT HARGA */}
                      <td className="py-2 px-2 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-200 cursor-pointer"
                            title="Set Penyesuaian Harga Satuan (Adendum)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => resetKhsPrice(item.id)}
                              className="p-1.5 text-amber-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
                              title="Kembalikan ke Harga Awal KHS 2026"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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

        {/* Pagination in Paginated Mode */}
        {viewMode === 'paginated' && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 print:hidden bg-slate-50">
            <div>
              Halaman <b>{currentPage}</b> dari <b>{totalPages}</b> ({filteredRows.filter((r) => !r.isHeader).length} total item)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-50 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-50 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
              >
                Berikutnya <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDIT HARGA ADENDUM */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm">Penyesuaian Harga Satuan (Adendum)</h3>
                <p className="text-[11px] text-slate-300">
                  {editingItem.nomorMaterial ? `Nomor Material: ${editingItem.nomorMaterial}` : `Item No: ${editingItem.no}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Uraian Pekerjaan / Material:</span>
                <div className="font-bold text-slate-900 leading-snug">{editingItem.uraian}</div>
                <div className="text-slate-600 text-[11px] pt-1">
                  Satuan: <b className="text-slate-800">{editingItem.sat || '-'}</b> • Standar KHS: <b className="text-slate-800">Rp {editingItem.defaultPrice.toLocaleString('id-ID')}</b>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Harga Satuan Baru (Rp):
                </label>
                <input
                  type="number"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  placeholder="Masukkan nominal harga..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold font-mono text-sm bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Alasan / Dasar Adendum Kontrak:
                </label>
                <textarea
                  rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Contoh: Penyesuaian KHS Addendum II No. SPK..."
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePrice}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Simpan Harga Adendum
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
