'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePromotorStore, deriveVendorOptions } from '@/store/usePromotorStore';
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
  ChevronDown,
  Phone,
  UserCheck
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { RabDocumentModal } from '@/components/RabDocumentModal';
import { SignaturePadModal } from '@/components/SignaturePadModal';
import { calculateRabFromSurvey } from '@/data/rabMasterData';

const DEFAULT_ASMAN_PARAF = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCI+PHBhdGggZD0iTSAzNSw0NSBDIDQ1LDgwIDU1LDg1IDYyLDM1IEMgNzAsNzUgODAsODAgODgsMzAgQyA5NSw0NSAxMTAsMjUgMTI1LDUwIEMgMTM1LDY4IDEyMCw4NSA5NSw4MCBNIDQ1LDkwIEwgMTQwLDg4IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDMzNjYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
const DEFAULT_HASIAN_PARAF = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCI+PHBhdGggZD0iTSA0MCw3MCBDIDUwLDUwIDcwLDI1IDc4LDEyIEMgODIsNSA3NSw4IDcwLDIyIEMgNjIsNDggNTUsODAgNDgsMTEyIE0gNTIsNzIgQyA2MCw0OCA3Miw0MCA4Miw0MiBDIDkwLDQ0IDg4LDYyIDg5LDc2IEMgOTIsMjggMTAyLDIwIDEwOCwzMCBDIDExMiwzOCAxMTAsNjggMTEyLDgwIEMgMTE2LDQ4IDEyNiw0NSAxMzIsNTYgQyAxMzYsNjYgMTM4LDgyIDE0NCwxMDIgTSA2Miw1OCBMIDEzMCw1NiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAzMzY2IiBzdHJva2Utd2lkdGg9IjIuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';

const parseSupervisor = (s?: string) => {
  if (!s || s === '—' || s === '-') return { name: '—', role: '' };
  const parts = s.split('(');
  const name = parts[0].trim();
  const role = parts.length > 1 ? parts[1].replace(')', '').trim() : '';
  return { name, role };
};

