'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { StockMaterial, WorkOrderRecord } from '@/types';
import { 
  Warehouse, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Edit3, 
  Plus, 
  Trash2, 
  X, 
  Save, 
  Package,
  RotateCcw,
  FileText,
  Building2,
  Boxes
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';

export const WarehouseView: React.FC = () => {
  const { stocks, updateStock, addStock, deleteStock, showToast, workOrders, adminGudangApproveRetur, adminGudangRejectRetur } = usePromotorStore();
  const [warehouseTab, setWarehouseTab] = useState<'stocks' | 'retur'>('stocks');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(10);

  // Daftar WO yang memiliki pengajuan retur material
  const pendingReturWos = useMemo(() => {
    return workOrders.filter(
      (w: WorkOrderRecord) =>
        w.returStatus === 'MENUNGGU_VERIFIKASI_GUDANG' ||
        w.returStatus === 'RETUR_DISETUJUI' ||
        (w.materials || []).some((m) => (m.qtyReturned || 0) > 0)
    );
  }, [workOrders]);

  const activeReturCount = useMemo(() => {
    return workOrders.filter((w: WorkOrderRecord) => w.returStatus === 'MENUNGGU_VERIFIKASI_GUDANG').length;
  }, [workOrders]);

  // Modal Edit / Tambah Material Gudang
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
  const [originalCode, setOriginalCode] = useState<string>('');
  const [formStock, setFormStock] = useState<StockMaterial>({
    code: '',
    name: '',
    category: 'Trafo',
    qtyFisik: 0,
    qtySap: 0,
    qtyMrwi: 0,
    qtyAlokasi: 0,
    qtySisa: 0,
    unit: 'Unit',
    status: 'Aman',
  });

  // Kategori unik untuk dropdown filter
  const categories = Array.from(new Set(stocks.map((s) => s.category).filter(Boolean)));

  const filteredStocks = stocks.filter((s) => {
    const matchSearch =
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const paginatedStocks = filteredStocks.slice(
    (stockPage - 1) * stockPageSize,
    stockPage * stockPageSize
  );

  const handleOpenEdit = (stock: StockMaterial) => {
    setModalMode('edit');
    setOriginalCode(stock.code);
    setFormStock({
      ...stock,
      qtySap: stock.qtySap !== undefined ? stock.qtySap : stock.qtyFisik,
      qtyMrwi: stock.qtyMrwi !== undefined ? stock.qtyMrwi : 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setOriginalCode('');
    setFormStock({
      code: '',
      name: '',
      category: 'Trafo',
      qtyFisik: 0,
      qtySap: 0,
      qtyMrwi: 0,
      qtyAlokasi: 0,
      qtySisa: 0,
      unit: 'Unit',
      status: 'Aman',
    });
    setIsModalOpen(true);
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formStock.code.trim();
    if (!cleanCode) {
      alert('Nomor / Kode Material wajib diisi.');
      return;
    }
    if (!formStock.name.trim()) {
      alert('Nama / Uraian Material wajib diisi.');
      return;
    }

    if (modalMode === 'edit') {
      // Jika kode diubah, periksa duplikasi terhadap material lain
      if (cleanCode.toLowerCase() !== originalCode.toLowerCase()) {
        const exists = stocks.some(
          (s) => s.code.toLowerCase() === cleanCode.toLowerCase() && s.code.toLowerCase() !== originalCode.toLowerCase()
        );
        if (exists) {
          alert(`Nomor material "${cleanCode}" sudah digunakan oleh item material lain di gudang!`);
          return;
        }
      }

      updateStock(originalCode, {
        code: cleanCode,
        newCode: cleanCode,
        name: formStock.name,
        category: formStock.category,
        qtyFisik: Number(formStock.qtyFisik),
        qtySap: Number(formStock.qtySap ?? formStock.qtyFisik),
        qtyMrwi: Number(formStock.qtyMrwi ?? 0),
        qtyAlokasi: Number(formStock.qtyAlokasi),
        unit: formStock.unit,
      });
    } else {
      // Periksa duplikasi kode
      const exists = stocks.some((s) => s.code.toLowerCase() === cleanCode.toLowerCase());
      if (exists) {
        alert(`Material dengan kode ${cleanCode} sudah ada di gudang!`);
        return;
      }
      addStock({
        ...formStock,
        code: cleanCode,
        qtyFisik: Number(formStock.qtyFisik),
        qtySap: Number(formStock.qtySap ?? formStock.qtyFisik),
        qtyMrwi: Number(formStock.qtyMrwi ?? 0),
        qtyAlokasi: Number(formStock.qtyAlokasi),
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (stock: StockMaterial) => {
    if (confirm(`Yakin ingin menghapus material "${stock.code} - ${stock.name}" dari gudang?`)) {
      deleteStock(stock.code);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Stok Gudang & Master Material PLN</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              UP3 Banten Selatan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola Nomor Material resmi (SAP/KHS 2026), pantau ketersediaan fisik gudang, alokasi per WO, dan status persediaan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Material
          </button>
          <button
            onClick={() => showToast('Snapshot stok gudang disinkronisasi dengan master KHS & SAP')}
            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sinkronisasi Stok
          </button>
        </div>
      </div>

      {/* Tab Switcher Gudang */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setWarehouseTab('stocks')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            warehouseTab === 'stocks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Stok Fisik & Saldo SAP ({stocks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setWarehouseTab('retur')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            warehouseTab === 'retur'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Verifikasi Retur Material Rekanan (TUG-10)</span>
          {activeReturCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {activeReturCount} Menunggu
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Stok Fisik & Saldo SAP */}
      {warehouseTab === 'stocks' && (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari No Material, nama barang, atau kategori..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setStockPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setStockPage(1);
              }}
              className="py-2 px-3 text-xs border border-slate-200 bg-white rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Semua Kategori ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total Material: <b className="text-slate-800">{filteredStocks.length}</b> Item
          </div>
        </div>

        {/* Tabel Material Gudang */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-blue-100/80 border-b border-blue-200 text-slate-900 uppercase font-bold text-[11px] tracking-wider">
              <tr className="divide-x divide-blue-200">
                <th className="py-3.5 px-3 w-12 text-center">NO</th>
                <th className="py-3.5 px-4 w-32 font-mono text-center">NO MATERIAL</th>
                <th className="py-3.5 px-4 min-w-[260px]">NAMA MATERIAL</th>
                <th className="py-3.5 px-3 w-24 text-center">KATEGORI</th>
                <th className="py-3.5 px-4 text-right min-w-[130px]">
                  <div className="flex flex-col items-end">
                    <span>STOK FISIK</span>
                    <span className="text-[9px] font-bold text-blue-900 normal-case bg-blue-200/90 px-1 rounded mt-0.5">
                      ✓ Acuan Reservasi WO
                    </span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-right w-24">
                  <div className="flex flex-col items-end">
                    <span>STOK SAP</span>
                    <span className="text-[8.5px] font-normal text-slate-600 normal-case">(ERP PLN)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-right w-24">
                  <div className="flex flex-col items-end">
                    <span>STOK MRWI</span>
                    <span className="text-[8.5px] font-normal text-slate-600 normal-case">(Retur/Rekon)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-right w-24">
                  <div className="flex flex-col items-end">
                    <span>TERALOKASI</span>
                    <span className="text-[8.5px] font-normal text-slate-600 normal-case">(WO Aktif)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-right w-24">
                  <div className="flex flex-col items-end">
                    <span>SISA BEBAS</span>
                    <span className="text-[8.5px] font-normal text-slate-600 normal-case">(Fisik - Alokasi)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center w-20">STATUS</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Tidak ada data material yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedStocks.map((s, idx) => (
                  <tr key={s.code} className="hover:bg-slate-50/80 transition-colors divide-x divide-slate-200">
                    <td className="py-3 px-3 text-center text-slate-600 font-mono font-medium">
                      {(stockPage - 1) * stockPageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px]">
                      {s.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {s.category}
                      </span>
                    </td>

                    {/* STOK FISIK (Acuan Reservasi WO) */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      <div>
                        <span className="text-sm text-blue-900 font-black">{s.qtyFisik.toLocaleString('id-ID')}</span>{' '}
                        <span className="text-[10px] text-slate-500 font-normal">{s.unit}</span>
                      </div>
                      <span className="inline-block text-[8.5px] text-blue-700 font-bold bg-blue-100/80 px-1 py-0.2 rounded mt-0.5 border border-blue-200">
                        Dipakai WO
                      </span>
                    </td>

                    {/* STOK SAP */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      {(s.qtySap !== undefined ? s.qtySap : s.qtyFisik).toLocaleString('id-ID')}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">{s.unit}</span>
                    </td>

                    {/* STOK MRWI */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-purple-700">
                      {(s.qtyMrwi || 0).toLocaleString('id-ID')}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">{s.unit}</span>
                    </td>

                    {/* TERALOKASI */}
                    <td className="py-3 px-3 text-right font-mono text-amber-700 font-semibold">
                      {s.qtyAlokasi.toLocaleString('id-ID')}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">{s.unit}</span>
                    </td>

                    {/* SISA BEBAS */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {s.qtySisa.toLocaleString('id-ID')}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">{s.unit}</span>
                    </td>

                    {/* STATUS */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'Aman'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.status === 'Menipis'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    {/* AKSI */}
                    <td className="p-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Material Gudang"
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          title="Hapus Material"
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={stockPage}
          totalItems={filteredStocks.length}
          itemsPerPage={stockPageSize}
          onPageChange={setStockPage}
          onItemsPerPageChange={setStockPageSize}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>
      )}

      {/* Tab 2: Verifikasi Retur Material Rekanan (TUG-10) */}
      {warehouseTab === 'retur' && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Alur Pengembalian Material (TUG-10):</span> Material sisa pekerjaan yang dikembalikan oleh Vendor/Rekanan dengan <b>Nomor Slip Pengembalian TUG-10</b> harus diperiksa kondisi fisiknya oleh Admin Gudang sebelum kuantiti otomatis ditambahkan kembali ke <b>Stok Fisik Gudang</b>.
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Daftar Pengajuan Retur Material Rekanan ({pendingReturWos.length})
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Menunggu Verifikasi: <b className="text-amber-700">{activeReturCount}</b> WO
              </span>
            </div>

            {pendingReturWos.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <RotateCcw className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">Belum Ada Pengajuan Retur Material</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ketika vendor melakukan retur pada menu Pengambilan Material & Jasa, berkas slip TUG-10 akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReturWos.map((wo) => {
                  const returnedItems = (wo.materials || []).filter((m) => (m.qtyReturned || 0) > 0);
                  const isPending = wo.returStatus === 'MENUNGGU_VERIFIKASI_GUDANG';
                  return (
                    <div key={wo.id} className="p-5 hover:bg-slate-50/60 transition">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                              {wo.id}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{wo.customerName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">({wo.idpel})</span>
                            {isPending ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-700" />
                                Menunggu Verifikasi Fisik
                              </span>
                            ) : wo.returStatus === 'RETUR_DITOLAK' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <X className="w-3 h-3 text-rose-600" />
                                Retur Ditolak
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Retur Diterima & Masuk Stok Gudang
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Vendor Rekanan</span>
                              <span className="font-semibold text-slate-800">{wo.vendor || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">No. Slip Retur (TUG-10)</span>
                              <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                                {wo.slipReturNumber || 'TUG10-PENDING'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Retur</span>
                              <span className="font-medium text-slate-800">{wo.slipReturDate || wo.vendorRealizationDate || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pengawas Lapangan</span>
                              <span className="font-semibold text-slate-800">{wo.supervisor || '-'}</span>
                            </div>
                          </div>

                          {/* Tabel Rincian Material yang Diretur */}
                          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-3">No Material</th>
                                  <th className="py-2 px-3">Nama Material</th>
                                  <th className="py-2 px-3 text-center">Satuan</th>
                                  <th className="py-2 px-3 text-right">Qty Diambil</th>
                                  <th className="py-2 px-3 text-right">Qty Terpasang</th>
                                  <th className="py-2 px-3 text-right bg-amber-50/80 text-amber-900 font-bold">Qty Diretur (TUG-10)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {returnedItems.map((m, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{m.kode || '-'}</td>
                                    <td className="py-2 px-3 font-medium text-slate-800">{m.material}</td>
                                    <td className="py-2 px-3 text-center text-slate-500 text-[11px]">{m.unit}</td>
                                    <td className="py-2 px-3 text-right font-mono text-slate-600">{m.qtyTaken || m.qtyAllocated || m.qtyReksis}</td>
                                    <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">{m.qtyInstalled ?? (m.qtyTaken || m.qtyAllocated || m.qtyReksis)}</td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-700 bg-amber-50/50">
                                      +{m.qtyReturned} {m.unit}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {wo.returApprovedBy && (
                            <div className="text-[10px] text-emerald-800 font-medium bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center gap-2 mt-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Diverifikasi oleh <b>{wo.returApprovedBy}</b> pada {wo.returApprovedAt}. {wo.returNotes && `Catatan: "${wo.returNotes}"`}
                              </span>
                            </div>
                          )}

                          {wo.returRejectionReason && (
                            <div className="text-[10px] text-rose-800 font-medium bg-rose-50 p-2 rounded border border-rose-200 flex items-center gap-2 mt-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>
                                Ditolak oleh <b>{wo.returRejectedBy}</b> pada {wo.returRejectedAt}. Alasan: "{wo.returRejectionReason}"
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Verifikasi */}
                        <div className="flex flex-col items-end justify-center shrink-0 min-w-[200px] border-t lg:border-t-0 lg:border-l lg:pl-4 pt-3 lg:pt-0 border-slate-200">
                          {isPending ? (
                            <div className="flex flex-col gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Verifikasi fisik material retur untuk WO ${wo.id}? Stok fisik gudang akan otomatis ditambah.`)) {
                                    adminGudangApproveRetur(
                                      wo.id,
                                      'Admin Gudang UP3 BTS',
                                      'Fisik material retur sesuai Slip TUG-10, kondisi baik & telah disimpan di rak gudang.'
                                    );
                                    showToast(`Retur ${wo.id} disetujui. Stok gudang bertambah.`);
                                  }
                                }}
                                className="w-full px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Terima & Tambah Stok</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const reason = prompt('Masukkan alasan penolakan retur material:', 'Fisik barang tidak sesuai dengan Slip Retur TUG-10');
                                  if (reason && reason.trim()) {
                                    adminGudangRejectRetur(wo.id, 'Admin Gudang UP3 BTS', reason.trim());
                                  }
                                }}
                                className="w-full px-3.5 py-1.5 border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition"
                              >
                                <X className="w-3.5 h-3.5 text-rose-600" />
                                <span>Tolak Retur</span>
                              </button>
                            </div>
                          ) : wo.returStatus === 'RETUR_DITOLAK' ? (
                            <div className="text-right">
                              <span className="inline-block text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded border border-rose-300">
                                ✕ Retur Ditolak
                              </span>
                            </div>
                          ) : (
                            <div className="text-right">
                              <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded border border-emerald-300">
                                Selesai Masuk Stok
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Edit / Tambah Material Gudang */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  {modalMode === 'edit' ? 'Edit Data Material Gudang' : 'Tambah Material Gudang Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor / Kode Material <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formStock.code}
                  onChange={(e) => setFormStock({ ...formStock, code: e.target.value })}
                  placeholder="Contoh: 1030097 atau 4120467"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
                <p className="text-[10px] text-blue-600 font-medium mt-1">
                  💡 Perubahan No Material di sini akan otomatis memperbarui No Material pada dokumen Work Order (WO) & RAB.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama / Deskripsi Material <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formStock.name}
                  onChange={(e) => setFormStock({ ...formStock, name: e.target.value })}
                  placeholder="Contoh: TRF DIS;;20kV/400V;3P;50kVA;Dyn5;OD"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formStock.category}
                    onChange={(e) => setFormStock({ ...formStock, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    <option value="Trafo">Trafo</option>
                    <option value="Kabel">Kabel & Konduktor</option>
                    <option value="Panel">Panel & LVSB</option>
                    <option value="APP">Box APP & CT</option>
                    <option value="Proteksi">Proteksi (FCO/LA)</option>
                    <option value="Isolator">Isolator</option>
                    <option value="Aksesori">Aksesori & Besi</option>
                    <option value="Pembumian">Pembumian</option>
                    <option value="Konektor">Konektor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={formStock.unit}
                    onChange={(e) => setFormStock({ ...formStock, unit: e.target.value })}
                    placeholder="Contoh: Unit, Meter, Set, Buah"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-200">
                  <label className="block text-[11px] font-black text-blue-900 mb-1">
                    Stok Fisik Gudang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formStock.qtyFisik}
                    onChange={(e) => setFormStock({ ...formStock, qtyFisik: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-blue-300 rounded-md font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <span className="block text-[9.5px] text-blue-700 font-bold mt-1">
                    ✓ Acuan Reservasi WO
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Stok SAP (ERP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formStock.qtySap !== undefined ? formStock.qtySap : formStock.qtyFisik}
                    onChange={(e) => setFormStock({ ...formStock, qtySap: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <span className="block text-[9.5px] text-slate-400 mt-1">
                    Saldo SAP PLN
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/40">
                  <label className="block text-[11px] font-bold text-purple-900 mb-1">
                    Stok MRWI
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formStock.qtyMrwi !== undefined ? formStock.qtyMrwi : 0}
                    onChange={(e) => setFormStock({ ...formStock, qtyMrwi: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-purple-300 rounded-md font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                  />
                  <span className="block text-[9.5px] text-purple-600 mt-1">
                    Retur Rekondisi
                  </span>
                </div>

                <div className="col-span-1 sm:col-span-3 pt-2 border-t border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teralokasi WO</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formStock.qtyAlokasi}
                      onChange={(e) => setFormStock({ ...formStock, qtyAlokasi: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-semibold text-amber-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="flex flex-col justify-end p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] text-emerald-700 font-medium">Perkiraan Sisa Bebas Fisik:</span>
                    <span className="font-bold font-mono text-emerald-800 text-sm">
                      {Math.max(0, formStock.qtyFisik - formStock.qtyAlokasi).toLocaleString('id-ID')} {formStock.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                >
                  <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
