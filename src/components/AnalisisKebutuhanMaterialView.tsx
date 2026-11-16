'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { calculateRabFromSurvey } from '@/data/rabMasterData';
import {
  Search,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Package,
  FileSpreadsheet,
  Users,
  ChevronDown,
  X
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';

export interface MaterialCustomerDetail {
  customerId: string;
  customerName: string;
  location?: string;
  surveyId?: string;
  idpel?: string;
  type: 'POTENSI_DAFTUNG' | 'DAFTUNG' | 'RESERVASI_WO';
  qty: number;
  unit: string;
}

export const AnalisisKebutuhanMaterialView: React.FC = () => {
  const { 
    stocks, 
    surveys, 
    daftungs, 
    workOrders, 
    customKhsPrices, 
    materialCodeMap, 
    showToast 
  } = usePromotorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEFISIT' | 'AMAN'>('ALL');
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State Export Excel / CSV
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'ALL' | 'CUSTOMER'>('ALL');
  const [selectedExportCustomer, setSelectedExportCustomer] = useState<string>('');

  // Kategori unik dari stok gudang
  const categories = useMemo(() => {
    return Array.from(new Set(stocks.map((s) => s.category).filter(Boolean)));
  }, [stocks]);

  // 1. Akumulasi Material per Survey beserta Rincian Pelanggan
  // Potensi Daftung (Survey) = Survey dengan status pembayaran Belum Bayar
  // Daftung = Survey dengan status pembayaran Sudah Bayar / terdaftar di Daftung
  const materialAggregates = useMemo(() => {
    const agg: Record<
      string,
      {
        potensiDaftung: number;
        daftung: number;
        reservasi: number;
        customers: MaterialCustomerDetail[];
      }
    > = {};

    const ensureItem = (code: string) => {
      if (!agg[code]) {
        agg[code] = { potensiDaftung: 0, daftung: 0, reservasi: 0, customers: [] };
      }
    };

    // A. Hitung dari Data Survey Lapangan
    surveys.forEach((srv) => {
      const matchedDaftung = daftungs.find(
        (d) => d.id === srv.id || d.idpel === srv.idpel || d.customerName.toLowerCase() === srv.customerName.toLowerCase()
      );
      const isPaid = srv.paymentStatus === 'Sudah Bayar' || Boolean(matchedDaftung);

      const p1Items = calculateRabFromSurvey(srv, 'paket1', customKhsPrices);
      const p2Items = calculateRabFromSurvey(srv, 'paket2', customKhsPrices);
      const allItems = [...p1Items, ...p2Items].filter((it) => !it.isHeader && it.section === 'MATERIAL');

      allItems.forEach((it) => {
        let matCode = it.kode;
        if (materialCodeMap[it.id]) {
          matCode = materialCodeMap[it.id];
        } else if (it.kode && materialCodeMap[it.kode]) {
          matCode = materialCodeMap[it.kode];
        }

        if (!matCode) return;
        ensureItem(matCode);

        const vol = it.rencanaVol || 0;
        if (vol > 0) {
          const type = isPaid ? 'DAFTUNG' : 'POTENSI_DAFTUNG';
          if (isPaid) {
            agg[matCode].daftung += vol;
          } else {
            agg[matCode].potensiDaftung += vol;
          }

          const existing = agg[matCode].customers.find(
            (c) => c.customerName === srv.customerName && c.type === type
          );
          if (existing) {
            existing.qty += vol;
          } else {
            agg[matCode].customers.push({
              customerId: srv.id,
              customerName: srv.customerName,
              location: srv.location,
              surveyId: srv.id,
              idpel: srv.idpel,
              type,
              qty: vol,
              unit: it.sat || 'Unit',
            });
          }
        }
      });
    });

    // B. Hitung Reservasi dari Work Orders Aktif
    workOrders.forEach((wo) => {
      if (wo.materials && wo.materials.length > 0) {
        wo.materials.forEach((m) => {
          const matchedStock = stocks.find(
            (s) => s.code === m.material || s.name.toLowerCase() === m.material.toLowerCase()
          );
          const matCode = matchedStock ? matchedStock.code : (m.material || '');
          if (!matCode) return;
          ensureItem(matCode);

          const rVol = m.qtyAllocated || m.qtyReksis || 0;
          if (rVol > 0) {
            agg[matCode].reservasi += rVol;
            const cName = wo.customerName || `WO ${wo.id}`;
            const existing = agg[matCode].customers.find(
              (c) => c.customerName === cName && c.type === 'RESERVASI_WO'
            );
            if (existing) {
              existing.qty += rVol;
            } else {
              agg[matCode].customers.push({
                customerId: wo.id,
                customerName: cName,
                location: wo.location,
                surveyId: wo.surveyId,
                idpel: wo.idpel,
                type: 'RESERVASI_WO',
                qty: rVol,
                unit: m.unit || 'Unit',
              });
            }
          }
        });
      }
    });

    return agg;
  }, [surveys, daftungs, workOrders, customKhsPrices, materialCodeMap, stocks]);

  // 2. Gabungkan dengan Stok Gudang untuk membentuk Baris Neraca Material Persis Gambar Client
  const rows = useMemo(() => {
    return stocks.map((stk) => {
      const code = stk.code;
      const agg = materialAggregates[code] || {
        potensiDaftung: 0,
        daftung: 0,
        reservasi: 0,
        customers: [],
      };

      const potensiDaftung = agg.potensiDaftung;
      const daftung = agg.daftung;
      const reservasi = agg.reservasi;

      // Formula:
      const daftungMinusReservasi = daftung - reservasi;
      const netDaftungRemaining = Math.max(0, daftungMinusReservasi);
      const totalKebutuhan = potensiDaftung + netDaftungRemaining;
      const stokGudang = stk.qtyFisik;
      const kekurangan = stokGudang - totalKebutuhan; // Safety Stock

      return {
        code: stk.code,
        name: stk.name,
        category: stk.category,
        unit: stk.unit,
        potensiDaftung,
        daftung,
        reservasi,
        daftungMinusReservasi,
        totalKebutuhan,
        stokGudang,
        kekurangan,
        customers: agg.customers || [],
      };
    });
  }, [stocks, materialAggregates]);

  // Daftar nama pelanggan unik untuk dropdown filter
  const allCustomerNames = useMemo(() => {
    const names = new Set<string>();
    rows.forEach((r) => {
      r.customers.forEach((c) => {
        if (c.customerName) names.add(c.customerName);
      });
    });
    surveys.forEach((s) => {
      if (s.customerName) names.add(s.customerName);
    });
    daftungs.forEach((d) => {
      if (d.customerName) names.add(d.customerName);
    });
    return Array.from(names).sort();
  }, [rows, surveys, daftungs]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || r.category === categoryFilter;
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'DEFISIT'
          ? r.kekurangan < 0
          : r.kekurangan >= 0;
      const matchCustomer =
        customerFilter === 'ALL' ||
        r.customers.some((c) => c.customerName === customerFilter);

      return matchSearch && matchCat && matchStatus && matchCustomer;
    });
  }, [rows, searchTerm, categoryFilter, statusFilter, customerFilter]);

  // Paginasi
  const paginatedRows = useMemo(() => {
    return filteredRows.slice((currentPageNum - 1) * pageSize, currentPageNum * pageSize);
  }, [filteredRows, currentPageNum, pageSize]);

  // KPI Ringkasan
  const totalItemsDefisit = useMemo(() => rows.filter((r) => r.kekurangan < 0).length, [rows]);
  const totalItemsAman = useMemo(() => rows.filter((r) => r.kekurangan >= 0).length, [rows]);
  const totalKebutuhanSemua = useMemo(() => rows.reduce((acc, r) => acc + r.totalKebutuhan, 0), [rows]);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenExportModal = () => {
    if (customerFilter !== 'ALL') {
      setExportScope('CUSTOMER');
      setSelectedExportCustomer(customerFilter);
    } else {
      setExportScope('ALL');
      if (allCustomerNames.length > 0 && !selectedExportCustomer) {
        setSelectedExportCustomer(allCustomerNames[0]);
      }
    }
    setIsExportModalOpen(true);
  };

  // Eksekusi Export ke Excel (.xls Spreadsheet dengan format styling PLN)
  const executeExportExcel = () => {
    const isCustomerScope = exportScope === 'CUSTOMER' && selectedExportCustomer;
    const targetCustomer = selectedExportCustomer;

    if (isCustomerScope) {
      // Export Khusus Pelanggan Tertentu
      const customerRows = rows.filter((r) =>
        r.customers.some((c) => c.customerName === targetCustomer)
      );

      if (customerRows.length === 0) {
        showToast(`⚠️ Tidak ada data material untuk pelanggan: ${targetCustomer}`);
        return;
      }

      // Ambil metadata pelanggan
      const allCustEntries = customerRows.flatMap((r) =>
        r.customers.filter((c) => c.customerName === targetCustomer)
      );
      const idpels = Array.from(new Set(allCustEntries.map((c) => c.idpel).filter(Boolean))).join(', ') || '—';
      const locations = Array.from(new Set(allCustEntries.map((c) => c.location).filter(Boolean))).join('; ') || '—';

      const tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>${targetCustomer.slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, '')}</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            th { background-color: #DBEAFE; color: #0F172A; font-weight: bold; border: 1px solid #94A3B8; text-align: center; padding: 6px; }
            td { border: 1px solid #CBD5E1; padding: 5px; }
            .num { mso-number-format:"\\#\\,\\#\\#0"; text-align: right; }
            .text { mso-number-format:"\\@"; }
            .center { text-align: center; }
            .defisit { background-color: #FEE2E2; color: #B91C1C; font-weight: bold; text-align: right; }
            .aman { background-color: #D1FAE5; color: #047857; font-weight: bold; text-align: right; }
            .cust-qty { background-color: #FEF3C7; color: #92400E; font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <h2 style="font-family: Arial; color: #1E3A8A; margin-bottom: 2px;">PT PLN (PERSERO) UP3 BANTEN SELATAN</h2>
          <h3 style="font-family: Arial; color: #0F172A; margin-top: 0; margin-bottom: 4px;">LAPORAN ANALISIS KEBUTUHAN MATERIAL KHUSUS PELANGGAN</h3>
          <table style="font-family: Arial; font-size: 11px; margin-bottom: 12px; border: none;">
            <tr><td><b>Nama Pelanggan</b></td><td>: <b>${targetCustomer}</b></td></tr>
            <tr><td><b>IDPEL</b></td><td>: ${idpels}</td></tr>
            <tr><td><b>Lokasi / Alamat</b></td><td>: ${locations}</td></tr>
            <tr><td><b>Tanggal Cetak</b></td><td>: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td><b>Jumlah Kebutuhan Material</b></td><td>: <b>${customerRows.length} Item</b></td></tr>
          </table>
          <table border="1" style="font-family: Arial; font-size: 11px; border-collapse: collapse;">
            <thead>
              <tr>
                <th>NO</th>
                <th>NOMOR MATERIAL</th>
                <th>NAMA MATERIAL</th>
                <th>KATEGORI</th>
                <th>SATUAN</th>
                <th>POTENSI DAFTUNG (SURVEY)</th>
                <th>DAFTUNG</th>
                <th>RESERVASI</th>
                <th class="subhdr">DAFTUNG BELUM RESERVASI</th>
                <th>TOTAL KEBUTUHAN</th>
                <th>STOK GUDANG</th>
                <th>SAFETY STOCK</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${customerRows.map((r, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td class="text" style="font-family: Courier New; font-weight: bold;">${r.code}</td>
                  <td>${r.name}</td>
                  <td class="center">${r.category}</td>
                  <td class="center">${r.unit}</td>
                  <td class="num">${r.potensiDaftung}</td>
                  <td class="num">${r.daftung}</td>
                  <td class="num">${r.reservasi}</td>
                  <td class="num" style="background-color: #EFF6FF; font-weight: bold;">${r.daftungMinusReservasi}</td>
                  <td class="num" style="background-color: #F8FAFC; font-weight: bold;">${r.totalKebutuhan}</td>
                  <td class="num">${r.stokGudang}</td>
                  <td class="${r.kekurangan < 0 ? 'defisit' : 'aman'}">${r.kekurangan}</td>
                  <td class="center" style="font-weight: bold; ${r.kekurangan < 0 ? 'color: #B91C1C;' : 'color: #047857;'}">
                    ${r.kekurangan < 0 ? 'DEFISIT' : 'AMAN'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const safeCustomerSlug = targetCustomer.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      link.setAttribute('download', `Analisis_Material_${safeCustomerSlug}_${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportModalOpen(false);
      showToast(`✓ Laporan material untuk ${targetCustomer} berhasil diexport ke Excel (.xls)`);
    } else {
      // Export Semua Pelanggan (Rekap Lengkap)
      const tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Analisis Kebutuhan Material</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            th { background-color: #DBEAFE; color: #0F172A; font-weight: bold; border: 1px solid #94A3B8; text-align: center; padding: 6px; }
            td { border: 1px solid #CBD5E1; padding: 5px; }
            .num { mso-number-format:"\\#\\,\\#\\#0"; text-align: right; }
            .text { mso-number-format:"\\@"; }
            .center { text-align: center; }
            .defisit { background-color: #FEE2E2; color: #B91C1C; font-weight: bold; text-align: right; }
            .aman { background-color: #D1FAE5; color: #047857; font-weight: bold; text-align: right; }
            .subhdr { background-color: #BFDBFE; font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <h2 style="font-family: Arial; color: #1E3A8A; margin-bottom: 4px;">PT PLN (PERSERO) UP3 BANTEN SELATAN</h2>
          <h3 style="font-family: Arial; color: #0F172A; margin-top: 0;">LAPORAN ANALISIS KEBUTUHAN MATERIAL (MATERIAL BALANCE) - SEMUA PELANGGAN</h3>
          <p style="font-family: Arial; font-size: 11px; color: #475569;">
            Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | 
            Status: Safety Stock & Daftung Belum Reservasi | Total Item: ${rows.length} Material
          </p>
          <table border="1" style="font-family: Arial; font-size: 11px; border-collapse: collapse;">
            <thead>
              <tr>
                <th>NO</th>
                <th>NOMOR MATERIAL</th>
                <th>NAMA MATERIAL</th>
                <th>KATEGORI</th>
                <th>SATUAN</th>
                <th>POTENSI DAFTUNG (SURVEY)</th>
                <th>DAFTUNG</th>
                <th>RESERVASI</th>
                <th class="subhdr">DAFTUNG BELUM RESERVASI</th>
                <th>TOTAL KEBUTUHAN</th>
                <th>STOK GUDANG</th>
                <th>SAFETY STOCK</th>
                <th>STATUS</th>
                <th>RINCIAN NAMA PELANGGAN</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td class="text" style="font-family: Courier New; font-weight: bold;">${r.code}</td>
                  <td>${r.name}</td>
                  <td class="center">${r.category}</td>
                  <td class="center">${r.unit}</td>
                  <td class="num">${r.potensiDaftung}</td>
                  <td class="num">${r.daftung}</td>
                  <td class="num">${r.reservasi}</td>
                  <td class="num" style="background-color: #EFF6FF; font-weight: bold;">${r.daftungMinusReservasi}</td>
                  <td class="num" style="background-color: #F8FAFC; font-weight: bold;">${r.totalKebutuhan}</td>
                  <td class="num">${r.stokGudang}</td>
                  <td class="${r.kekurangan < 0 ? 'defisit' : 'aman'}">${r.kekurangan}</td>
                  <td class="center" style="font-weight: bold; ${r.kekurangan < 0 ? 'color: #B91C1C;' : 'color: #047857;'}">
                    ${r.kekurangan < 0 ? 'DEFISIT' : 'AMAN'}
                  </td>
                  <td style="font-size: 10px;">
                    ${r.customers.map((c) => `${c.customerName} [${c.type === 'POTENSI_DAFTUNG' ? 'Survey' : c.type === 'DAFTUNG' ? 'Daftung' : 'WO'}]: ${c.qty} ${c.unit}`).join('; ') || '—'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Analisis_Kebutuhan_Material_Semua_Pelanggan_${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportModalOpen(false);
      showToast('✓ Laporan Analisis Kebutuhan Material (Semua Pelanggan) berhasil diexport ke Excel (.xls)');
    }
  };

  // Eksekusi Export ke CSV (Mendukung Semua / Per Pelanggan)
  const executeExportCsv = () => {
    const isCustomerScope = exportScope === 'CUSTOMER' && selectedExportCustomer;
    const targetCustomer = selectedExportCustomer;

    if (isCustomerScope) {
      const customerRows = rows.filter((r) =>
        r.customers.some((c) => c.customerName === targetCustomer)
      );

      if (customerRows.length === 0) {
        showToast(`⚠️ Tidak ada data material untuk pelanggan: ${targetCustomer}`);
        return;
      }

      const headers = [
        'Nomor Material',
        'Nama Material',
        'Kategori',
        'Satuan',
        'Potensi Daftung (Survey)',
        'Daftung',
        'Reservasi',
        'Daftung Belum Reservasi',
        'Total Kebutuhan',
        'Stok Gudang',
        'Safety Stock',
        'Status',
      ];

      const csvData = customerRows.map((r) => [
        `"${r.code}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        `"${r.unit}"`,
        r.potensiDaftung,
        r.daftung,
        r.reservasi,
        r.daftungMinusReservasi,
        r.totalKebutuhan,
        r.stokGudang,
        r.kekurangan,
        `"${r.kekurangan < 0 ? 'DEFISIT' : 'AMAN'}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...csvData.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const safeCustomerSlug = targetCustomer.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      link.setAttribute('download', `Analisis_Material_${safeCustomerSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportModalOpen(false);
      showToast(`✓ Data material untuk ${targetCustomer} berhasil diunduh (CSV)`);
    } else {
      const headers = [
        'Nomor Material',
        'Nama Material',
        'Kategori',
        'Potensi Daftung (Survey)',
        'Daftung',
        'Reservasi',
        'Daftung Belum Reservasi',
        'Total Kebutuhan',
        'Stok Gudang',
        'Safety Stock',
        'Satuan',
        'Rincian Pelanggan',
      ];

      const csvData = rows.map((r) => [
        `"${r.code}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        r.potensiDaftung,
        r.daftung,
        r.reservasi,
        r.daftungMinusReservasi,
        r.totalKebutuhan,
        r.stokGudang,
        r.kekurangan,
        `"${r.unit}"`,
        `"${r.customers.map((c) => `${c.customerName} (${c.qty} ${c.unit})`).join('; ').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...csvData.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Analisis_Kebutuhan_Material_Semua_Pelanggan_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportModalOpen(false);
      showToast('✓ Laporan Analisis Kebutuhan Material berhasil diunduh (CSV)');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Mengikuti Standar Daftung & Warehouse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Persediaan & Perencanaan Material
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Stok Gudang ➔ Reservasi WO ➔ <b className="text-blue-700">Analisis Kebutuhan</b>
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Analisis Kebutuhan Material (Material Balance)</h2>
          <p className="text-xs text-slate-500">
            Monitoring perbandingan antara proyeksi kebutuhan survey (Potensi Daftung), Daftung aktif, reservasi WO fisik, dan ketersediaan stok riil di gudang.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenExportModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            title="Export data material ke Microsoft Excel (.xls) dengan opsi Semua atau Per Pelanggan"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={handleOpenExportModal}
            className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            title="Export data ke CSV dengan opsi Semua atau Per Pelanggan"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak
          </button>
        </div>
      </div>

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Material Defisit (Safety Stock &lt; 0)</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{totalItemsDefisit} Item</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Stok gudang tidak mencukupi komitmen proyek</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Material Terpenuhi (Safety Stock ≥ 0)</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalItemsAman} Item</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Stok gudang mencukupi seluruh kebutuhan</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total Kebutuhan Terhitung</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{totalKebutuhanSemua.toLocaleString('id-ID')} Satuan</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Akumulasi survey + daftung belum reservasi</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card Modern - Persis Konsep Tabel Daftung / Warehouse */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Toolbar Pencarian & Filter - Konsep Modern & Terstruktur */}
        <div className="p-4 border-b border-slate-200/90 bg-slate-50/50 space-y-3 print:hidden">
          {/* Baris 1: Input Pencarian Utama + Counter & Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari Nomor Material (misal: 1000...), nama material, atau kategori..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-slate-800 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                Total Material: <b className="text-blue-700 font-bold">{filteredRows.length}</b> Item
              </span>
              {(searchTerm || customerFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCustomerFilter('ALL');
                    setCategoryFilter('ALL');
                    setStatusFilter('ALL');
                    setCurrentPageNum(1);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Baris 2: Dropdown Filter 3 Kolom Seimbang & Rapi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0.5">
            {/* Filter 1: Dropdown Rincian Nama Pelanggan */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Filter Pelanggan</span>
              </label>
              <select
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 bg-white rounded-lg text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer truncate"
                title={customerFilter === 'ALL' ? 'Semua Pelanggan' : customerFilter}
              >
                <option value="ALL">Semua Pelanggan ({allCustomerNames.length})</option>
                {allCustomerNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Kategori Material */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                <Boxes className="w-3.5 h-3.5 text-amber-600" />
                <span>Kategori Material</span>
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 bg-white rounded-lg text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="ALL">Semua Kategori ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Filter 3: Status Safety Stock */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Status Safety Stock</span>
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setCurrentPageNum(1);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 bg-white rounded-lg text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="ALL">Semua Status Ketersediaan</option>
                <option value="DEFISIT">🚨 Defisit (Safety Stock &lt; 0)</option>
                <option value="AMAN">✅ Aman (Safety Stock ≥ 0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Analisis Kebutuhan Material Bersih & Rapi */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-blue-100/80 border-b border-blue-200 text-slate-900 uppercase font-bold text-[11px] tracking-wider">
              <tr className="divide-x divide-blue-200">
                <th className="p-3 px-3.5 w-12 text-center">NO</th>
                <th className="p-3 px-4 w-36 font-mono text-center">NOMOR MATERIAL</th>
                <th className="p-3 px-4 min-w-[260px]">NAMA MATERIAL</th>
                
                {/* Blok Biru Sesuai Permintaan Client */}
                <th className="p-3 px-4 w-36 text-right bg-blue-200/70 text-blue-950 font-bold">
                  POTENSI DAFTUNG (SURVEY)
                </th>
                <th className="p-3 px-4 w-28 text-right">DAFTUNG</th>
                <th className="p-3 px-4 w-28 text-right">RESERVASI</th>
                
                {/* Daftung Belum Reservasi (Daftung - Reservasi) */}
                <th className="p-3 px-4 w-44 text-right bg-blue-200/70 text-blue-950 font-bold">
                  <div className="flex flex-col items-end">
                    <span>DAFTUNG BELUM RESERVASI</span>
                    <span className="text-[9px] font-normal text-blue-800 normal-case">(Daftung - Reservasi)</span>
                  </div>
                </th>
                <th className="p-3 px-4 w-32 text-right bg-slate-100/80 text-slate-900 font-black">
                  TOTAL KEBUTUHAN
                </th>
                <th className="p-3 px-4 w-32 text-right">STOK GUDANG</th>
                <th className="p-3 px-4 w-36 text-center">SAFETY STOCK</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Tidak ada material yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => {
                  const isDefisit = r.kekurangan < 0;
                  const isExpanded = expandedMaterial === r.code;

                  return (
                    <React.Fragment key={r.code}>
                      <tr 
                        className={`hover:bg-slate-50/80 transition-colors divide-x divide-slate-200 ${
                          isExpanded ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* NO */}
                        <td className="p-3 px-3 text-center text-slate-500 font-mono">
                          {(currentPageNum - 1) * pageSize + idx + 1}
                        </td>

                        {/* Nomor Material */}
                        <td className="p-3 px-4 font-mono font-bold text-slate-800 text-[11px] bg-slate-50/50 text-center">
                          {r.code}
                        </td>

                        {/* Nama Material & Dropdown Rincian Pelanggan */}
                        <td className="p-3 px-4">
                          <div className="font-bold text-slate-800 leading-snug">{r.name}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-slate-500 font-medium">
                              {r.category} • Satuan: <span className="font-semibold text-slate-700">{r.unit}</span>
                            </span>
                            {r.customers.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => setExpandedMaterial(isExpanded ? null : r.code)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition cursor-pointer border ${
                                  isExpanded
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                                }`}
                                title="Klik untuk membuka dropdown rincian nama pelanggan"
                              >
                                <Users className="w-3 h-3" />
                                <span>Rincian {r.customers.length} Pelanggan</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Belum ada alokasi pelanggan</span>
                            )}
                          </div>
                        </td>

                        {/* Potensi Daftung (Survey) - Blok Biru Elegan */}
                        <td className="p-3 px-4 text-right font-mono font-bold text-blue-900 bg-blue-50/50">
                          {r.potensiDaftung > 0 ? (
                            <span>{r.potensiDaftung.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span></span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* Daftung */}
                        <td className="p-3 px-4 text-right font-mono font-semibold text-slate-700">
                          {r.daftung > 0 ? (
                            <span>{r.daftung.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span></span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* Reservasi */}
                        <td className="p-3 px-4 text-right font-mono font-semibold text-amber-800">
                          {r.reservasi > 0 ? (
                            <span>{r.reservasi.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span></span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* Daftung Belum Reservasi - Blok Biru Elegan */}
                        <td className="p-3 px-4 text-right font-mono font-bold text-indigo-950 bg-blue-50/50">
                          {r.daftungMinusReservasi !== 0 ? (
                            <span>{r.daftungMinusReservasi.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span></span>
                          ) : (
                            <span className="text-slate-400 font-normal">0</span>
                          )}
                        </td>

                        {/* Total Kebutuhan */}
                        <td className="p-3 px-4 text-right font-mono font-black text-slate-900 bg-slate-50/80">
                          {r.totalKebutuhan > 0 ? (
                            <span>{r.totalKebutuhan.toLocaleString('id-ID')} <span className="text-[10px] text-slate-500 font-normal">{r.unit}</span></span>
                          ) : (
                            <span className="text-slate-400 font-normal">0</span>
                          )}
                        </td>

                        {/* Stok Gudang */}
                        <td className="p-3 px-4 text-right font-mono font-bold text-slate-800">
                          {r.stokGudang.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span>
                        </td>

                        {/* Safety Stock Badge */}
                        <td className="p-3 px-4 text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                            isDefisit 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {r.kekurangan > 0 ? `+${r.kekurangan}` : r.kekurangan} {r.unit}
                          </span>
                        </td>
                      </tr>

                      {/* Dropdown Rincian Nama Pelanggan Yang Membutuhkan Material Ini */}
                      {isExpanded && (
                        <tr className="bg-blue-50/30 border-b border-blue-200">
                          <td colSpan={10} className="p-3.5 px-6">
                            <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-2xs space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                    <Users className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-xs text-slate-900">
                                      Rincian Kebutuhan Pelanggan: <span className="text-blue-700 font-mono">{r.name} ({r.code})</span>
                                    </h4>
                                    <p className="text-[10.5px] text-slate-500">
                                      Daftar nama pelanggan, tahapan alokasi, dan kuantitas fisik material yang dibutuhkan
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 self-start sm:self-auto">
                                  {r.customers.length} Pelanggan Terkait
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-[10.5px] font-bold text-slate-600 uppercase">
                                      <th className="py-2 px-3 text-center w-10">No</th>
                                      <th className="py-2 px-3">Nama Pelanggan</th>
                                      <th className="py-2 px-3">Lokasi / Alamat</th>
                                      <th className="py-2 px-3 text-center">Tahapan Alokasi</th>
                                      <th className="py-2 px-3 text-right">Kuantitas Material</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {r.customers.map((c, cIdx) => (
                                      <tr key={cIdx} className="hover:bg-slate-50/80">
                                        <td className="py-2 px-3 text-slate-500 font-mono text-center">{cIdx + 1}</td>
                                        <td className="py-2 px-3">
                                          <div className="font-bold text-slate-900">{c.customerName}</div>
                                          {c.idpel && <span className="text-[10px] text-slate-400 font-mono">IDPEL: {c.idpel}</span>}
                                        </td>
                                        <td className="py-2 px-3 text-slate-600 text-[11px]">{c.location || '—'}</td>
                                        <td className="py-2 px-3 text-center">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                            c.type === 'POTENSI_DAFTUNG'
                                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                              : c.type === 'DAFTUNG'
                                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                                          }`}>
                                            {c.type === 'POTENSI_DAFTUNG'
                                              ? '📋 Potensi Daftung (Survey)'
                                              : c.type === 'DAFTUNG'
                                              ? '💰 Daftung (Sudah Bayar)'
                                              : '⚡ Reservasi (WO Aktif)'}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                          {c.qty.toLocaleString('id-ID')} {r.unit}
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

        {/* Paginasi Modern */}
        <div className="print:hidden">
          <Pagination
            currentPage={currentPageNum}
            totalItems={filteredRows.length}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPageNum}
            onItemsPerPageChange={setPageSize}
            pageSizeOptions={[5, 10, 15, 25, 50]}
          />
        </div>
      </div>

      {/* Modal Dialog Export Excel / CSV */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden transform transition-all scale-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 px-6 py-4.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Export Analisis Kebutuhan Material</h3>
                  <p className="text-xs text-emerald-100">
                    Pilih cakupan data: Rekap Semua Pelanggan atau Per Pelanggan Tertentu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Cakupan Laporan Yang Ingin Diexport:
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {/* Option 1: Semua Pelanggan */}
                  <div
                    onClick={() => setExportScope('ALL')}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                      exportScope === 'ALL'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      exportScope === 'ALL'
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {exportScope === 'ALL' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">Rekapitulasi Semua Pelanggan</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {rows.length} Material
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Mencakup seluruh neraca material UP3 (Potensi Daftung Survey, Daftung, Reservasi WO, Stok Fisik, & Safety Stock).
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Per Pelanggan */}
                  <div
                    onClick={() => {
                      setExportScope('CUSTOMER');
                      if (!selectedExportCustomer && allCustomerNames.length > 0) {
                        setSelectedExportCustomer(allCustomerNames[0]);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                      exportScope === 'CUSTOMER'
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      exportScope === 'CUSTOMER'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {exportScope === 'CUSTOMER' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">Per Pelanggan Tertentu</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          Spesifik Proyek
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Export rincian material khusus untuk 1 pelanggan pilihan, termasuk kuantitas kebutuhan, tahapan alokasi, stok gudang & ketersediaan.
                      </p>

                      {/* Dropdown Pemilihan Pelanggan jika opsi Customer aktif */}
                      {exportScope === 'CUSTOMER' && (
                        <div className="mt-3.5 pt-3.5 border-t border-blue-200/60 animate-in fade-in duration-150">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                            Pilih Nama Pelanggan:
                          </label>
                          <select
                            value={selectedExportCustomer}
                            onChange={(e) => setSelectedExportCustomer(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-blue-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                          >
                            {allCustomerNames.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>

                          {/* Quick summary of customer items */}
                          {selectedExportCustomer && (
                            <div className="mt-2 text-[11px] text-blue-800 bg-blue-100/70 px-2.5 py-1.5 rounded-md flex items-center justify-between">
                              <span>Kebutuhan Material:</span>
                              <span className="font-bold">
                                {rows.filter((r) => r.customers.some((c) => c.customerName === selectedExportCustomer)).length} Jenis Material
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={executeExportCsv}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Download dalam format CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" /> Unduh CSV
              </button>
              <button
                onClick={executeExportExcel}
                className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md hover:shadow-lg"
              >
                <FileSpreadsheet className="w-4 h-4" /> Download File Excel (.xls)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
