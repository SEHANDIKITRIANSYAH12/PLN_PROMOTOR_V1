'use client';

import React, { useState } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X, 
  Search, 
  Trash2, 
  Printer, 
  Send, 
  AlertTriangle, 
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
  Undo2,
  HardHat
} from 'lucide-react';
import { SurveyRecord, DaftungRecord } from '@/types';
import { Pagination } from '@/components/Pagination';
import { RabDocumentModal } from '@/components/RabDocumentModal';

export const DaftungView: React.FC = () => {
  const { 
    daftungs, 
    surveys, 
    activeDaftungTab,
    setActiveDaftungTab,
    updateDaftungDoc, 
    addDaftungFromSurvey, 
    deleteDaftung, 
    revertDaftungToAp2t,
    deleteSurvey, 
    openApplyWoFromDaftung,
    setCurrentPage, 
    showToast 
  } = usePromotorStore();
  
  // Verification Modal State
  const [verifyingSurvey, setVerifyingSurvey] = useState<SurveyRecord | null>(null);
  const [finalName, setFinalName] = useState('');
  const [finalIdpel, setFinalIdpel] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Sudah Bayar');
  const [nameChanged, setNameChanged] = useState('Tidak');
  const [note, setNote] = useState('');
  const [selectedRabDoc, setSelectedRabDoc] = useState<{ survey: SurveyRecord; paket: 'paket1' | 'paket2' } | null>(null);

  // Pagination & Search for AP2T Queue
  const [ap2tPage, setAp2tPage] = useState(1);
  const [ap2tPageSize, setAp2tPageSize] = useState(5);

  // Pagination & Search for Daftung Terverifikasi
  const [daftungSearch, setDaftungSearch] = useState('');
  const [daftungPage, setDaftungPage] = useState(1);
  const [daftungPageSize, setDaftungPageSize] = useState(5);

  // Filter survey queue for AP2T matching: HANYA survey yang sudah di-release/dikirim ke antrean AP2T
  const ap2tQueue = surveys.filter((s) => s.status === 'Masuk Antrean AP2T');
  const paginatedAp2t = ap2tQueue.slice((ap2tPage - 1) * ap2tPageSize, ap2tPage * ap2tPageSize);

  const filteredDaftungs = daftungs.filter((d) =>
    d.id.toLowerCase().includes(daftungSearch.toLowerCase()) ||
    d.customerName.toLowerCase().includes(daftungSearch.toLowerCase()) ||
    d.idpel.toLowerCase().includes(daftungSearch.toLowerCase())
  );
  const paginatedDaftungs = filteredDaftungs.slice((daftungPage - 1) * daftungPageSize, daftungPage * daftungPageSize);

  const openVerifyModal = (s: SurveyRecord) => {
    setVerifyingSurvey(s);
    setFinalName(s.customerName);
    setFinalIdpel(s.idpel || '5410' + Math.floor(10000000 + Math.random() * 90000000));
    setPaymentStatus('Sudah Bayar');
    setNameChanged('Tidak');
    setNote('');
  };

  const handleConfirmVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingSurvey) return;
    if (!finalIdpel) {
      showToast('IDPEL wajib diisi untuk verifikasi AP2T');
      return;
    }
    if (paymentStatus !== 'Sudah Bayar') {
      showToast('Hanya pembayaran berstatus Sudah Bayar yang dapat diverifikasi ke Daftung');
      return;
    }

    addDaftungFromSurvey(verifyingSurvey.id, finalName, finalIdpel);
    setVerifyingSurvey(null);
    setActiveDaftungTab('daftung');
  };

  const getMatchedSurvey = (d: DaftungRecord): SurveyRecord => {
    const matched = surveys.find(
      (s) => s.id === d.surveyId || s.idpel === d.idpel || s.customerName === d.customerName
    );
    if (matched) return matched;
    return {
      id: d.surveyId || `SRV-${d.id}`,
      customerName: d.customerName,
      idpel: d.idpel,
      jobType: 'Pasang Baru',
      location: 'Kecamatan Rangkasbitung, Kabupaten Lebak, Banten',
      address: 'Jl. Raya Rangkasbitung No. 45, Banten',
      kampung: 'Cijoro',
      desa: 'Cijoro Pasir',
      kecamatan: 'Rangkasbitung',
      kabupaten: 'Lebak',
      officerName: 'Tim Survey Distribusi UP3 BTS',
      daya: '197,000',
      tarif: 'I2',
      dayaBaru: '197,000 VA',
      tarifBaru: 'I2 / Bisnis & Industri',
      garduInduk: 'RANGKASBITUNG BARU (ONA)',
      penyulang: 'CITRA',
      gardu: 'MAJA045',
      ulp: 'ULP Rangkasbitung',
      tipeGardu: 'Portal',
      kapasitasTrafo: '250',
      jumlahKabelNaik: '2 Jurusan',
      perluasanJTM: '150 meter',
      perluasanJTR: '200 meter',
      status: 'Terverifikasi',
      createdAt: '2026-01-15',
      poles: [
        {
          id: 'TM-01',
          name: 'Tiang 01 TM',
          std: 'TM-1',
          networkType: 'JTM',
          poleType: 'Beton 11m - 350daN',
          tmConstruction: 'TM-1',
          a3cs: 'A3C 3x70 mm²',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.3551, 106.2511',
          lat: -6.3551,
          lng: 106.2511,
          note: 'Tiang Portal Awal JTM',
        },
        {
          id: 'TM-02',
          name: 'Tiang 02 TM',
          std: 'TM-2',
          networkType: 'JTM',
          poleType: 'Beton 11m - 350daN',
          tmConstruction: 'TM-2',
          a3cs: 'A3C 3x70 mm²',
          conductorLength: 50,
          qty: 1,
          coordStr: '-6.3553, 106.2513',
          lat: -6.3553,
          lng: 106.2513,
          note: 'Tiang Sudut JTM',
        },
        {
          id: 'TR-01',
          name: 'Tiang 01 TR',
          std: 'TR-1',
          networkType: 'JTR',
          poleType: 'Beton 9m - 200daN',
          trConstruction: 'TR-1',
          lvTwisted: 'TIC 3x70+1x50 mm²',
          conductorLength: 45,
          qty: 1,
          coordStr: '-6.3556, 106.2516',
          lat: -6.3556,
          lng: 106.2516,
          note: 'Tiang Penyangga TR Jurusan 1',
        },
      ],
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Tahap 2: Alur Lanjutan
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Hasil Survey ➔ Pencocokan AP2T ➔ Daftar Tunggu (Daftung)
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Daftung (Pencocokan AP2T & Data Induk)</h2>
          <p className="text-xs text-slate-500">
            Daftar hasil Survey Pelanggan yang dicocokkan dengan pembayaran AP2T dan verifikasi NIDI/SLO sebelum diterbitkan Work Order (WO).
          </p>
        </div>
        <button
          onClick={() => setCurrentPage('survey')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          ← Kembali ke Survey Pelanggan
        </button>
      </div>

      {/* 1. Tabel Verifikasi AP2T (Antrean Pencocokan Survey) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-white to-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Langkah 1: Verifikasi AP2T
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Antrean Masuk dari Survey Pelanggan</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900">Tabel Verifikasi AP2T & Pencocokan Pembayaran</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Setelah survey pelanggan selesai, data masuk ke antrean verifikasi AP2T di bawah ini. Cocokkan IDPEL & status pembayaran (&quot;Sudah Bayar&quot;) untuk memasukkan pelanggan ke Daftar Tunggu.
            </p>
          </div>
          <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{ap2tQueue.length} Antrean Perlu Diverifikasi</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-blue-100/80 border-b border-blue-200 text-slate-900 uppercase font-bold text-[11px] tracking-wider">
              <tr className="divide-x divide-blue-200">
                <th className="py-3 px-4 w-[14%]">ID SURVEY</th>
                <th className="py-3 px-4 w-[16%]">IDPEL</th>
                <th className="py-3 px-4 w-[24%]">NAMA SURVEY</th>
                <th className="py-3 px-4 w-[22%]">LOKASI</th>
                <th className="py-3 px-4 w-[12%]">STATUS</th>
                <th className="py-3 px-4 w-[12%] text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ap2tQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada antrean survey yang menunggu verifikasi AP2T.
                  </td>
                </tr>
              ) : (
                paginatedAp2t.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors divide-x divide-slate-200">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{s.id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">{s.idpel || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.customerName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{s.location}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {s.status === 'Masuk Antrean AP2T' ? 'Belum dicocokkan' : 'Perlu konfirmasi'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openVerifyModal(s)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          Verifikasi AP2T
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus antrean survey ${s.id} (${s.customerName})?`)) {
                              deleteSurvey(s.id);
                            }
                          }}
                          className="p-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 font-semibold rounded-lg transition border border-rose-200 cursor-pointer"
                          title="Hapus dari antrean"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={ap2tPage}
          totalItems={ap2tQueue.length}
          itemsPerPage={ap2tPageSize}
          onPageChange={setAp2tPage}
          onItemsPerPageChange={setAp2tPageSize}
          pageSizeOptions={[5, 10, 25]}
        />
      </div>

      {/* 2. Tabel Daftung Terverifikasi */}
      <div className="space-y-3">
        {/* Notice Banner */}
        <div className="p-3.5 bg-[#f0f6fd] border border-[#d6e6f7] rounded-xl text-[#1e40af] text-xs leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            Data di bawah adalah hasil verifikasi AP2T yang telah berstatus &quot;Sudah Bayar&quot;. Rincian teknis dan estimasi biaya dapat ditinjau melalui tombol <b>RAB</b>.
          </div>
          <div className="text-xs font-bold text-blue-700 shrink-0">
            {filteredDaftungs.length} Pelanggan di Daftar Tunggu
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari Daftung, IDPEL, atau pelanggan..."
              value={daftungSearch}
              onChange={(e) => {
                setDaftungSearch(e.target.value);
                setDaftungPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total: <b>{filteredDaftungs.length}</b> Data Daftung
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-blue-100/80 border-b border-blue-200 text-slate-900 uppercase font-bold text-[11px] tracking-wider">
              <tr className="divide-x divide-blue-200">
                <th className="p-3 px-4">No. Daftung</th>
                <th className="p-3 px-4">IDPEL</th>
                <th className="p-3 px-4">Pelanggan & Lokasi</th>
                <th className="p-3 px-4 text-center">NIDI</th>
                <th className="p-3 px-4 text-center">SLO</th>
                <th className="p-3 px-4">Status Daftung</th>
                <th className="p-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDaftungs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data Daftung yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedDaftungs.map((d) => {
                  const targetSurvey = getMatchedSurvey(d);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 divide-x divide-slate-200">
                      <td className="p-3 px-4 font-bold text-slate-900 whitespace-nowrap">{d.id}</td>
                      <td className="p-3 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">{d.idpel}</td>
                      <td className="p-3 px-4 font-bold text-slate-800">
                        <div className="font-bold text-slate-900 text-xs">{d.customerName}</div>
                        <div className="text-[11px] font-normal text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{targetSurvey.location || 'Wilayah UP3 Banten Selatan'}</span>
                        </div>
                      </td>
                      <td className="p-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={d.nidi}
                          onChange={(e) => updateDaftungDoc(d.id, 'nidi', e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={d.slo}
                          onChange={(e) => updateDaftungDoc(d.id, 'slo', e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                            d.status === 'WO Terbit' || d.status === 'Siap Apply'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : d.status === 'Menunggu Approval'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : d.status === 'Perlu Revisi'
                              ? 'bg-rose-50 text-rose-800 border border-rose-300'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {d.status === 'WO Terbit' ? 'Terverifikasi' : d.status}
                          </span>
                          {d.status === 'Perlu Revisi' && d.rejectionReason && (
                            <div className="text-[10px] text-rose-700 font-medium line-clamp-1" title={d.rejectionReason}>
                              ⚠️ {d.rejectionReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Lihat Dokumen RAB */}
                          <button
                            type="button"
                            onClick={() => {
                              const defaultPaket = targetSurvey.poles?.some((p) => p.networkType === 'JTM' || p.id.startsWith('TM'))
                                ? 'paket1'
                                : 'paket2';
                              setSelectedRabDoc({ survey: targetSurvey, paket: defaultPaket });
                            }}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Buka Dokumen RAB (Paket 1 & Paket 2)"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>RAB</span>
                          </button>

                          {/* Tombol Apply WO */}
                          <button
                            type="button"
                            onClick={() => openApplyWoFromDaftung(d.id)}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Apply Work Order (WO) untuk pelanggan ini"
                          >
                            <HardHat className="w-3.5 h-3.5 text-purple-600" />
                            <span>Apply WO</span>
                          </button>

                          {/* Tombol Kembalikan ke AP2T */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin mengembalikan pelanggan ${d.customerName} (${d.id}) ke antrean Verifikasi AP2T?`)) {
                                revertDaftungToAp2t(d.id);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Kembalikan data ke antrean Verifikasi AP2T"
                          >
                            <Undo2 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Kembalikan ke AP2T</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus data Daftung ${d.id} (${d.customerName})?`)) {
                                deleteDaftung(d.id);
                              }
                            }}
                            className="p-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 font-semibold rounded-lg transition border border-rose-200 cursor-pointer"
                            title="Hapus Daftung"
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

        <Pagination
          currentPage={daftungPage}
          totalItems={filteredDaftungs.length}
          itemsPerPage={daftungPageSize}
          onPageChange={setDaftungPage}
          onItemsPerPageChange={setDaftungPageSize}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>
    </div>

      {/* MODAL COCOKKAN AP2T */}
      {verifyingSurvey && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Verifikasi Survey dengan AP2T</h3>
                <p className="text-[11px] text-slate-500">Pencocokan manual oleh Admin Daftung</p>
              </div>
              <button onClick={() => setVerifyingSurvey(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmVerify} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                Cocokkan dengan daftar AP2T eksternal. Nama dan IDPEL boleh dikoreksi; material survey terkunci.
              </div>

              {/* Data Teknis Hasil Survey untuk Verifikasi Lapangan */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-200 pb-1">
                  <span>Data Teknis Hasil Survey Lapangan</span>
                  <span className="font-mono text-blue-700 font-bold">{verifyingSurvey.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Daya & Tarif:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {verifyingSurvey.dayaBaru || verifyingSurvey.daya || '-'} VA ({verifyingSurvey.tarifBaru || verifyingSurvey.tarif || '-'})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Titik Pasok (GI / Feeder):</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {verifyingSurvey.penyulang || '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">Alamat Lokasi:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {verifyingSurvey.address || verifyingSurvey.location || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Nama dari Survey</label>
                <input
                  type="text"
                  readOnly
                  value={verifyingSurvey.customerName}
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pelanggan Final *</label>
                <input
                  type="text"
                  required
                  value={finalName}
                  onChange={(e) => setFinalName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ID Pelanggan (IDPEL) Final *</label>
                <input
                  type="text"
                  required
                  value={finalIdpel}
                  onChange={(e) => setFinalIdpel(e.target.value)}
                  placeholder="12 digit IDPEL AP2T"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-blue-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option>Sudah Bayar</option>
                    <option>Belum Bayar</option>
                    <option>Perlu klarifikasi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Berubah?</label>
                  <select
                    value={nameChanged}
                    onChange={(e) => setNameChanged(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option>Tidak</option>
                    <option>Ya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan validasi pembayaran..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyingSurvey(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow-xs"
                >
                  Verifikasi & Masukkan ke Daftung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dokumen RAB Resmi */}
      {selectedRabDoc && (
        <RabDocumentModal
          isOpen={!!selectedRabDoc}
          onClose={() => setSelectedRabDoc(null)}
          survey={selectedRabDoc.survey}
          initialPaket={selectedRabDoc.paket}
          mode="rab"
        />
      )}
    </div>
  );
};

