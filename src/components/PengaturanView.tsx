'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Users, Database, RotateCcw, Plus, Trash2, Edit, Shield, Search, X, Check, Building2, UserCheck } from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { onSyncStatusChange, cancelPendingSync, type SyncStatus } from '@/lib/clientSync';
import { Role, UserProfile } from '@/types';

type PengaturanTab = 'users' | 'konfigurasi';

const STATUS_DB: Record<SyncStatus, { label: string; cls: string }> = {
  off: {
    label: 'Belum terhubung',
    cls: 'bg-slate-50 border-slate-200 text-slate-600',
  },
  hydrating: {
    label: 'Mengambil data dari database…',
    cls: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  live: {
    label: 'Terhubung ke PostgreSQL — setiap perubahan langsung tersimpan',
    cls: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  unavailable: {
    label: 'Database tidak terjangkau — aplikasi berjalan dengan seed in-memory',
    cls: 'bg-rose-50 border-rose-200 text-rose-700',
  },
};

export const PengaturanView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PengaturanTab>('users');
  const [statusDb, setStatusDb] = useState<SyncStatus>('off');
  const [resetting, setResetting] = useState(false);
  const { users, addUser, updateUser, deleteUser, vendors, supervisors, currentRole, showToast } = usePromotorStore();

  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRole, setFormRole] = useState<Role>('Pengawas');
  const [formUnit, setFormUnit] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formVendorId, setFormVendorId] = useState('');
  const [formSupervisorId, setFormSupervisorId] = useState('');
  const [formStatus, setFormStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');

  const filteredUsers = (users || []).filter((u) => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (searchUser.trim()) {
      const q = searchUser.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchUser = u.username.toLowerCase().includes(q);
      const matchRole = u.role.toLowerCase().includes(q);
      const matchUnit = (u.unit || '').toLowerCase().includes(q);
      const matchVendor = (u.vendorName || '').toLowerCase().includes(q);
      return matchName || matchUser || matchRole || matchUnit || matchVendor;
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormRole('Pengawas');
    setFormUnit('UP3 Banten Selatan');
    setFormNip('');
    setFormPhone('');
    setFormEmail('');
    setFormVendorId('');
    setFormSupervisorId('');
    setFormStatus('AKTIF');
    setModalOpen(true);
  };

  const handleOpenEditModal = (u: UserProfile) => {
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormRole(u.role);
    setFormUnit(u.unit || '');
    setFormNip(u.nip || '');
    setFormPhone(u.phone || '');
    setFormEmail(u.email || '');
    setFormVendorId(u.vendorId || '');
    setFormSupervisorId(u.supervisorId || '');
    setFormStatus(u.status);
    setModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      showToast('⚠️ Nama dan Username wajib diisi!');
      return;
    }

    const matchedVendor = vendors.find((v) => v.id === formVendorId);
    const matchedSupervisor = supervisors.find((s) => s.id === formSupervisorId);

    const payload: Omit<UserProfile, 'id'> = {
      name: formName.trim(),
      username: formUsername.trim(),
      role: formRole,
      unit: formUnit.trim() || undefined,
      nip: formNip.trim() || undefined,
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      vendorId: formRole === 'Vendor' ? formVendorId : undefined,
      vendorName: formRole === 'Vendor' ? matchedVendor?.name : undefined,
      supervisorId: formRole === 'Pengawas' ? formSupervisorId : undefined,
      supervisorName: formRole === 'Pengawas' ? matchedSupervisor?.name : undefined,
      status: formStatus,
    };

    if (editingUserId) {
      updateUser(editingUserId, payload);
    } else {
      addUser(payload);
    }
    setModalOpen(false);
  };

  const handleDeleteUser = (u: UserProfile) => {
    if (confirm(`Hapus pengguna "${u.name}" (${u.role})? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteUser(u.id);
    }
  };

  useEffect(() => {
    const unsubscribe = onSyncStatusChange(setStatusDb);
    return () => {
      unsubscribe();
    };
  }, []);

  // Isi ulang database dari src/data/seedData.ts. Ini jalur yang sama dengan
  // POST /api/admin/seed; antrean tulis dibatalkan lebih dulu supaya perubahan
  // lama tidak menyusul tertulis setelah seed.
  const handleResetSeed = async () => {
    const yakin = window.confirm(
      'KEMBALIKAN DATABASE KE SEED AWAL?\n\n' +
        'Semua pekerjaan Anda di aplikasi (survey, daftung, WO, reservasi,\n' +
        'pengambilan material, sweeping) akan DIGANTI dengan data seed awal.\n' +
        'Data master (material, vendor, kontrak, pengawas) ikut dikembalikan.\n\n' +
        'Tindakan ini tidak bisa dibatalkan. Lanjutkan?'
    );
    if (!yakin) return;

    setResetting(true);
    cancelPendingSync();
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);
      showToast('✓ Data dikembalikan ke seed awal');
      window.location.reload();
    } catch (err) {
      showToast(`✗ Reset gagal: ${err instanceof Error ? err.message : String(err)}`);
      setResetting(false);
    }
  };

  const tabs: { id: PengaturanTab; label: string; icon: React.ReactNode }[] = [
    { id: 'users',       label: '1. Manajemen User',    icon: <Users className="w-4 h-4" /> },
    { id: 'konfigurasi', label: '2. Konfigurasi Sistem', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Pengaturan Sistem</h2>
            <p className="text-xs text-slate-500">
              Manajemen akun pengguna dan konfigurasi sistem — hanya untuk Admin Master
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, username, role, ULP..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">Semua Role</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin Survey">Admin Survey</option>
                <option value="Admin Daftung">Admin Daftung</option>
                <option value="Admin WO">Admin WO</option>
                <option value="Pengawas">Pengawas</option>
                <option value="Vendor">Vendor</option>
                <option value="Admin Gudang">Admin Gudang</option>
                <option value="Approval">Approval</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah User Baru</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama & Username</th>
                  <th className="py-3 px-3">Role Hak Akses</th>
                  <th className="py-3 px-4">Unit Kerja / Afiliasi</th>
                  <th className="py-3 px-3">Kontak / NIP</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada pengguna yang sesuai dengan pencarian / filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10.5px] font-mono text-slate-400">@{u.username}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {u.role === 'Vendor' ? (
                          <span className="font-medium text-amber-800 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-amber-600" />
                            {u.vendorName || 'Belum ditautkan ke Vendor'}
                          </span>
                        ) : u.role === 'Pengawas' ? (
                          <span className="font-medium text-teal-800 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-teal-600" />
                            {u.supervisorName || u.unit || 'Pengawas Lapangan'}
                          </span>
                        ) : (
                          <span>{u.unit || 'PLN UP3 Banten Selatan'}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {u.nip && <div className="font-mono text-[10.5px]">NIP: {u.nip}</div>}
                        {u.phone && <div className="text-[10.5px] text-slate-500">{u.phone}</div>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold ${u.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                            title="Edit User"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {u.username !== 'superadmin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Hapus User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* User Form Modal */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm">
                      {editingUserId ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveUser} className="p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Budi Santoso, S.T."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="Contoh: budi.santoso"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Role Hak Akses *</label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as Role)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin Survey">Admin Survey</option>
                        <option value="Admin Daftung">Admin Daftung</option>
                        <option value="Admin WO">Admin WO</option>
                        <option value="Pengawas">Pengawas</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Admin Gudang">Admin Gudang</option>
                        <option value="Approval">Approval</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Fields based on Role */}
                  {formRole === 'Vendor' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                      <label className="block text-amber-900 font-bold">Tautkan ke Perusahaan Rekanan Vendor *</label>
                      <select
                        value={formVendorId}
                        onChange={(e) => setFormVendorId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs"
                      >
                        <option value="">-- Pilih Rekanan Vendor --</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.director})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-amber-700">
                        Akun vendor hanya akan memiliki akses ke Work Order yang dikontrakkan ke perusahaan ini.
                      </p>
                    </div>
                  )}

                  {formRole === 'Pengawas' && (
                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 space-y-2">
                      <label className="block text-teal-900 font-bold">Tautkan ke Master Pengawas *</label>
                      <select
                        value={formSupervisorId}
                        onChange={(e) => setFormSupervisorId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-teal-300 bg-white text-xs"
                      >
                        <option value="">-- Pilih Nama Pengawas Lapangan --</option>
                        {supervisors.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} - {s.role} ({s.unit})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-teal-700">
                        Akun pengawas hanya akan dapat menerbitkan reservasi dan memverifikasi progres WO yang ditugaskan kepadanya.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Unit Kerja / ULP</label>
                      <input
                        type="text"
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        placeholder="Contoh: ULP Rangkasbitung"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">NIP (Pegawai)</label>
                      <input
                        type="text"
                        value={formNip}
                        onChange={(e) => setFormNip(e.target.value)}
                        placeholder="Contoh: 8914234ZY"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">No. HP / WhatsApp</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="Contoh: 0812-xxxx-xxxx"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Status Pengguna</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as 'AKTIF' | 'NONAKTIF')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="AKTIF">AKTIF</option>
                        <option value="NONAKTIF">NONAKTIF</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                    >
                      {editingUserId ? 'Simpan Perubahan' : 'Buat User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'konfigurasi' && (
        <div className="space-y-4">
          {/* Status koneksi database */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-slate-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800">Penyimpanan Data</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Seluruh data aplikasi disimpan di PostgreSQL dan dimuat ulang saat halaman dibuka,
                  sehingga perubahan Anda tetap ada setelah browser di-refresh.
                </p>
                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${STATUS_DB[statusDb].cls}`}>
                  <span className={`w-2 h-2 rounded-full ${statusDb === 'live' ? 'bg-emerald-500' : statusDb === 'unavailable' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  {STATUS_DB[statusDb].label}
                </div>
              </div>
            </div>
          </div>

          {/* Reset data */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-xs p-6">
            <h3 className="text-sm font-bold text-slate-800">Kembalikan ke Data Seed Awal</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
              Memakai ulang isi <span className="font-mono text-[11px]">src/data/seedData.ts</span> ke database:
              6 survey pelanggan, 70 material, 4 kontrak, 4 vendor, 6 pengawas, dan menghapus seluruh
              transaksi hasil testing Anda. Halaman akan dimuat ulang setelah selesai.
            </p>
            <button
              type="button"
              onClick={handleResetSeed}
              disabled={resetting}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{resetting ? 'Mengembalikan data…' : 'Reset Data ke Seed Awal'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
