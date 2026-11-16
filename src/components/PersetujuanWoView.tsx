'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  AlertCircle,
  Building2,
  HardHat,
  Search,
  ChevronRight,
  PenTool,
  Check,
  X
} from 'lucide-react';
import { usePromotorStore, isWoPendingApproval } from '@/store/usePromotorStore';
import { WorkOrderRecord } from '@/types';
import { RabDocumentModal } from '@/components/RabDocumentModal';
import { SignaturePadModal } from '@/components/SignaturePadModal';

export const PersetujuanWoView: React.FC = () => {
  const { workOrders, approveWorkOrder, rejectWorkOrder, setCurrentPage } = usePromotorStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWoForRab, setSelectedWoForRab] = useState<WorkOrderRecord | null>(null);
  
  // State Approval dengan Tanda Tangan Digital
  const [approvingWo, setApprovingWo] = useState<WorkOrderRecord | null>(null);
  const [approverNameInput, setApproverNameInput] = useState('WEGIG DIDIK KURNIAWAN');
  const [approverRoleInput, setApproverRoleInput] = useState('ASMAN KONSTRUKSI');
  const [approverCatatanInput, setApproverCatatanInput] = useState('Disetujui untuk pelaksanaan konstruksi fisik sesuai KHS & RAB.');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSignPadOpen, setIsSignPadOpen] = useState(false);

  // Modal Rejection state
  const [rejectingWoId, setRejectingWoId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filter WOs
  const pending = workOrders.filter(isWoPendingApproval);
  const approved = workOrders.filter((w) => w.approvalStatus === 'APPROVED' || w.status === 'Konstruksi');
  const rejected = workOrders.filter((w) => w.approvalStatus === 'REJECTED' || w.status === 'Dikembalikan');

  const filteredPending = pending.filter(
    (w) =>
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Saudara WO milik pelanggan yang sama, dipakai sebagai tab di dalam modal RAB.
  const WO_ORDER = ['WO Paket 1', 'WO Paket 2', 'WO Tiang'];
  const woRank = (category?: string) => {
    const idx = WO_ORDER.indexOf(category || '');
    return idx === -1 ? WO_ORDER.length : idx;
  };

  const rabSiblingWos = (wo: WorkOrderRecord) =>
    pending
      .filter((w) => (w.idpel || w.customerName) === (wo.idpel || wo.customerName))
      .sort((a, b) => woRank(a.category) - woRank(b.category));

  const handleOpenApproveModal = (wo: WorkOrderRecord) => {
    setApprovingWo(wo);
    setApproverNameInput(wo.approverName || 'WEGIG DIDIK KURNIAWAN');
    setApproverRoleInput(wo.approverRole || 'ASMAN KONSTRUKSI');
    setApproverCatatanInput(wo.catatan || 'Disetujui untuk pelaksanaan konstruksi fisik sesuai KHS & RAB.');
    setSignatureData(wo.approverSignature || null);
  };

  const handleConfirmApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingWo) return;

    if (!approverNameInput.trim()) {
      alert('Nama Penanggung Jawab / Asman harus diisi.');
      return;
    }

    const disetujui = approveWorkOrder(approvingWo.id, {
      name: approverNameInput.trim(),
      role: approverRoleInput.trim(),
      signature: signatureData || undefined,
      catatan: approverCatatanInput.trim(),
    });

    // Modal dibiarkan terbuka bila sistem menolak (mis. beban pagu melebihi sisa).
    if (disetujui) setApprovingWo(null);
  };

  const handleOpenReject = (id: string) => {
    setRejectingWoId(id);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectingWoId) return;
    if (!rejectReason.trim()) {
      alert('Mohon masukkan alasan penolakan/revisi.');
      return;
    }
    rejectWorkOrder(rejectingWoId, rejectReason.trim());
    setRejectingWoId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Persetujuan Work Order (Approval Asman)</h2>
            <p className="text-xs text-slate-500">
              Otorisasi resmi SPK konstruksi dengan tanda tangan digital dan validasi penanggung jawab sebelum vendor mengambil material di gudang
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage('wo')}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Daftar Work Order</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Menunggu Approval</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600">{pending.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Memerlukan tanda tangan Asman Konstruksi</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Telah Disetujui</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{approved.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">WO resmi terbit & siap ambil material</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Dikembalikan / Revisi</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600">{rejected.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dikembalikan ke Admin WO untuk direvisi</div>
        </div>
      </div>

      {/* Main Pending Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-amber-50/20">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800">Antrean Persetujuan Asman Konstruksi</h3>
            <span className="ml-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
              {filteredPending.length} WO
            </span>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari No WO, vendor, pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-4">NO. WORK ORDER</th>
                <th className="py-3 px-4">PELANGGAN & IDPEL</th>
                <th className="py-3 px-4 text-center">PAKET</th>
                <th className="py-3 px-4">VENDOR PELAKSANA</th>
                <th className="py-3 px-4">PENGAWAS PLN</th>
                <th className="py-3 px-4 text-right">VOLUME MATERIAL</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-center w-44">AKSI KEPUTUSAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPending.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <div className="font-bold text-slate-700">Tidak ada WO dalam antrean</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Semua pengajuan Work Order telah diproses atau belum ada usulan baru</div>
                  </td>
                </tr>
              ) : (
                filteredPending.map((wo) => {
                  const totalItems = (wo.materials || []).length;
                  return (
                    <tr key={wo.id} className="hover:bg-amber-50/30 transition-colors divide-x divide-slate-200">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {wo.id}
                        {wo.spkNumber && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 font-normal">
                            SPK: {wo.spkNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{wo.customerName}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">IDPEL: {wo.idpel || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          wo.category === 'WO Paket 1'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : wo.category === 'WO Paket 2'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {wo.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>{wo.vendor}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 flex items-center gap-1 text-[11px]">
                          <HardHat className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{wo.supervisor1 || wo.supervisor}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-slate-700">{totalItems} Item</span>
                        {wo.volumeEditedAt ? (
                          <div
                            className="text-[10px] font-semibold text-indigo-700"
                            title={`Direvisi ${wo.volumeEditedBy || 'Asman'} • ${wo.volumeEditedAt}`}
                          >
                            Volume direvisi Asman
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">Siap dialokasikan</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Menunggu Persetujuan
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200/80 rounded-xl shadow-2xs">
                          {/* 1. Review RAB (volume rencana dapat diedit langsung di dokumen) */}
                          <button
                            type="button"
                            onClick={() => setSelectedWoForRab(wo)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition flex items-center gap-1.5 cursor-pointer shadow-2xs hover:text-slate-900"
                            title="Review RAB & Edit Volume Material / Jasa"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>RAB</span>
                          </button>
                          
                          {/* 2. Tombol Tanda Tangan & Setujui */}
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(wo)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Tanda Tangani dan Sahkan Work Order"
                          >
                            <PenTool className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>Setujui</span>
                          </button>
                          
                          {/* 3. Tombol Tolak / Kembalikan */}
                          <button
                            type="button"
                            onClick={() => handleOpenReject(wo.id)}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 transition cursor-pointer"
                            title="Kembalikan WO ke Admin (Minta Revisi)"
                          >
                            <XCircle className="w-4 h-4" />
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
      </div>

      {/* History of Approved & Rejected WOs */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">Riwayat Keputusan Work Order</h3>
          </div>
          <span className="text-xs text-slate-400">Total: {approved.length + rejected.length} WO diproses</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-4">NO. WORK ORDER</th>
                <th className="py-3 px-4">PELANGGAN</th>
                <th className="py-3 px-4">VENDOR</th>
                <th className="py-3 px-4">PENANGGUNG JAWAB (ASMAN)</th>
                <th className="py-3 px-4 text-center">TANDA TANGAN</th>
                <th className="py-3 px-4">CATATAN / ALASAN</th>
                <th className="py-3 px-4 text-center">STATUS KEPUTUSAN</th>
                <th className="py-3 px-4 text-center w-24">DOKUMEN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...approved, ...rejected].map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50/70 divide-x divide-slate-200">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{wo.id}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{wo.customerName}</td>
                  <td className="py-3 px-4 text-slate-600">{wo.vendor}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="font-semibold text-slate-800">{wo.approverName || 'WEGIG DIDIK KURNIAWAN'}</span>
                    <div className="text-[10px] text-blue-700 font-semibold">{wo.approverRole || 'ASMAN KONSTRUKSI'}</div>
                    <div className="text-[10px] text-slate-400">{wo.approvedAt || 'Tervalidasi'}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {wo.approverSignature ? (
                      <div className="p-1 bg-slate-50 border border-slate-200 rounded-md inline-block">
                        <img src={wo.approverSignature} alt="Tanda Tangan" className="h-7 w-auto object-contain" />
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Paraf Sistem</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs">
                    {wo.rejectionReason ? (
                      <span className="text-rose-600 font-medium text-[11px]">{wo.rejectionReason}</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">{wo.catatan || 'Sesuai spesifikasi teknis'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      wo.approvalStatus === 'APPROVED' || wo.status === 'Konstruksi'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {wo.approvalStatus === 'APPROVED' || wo.status === 'Konstruksi' ? 'Disetujui (Terbit)' : 'Dikembalikan'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedWoForRab(wo)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Lihat Dokumen</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: PERSETUJUAN & TANDA TANGAN DIGITAL ASMAN        */}
      {/* ======================================================== */}
      {approvingWo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleConfirmApprove}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <PenTool className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">
                    Persetujuan Work Order (Menyetujui)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  No. WO: <b className="font-mono text-slate-800">{approvingWo.id}</b> • Vendor: <b>{approvingWo.vendor}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovingWo(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Pembuat WO (Dibuat Oleh) yang sudah terisi saat Apply WO */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    Dibuat Oleh (Admin WO / Konseptor):
                  </div>
                  <div className="text-xs font-black text-slate-900 uppercase">
                    {approvingWo.creatorName || 'HASIAN EFRAVODITUS SITORUS'}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500">
                    {approvingWo.creatorRole || 'TC LOLA KONS'}
                  </div>
                </div>
              </div>
              {approvingWo.creatorSignature && (
                <div className="border border-blue-200 bg-white rounded p-1 shadow-2xs">
                  <img
                    src={approvingWo.creatorSignature}
                    alt="TTD Pembuat"
                    className="h-8 w-auto object-contain"
                    title="Tanda Tangan Pembuat WO"
                  />
                </div>
              )}
            </div>

            {/* Input Nama & Jabatan Penanggung Jawab Menyetujui */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Data Pejabat Menyetujui (Asman Konstruksi)
              </span>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pejabat Menyetujui <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={approverNameInput}
                  onChange={(e) => setApproverNameInput(e.target.value)}
                  placeholder="Contoh: WEGIG DIDIK KURNIAWAN"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan / Unit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={approverRoleInput}
                  onChange={(e) => setApproverRoleInput(e.target.value)}
                  placeholder="Contoh: ASMAN KONSTRUKSI"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Area Tanda Tangan Digital Menyetujui */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Tanda Tangan Digital Menyetujui <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSignPadOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{signatureData ? 'Ganti Tanda Tangan' : 'Goreskan Tanda Tangan'}</span>
                </button>
              </div>

              <div
                onClick={() => setIsSignPadOpen(true)}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 bg-slate-50/50 hover:bg-emerald-50/20 transition cursor-pointer flex flex-col items-center justify-center min-h-[120px]"
              >
                {signatureData ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={signatureData} alt="Tanda Tangan Digital" className="h-16 w-auto object-contain" />
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      ✓ Tanda Tangan Terlampir (Klik untuk ubah)
                    </span>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <PenTool className="w-6 h-6 mx-auto mb-1 opacity-50 text-emerald-600" />
                    <div className="text-xs font-bold text-slate-700">Wajib Goreskan Tanda Tangan Digital Asman</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Klik di sini untuk membuka kanvas tanda tangan (touchpad / stylus / mouse)</div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Catatan Approval */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Persetujuan / Arahan Khusus
              </label>
              <textarea
                rows={2}
                value={approverCatatanInput}
                onChange={(e) => setApproverCatatanInput(e.target.value)}
                placeholder="Tuliskan catatan pelaksanaan untuk vendor dan pengawas..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovingWo(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Sahkan & Terbitkan WO</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Signature Pad Kanvas Menggambar */}
      {isSignPadOpen && (
        <SignaturePadModal
          isOpen={true}
          onClose={() => setIsSignPadOpen(false)}
          title="Tanda Tangan Digital Asman Konstruksi"
          initialName={approverNameInput}
          initialRole={approverRoleInput}
          initialSignature={signatureData || undefined}
          signerType="approver"
          onSave={(dataUrl, savedName, savedRole) => {
            setSignatureData(dataUrl);
            setApproverNameInput(savedName);
            setApproverRoleInput(savedRole);
            setIsSignPadOpen(false);
          }}
        />
      )}

      {/* Modal Dialog Reject */}
      {rejectingWoId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">Kembalikan Work Order ke Admin WO</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tuliskan catatan perbaikan atau alasan revisi agar Admin WO dapat menyesuaikan penugasan vendor atau rincian RAB:
            </p>
            <textarea
              rows={3}
              placeholder="Contoh: Sisa pagu kontrak vendor mendekati batas / sesuaikan jumlah tiang sesuai kondisi akses jalan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingWoId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer"
              >
                Kembalikan WO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Review RAB */}
      {selectedWoForRab && (
        <RabDocumentModal
          isOpen={true}
          onClose={() => setSelectedWoForRab(null)}
          woData={selectedWoForRab}
          woList={rabSiblingWos(selectedWoForRab)}
          mode="wo"
          allowVolumeEdit
        />
      )}
    </div>
  );
};
