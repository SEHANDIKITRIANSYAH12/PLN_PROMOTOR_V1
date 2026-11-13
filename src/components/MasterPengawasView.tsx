'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { SupervisorRecord } from '@/types';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Building, 
  Briefcase,
  X,
  Layers,
  ShieldCheck,
  AlertCircle,
  HardHat,
  BadgeCheck
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';

export const MasterPengawasView: React.FC = () => {
  const { supervisors, addSupervisor, updateSupervisor, deleteSupervisor, showToast } = usePromotorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State: Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<SupervisorRecord | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formCategory, setFormCategory] = useState<'Pengawas 1' | 'Pengawas 2' | 'Semua'>('Pengawas 1');
  const [formUnit, setFormUnit] = useState('UP3 Banten Selatan');
  const [formNip, setFormNip] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');

  // Filtered dataset
  const filteredSupervisors = useMemo(() => {
    return supervisors.filter((s) => {
      const matchSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nip && s.nip.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && s.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = 
        filterCategory === 'ALL' || 
        s.category === filterCategory || 
        s.category === 'Semua';

      const matchUnit = filterUnit === 'ALL' || s.unit === filterUnit;
      const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;

      return matchSearch && matchCategory && matchUnit && matchStatus;
    });
  }, [supervisors, searchTerm, filterCategory, filterUnit, filterStatus]);

  const paginatedSupervisors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSupervisors.slice(start, start + pageSize);
  }, [filteredSupervisors, currentPage, pageSize]);

  // Unique units for filter
  const uniqueUnits = useMemo(() => {
    return Array.from(new Set(supervisors.map((s) => s.unit)));
  }, [supervisors]);

  // Metrics
  const totalCount = supervisors.length;
  const pengawas1Count = supervisors.filter((s) => s.category === 'Pengawas 1' || s.category === 'Semua').length;
  const pengawas2Count = supervisors.filter((s) => s.category === 'Pengawas 2' || s.category === 'Semua').length;
  const activeCount = supervisors.filter((s) => s.status === 'AKTIF').length;

  const openAddModal = () => {
    setEditingSupervisor(null);
    setFormName('');
    setFormRole('TC Lola Konstruksi');
    setFormCategory('Pengawas 1');
    setFormUnit('UP3 Banten Selatan');
    setFormNip('');
    setFormPhone('');
    setFormStatus('AKTIF');
    setIsModalOpen(true);
  };

  const openEditModal = (s: SupervisorRecord) => {
    setEditingSupervisor(s);
    setFormName(s.name);
    setFormRole(s.role);
    setFormCategory(s.category);
    setFormUnit(s.unit);
    setFormNip(s.nip || '');
    setFormPhone(s.phone || '');
    setFormStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRole.trim()) {
      showToast('Nama dan Jabatan Pengawas wajib diisi');
      return;
    }

    if (editingSupervisor) {
      updateSupervisor(editingSupervisor.id, {
        name: formName.trim(),
        role: formRole.trim(),
        category: formCategory,
        unit: formUnit.trim(),
        nip: formNip.trim() || undefined,
        phone: formPhone.trim() || undefined,
        status: formStatus,
      });
    } else {
      addSupervisor({
        name: formName.trim(),
        role: formRole.trim(),
        category: formCategory,
        unit: formUnit.trim(),
        nip: formNip.trim() || undefined,
        phone: formPhone.trim() || undefined,
        status: formStatus,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Master Data Operasional
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Pengawas 1 & Pengawas 2 • Apply Work Order (WO)
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-purple-600" />
            <span>Master Data Pengawas Lapangan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Daftar resmi Pejabat Pengawas Teknis (TC Lola Konstruksi, Officer Kinerja Konstruksi UP3, dan Tim Leader Teknik ULP) untuk penugasan Work Order (WO) Paket 1 & Paket 2.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengawas Baru</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengawas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
              Total Pengawas
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{totalCount}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Terdaftar di sistem</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Pengawas 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
              Pengawas 1 (UP3)
            </span>
            <span className="text-2xl font-black text-blue-700 mt-0.5 block">{pengawas1Count}</span>
            <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">TC Lola / Kinerja UP3</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Pengawas 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
              Pengawas 2 (ULP)
            </span>
            <span className="text-2xl font-black text-amber-700 mt-0.5 block">{pengawas2Count}</span>
            <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">TL Teknik Unit Pelaksana</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <HardHat className="w-6 h-6" />
          </div>
        </div>

        {/* Status Aktif */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
              Status Siap Tugas
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-0.5 block">{activeCount}</span>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Pengawas Aktif</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama pengawas, jabatan, ULP, NIP..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Kategori */}
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Pengawas 1">Pengawas 1 (TC Lola / Kinerja)</option>
              <option value="Pengawas 2">Pengawas 2 (TL Teknik ULP)</option>
            </select>

            {/* Filter Unit */}
            <select
              value={filterUnit}
              onChange={(e) => {
                setFilterUnit(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Unit Kerja</option>
              {uniqueUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Hanya Aktif</option>
              <option value="NONAKTIF">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px] tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-4 w-12 text-center">NO</th>
                <th className="py-3 px-4">NAMA LENGKAP & GELAR</th>
                <th className="py-3 px-4">JABATAN TEKNIS</th>
                <th className="py-3 px-4 text-center">KATEGORI WO</th>
                <th className="py-3 px-4">UNIT KERJA</th>
                <th className="py-3 px-4">KONTAK</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSupervisors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div>Tidak ada data pengawas yang cocok dengan kriteria pencarian.</div>
                  </td>
                </tr>
              ) : (
                paginatedSupervisors.map((s, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors divide-x divide-slate-200">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {s.status === 'AKTIF' && (
                            <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                        </div>
                        {s.nip && (
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            NIP: {s.nip}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {s.role}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          s.category === 'Pengawas 1'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : s.category === 'Pengawas 2'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{s.unit}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {s.phone ? (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'AKTIF' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-200 cursor-pointer"
                            title="Edit Data Pengawas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus pengawas ${s.name} (${s.role})?`)) {
                                deleteSupervisor(s.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
                            title="Hapus Pengawas"
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
          currentPage={currentPage}
          totalItems={filteredSupervisors.length}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setPageSize}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>

      {/* Modal Add / Edit Supervisor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span>{editingSupervisor ? 'Edit Data Pengawas' : 'Tambah Pengawas Lapangan Baru'}</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Pejabat pengawas teknis penugasan Work Order (WO) Paket 1 & Paket 2.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Lengkap & Gelar: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Hasian Sitorus atau Daud Febrizer"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Jabatan Teknis: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="roles-list"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  placeholder="Contoh: TC Lola Konstruksi / TL Teknik ULP Rangkasbitung"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold"
                  required
                />
                <datalist id="roles-list">
                  <option value="TC Lola Konstruksi" />
                  <option value="Officer Kinerja Konstruksi" />
                  <option value="TL Teknik ULP Rangkasbitung" />
                  <option value="TL Teknik ULP Malingping" />
                  <option value="TL Teknik ULP Pandeglang" />
                  <option value="TL Teknik ULP Labuan" />
                  <option value="Pengawas K3 Konstruksi" />
                </datalist>
                <p className="text-[10px] text-slate-400 mt-1">
                  Format tampilan di Dokumen WO: <b>{formName ? formName : 'Nama Pengawas'} ({formRole ? formRole : 'Jabatan'})</b>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Kategori Pengawas:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="Pengawas 1">Pengawas 1 (TC Lola / Kinerja UP3)</option>
                    <option value="Pengawas 2">Pengawas 2 (TL Teknik ULP)</option>
                    <option value="Semua">Semua (Pengawas 1 & 2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Unit Kerja / ULP:
                  </label>
                  <input
                    type="text"
                    list="units-list"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="UP3 Banten Selatan"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold"
                  />
                  <datalist id="units-list">
                    <option value="UP3 Banten Selatan" />
                    <option value="ULP Rangkasbitung" />
                    <option value="ULP Malingping" />
                    <option value="ULP Pandeglang" />
                    <option value="ULP Labuan" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    NIP / Pegawai ID:
                  </label>
                  <input
                    type="text"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    placeholder="Contoh: 8914234ZY"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    No. Telepon / WA:
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contoh: 0812-xxxx-xxxx"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Status Pengawas:
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="AKTIF"
                      checked={formStatus === 'AKTIF'}
                      onChange={() => setFormStatus('AKTIF')}
                      className="text-purple-600"
                    />
                    <span>AKTIF (Dapat dipilih di WO)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="NONAKTIF"
                      checked={formStatus === 'NONAKTIF'}
                      onChange={() => setFormStatus('NONAKTIF')}
                      className="text-purple-600"
                    />
                    <span>NONAKTIF</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <span>{editingSupervisor ? 'Simpan Perubahan' : 'Tambah Pengawas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
