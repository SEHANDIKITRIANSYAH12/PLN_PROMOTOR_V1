'use client';

import React, { useState, useMemo } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import {
  CheckCircle2,
  ArrowRight,
  X,
  Search,
  Trash2,
  FileText,
  ShieldCheck,
  Clock,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { SurveyRecord } from '@/types';
import { Pagination } from '@/components/Pagination';
import { RabDocumentModal } from '@/components/RabDocumentModal';
import { getSurveyPackages, listSurveyDocs, SurveyDocType } from '@/data/surveyRabCalculator';

export const PraDaftungView: React.FC = () => {
  const { 
    surveys, 
    workOrders,
    updateSurvey,
    deleteSurvey, 
    setSelectedDaftungIdForWo,
    setCurrentPage, 
    showToast,
    returnSurveyToRevision,
    currentUser,
    currentRole
  } = usePromotorStore();
  
  // State Verifikasi Modal
  const [verifyingSurvey, setVerifyingSurvey] = useState<SurveyRecord | null>(null);
  const [finalName, setFinalName] = useState('');
  const [isNameChanged, setIsNameChanged] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [dayaBaruVal, setDayaBaruVal] = useState('');
  const [alamatVal, setAlamatVal] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Sudah Bayar' | 'Belum Bayar'>('Sudah Bayar');
  const [paymentDateVal, setPaymentDateVal] = useState('');
  const [nidiVal, setNidiVal] = useState(true);
  const [sloVal, setSloVal] = useState(true);

  // State Modal Kembalikan ke Survey (Perlu Revisi)
  const [revisionSurvey, setRevisionSurvey] = useState<SurveyRecord | null>(null);
  const [revisionReasonInput, setRevisionReasonInput] = useState('');
  
  // Modal RAB Preview
  const [selectedRabDoc, setSelectedRabDoc] = useState<{ survey: SurveyRecord; paket: SurveyDocType } | null>(null);

  // Search & Pagination: Verifikasi AP2T
  const [searchAp2t, setSearchAp2t] = useState('');
  const [pageAp2t, setPageAp2t] = useState(1);
  const [pageSizeAp2t, setPageSizeAp2t] = useState(10);

  // Tabel Verifikasi AP2T (Semua Hasil Survey untuk diverifikasi status bayar)
  const listVerifikasiAp2t = useMemo(() => {
    return surveys.filter((s) => {
      const q = searchAp2t.toLowerCase();
      return (
        s.customerName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q)
      );
    });
  }, [surveys, searchAp2t]);

  const paginatedAp2t = listVerifikasiAp2t.slice((pageAp2t - 1) * pageSizeAp2t, pageAp2t * pageSizeAp2t);

  // Buka Modal Verifikasi
  const openVerifyModal = (s: SurveyRecord) => {
    setVerifyingSurvey(s);
    setFinalName(s.customerName);
    setIsNameChanged(Boolean(s.isNameChanged));
    setNewCustomerName(s.isNameChanged ? s.customerName : '');
    setDayaBaruVal(s.dayaBaru || s.daya || '');
    setAlamatVal(s.location || s.address || '');
    setPaymentStatus(s.paymentStatus || 'Sudah Bayar');
    setPaymentDateVal(s.paymentDate || new Date().toISOString().split('T')[0]);
    setNidiVal(s.nidi !== undefined ? s.nidi : true);
    setSloVal(s.slo !== undefined ? s.slo : true);
  };

  // Simpan Verifikasi: Jika "Sudah Bayar" -> Pindah ke Status Siap Apply WO
  const handleConfirmVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingSurvey) return;

    // Tentukan nama pelanggan akhir: jika dicentang ada perubahan dan diisi nama baru, pakai nama baru
    const effectiveCustomerName = isNameChanged && newCustomerName.trim()
      ? newCustomerName.trim()
      : finalName.trim();

    const originalName = verifyingSurvey.originalCustomerName || verifyingSurvey.customerName;
    // Tanda "Semula" hanya bila nama benar-benar berganti (perubahan bisa saja hanya daya/alamat).
    const nameDiffers = isNameChanged && effectiveCustomerName !== originalName;

    const nextStatus = paymentStatus === 'Sudah Bayar' ? 'Siap Apply WO' : 'Masuk Antrean AP2T';
    const effectiveDaya = dayaBaruVal.trim() || verifyingSurvey.dayaBaru || verifyingSurvey.daya;
    const effectiveAlamat = alamatVal.trim() || verifyingSurvey.location;
    const effectivePaymentDate = paymentStatus === 'Sudah Bayar'
      ? (paymentDateVal.trim() || new Date().toISOString().split('T')[0])
      : undefined;
    
    updateSurvey(verifyingSurvey.id, {
      customerName: effectiveCustomerName,
      originalCustomerName: nameDiffers ? originalName : undefined,
      isNameChanged: nameDiffers,
      ...(isNameChanged && {
        dayaBaru: effectiveDaya,
        daya: effectiveDaya,
        location: effectiveAlamat,
        address: effectiveAlamat,
      }),
      paymentStatus: paymentStatus,
      paymentDate: effectivePaymentDate,
      status: nextStatus,
      nidi: nidiVal,
      slo: sloVal,
    });

    setVerifyingSurvey(null);
    if (paymentStatus === 'Sudah Bayar') {
      showToast(`✓ Verifikasi Berhasil! Status ${effectiveCustomerName} kini "Sudah Bayar" dan siap Apply WO.`);
    } else {
      showToast(`Data ${effectiveCustomerName} disimpan dengan status Belum Bayar.`);
    }
  };

  // Teruskan langsung ke Menu Work Order
  const handleProceedToWo = (s: SurveyRecord) => {
    setSelectedDaftungIdForWo(s.id);
    setCurrentPage('wo');
    showToast(`Membuka form Apply WO untuk ${s.customerName}...`);
  };

  // Navigasi langsung melihat detail Work Order yang sudah diajukan/terbit
  const handleViewExistingWo = (s: SurveyRecord) => {
    setCurrentPage('wo');
    showToast(`Membuka daftar Work Order untuk ${s.customerName}`);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Potensi Daftung: Verifikasi Pembayaran AP2T
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Survey Pelanggan ➔ Verifikasi Bayar AP2T ➔ Terbitkan Work Order (Apply WO)
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Verifikasi AP2T & Potensi Daftung</h2>
          <p className="text-xs text-slate-500">
            Daftar pelanggan hasil survey lapangan untuk diverifikasi status pembayaran AP2T. Jika pelanggan berstatus <b>Sudah Bayar</b>, tombol aksi otomatis berubah menjadi <b>Apply WO</b> untuk menerbitkan Work Order.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrentPage('survey')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            ← Menu Survey
          </button>
          <button
            onClick={() => setCurrentPage('wo')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Buka Work Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TABEL BAWAH: VERIFIKASI AP2T */}
      {/* ========================================================= */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tabel Verifikasi AP2T & Penerbitan WO</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              {listVerifikasiAp2t.length} Data
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Verifikasi Pembayaran AP2T. Jika sudah bayar, tombol aksi otomatis berubah menjadi <b>Apply WO</b>.
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Toolbar Pencarian */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari survey, pelanggan, lokasi..."
                value={searchAp2t}
                onChange={(e) => {
                  setSearchAp2t(e.target.value);
                  setPageAp2t(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total: <b>{listVerifikasiAp2t.length}</b> Data
            </div>
          </div>

          {/* Tabel Verifikasi AP2T */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px] tracking-wider">
                <tr className="divide-x divide-slate-200">
                  <th className="py-3 px-3.5 whitespace-nowrap">ID SURVEY</th>
                  <th className="py-3 px-4 min-w-[220px]">NAMA PELANGGAN</th>
                  <th className="py-3 px-3.5 min-w-[130px] whitespace-nowrap">DAYA & TARIF BARU</th>
                  <th className="py-3 px-3.5 min-w-[130px] whitespace-nowrap">DAYA & TARIF LAMA</th>
                  <th className="py-3 px-3.5 min-w-[220px]">LOKASI & ULP</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">STATUS & TGL BAYAR</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">NIDI / SLO</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">DOKUMEN RAB</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedAp2t.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada data verifikasi AP2T.
                    </td>
                  </tr>
                ) : (
                  paginatedAp2t.map((s) => {
                    const isPaid = s.paymentStatus === 'Sudah Bayar';

                    // Cek apakah Work Order sudah pernah diajukan untuk survey ini
                    const relatedWos = workOrders.filter((w) => {
                      return (
                        w.surveyId === s.id ||
                        w.daftungId === s.id ||
                        (w.customerName && s.customerName && w.customerName.toLowerCase().trim() === s.customerName.toLowerCase().trim())
                      );
                    });
                    const isWoApplied = relatedWos.length > 0;
                    const isWoApproved = relatedWos.some((w) => w.status === 'Konstruksi' || w.status === 'Selesai' || w.status === 'Closeout');

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors divide-x divide-slate-200">
                        <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {s.id}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {s.createdAt || 'Baru'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-middle">
                          <div className="font-bold text-slate-900 text-xs leading-snug break-words">
                            {s.customerName}
                          </div>
                          {s.isNameChanged && s.originalCustomerName && (
                            <div className="text-[10px] text-amber-600 mt-0.5">
                              Semula: {s.originalCustomerName}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-700 text-xs block">
                            {s.dayaBaru || s.daya || '197.000'} VA
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Tarif {s.tarifBaru || s.tarif || 'I2'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                          {s.dayaLama || s.tarifLama ? (
                            <>
                              <span className="font-mono font-bold text-slate-700 text-xs block">
                                {s.dayaLama || '-'} VA
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                Tarif {s.tarifLama || '-'}
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">— (Pasang Baru)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 align-middle text-xs">
                          <div className="font-medium text-slate-800 leading-relaxed break-words">{s.location}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{s.ulp || 'UP3 Banten Selatan'}</div>
                        </td>

                        <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                          {isPaid ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Sudah Bayar</span>
                              </span>
                              {s.paymentDate ? (
                                <span className="text-[10px] text-slate-600 font-semibold inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Tanggal Pelunasan AP2T">
                                  <Calendar className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>{s.paymentDate}</span>
                                </span>
                              ) : (
                                <span className="text-[9.5px] text-slate-400 italic">Tgl: —</span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Belum Bayar</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              s.nidi !== false ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400'
                            }`}>
                              NIDI
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              s.slo !== false ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-400'
                            }`}>
                              SLO
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const [initialPaket = 'paket2'] = listSurveyDocs(getSurveyPackages(s));
                              setSelectedRabDoc({ survey: s, paket: initialPaket });
                            }}
                            className="px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg transition border border-blue-200 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>RAB</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-3.5 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPaid ? (
                              isWoApplied ? (
                                /* JIKA WO SUDAH DI-APPLY: TAMPILKAN STATUS WO / LIHAT WO */
                                <button
                                  type="button"
                                  onClick={() => handleViewExistingWo(s)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                                    isWoApproved
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  }`}
                                  title={
                                    isWoApproved
                                      ? `Work Order telah terbit (${relatedWos.length} WO). Klik untuk melihat detail di menu WO.`
                                      : `Work Order sudah diajukan (${relatedWos.length} WO) & Menunggu Approval Asman. Klik untuk melihat detail.`
                                  }
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-current" />
                                  <span>{isWoApproved ? 'WO Terbit' : 'WO Diajukan'}</span>
                                  <ArrowRight className="w-3 h-3 opacity-70" />
                                </button>
                              ) : (
                                /* JIKA SUDAH BAYAR TAPI BELUM APPLY WO */
                                <button
                                  type="button"
                                  onClick={() => handleProceedToWo(s)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer animate-in fade-in duration-150"
                                  title="Data sudah diverifikasi & bayar. Terbitkan Work Order (WO)!"
                                >
                                  <span>Apply WO</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )
                            ) : (
                              /* JIKA BELUM BAYAR: TOMBOL AKSI VERIFIKASI AP2T */
                              <button
                                type="button"
                                onClick={() => openVerifyModal(s)}
                                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Pengecekan Pembayaran dan NIDI/SLO"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Verifikasi AP2T</span>
                              </button>
                            )}

                            {/* Tombol Re-verifikasi jika ingin mengedit kembali status */}
                            {isPaid && (
                              <button
                                type="button"
                                onClick={() => openVerifyModal(s)}
                                className="p-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 font-semibold rounded-lg transition border border-slate-200 cursor-pointer"
                                title="Edit data verifikasi AP2T"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tombol Kembalikan ke Survey untuk Revisi Teknis (Admin Daftung & Super Admin) */}
                            {!isWoApplied && (currentRole === 'Admin Daftung' || currentRole === 'Super Admin') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRevisionSurvey(s);
                                  setRevisionReasonInput('');
                                }}
                                className="p-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold rounded-lg transition border border-amber-200 cursor-pointer"
                                title="Kembalikan data ke Admin Survey (Perlu Revisi Teknis)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus data antrean survey ${s.customerName}?`)) {
                                  deleteSurvey(s.id);
                                }
                              }}
                              className="p-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold rounded-lg transition border border-rose-200 cursor-pointer"
                              title="Hapus data"
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
            currentPage={pageAp2t}
            totalItems={listVerifikasiAp2t.length}
            itemsPerPage={pageSizeAp2t}
            onPageChange={setPageAp2t}
            onItemsPerPageChange={setPageSizeAp2t}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>

      {/* MODAL VERIFIKASI AP2T */}
      {verifyingSurvey && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Verifikasi Data dengan Billing AP2T</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  ID Survey: <span className="font-mono font-bold text-blue-300">{verifyingSurvey.id}</span>
                </p>
              </div>
              <button 
                onClick={() => setVerifyingSurvey(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmVerify} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-[11px] leading-relaxed">
                Pencocokan data permohonan pelanggan dengan sistem billing AP2T PLN. Jika status pembayaran dipilih <b>&quot;Sudah Bayar&quot;</b>, data akan otomatis masuk ke <b>Tabel 2: Potensi Daftung (Siap Apply WO)</b>.
              </div>

              {/* Data Nama Pelanggan & Trigger Ganti Nama */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      {isNameChanged ? 'Nama Pelanggan Semula (Data Survey):' : 'Nama Pelanggan (Survey & AP2T):'}
                    </label>
                    {isNameChanged && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                        Nama Awal Lapangan
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={finalName}
                    readOnly
                    disabled
                    title="Centang 'Ada Perubahan Data Pelanggan di AP2T' untuk mengubah"
                    className="w-full p-2.5 border rounded-xl font-bold transition focus:outline-none bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                  />
                </div>

                {/* Data daya & alamat hasil survey (hanya bisa diubah lewat centang perubahan) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isNameChanged ? 'Daya Semula (VA):' : 'Daya Baru (VA):'}
                    </label>
                    <input
                      type="text"
                      value={verifyingSurvey.dayaBaru || verifyingSurvey.daya || '-'}
                      readOnly
                      disabled
                      title="Centang 'Ada Perubahan Data Pelanggan di AP2T' untuk mengubah"
                      className="w-full p-2.5 border rounded-xl font-bold font-mono bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      {isNameChanged ? 'Alamat Semula:' : 'Alamat Lokasi:'}
                    </label>
                    <input
                      type="text"
                      value={verifyingSurvey.location || verifyingSurvey.address || '-'}
                      readOnly
                      disabled
                      title="Centang 'Ada Perubahan Data Pelanggan di AP2T' untuk mengubah"
                      className="w-full p-2.5 border rounded-xl font-semibold bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Trigger Checkbox: Ada Perubahan / Balik Nama Pelanggan di AP2T */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isNameChanged}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsNameChanged(checked);
                        if (checked && !newCustomerName) {
                          setNewCustomerName(finalName);
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        Ada Perubahan Data Pelanggan di AP2T (Nama / Daya / Alamat)
                      </span>
                      <span className="text-[10.5px] text-slate-500 block">
                        Centang opsi ini jika nama, daya, atau alamat permohonan di AP2T berbeda dengan hasil survey / terjadi balik nama pelanggan.
                      </span>
                    </div>
                  </label>

                  {/* Inputan perubahan data yang muncul saat di-trigger */}
                  {isNameChanged && (
                    <div className="pt-2.5 border-t border-slate-200 space-y-3 animate-fadeIn">
                      <div>
                        <label className="block font-bold text-blue-900 mb-1">
                          Nama Pelanggan Baru (Sesuai AP2T): <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          placeholder="Masukkan nama pelanggan baru hasil verifikasi AP2T..."
                          className="w-full p-2.5 border-2 border-blue-400 rounded-xl font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-blue-900 mb-1">
                            Daya Baru (VA): <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={dayaBaruVal}
                            onChange={(e) => setDayaBaruVal(e.target.value)}
                            placeholder="Contoh: 1.300"
                            className="w-full p-2.5 border-2 border-blue-400 rounded-xl font-bold font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block font-bold text-blue-900 mb-1">
                            Alamat Lokasi: <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={alamatVal}
                            onChange={(e) => setAlamatVal(e.target.value)}
                            placeholder="Kp. ..., Desa ..., Kec. ..., Kab. ..."
                            className="w-full p-2.5 border-2 border-blue-400 rounded-xl font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-[10.5px] text-blue-600">
                        💡 Data baru ini yang akan digunakan pada dokumen RAB, Potensi Daftung, dan Work Order (WO).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Pembayaran di Kasir AP2T:</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      const next = e.target.value as typeof paymentStatus;
                      setPaymentStatus(next);
                      if (next === 'Sudah Bayar' && !paymentDateVal) {
                        setPaymentDateVal(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-xs"
                  >
                    <option value="Sudah Bayar">✓ Sudah Bayar (Lunas BP/UJL ➔ Siap Apply WO)</option>
                    <option value="Belum Bayar">⏳ Belum Bayar (Tetap di Antrean Verifikasi AP2T)</option>
                  </select>
                </div>

                {paymentStatus === 'Sudah Bayar' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tanggal Bayar AP2T:</span>
                      </span>
                      <span className="text-rose-500 text-[10px]">* Wajib Diisi</span>
                    </label>
                    <input
                      type="date"
                      value={paymentDateVal}
                      onChange={(e) => setPaymentDateVal(e.target.value)}
                      required={paymentStatus === 'Sudah Bayar'}
                      className="w-full p-2.5 border-2 border-emerald-400 rounded-xl font-bold text-slate-900 bg-emerald-50/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-xs cursor-pointer text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tanggal pelunasan tagihan BP/UJL di loket atau bank (AP2T).
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">Kelengkapan Dokumen Legalitas Teknis:</span>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={nidiVal}
                      onChange={(e) => setNidiVal(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700 text-xs">NIDI Valid & Terbit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sloVal}
                      onChange={(e) => setSloVal(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700 text-xs">SLO Valid & Terbit</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyingSurvey(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Simpan & Proses Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KEMBALIKAN KE SURVEY (PERLU REVISI) */}
      {revisionSurvey && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Kembalikan ke Admin Survey</h3>
                  <p className="text-[11px] text-amber-800 font-medium">Permintaan Revisi Teknis / Lapangan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevisionSurvey(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!revisionReasonInput.trim()) {
                  showToast('⚠️ Silakan masukkan alasan revisi data survey!');
                  return;
                }
                returnSurveyToRevision(revisionSurvey.id, revisionReasonInput, currentUser.name);
                setRevisionSurvey(null);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">ID & Pelanggan:</span>
                  <span className="font-bold text-slate-800">{revisionSurvey.id} — {revisionSurvey.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Lokasi:</span>
                  <span className="text-slate-600">{revisionSurvey.location}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Alasan Pengembalian / Catatan Revisi: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={revisionReasonInput}
                  onChange={(e) => setRevisionReasonInput(e.target.value)}
                  placeholder="Contoh: Titik tiang #3 terhalang bangunan, mohon geser koordinat atau ukur ulang jarak gawang..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Status survey akan berubah menjadi <b>Perlu Revisi</b> sehingga dapat diedit kembali oleh Admin Survey.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevisionSurvey(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kirim Permintaan Revisi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DOKUMEN RAB */}
      {selectedRabDoc && (
        <RabDocumentModal
          isOpen={!!selectedRabDoc}
          survey={selectedRabDoc.survey}
          initialPaket={selectedRabDoc.paket}
          mode="rab"
          onClose={() => setSelectedRabDoc(null)}
        />
      )}
    </div>
  );
};
