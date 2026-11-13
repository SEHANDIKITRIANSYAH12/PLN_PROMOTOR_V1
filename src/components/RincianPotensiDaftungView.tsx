'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { calculateRabFromSurvey } from '@/data/rabMasterData';
import { 
  Users, 
  Boxes, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  ChevronDown, 
  Building2, 
  Layers, 
  ArrowUpDown,
  Sparkles,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  PackageCheck
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';

export interface PotensiCustomerMaterial {
  code: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface PotensiCustomerRecord {
  surveyId: string;
  customerName: string;
  idpel: string;
  location: string;
  ulp: string;
  daya: string;
  tarif: string;
  jobType: string;
  createdAt: string;
  materials: PotensiCustomerMaterial[];
  totalQty: number;
  totalCost: number;
}

export const RincianPotensiDaftungView: React.FC = () => {
  const { 
    surveys, 
    daftungs, 
    stocks, 
    customKhsPrices, 
    materialCodeMap, 
    setCurrentPage, 
    showToast 
  } = usePromotorStore();

  const [activeTab, setActiveTab] = useState<'PELANGGAN' | 'MATERIAL'>('PELANGGAN');
  const [searchTerm, setSearchTerm] = useState('');
  const [ulpFilter, setUlpFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  // Pagination State
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Ekstraksi Data Pelanggan Potensi Daftung (Survey yang belum bayar / belum masuk daftung berbayar)
  const potensiCustomers = useMemo(() => {
    const list: PotensiCustomerRecord[] = [];

    surveys.forEach((srv) => {
      // Cek apakah sudah bayar
      const matchedDaftung = daftungs.find(
        (d) => d.id === srv.id || d.idpel === srv.idpel || d.customerName.toLowerCase() === srv.customerName.toLowerCase()
      );
      const isPaid = srv.paymentStatus === 'Sudah Bayar' || Boolean(matchedDaftung);

      // Hanya ambil yang BELUM BAYAR (Potensi Daftung)
      if (isPaid) return;

      const p1Items = calculateRabFromSurvey(srv, 'paket1', customKhsPrices);
      const p2Items = calculateRabFromSurvey(srv, 'paket2', customKhsPrices);
      const allItems = [...p1Items, ...p2Items].filter((it) => !it.isHeader && it.section === 'MATERIAL');

      const materials: PotensiCustomerMaterial[] = [];
      let totalQty = 0;
      let totalCost = 0;

      allItems.forEach((it) => {
        let matCode = it.kode;
        if (materialCodeMap[it.id]) {
          matCode = materialCodeMap[it.id];
        } else if (it.kode && materialCodeMap[it.kode]) {
          matCode = materialCodeMap[it.kode];
        }

        const vol = it.rencanaVol || 0;
        if (vol > 0) {
          const matchedStock = stocks.find((s) => s.code === matCode || s.name.toLowerCase() === it.desc.toLowerCase());
          const category = matchedStock ? matchedStock.category : 'Distribusi';
          const unit = it.sat || matchedStock?.unit || 'Unit';
          const price = it.hargaSatuan || 0;
          const subtotal = vol * price;

          totalQty += vol;
          totalCost += subtotal;

          // Cek existing di array materials pelanggan ini
          const existing = materials.find((m) => m.code === (matCode || it.id));
          if (existing) {
            existing.qty += vol;
            existing.subtotal += subtotal;
          } else {
            materials.push({
              code: matCode || it.id || 'MAT-TEMP',
              name: it.desc,
              category,
              unit,
              qty: vol,
              price,
              subtotal,
            });
          }
        }
      });

      list.push({
        surveyId: srv.id,
        customerName: srv.customerName,
        idpel: srv.idpel || '—',
        location: srv.location || srv.address || '—',
        ulp: srv.ulp || 'ULP Pandeglang',
        daya: srv.dayaBaru || srv.daya || '—',
        tarif: srv.tarifBaru || srv.tarif || '—',
        jobType: srv.jobType || 'Pasang Baru',
        createdAt: srv.createdAt || '',
        materials,
        totalQty,
        totalCost,
      });
    });

    return list;
  }, [surveys, daftungs, stocks, customKhsPrices, materialCodeMap]);

  // 2. Akumulasi Agregat per Material (Berdasarkan Potensi Daftung)
  const potensiMaterials = useMemo(() => {
    const map: Record<
      string,
      {
        code: string;
        name: string;
        category: string;
        unit: string;
        totalQty: number;
        customers: {
          surveyId: string;
          customerName: string;
          location: string;
          daya: string;
          qty: number;
          unit: string;
        }[];
      }
    > = {};

    potensiCustomers.forEach((cust) => {
      cust.materials.forEach((m) => {
        if (!map[m.code]) {
          map[m.code] = {
            code: m.code,
            name: m.name,
            category: m.category,
            unit: m.unit,
            totalQty: 0,
            customers: [],
          };
        }

        map[m.code].totalQty += m.qty;
        map[m.code].customers.push({
          surveyId: cust.surveyId,
          customerName: cust.customerName,
          location: cust.location,
          daya: cust.daya,
          qty: m.qty,
          unit: m.unit,
        });
      });
    });

    return Object.values(map);
  }, [potensiCustomers]);

  // Filter List ULP & Kategori Unik
  const ulpList = useMemo(() => {
    const set = new Set<string>();
    potensiCustomers.forEach((c) => {
      if (c.ulp && c.ulp !== '—') set.add(c.ulp);
    });
    return Array.from(set);
  }, [potensiCustomers]);

  const categoryList = useMemo(() => {
    const set = new Set<string>();
    potensiMaterials.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [potensiMaterials]);

  // Filter Data Tab 1 (Pelanggan)
  const filteredCustomers = useMemo(() => {
    return potensiCustomers.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        c.customerName.toLowerCase().includes(q) ||
        c.idpel.toLowerCase().includes(q) ||
        c.surveyId.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.materials.some((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));

      const matchUlp = ulpFilter === 'ALL' || c.ulp === ulpFilter;
      return matchSearch && matchUlp;
    });
  }, [potensiCustomers, searchTerm, ulpFilter]);

  // Filter Data Tab 2 (Material)
  const filteredMaterials = useMemo(() => {
    return potensiMaterials.filter((m) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.customers.some((c) => c.customerName.toLowerCase().includes(q));

      const matchCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [potensiMaterials, searchTerm, categoryFilter]);

  // Pagination Slice
  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice((currentPageNum - 1) * pageSize, currentPageNum * pageSize);
  }, [filteredCustomers, currentPageNum, pageSize]);

  const paginatedMaterials = useMemo(() => {
    return filteredMaterials.slice((currentPageNum - 1) * pageSize, currentPageNum * pageSize);
  }, [filteredMaterials, currentPageNum, pageSize]);

  // KPI Calculations
  const totalCalonPelanggan = potensiCustomers.length;
  const totalJenisMaterial = potensiMaterials.length;
  const totalVolumeMaterial = useMemo(() => {
    return potensiMaterials.reduce((acc, m) => acc + m.totalQty, 0);
  }, [potensiMaterials]);

  // Export ke Excel (.xls)
  const handleExportExcel = () => {
    let contentHtml = '';

    if (activeTab === 'PELANGGAN') {
      contentHtml = `
        <h2 style="font-family: Arial; color: #1E3A8A;">PT PLN (PERSERO) UP3 BANTEN SELATAN</h2>
        <h3 style="font-family: Arial; color: #0F172A;">LAPORAN RINCIAN MATERIAL PER PELANGGAN POTENSI DAFTUNG (SURVEY BELUM BAYAR)</h3>
        <p style="font-family: Arial; font-size: 11px; color: #475569;">
          Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | 
          Total Calon Pelanggan: ${filteredCustomers.length}
        </p>
        <table border="1" style="font-family: Arial; font-size: 11px; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #DBEAFE; font-weight: bold;">
              <th>NO</th>
              <th>NO SURVEY</th>
              <th>IDPEL</th>
              <th>NAMA PELANGGAN</th>
              <th>ULP</th>
              <th>LOKASI / ALAMAT</th>
              <th>DAYA & TARIF</th>
              <th>JENIS PEKERJAAN</th>
              <th>JUMLAH JENIS MATERIAL</th>
              <th>TOTAL VOLUME MATERIAL</th>
              <th>RINCIAN MATERIAL (KODE, NAMA, QTY, SATUAN)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredCustomers.map((c, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="font-family: Courier New; text-align: center;">${c.surveyId}</td>
                <td style="font-family: Courier New; text-align: center;">${c.idpel}</td>
                <td><b>${c.customerName}</b></td>
                <td>${c.ulp}</td>
                <td>${c.location}</td>
                <td style="text-align: center;">${c.tarif} / ${c.daya}</td>
                <td style="text-align: center;">${c.jobType}</td>
                <td style="text-align: center; font-weight: bold;">${c.materials.length} Item</td>
                <td style="text-align: right; font-weight: bold;">${c.totalQty}</td>
                <td>${c.materials.map((m) => `${m.code} - ${m.name} (${m.qty} ${m.unit})`).join('; ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      contentHtml = `
        <h2 style="font-family: Arial; color: #1E3A8A;">PT PLN (PERSERO) UP3 BANTEN SELATAN</h2>
        <h3 style="font-family: Arial; color: #0F172A;">LAPORAN AKUMULASI KEBUTUHAN MATERIAL POTENSI DAFTUNG</h3>
        <p style="font-family: Arial; font-size: 11px; color: #475569;">
          Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | 
          Total Jenis Material: ${filteredMaterials.length}
        </p>
        <table border="1" style="font-family: Arial; font-size: 11px; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #DBEAFE; font-weight: bold;">
              <th>NO</th>
              <th>NOMOR MATERIAL</th>
              <th>NAMA MATERIAL</th>
              <th>KATEGORI</th>
              <th>SATUAN</th>
              <th>TOTAL KEBUTUHAN POTENSI DAFTUNG</th>
              <th>JUMLAH PELANGGAN TERKAIT</th>
              <th>DAFTAR NAMA PELANGGAN</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMaterials.map((m, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="font-family: Courier New; font-weight: bold; text-align: center;">${m.code}</td>
                <td>${m.name}</td>
                <td style="text-align: center;">${m.category}</td>
                <td style="text-align: center;">${m.unit}</td>
                <td style="text-align: right; font-weight: bold;">${m.totalQty}</td>
                <td style="text-align: center; font-weight: bold;">${m.customers.length} Pelanggan</td>
                <td>${m.customers.map((c) => `${c.customerName} (${c.qty} ${c.unit})`).join('; ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const tableFull = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Potensi Daftung</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>${contentHtml}</body>
      </html>
    `;

    const blob = new Blob([tableFull], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rincian_Potensi_Daftung_${activeTab}_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Laporan Rincian Potensi Daftung berhasil diexport ke Excel (.xls)');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Modern PLN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Persediaan & Perencanaan Material
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Stok Gudang ➔ <b className="text-blue-700">Rincian Potensi Daftung</b>
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Rincian Potensi Daftung (Survey Belum Bayar)</h2>
          <p className="text-xs text-slate-500">
            Monitoring kebutuhan material dan daftar nama calon pelanggan dari hasil survey lapangan yang belum melakukan pembayaran (proyeksi kebutuhan masa depan).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            title="Download laporan dalam format Microsoft Excel (.xls)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak
          </button>
        </div>
      </div>

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Calon Pelanggan (Survey)</span>
            <div className="text-2xl font-black text-blue-900">{totalCalonPelanggan} <span className="text-xs font-normal text-slate-400">Pelanggan</span></div>
            <span className="text-[11px] text-blue-600 font-medium mt-1 inline-flex items-center gap-1">
              <Users className="w-3 h-3" /> Status Belum Bayar BP
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Jenis Material Dibutuhkan</span>
            <div className="text-2xl font-black text-amber-900">{totalJenisMaterial} <span className="text-xs font-normal text-slate-400">Macam Item</span></div>
            <span className="text-[11px] text-amber-700 font-medium mt-1 inline-flex items-center gap-1">
              <Boxes className="w-3 h-3" /> Berdasarkan RAB Konstruksi
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Total Kuantitas Fisik</span>
            <div className="text-2xl font-black text-emerald-900">{totalVolumeMaterial.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Volume</span></div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-flex items-center gap-1">
              <PackageCheck className="w-3 h-3" /> Proyeksi Kebutuhan Gudang
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Tab Navigation: Per Pelanggan vs Per Material */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 pt-3 bg-slate-50/50">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('PELANGGAN');
                setCurrentPageNum(1);
              }}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'PELANGGAN'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Rincian per Pelanggan ({filteredCustomers.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('MATERIAL');
                setCurrentPageNum(1);
              }}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'MATERIAL'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" /> Rincian per Material ({filteredMaterials.length})
            </button>
          </div>

          <span className="text-[11px] text-slate-400 pb-3 font-medium hidden sm:inline">
            {activeTab === 'PELANGGAN' ? 'Klik baris pelanggan untuk melihat rincian material' : 'Klik baris material untuk melihat daftar pelanggan'}
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'PELANGGAN' ? "Cari nama pelanggan, IDPEL, atau survey..." : "Cari nomor material atau nama material..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {activeTab === 'PELANGGAN' && ulpList.length > 0 && (
              <select
                value={ulpFilter}
                onChange={(e) => {
                  setUlpFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 shadow-2xs font-medium cursor-pointer"
              >
                <option value="ALL">Semua ULP ({ulpList.length})</option>
                {ulpList.map((ulp) => (
                  <option key={ulp} value={ulp}>{ulp}</option>
                ))}
              </select>
            )}

            {activeTab === 'MATERIAL' && categoryList.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 shadow-2xs font-medium cursor-pointer"
              >
                <option value="ALL">Semua Kategori ({categoryList.length})</option>
                {categoryList.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            {(searchTerm || ulpFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setUlpFilter('ALL');
                  setCategoryFilter('ALL');
                  setCurrentPageNum(1);
                }}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* TABEL VIEW 1: PER PELANGGAN */}
        {activeTab === 'PELANGGAN' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-blue-100/80 border-b border-blue-200 text-slate-900 uppercase font-bold text-[11px] tracking-wider">
                <tr className="divide-x divide-blue-200">
                  <th className="p-3 px-3.5 w-12 text-center">NO</th>
                  <th className="p-3 px-4 w-32 font-mono text-center">NO. SURVEY</th>
                  <th className="p-3 px-4 min-w-[220px]">NAMA PELANGGAN & IDPEL</th>
                  <th className="p-3 px-4 min-w-[200px]">LOKASI / ULP</th>
                  <th className="p-3 px-4 w-32 text-center">DAYA & TARIF</th>
                  <th className="p-3 px-4 w-32 text-center">JENIS PEKERJAAN</th>
                  <th className="p-3 px-4 w-36 text-center bg-blue-200/70 text-blue-950 font-bold">
                    JUMLAH MATERIAL
                  </th>
                  <th className="p-3 px-4 w-28 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada data calon pelanggan potensi daftung yang sesuai.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c, idx) => {
                    const isExpanded = expandedCustomer === c.surveyId;

                    return (
                      <React.Fragment key={c.surveyId}>
                        <tr 
                          onClick={() => setExpandedCustomer(isExpanded ? null : c.surveyId)}
                          className={`hover:bg-blue-50/40 transition-colors divide-x divide-slate-200 cursor-pointer ${
                            isExpanded ? 'bg-blue-50/60 font-medium' : ''
                          }`}
                        >
                          <td className="p-3 px-3 text-center text-slate-500 font-mono">
                            {(currentPageNum - 1) * pageSize + idx + 1}
                          </td>
                          <td className="p-3 px-4 font-mono font-bold text-slate-700 text-center">
                            {c.surveyId}
                          </td>
                          <td className="p-3 px-4">
                            <div className="font-bold text-slate-900 text-xs">{c.customerName}</div>
                            {c.idpel !== '—' && (
                              <span className="text-[10px] text-slate-400 font-mono">IDPEL: {c.idpel}</span>
                            )}
                          </td>
                          <td className="p-3 px-4 text-slate-600 text-[11px]">
                            <div className="truncate max-w-xs">{c.location}</div>
                            <span className="text-[10px] font-bold text-blue-700">{c.ulp}</span>
                          </td>
                          <td className="p-3 px-4 text-center font-mono">
                            <span className="font-bold text-slate-800">{c.daya}</span>
                            <span className="block text-[10px] text-slate-400">{c.tarif}</span>
                          </td>
                          <td className="p-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {c.jobType}
                            </span>
                          </td>
                          <td className="p-3 px-4 text-center bg-blue-50/50">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-800 text-xs">
                              <Boxes className="w-3.5 h-3.5 text-blue-600" />
                              {c.materials.length} Item Material
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              Total {c.totalQty} Volume
                            </span>
                          </td>
                          <td className="p-3 px-4 text-center">
                            <button
                              type="button"
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center justify-center gap-1 mx-auto transition ${
                                isExpanded
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span>{isExpanded ? 'Tutup' : 'Rincian'}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                        </tr>

                        {/* ACCORDION BARIS RINCIAN MATERIAL PELANGGAN */}
                        {isExpanded && (
                          <tr className="bg-blue-50/30 border-b border-blue-200">
                            <td colSpan={8} className="p-4 px-6">
                              <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                  <div>
                                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                      <Boxes className="w-4 h-4 text-blue-600" />
                                      Rincian Material RAB Survey: <span className="text-blue-700">{c.customerName}</span>
                                    </h4>
                                    <p className="text-[10.5px] text-slate-500">
                                      Material yang akan dibutuhkan saat calon pelanggan ini melunasi pembayaran (masuk Daftung)
                                    </p>
                                  </div>
                                  <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                                    {c.materials.length} Macam Material
                                  </span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                                      <tr>
                                        <th className="py-2 px-3 text-center w-10">No</th>
                                        <th className="py-2 px-3 w-32 font-mono">Nomor Material</th>
                                        <th className="py-2 px-3">Nama Material</th>
                                        <th className="py-2 px-3 text-center">Kategori</th>
                                        <th className="py-2 px-3 text-center">Satuan</th>
                                        <th className="py-2 px-3 text-right">Volume Kebutuhan</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {c.materials.map((m, mIdx) => (
                                        <tr key={mIdx} className="hover:bg-slate-50/80">
                                          <td className="py-2 px-3 text-slate-400 font-mono text-center">{mIdx + 1}</td>
                                          <td className="py-2 px-3 font-mono font-bold text-slate-800 text-[11px]">{m.code}</td>
                                          <td className="py-2 px-3 font-medium text-slate-900">{m.name}</td>
                                          <td className="py-2 px-3 text-center text-slate-500">{m.category}</td>
                                          <td className="py-2 px-3 text-center text-slate-600">{m.unit}</td>
                                          <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">
                                            {m.qty.toLocaleString('id-ID')} {m.unit}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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
        )}

        {/* TABEL VIEW 2: PER MATERIAL */}
        {activeTab === 'MATERIAL' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-blue-100/80 border-b border-blue-200 text-slate-900 uppercase font-bold text-[11px] tracking-wider">
                <tr className="divide-x divide-blue-200">
                  <th className="p-3 px-3.5 w-12 text-center">NO</th>
                  <th className="p-3 px-4 w-36 font-mono text-center">NOMOR MATERIAL</th>
                  <th className="p-3 px-4 min-w-[260px]">NAMA MATERIAL</th>
                  <th className="p-3 px-4 w-28 text-center">KATEGORI</th>
                  <th className="p-3 px-4 w-24 text-center">SATUAN</th>
                  <th className="p-3 px-4 w-44 text-right bg-blue-200/70 text-blue-950 font-bold">
                    TOTAL KEBUTUHAN (SURVEY)
                  </th>
                  <th className="p-3 px-4 w-36 text-center">JUMLAH PELANGGAN</th>
                  <th className="p-3 px-4 w-28 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada material potensi daftung yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  paginatedMaterials.map((m, idx) => {
                    const isExpanded = expandedMaterial === m.code;

                    return (
                      <React.Fragment key={m.code}>
                        <tr 
                          onClick={() => setExpandedMaterial(isExpanded ? null : m.code)}
                          className={`hover:bg-blue-50/40 transition-colors divide-x divide-slate-200 cursor-pointer ${
                            isExpanded ? 'bg-blue-50/60 font-medium' : ''
                          }`}
                        >
                          <td className="p-3 px-3 text-center text-slate-500 font-mono">
                            {(currentPageNum - 1) * pageSize + idx + 1}
                          </td>
                          <td className="p-3 px-4 font-mono font-bold text-slate-800 text-[11px] text-center bg-slate-50/50">
                            {m.code}
                          </td>
                          <td className="p-3 px-4 font-bold text-slate-900">
                            {m.name}
                          </td>
                          <td className="p-3 px-4 text-center text-slate-600">
                            {m.category}
                          </td>
                          <td className="p-3 px-4 text-center text-slate-600 font-medium">
                            {m.unit}
                          </td>
                          <td className="p-3 px-4 text-right font-mono font-black text-blue-900 bg-blue-50/50 text-sm">
                            {m.totalQty.toLocaleString('id-ID')} <span className="text-[10px] text-slate-500 font-normal">{m.unit}</span>
                          </td>
                          <td className="p-3 px-4 text-center font-bold text-slate-700">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              <Users className="w-3 h-3 text-blue-600" />
                              {m.customers.length} Pelanggan
                            </span>
                          </td>
                          <td className="p-3 px-4 text-center">
                            <button
                              type="button"
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center justify-center gap-1 mx-auto transition ${
                                isExpanded
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span>{isExpanded ? 'Tutup' : 'Pelanggan'}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                        </tr>

                        {/* ACCORDION BARIS RINCIAN PELANGGAN YANG MEMBUTUHKAN MATERIAL INI */}
                        {isExpanded && (
                          <tr className="bg-blue-50/30 border-b border-blue-200">
                            <td colSpan={8} className="p-4 px-6">
                              <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                  <div>
                                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                      <Users className="w-4 h-4 text-blue-600" />
                                      Daftar Calon Pelanggan: <span className="text-blue-700 font-mono">{m.name} ({m.code})</span>
                                    </h4>
                                    <p className="text-[10.5px] text-slate-500">
                                      Calon pelanggan survey yang membutuhkan alokasi material ini
                                    </p>
                                  </div>
                                  <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                                    Total: {m.totalQty} {m.unit}
                                  </span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                                      <tr>
                                        <th className="py-2 px-3 text-center w-10">No</th>
                                        <th className="py-2 px-3">Nama Pelanggan</th>
                                        <th className="py-2 px-3">No Survey</th>
                                        <th className="py-2 px-3">Lokasi / Alamat</th>
                                        <th className="py-2 px-3 text-center">Daya</th>
                                        <th className="py-2 px-3 text-right">Volume Kebutuhan</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {m.customers.map((c, cIdx) => (
                                        <tr key={cIdx} className="hover:bg-slate-50/80">
                                          <td className="py-2 px-3 text-slate-400 font-mono text-center">{cIdx + 1}</td>
                                          <td className="py-2 px-3 font-bold text-slate-900">{c.customerName}</td>
                                          <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{c.surveyId}</td>
                                          <td className="py-2 px-3 text-slate-600 text-[11px]">{c.location}</td>
                                          <td className="py-2 px-3 text-center font-mono text-slate-700">{c.daya}</td>
                                          <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">
                                            {c.qty.toLocaleString('id-ID')} {c.unit}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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
        )}

        {/* Paginasi Footer */}
        <div className="print:hidden">
          <Pagination
            currentPage={currentPageNum}
            totalItems={activeTab === 'PELANGGAN' ? filteredCustomers.length : filteredMaterials.length}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPageNum}
            onItemsPerPageChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      </div>
    </div>
  );
};

