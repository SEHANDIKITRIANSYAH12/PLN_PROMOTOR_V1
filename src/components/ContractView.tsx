'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { ContractRecord, VendorRecord } from '@/types';
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
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Layers,
  Package,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  Briefcase,
  Boxes,
  Zap,
} from 'lucide-react';

export const ContractView: React.FC = () => {
  const {
    contracts,
    addContract,
    updateContract,
    deleteContract,
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    workOrders,
  } = usePromotorStore();

  const [activeTab, setActiveTab] = useState<'contracts' | 'vendors'>('contracts');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters for Master Kontrak
  const [jenisPekerjaanFilter, setJenisPekerjaanFilter] = useState<'ALL' | 'Tiang' | 'Paket 1' | 'Paket 2'>('ALL');
  const [tipePengadaanFilter, setTipePengadaanFilter] = useState<'ALL' | 'JASA' | 'MATERIAL' | 'JASA & MATERIAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'HABIS' | 'KEDALUWARSA'>('ALL');

  // Filters for Master Vendor
  const [vendorJenisFilter, setVendorJenisFilter] = useState<'ALL' | 'Tiang' | 'Paket 1' | 'Paket 2'>('ALL');

  // Modals state for Master Kontrak
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractRecord | null>(null);
  const [contractForm, setContractForm] = useState({
    spkNumber: '',
    title: '',
    vendorId: '',
    jenisPekerjaan: 'Paket 1' as 'Tiang' | 'Paket 1' | 'Paket 2',
    tipePengadaan: 'JASA' as 'JASA' | 'MATERIAL' | 'JASA & MATERIAL',
    nilaiKontrak: 2000000000,
    validFrom: '02 Jan 2026',
    validTo: '31 Des 2026',
    status: 'AKTIF' as 'AKTIF' | 'HABIS' | 'KEDALUWARSA',
  });

  // Modals state for Master Vendor
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    director: '',
    address: '',
    phone: '',
    email: '',
    npwp: '',
    bankAccount: '',
    jenisPekerjaan: ['Paket 1', 'Paket 2'] as ('Tiang' | 'Paket 1' | 'Paket 2')[],
    validFrom: '01 Jan 2026',
    validTo: '31 Des 2026',
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF',
  });

  // Calculate KPIs
  const kpi = useMemo(() => {
    let totalPagu = 0;
    let usedPagu = 0;
    let sisaPaguTotal = 0;

    contracts.forEach((c) => {
      const nilai = c.nilaiKontrak || c.totalPagu || 0;
      const used = c.usedPagu || 0;
      totalPagu += nilai;
      usedPagu += used;
      sisaPaguTotal += (c.sisaPagu !== undefined ? c.sisaPagu : (nilai - used));
    });

    const usagePercent = totalPagu > 0 ? (usedPagu / totalPagu) * 100 : 0;
    const activeVendors = vendors.filter((v) => v.status === 'AKTIF').length;

    // Breakdown per jenis pekerjaan
    const countTiang = contracts.filter((c) => c.jenisPekerjaan === 'Tiang').length;
    const countPaket1 = contracts.filter((c) => c.jenisPekerjaan === 'Paket 1').length;
    const countPaket2 = contracts.filter((c) => c.jenisPekerjaan === 'Paket 2').length;

    return {
      totalPagu,
      usedPagu,
      sisaPaguTotal,
      usagePercent,
      activeVendors,
      countTiang,
      countPaket1,
      countPaket2,
    };
  }, [contracts, vendors]);

  // Filtered Contracts (MASTER KONTRAK)
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (jenisPekerjaanFilter !== 'ALL' && c.jenisPekerjaan !== jenisPekerjaanFilter) return false;
      if (tipePengadaanFilter !== 'ALL' && c.tipePengadaan !== tipePengadaanFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchSpk = c.spkNumber.toLowerCase().includes(q);
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchVendor = c.vendorName.toLowerCase().includes(q);
        if (!matchSpk && !matchTitle && !matchVendor) return false;
      }
      return true;
    });
  }, [contracts, jenisPekerjaanFilter, tipePengadaanFilter, statusFilter, searchTerm]);

  // Filtered Vendors (MASTER VENDOR)
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (vendorJenisFilter !== 'ALL') {
        const list = v.jenisPekerjaan || [];
        if (!list.includes(vendorJenisFilter)) return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = v.name.toLowerCase().includes(q);
        const matchDirector = v.director.toLowerCase().includes(q);
        const matchAddress = v.address.toLowerCase().includes(q);
        const matchPhone = v.phone.toLowerCase().includes(q);
        const matchEmail = v.email.toLowerCase().includes(q);
        if (!matchName && !matchDirector && !matchAddress && !matchPhone && !matchEmail) return false;
      }
      return true;
    });
  }, [vendors, vendorJenisFilter, searchTerm]);

  // Open Add Contract Modal
  const handleOpenAddContract = () => {
    setEditingContract(null);
    setContractForm({
      spkNumber: `00${contracts.length + 25}.PJ/DAN.02.03/UP3-BTS/2026`,
      title: 'Kontrak KHS Jasa Konstruksi Distribusi Paket 2 (JTR & SR)',
      vendorId: vendors[0]?.id || '',
      jenisPekerjaan: 'Paket 2',
      tipePengadaan: 'JASA',
      nilaiKontrak: 2000000000,
      validFrom: '02 Jan 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
    });
    setIsContractModalOpen(true);
  };

  // Open Edit Contract Modal
  const handleOpenEditContract = (c: ContractRecord) => {
    setEditingContract(c);
    setContractForm({
      spkNumber: c.spkNumber,
      title: c.title,
      vendorId: c.vendorId,
      jenisPekerjaan: c.jenisPekerjaan || (c.paketType === 'PAKET_1' ? 'Paket 1' : 'Paket 2'),
      tipePengadaan: c.tipePengadaan || 'JASA',
      nilaiKontrak: c.nilaiKontrak || c.totalPagu,
      validFrom: c.validFrom,
      validTo: c.validTo,
      status: c.status,
    });
    setIsContractModalOpen(true);
  };

  // Save Contract
  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === contractForm.vendorId);
    const vendorName = vendor ? vendor.name : 'Rekanan KHS';

    const paketType = contractForm.jenisPekerjaan === 'Paket 2' ? 'PAKET_2' : 'PAKET_1';

    if (editingContract) {
      updateContract(editingContract.id, {
        ...contractForm,
        vendorName,
        paketType,
        totalPagu: contractForm.nilaiKontrak,
      });
    } else {
      addContract({
        ...contractForm,
        vendorName,
        paketType,
        totalPagu: contractForm.nilaiKontrak,
        sisaPagu: contractForm.nilaiKontrak,
      });
    }
    setIsContractModalOpen(false);
  };

  // Open Add Vendor Modal
  const handleOpenAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      name: '',
      director: '',
      address: '',
      phone: '',
      email: '',
      npwp: '',
      bankAccount: '',
      jenisPekerjaan: ['Tiang', 'Paket 1'],
      validFrom: '01 Jan 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
    });
    setIsVendorModalOpen(true);
  };

  // Open Edit Vendor Modal
  const handleOpenEditVendor = (v: VendorRecord) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name,
      director: v.director,
      address: v.address,
      phone: v.phone,
      email: v.email,
      npwp: v.npwp || '',
      bankAccount: v.bankAccount || '',
      jenisPekerjaan: v.jenisPekerjaan || (v.paketType === 'PAKET_1' ? ['Paket 1'] : v.paketType === 'PAKET_2' ? ['Paket 2'] : ['Paket 1', 'Paket 2']),
      validFrom: v.validFrom || '01 Jan 2026',
      validTo: v.validTo || '31 Des 2026',
      status: v.status,
    });
    setIsVendorModalOpen(true);
  };

  // Save Vendor
  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) return;

    if (editingVendor) {
      updateVendor(editingVendor.id, vendorForm);
    } else {
      addVendor(vendorForm);
    }
    setIsVendorModalOpen(false);
  };

  // Helper toggle jenis pekerjaan di form vendor
  const toggleJenisPekerjaanVendor = (jenis: 'Tiang' | 'Paket 1' | 'Paket 2') => {
    setVendorForm((prev) => {
      const exists = prev.jenisPekerjaan.includes(jenis);
      if (exists) {
        if (prev.jenisPekerjaan.length === 1) return prev; // min 1
        return { ...prev, jenisPekerjaan: prev.jenisPekerjaan.filter((j) => j !== jenis) };
      } else {
        return { ...prev, jenisPekerjaan: [...prev.jenisPekerjaan, jenis] };
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-sky-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" />
                Master Kontrak KHS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Master Vendor Rekanan
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Tahun Anggaran 2026
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Master Kontrak & Master Vendor
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Pusat data pengadaan: Nilai kontrak, jenis pekerjaan (Tiang / Paket 1 / Paket 2), kontrak material & jasa, masa berlaku, serta sisa pagu anggaran.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAddVendor}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600/90 hover:bg-purple-600 text-white border border-purple-400/30 transition-all flex items-center gap-2 backdrop-blur-xs shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <Building2 className="w-4 h-4 text-purple-200" />
              + Tambah Master Vendor
            </button>
            <button
              onClick={handleOpenAddContract}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              + Terbitkan Master Kontrak
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Total Nilai Kontrak 2026</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            Rp {(kpi.totalPagu / 1e9).toFixed(2)} Miliar
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Dari {contracts.length} master kontrak aktif
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Realisasi WO Terbit</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-700">
            Rp {(kpi.usedPagu / 1e9).toFixed(2)} Miliar
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpi.usagePercent)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-600">
              {kpi.usagePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Sisa Pagu Anggaran</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-600">
            Rp {(kpi.sisaPaguTotal / 1e9).toFixed(2)} Miliar
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sedia untuk SPK / Work Order berikutnya
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Master Vendor Rekanan</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {kpi.activeVendors} <span className="text-xs font-normal text-slate-400">vendor aktif</span>
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Tiang: {kpi.countTiang} | Paket 1: {kpi.countPaket1} | Paket 2: {kpi.countPaket2}
          </div>
        </div>
      </div>

      {/* Tabs Menu (Tabel Master Kontrak vs Tabel Master Vendor) */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 gap-3">
        {/* Tab 1: MASTER KONTRAK (Orange Theme) */}
        <button
          onClick={() => {
            setActiveTab('contracts');
            setSearchTerm('');
          }}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'contracts'
              ? 'border-amber-600 text-amber-700 bg-amber-50/60 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="p-1 rounded bg-amber-100 text-amber-700">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <span>TABEL MASTER KONTRAK</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {contracts.length}
          </span>
        </button>

        {/* Tab 2: MASTER VENDOR (Purple Theme) */}
        <button
          onClick={() => {
            setActiveTab('vendors');
            setSearchTerm('');
          }}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'vendors'
              ? 'border-purple-600 text-purple-700 bg-purple-50/60 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="p-1 rounded bg-purple-100 text-purple-700">
            <Building2 className="w-4 h-4" />
          </div>
          <span>TABEL MASTER VENDOR</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            {vendors.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-b-xl border-x border-b border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={
                activeTab === 'contracts'
                  ? 'Cari No SPK, judul kontrak, atau rekanan...'
                  : 'Cari data perusahaan, direktur, kontak, email...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
            />
          </div>

          {activeTab === 'contracts' ? (
            <>
              <div>
                <select
                  value={jenisPekerjaanFilter}
                  onChange={(e) => setJenisPekerjaanFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">Semua Jenis Pekerjaan</option>
                  <option value="Tiang">Khusus Tiang</option>
                  <option value="Paket 1">Paket 1 (JTM & Gardu)</option>
                  <option value="Paket 2">Paket 2 (JTR & SR)</option>
                </select>
              </div>

              <div>
                <select
                  value={tipePengadaanFilter}
                  onChange={(e) => setTipePengadaanFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">Semua Kontrak (Jasa & Material)</option>
                  <option value="JASA">Hanya Kontrak Jasa</option>
                  <option value="MATERIAL">Hanya Kontrak Material</option>
                  <option value="JASA & MATERIAL">Kontrak Jasa & Material</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <select
                  value={vendorJenisFilter}
                  onChange={(e) => setVendorJenisFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">Semua Jenis Pekerjaan</option>
                  <option value="Tiang">Kualifikasi Tiang</option>
                  <option value="Paket 1">Kualifikasi Paket 1</option>
                  <option value="Paket 2">Kualifikasi Paket 2</option>
                </select>
              </div>

              <div className="flex items-center text-xs text-slate-500 px-2">
                <span className="font-semibold text-purple-700">{filteredVendors.length}</span>
                <span className="ml-1">dari total {vendors.length} vendor terdaftar</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TABEL 1: MASTER KONTRAK                                 */}
      {/* Kolom Sesuai Screenshot:                                 */}
      {/* 1. Kontrak jasa per jenis pekerjaan (Tiang/Paket 1/2)   */}
      {/* 2. Kontrak material (Jasa / Material / Jasa & Material) */}
      {/* 3. Nilai kontrak (Rp)                                   */}
      {/* 4. Masa berlaku (Tgl Mulai s/d Tgl Berakhir)            */}
      {/* 5. Sisa pagu (Rp & %)                                   */}
      {/* ======================================================== */}
      {activeTab === 'contracts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-amber-50/70 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500 text-white">
                <FileCheck2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-amber-950">
                  MASTER KONTRAK
                </h2>
                <p className="text-[11px] text-amber-800">
                  Kontrak jasa per jenis pekerjaan • Kontrak material • Nilai kontrak • Masa berlaku • Sisa pagu
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenAddContract}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Kontrak
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-48">Nomor SPK / PJ Kontrak</th>
                  <th className="py-3 px-3 min-w-[200px]">Vendor Rekanan</th>
                  <th className="py-3 px-3 w-36 text-center">Jenis Pekerjaan</th>
                  <th className="py-3 px-3 w-36 text-center">Kategori Pengadaan</th>
                  <th className="py-3 px-4 w-36 text-right">Nilai Kontrak</th>
                  <th className="py-3 px-3 w-40 text-center">Masa Berlaku</th>
                  <th className="py-3 px-4 w-44 text-right">Sisa Pagu Anggaran</th>
                  <th className="py-3 px-3 w-24 text-center">Status</th>
                  <th className="py-3 px-3 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                      Tidak ada master kontrak yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c, index) => {
                    const nilai = c.nilaiKontrak || c.totalPagu || 0;
                    const used = c.usedPagu || 0;
                    const sisa = c.sisaPagu !== undefined ? c.sisaPagu : (nilai - used);
                    const sisaPercent = nilai > 0 ? (sisa / nilai) * 100 : 0;
                    const usedPercent = nilai > 0 ? (used / nilai) * 100 : 0;
                    const jenis = c.jenisPekerjaan || (c.paketType === 'PAKET_1' ? 'Paket 1' : 'Paket 2');
                    const tipe = c.tipePengadaan || 'JASA';

                    const woCount = workOrders.filter(
                      (w) => w.vendor === c.vendorName || w.spkNumber === c.spkNumber
                    ).length;

                    return (
                      <tr key={c.id} className="hover:bg-amber-50/30 transition-colors">
                        {/* No */}
                        <td className="py-3.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Nomor SPK / Kontrak & Judul */}
                        <td className="py-3.5 px-3">
                          <div className="font-mono text-[11px] font-bold text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 inline-block">
                            {c.spkNumber}
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium mt-1 line-clamp-1" title={c.title}>
                            {c.title}
                          </div>
                        </td>

                        {/* Vendor Rekanan */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{c.vendorName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ID: {c.vendorId}
                          </div>
                        </td>

                        {/* Kontrak Jasa per Jenis Pekerjaan */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                              jenis === 'Tiang'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : jenis === 'Paket 1'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {jenis === 'Tiang' ? 'Tiang' : jenis === 'Paket 1' ? 'Paket 1 (JTM)' : 'Paket 2 (JTR)'}
                          </span>
                        </td>

                        {/* Kontrak Material / Jasa */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              tipe === 'MATERIAL'
                                ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                : tipe === 'JASA & MATERIAL'
                                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                : 'bg-teal-100 text-teal-900 border border-teal-300'
                            }`}
                          >
                            {tipe === 'MATERIAL'
                              ? 'Kontrak Material'
                              : tipe === 'JASA & MATERIAL'
                              ? 'Kontrak Jasa & Material'
                              : 'Kontrak Jasa'}
                          </span>
                        </td>

                        {/* Nilai Kontrak */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                          Rp {nilai.toLocaleString('id-ID')}
                        </td>

                        {/* Masa Berlaku */}
                        <td className="py-3.5 px-3 text-center text-[11px] text-slate-700">
                          <div className="font-semibold flex items-center justify-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span>{c.validFrom}</span>
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            s/d <span className="font-semibold text-slate-800">{c.validTo}</span>
                          </div>
                        </td>

                        {/* Sisa Pagu */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-extrabold text-emerald-700 text-xs">
                            Rp {sisa.toLocaleString('id-ID')}
                          </div>
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  usedPercent > 90
                                    ? 'bg-rose-500'
                                    : usedPercent > 70
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, usedPercent)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-slate-500">
                              Sisa {sisaPercent.toFixed(0)}% ({woCount} WO)
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'AKTIF'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : c.status === 'HABIS'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditContract(c)}
                              className="p-1.5 rounded-md text-amber-700 hover:bg-amber-100 transition-colors"
                              title="Edit Kontrak"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus kontrak ${c.spkNumber}?`)) {
                                  deleteContract(c.id);
                                }
                              }}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Kontrak"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TABEL 2: MASTER VENDOR                                  */}
      {/* Kolom Sesuai Screenshot:                                 */}
      {/* 1. Data perusahaan (Nama PT/CV, Direktur, Alamat, NPWP) */}
      {/* 2. Kontak (No Telepon, Email)                           */}
      {/* 3. Jenis pekerjaan (Tiang / Paket 1 / Paket 2)          */}
      {/* 4. Masa berlaku (Tgl Mulai s/d Tgl Berakhir)            */}
      {/* ======================================================== */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-purple-50/70 border-b border-purple-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-purple-600 text-white">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-purple-950">
                  MASTER VENDOR
                </h2>
                <p className="text-[11px] text-purple-800">
                  Data perusahaan • Kontak • Jenis pekerjaan (Tiang/Paket 1/Paket 2) • Masa berlaku
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenAddVendor}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Vendor
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-4 min-w-[260px]">
                    Data Perusahaan
                    <span className="block text-[10px] font-normal text-slate-400 capitalize">
                      Nama PT/CV • Direktur/PIC • Alamat • NPWP
                    </span>
                  </th>
                  <th className="py-3 px-4 min-w-[200px]">
                    Kontak
                    <span className="block text-[10px] font-normal text-slate-400 capitalize">
                      Telepon / WA • Email Perusahaan
                    </span>
                  </th>
                  <th className="py-3 px-4 min-w-[210px] text-center">
                    Jenis Pekerjaan
                    <span className="block text-[10px] font-normal text-slate-400 capitalize">
                      Tiang / Paket 1 / Paket 2
                    </span>
                  </th>
                  <th className="py-3 px-3 w-40 text-center">
                    Masa Berlaku
                    <span className="block text-[10px] font-normal text-slate-400 capitalize">
                      Periode Kualifikasi
                    </span>
                  </th>
                  <th className="py-3 px-3 w-28 text-center">Kontrak Aktif</th>
                  <th className="py-3 px-3 w-20 text-center">Status</th>
                  <th className="py-3 px-3 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-500" />
                      Tidak ada master vendor yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v, index) => {
                    const vendorContracts = contracts.filter(
                      (c) => c.vendorId === v.id || c.vendorName === v.name
                    );

                    const jenisList = v.jenisPekerjaan || (v.paketType === 'PAKET_1' ? ['Paket 1'] : v.paketType === 'PAKET_2' ? ['Paket 2'] : ['Paket 1', 'Paket 2']);

                    return (
                      <tr key={v.id} className="hover:bg-purple-50/30 transition-colors">
                        {/* No */}
                        <td className="py-3.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* DATA PERUSAHAAN (Nama PT/CV, Direktur, Alamat, NPWP) */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {v.name}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                            <span className="font-medium text-purple-900">Direktur/PIC:</span>
                            <span>{v.director}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{v.address}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                            {v.npwp && <span>NPWP: {v.npwp}</span>}
                            {v.bankAccount && <span>• Rek: {v.bankAccount}</span>}
                          </div>
                        </td>

                        {/* KONTAK (Telepon, Email) */}
                        <td className="py-3.5 px-4 text-[11px]">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{v.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 mt-1">
                            <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{v.email}</span>
                          </div>
                        </td>

                        {/* JENIS PEKERJAAN (Tiang / Paket 1 / Paket 2) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {jenisList.includes('Tiang') && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                Tiang
                              </span>
                            )}
                            {jenisList.includes('Paket 1') && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                                Paket 1 (JTM)
                              </span>
                            )}
                            {jenisList.includes('Paket 2') && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Paket 2 (JTR)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* MASA BERLAKU */}
                        <td className="py-3.5 px-3 text-center text-[11px] text-slate-700">
                          <div className="font-semibold flex items-center justify-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-purple-600" />
                            <span>{v.validFrom || '01 Jan 2026'}</span>
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            s/d <span className="font-semibold text-slate-800">{v.validTo || '31 Des 2026'}</span>
                          </div>
                        </td>

                        {/* Kontrak Aktif */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {vendorContracts.length} Kontrak
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              v.status === 'AKTIF'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditVendor(v)}
                              className="p-1.5 rounded-md text-purple-700 hover:bg-purple-100 transition-colors"
                              title="Edit Vendor"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus rekanan vendor ${v.name}?`)) {
                                  deleteVendor(v.id);
                                }
                              }}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Vendor"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TERBITKAN / EDIT MASTER KONTRAK                    */}
      {/* ======================================================== */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <FileCheck2 className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingContract ? 'Edit Master Kontrak' : 'Terbitkan Master Kontrak Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 leading-none"
              >
                &times;
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
                  placeholder="0021.PJ/DAN.02.03/UP3-BTS/2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Kontrak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contractForm.title}
                  onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                  placeholder="Kontrak KHS Jasa Konstruksi Distribusi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vendor Rekanan Pemenang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={contractForm.vendorId}
                  onChange={(e) => setContractForm({ ...contractForm, vendorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Kontrak Jasa per Jenis Pekerjaan */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Pekerjaan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={contractForm.jenisPekerjaan}
                    onChange={(e) => setContractForm({ ...contractForm, jenisPekerjaan: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
                  >
                    <option value="Tiang">Tiang (Distribusi TM/TR)</option>
                    <option value="Paket 1">Paket 1 (JTM & Gardu)</option>
                    <option value="Paket 2">Paket 2 (JTR & SR)</option>
                  </select>
                </div>

                {/* Kontrak Material / Jasa */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Pengadaan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={contractForm.tipePengadaan}
                    onChange={(e) => setContractForm({ ...contractForm, tipePengadaan: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
                  >
                    <option value="JASA">Kontrak Jasa</option>
                    <option value="MATERIAL">Kontrak Material</option>
                    <option value="JASA & MATERIAL">Kontrak Jasa & Material</option>
                  </select>
                </div>
              </div>

              {/* Nilai Kontrak */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nilai Kontrak (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  required
                  value={contractForm.nilaiKontrak}
                  onChange={(e) => setContractForm({ ...contractForm, nilaiKontrak: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                />
              </div>

              {/* Masa Berlaku */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Masa Berlaku: Mulai</label>
                  <input
                    type="text"
                    value={contractForm.validFrom}
                    onChange={(e) => setContractForm({ ...contractForm, validFrom: e.target.value })}
                    placeholder="02 Jan 2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Masa Berlaku: Berakhir</label>
                  <input
                    type="text"
                    value={contractForm.validTo}
                    onChange={(e) => setContractForm({ ...contractForm, validTo: e.target.value })}
                    placeholder="31 Des 2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Kontrak</label>
                <select
                  value={contractForm.status}
                  onChange={(e) => setContractForm({ ...contractForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
                >
                  <option value="AKTIF">AKTIF</option>
                  <option value="HABIS">HABIS</option>
                  <option value="KEDALUWARSA">KEDALUWARSA</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                >
                  Simpan Master Kontrak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT MASTER VENDOR                       */}
      {/* ======================================================== */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <Building2 className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingVendor ? 'Edit Master Vendor' : 'Tambah Master Vendor Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsVendorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-3.5 text-xs">
              {/* Bagian 1: Data Perusahaan */}
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2.5">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
                  1. Data Perusahaan
                </span>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Perusahaan (PT / CV) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    placeholder="PT. HILMAN PRIMA PERKASA"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Direktur / PIC <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vendorForm.director}
                      onChange={(e) => setVendorForm({ ...vendorForm, director: e.target.value })}
                      placeholder="Hilman Sukmana, S.T."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NPWP Perusahaan</label>
                    <input
                      type="text"
                      value={vendorForm.npwp}
                      onChange={(e) => setVendorForm({ ...vendorForm, npwp: e.target.value })}
                      placeholder="01.442.891..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor</label>
                  <input
                    type="text"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    placeholder="Jl. Raya Pandeglang Km. 4, Rangkasbitung"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Bagian 2: Kontak */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  2. Kontak
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                    <input
                      type="text"
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      placeholder="(0252) 201889"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Perusahaan</label>
                    <input
                      type="email"
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      placeholder="kontrak@rekanan.co.id"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Jenis Pekerjaan (Tiang / Paket 1 / Paket 2) */}
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
                  3. Jenis Pekerjaan (Tiang / Paket 1 / Paket 2)
                </span>
                <p className="text-[10px] text-slate-500">
                  Pilih kualifikasi pekerjaan yang dapat ditangani oleh vendor ini:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <label
                    onClick={() => toggleJenisPekerjaanVendor('Tiang')}
                    className={`cursor-pointer p-2.5 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                      vendorForm.jenisPekerjaan.includes('Tiang')
                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs">Tiang</span>
                    <span className="text-[9px] text-slate-500 font-normal">Pemasangan & Tiang</span>
                  </label>

                  <label
                    onClick={() => toggleJenisPekerjaanVendor('Paket 1')}
                    className={`cursor-pointer p-2.5 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                      vendorForm.jenisPekerjaan.includes('Paket 1')
                        ? 'bg-blue-100 border-blue-400 text-blue-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs">Paket 1</span>
                    <span className="text-[9px] text-slate-500 font-normal">JTM & Gardu</span>
                  </label>

                  <label
                    onClick={() => toggleJenisPekerjaanVendor('Paket 2')}
                    className={`cursor-pointer p-2.5 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                      vendorForm.jenisPekerjaan.includes('Paket 2')
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs">Paket 2</span>
                    <span className="text-[9px] text-slate-500 font-normal">JTR & SR</span>
                  </label>
                </div>
              </div>

              {/* Bagian 4: Masa Berlaku */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  4. Masa Berlaku
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                    <input
                      type="text"
                      value={vendorForm.validFrom}
                      onChange={(e) => setVendorForm({ ...vendorForm, validFrom: e.target.value })}
                      placeholder="01 Jan 2026"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Berakhir</label>
                    <input
                      type="text"
                      value={vendorForm.validTo}
                      onChange={(e) => setVendorForm({ ...vendorForm, validTo: e.target.value })}
                      placeholder="31 Des 2026"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="block font-semibold text-slate-700 mb-1">Status Kualifikasi</label>
                  <select
                    value={vendorForm.status}
                    onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="NONAKTIF">NONAKTIF</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  Simpan Master Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
