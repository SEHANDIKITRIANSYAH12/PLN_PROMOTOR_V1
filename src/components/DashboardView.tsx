'use client';

import React from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import {
  Plus,
  ArrowRight,
  FileText,
  ChevronRight,
  Crosshair,
  Layers,
  FileCode
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { daftungs, surveys, setCurrentPage, setActiveDaftungTab } = usePromotorStore();

  const totalDaftung = daftungs.length || 39;
  const totalSurvey = surveys.length;
  const ap2tQueueCount = surveys.filter(s => s.status === 'Masuk Antrean AP2T').length || 2;

  const steps = [
    { id: 'survey',              label: '1. Survey Pelanggan',        sub: 'Geotagging & Tiang Lapangan', tab: null },
    { id: 'pradaftung',          label: '2. Potensi Daftung',         sub: 'Cek AP2T & Penerbitan RAB',   tab: null },
    { id: 'wo',                  label: '3. Work Order (WO)',         sub: 'Alokasi Vendor & Approval',   tab: null },
    { id: 'reservasi-material',  label: '4. Reservasi Material',      sub: 'Alokasi Stok Gudang & Hold',  tab: null },
    { id: 'verifikasi-pengawas', label: '5. Verifikasi & Progres',    sub: 'Surat Jalan, Progres & Retur', tab: null },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-blue-50/50 p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
              ALUR KERJA & EKSEKUSI WO
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              • Standar KHS WO 2026
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Selamat datang di <span className="text-blue-700">PROMOTOR PLN</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed max-w-2xl">
            Sistem terintegrasi mulai dari Survey Pelanggan (Geotagging Tiang & Output RAB), Verifikasi ke Daftar Tunggu (Daftung / AP2T), hingga Penerbitan Dokumen Resmi Work Order (WO Paket 1 & 2).
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('survey')}
          className="px-5 py-2.5 bg-[#0066cc] hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 flex items-center justify-center gap-2 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3] text-white" />
          <span className="text-white tracking-wide">＋ Buat Survey Baru</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Survey Pelanggan (Tahap 1) */}
        <div 
          onClick={() => setCurrentPage('survey')}
          className="card-modern p-5 bg-white cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 opacity-80 group-hover:h-1.5 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Survey Pelanggan</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Crosshair className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-amber-700 transition">
            {totalSurvey}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Data fisik tiang & RAB
          </div>
        </div>

        {/* Card 2: Daftung Aktif (Tahap 2) */}
        <div 
          onClick={() => setCurrentPage('daftung')}
          className="card-modern p-5 bg-white cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 opacity-80 group-hover:h-1.5 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftung Aktif</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-blue-700 transition">
            {totalDaftung}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Pelanggan terdaftar AP2T
          </div>
        </div>

        {/* Card 3: Work Order Siap Terbit */}
        <div 
          onClick={() => setCurrentPage('wo')}
          className="card-modern p-5 bg-white cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 opacity-80 group-hover:h-1.5 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Order (WO)</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-emerald-700 transition">
            {totalSurvey}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Paket 1 & Paket 2 siap
          </div>
        </div>

        {/* Card 4: Master HS WO */}
        <div 
          onClick={() => setCurrentPage('khs')}
          className="card-modern p-5 bg-white cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 opacity-80 group-hover:h-1.5 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Master HS WO 1 & 2</span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <FileCode className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-indigo-700 transition">
            542
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 438 P1 + 104 P2
          </div>
        </div>
      </div>

      {/* Main Grid: Left Alur & Progress | Right Antrean Tindakan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side (2 Cols): Alur Kerja Utama + Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alur Kerja Utama */}
          <div className="card-modern p-6 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Alur Kerja Perencanaan & RAB</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                    5 Tahapan
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Urutan proses standar teknis dari pelanggan hingga dokumen RAB.</p>
              </div>
            </div>

            {/* Steps Container */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-stretch pt-2">
              {steps.map((st, idx) => (
                <button
                  key={st.label}
                  onClick={() => {
                    if (st.tab) {
                      setActiveDaftungTab(st.tab);
                    }
                    setCurrentPage(st.id);
                  }}
                  className="p-3 bg-slate-50/70 hover:bg-blue-50/70 border border-slate-200/90 hover:border-blue-300 rounded-xl text-center transition-all duration-150 flex flex-col justify-between group cursor-pointer"
                >
                  <div className="text-[10px] text-slate-400 font-mono font-semibold">0{idx + 1}</div>
                  <div className="my-1.5">
                    <div className="font-extrabold text-xs text-slate-800 group-hover:text-blue-700 transition">
                      {st.label}
                    </div>
                    <div className="text-[9.5px] text-slate-400 group-hover:text-blue-600 transition truncate">
                      {st.sub}
                    </div>
                  </div>
                  <div className="text-blue-500 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-0.5">
                    Buka <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ringkasan Parameter Teknis RAB */}
          <div className="card-modern p-6 bg-white space-y-5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Validitas Parameter Survey & RAB</h2>
              <p className="text-xs text-slate-400 mt-0.5">Hanya material dan jasa yang diinput di survey yang dibawa ke dokumen RAB.</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-slate-800">Tiang & Penarikan Kabel Terpetakan Geotag</span>
                  <span className="text-blue-600 font-mono font-black">100%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-500" 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-slate-800">Sinkronisasi Master HS WO Paket 1 & 2 (KHS 2026)</span>
                  <span className="text-indigo-600 font-mono font-black">100%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all duration-500" 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-slate-800">Pencocokan Antrean Daftung AP2T</span>
                  <span className="text-emerald-600 font-mono font-black">88%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500" 
                    style={{ width: '88%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (1 Col): Antrean Tindakan Cepat */}
        <div className="card-modern p-6 bg-white flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>Antrean Tindakan</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Item yang memerlukan perhatian perencana.</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                Prioritas
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Notif 1 */}
              <div className="py-3 flex items-start justify-between gap-3 group hover:bg-slate-50/60 p-2 rounded-xl transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 font-black text-xs mt-0.5">
                    !
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 leading-snug">{ap2tQueueCount} Survey menunggu pencocokan AP2T</div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">Daftung • Verifikasi IDPEL dan pembayaran</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setCurrentPage('pradaftung');
                  }}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10.5px] font-bold shrink-0 transition cursor-pointer"
                >
                  Buka Potensi Daftung →
                </button>
              </div>

              {/* Notif 2 */}
              <div className="py-3 flex items-start justify-between gap-3 group hover:bg-slate-50/60 p-2 rounded-xl transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 leading-snug">Penerbitan WO Daftung</div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">Daftung • Cek item material & jasa tersurvey</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveDaftungTab('daftung');
                    setCurrentPage('daftung');
                  }}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[10.5px] font-bold shrink-0 transition cursor-pointer"
                >
                  Buka Daftung
                </button>
              </div>

              {/* Notif 3 */}
              <div className="py-3 flex items-start justify-between gap-3 group hover:bg-slate-50/60 p-2 rounded-xl transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 leading-snug">Standar Konstruksi TM & TR Aktif</div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">Katalog • TM-1 s/d TM-14 & TR-1 s/d TR-10</div>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentPage('std')}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[10.5px] font-bold shrink-0 transition cursor-pointer"
                >
                  Katalog
                </button>
              </div>
            </div>
          </div>

          {/* Action Button: Buka Daftung */}
          <button
            onClick={() => setCurrentPage('daftung')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer group"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Kelola Daftung & Terbitkan WO</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
