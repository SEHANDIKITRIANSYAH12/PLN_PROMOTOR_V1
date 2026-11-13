'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { MaterialContractRecord, MaterialContractItem } from '@/types';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  FileText,
  FileCheck2,
  Edit3,
  Trash2,
  Eye,
  X,
  Clock,
  Coins,
  TrendingDown,
  CheckCircle2,
  Layers,
  ArrowRight,
  Package,
  Sparkles,
  Info
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';

export const MasterMaterialView: React.FC = () => {
  const {
    materialContracts,
    addMaterialContract,
    updateMaterialContract,
    deleteMaterialContract,
    vendors,
    showToast,
  } = usePromotorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'SELESAI' | 'KEDALUWARSA'>('ALL');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const pageSize = 10;

  // Modal Detail Rincian Material
  const [selectedContractForDetail, setSelectedContractForDetail] = useState<MaterialContractRecord | null>(null);

  // Modal Tambah / Edit Kontrak Material
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<MaterialContractRecord | null>(null);

  const [contractForm, setContractForm] = useState<{
    notaDinas: string;
    tanggalNotaDinas: string;
    judulPengadaan: string;
    nilaiRabNodin: number;
    nomorSpk: string;
    namaVendor: string;
    nilaiSpk: number;
    validFrom: string;
    validTo: string;
    status: 'AKTIF' | 'SELESAI' | 'KEDALUWARSA';
    keterangan: string;
    rincianMaterial: {
      kode: string;
      deskripsi: string;
      satuan: string;
      volume: number;
      hargaSatuan: number;
      keterangan: string;
    }[];
  }>({
    notaDinas: '',
    tanggalNotaDinas: '15 Jan 2026',
    judulPengadaan: '',
    nilaiRabNodin: 1000000000,
    nomorSpk: '',
    namaVendor: '',
    nilaiSpk: 950000000,
    validFrom: '01 Feb 2026',
    validTo: '31 Des 2026',
    status: 'AKTIF',
    keterangan: '',
    rincianMaterial: [
      {
        kode: 'M-TRF-250',
        deskripsi: 'Trafo Distribusi 250 kVA 20kV / 400V 3 Phasa',
        satuan: 'Unit',
        volume: 2,
        hargaSatuan: 195000000,
        keterangan: 'Garansi resmi pabrikan',
      },
    ],
  });

  // Helper Format Rupiah
  const formatRp = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  };

  const formatRpCompact = (num: number) => {
    if (!num || num === 0) return 'Rp0';
    if (Math.abs(num) >= 1_000_000_000) {
      const val = (num / 1_000_000_000).toFixed(2).replace('.', ',');
      return `Rp${val.endsWith(',00') ? val.slice(0, -3) : val} M`;
    }
    if (Math.abs(num) >= 1_000_000) {
      const val = Math.round(num / 1_000_000);
      return `Rp${val} jt`;
    }
    if (Math.abs(num) >= 1_000) {
      const val = Math.round(num / 1_000);
      return `Rp${val} rb`;
    }
    return 'Rp' + num.toLocaleString('id-ID');
  };

  // KPI Ringkas
  const kpi = useMemo(() => {
    let totalRab = 0;
    let totalSpk = 0;
    let totalItems = 0;

    materialContracts.forEach((c) => {
      totalRab += c.nilaiRabNodin || 0;
      totalSpk += c.nilaiSpk || 0;
      totalItems += (c.rincianMaterial || []).length;
    });

    const efisiensi = totalRab - totalSpk;
    const efisiensiPersen = totalRab > 0 ? (efisiensi / totalRab) * 100 : 0;

    return {
      totalContracts: materialContracts.length,
      totalRab,
      totalSpk,
      efisiensi,
      efisiensiPersen,
      totalItems,
    };
  }, [materialContracts]);

  // Filter Data
  const filteredContracts = useMemo(() => {
    return materialContracts.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        c.nomorSpk.toLowerCase().includes(q) ||
        c.notaDinas.toLowerCase().includes(q) ||
        c.namaVendor.toLowerCase().includes(q) ||
        (c.judulPengadaan || '').toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [materialContracts, searchTerm, statusFilter]);

  // Paginated Data
  const paginatedContracts = useMemo(() => {
    const start = (currentPageNum - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, currentPageNum, pageSize]);

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setEditingContract(null);
    setContractForm({
      notaDinas: `0${materialContracts.length + 220}/DAN.02.01/UP3-BTS/2026`,
      tanggalNotaDinas: '15 Jan 2026',
      judulPengadaan: 'Pengadaan Material Konstruksi Distribusi UP3 Banten Selatan',
      nilaiRabNodin: 1200000000,
      nomorSpk: `00${materialContracts.length + 55}.PJ/DAN.02.01/UP3-BTS/2026`,
      namaVendor: vendors[0]?.name || 'PT. TRAFOINDO PRIMA PERKASA',
      nilaiSpk: 1140000000,
      validFrom: '01 Feb 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
      keterangan: 'Pengadaan material kelistrikan distribusi',
      rincianMaterial: [
        {
          kode: 'M-TRF-250',
          deskripsi: 'Trafo Distribusi 250 kVA 20kV / 400V 3 Phasa',
          satuan: 'Unit',
          volume: 2,
          hargaSatuan: 195000000,
          keterangan: 'FAT lulus standar SPLN',
        },
        {
          kode: 'M-PHB-4J',
          deskripsi: 'PHB-TR 4 Jurusan Lengkap Fuse NH',
          satuan: 'Set',
          volume: 4,
          hargaSatuan: 32000000,
          keterangan: 'Perlengkapan gardu portal',
        },
      ],
    });
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (c: MaterialContractRecord) => {
    setEditingContract(c);
    setContractForm({
      notaDinas: c.notaDinas,
      tanggalNotaDinas: c.tanggalNotaDinas || '15 Jan 2026',
      judulPengadaan: c.judulPengadaan || '',
      nilaiRabNodin: c.nilaiRabNodin,
      nomorSpk: c.nomorSpk,
      namaVendor: c.namaVendor,
      nilaiSpk: c.nilaiSpk,
      validFrom: c.validFrom,
      validTo: c.validTo,
      status: c.status,
      keterangan: c.keterangan || '',
      rincianMaterial: (c.rincianMaterial || []).map((m) => ({
        kode: m.kode || '',
        deskripsi: m.deskripsi,
        satuan: m.satuan,
        volume: m.volume,
        hargaSatuan: m.hargaSatuan,
        keterangan: m.keterangan || '',
      })),
    });
    setIsModalOpen(true);
  };

  // Tambah Baris Material di Form
  const handleAddMaterialRow = () => {
    setContractForm({
      ...contractForm,
      rincianMaterial: [
        ...contractForm.rincianMaterial,
        {
          kode: '',
          deskripsi: '',
          satuan: 'Unit',
          volume: 1,
          hargaSatuan: 0,
          keterangan: '',
        },
      ],
    });
  };

  // Hapus Baris Material di Form
  const handleRemoveMaterialRow = (idx: number) => {
    const updated = contractForm.rincianMaterial.filter((_, i) => i !== idx);
    setContractForm({
      ...contractForm,
      rincianMaterial: updated,
    });
  };

  // Update Input Baris Material
  const handleMaterialFieldChange = (
    idx: number,
    field: 'kode' | 'deskripsi' | 'satuan' | 'volume' | 'hargaSatuan' | 'keterangan',
    value: any
  ) => {
    const updated = [...contractForm.rincianMaterial];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'volume' || field === 'hargaSatuan' ? Number(value) || 0 : value,
    };
    setContractForm({
      ...contractForm,
      rincianMaterial: updated,
    });
  };

  // Total Nilai Kalkulasi Item Material
  const calculatedItemsTotal = useMemo(() => {
    return contractForm.rincianMaterial.reduce((acc, m) => acc + (m.volume * m.hargaSatuan), 0);
  }, [contractForm.rincianMaterial]);

  // Simpan Kontrak Material
  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractForm.notaDinas.trim()) {
      showToast('Nomor Nota Dinas wajib diisi');
      return;
    }
    if (!contractForm.nomorSpk.trim()) {
      showToast('Nomor SPK Material wajib diisi');
      return;
    }
    if (!contractForm.namaVendor.trim()) {
      showToast('Nama Rekanan Vendor wajib diisi');
      return;
    }

    const formattedItems: MaterialContractItem[] = contractForm.rincianMaterial.map((m, idx) => ({
      id: `mi-${Date.now()}-${idx}`,
      kode: m.kode.trim() || undefined,
      deskripsi: m.deskripsi.trim() || 'Material Kontrak',
      satuan: m.satuan.trim() || 'Unit',
      volume: m.volume || 1,
      hargaSatuan: m.hargaSatuan || 0,
      totalHarga: (m.volume || 1) * (m.hargaSatuan || 0),
      keterangan: m.keterangan.trim() || undefined,
    }));

    if (editingContract) {
      updateMaterialContract(editingContract.id, {
        notaDinas: contractForm.notaDinas.trim(),
        tanggalNotaDinas: contractForm.tanggalNotaDinas.trim(),
        judulPengadaan: contractForm.judulPengadaan.trim() || undefined,
        nilaiRabNodin: Number(contractForm.nilaiRabNodin),
        nomorSpk: contractForm.nomorSpk.trim(),
        namaVendor: contractForm.namaVendor.trim(),
        nilaiSpk: Number(contractForm.nilaiSpk),
        validFrom: contractForm.validFrom.trim(),
        validTo: contractForm.validTo.trim(),
        status: contractForm.status,
        keterangan: contractForm.keterangan.trim() || undefined,
        rincianMaterial: formattedItems,
      });
    } else {
      addMaterialContract({
        notaDinas: contractForm.notaDinas.trim(),
        tanggalNotaDinas: contractForm.tanggalNotaDinas.trim(),
        judulPengadaan: contractForm.judulPengadaan.trim() || undefined,
        nilaiRabNodin: Number(contractForm.nilaiRabNodin),
        nomorSpk: contractForm.nomorSpk.trim(),
        namaVendor: contractForm.namaVendor.trim(),
        nilaiSpk: Number(contractForm.nilaiSpk),
        validFrom: contractForm.validFrom.trim(),
        validTo: contractForm.validTo.trim(),
        status: contractForm.status,
        keterangan: contractForm.keterangan.trim() || undefined,
        rincianMaterial: formattedItems,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header Halaman */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Kontrak Pengadaan Material (Pabrikan)</h2>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Logistik & Pasokan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan Surat Perjanjian Kerja (SPK) Pengadaan Material Pabrikan, Nota Dinas (HPS/RAB Nodin), Rekanan Pabrikan, Masa Kontrak, dan Rincian Pasokan Material ke Gudang UP3
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kontrak Pengadaan</span>
        </button>
      </div>

      {/* KPI Cards Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Total Kontrak Material</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{kpi.totalContracts} SPK</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Mencakup {kpi.totalItems} item material utama</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Total Nilai SPK Material</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {formatRpCompact(kpi.totalSpk)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Nilai kontrak yang disepakati</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Total Nilai RAB Nodin</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-700">
            {formatRpCompact(kpi.totalRab)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pagu HPS Nota Dinas usulan</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Efisiensi Anggaran</span>
            <TrendingDown className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-700">
            {kpi.efisiensi >= 0 ? `+${formatRpCompact(kpi.efisiensi)}` : formatRpCompact(kpi.efisiensi)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Hemat {kpi.efisiensiPersen.toFixed(1)}% terhadap RAB Nodin
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari SPK, Nota Dinas, Vendor, Judul..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium cursor-pointer text-xs"
          >
            <option value="ALL">Semua Status Kontrak</option>
            <option value="AKTIF">Aktif</option>
            <option value="SELESAI">Selesai</option>
            <option value="KEDALUWARSA">Kedaluwarsa</option>
          </select>
        </div>
      </div>

      {/* Tabel Utama Kontrak Material */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] text-slate-500 uppercase font-semibold tracking-wider border-b border-slate-200 text-[10.5px]">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-3.5 text-center w-12">NO</th>
                <th className="py-3 px-4 min-w-[170px]">NOTA DINAS</th>
                <th className="py-3 px-4 min-w-[130px] text-right">NILAI RAB NODIN</th>
                <th className="py-3 px-4 min-w-[180px]">NOMOR SPK</th>
                <th className="py-3 px-4 min-w-[180px]">NAMA VENDOR</th>
                <th className="py-3 px-4 min-w-[130px] text-right">NILAI SPK</th>
                <th className="py-3 px-4 min-w-[150px]">MASA BERLAKU</th>
                <th className="py-3 px-4 text-center min-w-[140px]">RINCIAN MATERIAL</th>
                <th className="py-3 px-4 text-center w-24">STATUS</th>
                <th className="py-3 px-4 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
                    Tidak ada data kontrak material yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c, idx) => {
                  const rowNumber = (currentPageNum - 1) * pageSize + idx + 1;
                  const itemsCount = (c.rincianMaterial || []).length;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-200">
                      {/* NO */}
                      <td className="py-3.5 px-3.5 text-center font-mono text-slate-400 font-semibold text-xs">
                        {rowNumber}
                      </td>

                      {/* NOTA DINAS */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">{c.notaDinas}</div>
                        {c.tanggalNotaDinas && (
                          <div className="text-[10.5px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Tgl: {c.tanggalNotaDinas}</span>
                          </div>
                        )}
                      </td>

                      {/* NILAI RAB NODIN */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-700 whitespace-nowrap" title={formatRp(c.nilaiRabNodin)}>
                        <div>{formatRpCompact(c.nilaiRabNodin)}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">Pagu HPS</div>
                      </td>

                      {/* NOMOR SPK */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-700 text-xs">{c.nomorSpk}</div>
                        {c.judulPengadaan && (
                          <div className="text-[11px] text-slate-600 line-clamp-1 font-medium mt-0.5" title={c.judulPengadaan}>
                            {c.judulPengadaan}
                          </div>
                        )}
                      </td>

                      {/* NAMA VENDOR */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.namaVendor}</span>
                        </div>
                      </td>

                      {/* NILAI SPK */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap" title={formatRp(c.nilaiSpk)}>
                        <div>{formatRpCompact(c.nilaiSpk)}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">Disepakati</div>
                      </td>

                      {/* MASA BERLAKU */}
                      <td className="py-3.5 px-4 text-slate-700 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.validFrom} – {c.validTo}</span>
                        </div>
                      </td>

                      {/* RINCIAN MATERIAL */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedContractForDetail(c)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1.5 mx-auto cursor-pointer shadow-2xs"
                          title="Klik untuk melihat tabel rincian material"
                        >
                          <Boxes className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lihat ({itemsCount}) Material</span>
                        </button>
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                          c.status === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.status === 'SELESAI'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {c.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-md text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Edit Kontrak Material"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus Kontrak Material SPK ${c.nomorSpk}?`)) {
                                deleteMaterialContract(c.id);
                              }
                            }}
                            className="p-1.5 rounded-md text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Hapus Kontrak Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPageNum}
          totalItems={filteredContracts.length}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPageNum}
        />
      </div>

      {/* ======================================================== */}
      {/* MODAL: DETAIL RINCIAN MATERIAL                           */}
      {/* ======================================================== */}
      {selectedContractForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Rincian Material Kontrak SPK — {selectedContractForDetail.nomorSpk}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vendor: <b className="text-slate-800">{selectedContractForDetail.namaVendor}</b> • Nota Dinas: <b className="text-slate-800">{selectedContractForDetail.notaDinas}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContractForDetail(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0 text-xs">
              <div>
                <span className="text-slate-400 block text-[10.5px]">Nilai SPK Material</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {formatRp(selectedContractForDetail.nilaiSpk)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10.5px]">Nilai RAB Nota Dinas</span>
                <span className="font-mono font-bold text-purple-700 text-sm">
                  {formatRp(selectedContractForDetail.nilaiRabNodin)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10.5px]">Masa Berlaku</span>
                <span className="font-semibold text-slate-800 text-[11px]">
                  {selectedContractForDetail.validFrom} s.d {selectedContractForDetail.validTo}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10.5px]">Status Kontrak</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                  {selectedContractForDetail.status}
                </span>
              </div>
            </div>

            {/* Tabel Rincian Material */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px] sticky top-0 z-10">
                  <tr className="divide-x divide-slate-200">
                    <th className="py-2.5 px-3 w-10 text-center">NO</th>
                    <th className="py-2.5 px-3 w-28">KODE MATERIAL</th>
                    <th className="py-2.5 px-3">DESKRIPSI & SPESIFIKASI MATERIAL</th>
                    <th className="py-2.5 px-3 text-center w-20">SATUAN</th>
                    <th className="py-2.5 px-3 text-right w-24">VOLUME</th>
                    <th className="py-2.5 px-3 text-right w-32">HARGA SATUAN</th>
                    <th className="py-2.5 px-3 text-right w-36">TOTAL HARGA</th>
                    <th className="py-2.5 px-3 w-40">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {(selectedContractForDetail.rincianMaterial || []).map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-50/70 divide-x divide-slate-200">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 text-[11px]">{m.kode || '—'}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{m.deskripsi}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{m.satuan}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">{m.volume}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">{formatRp(m.hargaSatuan)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatRp(m.totalHarga)}</td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{m.keterangan || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr className="divide-x divide-slate-200">
                    <td colSpan={6} className="py-2.5 px-4 text-right uppercase text-[11px]">
                      Total Akumulasi Rincian Material:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800 text-xs">
                      {formatRp(
                        (selectedContractForDetail.rincianMaterial || []).reduce(
                          (acc, m) => acc + (m.totalHarga || 0),
                          0
                        )
                      )}
                    </td>
                    <td className="py-2.5 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedContractForDetail(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT KONTRAK MATERIAL                    */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-200/80 flex items-center justify-center shrink-0 text-blue-700">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingContract ? 'Edit Kontrak Material' : 'Terbitkan Kontrak Material Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Lengkapi parameter Nota Dinas, Nilai RAB Nodin, Nomor SPK, Vendor, Masa Berlaku, dan Rincian Material
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* SECTION 1: NOTA DINAS & RAB */}
              <div className="p-3.5 bg-purple-50/50 border border-purple-200/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span className="font-bold text-purple-950 text-xs">Informasi Nota Dinas (Dasar Pengadaan)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nomor Nota Dinas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contractForm.notaDinas}
                      onChange={(e) => setContractForm({ ...contractForm, notaDinas: e.target.value })}
                      placeholder="0128/DAN.02.01/UP3-BTS/2026"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Nota Dinas
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={contractForm.tanggalNotaDinas}
                        onChange={(e) => setContractForm({ ...contractForm, tanggalNotaDinas: e.target.value })}
                        placeholder="15 Jan 2026"
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Nilai RAB Nodin (Rp) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-purple-800 bg-white px-1.5 py-0.2 rounded border border-purple-200">
                        {formatRp(contractForm.nilaiRabNodin)}
                      </span>
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000000"
                      value={contractForm.nilaiRabNodin || ''}
                      onChange={(e) => setContractForm({ ...contractForm, nilaiRabNodin: parseFloat(e.target.value) || 0 })}
                      placeholder="1500000000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: SPK & VENDOR */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-blue-950 text-xs">Informasi Surat Perjanjian Kerja (SPK)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nomor SPK Material <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contractForm.nomorSpk}
                      onChange={(e) => setContractForm({ ...contractForm, nomorSpk: e.target.value })}
                      placeholder="0015.PJ/DAN.02.01/UP3-BTS/2026"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Rekanan Vendor <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      list="vendor-material-list"
                      value={contractForm.namaVendor}
                      onChange={(e) => setContractForm({ ...contractForm, namaVendor: e.target.value })}
                      placeholder="Pilih atau ketik vendor pabrikan..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <datalist id="vendor-material-list">
                      <option value="PT. TRAFOINDO PRIMA PERKASA" />
                      <option value="PT. WIJAYA KARYA BETON Tbk" />
                      <option value="PT. SUPREME CABLE MANUFACTURING & COMMERCE Tbk" />
                      <option value="PT. SCHNEIDER INDONESIA" />
                      <option value="PT. SUTRADO KABEL MANDIRI" />
                      {vendors.map((v) => (
                        <option key={v.id} value={v.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Nilai SPK Material (Rp) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                        {formatRp(contractForm.nilaiSpk)}
                      </span>
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000000"
                      value={contractForm.nilaiSpk || ''}
                      onChange={(e) => setContractForm({ ...contractForm, nilaiSpk: parseFloat(e.target.value) || 0 })}
                      placeholder="1450000000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Masa Berlaku: Mulai <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={contractForm.validFrom}
                        onChange={(e) => setContractForm({ ...contractForm, validFrom: e.target.value })}
                        placeholder="01 Feb 2026"
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Masa Berlaku: Berakhir <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={contractForm.validTo}
                        onChange={(e) => setContractForm({ ...contractForm, validTo: e.target.value })}
                        placeholder="31 Des 2026"
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Judul / Deskripsi Pengadaan Material
                    </label>
                    <input
                      type="text"
                      value={contractForm.judulPengadaan}
                      onChange={(e) => setContractForm({ ...contractForm, judulPengadaan: e.target.value })}
                      placeholder="Contoh: Pengadaan Trafo Distribusi 20kV / 400V Semester I"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Status Kontrak
                    </label>
                    <select
                      value={contractForm.status}
                      onChange={(e) => setContractForm({ ...contractForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white font-semibold cursor-pointer focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="SELESAI">SELESAI</option>
                      <option value="KEDALUWARSA">KEDALUWARSA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: RINCIAN MATERIAL DINAMIS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-xs">Rincian Material yang Dikontrakkan</span>
                    <span className="text-[10.5px] bg-blue-100 text-blue-800 font-bold px-2 py-0.2 rounded-full">
                      {contractForm.rincianMaterial.length} Item
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMaterialRow}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Material</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr className="divide-x divide-slate-200">
                        <th className="py-2 px-2 text-center w-8">NO</th>
                        <th className="py-2 px-2.5 w-28">KODE MATERIAL</th>
                        <th className="py-2 px-2.5">DESKRIPSI & SPESIFIKASI</th>
                        <th className="py-2 px-2 w-20 text-center">SATUAN</th>
                        <th className="py-2 px-2 text-right w-20">VOLUME</th>
                        <th className="py-2 px-2.5 text-right w-32">HARGA SATUAN (RP)</th>
                        <th className="py-2 px-2.5 text-right w-32">SUBTOTAL (RP)</th>
                        <th className="py-2 px-2 text-center w-12">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {contractForm.rincianMaterial.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400">
                            Belum ada baris material. Klik tombol &quot;Tambah Baris Material&quot;.
                          </td>
                        </tr>
                      ) : (
                        contractForm.rincianMaterial.map((m, idx) => {
                          const subtotal = m.volume * m.hargaSatuan;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 divide-x divide-slate-200">
                              <td className="py-2 px-2 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                              <td className="py-1 px-1.5">
                                <input
                                  type="text"
                                  value={m.kode}
                                  onChange={(e) => handleMaterialFieldChange(idx, 'kode', e.target.value)}
                                  placeholder="M-TRF-250"
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono font-semibold text-slate-800"
                                />
                              </td>
                              <td className="py-1 px-1.5">
                                <input
                                  type="text"
                                  required
                                  value={m.deskripsi}
                                  onChange={(e) => handleMaterialFieldChange(idx, 'deskripsi', e.target.value)}
                                  placeholder="Nama spesifikasi material..."
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-semibold text-slate-900"
                                />
                              </td>
                              <td className="py-1 px-1.5">
                                <input
                                  type="text"
                                  value={m.satuan}
                                  onChange={(e) => handleMaterialFieldChange(idx, 'satuan', e.target.value)}
                                  placeholder="Unit"
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-center font-medium text-slate-700"
                                />
                              </td>
                              <td className="py-1 px-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  value={m.volume}
                                  onChange={(e) => handleMaterialFieldChange(idx, 'volume', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right font-mono font-bold text-blue-700"
                                />
                              </td>
                              <td className="py-1 px-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={m.hargaSatuan}
                                  onChange={(e) => handleMaterialFieldChange(idx, 'hargaSatuan', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right font-mono font-bold text-slate-800"
                                />
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                {formatRp(subtotal)}
                              </td>
                              <td className="py-1 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMaterialRow(idx)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Hapus baris"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100/90 font-bold border-t border-slate-200">
                      <tr className="divide-x divide-slate-200">
                        <td colSpan={6} className="py-2 px-3 text-right uppercase text-[10.5px] text-slate-700">
                          Total Akumulasi Rincian Item Material:
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-black text-emerald-800 text-xs">
                          {formatRp(calculatedItemsTotal)}
                        </td>
                        <td className="py-2 px-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Info pembanding nilai SPK vs Total Item */}
                <div className="flex items-center justify-between text-[11px] p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Nilai SPK Material disepakati: <b>{formatRp(contractForm.nilaiSpk)}</b></span>
                  </div>
                  <div className="font-mono font-semibold">
                    Selisih: <span className={contractForm.nilaiSpk === calculatedItemsTotal ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                      {formatRp(contractForm.nilaiSpk - calculatedItemsTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Simpan Kontrak Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

