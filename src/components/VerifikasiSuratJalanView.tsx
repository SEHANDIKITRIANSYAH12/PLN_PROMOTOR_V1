'use client';

import React, { useState } from 'react';
import { 
  FileCheck2, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Eye, 
  Building2, 
  Calendar, 
  Clock, 
  HardHat, 
  Boxes, 
  Camera, 
  Check, 
  X, 
  FileText,
  AlertCircle,
  HelpCircle,
  Filter
} from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { WorkOrderRecord, WoMaterialItem } from '@/types';

export const VerifikasiSuratJalanView: React.FC = () => {
  const { workOrders, verifySuratJalan, showToast } = usePromotorStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'BELUM' | 'SESUAI' | 'ADA_SELISIH' | 'RETUR'>('ALL');

  // Modal Rekonsiliasi Material
  const [selectedWoForVerify, setSelectedWoForVerify] = useState<WorkOrderRecord | null>(null);
  const [verifyItems, setVerifyItems] = useState<{
    material: string;
    unit: string;
    qtyTaken: number;
    qtyInstalled: number;
    qtyReturned: number;
    verificationNote: string;
  }[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [verifierName, setVerifierName] = useState('Hasian Sitorus (TC Lola Konstruksi)');

  // Modal View Dokumen Surat Jalan
  const [viewSjDoc, setViewSjDoc] = useState<WorkOrderRecord | null>(null);

  // Ambil WO yang siap atau sudah diverifikasi
  const relevantWos = workOrders.filter(
    (w) => Boolean(w.suratJalanNumber) || w.reservationStatus === 'Selesai' || w.status === 'Verifikasi SJ' || (w.materials || []).some(m => m.isTaken)
  );

  const filteredWos = relevantWos.filter((w) => {
    const matchSearch =
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.suratJalanNumber && w.suratJalanNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (filterStatus === 'BELUM') return !w.sjVerificationStatus || w.sjVerificationStatus === 'BELUM_DIPERIKSA';
    if (filterStatus === 'SESUAI') return w.sjVerificationStatus === 'SESUAI';
    if (filterStatus === 'ADA_SELISIH') return w.sjVerificationStatus === 'ADA_SELISIH';
    if (filterStatus === 'RETUR') return w.sjVerificationStatus === 'RETUR_GUDANG';
    return true;
  });

  const handleOpenVerifyModal = (wo: WorkOrderRecord) => {
    setSelectedWoForVerify(wo);
    setGeneralNotes(wo.sjVerificationNotes || '');
    setVerifierName(wo.sjVerifiedBy || wo.supervisor1 || wo.supervisor || 'Hasian Sitorus (TC Lola Konstruksi)');

    // Inisialisasi item verifikasi
    const initialItems = (wo.materials || []).map((m) => {
      const taken = m.qtyTaken || m.qtyAllocated || m.qtyReksis;
      return {
        material: m.material,
        unit: m.unit,
        qtyTaken: taken,
        qtyInstalled: m.qtyInstalled !== undefined ? m.qtyInstalled : taken,
        qtyReturned: m.qtyReturned || 0,
        verificationNote: m.verificationNote || '',
      };
    });
    setVerifyItems(initialItems);
  };

  const handleItemInstalledChange = (materialName: string, val: number) => {
    setVerifyItems((prev) =>
      prev.map((it) => {
        if (it.material === materialName) {
          const autoRetur = Math.max(0, it.qtyTaken - val);
          return { ...it, qtyInstalled: val, qtyReturned: autoRetur };
        }
        return it;
      })
    );
  };

  const handleItemReturnedChange = (materialName: string, val: number) => {
    setVerifyItems((prev) =>
      prev.map((it) => (it.material === materialName ? { ...it, qtyReturned: val } : it))
    );
  };

  const handleItemNoteChange = (materialName: string, note: string) => {
    setVerifyItems((prev) =>
      prev.map((it) => (it.material === materialName ? { ...it, verificationNote: note } : it))
    );
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoForVerify) return;

    verifySuratJalan(selectedWoForVerify.id, verifyItems, generalNotes, verifierName);
    setSelectedWoForVerify(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Verifikasi Surat Jalan (Pengawasan Lapangan)</h2>
            <p className="text-xs text-slate-500">
              Rekonsiliasi material PLN: Cocokkan jumlah barang yang keluar dari gudang vs yang benar-benar terpasang di lapangan
            </p>
          </div>
        </div>
      </div>

      {/* Info Card Fungsi Pengawasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-emerald-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Kesesuaian 100%</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Seluruh material yang diambil dari gudang terpasang lengkap sesuai titik tiang dan spesifikasi RAB.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
            <RotateCcw className="w-4 h-4" />
            <span>Material Sisa (Retur)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Kelebihan material (misal sisa kabel twisted 15 meter) dibuatkan berita acara retur kembali ke gudang PLN.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Selisih Tidak Wajar</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Material hilang atau rusak di lapangan tercatat resmi untuk evaluasi kinerja vendor pelaksana.
          </p>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari No. Surat Jalan, No. WO, vendor, pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Status Rekonsiliasi</option>
            <option value="BELUM">Belum Diverifikasi</option>
            <option value="SESUAI">100% Sesuai</option>
            <option value="RETUR">Ada Retur Gudang</option>
            <option value="ADA_SELISIH">Ada Selisih</option>
          </select>
        </div>
      </div>

      {/* Tabel Rekonsiliasi Surat Jalan */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10.5px] tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-4">SURAT JALAN & NO. WO</th>
                <th className="py-3 px-4">PELANGGAN</th>
                <th className="py-3 px-4">VENDOR PELAKSANA</th>
                <th className="py-3 px-4">PENGAWAS PLN</th>
                <th className="py-3 px-4 text-center">STATUS VERIFIKASI</th>
                <th className="py-3 px-4 text-center">FOTO DOKUMEN</th>
                <th className="py-3 px-4 text-center w-36">AKSI REKONSILIASI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-500" />
                    Belum ada surat jalan yang siap diverifikasi. Pastikan vendor telah mengupload surat jalan di menu Vendor & Pengambilan.
                  </td>
                </tr>
              ) : (
                filteredWos.map((wo) => {
                  const status = wo.sjVerificationStatus || 'BELUM_DIPERIKSA';
                  const isVerified = status !== 'BELUM_DIPERIKSA';

                  return (
                    <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-200">
                      {/* Surat Jalan & WO */}
                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          {wo.suratJalanNumber || <span className="text-amber-600 font-sans italic text-[11px]">Belum input No SJ</span>}
                        </div>
                        <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                          WO: {wo.id}
                        </div>
                      </td>

                      {/* Pelanggan */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">{wo.customerName}</div>
                        <div className="text-[10px] font-mono text-slate-400">IDPEL: {wo.idpel || '-'}</div>
                      </td>

                      {/* Vendor */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{wo.vendor}</span>
                        </div>
                      </td>

                      {/* Pengawas */}
                      <td className="py-4 px-4">
                        <div className="text-slate-800 font-medium">{wo.sjVerifiedBy || wo.supervisor1 || wo.supervisor}</div>
                        {wo.sjVerifiedAt && <div className="text-[10px] text-slate-400">Waktu: {wo.sjVerifiedAt}</div>}
                      </td>

                      {/* Status Verifikasi */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                          status === 'SESUAI'
                            ? 'bg-[#eaf8f0] text-[#1e834b]'
                            : status === 'RETUR_GUDANG'
                            ? 'bg-[#e0f2fe] text-[#0369a1]'
                            : status === 'ADA_SELISIH'
                            ? 'bg-[#fee2e2] text-[#b91c1c]'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {status === 'SESUAI' && '✓ 100% Sesuai Terpasang'}
                          {status === 'RETUR_GUDANG' && '↩ Ada Material Retur'}
                          {status === 'ADA_SELISIH' && '⚠ Ada Selisih Fisik'}
                          {status === 'BELUM_DIPERIKSA' && '⏳ Menunggu Verifikasi'}
                        </span>
                      </td>

                      {/* Foto Dokumen */}
                      <td className="py-4 px-4 text-center">
                        {wo.suratJalanPhoto ? (
                          <button
                            type="button"
                            onClick={() => setViewSjDoc(wo)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-purple-700 font-semibold text-[11px] transition cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Lihat Berkas</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Tidak ada foto</span>
                        )}
                      </td>

                      {/* Aksi Verifikasi */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenVerifyModal(wo)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5 mx-auto ${
                            isVerified
                              ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>{isVerified ? 'Edit Verifikasi' : 'Verifikasi Fisik'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL REKONSILIASI FISIK MATERIAL (KELUAR GUDANG VS TERPASANG DI LAPANGAN)*/}
      {/* ========================================================================= */}
      {selectedWoForVerify && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmitVerification}
            className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col"
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Formulir Rekonsiliasi Material Surat Jalan ({selectedWoForVerify.suratJalanNumber || selectedWoForVerify.id})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  WO: <b>{selectedWoForVerify.id}</b> • Vendor: <b>{selectedWoForVerify.vendor}</b> • Pelanggan: <b>{selectedWoForVerify.customerName}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWoForVerify(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pengawas input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pengawas Pemeriksa</label>
                <input
                  type="text"
                  required
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Keseluruhan Pengawas</label>
                <input
                  type="text"
                  placeholder="Contoh: Seluruh tiang dan kabel terpasang kokoh, sisa material telah masuk gudang..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Tabel Per Item Material */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px]">
                  <tr className="divide-x divide-slate-200">
                    <th className="py-2.5 px-3">NAMA MATERIAL</th>
                    <th className="py-2.5 px-3 text-center w-24">DIAMBIL (GUDANG)</th>
                    <th className="py-2.5 px-3 text-center w-28 bg-emerald-50/60 text-emerald-900">TERPASANG FISIK</th>
                    <th className="py-2.5 px-3 text-center w-24 bg-blue-50/60 text-blue-900">RETUR GUDANG</th>
                    <th className="py-2.5 px-3 text-center w-20">SELISIH</th>
                    <th className="py-2.5 px-3">CATATAN MATERIAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verifyItems.map((item, idx) => {
                    const selisih = item.qtyTaken - (item.qtyInstalled + item.qtyReturned);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 divide-x divide-slate-200">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {item.material}
                          <div className="text-[10px] text-slate-400 font-normal">Satuan: {item.unit}</div>
                        </td>

                        {/* Jumlah Diambil Gudang */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {item.qtyTaken} {item.unit}
                        </td>

                        {/* Input Terpasang Fisik */}
                        <td className="py-3 px-3 text-center bg-emerald-50/30">
                          <input
                            type="number"
                            min={0}
                            max={item.qtyTaken}
                            value={item.qtyInstalled}
                            onChange={(e) => handleItemInstalledChange(item.material, Number(e.target.value))}
                            className="w-16 p-1.5 text-center font-mono font-bold text-emerald-900 border border-emerald-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Input Retur Gudang */}
                        <td className="py-3 px-3 text-center bg-blue-50/30">
                          <input
                            type="number"
                            min={0}
                            max={item.qtyTaken}
                            value={item.qtyReturned}
                            onChange={(e) => handleItemReturnedChange(item.material, Number(e.target.value))}
                            className="w-16 p-1.5 text-center font-mono font-bold text-blue-900 border border-blue-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Selisih */}
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {selisih === 0 ? (
                            <span className="text-emerald-600">0</span>
                          ) : (
                            <span className="text-rose-600">-{selisih}</span>
                          )}
                        </td>

                        {/* Catatan per item */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            placeholder="Keterangan..."
                            value={item.verificationNote}
                            onChange={(e) => handleItemNoteChange(item.material, e.target.value)}
                            className="w-full p-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Modal */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Formula Akuntabilitas: <b>Diambil = Terpasang + Retur</b>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWoForVerify(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Sahkan Hasil Verifikasi</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL VIEW FOTO SURAT JALAN FISIK                                         */}
      {/* ========================================================================= */}
      {viewSjDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Dokumen Surat Jalan: {viewSjDoc.suratJalanNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  WO: <b>{viewSjDoc.id}</b> • Vendor: <b>{viewSjDoc.vendor}</b>
                </p>
              </div>
              <button
                onClick={() => setViewSjDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewSjDoc.suratJalanPhoto ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                <img src={viewSjDoc.suratJalanPhoto} alt="Surat Jalan" className="w-full max-h-96 object-cover" />
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-400">
                Foto berkas tidak tersedia
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewSjDoc(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

