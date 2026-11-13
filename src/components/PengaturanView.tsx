'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Users, Database, RotateCcw } from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { onSyncStatusChange, cancelPendingSync, type SyncStatus } from '@/lib/clientSync';

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
  const { showToast } = usePromotorStore();

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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Manajemen User</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Buat dan kelola akun login untuk setiap role: Admin Survey, Admin Daftar, Admin WO, Pengawas, Vendor, dan Pimpinan.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 max-w-md mx-auto text-left">
            {[
              { role: 'Admin Survey',  color: 'bg-sky-50 border-sky-200 text-sky-700' },
              { role: 'Admin Daftar',  color: 'bg-violet-50 border-violet-200 text-violet-700' },
              { role: 'Admin WO',      color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { role: 'Pengawas',      color: 'bg-teal-50 border-teal-200 text-teal-700' },
              { role: 'Vendor',        color: 'bg-rose-50 border-rose-200 text-rose-700' },
              { role: 'Pimpinan',      color: 'bg-amber-50 border-amber-200 text-amber-700' },
            ].map(({ role, color }) => (
              <div key={role} className={`px-3 py-2 rounded-lg border text-[11px] font-semibold ${color}`}>
                {role}
              </div>
            ))}
          </div>
          <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
            🚧 Tersedia setelah sistem login aktif
          </div>
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
