'use client';

import React, { useState, useEffect, useEffectEvent, useMemo } from 'react';
import { usePromotorStore, deriveVendorOptions, nextFreeWoBase } from '@/store/usePromotorStore';
import { WorkOrderRecord } from '@/types';
import {
  HardHat,
  Clock,
  Search,
  Eye,
  Filter,
  X,
  FileText,
  Trash2,
  Printer,
  PlusCircle,
  ShieldCheck,
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
  UserCheck,
  Lock,
  Send
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { RabDocumentModal } from '@/components/RabDocumentModal';
import { SignaturePadModal } from '@/components/SignaturePadModal';
import { getSurveyPackages, calculateRabFromSurvey, calculateTiangRabFromSurvey } from '@/data/surveyRabCalculator';
import { WoMaterialItem, WoJasaItem } from '@/types';

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
    createWorkOrdersFromDaftung, 
    selectedDaftungIdForWo,
    setSelectedDaftungIdForWo,
    deleteWorkOrder, 
    showToast,
    customKhsPrices,
    submitWoToAsman
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

  // Vendor per paket pekerjaan (hanya vendor yang terdaftar memiliki kontrak/penugasan di paket terkait)
  const vendorP1Options = useMemo(() => {
    const activeVendors = contracts
      .filter((c) => c.jenisPekerjaan === 'Paket 1')
      .map((c) => c.vendorName.trim().toLowerCase());
    return vendorOptions.filter((v) => 
      v.jenisPekerjaan?.includes('Paket 1') || activeVendors.includes(v.name.trim().toLowerCase())
    );
  }, [vendorOptions, contracts]);

  const vendorP2Options = useMemo(() => {
    const activeVendors = contracts
      .filter((c) => c.jenisPekerjaan === 'Paket 2')
      .map((c) => c.vendorName.trim().toLowerCase());
    return vendorOptions.filter((v) => 
      v.jenisPekerjaan?.includes('Paket 2') || activeVendors.includes(v.name.trim().toLowerCase())
    );
  }, [vendorOptions, contracts]);

  const vendorTbOptions = useMemo(() => {
    const activeVendors = contracts
      .filter((c) => c.jenisPekerjaan === 'Tiang')
      .map((c) => c.vendorName.trim().toLowerCase());
    return vendorOptions.filter((v) => 
      v.jenisPekerjaan?.includes('Tiang') || activeVendors.includes(v.name.trim().toLowerCase())
    );
  }, [vendorOptions, contracts]);

  const [selectedDocWo, setSelectedDocWo] = useState<WorkOrderRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('PENDING');
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

  // Simpan override volume yang telah diedit di modal pratinjau WO sebelum di-apply
  const [previewCustomVolumes, setPreviewCustomVolumes] = useState<{
    materials?: WoMaterialItem[];
    jasaItems?: WoJasaItem[];
  }>({});

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

  // Handler perubahan vendor WO Tiang (otomatis isi Narahubung, Telepon, & Pengawas 1 dari Kontrak)
  const handleTbVendorChange = (vName: string) => {
    setTbVendor(vName);
    const matched = vendors.find((v) => v.name === vName);
    if (matched) {
      if (matched.director) setTbNarahubung(matched.director);
      if (matched.phone) setTbPhone(matched.phone);
    }
    const matchedContract = contracts.find((c) => c.vendorName.trim().toLowerCase() === vName.trim().toLowerCase() && c.jenisPekerjaan === 'Tiang');
    if (matchedContract) {
      setTbContractId(matchedContract.id);
      if (matchedContract.supervisorName) setTbPengawas1(matchedContract.supervisorName);
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

    // Aturan paket sama dengan output RAB di menu Survey (lihat getSurveyPackages).
    const packages = getSurveyPackages(s);
    return { hasP1: packages.paket1, hasP2: packages.paket2, hasTiang: packages.tiang };
  };

  // State Pembuat WO (Admin WO / Penanggung Jawab Konsep)
  const [creatorName, setCreatorName] = useState('HASIAN EFRAVODITUS SITORUS');
  const [creatorRole, setCreatorRole] = useState('TC LOLA KONS');
  const [creatorSig, setCreatorSig] = useState<string>(DEFAULT_HASIAN_PARAF);
  const [isCreatorSignPadOpen, setIsCreatorSignPadOpen] = useState(false);

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
    const seqNum = nextFreeWoBase(workOrders.map((w) => w.id), currentMonth, currentYear);
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

    const initialP1Vendor = existingP1?.vendor || activeP1[0]?.vendorName || 'PT. HILMAN PRIMA PERKASA';
    const initialP1Contract = contracts.find((c) => c.vendorName.trim().toLowerCase() === initialP1Vendor.trim().toLowerCase() && c.jenisPekerjaan === 'Paket 1') || activeP1[0];

    const initialP2Vendor = existingP2?.vendor || activeP2[0]?.vendorName || 'PT. TAWAKAL KARYA TEKNIK';
    const initialP2Contract = contracts.find((c) => c.vendorName.trim().toLowerCase() === initialP2Vendor.trim().toLowerCase() && c.jenisPekerjaan === 'Paket 2') || activeP2[0];

    const defaultTbVendor = existingTb?.vendor || activeTb[0]?.vendorName || 'PT. ENERGI BANTEN SEJAHTERA';
    const initialTbContract = contracts.find((c) => c.vendorName.trim().toLowerCase() === defaultTbVendor.trim().toLowerCase() && c.jenisPekerjaan === 'Tiang') || activeTb[0];
    const matchedTbVendor = vendors.find((v) => v.name === defaultTbVendor);

    setP1Enabled(hasP1);
    setP1ContractId(existingP1?.contractId || initialP1Contract?.id || '');
    setP1Vendor(initialP1Vendor);
    setP1NoWo(existingP1?.id || formatWoNumber(u1, currentMonth, 'P1', currentYear));
    setP1Pengawas1(initialP1Contract?.supervisorName || existingP1?.supervisor1 || 'Hasian Sitorus (TC Lola Konstruksi)');
    setP1Pengawas2(existingP1?.supervisor2 || 'Daud Febrizer (TL Teknik ULP Rangkasbitung)');

    setP2Enabled(hasP2);
    setP2ContractId(existingP2?.contractId || initialP2Contract?.id || '');
    setP2Vendor(initialP2Vendor);
    setP2NoWo(existingP2?.id || formatWoNumber(u2, currentMonth, 'P2', currentYear));
    setP2Pengawas1(initialP2Contract?.supervisorName || existingP2?.supervisor1 || 'Daud Febrizer (TL Teknik ULP Rangkasbitung)');
    setP2Pengawas2(existingP2?.supervisor2 || '');

    // WO Tiang hanya diaktifkan jika terdapat Material Tiang Rencana Baru
    setTbEnabled(hasTiang);
    setTbContractId(existingTb?.contractId || initialTbContract?.id || '');
    setTbVendor(defaultTbVendor);
    setTbNarahubung(existingTb?.narahubung || matchedTbVendor?.director || 'Ir. Dedi Mulyadi / Koordinator');
    setTbPhone(existingTb?.phone || matchedTbVendor?.phone || '0812-3456-7890');
    setTbNoWo(existingTb?.id || formatWoNumber(u3, currentMonth, 'TB', currentYear));
    setTbPengawas1(initialTbContract?.supervisorName || existingTb?.supervisor1 || 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)');
    setTbPengawas2(existingTb?.supervisor2 || '');

    setIsApplyModalOpen(true);
  };

  // Navigasi otomatis jika dipicu dari menu Daftung: intent dari store eksternal
  // dikonsumsi sekali lalu dikosongkan.
  const openApplyFromDaftung = useEffectEvent((daftungId: string) => {
    handleOpenApplyModal(daftungId);
    setSelectedDaftungIdForWo(null);
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronisasi dengan store navigasi eksternal
    if (selectedDaftungIdForWo) openApplyFromDaftung(selectedDaftungIdForWo);
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
        materials: p1Enabled && previewCustomVolumes.materials ? previewCustomVolumes.materials : undefined,
        jasaItems: p1Enabled && previewCustomVolumes.jasaItems ? previewCustomVolumes.jasaItems : undefined,
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
        materials: !p1Enabled && p2Enabled && previewCustomVolumes.materials ? previewCustomVolumes.materials : undefined,
        jasaItems: !p1Enabled && p2Enabled && previewCustomVolumes.jasaItems ? previewCustomVolumes.jasaItems : undefined,
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
        materials: !p1Enabled && !p2Enabled && tbEnabled && previewCustomVolumes.materials ? previewCustomVolumes.materials : undefined,
        jasaItems: !p1Enabled && !p2Enabled && tbEnabled && previewCustomVolumes.jasaItems ? previewCustomVolumes.jasaItems : undefined,
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
    showToast(`✓ Berhasil Apply WO untuk ${selCandidate.customerName}.`);
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

    const previewCategory = isP1 ? 'WO Paket 1' : isP2 ? 'WO Paket 2' : 'WO Tiang';
    const previewNoWo = isP1 ? p1NoWo : isP2 ? p2NoWo : tbNoWo;
    const previewVendor = isP1 ? p1Vendor : isP2 ? p2Vendor : tbVendor;
    const previewPengawas1 = isP1 ? p1Pengawas1 : isP2 ? p2Pengawas1 : tbPengawas1;
    const previewPengawas2 = isP1 ? p1Pengawas2 : isP2 ? p2Pengawas2 : tbPengawas2;

    const matchedSurvey = surveys.find(
      (s) =>
        s.id === selCandidate.id ||
        (selCandidate.idpel && s.idpel === selCandidate.idpel) ||
        s.customerName.toLowerCase() === selCandidate.customerName.toLowerCase() ||
        s.customerName.toLowerCase().includes(selCandidate.customerName.toLowerCase())
    );

    let calculatedMaterials: WoMaterialItem[] = [];
    let calculatedJasa: WoJasaItem[] = [];

    if (matchedSurvey) {
      if (isP1) {
        const rab = calculateRabFromSurvey(matchedSurvey, 'paket1', customKhsPrices);
        calculatedMaterials = rab
          .filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'MATERIAL')
          .map((r) => ({
            material: r.desc,
            qtyReksis: r.rencanaVol,
            qtyAllocated: r.rencanaVol,
            unit: r.sat || 'Buah',
            kategori: r.subSection || r.section || 'KELOMPOK MATERIAL',
            hargaSatuan: r.hargaSatuan,
            kode: r.kode,
          }));
        const rawJasa = rab.filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'JASA');
        const totJasa = rawJasa.reduce((acc, r) => acc + r.rencanaVol * (r.hargaSatuan || 0), 0);
        calculatedJasa = rawJasa.map((r, idx) => ({
          id: r.id || `p1-jsa-${idx + 1}`,
          kode: r.kode || r.id,
          subKategori: r.subSection,
          deskripsi: r.desc,
          qtyTarget: r.rencanaVol,
          qtyRealisasi: 0,
          unit: r.sat || 'kms',
          hargaSatuan: r.hargaSatuan,
          bobotPersen: totJasa > 0 ? Math.round((r.rencanaVol * (r.hargaSatuan || 0) / totJasa) * 1000) / 10 : 0,
          progresPersen: 0,
        }));
      } else if (isP2) {
        const rab = calculateRabFromSurvey(matchedSurvey, 'paket2', customKhsPrices);
        calculatedMaterials = rab
          .filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'MATERIAL')
          .map((r) => ({
            material: r.desc,
            qtyReksis: r.rencanaVol,
            qtyAllocated: r.rencanaVol,
            unit: r.sat || 'Buah',
            kategori: r.subSection || r.section || 'KELOMPOK MATERIAL',
            hargaSatuan: r.hargaSatuan,
            kode: r.kode,
          }));
        const rawJasa = rab.filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'JASA');
        const totJasa = rawJasa.reduce((acc, r) => acc + r.rencanaVol * (r.hargaSatuan || 0), 0);
        calculatedJasa = rawJasa.map((r, idx) => ({
          id: r.id || `p2-jsa-${idx + 1}`,
          kode: r.kode || r.id,
          subKategori: r.subSection,
          deskripsi: r.desc,
          qtyTarget: r.rencanaVol,
          qtyRealisasi: 0,
          unit: r.sat || 'kms',
          hargaSatuan: r.hargaSatuan,
          bobotPersen: totJasa > 0 ? Math.round((r.rencanaVol * (r.hargaSatuan || 0) / totJasa) * 1000) / 10 : 0,
          progresPersen: 0,
        }));
      } else {
        // WO Tiang
        const tiangRab = calculateTiangRabFromSurvey(matchedSurvey, customKhsPrices);
        calculatedMaterials = tiangRab
          .filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'MATERIAL')
          .map((r) => ({
            material: r.desc,
            qtyReksis: r.rencanaVol,
            qtyAllocated: r.rencanaVol,
            unit: r.sat || 'Batang',
            kategori: 'TIANG BETON',
            hargaSatuan: r.hargaSatuan,
            kode: r.kode,
          }));
        const rawJasa = tiangRab.filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'JASA');
        const totJasa = rawJasa.reduce((acc, r) => acc + r.rencanaVol * (r.hargaSatuan || 0), 0);
        calculatedJasa = rawJasa.map((r, idx) => ({
          id: r.id || `tb-jsa-${idx + 1}`,
          kode: r.kode || r.id,
          subKategori: 'PEKERJAAN PENDIRIAN TIANG BETON',
          deskripsi: r.desc,
          qtyTarget: r.rencanaVol,
          qtyRealisasi: 0,
          unit: r.sat || 'btg',
          hargaSatuan: r.hargaSatuan,
          bobotPersen: totJasa > 0 ? Math.round((r.rencanaVol * (r.hargaSatuan || 0) / totJasa) * 1000) / 10 : 0,
          progresPersen: 0,
        }));
      }
    }

    // Gunakan custom volumes jika sudah pernah diedit di preview
    const finalMaterials = previewCustomVolumes.materials && previewCustomVolumes.materials.length > 0
      ? previewCustomVolumes.materials
      : calculatedMaterials;
    const finalJasa = previewCustomVolumes.jasaItems && previewCustomVolumes.jasaItems.length > 0
      ? previewCustomVolumes.jasaItems
      : calculatedJasa;

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
      surveyId: matchedSurvey?.id || selCandidate.id,
      reservationStatus: 'Belum Reservasi',
      approverName: 'WEGIG DIDIK KURNIAWAN',
      approverRole: 'ASMAN KONSTRUKSI',
      approverSignature: undefined,
      creatorName: creatorName.trim(),
      creatorRole: creatorRole.trim(),
      creatorSignature: creatorSig || undefined,
      materials: finalMaterials,
      jasaItems: finalJasa,
    };
    setSelectedDocWo(previewWo);
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
      categoryFilter === 'PENDING' ? (w.status === 'Menunggu Persetujuan Asman' || w.approvalStatus === 'PENDING') :
      categoryFilter === 'APPROVED' ? (w.approvalStatus === 'APPROVED' || w.status === 'Konstruksi' || w.status === 'Selesai' || w.status === 'Closeout') :
      w.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  const paginatedWorkOrders = filteredWorkOrders.slice(
    (woPage - 1) * woPageSize,
    woPage * woPageSize
  );

  const draftWoCount = workOrders.filter((w) => w.status === 'Draf' || w.approvalStatus === 'DRAFT').length;
  const pendingApprovalCount = workOrders.filter((w) => w.status === 'Menunggu Persetujuan Asman' || w.approvalStatus === 'PENDING').length;
  const currentDaftung = allApplyCandidates.find((d) => d.id === selectedDaftungId);

  return (
    <div className="space-y-6">
      {/* Header Bar dengan Tombol Utama + Apply Work Order */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">Work Order & Penerbitan Dokumen Pelaksanaan</h2>
            {draftWoCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-600" />
                <span>{draftWoCount} Draf Siap Diajukan</span>
              </span>
            )}
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
            <option value="PENDING">⏳ Menunggu Persetujuan Asman ({workOrders.filter(w => w.status === 'Menunggu Persetujuan Asman' || w.approvalStatus === 'PENDING').length})</option>
            <option value="APPROVED">✓ Disetujui Asman ({workOrders.filter(w => w.approvalStatus === 'APPROVED' || w.status === 'Konstruksi' || w.status === 'Selesai' || w.status === 'Closeout').length})</option>
            <option value="WO Paket 1">WO Paket 1</option>
            <option value="WO Tiang">WO Tiang</option>
            <option value="WO Paket 2">WO Paket 2</option>
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
                  const isDraft = w.status === 'Draf' || w.approvalStatus === 'DRAFT';
                  const isPending = w.status === 'Menunggu Persetujuan Asman';
                  const isRejected = w.status === 'Dikembalikan' || w.approvalStatus === 'REJECTED';
                  const isCompleted = w.progress === 100 || w.status === 'Selesai';

                  const mats = w.materials || [];
                  const hasRemainingToTake = mats.some((m) => {
                    if (m.isHold) return true;
                    const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
                    return (m.qtyTaken || 0) < req;
                  });
                  const isAllMatVerified = mats.length > 0 && mats.every((m) => {
                    if (m.isHold || !m.isVerified) return false;
                    const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
                    return (m.qtyTaken || 0) >= req;
                  });

                  // Progres material resmi: hanya bertambah jika sudah diverifikasi pengawas
                  const progMat = isAllMatVerified 
                    ? 100 
                    : (w.progressMaterial !== undefined ? w.progressMaterial : 0);
                  const progJas = w.progressJasa !== undefined ? w.progressJasa : (isCompleted ? 100 : w.progress || 0);

                  return (
                    <tr 
                      key={w.id} 
                      className={`hover:bg-blue-50/30 transition-colors divide-x divide-slate-200 ${
                        isRejected ? 'bg-rose-50/30' : isDraft ? 'bg-indigo-50/20' : isPending ? 'bg-amber-50/30' : ''
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
                          {w.status === 'Verifikasi SJ' && progMat < 100 && (
                            <span className="text-[8.5px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                              Menunggu Verif SJ
                            </span>
                          )}
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
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-300">
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>Draf Konsep</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                            <span>Menunggu Asman</span>
                          </span>
                        ) : w.status === 'Closeout' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700"
                            title={`Progres jasa dikunci oleh ${w.progressLockedBy || 'Pengawas'}${w.progressLockedAt ? ` • ${new Date(w.progressLockedAt).toLocaleString('id-ID')}` : ''}`}
                          >
                            <Lock className="w-3 h-3" />
                            <span>Closeout ({w.progress}%)</span>
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
                          {/* 1. JIKA STATUS DRAF: ADMIN WO PUNYA AKSI 'AJUKAN KE ASMAN' */}
                          {isDraft ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Ajukan Work Order ${w.id} (${w.category}) ke Asman Konstruksi untuk diverifikasi dan disetujui?`)) {
                                    submitWoToAsman(w.id);
                                  }
                                }}
                                className="px-3 py-1.5 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer shadow-xs font-bold text-xs"
                                title="Kirim/Ajukan Work Order ke Meja Asman Konstruksi"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Ajukan ke Asman</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedDocWo(w)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition cursor-pointer shadow-2xs"
                                title="Lihat Draf Dokumen Work Order"
                              >
                                <Printer className="w-4 h-4 text-slate-600" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin membatalkan/menghapus Draf Work Order ${w.id}?`)) {
                                    deleteWorkOrder(w.id);
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition cursor-pointer shadow-2xs"
                                title="Hapus Draf WO"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : isRejected ? (
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

            {/* Resolved Survey untuk Data Pelanggan */}
            {(() => {
              const matchedSurvey = surveys.find(
                (s) =>
                  s.id === selectedDaftungId ||
                  (currentDaftung?.idpel && s.idpel === currentDaftung.idpel) ||
                  (currentDaftung && s.customerName.toLowerCase() === currentDaftung.customerName.toLowerCase())
              );

              const dayaDisplay = matchedSurvey?.dayaBaru || matchedSurvey?.daya || '-';
              const tarifDisplay = matchedSurvey?.tarifBaru || matchedSurvey?.tarif || '-';
              const alamatDisplay = matchedSurvey?.address || matchedSurvey?.location || '-';
              const koordinatDisplay = (matchedSurvey?.poles && matchedSurvey.poles[0]?.lat)
                ? `${matchedSurvey.poles[0].lat.toFixed(6)}, ${matchedSurvey.poles[0].lng?.toFixed(6)}`
                : (matchedSurvey?.latitude ? `${matchedSurvey.latitude.toFixed(6)}, ${matchedSurvey.longitude?.toFixed(6)}` : '-');

              return (
                <form onSubmit={handleSubmitApplyWo} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
                  {/* 1. Data Pelanggan Terpilih dari Potensi Daftung (Otomatis & Terkunci) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <label className="text-slate-800 font-bold text-xs uppercase tracking-wide">
                          Data Pelanggan Potensi Daftung (Siap Apply WO)
                        </label>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Otomatis Sesuai Pilihan
                      </span>
                    </div>

                    {currentDaftung ? (
                      /* Data Identitas Pelanggan (Tanpa pemotongan teks) */
                      <div className="p-3.5 bg-white border border-blue-200 rounded-xl text-xs text-slate-700 shadow-2xs space-y-2.5">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                          <div className="md:col-span-5">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Nama Pelanggan:</span>
                            <b className="text-slate-900 text-sm font-black leading-snug break-words">
                              {currentDaftung.customerName}
                            </b>
                          </div>
                          <div className="md:col-span-3">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">IDPEL:</span>
                            <b className="font-mono text-slate-900 text-xs block">{currentDaftung.idpel || '-'}</b>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Tarif / Daya:</span>
                            <span className="font-bold text-slate-900">{tarifDisplay} / {dayaDisplay} VA</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Status:</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              currentDaftung.status === 'Perlu Revisi' 
                                ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {currentDaftung.status}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-[11px] flex flex-wrap items-center gap-x-6 gap-y-1 text-slate-600">
                          <div>
                            <span className="text-slate-400 font-semibold">Alamat: </span>
                            <span className="text-slate-800 font-medium break-words">{alamatDisplay}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold">Titik Koordinat: </span>
                            <span className="font-mono text-slate-800">{koordinatDisplay}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold">Sumber: </span>
                            <span className="text-slate-800 font-medium">{currentDaftung.source} ({currentDaftung.id})</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                        Tidak ada pelanggan yang dipilih. Silakan klik Apply WO dari tabel Potensi Daftung.
                      </div>
                    )}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            setP1Vendor(val);
                            const matched = contracts.find((c) => c.vendorName.trim().toLowerCase() === val.trim().toLowerCase() && c.jenisPekerjaan === 'Paket 1');
                            if (matched) {
                              setP1ContractId(matched.id);
                              if (matched.supervisorName) setP1Pengawas1(matched.supervisorName);
                            }
                          }}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
                          required={p1Enabled}
                        >
                          <option value="" disabled>-- Pilih Vendor Pelaksana Paket 1 --</option>
                          {vendorP1Options.map((v) => (
                            <option key={v.id} value={v.name}>
                              {v.name}
                            </option>
                          ))}
                          {!vendorP1Options.some((v) => v.name === p1Vendor) && p1Vendor && (
                            <option value={p1Vendor}>{p1Vendor}</option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Pengawas 1 (UP3) - Terkunci Sesuai Master Kontrak */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold">
                          Pengawas 1 (UP3): {p1Enabled && <span className="text-rose-500">*</span>}
                        </label>
                        <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Lock className="w-3 h-3 text-amber-600" /> Sesuai Kontrak
                        </span>
                      </div>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-amber-600 absolute left-3 top-3 pointer-events-none" />
                        <input
                          disabled
                          type="text"
                          value={p1Pengawas1 || 'Hasian Sitorus (TC Lola Konstruksi)'}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-100 text-slate-800 font-bold cursor-not-allowed"
                          title="Pengawas 1 mutlak sesuai data Master Kontrak SPK"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
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
                          onChange={(e) => {
                            const val = e.target.value;
                            setP2Vendor(val);
                            const matched = contracts.find((c) => c.vendorName.trim().toLowerCase() === val.trim().toLowerCase() && c.jenisPekerjaan === 'Paket 2');
                            if (matched) {
                              setP2ContractId(matched.id);
                              if (matched.supervisorName) setP2Pengawas1(matched.supervisorName);
                            }
                          }}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none disabled:bg-slate-100"
                          required={p2Enabled}
                        >
                          <option value="" disabled>-- Pilih Vendor Pelaksana Paket 2 --</option>
                          {vendorP2Options.map((v) => (
                            <option key={v.id} value={v.name}>
                              {v.name}
                            </option>
                          ))}
                          {!vendorP2Options.some((v) => v.name === p2Vendor) && p2Vendor && (
                            <option value={p2Vendor}>{p2Vendor}</option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Pengawas 1 (UP3) - Terkunci Sesuai Master Kontrak */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold">
                          Pengawas 1 (UP3): {p2Enabled && <span className="text-rose-500">*</span>}
                        </label>
                        <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          <Lock className="w-3 h-3 text-blue-600" /> Sesuai Kontrak
                        </span>
                      </div>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-blue-600 absolute left-3 top-3 pointer-events-none" />
                        <input
                          disabled
                          type="text"
                          value={p2Pengawas1 || 'Daud Febrizer (TL Teknik ULP Rangkasbitung)'}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-100 text-slate-800 font-bold cursor-not-allowed"
                          title="Pengawas 1 mutlak sesuai data Master Kontrak SPK"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
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
                          {vendorTbOptions.map((v) => (
                            <option key={v.id} value={v.name}>
                              {v.name}
                            </option>
                          ))}
                          {!vendorTbOptions.some((v) => v.name === tbVendor) && tbVendor && (
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

                    {/* Pengawas 1 (UP3) - Terkunci Sesuai Master Kontrak */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold">
                          Pengawas 1 (UP3): {tbEnabled && <span className="text-rose-500">*</span>}
                        </label>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <Lock className="w-3 h-3 text-emerald-600" /> Sesuai Kontrak
                        </span>
                      </div>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 absolute left-3 top-3 pointer-events-none" />
                        <input
                          disabled
                          type="text"
                          value={tbPengawas1 || 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)'}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-100 text-slate-800 font-bold cursor-not-allowed"
                          title="Pengawas 1 mutlak sesuai data Master Kontrak SPK"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
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
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
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
                    {currentDaftung?.status === 'Perlu Revisi' ? 'Ajukan Ulang WO' : 'Apply WO'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          );
        })()}
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
          allowVolumeEdit
          onSavePreviewVolumes={(_woId, vols) => {
            if (selectedDocWo) {
              const updatedMats = selectedDocWo.materials?.map((m, idx) => ({
                ...m,
                qtyAllocated: vols.materials[idx] !== undefined ? vols.materials[idx] : m.qtyAllocated,
                qtyReksis: vols.materials[idx] !== undefined ? vols.materials[idx] : m.qtyReksis,
              })) || [];
              const updatedJasa = selectedDocWo.jasaItems?.map((j, idx) => ({
                ...j,
                qtyTarget: vols.jasaItems[idx] !== undefined ? vols.jasaItems[idx] : j.qtyTarget,
              })) || [];
              setPreviewCustomVolumes({
                materials: updatedMats,
                jasaItems: updatedJasa,
              });
              showToast('✓ Volume rencana preview berhasil disimpan!');
            }
          }}
        />
      )}

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
