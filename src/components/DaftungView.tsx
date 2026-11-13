'use client';

import React, { useState } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X, 
  Search, 
  Printer, 
  Clock, 
  Calculator, 
  FileText,
  Eye,
  MapPin,
  Zap,
  Layers,
  Wrench,
  ShieldCheck,
  Building,
  Activity,
  HardHat,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { DaftungRecord, WorkOrderRecord } from '@/types';
import { Pagination } from '@/components/Pagination';
import { RabDocumentModal } from '@/components/RabDocumentModal';

const parseSupervisor = (s?: string) => {
  if (!s || s === '—') return { name: '—', role: '' };
  const parts = s.split('(');
  const name = parts[0].trim();
  const role = parts.length > 1 ? parts[1].replace(')', '').trim() : '';
  return { name, role };
};

export const DaftungView: React.FC = () => {
  const { 
    daftungs, 
    surveys, 
    workOrders,
    setCurrentPage, 
    showToast 
  } = usePromotorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'KONSTRUKSI' | 'SELESAI'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modal Dokumen WO / RAB
  const [selectedDocModal, setSelectedDocModal] = useState<{
    survey: any;
    wo?: WorkOrderRecord;
    paket: 'paket1' | 'paket2';
    mode: 'rab' | 'wo';
  } | null>(null);

  // Filter pelanggan yang ada di Daftung:
  // ATURAN RESMI PLN: Yang masuk ke Daftung HANYA pelanggan yang Work Order-nya SUDAH DISETUJUI ASMAN (APPROVED)
  const filteredDaftungs = daftungs.filter((d) => {
    // 1. Validasi WO: Harus memiliki WO dengan status persetujuan Asman 'APPROVED'
    const relWos = workOrders.filter((w) => w.daftungId === d.id || w.idpel === d.idpel);
    const hasApprovedWo = relWos.length > 0 && relWos.some((w) => w.approvalStatus === 'APPROVED');
    if (!hasApprovedWo) return false;

    const matchesSearch = 
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.idpel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const allCompleted = relWos.every((w) => w.status === 'Selesai' || w.progress === 100);

    if (statusFilter === 'SELESAI') return allCompleted;
    if (statusFilter === 'KONSTRUKSI') return !allCompleted;

    return true;
  });

  const paginatedDaftungs = filteredDaftungs.slice((page - 1) * pageSize, page * pageSize);

  // Helper mendapatkan WO terkait pelanggan ini
  const getCustomerWorkOrders = (d: DaftungRecord): WorkOrderRecord[] => {
    return workOrders.filter((w) => w.daftungId === d.id || w.idpel === d.idpel);
  };

  // Helper survey terkait
  const getMatchedSurvey = (d: DaftungRecord) => {
    return surveys.find((s) => s.id === d.surveyId || s.idpel === d.idpel || s.customerName === d.customerName);
  };

  // Stat Counter: Hanya menghitung pelanggan yang WO-nya sudah disetujui Asman
  const approvedDaftungs = daftungs.filter((d) => {
    const relWos = workOrders.filter((w) => w.daftungId === d.id || w.idpel === d.idpel);
    return relWos.length > 0 && relWos.some((w) => w.approvalStatus === 'APPROVED');
  });
  const totalDaftung = approvedDaftungs.length;
  const countSelesai = approvedDaftungs.filter((d) => {
    const wos = getCustomerWorkOrders(d);
    return wos.length > 0 && wos.every(w => w.status === 'Selesai' || w.progress === 100);
  }).length;
  const countKonstruksi = totalDaftung - countSelesai;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              Tahap 4: Pelaksanaan Konstruksi
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Survey ➔ Potensi Daftung ➔ Work Order (Disetujui Asman) ➔ <b className="text-emerald-700">Daftar Tunggu (Daftung)</b>
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Daftar Tunggu Konstruksi (Daftung Resmi)</h2>
          <p className="text-xs text-slate-500">
            Daftar resmi seluruh pelanggan yang <b>Work Order (WO)-nya telah disetujui Asman Konstruksi</b> dan sedang dalam antrean eksekusi fisik lapangan hingga penyalaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage('pradaftung')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            ← Potensi Daftung
          </button>
          <button
            onClick={() => setCurrentPage('wo')}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            Work Order (WO)
          </button>
          <button
            onClick={() => setCurrentPage('verifikasi-pengawas')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Verifikasi Pengawas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-bold">Total Pelanggan di Daftung</span>
            <div className="text-xl font-black text-slate-900 mt-1">{totalDaftung}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">WO Resmi Disetujui Asman</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-amber-700 text-xs font-bold">Antrean & On Progress</span>
            <div className="text-xl font-black text-amber-900 mt-1">{countKonstruksi}</div>
            <span className="text-[11px] text-amber-600 mt-0.5 block">Penarikan Material & Jasa</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-emerald-700 text-xs font-bold">Konstruksi Selesai (Siap Nyala)</span>
            <div className="text-xl font-black text-emerald-900 mt-1">{countSelesai}</div>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">Progres Fisik 100%</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabel Daftung */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Toolbar Pencarian & Filter */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari No. Daftung, IDPEL, atau nama pelanggan..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold text-xs">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Pelanggan Daftung ({totalDaftung})</option>
              <option value="KONSTRUKSI">⚡ On Progress Konstruksi ({countKonstruksi})</option>
              <option value="SELESAI">✓ Selesai / Siap Nyala ({countSelesai})</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1250px]">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px] tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-3.5 whitespace-nowrap">NO. DAFTUNG</th>
                <th className="py-3 px-3.5 min-w-[180px]">NAMA PELANGGAN</th>
                <th className="py-3 px-3.5 min-w-[180px]">ALAMAT & LOKASI</th>
                <th className="py-3 px-3.5 min-w-[120px] text-center">DAYA & TARIF</th>
                <th className="py-3 px-3 min-w-[190px]">PAKET WO TERBIT</th>
                <th className="py-3 px-3.5 min-w-[190px]">VENDOR PELAKSANA</th>
                <th className="py-3 px-3.5 min-w-[240px]">PENGAWAS LAPANGAN</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">STATUS & PROGRES</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDaftungs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Belum ada pelanggan di Daftar Tunggu (Daftung) yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedDaftungs.map((d) => {
                  const relWos = getCustomerWorkOrders(d);
                  const matchedSurvey = getMatchedSurvey(d);

                  // Hitung progres rata-rata dari seluruh WO terkait
                  const avgProgress = relWos.length > 0
                    ? Math.round(relWos.reduce((acc, w) => acc + (w.progress || 0), 0) / relWos.length)
                    : 0;
                  const isCompleted = avgProgress === 100;

                  return (
                    <tr key={d.id} className="hover:bg-blue-50/20 transition-colors divide-x divide-slate-200">
                      {/* 1. NO. DAFTUNG & IDPEL */}
                      <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                        <span className="font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {d.id}
                        </span>
                        <div className="text-[11px] font-mono font-bold text-blue-700 mt-1">
                          IDPEL: {d.idpel}
                        </div>
                      </td>

                      {/* 2. NAMA PELANGGAN */}
                      <td className="py-3.5 px-3.5 align-middle">
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {d.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {d.source || 'REKSIS'}
                        </div>
                      </td>

                      {/* 3. ALAMAT & LOKASI */}
                      <td className="py-3.5 px-3.5 align-middle">
                        <div className="text-slate-800 text-xs line-clamp-2 leading-relaxed">
                          {d.location || matchedSurvey?.location || matchedSurvey?.address || 'Wilayah Kerja UP3 Banten Selatan'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {d.ulp || matchedSurvey?.ulp || 'UP3 Banten Selatan'}
                        </div>
                      </td>

                      {/* 4. DAYA & TARIF */}
                      <td className="py-3.5 px-3.5 align-middle text-center whitespace-nowrap">
                        <span className="inline-block bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-extrabold text-xs border border-blue-200">
                          {d.daya || matchedSurvey?.dayaBaru || matchedSurvey?.daya || '197.000'} VA
                        </span>
                        <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                          Tarif {d.tarif || matchedSurvey?.tarifBaru || matchedSurvey?.tarif || 'I2'}
                        </div>
                      </td>

                      {/* 5. PAKET WO TERBIT */}
                      <td className="p-0 align-top">
                        {relWos.length > 0 ? (
                          <div className="divide-y divide-slate-200">
                            {relWos.map((w) => (
                              <div
                                key={w.id}
                                onClick={() => {
                                  setSelectedDocModal({
                                    survey: matchedSurvey,
                                    wo: w,
                                    paket: w.category === 'WO Paket 1' ? 'paket1' : 'paket2',
                                    mode: 'wo',
                                  });
                                }}
                                className="h-[68px] px-3 flex items-center justify-between gap-1.5 hover:bg-blue-50/80 cursor-pointer transition"
                                title={`Klik untuk melihat dokumen resmi ${w.id}`}
                              >
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${
                                  w.category === 'WO Paket 1'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : w.category === 'WO Paket 2'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                }`}>
                                  {w.category === 'WO Paket 1' ? 'P1' : w.category === 'WO Paket 2' ? 'P2' : 'TB'}
                                </span>
                                <span className="font-mono font-bold text-slate-800 text-[10.5px] truncate hover:text-blue-600 underline decoration-dotted" title={w.id}>
                                  {w.id}
                                </span>
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                  {w.progress || 0}%
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-slate-400 text-[11px] italic">WO sedang diproses</div>
                        )}
                      </td>

                      {/* 6. VENDOR PELAKSANA */}
                      <td className="p-0 align-top text-xs">
                        {relWos.length > 0 ? (
                          <div className="divide-y divide-slate-200">
                            {relWos.map((w, idx) => (
                              <div key={idx} className="h-[68px] px-3 flex items-center">
                                <span className="font-bold text-slate-800 text-xs leading-snug">
                                  {w.vendor}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-slate-400">—</div>
                        )}
                      </td>

                      {/* 7. PENGAWAS LAPANGAN (Rapi, Terstruktur P1 & P2) */}
                      <td className="p-0 align-top text-xs">
                        {relWos.length > 0 ? (
                          <div className="divide-y divide-slate-200">
                            {relWos.map((w, idx) => {
                              const s1 = parseSupervisor(w.supervisor1 || w.supervisor);
                              const s2 = parseSupervisor(w.supervisor2);

                              return (
                                <div key={idx} className="h-[68px] px-3.5 flex flex-col justify-center gap-1.5 leading-tight">
                                  {/* Pengawas 1 */}
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                                      P1
                                    </span>
                                    <div className="min-w-0 flex items-baseline gap-1 truncate">
                                      <span className="font-bold text-slate-800 text-[11px] truncate" title={w.supervisor1 || w.supervisor}>
                                        {s1.name}
                                      </span>
                                      {s1.role && (
                                        <span className="text-[9.5px] text-slate-500 font-medium truncate shrink-0">
                                          ({s1.role})
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Pengawas 2 */}
                                  {w.supervisor2 && (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                        P2
                                      </span>
                                      <div className="min-w-0 flex items-baseline gap-1 truncate">
                                        <span className="font-semibold text-slate-700 text-[10.5px] truncate" title={w.supervisor2}>
                                          {s2.name}
                                        </span>
                                        {s2.role && (
                                          <span className="text-[9.5px] text-slate-500 font-normal truncate shrink-0">
                                            ({s2.role})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 text-slate-400">—</div>
                        )}
                      </td>

                      {/* 6. STATUS & PROGRES */}
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1">
                          {isCompleted ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Selesai (Siap Nyala)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-600" />
                              <span>On Progress ({avgProgress}%)</span>
                            </span>
                          )}

                          <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-0.5">
                            <div 
                              className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
                              style={{ width: `${avgProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 7. AKSI */}
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setCurrentPage('verifikasi-pengawas')}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Buka Verifikasi & Progres Lapangan"
                          >
                            <span>Verifikasi</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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

        <Pagination
          currentPage={page}
          totalItems={filteredDaftungs.length}
          itemsPerPage={pageSize}
          onPageChange={setPage}
          onItemsPerPageChange={setPageSize}
          pageSizeOptions={[5, 10, 25]}
        />
      </div>

      {/* MODAL DOKUMEN WO / RAB */}
      {selectedDocModal && (
        <RabDocumentModal
          isOpen={!!selectedDocModal}
          survey={selectedDocModal.survey}
          woData={selectedDocModal.wo}
          initialPaket={selectedDocModal.paket}
          mode={selectedDocModal.mode}
          onClose={() => setSelectedDocModal(null)}
        />
      )}
    </div>
  );
};