export const WorkOrderView: React.FC = () => {
  const { 
    workOrders, 
    daftungs, 
    surveys,
    vendors, 
    contracts, 
    supervisors,
    customKhsPrices,
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

  // Sumber tunggal daftar rekanan: seed master + vendor yang lahir dari Master
  // Kontrak (SPK), sehingga vendor baru cukup dibuat di menu Kontrak.
  const vendorOptions = useMemo(
    () =>
      deriveVendorOptions(
        vendors,
        contracts.map((c) => ({ vendorName: c.vendorName, jenisPekerjaan: c.jenisPekerjaan }))
      ),
    [vendors, contracts]
  );

  const [selectedDocWo, setSelectedDocWo] = useState<WorkOrderRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('BELUM_DISETUJUI');
  const [woPage, setWoPage] = useState(1);
  const [woPageSize, setWoPageSize] = useState(5);

  // State Modal Apply WO Baru di Menu Work Order
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedDaftungId, setSelectedDaftungId] = useState('');

  // Aturan Penomoran WO: [NO URUT].[BULAN].WO.[P1/P2/TB].[TAHUN]
  const [woNoUrut, setWoNoUrut] = useState('001');
  const [woBulan, setWoBulan] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [woTahun, setWoTahun] = useState(String(new Date().getFullYear()));

  // Helper penomoran standar WO
  const formatWoNumber = (noUrutStr: string, bulanStr: string, kode: 'P1' | 'P2' | 'TB', tahunStr: string) => {
    const u = noUrutStr ? String(noUrutStr).trim().padStart(3, '0') : '001';
    const b = bulanStr ? String(bulanStr).trim().padStart(2, '0') : '11';
    const y = tahunStr ? String(tahunStr).trim() : '2026';
    return `${u}.${b}.WO.${kode}.${y}`;
  };

  // State Paket 1 (P1)
  const [p1Enabled, setP1Enabled] = useState(true);
  const [p1ContractId, setP1ContractId] = useState('');
  const [p1Vendor, setP1Vendor] = useState('PT. HILMAN PRIMA PERKASA');
  const [p1NoWo, setP1NoWo] = useState('001.11.WO.P1.2026');
  const [p1Pengawas1, setP1Pengawas1] = useState('Hasian Sitorus (TC Lola Konstruksi)');
  const [p1Pengawas2, setP1Pengawas2] = useState('Daud Febrizer (TL Teknik ULP Rangkasbitung)');

  // State Paket 2 (P2)
  const [p2Enabled, setP2Enabled] = useState(true);
  const [p2ContractId, setP2ContractId] = useState('');
  const [p2Vendor, setP2Vendor] = useState('PT. TAWAKAL KARYA TEKNIK');
  const [p2NoWo, setP2NoWo] = useState('002.11.WO.P2.2026');
  const [p2Pengawas1, setP2Pengawas1] = useState('Winnetou Chandra Sadli (Officer Kinerja Konstruksi)');
  const [p2Pengawas2, setP2Pengawas2] = useState('');

  // State WO Tiang (TB)
  const [tbEnabled, setTbEnabled] = useState(true);
  const [tbContractId, setTbContractId] = useState('');
  const [tbVendor, setTbVendor] = useState('PT. ENERGI BANTEN SEJAHTERA');
  const [tbNarahubung, setTbNarahubung] = useState('Ir. Dedi Mulyadi / Koordinator');
  const [tbPhone, setTbPhone] = useState('0812-3456-7890');
  const [tbNoWo, setTbNoWo] = useState('003.11.WO.TB.2026');
  const [tbPengawas1, setTbPengawas1] = useState('Hasian Sitorus (TC Lola Konstruksi)');
  const [tbPengawas2, setTbPengawas2] = useState('');

  // Handler auto-generate penomoran serentak
  const handleRegenerateWoNumbers = (urut: string, bln: string, thn: string) => {
    setWoNoUrut(urut);
    setWoBulan(bln);
    setWoTahun(thn);
    const base = parseInt(urut, 10);
    if (!isNaN(base)) {
      setP1NoWo(formatWoNumber(String(base), bln, 'P1', thn));
      setP2NoWo(formatWoNumber(String(base + 1), bln, 'P2', thn));
      setTbNoWo(formatWoNumber(String(base + 2), bln, 'TB', thn));
    } else {
      setP1NoWo(formatWoNumber(urut, bln, 'P1', thn));
      setP2NoWo(formatWoNumber(urut, bln, 'P2', thn));
      setTbNoWo(formatWoNumber(urut, bln, 'TB', thn));
    }
  };

  // Handler perubahan vendor WO Tiang (otomatis isi Narahubung & Telepon)
  const handleTbVendorChange = (vName: string) => {
    setTbVendor(vName);
    const matched = vendors.find((v) => v.name === vName);
    if (matched) {
      if (matched.director) setTbNarahubung(matched.director);
      if (matched.phone) setTbPhone(matched.phone);
    }
    const matchedContract = contracts.find((c) => c.vendorName === vName && c.jenisPekerjaan === 'Tiang');
    if (matchedContract) {
      setTbContractId(matchedContract.id);
    }
  };

  // State ketersediaan paket dan tiang berdasarkan data survey kandidat yang dipilih
  const [candidateHasP1, setCandidateHasP1] = useState(true);
  const [candidateHasP2, setCandidateHasP2] = useState(true);
  const [candidateHasTiang, setCandidateHasTiang] = useState(true);

  // Helper untuk mendeteksi paket & tiang dari kandidat pelanggan
  const detectCandidatePackages = (candidateId: string) => {
    const s = surveys.find((item) => item.id === candidateId || item.idpel === candidateId) ||
              surveys.find((item) => {
                const cand = allApplyCandidates.find((c) => c.id === candidateId);
                return cand && (item.id === cand.id || (cand.idpel && item.idpel === cand.idpel));
              });

    if (!s) {
      return { hasP1: true, hasP2: true, hasTiang: true };
    }

    // 1. Cek Paket 1 (JTM / Gardu)
    const hasJtmPoles = (s.poles || []).some(
      (p) => p.networkType === 'JTM' || p.networkType === 'SUTM' || (p.id || '').startsWith('TM') || (p.tmConstruction || '').includes('GARDU')
    );
    const p1Rab = calculateRabFromSurvey(s, 'paket1', customKhsPrices);
    const hasP1Items = p1Rab.some((it) => !it.isHeader && (it.rencanaVol > 0 || it.realisasiVol > 0));
    const hasP1 = hasJtmPoles || hasP1Items;

    // 2. Cek Paket 2 (JTR / Sambungan Rumah)
    const hasJtrPoles = (s.poles || []).some(
      (p) => p.networkType === 'JTR' || p.networkType === 'SUTR' || (p.id || '').startsWith('TR') || Boolean(p.trConstruction)
    );
    const p2Rab = calculateRabFromSurvey(s, 'paket2', customKhsPrices);
    const hasP2Items = p2Rab.some((it) => !it.isHeader && (it.rencanaVol > 0 || it.realisasiVol > 0));
    const hasP2 = hasJtrPoles || hasP2Items;

    // 3. Aturan WO Tiang: Harus ada Material Tiang Rencana Baru (bukan existing)
    // Cek di data tiang lapangan: apakah ada tiang yang statusnya bukan EXISTING dan bukan 'Tanpa Tiang'
    const hasNewPoles = (s.poles || []).some(
      (p) => p.poleStatus !== 'EXISTING' && p.poleType !== 'Tanpa Tiang' && !p.poleType?.startsWith('Terusan')
    );
    // Cek juga di kalkulasi RAB apakah ada volume tiang beton > 0
    const allActiveItems = [...p1Rab, ...p2Rab].filter((it) => !it.isHeader && it.rencanaVol > 0);
    const hasTiangInRab = allActiveItems.some(
      (it) => it.desc.toLowerCase().includes('tiang beton') || it.desc.toLowerCase().includes('tiang besi') || (it.subSection || '').toLowerCase().includes('tiang')
    );
    const hasTiang = hasNewPoles || hasTiangInRab;

    return { hasP1, hasP2, hasTiang };
  };

  // State Pembuat WO (Admin WO / Penanggung Jawab Konsep)
  const [creatorName, setCreatorName] = useState('HASIAN EFRAVODITUS SITORUS');
  const [creatorRole, setCreatorRole] = useState('TC LOLA KONS');
  const [creatorSig, setCreatorSig] = useState<string>(DEFAULT_HASIAN_PARAF);
  const [isCreatorSignPadOpen, setIsCreatorSignPadOpen] = useState(false);

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

  // Kumpulan kandidat permohonan yang siap dibuatkan WO (dari Potensi Daftung & Daftung)
  const allApplyCandidates = [
    ...surveys
      .filter((s) => s.status === 'Siap Apply WO' || s.paymentStatus === 'Sudah Bayar' || s.status === 'Terverifikasi')
      .map((s) => ({
        id: s.id,
        customerName: s.customerName,
        idpel: s.idpel || '',
        status: s.status,
        source: 'Potensi Daftung',
      })),
    ...daftungs.map((d) => ({
      id: d.id,
      customerName: d.customerName,
      idpel: d.idpel,
      status: d.status,
      source: d.source || 'Daftung',
    })),
  ];

  // Buka Modal Apply WO
  const handleOpenApplyModal = (preselectedDfId?: string) => {
    const targetCandidate = preselectedDfId 
      ? allApplyCandidates.find((c) => c.id === preselectedDfId) 
      : allApplyCandidates.find((c) => c.status === 'Siap Apply WO' || c.status === 'Siap Apply' || c.status === 'Perlu Revisi') || allApplyCandidates[0];
    
    if (targetCandidate) {
      setSelectedDaftungId(targetCandidate.id);
    } else {
      setSelectedDaftungId('');
    }

    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentYear = String(new Date().getFullYear());
    const seqNum = workOrders.length + 1;
    const u1 = String(seqNum).padStart(3, '0');
    const u2 = String(seqNum + 1).padStart(3, '0');
    const u3 = String(seqNum + 2).padStart(3, '0');

    setWoNoUrut(u1);
    setWoBulan(currentMonth);
    setWoTahun(currentYear);

    const activeP1 = contracts.filter((c) => c.jenisPekerjaan === 'Paket 1' && c.status === 'AKTIF');
    const activeP2 = contracts.filter((c) => c.jenisPekerjaan === 'Paket 2' && c.status === 'AKTIF');
    const activeTb = contracts.filter((c) => c.jenisPekerjaan === 'Tiang' && c.status === 'AKTIF');

    // Cek apakah ada WO lama yang pernah dibuat untuk kandidat ini (misal yang dikembalikan)
    const existingWos = targetCandidate 
      ? workOrders.filter((w) => w.daftungId === targetCandidate.id || w.idpel === targetCandidate.idpel) 
      : [];
    const existingP1 = existingWos.find((w) => w.category === 'WO Paket 1');
    const existingP2 = existingWos.find((w) => w.category === 'WO Paket 2');
    const existingTb = existingWos.find((w) => w.category === 'WO Tiang');

    // Evaluasi aturan paket yang diinput di survey & tiang baru
    const { hasP1, hasP2, hasTiang } = targetCandidate 
      ? detectCandidatePackages(targetCandidate.id)
      : { hasP1: true, hasP2: true, hasTiang: true };

    setCandidateHasP1(hasP1);
    setCandidateHasP2(hasP2);
    setCandidateHasTiang(hasTiang);

    setP1Enabled(hasP1);
    setP1ContractId(existingP1?.contractId || activeP1[0]?.id || '');
    setP1Vendor(existingP1?.vendor || activeP1[0]?.vendorName || 'PT. HILMAN PRIMA PERKASA');
    setP1NoWo(existingP1?.id || formatWoNumber(u1, currentMonth, 'P1', currentYear));
    setP1Pengawas1(existingP1?.supervisor1 || 'Hasian Sitorus (TC Lola Konstruksi)');
    setP1Pengawas2(existingP1?.supervisor2 || 'Daud Febrizer (TL Teknik ULP Rangkasbitung)');

    setP2Enabled(hasP2);
    setP2ContractId(existingP2?.contractId || activeP2[0]?.id || '');
    setP2Vendor(existingP2?.vendor || activeP2[0]?.vendorName || 'PT. TAWAKAL KARYA TEKNIK');
    setP2NoWo(existingP2?.id || formatWoNumber(u2, currentMonth, 'P2', currentYear));
    setP2Pengawas1(existingP2?.supervisor1 || 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)');
    setP2Pengawas2(existingP2?.supervisor2 || '');

    const defaultTbVendor = activeTb[0]?.vendorName || 'PT. ENERGI BANTEN SEJAHTERA';
    const matchedTbVendor = vendors.find((v) => v.name === defaultTbVendor);

    // WO Tiang hanya diaktifkan jika terdapat Material Tiang Rencana Baru
    setTbEnabled(hasTiang);
    setTbContractId(existingTb?.contractId || activeTb[0]?.id || '');
    setTbVendor(existingTb?.vendor || defaultTbVendor);
    setTbNarahubung(existingTb?.narahubung || matchedTbVendor?.director || 'Ir. Dedi Mulyadi / Koordinator');
    setTbPhone(existingTb?.phone || matchedTbVendor?.phone || '0812-3456-7890');
    setTbNoWo(existingTb?.id || formatWoNumber(u3, currentMonth, 'TB', currentYear));
    setTbPengawas1(existingTb?.supervisor1 || 'Hasian Sitorus (TC Lola Konstruksi)');
    setTbPengawas2(existingTb?.supervisor2 || '');

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
    const selCandidate = allApplyCandidates.find((d) => d.id === selectedDaftungId);
    if (!selCandidate) {
      showToast('Pilih data Pelanggan terlebih dahulu');
      return;
    }
    if (!p1Enabled && !p2Enabled && !tbEnabled) {
      showToast('Pilih minimal satu paket (Paket 1, Paket 2, atau WO Tiang)');
      return;
    }

    const selP1 = contracts.find((c) => c.id === p1ContractId);
    const selP2 = contracts.find((c) => c.id === p2ContractId);
    const selTb = contracts.find((c) => c.id === tbContractId) || contracts.find((c) => c.jenisPekerjaan === 'Tiang');

    createWorkOrdersFromDaftung(selCandidate.id, selCandidate.idpel, selCandidate.customerName, {
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
      woTiang: {
        enabled: tbEnabled,
        vendor: tbVendor.trim(),
        contractId: tbContractId,
        noSpk: selTb ? selTb.spkNumber : '0023.PJ/DAN.02.03/UP3-BTS/2026',
        validFrom: selTb ? selTb.validFrom : '02 Jan 2026',
        validTo: selTb ? selTb.validTo : '31 Des 2026',
        noWorkOrder: tbNoWo.trim(),
        pengawas1: tbPengawas1.trim(),
        pengawas2: tbPengawas2.trim(),
        narahubung: tbNarahubung.trim(),
        phone: tbPhone.trim(),
      },
      signatures: {
        approverName: 'WEGIG DIDIK KURNIAWAN',
        approverRole: 'ASMAN KONSTRUKSI',
        approverSignature: undefined,
        creatorName: creatorName.trim(),
        creatorRole: creatorRole.trim(),
        creatorSignature: creatorSig || undefined,
        catatan: '*) Mulai kegiatan disesuaikan dengan kesiapan sarana pendukung (Tiang Beton, Gardu Distribusi dll)',
      },
    });

    setIsApplyModalOpen(false);

    // Langsung buka Dokumen WO Output hasil Apply WO
    const latestWos = usePromotorStore.getState().workOrders;
    const targetCreatedWo = latestWos.find((w) => w.daftungId === selCandidate.id || w.idpel === selCandidate.idpel);
    if (targetCreatedWo) {
      setSelectedDocWo(targetCreatedWo);
    }
    showToast(`✓ Berhasil Apply WO untuk ${selCandidate.customerName}. Dokumen WO ditampilkan.`);
  };

  // Preview Dokumen WO Output
  const handlePreviewOutput = () => {
    const selCandidate = allApplyCandidates.find((d) => d.id === selectedDaftungId) || allApplyCandidates[0];
    if (!selCandidate) {
      showToast('Pilih data Pelanggan terlebih dahulu');
      return;
    }

    // Gunakan paket aktif yang dicentang (utamakan Paket 1 jika aktif, atau Paket 2, atau WO Tiang)
    const isP1 = p1Enabled;
    const isP2 = !p1Enabled && p2Enabled;
    const isTb = !p1Enabled && !p2Enabled && tbEnabled;

    const previewCategory = isP1 ? 'WO Paket 1' : isP2 ? 'WO Paket 2' : 'WO Tiang';
    const previewNoWo = isP1 ? p1NoWo : isP2 ? p2NoWo : tbNoWo;
    const previewVendor = isP1 ? p1Vendor : isP2 ? p2Vendor : tbVendor;
    const previewPengawas1 = isP1 ? p1Pengawas1 : isP2 ? p2Pengawas1 : tbPengawas1;
    const previewPengawas2 = isP1 ? p1Pengawas2 : isP2 ? p2Pengawas2 : tbPengawas2;

    const previewWo: WorkOrderRecord = {
      id: previewNoWo || '537.10.WO.2026',
      noWorkOrder: previewNoWo || '537.10.WO.2026',
      customerName: selCandidate.customerName,
      idpel: selCandidate.idpel,
      category: previewCategory,
      vendor: previewVendor || 'PT. HILMAN PRIMA PERKASA',
      spkNumber: isP1 ? '0021.PJ/DAN.02.03/UP3-BTS/2026' : isP2 ? '0022.PJ/DAN.02.03/UP3-BTS/2026' : '0023.PJ/DAN.02.03/UP3-BTS/2026',
      validFrom: '02 Jan 2026',
      validTo: '31 Des 2026',
      supervisor: previewPengawas1 || 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor1: previewPengawas1 || 'Hasian Sitorus (TC Lola Konstruksi)',
      supervisor2: previewPengawas2 || '',
      progress: 0,
      status: 'Menunggu Persetujuan Asman',
      appliedAt: '02 Jan 2026',
      daftungId: selCandidate.id,
      reservationStatus: 'Belum Reservasi',
      approverName: 'WEGIG DIDIK KURNIAWAN',
      approverRole: 'ASMAN KONSTRUKSI',
      approverSignature: undefined,
      creatorName: creatorName.trim(),
      creatorRole: creatorRole.trim(),
      creatorSignature: creatorSig || undefined,
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

    const isPendingOrRejected = w.status === 'Menunggu Persetujuan Asman' || w.status === 'Dikembalikan' || w.approvalStatus === 'PENDING' || w.approvalStatus === 'REJECTED';

    const matchCategory =
      categoryFilter === 'BELUM_DISETUJUI' ? isPendingOrRejected :
      categoryFilter === 'ALL' ? true :
      categoryFilter === 'PENDING' ? (w.status === 'Menunggu Persetujuan Asman' || w.approvalStatus === 'PENDING') :
      categoryFilter === 'APPROVED' ? (w.approvalStatus === 'APPROVED' || w.status === 'Konstruksi' || w.status === 'Selesai') :
      w.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  const paginatedWorkOrders = filteredWorkOrders.slice(
    (woPage - 1) * woPageSize,
    woPage * woPageSize
  );

  const pendingApprovalCount = workOrders.filter((w) => w.status === 'Menunggu Persetujuan Asman').length;
  const currentDaftung = allApplyCandidates.find((d) => d.id === selectedDaftungId);

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
            <option value="BELUM_DISETUJUI">⚡ Belum Disetujui Asman ({workOrders.filter(w => w.status === 'Menunggu Persetujuan Asman' || w.status === 'Dikembalikan' || w.approvalStatus === 'PENDING' || w.approvalStatus === 'REJECTED').length})</option>
            <option value="APPROVED">✓ Sudah Disetujui Asman (Pindah ke Daftung) ({workOrders.filter(w => w.approvalStatus === 'APPROVED' || w.status === 'Konstruksi' || w.status === 'Selesai').length})</option>
            <option value="ALL">Semua WO ({workOrders.length})</option>
            <option value="WO Paket 1">WO Paket 1</option>
            <option value="WO Paket 2">WO Paket 2</option>
            <option value="WO Tiang">WO Tiang</option>
          </select>
        </div>
      </div>

      {/* Tabel Work Order */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px] tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-3.5 whitespace-nowrap">NO. WO</th>
                <th className="py-3 px-3.5 whitespace-nowrap">DAFTUNG</th>
                <th className="py-3 px-4 min-w-[170px]">PELANGGAN</th>
                <th className="py-3 px-3.5 min-w-[140px]">IDPEL</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">PAKET</th>
                <th className="py-3 px-3.5 min-w-[150px]">VENDOR</th>
                <th className="py-3 px-3.5 min-w-[150px]">PENGAWAS</th>
                <th className="py-3 px-3 text-center whitespace-nowrap min-w-[110px]">PROGRESS MATERIAL</th>
                <th className="py-3 px-3 text-center whitespace-nowrap min-w-[110px]">PROGRESS JASA</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">STATUS</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    {categoryFilter === 'BELUM_DISETUJUI' ? (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Check className="w-8 h-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-full" />
                        <span className="font-bold text-slate-700 text-sm">Semua Work Order Sudah Disetujui Asman</span>
                        <span className="text-slate-400 text-xs">Data WO yang sudah disetujui otomatis pindah ke menu <b>Daftung</b> untuk eksekusi lapangan.</span>
                      </div>
                    ) : (
                      'Tidak ada data Work Order yang sesuai dengan pencarian atau filter.'
                    )}
                  </td>
                </tr>
              ) : (
                paginatedWorkOrders.map((w) => {
                  const isPending = w.status === 'Menunggu Persetujuan Asman';
                  const isRejected = w.status === 'Dikembalikan' || w.approvalStatus === 'REJECTED';
                  const isCompleted = w.progress === 100 || w.status === 'Selesai';

                  const mats = w.materials || [];
                  const hasRemainingToTake = mats.some((m) => {
                    if (m.isHold) return true;
                    const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
                    return (m.qtyTaken || 0) < req;
                  });
                  const isAllMatTaken = mats.length > 0 && !hasRemainingToTake && !mats.some((m) => m.isHold);
                  const calculatedMatProg = mats.length > 0
                    ? Math.round((mats.reduce((sum, m) => {
                        if (m.isHold) return sum;
                        const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
                        const taken = m.qtyTaken || 0;
                        return sum + (req > 0 ? Math.min(1, taken / req) : 0);
                      }, 0) / mats.length) * 100)
                    : 0;

                  const progMat = isAllMatTaken 
                    ? 100 
                    : Math.min(99, w.progressMaterial !== undefined && w.progressMaterial < 100 ? w.progressMaterial : calculatedMatProg);
                  const progJas = w.progressJasa !== undefined ? w.progressJasa : (isCompleted ? 100 : w.progress || 0);

                  return (
                    <tr 
                      key={w.id} 
                      className={`hover:bg-blue-50/30 transition-colors divide-x divide-slate-200 ${
                        isRejected ? 'bg-rose-50/30' : isPending ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* 1. NO. WO */}
                      <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                        <span className="font-bold font-mono text-slate-900 text-xs">
                          {w.id}
                        </span>
                      </td>

                      {/* 2. DAFTUNG */}
                      <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                        <span className="font-semibold text-slate-700 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {w.daftungId || '-'}
                        </span>
                      </td>

                      {/* 3. PELANGGAN */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                          {w.customerName}
                        </div>
                      </td>

                      {/* 3b. IDPEL */}
                      <td className="py-3.5 px-3.5 align-middle">
                        <div className="text-[10.5px] font-mono text-slate-600">
                          <span className="text-slate-400 font-sans">IDPEL:</span>{' '}
                          <span className="font-semibold text-slate-800">{w.idpel || '—'}</span>
                        </div>
                      </td>

                      {/* 4. PAKET */}
                      <td className="py-3.5 px-3 align-middle text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold ${
                          w.category === 'WO Paket 1'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : w.category === 'WO Paket 2'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : w.category === 'WO Tiang'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}>
                          {w.category === 'WO Paket 1' ? 'Paket 1 (JTM)' : w.category === 'WO Paket 2' ? 'Paket 2 (JTR)' : w.category === 'WO Tiang' ? 'WO Tiang (TB)' : w.category}
                        </span>
                      </td>

                      {/* 5. VENDOR */}
                      <td className="py-3.5 px-3.5 align-middle">
                        <div className="font-semibold text-slate-800 text-xs leading-snug">
                          {w.vendor}
                        </div>
                        {w.spkNumber && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 line-clamp-1" title={w.spkNumber}>
                            SPK: {w.spkNumber}
                          </div>
                        )}
                        {w.narahubung && (
                          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                            <span className="text-slate-400 font-normal">PIC:</span> {w.narahubung}
                          </div>
                        )}
                        {w.phone && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <span className="text-slate-400">Tel:</span> {w.phone}
                          </div>
                        )}
                      </td>

                      {/* 6. PENGAWAS */}
                      <td className="py-3.5 px-3.5 align-middle text-xs">
                        {(() => {
                          const s1 = parseSupervisor(w.supervisor1 || w.supervisor);
                          const s2raw = w.supervisor2;
                          const s2 = parseSupervisor(s2raw);
                          return (
                            <div className="flex flex-col gap-1.5 py-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">P1</span>
                                <div className="min-w-0 flex items-baseline gap-1 truncate">
                                  <span className="font-bold text-slate-800 text-[11px] truncate">{s1.name}</span>
                                  {s1.role && <span className="text-[9.5px] text-slate-500 font-medium truncate shrink-0">({s1.role})</span>}
                                </div>
                              </div>
                              {s2raw && (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">P2</span>
                                  <div className="min-w-0 flex items-baseline gap-1 truncate">
                                    <span className="font-semibold text-slate-700 text-[10.5px] truncate">{s2.name}</span>
                                    {s2.role && <span className="text-[9.5px] text-slate-500 font-normal truncate shrink-0">({s2.role})</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 7. PROGRESS MATERIAL */}
                      <td className="py-3.5 px-3 align-middle text-center">
                        <div className="inline-flex flex-col items-center gap-1 w-20">
                          <span className="text-[11px] font-bold text-slate-800 tabular-nums">
                            {progMat}%
                          </span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                progMat === 100 ? 'bg-emerald-500' : progMat > 0 ? 'bg-amber-500' : 'bg-slate-300'
                              }`}
                              style={{ width: `${progMat}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 8. PROGRESS JASA */}
                      <td className="py-3.5 px-3 align-middle text-center">
                        <div className="inline-flex flex-col items-center gap-1 w-20">
                          <span className="text-[11px] font-bold text-slate-800 tabular-nums">
                            {progJas}%
                          </span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                progJas === 100 ? 'bg-emerald-500' : progJas > 0 ? 'bg-blue-500' : 'bg-slate-300'
                              }`}
                              style={{ width: `${progJas}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 9. STATUS */}
                      <td className="py-3.5 px-3.5 align-middle text-center whitespace-nowrap">
                        {isRejected ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                              <span>Dikembalikan</span>
                            </span>
                            {w.rejectionReason && (
                              <div className="text-[9.5px] text-rose-600 max-w-[120px] truncate" title={w.rejectionReason}>
                                {w.rejectionReason}
                              </div>
                            )}
                          </div>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                            <span>Menunggu Asman</span>
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Selesai (100%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <span>{w.status}</span>
                          </span>
                        )}
                      </td>

                      {/* 10. AKSI */}
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
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
                                onClick={() => setSelectedDocWo(w)}
                                className="px-2.5 py-1.5 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition cursor-pointer shadow-2xs font-semibold text-xs"
                                title="Lihat Draf Dokumen Work Order (Menunggu Approval Asman)"
                              >
                                <Printer className="w-3.5 h-3.5 text-amber-700" />
                                <span>Draf WO</span>
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
          <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-emerald-400" />
                  <span>Inputan Apply Work Order (WO) — Paket 1, Paket 2 & WO Tiang</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Aturan format penomoran WO: <code className="text-emerald-300 font-mono font-bold">[NO URUT].[BULAN].WO.[P1/P2/TB].[TAHUN]</code>
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
              {/* 1. Pilih Data Pelanggan */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block text-slate-800 font-bold mb-1">
                  Pilih Data Pelanggan dari Potensi Daftung (Siap Apply WO):
                </label>
                <div className="relative">
                  <select
                    value={selectedDaftungId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDaftungId(val);
                      const targetCandidate = allApplyCandidates.find((d) => d.id === val);
                      if (targetCandidate) {
                        const { hasP1, hasP2, hasTiang } = detectCandidatePackages(targetCandidate.id);
                        setCandidateHasP1(hasP1);
                        setCandidateHasP2(hasP2);
                        setCandidateHasTiang(hasTiang);
                        setP1Enabled(hasP1);
                        setP2Enabled(hasP2);
                        setTbEnabled(hasTiang);

                        const existingWos = workOrders.filter((w) => w.daftungId === targetCandidate.id || w.idpel === targetCandidate.idpel);
                        const existingP1 = existingWos.find((w) => w.category === 'WO Paket 1');
                        const existingP2 = existingWos.find((w) => w.category === 'WO Paket 2');
                        const existingTb = existingWos.find((w) => w.category === 'WO Tiang');
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
                        if (existingTb) {
                          setTbVendor(existingTb.vendor);
                          setTbNoWo(existingTb.id);
                          if (existingTb.narahubung) setTbNarahubung(existingTb.narahubung);
                          if (existingTb.phone) setTbPhone(existingTb.phone);
                          if (existingTb.supervisor1) setTbPengawas1(existingTb.supervisor1);
                          if (existingTb.supervisor2 !== undefined) setTbPengawas2(existingTb.supervisor2);
                        }
                      }
                    }}
                    className="w-full pl-3 pr-9 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
                  >
                    <option value="" disabled>-- Pilih Data Pelanggan (Potensi Daftung / Daftung) --</option>
                    {allApplyCandidates.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.source}] {d.id} • {d.customerName} (IDPEL: {d.idpel})
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

              {/* 2. ATURAN PENOMORAN WO: [NO URUT].[BULAN].WO.[P1/P2/TB].[TAHUN] */}
              <div className="bg-linear-to-r from-blue-50 via-slate-50 to-indigo-50/70 p-3.5 rounded-xl border border-blue-200/80 shadow-2xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                          Aturan Penomoran Work Order
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Baku
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Pola: <code className="font-mono font-bold text-blue-800 bg-white px-1.5 py-0.5 rounded border border-blue-200">[NO URUT].[BULAN].WO.[P1 / P2 / TB].[TAHUN]</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">No. Urut:</span>
                      <input
                        type="text"
                        value={woNoUrut}
                        onChange={(e) => handleRegenerateWoNumbers(e.target.value, woBulan, woTahun)}
                        placeholder="001"
                        maxLength={5}
                        className="w-14 text-center font-mono font-bold text-xs text-blue-700 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Bulan:</span>
                      <input
                        type="text"
                        value={woBulan}
                        onChange={(e) => handleRegenerateWoNumbers(woNoUrut, e.target.value, woTahun)}
                        placeholder="11"
                        maxLength={2}
                        className="w-10 text-center font-mono font-bold text-xs text-blue-700 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Tahun:</span>
                      <input
                        type="text"
                        value={woTahun}
                        onChange={(e) => handleRegenerateWoNumbers(woNoUrut, woBulan, e.target.value)}
                        placeholder="2026"
                        maxLength={4}
                        className="w-14 text-center font-mono font-bold text-xs text-blue-700 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRegenerateWoNumbers(woNoUrut, woBulan, woTahun)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Generate Ulang Nomor WO untuk Paket 1, Paket 2 & WO Tiang"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Generate</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Banner Informasi Seleksi Otomatis Paket Sesuai Survey */}
              {(!candidateHasP1 || !candidateHasP2 || !candidateHasTiang) && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">⚡ Aturan PLN</span>
                    <span>
                      Paket WO otomatis disesuaikan dengan hasil survey lapangan:{' '}
                      <b>{!candidateHasP1 ? 'Tanpa JTM • ' : ''}{!candidateHasP2 ? 'Tanpa JTR • ' : ''}{!candidateHasTiang ? 'Tanpa Pengadaan Tiang (Semua Tiang Eksisting / Underbuilt)' : ''}</b>
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                    Otomatis Filter
                  </span>
                </div>
              )}

              {/* 3. FORM PENUGASAN PAKET: PAKET 1, PAKET 2 & WO TIANG (Hanya muncul jika ada di hasil survey) */}
              <div className={`grid grid-cols-1 gap-4 ${
                [candidateHasP1, candidateHasP2, candidateHasTiang].filter(Boolean).length === 1
                  ? 'lg:grid-cols-1 max-w-xl mx-auto'
                  : [candidateHasP1, candidateHasP2, candidateHasTiang].filter(Boolean).length === 2
                  ? 'lg:grid-cols-2'
                  : 'lg:grid-cols-3'
              }`}>
                {/* ================= CARD 1: PAKET 1 (P1) ================= */}
                {candidateHasP1 && (
                  <div className={`rounded-xl border transition-all p-4 space-y-3.5 flex flex-col justify-between ${
                    p1Enabled ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                  }`}>
                  <div className="space-y-3.5">
                    {/* Header Card */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={p1Enabled}
                          onChange={(e) => setP1Enabled(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 bg-amber-100 text-amber-800 rounded">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs">PAKET 1</h4>
                            <p className="text-[10px] text-slate-500">JTM, Gardu Distribusi & SKTM</p>
                          </div>
                        </div>
                      </label>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-mono">
                        P1 • TM
                      </span>
                    </div>

                    {/* Vendor Pelaksana */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Vendor Pelaksana: {p1Enabled && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <select
                          disabled={!p1Enabled}
                          value={p1Vendor}
                          onChange={(e) => setP1Vendor(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
                          required={p1Enabled}
                        >
                          <option value="" disabled>-- Pilih Vendor Pelaksana --</option>
                          {vendorOptions.map((v) => (
                            <option key={v.id} value={v.name}>
                              {v.name} {v.jenisPekerjaan?.length ? `(${v.jenisPekerjaan.join(', ')})` : ''}
                            </option>
                          ))}
                          {!vendorOptions.some((v) => v.name === p1Vendor) && p1Vendor && (
                            <option value={p1Vendor}>{p1Vendor}</option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Nomor Work Order */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold">
                          Nomor WO (P1): {p1Enabled && <span className="text-rose-500">*</span>}
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">..WO.P1..</span>
                      </div>
                      <div className="relative">
                        <FileText className="w-4 h-4 text-amber-600 absolute left-3 top-2.5" />
                        <input
                          disabled={!p1Enabled}
                          type="text"
                          value={p1NoWo}
                          onChange={(e) => setP1NoWo(e.target.value)}
                          placeholder="Contoh: 001.11.WO.P1.2026"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
                          required={p1Enabled}
                        />
                      </div>
                    </div>

                    {/* Pengawas 1 (UP3) */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Pengawas 1 (UP3): {p1Enabled && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-amber-600 absolute left-3 top-3 pointer-events-none" />
                        <select
                          disabled={!p1Enabled}
                          value={p1Pengawas1}
                          onChange={(e) => setP1Pengawas1(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
                          required={p1Enabled}
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

                    {/* Pengawas 2 (ULP) */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Pengawas 2 (TL Teknik ULP):
                      </label>
                      <div className="relative">
                        <HardHat className="w-4 h-4 text-amber-500 absolute left-3 top-3 pointer-events-none" />
                        <select
                          disabled={!p1Enabled}
                          value={p1Pengawas2}
                          onChange={(e) => setP1Pengawas2(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
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
                  </div>
                </div>
              )}

              {/* ================= CARD 2: PAKET 2 (P2) ================= */}
              {candidateHasP2 && (
                <div className={`rounded-xl border transition-all p-4 space-y-3.5 flex flex-col justify-between ${
                  p2Enabled ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                }`}>
                  <div className="space-y-3.5">
                    {/* Header Card */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={p2Enabled}
                          onChange={(e) => setP2Enabled(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 bg-blue-100 text-blue-800 rounded">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs">PAKET 2</h4>
                            <p className="text-[10px] text-slate-500">JTR & Sambungan Rumah (SR)</p>
                          </div>
                        </div>
                      </label>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-300 font-mono">
                        P2 • TR
                      </span>
                    </div>

                    {/* Vendor Pelaksana */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Vendor Pelaksana: {p2Enabled && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <select
                          disabled={!p2Enabled}
                          value={p2Vendor}
                          onChange={(e) => setP2Vendor(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
                          required={p2Enabled}
                        >
                          <option value="" disabled>-- Pilih Vendor Pelaksana --</option>
                          {vendorOptions.map((v) => (
                            <option key={v.id} value={v.name}>
                              {v.name} {v.jenisPekerjaan?.length ? `(${v.jenisPekerjaan.join(', ')})` : ''}
                            </option>
                          ))}
                          {!vendorOptions.some((v) => v.name === p2Vendor) && p2Vendor && (
                            <option value={p2Vendor}>{p2Vendor}</option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Nomor Work Order */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold">
                          Nomor WO (P2): {p2Enabled && <span className="text-rose-500">*</span>}
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">..WO.P2..</span>
                      </div>
                      <div className="relative">
                        <FileText className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                        <input
                          disabled={!p2Enabled}
                          type="text"
                          value={p2NoWo}
                          onChange={(e) => setP2NoWo(e.target.value)}
                          placeholder="Contoh: 002.11.WO.P2.2026"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                          required={p2Enabled}
                        />
                      </div>
                    </div>

                    {/* Pengawas 1 (UP3) */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Pengawas 1 (UP3): {p2Enabled && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-blue-600 absolute left-3 top-3 pointer-events-none" />
                        <select
                          disabled={!p2Enabled}
                          value={p2Pengawas1}
                          onChange={(e) => setP2Pengawas1(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
                          required={p2Enabled}
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

                    {/* Pengawas 2 (ULP) */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Pengawas 2 (TL Teknik ULP):
                      </label>
                      <div className="relative">
                        <HardHat className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <select
                          disabled={!p2Enabled}
                          value={p2Pengawas2}
                          onChange={(e) => setP2Pengawas2(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
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
                  </div>
                </div>
              )}

              {/* ================= CARD 3: WO TIANG (TB) ================= */}
              {candidateHasTiang && (
                <div className={`rounded-xl border transition-all p-4 space-y-3.5 flex flex-col justify-between ${
                  tbEnabled ? 'bg-emerald-50/30 border-emerald-300/80 shadow-2xs' : 'bg-slate-100/50 border-slate-200 opacity-60'
                }`}>
                  <div className="space-y-3.5">
                    {/* Header Card */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={tbEnabled}
                          onChange={(e) => setTbEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 bg-emerald-100 text-emerald-800 rounded">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs">WO TIANG</h4>
                            <p className="text-[10px] text-slate-500">Pengadaan & Penanaman Tiang Beton</p>
                          </div>
                        </div>
                      </label>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                        TB • Tiang
                      </span>
                    </div>

                    {/* Vendor Pelaksana */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Vendor Pelaksana: {tbEnabled && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-emerald-600 absolute left-3 top-3 pointer-events-none" />
                        <select
                          disabled={!tbEnabled}
                          value={tbVendor}
                          onChange={(e) => handleTbVendorChange(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
                          required={tbEnabled}
                        >
                          <option value="" disabled>-- Pilih Vendor Pelaksana Tiang --</option>
                          {vendorOptions.map((v) => (
                            <option key={v.id} value={v.name}>
                              {v.name} {v.jenisPekerjaan?.length ? `(${v.jenisPekerjaan.join(', ')})` : ''}
                            </option>
                          ))}
                          {!vendorOptions.some((v) => v.name === tbVendor) && tbVendor && (
                            <option value={tbVendor}>{tbVendor}</option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Narahubung & No Telepon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                          Narahubung (PIC): {tbEnabled && <span className="text-rose-500">*</span>}
                        </label>
                        <div className="relative">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
                          <input
                            disabled={!tbEnabled}
                            type="text"
                            value={tbNarahubung}
                            onChange={(e) => setTbNarahubung(e.target.value)}
                            placeholder="Nama Koordinator"
                            className="w-full pl-8 pr-2 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
                            required={tbEnabled}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                          No. Telepon: {tbEnabled && <span className="text-rose-500">*</span>}
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
                          <input
                            disabled={!tbEnabled}
                            type="text"
                            value={tbPhone}
                            onChange={(e) => setTbPhone(e.target.value)}
                            placeholder="0812-xxxx-xxxx"
                            className="w-full pl-8 pr-2 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
                            required={tbEnabled}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nomor Work Order */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold">
                          Nomor WO (Tiang): {tbEnabled && <span className="text-rose-500">*</span>}
                        </label>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">..WO.TB..</span>
                      </div>
                      <div className="relative">
                        <FileText className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                        <input
                          disabled={!tbEnabled}
                          type="text"
                          value={tbNoWo}
                          onChange={(e) => setTbNoWo(e.target.value)}
                          placeholder="Contoh: 003.11.WO.TB.2026"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
                          required={tbEnabled}
                        />
                      </div>
                    </div>

                    {/* Pengawas 1 (UP3) */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Pengawas 1 (UP3): {tbEnabled && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 absolute left-3 top-3 pointer-events-none" />
                        <select
                          disabled={!tbEnabled}
                          value={tbPengawas1}
                          onChange={(e) => setTbPengawas1(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
                          required={tbEnabled}
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
                          {!supervisors.some((s) => `${s.name} (${s.role})` === tbPengawas1) && tbPengawas1 && (
                            <option value={tbPengawas1}>{tbPengawas1}</option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Pengawas 2 (ULP) */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Pengawas 2 (TL Teknik ULP):
                      </label>
                      <div className="relative">
                        <HardHat className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <select
                          disabled={!tbEnabled}
                          value={tbPengawas2}
                          onChange={(e) => setTbPengawas2(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
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
                          {!supervisors.some((s) => `${s.name} (${s.role})` === tbPengawas2) && tbPengawas2 && (
                            <option value={tbPengawas2}>{tbPengawas2}</option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CARD PENANGGUNG JAWAB PEMBUAT WO (ADMIN WO / TC LOLA KONSTRUKSI) */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                        Penanggung Jawab Pembuat Work Order (Admin WO)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Identitas pejabat/staf pembuat konsep dan tanda tangan digital sebelum diajukan ke Asman
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    Konseptor WO
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kolom Kiri: Nama & Jabatan */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Nama Pembuat / Penanggung Jawab: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder="Contoh: HASIAN EFRAVODITUS SITORUS"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Jabatan / Posisi: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={creatorRole}
                        onChange={(e) => setCreatorRole(e.target.value)}
                        placeholder="Contoh: TC LOLA KONS"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Kolom Kanan: Tanda Tangan Digital */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-bold">
                        Tanda Tangan Digital Pembuat WO:
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreatorSignPadOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>{creatorSig ? 'Ubah Tanda Tangan' : 'Goreskan Tanda Tangan'}</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setIsCreatorSignPadOpen(true)}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 bg-white hover:bg-blue-50/30 transition cursor-pointer flex flex-col items-center justify-center min-h-[92px]"
                      title="Klik untuk menggambar tanda tangan digital"
                    >
                      {creatorSig ? (
                        <div className="flex flex-col items-center gap-1">
                          <img src={creatorSig} alt="Paraf Pembuat" className="h-12 w-auto object-contain" />
                          <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                            ✓ Tanda Tangan Tersemat
                          </span>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400">
                          <PenTool className="w-5 h-5 mx-auto mb-1 opacity-50" />
                          <span className="text-xs font-semibold text-slate-600">Goreskan Tanda Tangan Digital</span>
                        </div>
                      )}
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
                      <tr className="divide-x divide-slate-200">
                        <th className="p-2 px-3">Uraian Material</th>
                        <th className="p-2 text-center w-20">Volume</th>
                        <th className="p-2 text-center w-20">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvalModalWo.materials.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 divide-x divide-slate-200">
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

      {/* MODAL 7: TANDA TANGAN DIGITAL PEMBUAT WO (ADMIN WO / TC LOLA KONS) */}
      <SignaturePadModal
        isOpen={isCreatorSignPadOpen}
        onClose={() => setIsCreatorSignPadOpen(false)}
        title="Tanda Tangan Digital Pembuat Work Order"
        signerType="creator"
        initialName={creatorName}
        initialRole={creatorRole}
        initialSignature={creatorSig}
        onSave={(dataUrl, newName, newRole) => {
          setCreatorName(newName);
          setCreatorRole(newRole);
          setCreatorSig(dataUrl);
          setIsCreatorSignPadOpen(false);
        }}
      />
    </div>
  );
};
