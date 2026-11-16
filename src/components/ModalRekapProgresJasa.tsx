'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { WorkOrderRecord, WoJasaItem } from '@/types';
import { getJasaSubSection } from '@/data/jasaSubSections';

interface Props {
  wo: WorkOrderRecord;
  items: WoJasaItem[];
  onClose: () => void;
  onPreviewPhoto?: (photoUrl: string) => void;
}

interface SubGroupSummary {
  groupName: string;
  items: WoJasaItem[];
  totalRencanaRp: number;
  totalRealisasiRp: number;
  progresPersen: number;
  itemCount: number;
  completedCount: number;
  isComplete: boolean;
}

export const ModalRekapProgresJasa: React.FC<Props> = ({
  wo,
  items,
  onClose,
  onPreviewPhoto,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [filterMode, setFilterMode] = useState<'ALL' | 'DONE' | 'ONGOING' | 'NOT_STARTED'>('ALL');

  // Kelompokkan item berdasarkan sub bab KHS
  const groupSummaries = useMemo<SubGroupSummary[]>(() => {
    const map = new Map<string, WoJasaItem[]>();

    items.forEach((it) => {
      const sub = getJasaSubSection(it.id, it.subKategori, it.deskripsi);
      if (!map.has(sub)) {
        map.set(sub, []);
      }
      map.get(sub)!.push(it);
    });

    const list: SubGroupSummary[] = [];

    map.forEach((grpItems, groupName) => {
      const totalRencanaRp = grpItems.reduce((acc, it) => acc + (it.qtyTarget * (it.hargaSatuan || 0)), 0);
      const totalRealisasiRp = grpItems.reduce((acc, it) => acc + ((it.qtyRealisasi || 0) * (it.hargaSatuan || 0)), 0);
      const completedCount = grpItems.filter((it) => {
        const rQty = it.qtyRealisasi !== undefined ? it.qtyRealisasi : 0;
        return it.qtyTarget > 0 && rQty >= it.qtyTarget;
      }).length;

      let pct = 0;
      if (totalRencanaRp > 0) {
        pct = Math.min(100, Math.round((totalRealisasiRp / totalRencanaRp) * 100));
      } else {
        pct = completedCount === grpItems.length ? 100 : 0;
      }

      list.push({
        groupName,
        items: grpItems,
        totalRencanaRp,
        totalRealisasiRp,
        progresPersen: pct,
        itemCount: grpItems.length,
        completedCount,
        isComplete: pct >= 100,
      });
    });

    return list;
  }, [items]);

  const toggleGroup = (grpName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [grpName]: !prev[grpName],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    groupSummaries.forEach((g) => {
      all[g.groupName] = true;
    });
    setExpandedGroups(all);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

  const filteredGroups = useMemo(() => {
    if (filterMode === 'ALL') return groupSummaries;
    if (filterMode === 'DONE') return groupSummaries.filter((g) => g.progresPersen >= 100);
    if (filterMode === 'ONGOING') return groupSummaries.filter((g) => g.progresPersen > 0 && g.progresPersen < 100);
    if (filterMode === 'NOT_STARTED') return groupSummaries.filter((g) => g.progresPersen === 0);
    return groupSummaries;
  }, [groupSummaries, filterMode]);

  const totalOverallRencanaRp = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.qtyTarget * (it.hargaSatuan || 0)), 0);
  }, [items]);

  const totalOverallRealisasiRp = useMemo(() => {
    return items.reduce((acc, it) => acc + ((it.qtyRealisasi || 0) * (it.hargaSatuan || 0)), 0);
  }, [items]);

  const totalCompletedGroups = groupSummaries.filter((g) => g.isComplete).length;
  const overallPct = totalOverallRencanaRp > 0
    ? Math.min(100, Math.round((totalOverallRealisasiRp / totalOverallRencanaRp) * 100))
    : (wo.progressJasa ?? 0);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Rekap Status Capaian Kelompok Jasa Lapangan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {wo.category}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Read-Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                No. WO: <b className="font-mono text-slate-800">{wo.id}</b> • SPK: <b className="font-mono text-slate-800">{wo.spkNumber || '-'}</b> • Vendor: <b className="text-slate-800">{wo.vendor}</b> • Pelanggan: <b className="text-slate-800">{wo.customerName}</b>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Ringkasan Akumulasi */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Akumulasi Fisik Total</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-blue-700 font-mono">{overallPct}%</span>
              <span className="text-[11px] text-slate-400">selesai</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${overallPct === 100 ? 'bg-emerald-500' : overallPct >= 50 ? 'bg-blue-600' : 'bg-amber-500'}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Status Bagian Sub-Bab</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-700 font-mono">{totalCompletedGroups}</span>
              <span className="text-xs text-slate-500 font-medium">/ {groupSummaries.length} Bagian Tuntas</span>
            </div>
            <div className="text-[10.5px] text-slate-500 mt-1.5">
              {groupSummaries.length - totalCompletedGroups} bagian belum selesai
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Total Nilai Realisasi</div>
            <div className="text-sm font-black text-slate-800 font-mono mt-1">
              Rp {totalOverallRealisasiRp.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Target: Rp {totalOverallRencanaRp.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Status Pengawasan</div>
            <div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                wo.progressStatus === 'DISETUJUI'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : wo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : wo.progressStatus === 'DITOLAK'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {wo.progressStatus === 'DISETUJUI' && '✓ Terverifikasi Pengawas'}
                {wo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS' && '🟡 Menunggu Verif Pengawas'}
                {wo.progressStatus === 'DITOLAK' && '✗ Ditolak Pengawas'}
                {(!wo.progressStatus || wo.progressStatus === 'IDLE') && 'Belum Diajukan'}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                filterMode === 'ALL' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({groupSummaries.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('DONE')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                filterMode === 'DONE' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Sudah Selesai ({groupSummaries.filter((g) => g.progresPersen >= 100).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('ONGOING')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                filterMode === 'ONGOING' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Dalam Proses ({groupSummaries.filter((g) => g.progresPersen > 0 && g.progresPersen < 100).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('NOT_STARTED')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                filterMode === 'NOT_STARTED' ? 'bg-slate-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Belum Mulai ({groupSummaries.filter((g) => g.progresPersen === 0).length})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              Buka Semua
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              Tutup Semua
            </button>
          </div>
        </div>

        {/* List Kelompok Sub-Bab Jasa */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400">
              Tidak ada kelompok jasa yang sesuai dengan filter.
            </div>
          ) : (
            filteredGroups.map((grp) => {
              const isExpanded = Boolean(expandedGroups[grp.groupName]);
              const isTuntas = grp.progresPersen >= 100;
              const isProses = grp.progresPersen > 0 && grp.progresPersen < 100;

              return (
                <div
                  key={grp.groupName}
                  className={`bg-white rounded-xl border transition-all duration-150 overflow-hidden shadow-2xs ${
                    isTuntas
                      ? 'border-emerald-300 ring-1 ring-emerald-200/50'
                      : isProses
                      ? 'border-blue-300'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Header Card Sub-Bab */}
                  <div
                    onClick={() => toggleGroup(grp.groupName)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition ${
                      isTuntas
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                        : isProses
                        ? 'bg-blue-50/30 hover:bg-blue-50/60'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1 rounded-md text-slate-500 hover:bg-slate-200 transition shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
                            {grp.groupName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-100">
                            {grp.completedCount}/{grp.itemCount} item selesai
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          Realisasi: <b className="text-slate-800">Rp {grp.totalRealisasiRp.toLocaleString('id-ID')}</b> / Rp {grp.totalRencanaRp.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex flex-col items-end w-28">
                        <span className={`text-xs font-black font-mono ${isTuntas ? 'text-emerald-700' : isProses ? 'text-blue-700' : 'text-slate-400'}`}>
                          {grp.progresPersen}%
                        </span>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isTuntas ? 'bg-emerald-500' : isProses ? 'bg-blue-600' : 'bg-slate-300'}`}
                            style={{ width: `${grp.progresPersen}%` }}
                          />
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-black font-mono shrink-0 ${
                        isTuntas
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isProses
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isTuntas ? '✓ 100% TUNTAS' : isProses ? `${grp.progresPersen}% PROSES` : '0% BELUM'}
                      </span>
                    </div>
                  </div>

                  {/* Body Detail Item jika di-Expand */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3 w-10 text-center">No</th>
                              <th className="py-2 px-3">Uraian Pekerjaan Jasa</th>
                              <th className="py-2 px-3 text-center w-20">Satuan</th>
                              <th className="py-2 px-3 text-center w-24">Vol. Rencana</th>
                              <th className="py-2 px-3 text-center w-28 bg-amber-50/40">Vol. Realisasi</th>
                              <th className="py-2 px-3 text-right w-32">Nilai Realisasi</th>
                              <th className="py-2 px-3 text-center w-24">Bukti / Foto</th>
                              <th className="py-2 px-3 text-center w-24">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {grp.items.map((it, idx) => {
                              const rQty = it.qtyRealisasi !== undefined ? it.qtyRealisasi : 0;
                              const isItemDone = it.qtyTarget > 0 && rQty >= it.qtyTarget;
                              const isItemPartial = rQty > 0 && rQty < it.qtyTarget;
                              const itemVal = rQty * (it.hargaSatuan || 0);

                              return (
                                <tr
                                  key={it.id || idx}
                                  className={`hover:bg-slate-50/80 transition-colors ${
                                    isItemDone ? 'bg-emerald-50/20' : isItemPartial ? 'bg-blue-50/15' : ''
                                  }`}
                                >
                                  <td className="py-2 px-3 text-center font-mono text-[10.5px] text-slate-400">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="font-semibold text-slate-900 leading-snug">
                                      {it.deskripsi}
                                    </div>
                                    {it.kendala && (
                                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 text-[9.5px] font-bold border border-rose-200">
                                        <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                        <span>Kendala: {it.kendala}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-center text-[10.5px] text-slate-600">
                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                                      {it.unit}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono text-[11px] font-bold text-slate-700">
                                    {it.qtyTarget} {it.unit}
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono text-[11px] font-black text-blue-700 bg-amber-50/20">
                                    {rQty} {it.unit}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-700">
                                    Rp {itemVal.toLocaleString('id-ID')}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {it.evidencePhoto ? (
                                      <button
                                        type="button"
                                        onClick={() => onPreviewPhoto && onPreviewPhoto(it.evidencePhoto!)}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold transition cursor-pointer"
                                        title="Lihat foto bukti lapangan"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Foto</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-300">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {isItemDone ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        <span>Selesai</span>
                                      </span>
                                    ) : isItemPartial ? (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800">
                                        Proses
                                      </span>
                                    ) : (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400">
                                        0%
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            *Modal ini hanya menyajikan ringkasan & rekapan monitoring progres riil (tidak mengubah data).
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Tutup Rekapan
          </button>
        </div>
      </div>
    </div>
  );
};
