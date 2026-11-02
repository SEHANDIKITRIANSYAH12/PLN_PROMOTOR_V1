'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { VendorRecord, ContractRecord } from '@/types';
import { 
  HS_WO_PAKET_1_DATA, 
  HS_WO_PAKET_2_DATA,
  HsWoRowItem
} from '@/data/hsWoMasterData';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  CreditCard, 
  Briefcase,
  X,
  Layers,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Coins,
  FileSpreadsheet,
  Tag,
  RotateCcw,
  Sparkles,
  Clock
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';

export const MasterVendorView: React.FC = () => {
  const { 
    vendors, 
    addVendor, 
    updateVendor, 
    deleteVendor, 
    contracts, 
    addContract,
    updateContract,
    deleteContract,
    customKhsPrices,
    updateKhsPrice,
    resetKhsPrice,
    showToast 
  } = usePromotorStore();

  // Tab Utama: 'vendors' (Profil Vendor) | 'contracts' (Kontrak SPK) | 'prices' (Harga KHS)
  const [activeMainTab, setActiveMainTab] = useState<'vendors' | 'contracts' | 'prices'>('vendors');

  // ==========================================
  // TAB 1: STATE DATA VENDOR
  // ==========================================
  const [searchTermVendor, setSearchTermVendor] = useState('');
  const [filterJenisVendor, setFilterJenisVendor] = useState<string>('ALL');
  const [filterStatusVendor, setFilterStatusVendor] = useState<string>('ALL');
  const [vendorPage, setVendorPage] = useState(1);
  const [vendorPageSize, setVendorPageSize] = useState(10);

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null);
  const [formName, setFormName] = useState('');
  const [formDirector, setFormDirector] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNpwp, setFormNpwp] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBankAccount, setFormBankAccount] = useState('');
  const [formJenisPekerjaan, setFormJenisPekerjaan] = useState<('Tiang' | 'Paket 1' | 'Paket 2')[]>(['Paket 1']);
  const [formValidFrom, setFormValidFrom] = useState('01 Jan 2026');
  const [formValidTo, setFormValidTo] = useState('31 Des 2026');
  const [formStatus, setFormStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');

  // ==========================================
  // TAB 2: STATE KONTRAK SPK
  // ==========================================
  const [searchTermContract, setSearchTermContract] = useState('');
  const [filterJenisContract, setFilterJenisContract] = useState<string>('ALL');
  const [filterStatusContract, setFilterStatusContract] = useState<string>('ALL');
  const [contractPage, setContractPage] = useState(1);
  const [contractPageSize, setContractPageSize] = useState(10);

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

  // ==========================================
  // TAB 3: STATE HARGA KHS VENDOR
  // ==========================================
  const [activeKhsPaket, setActiveKhsPaket] = useState<'paket1' | 'paket2'>('paket1');
  const [searchKhsTerm, setSearchKhsTerm] = useState('');
  const [filterKhsKategori, setFilterKhsKategori] = useState<'ALL' | 'MATERIAL' | 'JASA'>('ALL');
  const [khsPage, setKhsPage] = useState(1);
  const [khsPageSize, setKhsPageSize] = useState(25);

  const [editingKhsItem, setEditingKhsItem] = useState<{
    id: string;
    kode: string;
    desc: string;
    sat: string;
    defaultPrice: number;
    currentPrice: number;
  } | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  // Helper format rupiah
  const formatRp = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  };

  // ==========================================
  // LOGIKA TAB 1: VENDORS
  // ==========================================
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch = 
        v.name.toLowerCase().includes(searchTermVendor.toLowerCase()) ||
        v.director.toLowerCase().includes(searchTermVendor.toLowerCase()) ||
        v.address.toLowerCase().includes(searchTermVendor.toLowerCase()) ||
        (v.npwp && v.npwp.toLowerCase().includes(searchTermVendor.toLowerCase())) ||
        (v.phone && v.phone.toLowerCase().includes(searchTermVendor.toLowerCase()));

      const matchJenis = filterJenisVendor === 'ALL' || v.jenisPekerjaan.includes(filterJenisVendor as any);
      const matchStatus = filterStatusVendor === 'ALL' || v.status === filterStatusVendor;

      return matchSearch && matchJenis && matchStatus;
    });
  }, [vendors, searchTermVendor, filterJenisVendor, filterStatusVendor]);

  const paginatedVendors = useMemo(() => {
    const start = (vendorPage - 1) * vendorPageSize;
    return filteredVendors.slice(start, start + vendorPageSize);
  }, [filteredVendors, vendorPage, vendorPageSize]);

  const openAddVendorModal = () => {
    setEditingVendor(null);
    setFormName('');
    setFormDirector('');
    setFormAddress('');
    setFormNpwp('');
    setFormPhone('');
    setFormEmail('');
    setFormBankAccount('');
    setFormJenisPekerjaan(['Paket 1']);
    setFormValidFrom('01 Jan 2026');
    setFormValidTo('31 Des 2026');
    setFormStatus('AKTIF');
    setIsVendorModalOpen(true);
  };

  const openEditVendorModal = (v: VendorRecord) => {
    setEditingVendor(v);
    setFormName(v.name);
    setFormDirector(v.director);
    setFormAddress(v.address);
    setFormNpwp(v.npwp || '');
    setFormPhone(v.phone);
    setFormEmail(v.email);
    setFormBankAccount(v.bankAccount || '');
    setFormJenisPekerjaan(v.jenisPekerjaan || ['Paket 1']);
    setFormValidFrom(v.validFrom || '01 Jan 2026');
    setFormValidTo(v.validTo || '31 Des 2026');
    setFormStatus(v.status);
    setIsVendorModalOpen(true);
  };

  const handleToggleJenisVendor = (jenis: 'Tiang' | 'Paket 1' | 'Paket 2') => {
    if (formJenisPekerjaan.includes(jenis)) {
      if (formJenisPekerjaan.length === 1) {
        showToast('Minimal harus memilih 1 jenis pekerjaan');
        return;
      }
      setFormJenisPekerjaan(formJenisPekerjaan.filter((j) => j !== jenis));
    } else {
      setFormJenisPekerjaan([...formJenisPekerjaan, jenis]);
    }
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDirector.trim()) {
      showToast('Nama perusahaan dan direktur wajib diisi');
      return;
    }

    const payload = {
      name: formName.trim().toUpperCase(),
      director: formDirector.trim(),
      address: formAddress.trim(),
      npwp: formNpwp.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      bankAccount: formBankAccount.trim(),
      jenisPekerjaan: formJenisPekerjaan,
      validFrom: formValidFrom,
      validTo: formValidTo,
      status: formStatus,
    };

    if (editingVendor) {
      updateVendor(editingVendor.id, payload);
    } else {
      addVendor(payload);
    }
    setIsVendorModalOpen(false);
  };

  // ==========================================
  // LOGIKA TAB 2: KONTRAK SPK
  // ==========================================
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchSearch =
        c.spkNumber.toLowerCase().includes(searchTermContract.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTermContract.toLowerCase()) ||
        c.vendorName.toLowerCase().includes(searchTermContract.toLowerCase());

      const matchJenis = filterJenisContract === 'ALL' || c.jenisPekerjaan === filterJenisContract;
      const matchStatus = filterStatusContract === 'ALL' || c.status === filterStatusContract;

      return matchSearch && matchJenis && matchStatus;
    });
  }, [contracts, searchTermContract, filterJenisContract, filterStatusContract]);

  const paginatedContracts = useMemo(() => {
    const start = (contractPage - 1) * contractPageSize;
    return filteredContracts.slice(start, start + contractPageSize);
  }, [filteredContracts, contractPage, contractPageSize]);

  // Total pagu KPI
  const contractKpis = useMemo(() => {
    let totalPagu = 0;
    let usedPagu = 0;
    let sisaPagu = 0;
    contracts.forEach((c) => {
      const p = c.nilaiKontrak || c.totalPagu || 0;
      const u = c.usedPagu || 0;
      totalPagu += p;
      usedPagu += u;
      sisaPagu += (c.sisaPagu !== undefined ? c.sisaPagu : p - u);
    });
    return { totalPagu, usedPagu, sisaPagu, totalContracts: contracts.length };
  }, [contracts]);

  const openAddContractModal = () => {
    setEditingContract(null);
    setContractForm({
      spkNumber: `00${contracts.length + 21}.PJ/DAN.02.03/UP3-BTS/2026`,
      title: 'Kontrak KHS Jasa Konstruksi Distribusi UP3 Banten Selatan',
      vendorId: vendors[0]?.id || '',
      jenisPekerjaan: 'Paket 1',
      tipePengadaan: 'JASA',
      nilaiKontrak: 2500000000,
      validFrom: '02 Jan 2026',
      validTo: '31 Des 2026',
      status: 'AKTIF',
    });
    setIsContractModalOpen(true);
  };

  const openEditContractModal = (c: ContractRecord) => {
    setEditingContract(c);
    setContractForm({
      spkNumber: c.spkNumber,
      title: c.title,
      vendorId: c.vendorId,
      jenisPekerjaan: c.jenisPekerjaan,
      tipePengadaan: c.tipePengadaan || 'JASA',
      nilaiKontrak: c.nilaiKontrak || c.totalPagu || 0,
      validFrom: c.validFrom || '02 Jan 2026',
      validTo: c.validTo || '31 Des 2026',
      status: c.status,
    });
    setIsContractModalOpen(true);
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.spkNumber.trim() || !contractForm.title.trim()) {
      showToast('Nomor SPK dan judul kontrak wajib diisi');
      return;
    }
    const targetVendor = vendors.find((v) => v.id === contractForm.vendorId) || vendors[0];

    if (editingContract) {
      updateContract(editingContract.id, {
        spkNumber: contractForm.spkNumber.trim(),
        title: contractForm.title.trim(),
        vendorId: targetVendor?.id || editingContract.vendorId,
        vendorName: targetVendor?.name || editingContract.vendorName,
        jenisPekerjaan: contractForm.jenisPekerjaan,
        tipePengadaan: contractForm.tipePengadaan,
        nilaiKontrak: Number(contractForm.nilaiKontrak),
        totalPagu: Number(contractForm.nilaiKontrak),
        validFrom: contractForm.validFrom.trim(),
        validTo: contractForm.validTo.trim(),
        status: contractForm.status,
      });
    } else {
      addContract({
        spkNumber: contractForm.spkNumber.trim(),
        title: contractForm.title.trim(),
        vendorId: targetVendor?.id || '',
        vendorName: targetVendor?.name || 'PT. HILMAN PRIMA PERKASA',
        jenisPekerjaan: contractForm.jenisPekerjaan,
        tipePengadaan: contractForm.tipePengadaan,
        nilaiKontrak: Number(contractForm.nilaiKontrak),
        totalPagu: Number(contractForm.nilaiKontrak),
        sisaPagu: Number(contractForm.nilaiKontrak),
        validFrom: contractForm.validFrom.trim(),
        validTo: contractForm.validTo.trim(),
        status: contractForm.status,
      });
    }
    setIsContractModalOpen(false);
  };

  // ==========================================
  // LOGIKA TAB 3: HARGA KHS VENDOR
  // ==========================================
  const rawKhsItems: HsWoRowItem[] = useMemo(() => {
    return activeKhsPaket === 'paket1' ? HS_WO_PAKET_1_DATA : HS_WO_PAKET_2_DATA;
  }, [activeKhsPaket]);

  const filteredKhsItems = useMemo(() => {
    return rawKhsItems.filter((item) => {
      if (item.isHeader) return false;
      const matchSearch = 
        item.uraian.toLowerCase().includes(searchKhsTerm.toLowerCase()) ||
        item.nomorMaterial.toLowerCase().includes(searchKhsTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchKhsTerm.toLowerCase());

      const matchKategori = filterKhsKategori === 'ALL' || item.kategori === filterKhsKategori;
      return matchSearch && matchKategori;
    });
  }, [rawKhsItems, searchKhsTerm, filterKhsKategori]);

  const paginatedKhsItems = useMemo(() => {
    const start = (khsPage - 1) * khsPageSize;
    return filteredKhsItems.slice(start, start + khsPageSize);
  }, [filteredKhsItems, khsPage, khsPageSize]);

  const openEditKhsModal = (it: HsWoRowItem) => {
    const activePrice = customKhsPrices[it.id] !== undefined ? customKhsPrices[it.id] : it.hargaSatuan;
    setEditingKhsItem({
      id: it.id,
      kode: it.nomorMaterial || it.id,
      desc: it.uraian,
      sat: it.sat || 'Buah',
      defaultPrice: it.hargaSatuan,
      currentPrice: activePrice,
    });
    setEditPriceInput(String(activePrice));
    setEditReason('Penyesuaian adendum kontrak SPK KHS 2026');
  };

  const handleSaveKhsPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKhsItem) return;
    const num = Number(editPriceInput);
    if (isNaN(num) || num < 0) {
      showToast('Masukkan harga satuan yang valid');
      return;
    }
    updateKhsPrice(editingKhsItem.id, num, editReason);
    setEditingKhsItem(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              PLN UP3 BANTEN SELATAN
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Master Mitra & Kontrak</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Master Vendor, Kontrak SPK, & Daftar Harga KHS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen lengkap rekanan vendor, kontrak Surat Perjanjian Kerja (SPK), masa berlaku (Tanggal Awal & Akhir), serta tarif harga satuan KHS.
          </p>
        </div>

        {/* Tab Buttons Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveMainTab('vendors')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'vendors'
                ? 'bg-white text-blue-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>1. Profil Vendor ({vendors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('contracts')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'contracts'
                ? 'bg-white text-purple-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>2. Kontrak SPK ({contracts.length})</span>
          </button>


        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFIL REKANAN VENDOR                                              */}
      {/* ========================================================================= */}
      {activeMainTab === 'vendors' && (
        <div className="space-y-4">
          {/* Metrics Vendor */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Total Rekanan Vendor</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-slate-900">{vendors.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Semua mitra kualifikasi PLN</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold text-emerald-700">Mitra Status Aktif</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-600">{vendors.filter((v) => v.status === 'AKTIF').length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Siap penugasan Work Order</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold text-indigo-700">Mitra Paket 1 (JTM)</span>
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold text-indigo-600">{vendors.filter((v) => v.jenisPekerjaan.includes('Paket 1')).length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Kompetensi JTM & Gardu</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold text-cyan-700">Mitra Paket 2 (JTR)</span>
                <Layers className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-xl font-bold text-cyan-600">{vendors.filter((v) => v.jenisPekerjaan.includes('Paket 2')).length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Kompetensi JTR & SR</div>
            </div>
          </div>

          {/* Toolbar Vendor */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama vendor, direktur, alamat, NPWP..."
                value={searchTermVendor}
                onChange={(e) => {
                  setSearchTermVendor(e.target.value);
                  setVendorPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={filterJenisVendor}
                onChange={(e) => {
                  setFilterJenisVendor(e.target.value);
                  setVendorPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Bidang</option>
                <option value="Tiang">Khusus Tiang</option>
                <option value="Paket 1">Paket 1 (JTM & Gardu)</option>
                <option value="Paket 2">Paket 2 (JTR & SR)</option>
              </select>

              <select
                value={filterStatusVendor}
                onChange={(e) => {
                  setFilterStatusVendor(e.target.value);
                  setVendorPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="AKTIF">Hanya Aktif</option>
                <option value="NONAKTIF">Non-Aktif</option>
              </select>

              <button
                onClick={openAddVendorModal}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Vendor</span>
              </button>
            </div>
          </div>

          {/* Table Vendor */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">NO</th>
                    <th className="py-3 px-4">NAMA REKANAN & DIREKTUR</th>
                    <th className="py-3 px-4">ALAMAT & NPWP</th>
                    <th className="py-3 px-4">KONTAK</th>
                    <th className="py-3 px-4">BIDANG PEKERJAAN</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-center w-24">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedVendors.map((v, idx) => {
                    const rowNumber = (vendorPage - 1) * vendorPageSize + idx + 1;
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">{rowNumber}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs">{v.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Pimpinan / Direktur: <span className="font-semibold text-slate-700">{v.director}</span></div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 text-[11px]">{v.address}</span>
                          </div>
                          {v.npwp && <div className="text-[10px] font-mono text-slate-400 mt-1">NPWP: {v.npwp}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{v.phone}</span>
                          </div>
                          {v.email && (
                            <div className="flex items-center gap-1 text-[10.5px] text-slate-500 mt-0.5">
                              <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                              <span>{v.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {v.jenisPekerjaan.map((j) => (
                              <span
                                key={j}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  j === 'Paket 1'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : j === 'Paket 2'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}
                              >
                                {j}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'AKTIF'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'AKTIF' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {v.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditVendorModal(v)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Vendor"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus rekanan vendor ${v.name}?`)) {
                                  deleteVendor(v.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Vendor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={vendorPage}
              totalItems={filteredVendors.length}
              itemsPerPage={vendorPageSize}
              onPageChange={setVendorPage}
              onItemsPerPageChange={setVendorPageSize}
              pageSizeOptions={[5, 10, 25]}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KONTRAK SPK VENDOR (DENGAN TANGGAL AWAL & TANGGAL AKHIR)           */}
      {/* ========================================================================= */}
      {activeMainTab === 'contracts' && (
        <div className="space-y-4">
          {/* Metrics Kontrak */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Total Kontrak SPK</span>
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-slate-900">{contractKpis.totalContracts}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Surat Perjanjian Kerja KHS</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold text-blue-700">Total Nilai Pagu SPK</span>
                <Coins className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-blue-700 tabular-nums">{formatRp(contractKpis.totalPagu)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pagu terkontrak tahun 2026</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold text-amber-700">Realisasi Pagu Terpakai</span>
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-bold text-amber-700 tabular-nums">{formatRp(contractKpis.usedPagu)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total komitmen WO terbit</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold text-emerald-700">Sisa Pagu Tersedia</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-emerald-700 tabular-nums">{formatRp(contractKpis.sisaPagu)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sisa pagu siap dialokasikan</div>
            </div>
          </div>

          {/* Toolbar Kontrak */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nomor SPK, judul kontrak, nama vendor..."
                value={searchTermContract}
                onChange={(e) => {
                  setSearchTermContract(e.target.value);
                  setContractPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={filterJenisContract}
                onChange={(e) => {
                  setFilterJenisContract(e.target.value);
                  setContractPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Paket</option>
                <option value="Paket 1">Paket 1 (JTM & Gardu)</option>
                <option value="Paket 2">Paket 2 (JTR & SR)</option>
                <option value="Tiang">Tiang Distribusi</option>
              </select>

              <select
                value={filterStatusContract}
                onChange={(e) => {
                  setFilterStatusContract(e.target.value);
                  setContractPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Status SPK</option>
                <option value="AKTIF">Hanya Aktif</option>
                <option value="HABIS">Pagu Habis</option>
                <option value="KEDALUWARSA">Kedaluwarsa</option>
              </select>

              <button
                onClick={openAddContractModal}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kontrak SPK</span>
              </button>
            </div>
          </div>

          {/* Table Kontrak SPK */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">NO</th>
                    <th className="py-3 px-4">NOMOR SPK & JUDUL KONTRAK</th>
                    <th className="py-3 px-4">VENDOR PELAKSANA</th>
                    <th className="py-3 px-4 text-center">PAKET</th>
                    <th className="py-3 px-4 text-right">PAGU KONTRAK</th>
                    <th className="py-3 px-4 text-right">SISA PAGU</th>
                    <th className="py-3 px-4 text-center bg-blue-50/40">
                      MASA BERLAKU SPK <br />
                      <span className="text-[9px] text-blue-600 font-normal">(Tanggal Awal s/d Akhir)</span>
                    </th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-center w-20">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedContracts.map((c, idx) => {
                    const rowNumber = (contractPage - 1) * contractPageSize + idx + 1;
                    const nilai = c.nilaiKontrak || c.totalPagu || 0;
                    const used = c.usedPagu || 0;
                    const sisa = c.sisaPagu !== undefined ? c.sisaPagu : nilai - used;
                    const pctUsed = nilai > 0 ? Math.min(100, Math.round((used / nilai) * 100)) : 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">{rowNumber}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900 text-xs">{c.spkNumber}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{c.title}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{c.vendorName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            c.jenisPekerjaan === 'Paket 1'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : c.jenisPekerjaan === 'Paket 2'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {c.jenisPekerjaan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatRp(nilai)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          <div className="font-bold text-emerald-700">{formatRp(sisa)}</div>
                          <div className="text-[10px] text-slate-400">Terpakai: {pctUsed}%</div>
                        </td>
                        <td className="py-3.5 px-4 text-center bg-blue-50/20 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-blue-900 font-semibold font-mono text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>{c.validFrom || '02 Jan 2026'}</span>
                            <span className="text-slate-400">s/d</span>
                            <span>{c.validTo || '31 Des 2026'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'AKTIF'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditContractModal(c)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Edit Kontrak & Tanggal Berlaku"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus kontrak SPK ${c.spkNumber}?`)) {
                                  deleteContract(c.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Kontrak"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={contractPage}
              totalItems={filteredContracts.length}
              itemsPerPage={contractPageSize}
              onPageChange={setContractPage}
              onItemsPerPageChange={setContractPageSize}
              pageSizeOptions={[5, 10, 25]}
            />
          </div>
        </div>
      )}

      {/* TAB 3 (KHS) dihapus — kontrak sudah dikelola di tab Kontrak SPK */}
      {false && (
        <div className="space-y-4">
          {/* Paket Switcher & Kategori */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Pilih Paket KHS:</span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveKhsPaket('paket1');
                    setKhsPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md transition ${
                    activeKhsPaket === 'paket1' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paket 1 (JTM & Gardu)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveKhsPaket('paket2');
                    setKhsPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md transition ${
                    activeKhsPaket === 'paket2' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paket 2 (JTR & Sambungan Rumah)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari kode atau uraian pekerjaan..."
                  value={searchKhsTerm}
                  onChange={(e) => {
                    setSearchKhsTerm(e.target.value);
                    setKhsPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              <select
                value={filterKhsKategori}
                onChange={(e) => {
                  setFilterKhsKategori(e.target.value as any);
                  setKhsPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="MATERIAL">Khusus Material</option>
                <option value="JASA">Khusus Jasa</option>
              </select>
            </div>
          </div>

          {/* Table Daftar Harga KHS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">NO</th>
                    <th className="py-3 px-4 w-32">KODE MATERIAL / JASA</th>
                    <th className="py-3 px-4">URAIAN PEKERJAAN / MATERIAL</th>
                    <th className="py-3 px-4 text-center w-20">SATUAN</th>
                    <th className="py-3 px-4 text-center w-24">KATEGORI</th>
                    <th className="py-3 px-4 text-right w-36">HARGA STANDAR KHS</th>
                    <th className="py-3 px-4 text-right w-36 bg-emerald-50/40">HARGA KONTRAK AKTIF</th>
                    <th className="py-3 px-4 text-center w-24">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedKhsItems.map((it, idx) => {
                    const rowNumber = (khsPage - 1) * khsPageSize + idx + 1;
                    const isCustom = customKhsPrices[it.id] !== undefined;
                    const currentPrice = isCustom ? customKhsPrices[it.id] : it.hargaSatuan;

                    return (
                      <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{rowNumber}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">{it.nomorMaterial || it.id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{it.uraian}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{it.sat || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            it.kategori === 'MATERIAL' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {it.kategori}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                          {formatRp(it.hargaSatuan)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold bg-emerald-50/20 tabular-nums">
                          <span className={isCustom ? 'text-amber-700 font-black' : 'text-emerald-700'}>
                            {formatRp(currentPrice)}
                          </span>
                          {isCustom && (
                            <span className="block text-[9px] font-sans text-amber-600 font-semibold">(Adendum)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditKhsModal(it)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold transition cursor-pointer"
                              title="Ubah Tarif Kontrak Vendor"
                            >
                              Ubah
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => resetKhsPrice(it.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Reset ke Harga Standar KHS"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={khsPage}
              totalItems={filteredKhsItems.length}
              itemsPerPage={khsPageSize}
              onPageChange={setKhsPage}
              onItemsPerPageChange={setKhsPageSize}
              pageSizeOptions={[15, 25, 50, 100]}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT REKANAN VENDOR                                       */}
      {/* ========================================================================= */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>{editingVendor ? 'Edit Data Rekanan Vendor' : 'Tambah Rekanan Vendor Baru'}</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Profil perusahaan rekanan pelaksana konstruksi PLN.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVendorModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Perusahaan (PT / CV): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: PT. HILMAN PRIMA PERKASA"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Direktur / Penanggung Jawab: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDirector}
                  onChange={(e) => setFormDirector(e.target.value)}
                  placeholder="Nama Direktur"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alamat Kantor / Workshop:</label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Alamat lengkap rekanan"
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor Telepon / WA:</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NPWP Perusahaan:</label>
                  <input
                    type="text"
                    value={formNpwp}
                    onChange={(e) => setFormNpwp(e.target.value)}
                    placeholder="01.234.567.8-xxx.xxx"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bidang Kompetensi Pekerjaan:</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['Paket 1', 'Paket 2', 'Tiang'] as const).map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => handleToggleJenisVendor(j)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        formJenisPekerjaan.includes(j)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {j} {j === 'Paket 1' ? '(JTM & Gardu)' : j === 'Paket 2' ? '(JTR & SR)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status Kualifikasi Rekanan:</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="vendor-status"
                      value="AKTIF"
                      checked={formStatus === 'AKTIF'}
                      onChange={() => setFormStatus('AKTIF')}
                      className="text-blue-600"
                    />
                    <span>AKTIF (Bisa ditugaskan WO)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="vendor-status"
                      value="NONAKTIF"
                      checked={formStatus === 'NONAKTIF'}
                      onChange={() => setFormStatus('NONAKTIF')}
                      className="text-blue-600"
                    />
                    <span>NONAKTIF</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingVendor ? 'Simpan Perubahan' : 'Tambah Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT KONTRAK SPK (INPUT TANGGAL AWAL & TANGGAL AKHIR)       */}
      {/* ========================================================================= */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>{editingContract ? 'Edit Kontrak SPK Vendor' : 'Tambah Kontrak SPK Baru'}</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Surat Perjanjian Kerja KHS, Pagu Nilai, serta Masa Berlaku (Tanggal Awal & Tanggal Akhir).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nomor Kontrak / SPK: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contractForm.spkNumber}
                  onChange={(e) => setContractForm({ ...contractForm, spkNumber: e.target.value })}
                  placeholder="Contoh: 0021.PJ/DAN.02.03/UP3-BTS/2026"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Judul Pekerjaan Kontrak SPK: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contractForm.title}
                  onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                  placeholder="Contoh: Kontrak KHS Jasa Konstruksi Distribusi JTM & Gardu"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Vendor Pelaksana:
                  </label>
                  <select
                    value={contractForm.vendorId}
                    onChange={(e) => setContractForm({ ...contractForm, vendorId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-bold cursor-pointer"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Jenis Paket Pekerjaan:
                  </label>
                  <select
                    value={contractForm.jenisPekerjaan}
                    onChange={(e) => setContractForm({ ...contractForm, jenisPekerjaan: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-bold cursor-pointer"
                  >
                    <option value="Paket 1">Paket 1 (JTM & Gardu Distribusi)</option>
                    <option value="Paket 2">Paket 2 (JTR & Sambungan Rumah)</option>
                    <option value="Tiang">Tiang Distribusi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Pagu Nilai Kontrak (Rp): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={contractForm.nilaiKontrak}
                    onChange={(e) => setContractForm({ ...contractForm, nilaiKontrak: Number(e.target.value) })}
                    placeholder="2500000000"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-mono font-bold text-blue-700"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Terbaca: {formatRp(contractForm.nilaiKontrak)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Tipe Pengadaan:
                  </label>
                  <select
                    value={contractForm.tipePengadaan}
                    onChange={(e) => setContractForm({ ...contractForm, tipePengadaan: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="JASA">JASA</option>
                    <option value="MATERIAL">MATERIAL</option>
                    <option value="JASA & MATERIAL">JASA & MATERIAL</option>
                  </select>
                </div>
              </div>

              {/* TANGGAL AWAL & TANGGAL AKHIR */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Masa Berlaku Kontrak SPK (Digunakan di Dokumen WO)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Tanggal Awal *):
                    </label>
                    <input
                      type="text"
                      value={contractForm.validFrom}
                      onChange={(e) => setContractForm({ ...contractForm, validFrom: e.target.value })}
                      placeholder="Contoh: 02 Jan 2026"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-800"
                      required
                    />
                    <span className="text-[9.5px] text-slate-500 mt-0.5 block">Awal masa berlaku SPK KHS</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Tanggal Akhir *):
                    </label>
                    <input
                      type="text"
                      value={contractForm.validTo}
                      onChange={(e) => setContractForm({ ...contractForm, validTo: e.target.value })}
                      placeholder="Contoh: 31 Des 2026"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-800"
                      required
                    />
                    <span className="text-[9.5px] text-slate-500 mt-0.5 block">Akhir masa berlaku SPK KHS</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status Kontrak:</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="contract-status"
                      value="AKTIF"
                      checked={contractForm.status === 'AKTIF'}
                      onChange={() => setContractForm({ ...contractForm, status: 'AKTIF' })}
                      className="text-purple-600"
                    />
                    <span>AKTIF</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="contract-status"
                      value="HABIS"
                      checked={contractForm.status === 'HABIS'}
                      onChange={() => setContractForm({ ...contractForm, status: 'HABIS' })}
                      className="text-purple-600"
                    />
                    <span>PAGU HABIS</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="contract-status"
                      value="KEDALUWARSA"
                      checked={contractForm.status === 'KEDALUWARSA'}
                      onChange={() => setContractForm({ ...contractForm, status: 'KEDALUWARSA' })}
                      className="text-purple-600"
                    />
                    <span>KEDALUWARSA</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingContract ? 'Simpan Perubahan' : 'Simpan Kontrak SPK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UBAH HARGA KHS VENDOR                                            */}
      {/* ========================================================================= */}
      {editingKhsItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Ubah Tarif Satuan KHS Vendor</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Item: {editingKhsItem.kode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingKhsItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKhsPrice} className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Uraian Pekerjaan / Material:</span>
                <b className="text-slate-900 text-xs block mt-0.5">{editingKhsItem.desc}</b>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Harga Standar KHS:</span>
                <span className="font-mono font-bold text-slate-700">{formatRp(editingKhsItem.defaultPrice)} / {editingKhsItem.sat}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Harga Satuan Baru (Rp): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-mono font-bold text-emerald-700 text-base"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Terbaca: {formatRp(Number(editPriceInput))}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Alasan / Dasar Penyesuaian Harga:
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Contoh: Adendum SPK KHS 2026 atau Kesepakatan Vendor"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingKhsItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Harga Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
