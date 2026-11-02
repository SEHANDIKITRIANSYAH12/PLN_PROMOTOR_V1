'use client';

import React, { useState, useEffect } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { WorkOrderRecord } from '@/types';
import { 
  HardHat, 
  CheckCircle, 
  Clock, 
  Link2, 
  ExternalLink, 
  Package, 
  Search, 
  Eye, 
  Filter, 
  X,
  FileText,
  Trash2,
  Printer,
  Edit3,
  PlusCircle,
  ClipboardCheck,
  ShieldCheck,
  AlertCircle,
  PenTool,
  Check,
  Layers,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Building2,
  Briefcase,
  ChevronDown
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { RabDocumentModal } from '@/components/RabDocumentModal';
import { SignaturePadModal } from '@/components/SignaturePadModal';

const DEFAULT_ASMAN_PARAF = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120"><path d="M 35,45 C 45,80 55,85 62,35 C 70,75 80,80 88,30 C 95,45 110,25 125,50 C 135,68 120,85 95,80 M 45,90 L 140,88" fill="none" stroke="%23003366" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const DEFAULT_HASIAN_PARAF = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120"><path d="M 40,70 C 50,50 70,25 78,12 C 82,5 75,8 70,22 C 62,48 55,80 48,112 M 52,72 C 60,48 72,40 82,42 C 90,44 88,62 89,76 C 92,28 102,20 108,30 C 112,38 110,68 112,80 C 116,48 126,45 132,56 C 136,66 138,82 144,102 M 62,58 L 130,56" fill="none" stroke="%23003366" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const WorkOrderView: React.FC = () => {
  const { 
    workOrders, 
    daftungs, 
    vendors, 
    contracts, 
    supervisors,
    createWorkOrdersFromDaftung, 
    approveWorkOrder, 
    rejectWorkOrder, 
    resubmitWorkOrder,
    selectedDaftungIdForWo,
    setSelectedDaftungIdForWo,
    updateWoProgress, 
    updateWoReservation, 
    deleteWorkOrder, 
    setCurrentPage, 
    showToast 
  } = usePromotorStore();

  const [selectedDocWo, setSelectedDocWo] = useState<WorkOrderRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [woPage, setWoPage] = useState(1);
  const [woPageSize, setWoPageSize] = useState(5);

  // State Modal Apply WO Baru di Menu Work Order
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedDaftungId, setSelectedDaftungId] = useState('');
  const [p1Enabled, setP1Enabled] = useState(true);
  const [p1ContractId, setP1ContractId] = useState('');
  const [p1Vendor, setP1Vendor] = useState('PT. HILMAN PRIMA PERKASA');
  const [p1NoWo, setP1NoWo] = useState('537.10.WO.2026');
  const [p1Pengawas1, setP1Pengawas1] = useState('Hasian Sitorus (TC Lola Konstruksi)');
  const [p1Pengawas2, setP1Pengawas2] = useState('Daud Febrizer (TL Teknik ULP Rangkasbitung)');

  const [p2Enabled, setP2Enabled] = useState(true);
  const [p2ContractId, setP2ContractId] = useState('');
  const [p2Vendor, setP2Vendor] = useState('PT. TAWAKAL KARYA TEKNIK');
  const [p2NoWo, setP2NoWo] = useState('538.10.WO.2026');
  const [p2Pengawas1, setP2Pengawas1] = useState('Winnetou Chandra Sadli (Officer Kinerja Konstruksi)');
  const [p2Pengawas2, setP2Pengawas2] = useState('');

  // State Modal Persetujuan Asman
  const [approvalModalWo, setApprovalModalWo] = useState<WorkOrderRecord | null>(null);
  const [asmanName, setAsmanName] = useState('WEGIG DIDIK KURNIAWAN');
  const [asmanRole, setAsmanRole] = useState('ASMAN KONSTRUKSI');
  const [asmanSig, setAsmanSig] = useState<string>(DEFAULT_ASMAN_PARAF);
  const [asmanNote, setAsmanNote] = useState('Disetujui untuk dilaksanakan di lapangan sesuai SPK dan standar KHS 2026.');
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Digital Signature Pad Modal
  const [sigPadConfig, setSigPadConfig] = useState<{
    isOpen: boolean;
    title: string;
    initialName: string;
    initialRole: string;
    initialSig?: string;
  }>({
    isOpen: false,
    title: '',
    initialName: '',
    initialRole: '',
  });

  // Buka Modal Apply WO
  const handleOpenApplyModal = (preselectedDfId?: string) => {
    const targetDf = preselectedDfId 
      ? daftungs.find((d) => d.id === preselectedDfId) 
      : daftungs.find((d) => d.status === 'Siap Apply' || d.status === 'Perlu Revisi') || daftungs[0];
    
    if (targetDf) {
      setSelectedDaftungId(targetDf.id);
    } else {
      setSelectedDaftungId('');
    }

    const activeP1 = contracts.filter((c) => c.jenisPekerjaan === 'Paket 1' && c.status === 'AKTIF');
    const activeP2 = contracts.filter((c) => c.jenisPekerjaan === 'Paket 2' && c.status === 'AKTIF');

    // Cek apakah ada WO lama yang pernah dibuat untuk daftung ini (misal yang dikembalikan)
    const existingWos = targetDf ? workOrders.filter((w) => w.daftungId === targetDf.id) : [];
    const existingP1 = existingWos.find((w) => w.category === 'WO Paket 1');
    const existingP2 = existingWos.find((w) => w.category === 'WO Paket 2');

    setP1Enabled(true);
    setP1ContractId(existingP1?.contractId || activeP1[0]?.id || '');
    setP1Vendor(existingP1?.vendor || activeP1[0]?.vendorName || 'PT. HILMAN PRIMA PERKASA');
    setP1NoWo(existingP1?.id || `537.${Math.floor(10 + Math.random() * 89)}.WO.2026`);
    setP1Pengawas1(existingP1?.supervisor1 || 'Hasian Sitorus (TC Lola Konstruksi)');
    setP1Pengawas2(existingP1?.supervisor2 || 'Daud Febrizer (TL Teknik ULP Rangkasbitung)');

    setP2Enabled(true);
    setP2ContractId(existingP2?.contractId || activeP2[0]?.id || '');
    setP2Vendor(existingP2?.vendor || activeP2[0]?.vendorName || 'PT. TAWAKAL KARYA TEKNIK');
    setP2NoWo(existingP2?.id || `538.${Math.floor(10 + Math.random() * 89)}.WO.2026`);
    setP2Pengawas1(existingP2?.supervisor1 || 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)');
    setP2Pengawas2(existingP2?.supervisor2 || '');

    setIsApplyModalOpen(true);
  };

  // Navigasi otomatis jika dipicu dari menu Daftung
  useEffect(() => {
    if (selectedDaftungIdForWo) {
      handleOpenApplyModal(selectedDaftungIdForWo);
      setSelectedDaftungIdForWo(null);
    }
  }, [selectedDaftungIdForWo]);

  // Handler cepat jika klik Revisi pada baris WO yang ditolak
  const handleOpenRevision = (wo: WorkOrderRecord) => {
    if (wo.daftungId) {
      handleOpenApplyModal(wo.daftungId);
    } else {
      setIsApplyModalOpen(true);
    }
  };

  // Submit Apply WO -> Berstatus Menunggu Persetujuan Asman
  // Submit Apply WO -> Berstatus Menunggu Persetujuan Asman & Tampilkan Output Dokumen WO
  const handleSubmitApplyWo = (e: React.FormEvent) => {
    e.preventDefault();
    const selDf = daftungs.find((d) => d.id === selectedDaftungId);
    if (!selDf) {
      showToast('Pilih data Daftung terlebih dahulu');
      return;
    }
    if (!p1Enabled && !p2Enabled) {
      showToast('Pilih minimal satu paket (Paket 1 atau Paket 2)');
      return;
    }

    const selP1 = contracts.find((c) => c.id === p1ContractId);
    const selP2 = contracts.find((c) => c.id === p2ContractId);

    createWorkOrdersFromDaftung(selDf.id, selDf.idpel, selDf.customerName, {
      paket1: {
        enabled: p1Enabled,
        vendor: p1Vendor.trim(),
        contractId: p1ContractId,
        noSpk: selP1 ? selP1.spkNumber : '0021.PJ/DAN.02.03/UP3-BTS/2026',
        validFrom: selP1 ? selP1.validFrom : '02 Jan 2026',
        validTo: selP1 ? selP1.validTo : '31 Des 2026',
        noWorkOrder: p1NoWo.trim(),
        pengawas1: p1Pengawas1.trim(),
        pengawas2: p1Pengawas2.trim(),
      },
      paket2: {
        enabled: p2Enabled,
        vendor: p2Vendor.trim(),
        contractId: p2ContractId,
        noSpk: selP2 ? selP2.spkNumber : '0022.PJ/DAN.02.03/UP3-BTS/2026',
        validFrom: selP2 ? selP2.validFrom : '02 Jan 2026',
        validTo: selP2 ? selP2.validTo : '31 Des 2026',
        noWorkOrder: p2NoWo.trim(),
        pengawas1: p2Pengawas1.trim(),
        pengawas2: p2Pengawas2.trim(),
      },
      signatures: {
        approverName: 'WEGIG DIDIK KURNIAWAN',
        approverRole: 'ASMAN KONSTRUKSI',
        approverSignature: undefined,
        creatorName: 'HASIAN EFRAVODITUS SITORUS',
        creatorRole: 'TC LOLA KONS',
        creatorSignature: undefined,
        catatan: '*) Mulai kegiatan disesuaikan dengan kesiapan sarana pendukung (Tiang Beton, Gardu Distribusi dll)',
      },
    });

    setIsApplyModalOpen(false);

    // Langsung buka Dokumen WO Output hasil Apply WO
    const latestWos = usePromotorStore.getState().workOrders;
    const targetCreatedWo = latestWos.find((w) => w.daftungId === selDf.id || w.idpel === selDf.idpel);
    if (targetCreatedWo) {
      setSelectedDocWo(targetCreatedWo);
    }
    showToast(`✓ Berhasil Apply WO untuk ${selDf.customerName}. Dokumen WO ditampilkan.`);
  };

  // Preview Dokumen WO Output
  const handlePreviewOutput = () => {
    const selDf = daftungs.find((d) => d.id === selectedDaftungId) || daftungs[0];
    if (!selDf) {
      showToast('Pilih data Daftung terlebih dahulu');
      return;
    }
    const previewWo: WorkOrderRecord = {
      id: p1NoWo || '537.10.WO.2026',
      noWorkOrder: p1NoWo || '537.10.WO.2026',
      customerName: selDf.customerName,
      idpel: selDf.idpel,
      category: 'WO Paket 1',
      vendor: p1Vendor || 'PT. HILMAN PRIMA PERKASA',
      spkNumber: '0021.PJ/DAN.02.03/UP3-BTS/2026',
      validFrom: '02 Jan 2026',
      validTo: '31 Des 2026',
      supervisor: p1Pengawas1 || 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor1: p1Pengawas1 || 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor2: p1Pengawas2 || 'Daud Febrizer (TL Teknik ULP Rangkasbitung)',
      progress: 0,
      status: 'Menunggu Persetujuan Asman',
      appliedAt: '02 Jan 2026',
      daftungId: selDf.id,
      reservationStatus: 'Belum Reservasi',
      approverName: 'WEGIG DIDIK KURNIAWAN',
      approverRole: 'ASMAN KONSTRUKSI',
      approverSignature: undefined,
      creatorName: 'HASIAN EFRAVODITUS SITORUS',
      creatorRole: 'TC LOLA KONS',
      creatorSignature: undefined,
      materials: [],
    };
    setSelectedDocWo(previewWo);
  };

  // Buka Modal Persetujuan Asman
  const handleOpenApproval = (wo: WorkOrderRecord) => {
    setApprovalModalWo(wo);
    setAsmanName(wo.approverName || 'WEGIG DIDIK KURNIAWAN');
    setAsmanRole(wo.approverRole || 'ASMAN KONSTRUKSI');
    setAsmanSig(wo.approverSignature || DEFAULT_ASMAN_PARAF);
    setAsmanNote(wo.catatan || 'Disetujui untuk dilaksanakan di lapangan sesuai SPK dan standar KHS 2026.');
    setIsRejectMode(false);
    setRejectionReason('');
  };

  // Asman Menyetujui WO
  const handleConfirmApprove = () => {
    if (!approvalModalWo) return;
    approveWorkOrder(approvalModalWo.id, {
      name: asmanName.trim(),
      role: asmanRole.trim(),
      signature: asmanSig,
      catatan: asmanNote.trim(),
    });
    setApprovalModalWo(null);
  };

  // Asman Menolak / Mengembalikan WO
  const handleConfirmReject = () => {
    if (!approvalModalWo) return;
    if (!rejectionReason.trim()) {
      showToast('Mohon isi alasan penolakan/pengembalian');
      return;
    }
    rejectWorkOrder(approvalModalWo.id, rejectionReason.trim());
    setApprovalModalWo(null);
  };

  const filteredWorkOrders = workOrders.filter((w) => {
    const matchSearch =
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.idpel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.supervisor1 || w.supervisor).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.supervisor2 || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'PENDING' ? w.status === 'Menunggu Persetujuan Asman' : w.category === categoryFilter);

    return matchSearch && matchCategory;
  });

  const paginatedWorkOrders = filteredWorkOrders.slice(
    (woPage - 1) * woPageSize,
    woPage * woPageSize
  );

  const pendingApprovalCount = workOrders.filter((w) => w.status === 'Menunggu Persetujuan Asman').length;
  const currentDaftung = daftungs.find((d) => d.id === selectedDaftungId);

  return (
    <div className="space-y-6">
      {/* Header Bar dengan Tombol Utama + Apply Work Order */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900">Work Order & Penerbitan Dokumen Pelaksanaan</h2>
            {pendingApprovalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{pendingApprovalCount} Menunggu Approval Asman</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola penerbitan Work Order, persetujuan Asman Konstruksi, penugasan vendor dan pengawas lapangan.
          </p>
        </div>

        {/* Tombol Apply WO langsung di Menu Work Order */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenApplyModal()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Apply Work Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. WO, IDPEL, Pelanggan, Vendor, Pengawas..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setWoPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-semibold text-[11px]">Filter:</span>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setWoPage(1);
            }}
            className="p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">Semua ({workOrders.length})</option>
            {pendingApprovalCount > 0 && (
              <option value="PENDING">⏳ Menunggu Approval Asman ({pendingApprovalCount})</option>
            )}
            <option value="WO Paket 1">WO Paket 1</option>
            <option value="WO Paket 2">WO Paket 2</option>
            <option value="WO Tiang">WO Tiang</option>
          </select>
        </div>
      </div>

      {/* Tabel Work Order */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px] tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-4 w-[20%]">No. Work Order</th>
                <th className="py-3 px-4 w-[28%]">Pelanggan & IDPEL</th>
                <th className="py-3 px-4 w-[24%]">Vendor Pelaksana</th>
                <th className="py-3 px-4 w-[20%]">Pengawas Lapangan</th>
                <th className="py-3 px-4 w-[8%] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data Work Order yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                paginatedWorkOrders.map((w) => {
                  const isPending = w.status === 'Menunggu Persetujuan Asman';
                  const isRejected = w.status === 'Dikembalikan' || w.approvalStatus === 'REJECTED';

                  return (
                    <tr 
                      key={w.id} 
                      className={`hover:bg-blue-50/30 transition-colors divide-x divide-slate-200 ${
                        isRejected ? 'bg-rose-50/30' : isPending ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* 1. No. Work Order & Kategori */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-900 text-xs tracking-tight">
                          {w.id}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.category === 'WO Paket 1'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : w.category === 'WO Paket 2'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>
                            {w.category}
                          </span>
                          
                          {/* Badge Status */}
                          {isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                              <span>Dikembalikan Asman</span>
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                              <span>Menunggu Asman</span>
                            </span>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                              w.status === 'Selesai'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {w.status}
                            </span>
                          )}
                        </div>

                        {/* Catatan Alasan jika Ditolak/Dikembalikan */}
                        {isRejected && w.rejectionReason && (
                          <div className="mt-1.5 p-1.5 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-700 leading-tight">
                            <b>Catatan Asman:</b> {w.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* 2. Pelanggan & IDPEL */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">{w.customerName}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          IDPEL: <span className="font-semibold text-slate-700">{w.idpel}</span>
                        </div>
                      </td>

                      {/* 3. Vendor Pelaksana */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-semibold text-slate-800 text-xs">{w.vendor}</div>
                        <div className="mt-1">
                          {isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span>Perlu Revisi</span>
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              <span>Menunggu Approval</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>Disetujui Asman</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Pengawas Lapangan */}
                      <td className="py-3.5 px-4 align-middle text-xs">
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-start gap-1.5 text-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                            <span className="font-semibold leading-tight">{w.supervisor1 || w.supervisor}</span>
                          </div>
                          {w.supervisor2 && (
                            <div className="flex items-start gap-1.5 text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                              <span className="leading-tight">{w.supervisor2}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Aksi */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* JIKA STATUS DIKEMBALIKAN / PERLU REVISI */}
                          {isRejected ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenRevision(w)}
                                className="w-8 h-8 flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer shadow-2xs animate-pulse"
                                title="Perbaiki Data & Ajukan Ulang ke Asman Konstruksi"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedDocWo(w)}
                                className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition cursor-pointer shadow-2xs"
                                title="Lihat Draf Dokumen Work Order"
                              >
                                <Printer className="w-4 h-4 text-blue-600" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin membatalkan/menghapus Work Order ${w.id}?`)) {
                                    deleteWorkOrder(w.id);
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition cursor-pointer shadow-2xs"
                                title="Hapus WO"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenApproval(w)}
                                className="w-8 h-8 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition cursor-pointer shadow-2xs"
                                title="Review & Berikan Persetujuan Asman Konstruksi"
                              >
                                <ClipboardCheck className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedDocWo(w)}
                                className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition cursor-pointer shadow-2xs"
                                title="Lihat Draf Dokumen Work Order"
                              >
                                <Printer className="w-4 h-4 text-blue-600" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin membatalkan/menghapus pengajuan Work Order ${w.id}?`)) {
                                    deleteWorkOrder(w.id);
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition cursor-pointer shadow-2xs"
                                title="Batalkan Pengajuan WO"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* JIKA SUDAH DISETUJUI ASMAN: Tombol Normal */}
                              <button
                                type="button"
                                onClick={() => setSelectedDocWo(w)}
                                className="px-2.5 py-1.5 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition cursor-pointer shadow-2xs font-bold text-xs"
                                title="Cetak Dokumen Resmi Work Order & RAB"
                              >
                                <Printer className="w-4 h-4 text-blue-600" />
                                <span>Dokumen WO</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus Work Order ${w.id}?`)) {
                                    deleteWorkOrder(w.id);
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition cursor-pointer shadow-2xs"
                                title="Hapus Work Order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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
          currentPage={woPage}
          totalItems={filteredWorkOrders.length}
          itemsPerPage={woPageSize}
          onPageChange={setWoPage}
          onItemsPerPageChange={setWoPageSize}
          pageSizeOptions={[5, 10, 25]}
        />
      </div>

      {/* MODAL 1: APPLY WORK ORDER BARU (EXCEL INPUT MATRIX) */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-emerald-400" />
                  <span>Inputan Apply Work Order (WO) & Dokumen Output</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Isi data Vendor Pelaksana, No Work Order, Pengawas 2, dan Pengawas 1 sesuai format standar KHS 2026.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitApplyWo} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* 1. Pilih Data Daftung */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block text-slate-800 font-bold mb-1">
                  Pilih Data Pelanggan dari Daftar Tunggu (Daftung):
                </label>
                <div className="relative">
                  <select
                    value={selectedDaftungId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDaftungId(val);
                      const targetDf = daftungs.find((d) => d.id === val);
                      if (targetDf) {
                        const existingWos = workOrders.filter((w) => w.daftungId === targetDf.id);
                        const existingP1 = existingWos.find((w) => w.category === 'WO Paket 1');
                        const existingP2 = existingWos.find((w) => w.category === 'WO Paket 2');
                        if (existingP1) {
                          setP1Vendor(existingP1.vendor);
                          setP1NoWo(existingP1.id);
                          if (existingP1.supervisor1) setP1Pengawas1(existingP1.supervisor1);
                          if (existingP1.supervisor2) setP1Pengawas2(existingP1.supervisor2);
                        }
                        if (existingP2) {
                          setP2Vendor(existingP2.vendor);
                          setP2NoWo(existingP2.id);
                          if (existingP2.supervisor1) setP2Pengawas1(existingP2.supervisor1);
                          if (existingP2.supervisor2 !== undefined) setP2Pengawas2(existingP2.supervisor2);
                        }
                      }
                    }}
                    className="w-full pl-3 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
                  >
                    <option value="" disabled>-- Pilih Data Daftung --</option>
                    {daftungs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id} • {d.customerName} (IDPEL: {d.idpel}) [{d.status}]
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>

                {currentDaftung && (
                  <div className="mt-2.5 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Nama Pelanggan:</span>
                      <b className="text-slate-900">{currentDaftung.customerName}</b>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">IDPEL:</span>
                      <b className="font-mono text-slate-900">{currentDaftung.idpel}</b>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Sumber Survey:</span>
                      <span className="font-semibold">{currentDaftung.source}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Status Daftung:</span>
                      <span className={`font-semibold ${currentDaftung.status === 'Perlu Revisi' ? 'text-rose-700 font-bold' : 'text-blue-700'}`}>
                        {currentDaftung.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. FORM PENUGASAN APPLY WO: PAKET 1 & PAKET 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CARD PAKET 1 */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">PAKET 1</h4>
                        <p className="text-[10px] text-slate-500">JTM, Gardu Distribusi & SKTM</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      Tegangan Menengah
                    </span>
                  </div>

                  {/* Vendor Pelaksana */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Vendor Pelaksana: <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={p1Vendor}
                        onChange={(e) => setP1Vendor(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
                        required
                      >
                        <option value="" disabled>-- Pilih Vendor Pelaksana --</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.name}>
                            {v.name} {v.jenisPekerjaan ? `(${v.jenisPekerjaan.join(', ')})` : ''}
                          </option>
                        ))}
                        {!vendors.some((v) => v.name === p1Vendor) && p1Vendor && (
                          <option value={p1Vendor}>{p1Vendor}</option>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* No Work Order */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Nomor Work Order (WO): <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={p1NoWo}
                        onChange={(e) => setP1NoWo(e.target.value)}
                        placeholder="Contoh: 537.10.WO.2026"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Pengawas 2 */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Pengawas 2 (TL Teknik ULP):
                    </label>
                    <div className="relative">
                      <HardHat className="w-4 h-4 text-amber-500 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={p1Pengawas2}
                        onChange={(e) => setP1Pengawas2(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
                      >
                        <option value="">— (Kosong / Tanpa Pengawas 2)</option>
                        {supervisors.map((s) => {
                          const val = `${s.name} (${s.role})`;
                          return (
                            <option key={s.id} value={val}>
                              {val} - {s.unit}
                            </option>
                          );
                        })}
                        {!supervisors.some((s) => `${s.name} (${s.role})` === p1Pengawas2) && p1Pengawas2 && (
                          <option value={p1Pengawas2}>{p1Pengawas2}</option>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Pengawas 1 */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Pengawas 1 (TC Lola / Kinerja UP3): <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-blue-600 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={p1Pengawas1}
                        onChange={(e) => setP1Pengawas1(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
                        required
                      >
                        <option value="" disabled>-- Pilih Pengawas 1 (UP3) --</option>
                        {supervisors.map((s) => {
                          const val = `${s.name} (${s.role})`;
                          return (
                            <option key={s.id} value={val}>
                              {val} - {s.unit}
                            </option>
                          );
                        })}
                        {!supervisors.some((s) => `${s.name} (${s.role})` === p1Pengawas1) && p1Pengawas1 && (
                          <option value={p1Pengawas1}>{p1Pengawas1}</option>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* CARD PAKET 2 */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">PAKET 2</h4>
                        <p className="text-[10px] text-slate-500">JTR & Sambungan Rumah (SR)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      Tegangan Rendah
                    </span>
                  </div>

                  {/* Vendor Pelaksana */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Vendor Pelaksana: <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={p2Vendor}
                        onChange={(e) => setP2Vendor(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer appearance-none"
                        required
                      >
                        <option value="" disabled>-- Pilih Vendor Pelaksana --</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.name}>
                            {v.name} {v.jenisPekerjaan ? `(${v.jenisPekerjaan.join(', ')})` : ''}
                          </option>
                        ))}
                        {!vendors.some((v) => v.name === p2Vendor) && p2Vendor && (
                          <option value={p2Vendor}>{p2Vendor}</option>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* No Work Order */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Nomor Work Order (WO): <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={p2NoWo}
                        onChange={(e) => setP2NoWo(e.target.value)}
                        placeholder="Contoh: 538.10.WO.2026"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Pengawas 2 */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Pengawas 2 (TL Teknik ULP):
                    </label>
                    <div className="relative">
                      <HardHat className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={p2Pengawas2}
                        onChange={(e) => setP2Pengawas2(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer appearance-none"
                      >
                        <option value="">— (Kosong / Tanpa Pengawas 2)</option>
                        {supervisors.map((s) => {
                          const val = `${s.name} (${s.role})`;
                          return (
                            <option key={s.id} value={val}>
                              {val} - {s.unit}
                            </option>
                          );
                        })}
                        {!supervisors.some((s) => `${s.name} (${s.role})` === p2Pengawas2) && p2Pengawas2 && (
                          <option value={p2Pengawas2}>{p2Pengawas2}</option>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Pengawas 1 */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Pengawas 1 (TC Lola / Kinerja UP3): <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-purple-600 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={p2Pengawas1}
                        onChange={(e) => setP2Pengawas1(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer appearance-none"
                        required
                      >
                        <option value="" disabled>-- Pilih Pengawas 1 (UP3) --</option>
                        {supervisors.map((s) => {
                          const val = `${s.name} (${s.role})`;
                          return (
                            <option key={s.id} value={val}>
                              {val} - {s.unit}
                            </option>
                          );
                        })}
                        {!supervisors.some((s) => `${s.name} (${s.role})` === p2Pengawas1) && p2Pengawas1 && (
                          <option value={p2Pengawas1}>{p2Pengawas1}</option>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handlePreviewOutput}
                  className="w-full sm:w-auto px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Lihat Pratinjau Dokumen Output Work Order"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Pratinjau Dokumen WO (Output)</span>
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-white ${
                      currentDaftung?.status === 'Perlu Revisi'
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    }`}
                  >
                    <span>
                      {currentDaftung?.status === 'Perlu Revisi' ? 'Ajukan Ulang & Buka Dokumen WO' : 'Apply WO & Buka Dokumen Output'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PERSETUJUAN ASMAN KONSTRUKSI (ASMAN APPROVAL MODAL) */}
      {approvalModalWo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">Persetujuan Asman Konstruksi</h3>
                  <p className="text-[11px] text-slate-300">
                    Verifikasi teknis & bubuhkan tanda tangan digital Asman untuk menerbitkan Work Order resmi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalWo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Ringkasan WO */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Nomor Work Order</span>
                    <b className="text-sm font-black text-slate-900">{approvalModalWo.id}</b>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {approvalModalWo.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 block">Pelanggan:</span>
                    <b className="text-slate-900">{approvalModalWo.customerName}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">IDPEL:</span>
                    <b className="font-mono text-slate-900">{approvalModalWo.idpel}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Vendor Pelaksana:</span>
                    <b className="text-slate-900">{approvalModalWo.vendor}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Pengawas TC Lola:</span>
                    <b className="text-slate-900">{approvalModalWo.supervisor1 || approvalModalWo.supervisor}</b>
                  </div>
                </div>
              </div>

              {/* Rincian Material yang Diajukan */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                  <span>Alokasi Material yang Diajukan ({approvalModalWo.materials.length} Item):</span>
                  <span className="text-[11px] text-slate-500 font-normal">Sesuai Kebutuhan Lapangan</span>
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2 px-3">Uraian Material</th>
                        <th className="p-2 text-center w-20">Volume</th>
                        <th className="p-2 text-center w-20">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvalModalWo.materials.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 px-3 font-semibold text-slate-800">{m.material}</td>
                          <td className="p-2 text-center font-bold text-blue-700 tabular-nums">{m.qtyAllocated}</td>
                          <td className="p-2 text-center text-slate-500">{m.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Box Tanda Tangan & Pejabat Asman */}
              <div className="border-2 border-dashed border-amber-300 bg-amber-50/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                    <PenTool className="w-4 h-4 text-amber-700" />
                    <span>Tanda Tangan Persetujuan Asman Konstruksi</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSigPadConfig({
                        isOpen: true,
                        title: 'Tanda Tangan Digital Asman Konstruksi',
                        initialName: asmanName,
                        initialRole: asmanRole,
                        initialSig: asmanSig,
                      })
                    }
                    className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ubah / Tanda Tangan</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-amber-200">
                  <div className="w-36 h-20 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden p-1">
                    {asmanSig ? (
                      <img src={asmanSig} alt="Paraf Asman" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Belum ada tanda tangan</span>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="font-black text-slate-900 text-xs tracking-tight uppercase underline">
                      {asmanName}
                    </div>
                    <div className="text-[11px] font-bold text-slate-600 uppercase">
                      {asmanRole}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Siap diterbitkan & ditandatangani</span>
                    </div>
                  </div>
                </div>

                {/* Catatan Persetujuan */}
                <div>
                  <label className="block text-[11px] text-slate-700 font-bold mb-1">Catatan Asman Konstruksi:</label>
                  <input
                    type="text"
                    value={asmanNote}
                    onChange={(e) => setAsmanNote(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    placeholder="Contoh: Disetujui untuk dilaksanakan di lapangan sesuai SPK."
                  />
                </div>
              </div>

              {/* Mode Tolak / Kembalikan jika Asman ingin menolak */}
              {isRejectMode && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <label className="block text-rose-900 font-bold text-[11px]">
                    Alasan Penolakan / Pengembalian ke Draf:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Contoh: Periksa kembali alokasi kabel dan jadwal pelaksanaan vendor..."
                    className="w-full p-2 border border-rose-300 rounded-lg text-xs bg-white text-slate-800"
                    required
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRejectMode(false)}
                      className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold"
                    >
                      Batal Tolak
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReject}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                    >
                      Konfirmasi Tolak WO
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {!isRejectMode ? (
                <button
                  type="button"
                  onClick={() => setIsRejectMode(true)}
                  className="px-3.5 py-2 text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tolak / Kembalikan
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalModalWo(null)}
                  className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui & Terbitkan Work Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DOKUMEN RESMI WORK ORDER & RAB */}
      {selectedDocWo && (
        <RabDocumentModal
          isOpen={Boolean(selectedDocWo)}
          onClose={() => setSelectedDocWo(null)}
          woData={selectedDocWo}
          initialPaket={selectedDocWo.category === 'WO Paket 1' ? 'paket1' : 'paket2'}
          mode="wo"
        />
      )}

      {/* MODAL 6: TANDA TANGAN DIGITAL ASMAN */}
      <SignaturePadModal
        isOpen={sigPadConfig.isOpen}
        onClose={() => setSigPadConfig((prev) => ({ ...prev, isOpen: false }))}
        title={sigPadConfig.title}
        signerType="approver"
        initialName={sigPadConfig.initialName}
        initialRole={sigPadConfig.initialRole}
        initialSignature={sigPadConfig.initialSig}
        onSave={(dataUrl, newName, newRole) => {
          setAsmanName(newName);
          setAsmanRole(newRole);
          setAsmanSig(dataUrl);
          setSigPadConfig((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};
