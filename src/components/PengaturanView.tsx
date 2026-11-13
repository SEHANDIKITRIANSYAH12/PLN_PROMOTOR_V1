'use client';

import React, { useState } from 'react';
import { Settings, Users, Database } from 'lucide-react';

type PengaturanTab = 'users' | 'konfigurasi';

export const PengaturanView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PengaturanTab>('users');

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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center">
          <Database className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Konfigurasi Sistem</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Parameter sistem, koneksi database, dan pengaturan global aplikasi Promotor PLN.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
            🚧 Fitur dalam pengembangan
          </div>
        </div>
      )}
    </div>
  );
};
