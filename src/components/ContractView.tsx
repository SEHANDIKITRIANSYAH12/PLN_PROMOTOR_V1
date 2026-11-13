'use client';

import React, { useState, useMemo } from 'react';
import {
  usePromotorStore,
  getContractRealization,
  sumContractRealization,
  getWoContractValue,
  woBelongsToContract,
  isWoCommittingPagu,
} from '@/store/usePromotorStore';
import { ContractRecord } from '@/types';
import {
  FileCheck2,
  Building2,
  Coins,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Boxes,
  Zap,
  X,
  UserCheck,
} from 'lucide-react';

const parseSupervisor = (s?: string) => {
  if (!s || s === '—' || s === '-') return { name: '—', role: '' };
  const parts = s.split('(');
  const name = parts[0].trim();
  const role = parts.length > 1 ? parts[1].replace(')', '').trim() : '';
  return { name, role };
};

export const ContractView: React.FC = () => {
  const {
    contracts,
    addContract,
    updateContract,
    deleteContract,
    vendors,
    workOrders,
    supervisors,
    showToast,
  } = usePromotorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [jenisPekerjaanFilter, setJenisPekerjaanFilter] = useState<'ALL' | 'Tiang' | 'Paket 1' | 'Paket 2'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'HABIS' | 'KEDALUWARSA'>('ALL');

  // Helper Penguraian Tanggal Indonesia & Perhitungan Sisa Hari
  const parseDateIndo = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    if (trimmed.includes('-')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d;
    }
    const monthMap: Record<string, number> = {
      jan: 0, januari: 0,
      feb: 1, februari: 1,
      mar: 2, maret: 2,
      apr: 3, april: 3,
      mei: 4, may: 4,
      jun: 5, juni: 5,
      jul: 6, juli: 6,
      ags: 7, agustus: 7, aug: 7,
      sep: 8, september: 8,
      okt: 9, oktober: 9, oct: 9,
      nov: 10, november: 10,
      des: 11, desember: 11, dec: 11,
    };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const mKey = parts[1].toLowerCase().slice(0, 3);
      const year = parseInt(parts[2], 10);
      const month = monthMap[mKey];
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const getDaysRemaining = (dateStr?: string): number | null => {
    const target = parseDateIndo(dateStr);
    if (!target) return null;
    // Waktu referensi operasional sistem (11 November 2026)
    const now = new Date();
    const baseDate = now.getFullYear() === 2026 ? now : new Date(2026, 10, 11);
    baseDate.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - baseDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Modal State untuk Tambah / Edit Kontrak KHS
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  // Kontrak yang sedang dibuka rincian Work Order tertautnya
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [editingContract, setEditingContract] = useState<ContractRecord | null>(null);
  const [contractForm, setContractForm] = useState({
    spkNumber: '',
    title: '',
    vendorName: '',
    jenisPekerjaan: 'Paket 1' as 'Tiang' | 'Paket 1' | 'Paket 2',
    tipePengadaan: 'JASA' as 'JASA' | 'MATERIAL' | 'JASA & MATERIAL',
    nilaiKontrak: 2000000000,
    validFrom: '01 Jan 2026',
    validTo: '31 Des 2026',
    nomorAmandemen: '',
    amandemenWaktu: '',
    supervisorId: '',
    supervisorName: '',
    supervisorRole: '',
    status: 'AKTIF' as 'AKTIF' | 'HABIS' | 'KEDALUWARSA',
  });

  // Perhitungan KPI Ringkas. Realisasi selalu diturunkan dari Work Order tertaut,
  // bukan dari angka usedPagu tersimpan yang sebelumnya hanya isian contoh.
  const kpi = useMemo(() => {
    const realisasi = sumContractRealization(contracts, workOrders);
    return {
      totalContracts: contracts.length,
      totalWoTertaut: contracts.reduce(
        (s, c) => s + getContractRealization(c, workOrders).woList.length,
        0
      ),
      totalPagu: realisasi.totalPagu,
      usedPagu: realisasi.terpakai,
      sisaPaguTotal: realisasi.sisa,
      usagePercent: realisasi.persen,
    };
  }, [contracts, workOrders]);

  // Filter Data
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchSearch =
        c.spkNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchJenis =
        jenisPekerjaanFilter === 'ALL' || c.jenisPekerjaan === jenisPekerjaanFilter;
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchSearch && matchJenis && matchStatus;
    });
  }, [contracts, searchTerm, jenisPekerjaanFilter, statusFilter]);

  // Nilai pilihan pengawas pada form: utamakan ID. Bila pengawas yang tersimpan
  // di kontrak lama sudah tidak ada di Master Pengawas, nama lamanya tetap
  // ditampilkan supaya tidak hilang saat kontrak disimpan ulang.
  const supervisorOptionValue = supervisors.some((s) => s.id === contractForm.supervisorId)
    ? contractForm.supervisorId
    : contractForm.supervisorName
    ? '__UNMATCHED__'
    : '';

  // Form Handlers
  const handleOpenAddContract = () => {
    setEditingContract(null);
    const defaultSup = supervisors[0];
    setContractForm({
      spkNumber: `SPK-0${Math.floor(100 + Math.random() * 900)}/2026`,
      title: 'Perjanjian Kerja Pengadaan Jasa Konstruksi Distribusi',
      vendorName: vendors[0]?.name || 'PT. DAYA KONSTRUKSI',
      jenisPekerjaan: 'Paket 1',
      tipePengadaan: 'JASA',
      nilaiKontrak: 2400000000,
      validFrom: '01 Jan 2026',
      validTo: '31 Des 2026',
      nomorAmandemen: '',
      amandemenWaktu: '',
      supervisorId: defaultSup ? defaultSup.id : '',
      supervisorName: defaultSup ? `${defaultSup.name} (${defaultSup.role})` : '',
      supervisorRole: defaultSup ? defaultSup.role : '',
      status: 'AKTIF',
    });
    setIsContractModalOpen(true);
  };

  const handleOpenEditContract = (c: ContractRecord) => {
    setEditingContract(c);
    setContractForm({
      spkNumber: c.spkNumber,
      title: c.title,
      vendorName: c.vendorName,
      jenisPekerjaan: c.jenisPekerjaan || 'Paket 1',
      tipePengadaan: c.tipePengadaan || 'JASA',
      nilaiKontrak: c.nilaiKontrak || c.totalPagu || 0,
      validFrom: c.validFrom || '01 Jan 2026',
      validTo: c.validTo || '31 Des 2026',
      nomorAmandemen: c.nomorAmandemen || '',
      amandemenWaktu: c.amandemenWaktu || '',
      // Kontrak lama hanya menyimpan nama: jodohkan ke Master Pengawas agar
      // tautan ID-nya pulih begitu kontrak ini disimpan ulang.
      supervisorId:
        c.supervisorId || supervisors.find((s) => (c.supervisorName || '').startsWith(s.name))?.id || '',
      supervisorName: c.supervisorName || '',
      supervisorRole: c.supervisorRole || '',
      status: c.status,
    });
    setIsContractModalOpen(true);
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContract) {
      updateContract(editingContract.id, {
        spkNumber: contractForm.spkNumber,
        title: contractForm.title,
        vendorName: contractForm.vendorName,
        jenisPekerjaan: contractForm.jenisPekerjaan,
        tipePengadaan: contractForm.tipePengadaan,
        nilaiKontrak: contractForm.nilaiKontrak,
        totalPagu: contractForm.nilaiKontrak,
        validFrom: contractForm.validFrom,
        validTo: contractForm.validTo,
        nomorAmandemen: contractForm.nomorAmandemen.trim() || undefined,
        amandemenWaktu: contractForm.amandemenWaktu.trim() || undefined,
        supervisorId: contractForm.supervisorId.trim() || undefined,
        supervisorName: contractForm.supervisorName.trim() || undefined,
        supervisorRole: contractForm.supervisorRole.trim() || undefined,
        status: contractForm.status,
      });
      showToast(`✓ Kontrak SPK ${contractForm.spkNumber} berhasil diperbarui`);
    } else {
      addContract({
        spkNumber: contractForm.spkNumber,
        title: contractForm.title,
        vendorId: `VND-${Date.now()}`,
        vendorName: contractForm.vendorName,
        jenisPekerjaan: contractForm.jenisPekerjaan,
        tipePengadaan: contractForm.tipePengadaan,
        nilaiKontrak: contractForm.nilaiKontrak,
        totalPagu: contractForm.nilaiKontrak,
        sisaPagu: contractForm.nilaiKontrak,
        validFrom: contractForm.validFrom,
        validTo: contractForm.validTo,
        nomorAmandemen: contractForm.nomorAmandemen.trim() || undefined,
        amandemenWaktu: contractForm.amandemenWaktu.trim() || undefined,
        supervisorId: contractForm.supervisorId.trim() || undefined,
        supervisorName: contractForm.supervisorName.trim() || undefined,
        supervisorRole: contractForm.supervisorRole.trim() || undefined,
        status: contractForm.status,
      });
      showToast(`✓ Kontrak SPK ${contractForm.spkNumber} berhasil ditambahkan`);
    }
    setIsContractModalOpen(false);
  };

  // Nilai uang selalu tampil angka penuh (Rp 3.500.000.000), bukan singkatan
  // huruf, agar bisa dicocokkan langsung dengan angka di SPK/dokumen RAB.
  const formatRp = (num: number) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Master Kontrak KHS</h2>
            <p className="text-xs text-slate-500">
              Pengelolaan Surat Perjanjian Kerja (SPK), rekanan vendor pelaksana, paket pekerjaan, dan kontrol sisa pagu anggaran
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAddContract}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kontrak Baru</span>
        </button>
      </div>

      {/* KPI Cards Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Total Kontrak KHS</span>
            <FileCheck2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{kpi.totalContracts} SPK</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Terkontrak aktif tahun 2026</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Total Nilai Pagu SPK</span>
            <Coins className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-700">
            {formatRp(kpi.totalPagu)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Akumulasi pagu KHS rekanan</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Realisasi Terpakai WO</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-700">
            {formatRp(kpi.usedPagu)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Terpakai: <span className="font-semibold text-slate-700">{kpi.usagePercent.toFixed(1).replace('.', ',')}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Sisa Pagu Tersedia</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {formatRp(kpi.sisaPaguTotal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sedia untuk alokasi WO berikutnya</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor SPK, rekanan vendor, judul pekerjaan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <select
            value={jenisPekerjaanFilter}
            onChange={(e) => setJenisPekerjaanFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Paket Pekerjaan</option>
            <option value="Paket 1">Paket 1 (JTM & Gardu)</option>
            <option value="Paket 2">Paket 2 (JTR & SR)</option>
            <option value="Tiang">Khusus Tiang</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Status SPK</option>
            <option value="AKTIF">Aktif</option>
            <option value="HABIS">Pagu Habis</option>
            <option value="KEDALUWARSA">Kedaluwarsa</option>
          </select>
        </div>
      </div>

      {/* Tabel Master Kontrak (Sesuai Desain Standar PLN: NO. SPK, VENDOR, PAKET PEKERJAAN, MASA BERLAKU, AMANDEMEN WAKTU, PENGAWAS LAPANGAN, NILAI KONTRAK, TERPAKAI WO, % TERPAKAI WO, SISA, STATUS, AKSI) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] text-slate-500 uppercase font-semibold tracking-wider border-b border-slate-200 text-[10.5px]">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-4">NO. SPK</th>
                <th className="py-3 px-4">VENDOR</th>
                <th className="py-3 px-3 text-center">PAKET</th>
                <th className="py-3 px-4">MASA BERLAKU</th>
                <th className="py-3 px-4">AMANDEMEN WAKTU</th>
                <th className="py-3 px-4">PENGAWAS LAPANGAN</th>
                <th className="py-3 px-4">NILAI KONTRAK</th>
                <th className="py-3 px-4">TERPAKAI WO</th>
                <th className="py-3 px-3 text-center">% TERPAKAI WO</th>
                <th className="py-3 px-4">SISA</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-3 text-center w-20">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                    Tidak ada master kontrak yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const realisasi = getContractRealization(c, workOrders);
                  const nilai = realisasi.nilaiPagu;
                  const used = realisasi.terpakai;
                  const sisa = realisasi.sisa;
                  const isWarning = sisa < 0 || sisa <= nilai * 0.25 || c.status === 'HABIS';
                  const statusLabel = isWarning ? 'Perhatian' : (c.status === 'KEDALUWARSA' ? 'Kedaluwarsa' : 'Aktif');
                  const semuaWoTertaut = workOrders.filter((w) => woBelongsToContract(w, c));
                  const isExpanded = expandedContractId === c.id;

                  return (
                    <React.Fragment key={c.id}>
                    <tr className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-200">
                      {/* NO. SPK */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 text-xs tracking-tight">{c.spkNumber}</div>
                      </td>

                      {/* VENDOR */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800 text-xs">{c.vendorName}</span>
                      </td>

                      {/* PAKET PEKERJAAN */}
                      <td className="py-4 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                          c.jenisPekerjaan === 'Paket 1'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : c.jenisPekerjaan === 'Paket 2'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {c.jenisPekerjaan || 'Paket 1'}
                        </span>
                      </td>

                      {/* MASA BERLAKU */}
                      <td className="py-4 px-4 text-slate-600 text-xs whitespace-nowrap">
                        <div>{c.validFrom || '01 Jan'} – {c.validTo || '31 Des 2026'}</div>
                      </td>

                      {/* OUTPUT AMANDEMEN WAKTU DENGAN ALARM <= 14 HARI */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {c.amandemenWaktu ? (() => {
                          const daysLeft = getDaysRemaining(c.amandemenWaktu);
                          const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14;
                          const isExpired = daysLeft !== null && daysLeft < 0;

                          return (
                            <div className="flex flex-col gap-1">
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                                  isExpiringSoon
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300'
                                    : isExpired
                                    ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                                title={`Batas Akhir Perpanjangan Masa Berlaku: ${c.amandemenWaktu}`}
                              >
                                {isExpiringSoon ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                )}
                                <span>{c.amandemenWaktu}</span>
                              </div>
                              {isExpiringSoon && (
                                <span className="text-[10px] font-extrabold text-rose-600 flex items-center gap-1">
                                  🚨 Sisa {daysLeft} Hari (H-{daysLeft})
                                </span>
                              )}
                              {isExpired && (
                                <span className="text-[10px] font-bold text-slate-500">
                                  Lewat {Math.abs(daysLeft)} Hari
                                </span>
                              )}
                            </div>
                          );
                        })() : (
                          <span className="text-slate-300 font-bold">–</span>
                        )}
                      </td>

                      {/* PENGAWAS LAPANGAN (KOLOM NAMA PENGAWAS) */}
                      <td className="py-4 px-4">
                        {c.supervisorName ? (() => {
                          const sup = parseSupervisor(c.supervisorName);
                          return (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">P1</span>
                              <div className="min-w-0 flex items-baseline gap-1 truncate">
                                <span className="font-bold text-slate-800 text-[11px] truncate">{sup.name}</span>
                                {sup.role && <span className="text-[9.5px] text-slate-500 font-medium truncate shrink-0">({sup.role})</span>}
                              </div>
                            </div>
                          );
                        })() : (
                          <span className="text-slate-400 italic text-xs">–</span>
                        )}
                      </td>

                      {/* NILAI KONTRAK */}
                      <td className="py-4 px-4 text-slate-800 font-medium text-xs whitespace-nowrap" title={`Rp ${nilai.toLocaleString('id-ID')}`}>
                        {formatRp(nilai)}
                      </td>

                      {/* TERPAKAI WO */}
                      <td className="py-4 px-4 text-slate-800 font-medium text-xs whitespace-nowrap" title={`Rp ${used.toLocaleString('id-ID')}`}>
                        {formatRp(used)}
                      </td>

                      {/* PERSENTASE ANTARA WO DENGAN NILAI KONTRAK */}
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        {(() => {
                          const pct = nilai > 0 ? (used / nilai) * 100 : 0;
                          return (
                            <div className="inline-flex flex-col items-center min-w-[70px]">
                              <span
                                className={`text-xs font-bold ${
                                  pct >= 90
                                    ? 'text-rose-600'
                                    : pct >= 70
                                    ? 'text-amber-600'
                                    : 'text-slate-800'
                                }`}
                              >
                                {pct.toFixed(1)}%
                              </span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden border border-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    pct >= 90
                                      ? 'bg-rose-500'
                                      : pct >= 70
                                      ? 'bg-amber-500'
                                      : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* SISA */}
                      <td className="py-4 px-4 text-slate-800 font-medium text-xs whitespace-nowrap" title={`Rp ${sisa.toLocaleString('id-ID')}`}>
                        {formatRp(sisa)}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          statusLabel === 'Aktif'
                            ? 'bg-[#eaf8f0] text-[#1e834b]'
                            : statusLabel === 'Perhatian'
                            ? 'bg-[#fef3dd] text-[#b45309]'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {statusLabel}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setExpandedContractId(isExpanded ? null : c.id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[10.5px] font-bold border transition-colors cursor-pointer bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            title="Lihat Work Order yang tertaut ke kontrak ini"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            {semuaWoTertaut.length} WO
                            <span className="text-[9px] text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditContract(c)}
                            className="p-1.5 rounded-md text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Edit Kontrak"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus kontrak ${c.spkNumber}?`)) {
                                deleteContract(c.id);
                              }
                            }}
                            className="p-1.5 rounded-md text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Hapus Kontrak"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={12} className="px-6 py-4">
                          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">
                            Work Order Tertaut &amp; Pemakaian Pagu
                          </div>
                          {semuaWoTertaut.length === 0 ? (
                            <div className="text-xs text-slate-500">
                              Belum ada Work Order yang memakai kontrak ini.
                            </div>
                          ) : (
                            <table className="w-full text-[11px] bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-slate-100/80 text-slate-600">
                                <tr>
                                  <th className="text-left px-3 py-2 font-semibold">No. WO</th>
                                  <th className="text-left px-3 py-2 font-semibold">Pelanggan</th>
                                  <th className="text-left px-3 py-2 font-semibold">Kategori</th>
                                  <th className="text-left px-3 py-2 font-semibold">Status</th>
                                  <th className="text-right px-3 py-2 font-semibold">Beban Pagu</th>
                                  <th className="text-center px-3 py-2 font-semibold">Progres</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {semuaWoTertaut.map((w) => {
                                  const memotong = isWoCommittingPagu(w);
                                  return (
                                    <tr key={w.id}>
                                      <td className="px-3 py-2 font-semibold text-slate-800">{w.noWorkOrder || w.id}</td>
                                      <td className="px-3 py-2 text-slate-700">{w.customerName}</td>
                                      <td className="px-3 py-2 text-slate-600">{w.category}</td>
                                      <td className="px-3 py-2">
                                        <span className={memotong ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                                          {w.status}
                                          {!memotong && ' (belum memotong pagu)'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-right font-semibold text-slate-800">
                                        {memotong ? formatRp(getWoContractValue(w, c)) : '—'}
                                      </td>
                                      <td className="px-3 py-2 text-center text-slate-700">{w.progress}%</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-slate-50">
                                <tr>
                                  <td colSpan={4} className="px-3 py-2 text-right font-bold text-slate-700">
                                    Total dibebankan ke kontrak ini
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-slate-900">{formatRp(used)}</td>
                                  <td className="px-3 py-2 text-center font-bold text-slate-700">{realisasi.persen}%</td>
                                </tr>
                              </tfoot>
                            </table>
                          )}
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
      </div>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT MASTER KONTRAK                      */}
      {/* ======================================================== */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-700">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingContract ? 'Edit Master Kontrak KHS' : 'Terbitkan Master Kontrak Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Surat Perjanjian Kerja (SPK), rekanan vendor, pagu anggaran, dan addendum
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor SPK / Kontrak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contractForm.spkNumber}
                  onChange={(e) => setContractForm({ ...contractForm, spkNumber: e.target.value })}
                  placeholder="Contoh: SPK-0400/2026 atau 0021.PJ/DAN.02.03/UP3-BTS/2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Rekanan Vendor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="vendor-name-suggestions"
                  value={contractForm.vendorName}
                  onChange={(e) => setContractForm({ ...contractForm, vendorName: e.target.value })}
                  placeholder="Pilih atau ketik nama vendor..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <datalist id="vendor-name-suggestions">
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name} />
                  ))}
                </datalist>
              </div>

              {/* Pengawas Lapangan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pengawas Lapangan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supervisorOptionValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = supervisors.find((s) => s.id === val);
                    if (matched) {
                      setContractForm({
                        ...contractForm,
                        supervisorId: matched.id,
                        supervisorName: `${matched.name} (${matched.role})`,
                        supervisorRole: matched.role,
                      });
                    } else if (val === '') {
                      setContractForm({
                        ...contractForm,
                        supervisorId: '',
                        supervisorName: '',
                        supervisorRole: '',
                      });
                    }
                    // val === '__UNMATCHED__': pertahankan nama lama apa adanya.
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">-- Pilih Pengawas Lapangan --</option>
                  {supervisorOptionValue === '__UNMATCHED__' && (
                    <option value="__UNMATCHED__">
                      {contractForm.supervisorName} — tidak ada di Master Pengawas
                    </option>
                  )}
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.role} ({s.unit})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Pengawas yang akan bertanggung jawab dan menerima notifikasi alarm amandemen KHS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Paket Pekerjaan */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Paket Pekerjaan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={contractForm.jenisPekerjaan}
                    onChange={(e) => setContractForm({ ...contractForm, jenisPekerjaan: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white font-medium focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Paket 1">Paket 1 (JTM & Gardu)</option>
                    <option value="Paket 2">Paket 2 (JTR & SR)</option>
                    <option value="Tiang">Khusus Tiang</option>
                  </select>
                </div>

                {/* Status Kontrak */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Kontrak</label>
                  <select
                    value={contractForm.status}
                    onChange={(e) => setContractForm({ ...contractForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white font-medium focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="AKTIF">Aktif</option>
                    <option value="HABIS">Pagu Habis</option>
                    <option value="KEDALUWARSA">Kedaluwarsa</option>
                  </select>
                </div>
              </div>

              {/* Nilai Kontrak */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Nilai Kontrak Pagu (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Rp {(contractForm.nilaiKontrak || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  required
                  value={contractForm.nilaiKontrak || ''}
                  onChange={(e) => setContractForm({ ...contractForm, nilaiKontrak: parseFloat(e.target.value) || 0 })}
                  placeholder="2400000000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Masa Berlaku Asli */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Masa Berlaku: Mulai <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={contractForm.validFrom}
                      onChange={(e) => setContractForm({ ...contractForm, validFrom: e.target.value })}
                      placeholder="01 Jan 2026"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* INPUTAN AMANDEMEN KONTRAK (ADDENDUM) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Amandemen Kontrak (Addendum)</h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    Opsional / Jika Ada
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  Diisi jika kontrak mengalami perpanjangan waktu kerja atau terdapat penerbitan surat addendum SPK.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  {/* 2. ENTRY AN NOMER AMANDEMEN */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-xs">
                      Nomor Addendum SPK
                    </label>
                    <input
                      type="text"
                      value={contractForm.nomorAmandemen}
                      onChange={(e) => setContractForm({ ...contractForm, nomorAmandemen: e.target.value })}
                      placeholder="0021.PJ.AMD-01/.../2026"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 bg-white focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Nomor surat addendum SPK resmi
                    </span>
                  </div>

                  {/* 1. DI TAMBAH INPUTAN AMANDEMEN WAKTU */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-xs">
                      Amandemen Waktu (Batas Akhir)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={contractForm.amandemenWaktu}
                        onChange={(e) => setContractForm({ ...contractForm, amandemenWaktu: e.target.value })}
                        placeholder="31 Mar 2027"
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 bg-white focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Batas akhir perpanjangan masa berlaku
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Simpan Kontrak</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
