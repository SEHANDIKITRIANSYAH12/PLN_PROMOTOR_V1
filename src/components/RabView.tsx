'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { 
  Calculator, 
  Search, 
  Eye, 
  FileText, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  ArrowRight,
  Filter,
  Building2,
  MapPin,
  Calendar
} from 'lucide-react';
import { calculateRabFromSurvey } from '@/data/rabMasterData';
import { RabDocumentModal } from '@/components/RabDocumentModal';
import { SurveyRecord } from '@/types';
import { Pagination } from '@/components/Pagination';

export const RabView: React.FC = () => {
  const { surveys, daftungs, customKhsPrices, setCurrentPage } = usePromotorStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [networkFilter, setNetworkFilter] = useState<'ALL' | 'JTM_JTR' | 'JTR_ONLY' | 'JTM_ONLY'>('ALL');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedSurveyForRab, setSelectedSurveyForRab] = useState<{ survey: SurveyRecord; paket: 'paket1' | 'paket2' } | null>(null);

  // Kalkulasi data RAB untuk setiap survey
  const calculatedSurveys = useMemo(() => {
    return surveys.map((s) => {
      const p1Items = calculateRabFromSurvey(s, 'paket1', customKhsPrices);
      const p2Items = calculateRabFromSurvey(s, 'paket2', customKhsPrices);

      const p1Active = p1Items.filter((it) => !it.isHeader && it.rencanaVol > 0);
      const p2Active = p2Items.filter((it) => !it.isHeader && it.rencanaVol > 0);

      const totalP1 = p1Active.reduce((sum, it) => sum + (it.rencanaTotal || 0), 0);
      const totalP2 = p2Active.reduce((sum, it) => sum + (it.rencanaTotal || 0), 0);
      const totalAll = totalP1 + totalP2;

      const hasJtm = p1Active.length > 0;
      const hasJtr = p2Active.length > 0;

      const defaultPaket: 'paket1' | 'paket2' = hasJtm ? 'paket1' : 'paket2';

      return {
        survey: s,
        p1ActiveCount: p1Active.length,
        p2ActiveCount: p2Active.length,
        totalP1,
        totalP2,
        totalAll,
        hasJtm,
        hasJtr,
        defaultPaket,
        poleCount: s.poles?.length || 0,
      };
    });
  }, [surveys, customKhsPrices]);

  // Filter & Search
  const filteredList = useMemo(() => {
    return calculatedSurveys.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (item.survey.customerName || '').toLowerCase().includes(q) ||
        (item.survey.idpel || '').toLowerCase().includes(q) ||
        (item.survey.location || '').toLowerCase().includes(q) ||
        (item.survey.id || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (networkFilter === 'JTM_JTR') return item.hasJtm && item.hasJtr;
      if (networkFilter === 'JTR_ONLY') return item.hasJtr && !item.hasJtm;
      if (networkFilter === 'JTM_ONLY') return item.hasJtm && !item.hasJtr;

      return true;
    });
  }, [calculatedSurveys, searchTerm, networkFilter]);

  // Pagination
  const paginatedList = useMemo(() => {
    const start = (currentPageNum - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPageNum, pageSize]);

  // Grand Totals KPI
  const kpiTotals = useMemo(() => {
    let totalRp = 0;
    let totalP1Rp = 0;
    let totalP2Rp = 0;
    let withRabCount = 0;

    calculatedSurveys.forEach((item) => {
      totalP1Rp += item.totalP1;
      totalP2Rp += item.totalP2;
      totalRp += item.totalAll;
      if (item.totalAll > 0) withRabCount++;
    });

    return { totalRp, totalP1Rp, totalP2Rp, withRabCount };
  }, [calculatedSurveys]);

  const formatRp = (val: number) => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/60 p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
              MODUL DOKUMEN BIAYA
            </span>
            <span className="text-xs text-slate-400 font-medium">
              • Standar KHS WO 2026
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-blue-600" />
            <span>Rencana Anggaran Biaya (RAB)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed max-w-2xl">
            Rekapitulasi RAB resmi PLN UID Banten. Material & Jasa bersumber murni dari data hasil input <b>Survey Lapangan</b> yang dipadankan dengan Master HS WO Paket 1 & 2.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrentPage('survey')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>＋ Input Survey Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Survey Selesai</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {calculatedSurveys.length} <span className="text-sm font-semibold text-slate-400">Pelanggan</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpiTotals.withRabCount} pelanggan terhitung nilai RAB
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total RAB Paket 1 (JTM)</span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {formatRp(kpiTotals.totalP1Rp)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Material & Jasa SUTM / Gardu
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total RAB Paket 2 (JTR)</span>
            <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {formatRp(kpiTotals.totalP2Rp)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Material & Jasa JTR / SR / APP
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Grand Total Anggaran</span>
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2 tracking-tight">
            {formatRp(kpiTotals.totalRp)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Estimasi total investasi biaya
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, IDPEL, alamat..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPageNum(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Jaringan:
            </span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
              <button
                onClick={() => setNetworkFilter('ALL')}
                className={`px-3 py-1.5 font-semibold transition ${
                  networkFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setNetworkFilter('JTM_JTR')}
                className={`px-3 py-1.5 font-semibold transition border-l border-slate-200 ${
                  networkFilter === 'JTM_JTR' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                JTM & JTR
              </button>
              <button
                onClick={() => setNetworkFilter('JTR_ONLY')}
                className={`px-3 py-1.5 font-semibold transition border-l border-slate-200 ${
                  networkFilter === 'JTR_ONLY' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                JTR Saja
              </button>
              <button
                onClick={() => setNetworkFilter('JTM_ONLY')}
                className={`px-3 py-1.5 font-semibold transition border-l border-slate-200 ${
                  networkFilter === 'JTM_ONLY' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                JTM Saja
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider divide-x divide-slate-200">
                <th className="py-3 px-4">No. Survey / IDPEL</th>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">Lokasi & ULP</th>
                <th className="py-3 px-4 text-center">Spesifikasi Fisik</th>
                <th className="py-3 px-4 text-right">RAB Paket 1 (JTM)</th>
                <th className="py-3 px-4 text-right">RAB Paket 2 (JTR)</th>
                <th className="py-3 px-4 text-right font-black text-slate-800">Total RAB</th>
                <th className="py-3 px-4 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Calculator className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm text-slate-600">Tidak ada data RAB yang sesuai filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Lakukan survey lapangan terlebih dahulu untuk menghasilkan estimasi RAB.</p>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const s = item.survey;
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/30 transition-colors divide-x divide-slate-200">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{s.id}</div>
                        <div className="font-mono text-[11px] text-slate-500 font-semibold">{s.idpel || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{s.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{s.tarif || s.tarifBaru || 'R1'} / {s.daya || s.dayaBaru || '1.300'} VA</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{s.location || 'Banten Selatan'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{s.ulp || 'ULP Rangkasbitung'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                          <span>{item.poleCount} Tiang</span>
                          <span className="text-slate-300">•</span>
                          {item.hasJtm && (
                            <span className="text-indigo-600 font-bold">TM</span>
                          )}
                          {item.hasJtm && item.hasJtr && <span>/</span>}
                          {item.hasJtr && (
                            <span className="text-emerald-600 font-bold">TR</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        {item.totalP1 > 0 ? (
                          <span className="text-indigo-700 font-bold">{formatRp(item.totalP1)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                        {item.p1ActiveCount > 0 && (
                          <div className="text-[10px] text-slate-400 font-sans font-normal">({item.p1ActiveCount} item)</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        {item.totalP2 > 0 ? (
                          <span className="text-teal-700 font-bold">{formatRp(item.totalP2)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                        {item.p2ActiveCount > 0 && (
                          <div className="text-[10px] text-slate-400 font-sans font-normal">({item.p2ActiveCount} item)</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        <div className="text-slate-900 font-extrabold text-[13px]">
                          {formatRp(item.totalAll)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSurveyForRab({ survey: s, paket: item.defaultPaket })}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Buka Dokumen Resmi RAB Lengkap"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Buka RAB</span>
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
          totalItems={filteredList.length}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPageNum}
          onItemsPerPageChange={setPageSize}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>

      {/* Modal Dokumen RAB Resmi */}
      {selectedSurveyForRab && (
        <RabDocumentModal
          isOpen={!!selectedSurveyForRab}
          onClose={() => setSelectedSurveyForRab(null)}
          survey={selectedSurveyForRab.survey}
          initialPaket={selectedSurveyForRab.paket}
          mode="rab"
        />
      )}
    </div>
  );
};
