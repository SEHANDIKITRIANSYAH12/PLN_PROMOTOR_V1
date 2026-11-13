'use client';

import React, { useState } from 'react';
import { BarChart2, Package, DollarSign, CheckSquare } from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';

type LaporanTab = 'pekerjaan' | 'material' | 'keuangan' | 'penyelesaian';

export const LaporanView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LaporanTab>('pekerjaan');
  const { workOrders, contracts } = usePromotorStore();

  const selesai   = workOrders.filter((w) => w.status === 'Selesai').length;
  const aktif     = workOrders.filter((w) => w.status === 'Konstruksi').length;
  const totalPagu = contracts.reduce((s, c) => s + (c.totalPagu || c.nilaiKontrak || 0), 0);
  const usedPagu  = contracts.reduce((s, c) => s + (c.usedPagu || 0), 0);

  const tabs: { id: LaporanTab; label: string; icon: React.ReactNode }[] = [
    { id: 'pekerjaan',    label: '1. Laporan Pekerjaan', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'material',     label: '2. Laporan Material',  icon: <Package className="w-4 h-4" /> },
    { id: 'keuangan',     label: '3. Laporan Keuangan',  icon: <DollarSign className="w-4 h-4" /> },
    { id: 'penyelesaian', label: '4. Penyelesaian',      icon: <CheckSquare className="w-4 h-4" /> },
  ];

  const fmt = (n: number) =>
    'Rp ' + n.toLocaleString('id-ID');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Laporan & Penyelesaian</h2>
            <p className="text-xs text-slate-500">
              Ringkasan pekerjaan, material, keuangan, dan status penyelesaian seluruh WO
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 mt-4 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 mb-1">Total WO</div>
          <div className="text-2xl font-bold text-slate-900">{workOrders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 mb-1">WO Selesai</div>
          <div className="text-2xl font-bold text-emerald-700">{selesai}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-600 mb-1">WO Aktif</div>
          <div className="text-2xl font-bold text-blue-700">{aktif}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 mb-1">Sisa Pagu</div>
          <div className="text-lg font-bold text-amber-700">{fmt(totalPagu - usedPagu)}</div>
        </div>
      </div>

      {/* Tab Content - placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center">
        {activeTab === 'pekerjaan' && <>
          <BarChart2 className="w-12 h-12 text-indigo-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Laporan Pekerjaan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Ringkasan progress pekerjaan per Daftar/WO, status konstruksi, dan capaian selesai.</p>
        </>}
        {activeTab === 'material' && <>
          <Package className="w-12 h-12 text-teal-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Laporan Material</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Kebutuhan vs alokasi vs realisasi material per WO dan per periode.</p>
        </>}
        {activeTab === 'keuangan' && <>
          <DollarSign className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Laporan Keuangan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Nilai kontrak, realisasi pagu terpakai, dan sisa anggaran per vendor/paket.</p>
        </>}
        {activeTab === 'penyelesaian' && <>
          <CheckSquare className="w-12 h-12 text-blue-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Penyelesaian Daftar</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Cek semua WO dalam satu Daftar sudah selesai, arsip dokumen, dan tutup Daftar.</p>
        </>}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          🚧 Fitur dalam pengembangan
        </div>
      </div>
    </div>
  );
};
