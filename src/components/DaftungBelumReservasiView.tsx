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
  Clock, 
  Layers, 
  AlertTriangle,
  CheckCircle2,
  PackageSearch,
  MapPin,
  Zap
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';

export interface DaftungMaterialItem {
  code: string;
  name: string;
  category: string;
  unit: string;
  qtyDaftung: number;
  qtyReservasi: number;
  qtySisaBelumReservasi: number;
  stokGudang: number;
  statusKetersediaan: 'AMAN' | 'DEFISIT';
}

export interface DaftungPelangganRecord {
  daftungId: string;
  surveyId?: string;
  idpel: string;
  customerName: string;
  location: string;
  ulp: string;
  daya: string;
  tarif: string;
  woIssued: string;
  matchedWoId?: string;
  woStatus?: string;
  nidi: boolean;
  slo: boolean;
  materials: DaftungMaterialItem[];
  totalItemBelumReservasi: number;
  totalVolumeBelumReservasi: number;
}

export const DaftungBelumReservasiView: React.FC = () => {
  const { 
    surveys, 
    daftungs, 
    workOrders, 
    stocks, 
    customKhsPrices, 
    materialCodeMap, 
    showToast 
  } = usePromotorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  // Pagination State
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Ekstraksi Data Pelanggan Daftung yang Belum Reservasi Penuh
  const daftungPelangganList = useMemo(() => {
    const list: DaftungPelangganRecord[] = [];

    // Gabungkan pelanggan yang berstatus 'Sudah Bayar' atau ada di daftungs
    const paidSurveys = surveys.filter((s) => {
      const inDaftung = daftungs.some(
        (d) => d.id === s.id || d.idpel === s.idpel || d.customerName.toLowerCase() === s.customerName.toLowerCase()
      );
      return s.paymentStatus === 'Sudah Bayar' || inDaftung;
    });

    paidSurveys.forEach((srv) => {
      const matchedDaftung = daftungs.find(
        (d) => d.id === srv.id || d.idpel === srv.idpel || d.customerName.toLowerCase() === srv.customerName.toLowerCase()
      );

      // Cari Work Order terkait jika ada
      const matchedWo = workOrders.find(
        (wo) =>
          wo.id === matchedDaftung?.woIssued ||
          wo.surveyId === srv.id ||
          (wo.idpel && srv.idpel && wo.idpel === srv.idpel) ||
          wo.customerName.toLowerCase() === srv.customerName.toLowerCase()
      );

      // Hitung kebutuhan material dari RAB
      const p1Items = calculateRabFromSurvey(srv, 'paket1', customKhsPrices);
      const p2Items = calculateRabFromSurvey(srv, 'paket2', customKhsPrices);
      const allItems = [...p1Items, ...p2Items].filter((it) => !it.isHeader && it.section === 'MATERIAL');

      const materials: DaftungMaterialItem[] = [];
      let totalItemBelumReservasi = 0;
      let totalVolumeBelumReservasi = 0;

      allItems.forEach((it) => {
        let matCode = it.kode;
        if (materialCodeMap[it.id]) {
          matCode = materialCodeMap[it.id];
        } else if (it.kode && materialCodeMap[it.kode]) {
          matCode = materialCodeMap[it.kode];
        }

        const qtyDaftung = it.rencanaVol || 0;
        if (qtyDaftung > 0) {
          // Cek berapa yang sudah dialokasikan / direservasi di WO
          let qtyReservasi = 0;
          if (matchedWo && matchedWo.materials && matchedWo.materials.length > 0) {
            const woMat = matchedWo.materials.find(
              (m) =>
                m.material === matCode ||
                (m.kode && m.kode === matCode) ||
                m.material.toLowerCase() === it.desc.toLowerCase()
            );
            if (woMat) {
              qtyReservasi = woMat.qtyAllocated || woMat.qtyReksis || 0;
            }
          }

          const qtySisaBelumReservasi = Math.max(0, qtyDaftung - qtyReservasi);

          // Ambil stok gudang
          const matchedStock = stocks.find((s) => s.code === matCode || s.name.toLowerCase() === it.desc.toLowerCase());
          const stokGudang = matchedStock ? matchedStock.qtyFisik : 0;
          const statusKetersediaan: 'AMAN' | 'DEFISIT' = stokGudang >= qtySisaBelumReservasi ? 'AMAN' : 'DEFISIT';

          if (qtySisaBelumReservasi > 0) {
            totalItemBelumReservasi += 1;
            totalVolumeBelumReservasi += qtySisaBelumReservasi;
          }

          materials.push({
            code: matCode || it.id || 'MAT-TEMP',
            name: it.desc,
            category: matchedStock?.category || 'Distribusi',
            unit: it.sat || matchedStock?.unit || 'Unit',
            qtyDaftung,
            qtyReservasi,
            qtySisaBelumReservasi,
            stokGudang,
            statusKetersediaan,
          });
        }
      });

      // Masukkan pelanggan jika masih ada sisa material yang belum direservasi
      // atau belum terbit WO sama sekali
      const isBelumReservasiPenuh = totalVolumeBelumReservasi > 0 || !matchedWo || matchedWo.status === 'Draf';

      if (isBelumReservasiPenuh && materials.length > 0) {
        list.push({
          daftungId: matchedDaftung?.id || srv.id,
          surveyId: srv.id,
          idpel: srv.idpel || '—',
          customerName: srv.customerName,
          location: srv.location || srv.address || '—',
          ulp: srv.ulp || 'ULP Pandeglang',
          daya: srv.dayaBaru || srv.daya || '—',
          tarif: srv.tarifBaru || srv.tarif || '—',
          woIssued: matchedDaftung?.woIssued || (matchedWo ? matchedWo.id : 'Belum Terbit'),
          matchedWoId: matchedWo?.id,
          woStatus: matchedWo?.status || 'Belum Terbit WO',
          nidi: matchedDaftung ? matchedDaftung.nidi : Boolean(srv.nidi),
          slo: matchedDaftung ? matchedDaftung.slo : Boolean(srv.slo),
          materials,
          totalItemBelumReservasi,
          totalVolumeBelumReservasi,
        });
      }
    });

    return list;
  }, [surveys, daftungs, workOrders, stocks, customKhsPrices, materialCodeMap]);

  // 2. Akumulasi Agregat per Material (Sisa Daftung Belum Reservasi)
  const daftungMaterialList = useMemo(() => {
    const map: Record<
      string,
      {
        code: string;
        name: string;
        category: string;
        unit: string;
        totalDaftung: number;
        totalReservasi: number;
        totalSisaBelumReservasi: number;
        stokGudang: number;
        safetyStock: number;
        statusKetersediaan: 'AMAN' | 'DEFISIT';
        customers: {
          customerName: string;
          idpel: string;
          location: string;
          ulp?: string;
          daya?: string;
          tarif?: string;
          woIssued?: string;
          matchedWoId?: string;
          woStatus?: string;
          qtyDaftung: number;
          qtyReservasi: number;
          qtySisa: number;
          unit: string;
        }[];
      }
    > = {};

    daftungPelangganList.forEach((cust) => {
      cust.materials.forEach((m) => {
        if (!map[m.code]) {
          const matchedStock = stocks.find((s) => s.code === m.code);
          const stokGudang = matchedStock ? matchedStock.qtyFisik : m.stokGudang;

          map[m.code] = {
            code: m.code,
            name: m.name,
            category: m.category,
            unit: m.unit,
            totalDaftung: 0,
            totalReservasi: 0,
            totalSisaBelumReservasi: 0,
            stokGudang,
            safetyStock: 0,
            statusKetersediaan: 'AMAN',
            customers: [],
          };
        }

        map[m.code].totalDaftung += m.qtyDaftung;
        map[m.code].totalReservasi += m.qtyReservasi;
        map[m.code].totalSisaBelumReservasi += m.qtySisaBelumReservasi;

        if (m.qtySisaBelumReservasi > 0) {
          map[m.code].customers.push({
            customerName: cust.customerName,
            idpel: cust.idpel,
            location: cust.location,
            ulp: cust.ulp,
            daya: cust.daya,
            tarif: cust.tarif,
            woIssued: cust.woIssued,
            matchedWoId: cust.matchedWoId,
            woStatus: cust.woStatus,
            qtyDaftung: m.qtyDaftung,
            qtyReservasi: m.qtyReservasi,
            qtySisa: m.qtySisaBelumReservasi,
            unit: m.unit,
          });
        }
      });
    });

    // Hitung safety stock per material: stokGudang - totalSisaBelumReservasi
    Object.values(map).forEach((item) => {
      item.safetyStock = item.stokGudang - item.totalSisaBelumReservasi;
      item.statusKetersediaan = item.safetyStock >= 0 ? 'AMAN' : 'DEFISIT';
    });

    // Hanya tampilkan material yang memiliki sisa antrean belum reservasi > 0
    return Object.values(map).filter((m) => m.totalSisaBelumReservasi > 0);
  }, [daftungPelangganList, stocks]);

  // List Kategori Unik
  const categoryList = useMemo(() => {
    const set = new Set<string>();
    daftungMaterialList.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [daftungMaterialList]);

  // Filter Data Material
  const filteredMaterials = useMemo(() => {
    return daftungMaterialList.filter((m) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.customers.some((c) => c.customerName.toLowerCase().includes(q) || c.idpel.toLowerCase().includes(q));

      const matchCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [daftungMaterialList, searchTerm, categoryFilter]);

  // Pagination Slice
  const paginatedMaterials = useMemo(() => {
    return filteredMaterials.slice((currentPageNum - 1) * pageSize, currentPageNum * pageSize);
  }, [filteredMaterials, currentPageNum, pageSize]);

  // KPI Ringkasan
  const totalPelangganMenunggu = daftungPelangganList.length;
  const totalItemBelumReservasi = daftungMaterialList.length;
  const totalVolumeMengantre = useMemo(() => {
    return daftungMaterialList.reduce((acc, m) => acc + m.totalSisaBelumReservasi, 0);
  }, [daftungMaterialList]);

  // Export Excel (.xls)
  const handleExportExcel = () => {
    const contentHtml = `
      <h2 style="font-family: Arial; color: #1E3A8A;">PT PLN (PERSERO) UP3 BANTEN SELATAN</h2>
      <h3 style="font-family: Arial; color: #0F172A;">LAPORAN MATERIAL SISA DAFTUNG BELUM RESERVASI (DAFTUNG - RESERVASI)</h3>
      <p style="font-family: Arial; font-size: 11px; color: #475569;">
        Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | 
        Total Jenis Material: ${filteredMaterials.length} Item
      </p>
      <table border="1" style="font-family: Arial; font-size: 11px; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #DBEAFE; font-weight: bold;">
            <th>NO</th>
            <th>NOMOR MATERIAL</th>
            <th>NAMA MATERIAL</th>
            <th>KATEGORI</th>
            <th>SATUAN</th>
            <th>TOTAL KEBUTUHAN DAFTUNG</th>
            <th>SUDAH RESERVASI (WO)</th>
            <th style="background-color: #FEF3C7; color: #92400E;">SISA BELUM RESERVASI (DAFTUNG - RESERVASI)</th>
            <th>STOK FISIK GUDANG</th>
            <th>SAFETY STOCK</th>
            <th>STATUS</th>
            <th>DAFTAR NAMA PELANGGAN MENUNGGU</th>
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
              <td style="text-align: right;">${m.totalDaftung}</td>
              <td style="text-align: right;">${m.totalReservasi}</td>
              <td style="text-align: right; font-weight: bold; background-color: #FEF3C7; color: #92400E;">${m.totalSisaBelumReservasi}</td>
              <td style="text-align: right;">${m.stokGudang}</td>
              <td style="text-align: right; font-weight: bold; ${m.safetyStock < 0 ? 'background-color: #FEE2E2; color: #B91C1C;' : 'background-color: #D1FAE5; color: #047857;'}">
                ${m.safetyStock}
              </td>
              <td style="text-align: center; font-weight: bold; ${m.statusKetersediaan === 'DEFISIT' ? 'color: #B91C1C;' : 'color: #047857;'}">
                ${m.statusKetersediaan}
              </td>
              <td>${m.customers.map((c) => `${c.customerName} (${c.qtySisa} ${c.unit})`).join('; ')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const tableFull = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Daftung Belum Reservasi</x:Name>
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
    link.setAttribute('download', `Daftung_Belum_Reservasi_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Laporan Daftung Belum Reservasi berhasil diexport ke Excel (.xls)');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Antrean Logistik & Reservasi Gudang
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Daftung (Sudah Bayar) ➔ <b className="text-amber-700">Belum Reservasi WO</b>
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Daftung Belum Reservasi (Antrean Alokasi Material)</h2>
          <p className="text-xs text-slate-500">
            Monitoring daftar pelanggan yang sudah melunasi pembayaran BP (Daftung Aktif) namun belum diterbitkan reservasi fisik materialnya ke gudang (Daftung - Reservasi).
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
            <span className="text-xs font-semibold text-slate-500 block mb-1">Pelanggan Menunggu Reservasi</span>
            <div className="text-2xl font-black text-amber-900">{totalPelangganMenunggu} <span className="text-xs font-normal text-slate-400">Pelanggan</span></div>
            <span className="text-[11px] text-amber-700 font-medium mt-1 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> Sudah Bayar Lunas BP
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Macam Material Mengantre</span>
            <div className="text-2xl font-black text-blue-900">{totalItemBelumReservasi} <span className="text-xs font-normal text-slate-400">Jenis Material</span></div>
            <span className="text-[11px] text-blue-700 font-medium mt-1 inline-flex items-center gap-1">
              <Boxes className="w-3 h-3" /> Formula: Daftung - Reservasi
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Total Volume Belum Reservasi</span>
            <div className="text-2xl font-black text-indigo-900">{totalVolumeMengantre.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Volume</span></div>
            <span className="text-[11px] text-indigo-700 font-medium mt-1 inline-flex items-center gap-1">
              <PackageSearch className="w-3 h-3" /> Perlu Segera Terbit WO
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor material, nama material, atau nama pelanggan..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {categoryList.length > 0 && (
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

            <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              Total Material: <b className="text-amber-700 font-bold">{filteredMaterials.length}</b> Item
            </span>

            {(searchTerm || categoryFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
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

        {/* Tabel Data Material Daftung Belum Reservasi */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10.5px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">No</th>
                <th className="py-3 px-3.5 min-w-[120px] font-mono text-center">No Material</th>
                <th className="py-3 px-3.5 min-w-[240px]">Nama Material</th>
                <th className="py-3 px-3.5 min-w-[140px] text-center">Kategori</th>
                <th className="py-3 px-3.5 text-center w-20">Satuan</th>
                <th className="py-3 px-3.5 text-center min-w-[105px] bg-slate-100">Kebutuhan Daftung</th>
                <th className="py-3 px-3.5 text-center min-w-[105px] bg-blue-50/70 text-blue-900 border-x border-blue-200">Sudah Reservasi</th>
                <th className="py-3 px-3.5 text-center min-w-[120px] bg-amber-50 text-amber-950 border-r border-amber-200 font-bold">
                  Belum Reservasi
                  <span className="block text-[8.5px] font-normal text-amber-700 normal-case">(Daftung - Reservasi)</span>
                </th>
                <th className="py-3 px-3.5 text-center min-w-[105px] bg-blue-50/50">Stok Fisik Gudang</th>
                <th className="py-3 px-3.5 text-center min-w-[105px]">Safety Stock</th>
                <th className="py-3 px-3.5 text-center min-w-[110px]">Status Gudang</th>
                <th className="py-3 px-3.5 text-center min-w-[110px]">Pelanggan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Tidak ada material yang ditemukan dalam antrean belum reservasi.
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((m, idx) => {
                  const rowNumber = (currentPageNum - 1) * pageSize + idx + 1;
                  const isExpanded = expandedMaterial === m.code;

                  return (
                    <React.Fragment key={m.code}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-amber-50/20' : ''}`}>
                        <td className="py-3 px-3.5 text-center font-mono text-slate-500 align-middle">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800 align-middle">
                          {m.code}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-900 align-middle">
                          <div>{m.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Dibutuhkan oleh {m.customers.length} pelanggan
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-center align-middle">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {m.category || 'Distribusi'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center text-slate-600 align-middle">
                          {m.unit}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-700 bg-slate-50/80 align-middle">
                          {m.totalDaftung}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-blue-700 bg-blue-50/40 border-x border-blue-100 align-middle">
                          {m.totalReservasi}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-amber-900 bg-amber-50/70 border-r border-amber-200 align-middle">
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs font-bold">
                            {m.totalSisaBelumReservasi} {m.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800 bg-blue-50/30 align-middle">
                          {m.stokGudang}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold align-middle">
                          <span className={`px-2 py-0.5 rounded text-[10.5px] border ${
                            m.safetyStock >= 0 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {m.safetyStock >= 0 ? `+${m.safetyStock}` : m.safetyStock}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center align-middle">
                          {m.statusKetersediaan === 'AMAN' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Stok Aman</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>Stok Kurang</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => setExpandedMaterial(isExpanded ? null : m.code)}
                            className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <span>{m.customers.length} Pelanggan</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Card Grid: Rincian Pelanggan Menunggu Material Ini */}
                      {isExpanded && (
                        <tr className="bg-amber-50/20">
                          <td colSpan={12} className="p-4 sm:p-5 border-y border-amber-200/80">
                            <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm space-y-4">
                              {/* Header Card Grid */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                    <Users className="w-4 h-4 text-amber-700" />
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                      <span>Rincian Antrean Pelanggan:</span>
                                      <span className="text-blue-900 font-black">{m.name}</span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                        {m.code}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                                      Terdapat <b className="text-slate-800">{m.customers.length} Pelanggan</b> yang membutuhkan alokasi material ini.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
                                    <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">Total Kebutuhan Menunggu:</span>
                                    <span className="font-mono text-sm">{m.totalSisaBelumReservasi} {m.unit}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Grid Kartu Pelanggan (1 kolom mobile, 2 tablet, 3 desktop) */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {m.customers.map((c, cIdx) => {
                                  const isWoCreated = Boolean(c.matchedWoId && c.matchedWoId !== 'Belum Terbit');

                                  return (
                                    <div
                                      key={cIdx}
                                      className="bg-slate-50/70 hover:bg-slate-50 transition-all rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs hover:border-blue-300 group"
                                    >
                                      {/* Baris Atas: Nama Pelanggan & Nomor */}
                                      <div className="space-y-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                                              {cIdx + 1}
                                            </span>
                                            <h5 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-900 transition-colors">
                                              {c.customerName}
                                            </h5>
                                          </div>
                                        </div>

                                        {/* Badge IDPEL & Daya / Tarif */}
                                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                          <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 shadow-2xs">
                                            IDPEL: {c.idpel}
                                          </span>
                                          {(c.daya || c.tarif) && (
                                            <span className="font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                                              <Zap className="w-2.5 h-2.5 text-blue-500" />
                                              <span>{c.daya} VA {c.tarif ? `(${c.tarif})` : ''}</span>
                                            </span>
                                          )}
                                        </div>

                                        {/* Lokasi & ULP */}
                                        <div className="pt-1 text-[11px] text-slate-600 space-y-1">
                                          <div className="flex items-start gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <span className="text-[10.5px] line-clamp-2 leading-tight text-slate-600">
                                              {c.location}
                                            </span>
                                          </div>
                                          {c.ulp && (
                                            <div className="text-[10px] font-medium text-slate-500 pl-4.5">
                                              Unit: <span className="font-bold text-slate-700">{c.ulp}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Baris Bawah: Status WO & Matriks Angka Volume */}
                                      <div className="pt-2.5 border-t border-slate-200/80 space-y-2">
                                        {/* Status WO */}
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-slate-400">Status Pekerjaan:</span>
                                          {isWoCreated ? (
                                            <span className="font-mono font-bold text-[9.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                              <span>WO: {c.matchedWoId}</span>
                                            </span>
                                          ) : (
                                            <span className="font-semibold text-[9.5px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                                              <span>Belum Terbit WO</span>
                                            </span>
                                          )}
                                        </div>

                                        {/* 3 Box Angka: Daftung, Reservasi, Sisa */}
                                        <div className="grid grid-cols-3 gap-1.5 text-center">
                                          <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                                            <span className="block text-[8.5px] text-slate-400 font-semibold uppercase">Daftung</span>
                                            <span className="font-mono font-bold text-xs text-slate-700">
                                              {c.qtyDaftung} <span className="text-[9px] font-normal text-slate-400">{c.unit}</span>
                                            </span>
                                          </div>
                                          <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                                            <span className="block text-[8.5px] text-slate-400 font-semibold uppercase">Reservasi</span>
                                            <span className="font-mono font-bold text-xs text-blue-700">
                                              {c.qtyReservasi} <span className="text-[9px] font-normal text-slate-400">{c.unit}</span>
                                            </span>
                                          </div>
                                          <div className="bg-amber-50/90 p-1.5 rounded-lg border border-amber-300 shadow-2xs">
                                            <span className="block text-[8.5px] text-amber-800 font-bold uppercase">Sisa Belum</span>
                                            <span className="font-mono font-black text-xs text-amber-950">
                                              {c.qtySisa} <span className="text-[9px] font-normal text-amber-700">{c.unit}</span>
                                            </span>
                                          </div>
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

        {/* Paginasi Footer */}
        <div className="print:hidden">
          <Pagination
            currentPage={currentPageNum}
            totalItems={filteredMaterials.length}
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
