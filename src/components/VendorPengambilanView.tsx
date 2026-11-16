'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  CheckCircle2,
  FileCheck2,
  Upload,
  Search,
  Building2,
  Clock,
  Eye,
  FileText,
  Boxes,
  X,
  Camera,
  RotateCcw,
  Check,
  AlertTriangle,
  ShieldAlert,
  Info,
  Calendar,
  Bell,
  Lock,
  Plus,
  Layers,
  Trash2,
  TrendingUp,
  Zap,
  Send,
  ChevronRight
} from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { WorkOrderRecord, WoJasaItem } from '@/types';
import { calculateRabFromSurvey } from '@/data/rabMasterData';
import { ModalRekapProgresJasa } from '@/components/ModalRekapProgresJasa';

// Nomor Surat Jalan baru (dipanggil hanya dari event handler).
const generateSjNumber = () => `SJ-${String(Date.now()).slice(-5)}/GDG-PLN/${new Date().getFullYear()}`;

const parseSupervisor = (s?: string) => {
  if (!s || s === '—' || s === '-') return { name: '—', role: '' };
  const parts = s.split('(');
  const name = parts[0].trim();
  const role = parts.length > 1 ? parts[1].replace(')', '').trim() : '';
  return { name, role };
};

export const VendorPengambilanView: React.FC = () => {
  const { 
    workOrders, 
    surveys,
    customKhsPrices,
    vendorConfirmMaterialTaken, 
    vendorSubmitRealization, 
    vendorSubmitProgress,
    showToast,
    vendorPickupTransactions
  } = usePromotorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendor, setFilterVendor] = useState<string>('ALL');
  const [filterPackage, setFilterPackage] = useState<'ALL' | 'WO Paket 1' | 'WO Paket 2' | 'WO Tiang'>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SIAP_AMBIL' | 'VERIFIKASI_SJ' | 'PROGRES_JASA' | 'REALISASI' | 'SELESAI' | 'RIWAYAT_PENGAMBILAN'>('ALL');

  // Modal 1: Lihat Kebutuhan Material WO
  const [selectedWoForDetail, setSelectedWoForDetail] = useState<WorkOrderRecord | null>(null);

  // Modal 2: Konfirmasi Material Diterima & Upload Surat Jalan
  const [uploadSjWo, setUploadSjWo] = useState<WorkOrderRecord | null>(null);
  const [noSjInput, setNoSjInput] = useState('');
  const [tglSjInput, setTglSjInput] = useState('');
  const [noReservasiInput, setNoReservasiInput] = useState('');
  const [noGiInput, setNoGiInput] = useState('');
  const [sjPhotos, setSjPhotos] = useState<string[]>([]);
  const [receiptPhotos, setReceiptPhotos] = useState<string[]>([]);
  const [batchTaken, setBatchTaken] = useState<Record<string, number>>({});
  const [vendorReceiptNote, setVendorReceiptNote] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<{ title: string; url: string } | null>(null);

  // Modal 3: Konfirmasi Realisasi Terpasang & Retur
  const [realizationWo, setRealizationWo] = useState<WorkOrderRecord | null>(null);
  const [realizationItems, setRealizationItems] = useState<{
    material: string;
    unit: string;
    qtyTaken: number;
    qtyInstalled: number;
    qtyReturned: number;
    notes: string;
  }[]>([]);
  const [vendorRealizationNote, setVendorRealizationNote] = useState('');

  // Modal 4: Lihat Foto Surat Jalan
  const [viewSjPhotoWo, setViewSjPhotoWo] = useState<WorkOrderRecord | null>(null);
  const [selectedSjIndex, setSelectedSjIndex] = useState<number>(0);

  // Modal 5: Update Progres Jasa Lapangan oleh Rekanan Vendor
  const [progressWo, setProgressWo] = useState<WorkOrderRecord | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [progressNote, setProgressNote] = useState<string>('');
  const [progressJasaItems, setProgressJasaItems] = useState<WoJasaItem[]>([]);

  // Modal 6: Rekap Read-Only Status Capaian Jasa per Sub-Bab
  const [rekapWo, setRekapWo] = useState<WorkOrderRecord | null>(null);

  // --------------------------------------------------------------------------
  // Helper: Kelompok Jasa & Perhitungan Progres Riil per WO
  // --------------------------------------------------------------------------
  const getWoJasaItems = (wo: WorkOrderRecord): WoJasaItem[] => {
    // 1. Jika ada draft pending progress dari vendor, utamakan itu
    if (wo.pendingJasaItems && wo.pendingJasaItems.length > 0) {
      return wo.pendingJasaItems;
    }
    // 2. Jika WO sudah memiliki jasaItems resmi, pakai data WO
    if (wo.jasaItems && wo.jasaItems.length > 2) {
      return wo.jasaItems;
    }

    // 3. Hubungkan dengan survey terkait untuk mengambil Kelompok Jasa murni dari Dokumen WO / RAB
    const matchedSurvey = surveys.find(
      (s) => s.id === wo.surveyId || s.id === wo.daftungId || s.idpel === wo.idpel || s.customerName === wo.customerName
    ) || surveys[0];

    if (matchedSurvey) {
      const isPaket2 = wo.category === 'WO Paket 2';
      const isTiang = wo.category === 'WO Tiang';
      const paketKey = isPaket2 ? 'paket2' : 'paket1';

      if (isTiang) {
        return [
          { id: 'JSA-TB-01', kode: 'JSA-TNG-12-350', subKategori: 'A. PEKERJAAN PENDIRIAN & PENANAMAN TIANG BETON', deskripsi: 'Pendirian & Penanaman Tiang Beton 12 Meter 350 daN', qtyTarget: 2, qtyRealisasi: 0, unit: 'btg', hargaSatuan: 485000, bobotPersen: 45.1, progresPersen: 0 },
          { id: 'JSA-TB-02', kode: 'JSA-TNG-12-200', subKategori: 'A. PEKERJAAN PENDIRIAN & PENANAMAN TIANG BETON', deskripsi: 'Pendirian & Penanaman Tiang Beton 12 Meter 200 daN', qtyTarget: 1, qtyRealisasi: 0, unit: 'btg', hargaSatuan: 425000, bobotPersen: 19.8, progresPersen: 0 },
          { id: 'JSA-TB-03', kode: 'JSA-TNG-09-200', subKategori: 'A. PEKERJAAN PENDIRIAN & PENANAMAN TIANG BETON', deskripsi: 'Pendirian & Penanaman Tiang Beton 9 Meter 200 daN', qtyTarget: 2, qtyRealisasi: 0, unit: 'btg', hargaSatuan: 370000, bobotPersen: 35.1, progresPersen: 0 },
        ];
      }

      const rab = calculateRabFromSurvey(matchedSurvey, paketKey, customKhsPrices);
      const rawJasa = rab.filter((r) => !r.isHeader && r.section === 'JASA' && r.rencanaVol > 0);

      if (rawJasa.length > 0) {
        const totalVal = rawJasa.reduce((acc, r) => acc + (r.rencanaVol * (r.hargaSatuan || 0)), 0);
        return rawJasa.map((r, idx) => {
          const itemVal = r.rencanaVol * (r.hargaSatuan || 0);
          const bobot = totalVal > 0 
            ? Math.round((itemVal / totalVal) * 1000) / 10 
            : Math.round((100 / rawJasa.length) * 10) / 10;
          return {
            id: r.id || `JSA-${idx + 1}`,
            kode: r.kode || `JSA-${idx + 1}`,
            deskripsi: r.desc,
            subKategori: r.subSection || (isPaket2 ? 'KELOMPOK JASA JTR & APP' : 'KELOMPOK JASA SUTM & GARDU DISTRIBUSI'),
            qtyTarget: r.rencanaVol,
            qtyRealisasi: r.realisasiVol || 0,
            unit: r.sat || 'bh',
            hargaSatuan: r.hargaSatuan || 0,
            bobotPersen: bobot,
            progresPersen: r.realisasiVol && r.rencanaVol ? Math.min(100, Math.round((r.realisasiVol / r.rencanaVol) * 100)) : 0,
          };
        });
      }
    }

    if (wo.jasaItems && wo.jasaItems.length > 0) {
      return wo.jasaItems;
    }

    return [];
  };

  const calculateJasaProgress = (items: WoJasaItem[]): number => {
    if (!items || items.length === 0) return 0;
    
    // Perhitungan berbasis nilai rupiah (Rencana vs Realisasi)
    const totalRencanaRp = items.reduce((sum, it) => sum + (it.qtyTarget * (it.hargaSatuan || 0)), 0);
    const totalRealisasiRp = items.reduce((sum, it) => sum + ((it.qtyRealisasi || 0) * (it.hargaSatuan || 0)), 0);

    if (totalRencanaRp > 0) {
      return Math.min(100, Math.round((totalRealisasiRp / totalRencanaRp) * 100));
    }

    // Fallback: terbobot bobotPersen
    const totalBobot = items.reduce((sum, it) => sum + (it.bobotPersen || 0), 0);
    if (totalBobot > 0) {
      const weightedSum = items.reduce((sum, it) => {
        const pct = it.progresPersen !== undefined 
          ? it.progresPersen 
          : (it.qtyTarget > 0 ? Math.min(100, Math.round(((it.qtyRealisasi || 0) / it.qtyTarget) * 100)) : 0);
        return sum + (pct * (it.bobotPersen || 0));
      }, 0);
      return Math.min(100, Math.round(weightedSum / totalBobot));
    }

    // Fallback: rata-rata progres item
    const avg = items.reduce((sum, it) => {
      const pct = it.progresPersen !== undefined 
        ? it.progresPersen 
        : (it.qtyTarget > 0 ? Math.min(100, Math.round(((it.qtyRealisasi || 0) / it.qtyTarget) * 100)) : 0);
      return sum + pct;
    }, 0) / items.length;
    return Math.min(100, Math.round(avg));
  };

  const calculateMaterialProgress = (wo: WorkOrderRecord): number => {
    const mats = wo.materials || [];
    if (mats.length === 0) return wo.progressMaterial || 0;

    const hasHeld = mats.some((m) => m.isHold);
    const hasRemainingToTake = mats.some((m) => {
      if (m.isHold) return true;
      const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
      return (m.qtyTaken || 0) < req;
    });

    const isAllCompleted = !hasRemainingToTake && !hasHeld;
    if (isAllCompleted) return 100;

    const totalTaken = mats.reduce((acc, m) => acc + (m.qtyTaken || 0), 0);
    if (totalTaken === 0) return 0;

    const totalFulfillment = mats.reduce((sum, m) => {
      if (m.isHold) return sum;
      const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
      const taken = m.qtyTaken || 0;
      return sum + (req > 0 ? Math.min(1, taken / req) : 0);
    }, 0);

    const calculatedPct = Math.round((totalFulfillment / mats.length) * 100);
    return Math.min(99, Math.max(1, calculatedPct));
  };

  // Handlers untuk Modal Progres Jasa Vendor
  const handleOpenProgressModal = (wo: WorkOrderRecord) => {
    // Progres jasa yang sudah dikunci pengawas tidak boleh dibuka untuk diubah.
    if (wo.progressJasaLocked) {
      showToast(
        `🔒 Progres jasa WO ${wo.id} sudah dikunci oleh ${wo.progressLockedBy || 'Pengawas'} — update vendor tidak diterima.`
      );
      return;
    }
    setProgressWo(wo);
    const initialItems = getWoJasaItems(wo).map((it) => ({ ...it }));
    setProgressJasaItems(initialItems);
    const currentJasa = calculateJasaProgress(initialItems);
    setProgressVal(currentJasa);
    setProgressNote(wo.catatan || '');
  };

  const handleUpdateItemRealisasi = (idx: number, realisasiVal: number) => {
    setProgressJasaItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      const safeVal = Math.max(0, realisasiVal);
      item.qtyRealisasi = safeVal;
      item.progresPersen = item.qtyTarget > 0 ? Math.min(100, Math.round((safeVal / item.qtyTarget) * 100)) : (safeVal > 0 ? 100 : 0);
      copy[idx] = item;
      
      const newTotal = calculateJasaProgress(copy);
      setProgressVal(newTotal);
      return copy;
    });
  };

  const handleUpdateItemPhoto = (idx: number, photoBase64: string, caption?: string) => {
    setProgressJasaItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      item.evidencePhoto = photoBase64;
      if (caption !== undefined) {
        item.evidenceCaption = caption;
      }
      copy[idx] = item;
      return copy;
    });
  };

  const handleRemoveItemPhoto = (idx: number) => {
    setProgressJasaItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      delete item.evidencePhoto;
      delete item.evidenceCaption;
      copy[idx] = item;
      return copy;
    });
  };

  const handleUpdateItemKendala = (idx: number, kendalaText: string) => {
    setProgressJasaItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      item.kendala = kendalaText;
      copy[idx] = item;
      return copy;
    });
  };

  const handleSetItemPercent = (idx: number, pct: number) => {
    setProgressJasaItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      item.progresPersen = pct;
      if (pct === 100) {
        item.qtyRealisasi = item.qtyTarget;
      } else if (pct === 0) {
        item.qtyRealisasi = 0;
      } else {
        item.qtyRealisasi = Math.round(((item.qtyTarget * pct) / 100) * 10000) / 10000;
      }
      copy[idx] = item;
      
      const newTotal = calculateJasaProgress(copy);
      setProgressVal(newTotal);
      return copy;
    });
  };

  const handleSetAll100Percent = () => {
    setProgressJasaItems((prev) => {
      const copy = prev.map((item) => ({
        ...item,
        qtyRealisasi: item.qtyTarget,
        progresPersen: 100,
      }));
      setProgressVal(100);
      return copy;
    });
    showToast('Semua item jasa diset realisasi 100%');
  };

  const handleResetAll = () => {
    setProgressJasaItems((prev) => {
      const copy = prev.map((item) => ({
        ...item,
        qtyRealisasi: 0,
        progresPersen: 0,
      }));
      setProgressVal(0);
      return copy;
    });
    showToast('Semua volume realisasi di-reset ke 0');
  };

  const handleSubmitProgressVendor = () => {
    if (!progressWo) return;
    vendorSubmitProgress(progressWo.id, progressJasaItems, progressWo.vendor);
    setProgressWo(null);
  };

  // Filter WO aktif untuk rekanan vendor
  const approvedWos = useMemo(() => {
    return workOrders.filter(
      (w) => w.approvalStatus === 'APPROVED' || w.status === 'Konstruksi' || w.status === 'Verifikasi SJ' || w.status === 'Selesai' || w.status === 'Closeout'
    );
  }, [workOrders]);

  // Daftar nama vendor unik
  const vendorOptions = useMemo(() => {
    return Array.from(new Set(approvedWos.map((w) => w.vendor))).filter(Boolean);
  }, [approvedWos]);

  // Tab Filtering
  const filteredWos = useMemo(() => {
    return approvedWos.filter((w) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        w.id.toLowerCase().includes(q) ||
        w.customerName.toLowerCase().includes(q) ||
        w.vendor.toLowerCase().includes(q) ||
        (w.spkNumber && w.spkNumber.toLowerCase().includes(q)) ||
        (w.suratJalanNumber && w.suratJalanNumber.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (filterVendor !== 'ALL' && w.vendor !== filterVendor) return false;
      if (filterPackage !== 'ALL' && w.category !== filterPackage) return false;

      if (activeTab === 'SIAP_AMBIL') {
        const mats = w.materials || [];
        const hasRemainingToTake = mats.some((m) => {
          if (m.isHold) return false;
          const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
          return (m.qtyTaken || 0) < req;
        });
        return (w.reservationStatus === 'Siap Ambil' || w.reservationStatus === 'Siap Ambil Sebagian') && hasRemainingToTake;
      }
      if (activeTab === 'VERIFIKASI_SJ') {
        return Boolean(w.suratJalanNumber) && (!w.sjVerificationStatus || w.sjVerificationStatus === 'BELUM_DIPERIKSA');
      }
      if (activeTab === 'PROGRES_JASA') {
        return w.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS' || (w.progressJasa !== undefined && w.progressJasa > 0);
      }
      if (activeTab === 'REALISASI') {
        return w.vendorReceiptConfirmed && (!w.pengawasRealizationVerified);
      }
      if (activeTab === 'SELESAI') {
        return w.pengawasRealizationVerified || w.status === 'Selesai' || w.status === 'Closeout';
      }

      return true;
    });
  }, [approvedWos, searchTerm, filterVendor, filterPackage, activeTab]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: approvedWos.length,
      siapAmbil: approvedWos.filter((w) => {
        const mats = w.materials || [];
        const hasRemainingToTake = mats.some((m) => {
          if (m.isHold) return false;
          const req = m.qtyReserved !== undefined ? m.qtyReserved : (m.qtyAllocated || m.qtyReksis || 1);
          return (m.qtyTaken || 0) < req;
        });
        return (w.reservationStatus === 'Siap Ambil' || w.reservationStatus === 'Siap Ambil Sebagian') && hasRemainingToTake;
      }).length,
      verifikasiSj: approvedWos.filter((w) => Boolean(w.suratJalanNumber) && (!w.sjVerificationStatus || w.sjVerificationStatus === 'BELUM_DIPERIKSA')).length,
      progresJasa: approvedWos.filter((w) => w.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS').length,
      realisasi: approvedWos.filter((w) => w.vendorReceiptConfirmed && !w.pengawasRealizationVerified).length,
      selesai: approvedWos.filter((w) => w.pengawasRealizationVerified || w.status === 'Selesai' || w.status === 'Closeout').length,
    };
  }, [approvedWos]);

  // Handlers Modal 2: Konfirmasi Ambil & Upload SJ & Bukti Penerimaan
  const handleOpenUploadSj = (wo: WorkOrderRecord) => {
    setUploadSjWo(wo);
    const mats = wo.materials || [];
    const hasAnyTaken = mats.some((m) => (m.qtyTaken || 0) > 0);

    // Untuk penamaan Surat Jalan berikutnya jika bertahap
    const defaultNoSj = hasAnyTaken
      ? generateSjNumber()
      : (wo.suratJalanNumber || generateSjNumber());

    setNoSjInput(defaultNoSj);
    setTglSjInput(new Date().toISOString().split('T')[0]);
    const initialResNo = wo.reservationNumber || wo.reservationNumberNonStock || '';
    setNoReservasiInput(initialResNo);
    setNoGiInput(wo.giNumber || '');

    // Inisialisasi daftar berkas foto Surat Jalan & Bukti Penerimaan (Multi-file support)
    const existingSjPhotos = wo.suratJalanPhotos && wo.suratJalanPhotos.length > 0
      ? wo.suratJalanPhotos
      : (wo.suratJalanPhoto ? [wo.suratJalanPhoto] : []);
    setSjPhotos(hasAnyTaken ? [] : existingSjPhotos);
    setReceiptPhotos(wo.receiptPhotos || []);

    setVendorReceiptNote(
      hasAnyTaken
        ? 'Pengambilan material bertahap dari Gudang UP3 Banten Selatan.'
        : (wo.vendorReceiptNotes || 'Material diambil lengkap dari Gudang UP3 Banten Selatan dalam kondisi baik.')
    );

    // Inisialisasi kuantitas yang diambil pada batch saat ini:
    // HANYA untuk material yang direservasi pengawas saat itu (qtyReserved > 0).
    // Material yang bernilai 0 atau tidak direservasi tidak diambil sekarang (menunggu reservasi pengawas tahap berikutnya).
    const initialBatch: Record<string, number> = {};
    mats.forEach((m) => {
      const resQty = m.qtyReserved !== undefined ? m.qtyReserved : 0;
      if (m.isHold || resQty <= 0) {
        initialBatch[m.material] = 0;
      } else {
        const prevTaken = m.qtyTaken || 0;
        const sisa = Math.max(0, resQty - prevTaken);
        initialBatch[m.material] = sisa;
      }
    });
    setBatchTaken(initialBatch);
  };

  const handleBatchQtyChange = (materialName: string, val: number, maxAllowed: number) => {
    const safeVal = Math.max(0, Math.min(maxAllowed, isNaN(val) ? 0 : val));
    setBatchTaken((prev) => ({
      ...prev,
      [materialName]: safeVal,
    }));
  };

  // Helper Multi-Upload Surat Jalan
  const handleFileSelectSj = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const res = loadEvt.target?.result as string;
        if (res) {
          setSjPhotos((prev) => [...prev, res]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleMockAddSj = () => {
    const sampleUrls = [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    ];
    const picked = sampleUrls[sjPhotos.length % sampleUrls.length];
    setSjPhotos((prev) => [...prev, picked]);
  };

  const handleRemoveSjPhoto = (index: number) => {
    setSjPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper Multi-Upload Bukti Penerimaan Material
  const handleFileSelectReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const res = loadEvt.target?.result as string;
        if (res) {
          setReceiptPhotos((prev) => [...prev, res]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleMockAddReceipt = () => {
    const sampleUrls = [
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    ];
    const picked = sampleUrls[receiptPhotos.length % sampleUrls.length];
    setReceiptPhotos((prev) => [...prev, picked]);
  };

  const handleRemoveReceiptPhoto = (index: number) => {
    setReceiptPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitSuratJalan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadSjWo) return;
    if (!noSjInput.trim()) {
      alert('Mohon isi nomor surat jalan gudang');
      return;
    }
    const finalSjPhotos = sjPhotos.length > 0
      ? sjPhotos
      : ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'];

    // Hitung total akumulasi yang diambil per material = (sudah diambil sebelumnya) + (diambil tahap ini)
    const finalTakenItems = (uploadSjWo.materials || []).map((m) => {
      const resQty = m.qtyReserved !== undefined ? m.qtyReserved : 0;
      if (m.isHold || resQty <= 0) {
        return { material: m.material, qtyTaken: m.qtyTaken || 0 };
      }
      const prevTaken = m.qtyTaken || 0;
      const thisBatch = batchTaken[m.material] !== undefined ? batchTaken[m.material] : 0;
      return {
        material: m.material,
        qtyTaken: prevTaken + thisBatch,
      };
    });

    vendorConfirmMaterialTaken(
      uploadSjWo.id,
      noSjInput.trim(),
      tglSjInput || new Date().toISOString().split('T')[0],
      finalSjPhotos,
      finalTakenItems,
      vendorReceiptNote.trim(),
      noReservasiInput.trim(),
      noGiInput.trim(),
      receiptPhotos
    );
    showToast(`✓ Surat Jalan ${noSjInput.trim()} & Pengambilan Material berhasil disimpan!`);
    setUploadSjWo(null);
  };

  // Handlers Modal 3: Realisasi & Retur
  const handleOpenRealization = (wo: WorkOrderRecord) => {
    setRealizationWo(wo);
    setVendorRealizationNote(wo.vendorRealizationNotes || '');

    const initialRows = (wo.materials || []).map((m) => {
      const taken = m.qtyTaken || m.qtyAllocated || m.qtyReksis || 1;
      const installed = m.qtyInstalled !== undefined ? m.qtyInstalled : taken;
      const returned = m.qtyReturned !== undefined ? m.qtyReturned : Math.max(0, taken - installed);
      return {
        material: m.material,
        unit: m.unit,
        qtyTaken: taken,
        qtyInstalled: installed,
        qtyReturned: returned,
        notes: m.vendorNotes || '',
      };
    });
    setRealizationItems(initialRows);
  };

  const handleRealizationInstalledChange = (materialName: string, installedVal: number) => {
    setRealizationItems((prev) =>
      prev.map((it) => {
        if (it.material === materialName) {
          const validInstalled = Math.min(it.qtyTaken, Math.max(0, installedVal));
          const autoReturned = Math.max(0, it.qtyTaken - validInstalled);
          return {
            ...it,
            qtyInstalled: validInstalled,
            qtyReturned: autoReturned,
          };
        }
        return it;
      })
    );
  };

  const handleRealizationReturnChange = (materialName: string, retVal: number) => {
    setRealizationItems((prev) =>
      prev.map((it) => {
        if (it.material === materialName) {
          const validRet = Math.min(it.qtyTaken, Math.max(0, retVal));
          const autoInstalled = Math.max(0, it.qtyTaken - validRet);
          return {
            ...it,
            qtyReturned: validRet,
            qtyInstalled: autoInstalled,
          };
        }
        return it;
      })
    );
  };

  const handlePasangSemua = () => {
    setRealizationItems((prev) =>
      prev.map((it) => ({
        ...it,
        qtyInstalled: it.qtyTaken,
        qtyReturned: 0,
      }))
    );
    showToast('✓ Seluruh item diset terpasang 100%');
  };

  const handleSubmitRealization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!realizationWo) return;
    vendorSubmitRealization(
      realizationWo.id,
      realizationItems.map((it) => ({
        material: it.material,
        qtyInstalled: it.qtyInstalled,
        qtyReturned: it.qtyReturned,
        notes: it.notes,
      })),
      vendorRealizationNote.trim()
    );
    setRealizationWo(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Menu Vendor Pelaksana</h2>
            <p className="text-xs text-slate-500">
              Daftar Work Order ter-assign, konfirmasi material diterima & upload Surat Jalan, serta konfirmasi realisasi terpasang / retur material.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ALL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Semua WO</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-normal">{tabCounts.all}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SIAP_AMBIL')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'SIAP_AMBIL' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Siap Ambil Bertahap</span>
          {tabCounts.siapAmbil > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              {tabCounts.siapAmbil}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('VERIFIKASI_SJ')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'VERIFIKASI_SJ' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Verifikasi SJ</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-normal">{tabCounts.verifikasiSj}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PROGRES_JASA')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'PROGRES_JASA' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Progres Jasa Lapangan</span>
          {tabCounts.progresJasa > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-200 animate-pulse">
              {tabCounts.progresJasa} Menunggu Verif
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-normal">
              Aktif
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REALISASI')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'REALISASI' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Realisasi & Retur</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-normal">{tabCounts.realisasi}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SELESAI')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'SELESAI' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Selesai / Closeout</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-normal">{tabCounts.selesai}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RIWAYAT_PENGAMBILAN')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'RIWAYAT_PENGAMBILAN' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Riwayat Pengambilan Material</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold border border-purple-200">
            {vendorPickupTransactions.length}
          </span>
        </button>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor WO, SPK, vendor, atau nama pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Vendor */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="py-1.5 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Vendor Pelaksana</option>
              {vendorOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Paket WO */}
          <select
            value={filterPackage}
            onChange={(e) => setFilterPackage(e.target.value as typeof filterPackage)}
            className="py-1.5 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Jenis WO</option>
            <option value="WO Paket 1">WO Paket 1 (JTM & Gardu)</option>
            <option value="WO Paket 2">WO Paket 2 (JTR & APP)</option>
            <option value="WO Tiang">WO Tiang Beton</option>
          </select>
        </div>
      </div>

      {/* Konten Tab: Riwayat Pengambilan vs Tabel Utama WO Rekanan */}
      {activeTab === 'RIWAYAT_PENGAMBILAN' ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-xs text-slate-800">
                Histori Transaksi Pengambilan Bertahap Material ({vendorPickupTransactions.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Mencatat seluruh rincian batch pengambilan material rekanan
            </span>
          </div>

          {vendorPickupTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Belum Ada Riwayat Transaksi Pengambilan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ketika vendor melakukan konfirmasi pengambilan material (baik sebagian atau lunas), catatan transaksi akan otomatis tercatat di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vendorPickupTransactions.map((trx) => (
                <div key={trx.id} className="p-5 hover:bg-slate-50/60 transition">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded border border-purple-200">
                          {trx.id}
                        </span>
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {trx.noWorkOrder || trx.woId}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{trx.customerName}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Waktu Pengambilan</span>
                          <span className="font-semibold text-slate-800">{trx.date}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Vendor Rekanan</span>
                          <span className="font-semibold text-slate-800">{trx.vendorName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Pengawas Lapangan</span>
                          <span className="font-semibold text-slate-800">{trx.supervisorName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9.5px] uppercase font-bold">No. Surat Jalan Gudang</span>
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                            {trx.suratJalanNumber}
                          </span>
                        </div>
                      </div>

                      {/* Tabel Rincian Material yang Diambil */}
                      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">No Material</th>
                              <th className="py-2 px-3">Nama Material</th>
                              <th className="py-2 px-3 text-center">Jenis</th>
                              <th className="py-2 px-3 text-center">Satuan</th>
                              <th className="py-2 px-3 text-right">Qty Reservasi</th>
                              <th className="py-2 px-3 text-right bg-blue-50/80 text-blue-900 font-bold">Diambil Transaksi Ini</th>
                              <th className="py-2 px-3 text-right">Total Akumulasi</th>
                              <th className="py-2 px-3 text-right text-amber-800 font-bold">Sisa Belum Diambil</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {trx.items.map((it, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{it.kode || '-'}</td>
                                <td className="py-2 px-3 font-medium text-slate-800">{it.material}</td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${it.categoryType === 'NON_STOK' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {it.categoryType === 'NON_STOK' ? 'Non-Stok' : 'Stok Gudang'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center text-slate-500 text-[11px]">{it.unit}</td>
                                <td className="py-2 px-3 text-right font-mono text-slate-600">{it.qtyReserved}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/50">
                                  +{it.qtyTakenCurrent} {it.unit}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{it.totalTakenAccumulated}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                                  {it.sisaRemaining} {it.unit}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      /* Tabel Utama WO Rekanan */
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10.5px] tracking-wider whitespace-nowrap">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-3.5 min-w-[140px]">NO. WORK ORDER</th>
                <th className="py-3 px-3.5 min-w-[170px]">NOMOR SPK</th>
                <th className="py-3 px-3.5 min-w-[170px]">PELANGGAN</th>
                <th className="py-3 px-3.5 min-w-[160px]">IDPEL & MATERIAL</th>
                <th className="py-3 px-3.5 min-w-[170px]">VENDOR PELAKSANA</th>
                <th className="py-3 px-3.5 min-w-[170px]">PENGAWAS LAPANGAN</th>
                <th className="py-3 px-3 text-center min-w-[130px]">STATUS RESERVASI</th>
                <th className="py-3 px-3 text-center min-w-[130px]">SURAT JALAN</th>
                <th className="py-3 px-3 text-center min-w-[140px]">PROGRES JASA</th>
                <th className="py-3 px-3 text-center min-w-[130px]">RETUR SISA GUDANG</th>
                <th className="py-3 px-3.5 text-center min-w-[170px] w-56">AKSI VENDOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWos.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
                    Tidak ada Work Order yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredWos.map((wo) => {
                  const mats = wo.materials || [];
                  const hasSj = Boolean(wo.suratJalanNumber);
                  const isReceiptConfirmed = Boolean(wo.vendorReceiptConfirmed);
                  const isRealizationSubmitted = Boolean(wo.vendorRealizationSubmitted);

                  // Definisi isReserved yang lengkap & konsisten:
                  const isReserved = Boolean(
                    wo.reservationNumber ||
                    wo.reservationStatus === 'Siap Ambil' ||
                    wo.reservationStatus === 'Siap Ambil Sebagian' ||
                    wo.reservationStatus === 'Reservasi Sebagian' ||
                    wo.reservationStatus === 'Selesai' ||
                    wo.reservationStatus === 'Suplai Pabrikan' ||
                    hasSj ||
                    mats.some((m) => m.isTaken)
                  );

                  // Status WO di-hold total (jika belum ada material yang diambil sama sekali)
                  const isHold = (wo.reservationStatus === 'Hold' || Boolean(wo.isHold)) && !mats.some((m) => m.isTaken);

                  // Rincian status item material:
                  const heldItems = mats.filter((m) => m.isHold);
                  const takenItems = mats.filter((m) => (m.qtyTaken || 0) > 0);
                  const itemsWithRemaining = mats.filter((m) => {
                    if (m.isHold) return false;
                    const resQty = m.qtyReserved !== undefined ? m.qtyReserved : 0;
                    if (resQty <= 0) return false;
                    return (m.qtyTaken || 0) < resQty;
                  });
                  const hasHeld = heldItems.length > 0;
                  const hasUnheldPending = itemsWithRemaining.length > 0;
                  const hasTakenAny = takenItems.length > 0;
                  const isAllCompleted = mats.length > 0 && mats.every((m) => {
                    if (m.isHold) return false;
                    const fullReq = m.qtyAllocated || m.qtyReksis || 1;
                    return (m.qtyTaken || 0) >= fullReq;
                  });

                  return (
                    <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-200">
                      {/* 1. No WO */}
                      <td className="py-3.5 px-3.5 font-mono">
                        <div className="font-bold text-blue-700 text-xs">{wo.noWorkOrder || wo.id}</div>
                        <div className="mt-1">
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-semibold inline-block ${
                            wo.category === 'WO Paket 1' ? 'bg-blue-100 text-blue-800' :
                            wo.category === 'WO Paket 2' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {wo.category === 'WO Paket 1' ? 'Paket 1' : wo.category === 'WO Paket 2' ? 'Paket 2' : 'Tiang'}
                          </span>
                        </div>
                      </td>

                      {/* 2. Nomor SPK */}
                      <td className="py-3.5 px-3.5 font-mono">
                        {wo.spkNumber ? (
                          <div className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                            {wo.spkNumber}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">—</span>
                        )}
                      </td>

                      {/* 3. Pelanggan */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-slate-900 leading-snug text-[11.5px]">{wo.customerName}</div>
                      </td>

                      {/* 3b. IDPEL & Material */}
                      <td className="py-3.5 px-3.5">
                        <div className="text-[10.5px] text-slate-600 font-mono">
                          IDPEL: <span className="font-semibold text-slate-800">{wo.idpel || '-'}</span>
                        </div>
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            📦 {mats.length} Jenis Material
                          </span>
                        </div>
                      </td>

                      {/* 4. Vendor Pelaksana */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 text-[11px]">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="leading-snug">{wo.vendor || '-'}</span>
                        </div>
                      </td>

                      {/* 5. Pengawas Lapangan */}
                      <td className="py-3.5 px-3.5">
                        {(() => {
                          const s1 = parseSupervisor(wo.supervisor1 || wo.supervisor);
                          const s2raw = wo.supervisor2;
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

                      {/* Status Reservasi Material */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap align-top">
                        {isHold ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1 shadow-2xs">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>Hold Gudang</span>
                            </span>
                            {wo.holdReason && (
                              <span className="text-[9.5px] text-rose-600 max-w-[130px] truncate mt-0.5" title={wo.holdReason}>
                                {wo.holdReason}
                              </span>
                            )}
                          </div>
                        ) : isReserved ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            {isAllCompleted ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Lengkap Diambil ({takenItems.length} Item)</span>
                              </span>
                            ) : hasTakenAny && hasUnheldPending ? (
                              /* Kasus: Sisa material sudah di-unhold oleh pengawas -> Siap ambil Tahap 2 */
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-1 animate-pulse">
                                <Bell className="w-3 h-3 animate-bounce" />
                                <span>Siap Ambil Sisa</span>
                              </span>
                            ) : hasTakenAny && hasHeld ? (
                              /* Kasus: Tahap 1 sudah diambil, dan sisa material masih ditahan pengawas */
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                <span>Tahap 1 Diambil</span>
                              </span>
                            ) : hasHeld ? (
                              /* Belum ada yang diambil, dan sebagian material di-hold */
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Siap Ambil Sebagian</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Siap Ambil Gudang</span>
                              </span>
                            )}

                            {/* Sub-keterangan penjelas ringkas */}
                            {hasHeld && (
                              <span className="text-[9px] text-rose-600 font-bold max-w-[130px] truncate" title={`${heldItems.length} material ditahan pengawas`}>
                                ⛔ {heldItems.length} Item Ditahan
                              </span>
                            )}
                            {hasTakenAny && hasUnheldPending && (
                              <span className="text-[9px] text-emerald-700 font-semibold">
                                Sisa {itemsWithRemaining.length} Item
                              </span>
                            )}

                            {/* Nomor Reservasi Kompak */}
                            {(wo.reservationNumber || wo.reservationNumberNonStock) && (
                              <div className="flex flex-col gap-0.5 w-full max-w-[140px] mt-0.5">
                                {wo.reservationNumber && (
                                  <div
                                    className="flex items-center justify-between text-[9px] font-mono font-bold bg-blue-50/80 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded cursor-help"
                                    title={`No. Reservasi SAP (Gudang): ${wo.reservationNumber}`}
                                  >
                                    <span className="text-blue-600 font-sans font-bold text-[8.5px]">SAP</span>
                                    <span className="truncate ml-1">{wo.reservationNumber.replace(/^RES-SAP\//, '.../')}</span>
                                  </div>
                                )}
                                {wo.reservationNumberNonStock && (
                                  <div
                                    className="flex items-center justify-between text-[9px] font-mono font-bold bg-indigo-50/80 text-indigo-900 border border-indigo-200 px-1.5 py-0.5 rounded cursor-help"
                                    title={`No. Reservasi Non-SAP (Pabrikan): ${wo.reservationNumberNonStock}`}
                                  >
                                    <span className="text-indigo-600 font-sans font-bold text-[8.5px]">Non-SAP</span>
                                    <span className="truncate ml-1">{wo.reservationNumberNonStock.replace(/^RES-NONSAP\//, '.../')}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Menunggu Pengawas</span>
                          </span>
                        )}
                      </td>

                      {/* Surat Jalan & Verifikasi (Kompak & Bersih) */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap align-top">
                        {hasSj ? (
                          <div className="inline-flex flex-col items-center gap-1 max-w-[145px]">
                            {/* Nomor SJ Utama */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSjIndex(0);
                                setViewSjPhotoWo(wo);
                              }}
                              className="w-full px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 flex items-center justify-between gap-1 cursor-pointer transition shadow-2xs"
                              title="Klik untuk melihat dokumen Surat Jalan & Bukti Penerimaan"
                            >
                              <div className="flex items-center gap-1 truncate">
                                <FileCheck2 className="w-3 h-3 text-blue-600 shrink-0" />
                                <span className="truncate">{wo.suratJalanNumber}</span>
                              </div>
                              {wo.suratJalanList && wo.suratJalanList.length > 1 && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold shrink-0 font-sans" title={`${wo.suratJalanList.length} Surat Jalan Bertahap`}>
                                  {wo.suratJalanList.length}x
                                </span>
                              )}
                            </button>

                            {/* Sub Tag: GI & Status Pengesahan Pengawas */}
                            <div className="flex items-center gap-1 justify-center flex-wrap">
                              {wo.giNumber && (
                                <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded" title={`No. Goods Issue (GI): ${wo.giNumber}`}>
                                  GI:{wo.giNumber}
                                </span>
                              )}
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                wo.sjVerificationStatus === 'SESUAI' ? 'bg-emerald-100 text-emerald-800' :
                                wo.sjVerificationStatus === 'ADA_SELISIH' ? 'bg-amber-100 text-amber-800' :
                                wo.sjVerificationStatus === 'RETUR_GUDANG' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {wo.sjVerificationStatus === 'SESUAI' ? '✓ Disahkan' :
                                 wo.sjVerificationStatus === 'ADA_SELISIH' ? '⚠️ Ada Selisih' :
                                 wo.sjVerificationStatus === 'RETUR_GUDANG' ? '📦 Retur' : '⏳ Verif Pengawas'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10.5px] italic">Belum Upload SJ</span>
                        )}
                      </td>

                      {/* Progres Jasa Konstruksi Lapangan */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {(() => {
                          const currentProg = wo.progressJasa !== undefined ? wo.progressJasa : calculateJasaProgress(wo.jasaItems || []);
                          const pendingProg = wo.pendingJasaItems ? calculateJasaProgress(wo.pendingJasaItems) : null;
                          const isPending = wo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS';
                          const isApproved = wo.progressStatus === 'DISETUJUI';
                          const isRejected = wo.progressStatus === 'DITOLAK';

                          return (
                            <button
                              type="button"
                              onClick={() => setRekapWo(wo)}
                              className="group inline-flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200 transition cursor-pointer"
                              title="Klik untuk melihat rekap detail bagian-bagian kelompok jasa (Read-only)"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[12px] font-black font-mono group-hover:underline ${currentProg === 100 ? 'text-emerald-700' : currentProg > 0 ? 'text-blue-700' : 'text-slate-500'}`}>
                                  {currentProg}%
                                </span>
                                <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${currentProg === 100 ? 'bg-emerald-500' : currentProg >= 50 ? 'bg-blue-500' : currentProg > 0 ? 'bg-amber-400' : 'bg-slate-300'}`}
                                    style={{ width: `${currentProg}%` }}
                                  />
                                </div>
                              </div>

                              {isPending ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse" title="Vendor telah mengajukan progres. Menunggu persetujuan pengawas.">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Verif Pengawas ({pendingProg}%)</span>
                                </span>
                              ) : isRejected ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1" title={wo.progressRejectedReason || 'Ditolak oleh pengawas'}>
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Ditolak Pengawas</span>
                                </span>
                              ) : isApproved ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Terverifikasi ✓</span>
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 group-hover:text-blue-600">Lihat Rekap 🔍</span>
                              )}
                              {wo.progressJasaLocked && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1"
                                  title={`Dikunci oleh ${wo.progressLockedBy || 'Pengawas'}${wo.progressLockedAt ? ` pada ${new Date(wo.progressLockedAt).toLocaleString('id-ID')}` : ''}. WO sudah Closeout — update progres jasa vendor tidak diterima lagi.`}
                                >
                                  <Lock className="w-3 h-3 shrink-0" />
                                  <span>Terkunci • Closeout</span>
                                </span>
                              )}
                            </button>
                          );
                        })()}
                      </td>

                      {/* Status Retur Sisa Gudang */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {(() => {
                          const returnedList = (wo.materials || []).filter((m) => (m.qtyReturned || 0) > 0);
                          if (isRealizationSubmitted) {
                            if (returnedList.length > 0) {
                              return (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                  <RotateCcw className="w-3 h-3 text-amber-600" />
                                  <span>Retur {returnedList.length} Item</span>
                                </span>
                              );
                            }
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Nihil Retur (100%)</span>
                              </span>
                            );
                          }
                          if (isAllCompleted) {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <span>Bisa Lapor Retur</span>
                              </span>
                            );
                          }
                          if (hasTakenAny) {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1" title="Masih ada material yang belum diambil lengkap">
                                <span>Menunggu Sisa Material</span>
                              </span>
                            );
                          }
                          return <span className="text-slate-400 text-[10.5px]">—</span>;
                        })()}
                      </td>

                      {/* Aksi Vendor: Clean & UI Friendly Layout */}
                      <td className="py-3.5 px-3 text-center align-middle">
                        <div className="flex flex-col gap-1.5 items-center justify-center max-w-[170px] mx-auto w-full">
                          {/* 1. Tombol Utama (Status / Pengambilan / SJ) */}
                          {isReserved ? (
                            (() => {
                              // Kasus A: Masih ada sisa material yang belum diambil (Pengambilan Bertahap)
                              if (hasUnheldPending) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUploadSj(wo)}
                                    className="w-full py-1.5 px-2 rounded-lg font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                                    title={hasTakenAny ? "Ambil sisa material berikutnya (Pengambilan Bertahap)" : "Konfirmasi Material Diterima dan Upload Surat Jalan Gudang"}
                                  >
                                    <Upload className="w-3.5 h-3.5 shrink-0" />
                                    <span>{hasTakenAny ? 'Ambil Sisa (Bertahap)' : 'Ambil & Upload SJ'}</span>
                                  </button>
                                );
                              }

                              // Kasus B: Tahap awal sudah diambil, tapi sisa material MASIH DITAHAN Pengawas
                              if (hasTakenAny && hasHeld && !hasUnheldPending) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUploadSj(wo)}
                                    className="w-full py-1.5 px-2 rounded-lg font-bold text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap"
                                    title="Lihat / Perbarui Surat Jalan Tahap 1"
                                  >
                                    <FileCheck2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>Surat Jalan Tahap 1</span>
                                  </button>
                                );
                              }

                              // Kasus C: Pengambilan sudah lengkap / lunas
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenUploadSj(wo)}
                                  className="w-full py-1.5 px-2 rounded-lg font-bold text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                                  title="Lihat / Perbarui Surat Jalan Gudang"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>Surat Jalan Gudang</span>
                                </button>
                              );
                            })()
                          ) : (
                            <div
                              className="w-full py-1.5 px-2 rounded-lg font-medium text-[10.5px] bg-slate-100 text-slate-500 border border-slate-200/80 flex items-center justify-center gap-1.5 cursor-not-allowed whitespace-nowrap"
                              title={isHold ? `WO di-Hold oleh Pengawas: ${wo.holdReason}` : 'Menunggu Pengawas melakukan Reservasi Material ke Gudang PLN'}
                            >
                              {isHold ? <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                              <span>{isHold ? 'WO di-Hold' : 'Belum Reservasi'}</span>
                            </div>
                          )}

                          {/* Tombol Input/Update Progres Jasa Lapangan */}
                          {wo.progressJasaLocked ? (
                            <div
                              className="w-full py-1.5 px-2 rounded-lg font-bold text-[10.5px] bg-slate-800 text-amber-300 border border-slate-700 flex items-center justify-center gap-1.5 cursor-not-allowed whitespace-nowrap"
                              title={`Progres jasa WO ini sudah dikunci oleh ${wo.progressLockedBy || 'Pengawas'}${wo.progressLockedAt ? ` pada ${new Date(wo.progressLockedAt).toLocaleString('id-ID')}` : ''} dan WO sudah Closeout. Vendor tidak dapat memperbarui lagi — minta Pengawas membuka kunci bila perlu revisi.`}
                            >
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              <span>Closeout (Terkunci)</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenProgressModal(wo)}
                              className={`w-full py-1.5 px-2 rounded-lg font-bold text-[10.5px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap ${
                                wo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS'
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                                  : wo.progressStatus === 'DITOLAK'
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                  : wo.progressStatus === 'DISETUJUI'
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}
                              title={
                                wo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS'
                                  ? 'Lihat atau revisi pengajuan progres yang sedang menunggu verifikasi pengawas'
                                  : wo.progressStatus === 'DITOLAK'
                                  ? `Pengajuan ditolak pengawas: "${wo.progressRejectedReason}". Klik untuk revisi dan ajukan ulang.`
                                  : 'Input / Update Realisasi Jasa Konstruksi Lapangan untuk diverifikasi Pengawas'
                              }
                            >
                              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {wo.progressStatus === 'MENUNGGU_VERIFIKASI_PROGRESS'
                                  ? 'Progres (Pending Verif)'
                                  : wo.progressStatus === 'DITOLAK'
                                  ? 'Revisi Progres'
                                  : 'Input Progres Jasa'}
                              </span>
                            </button>
                          )}

                          {/* 2. Baris Bawah: Rincian Kebutuhan & Status/Aksi Pendukung */}
                          {isReceiptConfirmed && isAllCompleted ? (
                            /* Sub-baris saat material SUDAH LENGKAP DIAMBIL 100%: Tombol Kebutuhan + Lapor Retur */
                            <div className="w-full grid grid-cols-2 gap-1 items-center">
                              <button
                                type="button"
                                onClick={() => setSelectedWoForDetail(wo)}
                                className="py-1 px-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                                title="Lihat Rincian Kebutuhan Material WO"
                              >
                                <Eye className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>Kebutuhan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRealization(wo)}
                                className="py-1 px-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                                title="Seluruh material telah diambil lengkap. Klik untuk lapor jika ada sisa material yang diretur ke Gudang PLN."
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{wo.vendorRealizationSubmitted ? 'Ubah Retur' : 'Lapor Retur'}</span>
                              </button>
                            </div>
                          ) : (
                            /* Sub-baris saat material BELUM LENGKAP: Tombol Kebutuhan (+ Info jika ada item Hold) */
                            <div className="w-full">
                              {hasHeld && !hasUnheldPending ? (
                                <div className="w-full grid grid-cols-2 gap-1 items-center">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedWoForDetail(wo)}
                                    className="py-1 px-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                                    title="Lihat Rincian Kebutuhan Material WO"
                                  >
                                    <Eye className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span>Kebutuhan</span>
                                  </button>
                                  <div
                                    className="py-1 px-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center justify-center gap-1 cursor-default text-center whitespace-nowrap"
                                    title={`Sisa ${heldItems.length} material masih ditahan pengawas: ${heldItems.map((h) => h.holdReason || h.material).join(', ')}`}
                                  >
                                    <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span>Hold ({heldItems.length})</span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedWoForDetail(wo)}
                                  className="w-full py-1 px-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[10.5px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                                  title="Lihat Rincian Kebutuhan Material WO"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>Lihat Kebutuhan Material</span>
                                </button>
                              )}
                            </div>
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
      </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RINCIAN KEBUTUHAN MATERIAL WO                                    */}
      {/* ========================================================================= */}
      {selectedWoForDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-4xl lg:max-w-5xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Kebutuhan Material WO: {selectedWoForDetail.noWorkOrder || selectedWoForDetail.id}</h3>
                  <p className="text-[11px] text-slate-400">Pelanggan: {selectedWoForDetail.customerName} • Rekanan: <span className="text-blue-300 font-semibold">{selectedWoForDetail.vendor}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWoForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Nomor SPK:</span>
                  <b className="text-slate-800 text-[11.5px]">{selectedWoForDetail.spkNumber || '—'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Pengawas:</span>
                  <b className="text-slate-800 text-[11.5px]">{selectedWoForDetail.supervisor1 || selectedWoForDetail.supervisor || '—'}</b>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Status Reservasi:</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-100 text-blue-800 border border-blue-200">
                    {selectedWoForDetail.reservationStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">No. Reservasi ERP:</span>
                  <b className="font-mono text-slate-800 text-[11.5px]">{selectedWoForDetail.reservationNumber || '—'}</b>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">No</th>
                      <th className="py-2.5 px-3 text-center font-mono whitespace-nowrap">No Material</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Nama Material</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Satuan</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Kebutuhan WO</th>
                      <th className="py-2.5 px-3 text-center bg-blue-50 text-blue-900 whitespace-nowrap">Qty Reservasi</th>
                      <th className="py-2.5 px-3 text-center bg-emerald-50 text-emerald-900 whitespace-nowrap">Sudah Diambil</th>
                      <th className="py-2.5 px-3 text-center bg-amber-50 text-amber-900 whitespace-nowrap">Sisa Belum Diambil</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedWoForDetail.materials || []).map((m, idx) => {
                      const req = m.qtyAllocated || m.qtyReksis || 1;
                      const qtyRes = m.qtyReserved !== undefined ? m.qtyReserved : 0;
                      const taken = m.qtyTaken || 0;
                      const sisa = Math.max(0, qtyRes - taken);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">{m.kode || '—'}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {m.material}
                            {m.isReplaced && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-normal">
                                Substitusi
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 font-medium">{m.unit}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {req}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/40">
                            {qtyRes}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                            {taken}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700 bg-amber-50/40">
                            {sisa}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {m.isHold ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                                  ⛔ Ditahan Pengawas
                                </span>
                                {m.holdReason && (
                                  <span className="text-[9px] text-rose-500 max-w-[120px] truncate mt-0.5 font-medium cursor-help" title={m.holdReason}>
                                    Ket: {m.holdReason}
                                  </span>
                                )}
                              </div>
                            ) : taken >= req ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10.5px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                ✓ Lengkap Diambil
                              </span>
                            ) : qtyRes === 0 ? (
                              <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200" title="Material ini belum direservasi pengawas pada transaksi saat ini">
                                ⏳ Menunggu Reservasi Pengawas
                              </span>
                            ) : taken > 0 ? (
                              <span className="inline-flex items-center gap-1 text-blue-700 font-bold text-[10.5px] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                Sebagian ({taken}/{qtyRes})
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold text-[10.5px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Siap Diambil ({qtyRes})
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

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedWoForDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KONFIRMASI MATERIAL DITERIMA & UPLOAD SURAT JALAN GUDANG         */}
      {/* ========================================================================= */}
      {uploadSjWo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-bold text-sm">
                    {(uploadSjWo.materials || []).some((m) => m.isTaken && (m.qtyTaken || 0) > 0)
                      ? 'Konfirmasi Pengambilan Sisa Material (Tahap 2) & Surat Jalan'
                      : 'Konfirmasi Material Diterima & Surat Jalan Gudang'}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    WO: {uploadSjWo.noWorkOrder || uploadSjWo.id} • Rekanan: {uploadSjWo.vendor}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadSjWo(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSuratJalan} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <b>Petunjuk Rekanan:</b> Pengawas telah melakukan reservasi material di gudang (No: <b>{uploadSjWo.reservationNumber || 'RES-PLN-2026'}</b>). Silakan konfirmasi jumlah fisik yang diterima di loket gudang dan unggah foto fisik Surat Jalan resmi dari Gudang PLN.
                </span>
              </div>

              {/* Banner Peringatan Material Ditahan atau Baru Di-Unhold */}
              {(() => {
                const mats = uploadSjWo.materials || [];
                const heldItems = mats.filter((m) => m.isHold);
                const takenItems = mats.filter((m) => m.isTaken && (m.qtyTaken || 0) > 0);
                const unheldPending = mats.filter((m) => !m.isHold && (!m.isTaken || (m.qtyTaken || 0) === 0));

                return (
                  <div className="space-y-2">
                    {heldItems.length > 0 && (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 flex items-start gap-2 shadow-2xs">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <b className="font-bold text-rose-900">Perhatian Rekanan (Ada {heldItems.length} Material Ditahan Pengawas):</b>
                          <div className="text-[11px] text-rose-800 mt-0.5">
                            Material yang ditandai merah sedang ditahan dan <u>tidak boleh diambil</u> dari loket gudang. Anda hanya mengambil material yang diizinkan (kolom terkunci di angka 0). Sisa material ini harus diambil nanti setelah pengawas membuka penahanan (Unhold).
                          </div>
                        </div>
                      </div>
                    )}
                    {unheldPending.length > 0 && takenItems.length > 0 && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-start gap-2 shadow-2xs animate-pulse">
                        <Bell className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <b className="font-bold text-emerald-900">Pengambilan Sisa Material (Baru Di-Unhold Pengawas):</b>
                          <div className="text-[11px] text-emerald-800 mt-0.5">
                            Pengawas telah membuka penahanan untuk <b>{unheldPending.length} jenis material sisa</b>. Silakan ambil fisik di gudang sekarang dan konfirmasi jumlah aktual yang diterima.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Input Nomor & Tanggal Surat Jalan, Nomor Reservasi & Nomor GI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/90">
                {/* 1. Nomor Surat Jalan Gudang */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Nomor Surat Jalan Gudang</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={noSjInput}
                    onChange={(e) => setNoSjInput(e.target.value)}
                    placeholder="Contoh: SJ-042/GDG-BTS/2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                {/* 2. Tanggal Pengambilan Fisik */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Tanggal Pengambilan Fisik</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={tglSjInput}
                    onChange={(e) => setTglSjInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                {/* 3. Nomor Reservasi Gudang / Izin Non-Stok */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Nomor Reservasi / Izin Terbit</span>
                    </span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={noReservasiInput}
                    onChange={(e) => setNoReservasiInput(e.target.value)}
                    placeholder="Contoh: RES-SAP/... atau RES-NONSAP/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                  />
                  {(uploadSjWo.reservationNumber || uploadSjWo.reservationNumberNonStock) && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {uploadSjWo.reservationNumber && (
                        <button
                          type="button"
                          onClick={() => setNoReservasiInput(uploadSjWo.reservationNumber!)}
                          className={`text-[9.5px] px-2 py-0.5 rounded-md font-mono font-bold border transition cursor-pointer ${
                            noReservasiInput === uploadSjWo.reservationNumber
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          📦 SAP: {uploadSjWo.reservationNumber}
                        </button>
                      )}
                      {uploadSjWo.reservationNumberNonStock && (
                        <button
                          type="button"
                          onClick={() => setNoReservasiInput(uploadSjWo.reservationNumberNonStock!)}
                          className={`text-[9.5px] px-2 py-0.5 rounded-md font-mono font-bold border transition cursor-pointer ${
                            noReservasiInput === uploadSjWo.reservationNumberNonStock
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                        >
                          🏭 Non-SAP: {uploadSjWo.reservationNumberNonStock}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Nomor GI (Goods Issue SAP) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Nomor GI (Goods Issue SAP)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    value={noGiInput}
                    onChange={(e) => setNoGiInput(e.target.value)}
                    placeholder="Contoh: GI-4900123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Rincian Material yang Diterima */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Daftar Material Direservasi Pengawas (Siap Diambil):</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        Batch Transaksi Ini
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Hanya menampilkan material yang kuantitas reservasi &gt; 0 oleh Pengawas. Sisa material lainnya akan direservasi pada tahap berikutnya.
                    </p>
                  </div>
                  <span className="text-[11px] text-blue-600 font-medium whitespace-nowrap">
                    Sesuaikan angka jika pengambilan dilakukan bertahap
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">No</th>
                        <th className="py-2.5 px-3 text-center font-mono w-28">No Material</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Nama Material</th>
                        <th className="py-2.5 px-2 text-center w-16">Satuan</th>
                        <th className="py-2.5 px-3 text-center w-24 bg-blue-50 text-blue-900">Qty Reservasi</th>
                        <th className="py-2.5 px-3 text-center w-24 bg-slate-200/70 text-slate-800">Sudah Diambil</th>
                        <th className="py-2.5 px-3 text-center w-24 bg-amber-50 text-amber-900 border-x border-amber-200">Sisa Belum</th>
                        <th className="py-2.5 px-3 text-center w-40 bg-blue-100/70 text-blue-900 font-bold">
                          <div>
                            <span>Ambil Tahap Ini</span>
                            <span className="block text-[8.5px] font-normal text-blue-700">(Bisa Bertahap)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center w-28">Total Setelah Ambil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const mats = uploadSjWo.materials || [];
                        // HANYA tampilkan material yang direservasi oleh pengawas saat itu (qtyReserved > 0)
                        const displayedMats = mats.filter((m) => {
                          const resQty = m.qtyReserved !== undefined ? m.qtyReserved : 0;
                          return resQty > 0 || (m.qtyTaken || 0) > 0;
                        });

                        if (displayedMats.length === 0) {
                          return (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-slate-500 bg-slate-50">
                                <div className="max-w-md mx-auto space-y-1">
                                  <p className="font-semibold text-slate-700">Belum ada material yang direservasi oleh Pengawas pada transaksi ini.</p>
                                  <p className="text-[11px] text-slate-400">Material dengan kuantitas reservasi 0 akan diterbitkan oleh Pengawas pada reservasi tahap berikutnya.</p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return displayedMats.map((m, idx) => {
                          const isHeld = Boolean(m.isHold);
                          const req = m.qtyReserved !== undefined ? m.qtyReserved : 0;
                          const prevTaken = m.qtyTaken || 0;
                          const sisa = Math.max(0, req - prevTaken);
                          const currentBatch = isHeld ? 0 : (batchTaken[m.material] !== undefined ? batchTaken[m.material] : sisa);
                          const newTotal = prevTaken + currentBatch;

                          return (
                            <tr 
                              key={idx} 
                              className={
                                isHeld 
                                  ? 'bg-rose-50/70 border-l-4 border-l-rose-500' 
                                  : sisa === 0
                                  ? 'bg-slate-50/90 border-l-4 border-l-slate-300'
                                  : prevTaken > 0
                                  ? 'bg-amber-50/40 border-l-4 border-l-amber-500'
                                  : 'hover:bg-slate-50/70'
                              }
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">{m.kode || '—'}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-800">{m.material}</div>
                                {isHeld ? (
                                  <div className="mt-1">
                                    <span className="inline-block text-[9.5px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                      ⛔ DITAHAN PENGAWAS: {m.holdReason || 'Stok Kosong'}
                                    </span>
                                  </div>
                                ) : sisa === 0 ? (
                                  <div className="mt-0.5">
                                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Lunas Diambil di Tahap Sebelumnya</span>
                                    </span>
                                  </div>
                                ) : prevTaken > 0 ? (
                                  <div className="mt-0.5">
                                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                      <span>Pengambilan Bertahap (Sisa {sisa} {m.unit})</span>
                                    </span>
                                  </div>
                                ) : null}
                              </td>
                              <td className="py-2.5 px-2 text-center text-slate-600 text-[11px]">{m.unit}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                                {req}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 bg-slate-100/70">
                                {prevTaken}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-800 bg-amber-50/50">
                                {sisa}
                              </td>
                              <td className="py-2 px-3 text-center bg-blue-50/30">
                                {isHeld ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200 inline-block">
                                    0 (Ditahan)
                                  </span>
                                ) : sisa === 0 ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                                    ✓ Lunas
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      max={sisa}
                                      step="any"
                                      value={currentBatch}
                                      onChange={(e) => handleBatchQtyChange(m.material, parseFloat(e.target.value) || 0, sisa)}
                                      className="w-20 px-2 py-1 text-center font-mono font-bold rounded-lg border border-blue-400 bg-white text-blue-900 text-xs focus:ring-2 focus:ring-blue-500 shadow-2xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleBatchQtyChange(m.material, sisa, sisa)}
                                      className="px-1.5 py-1 text-[9.5px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition cursor-pointer"
                                      title="Ambil Sisa Penuh"
                                    >
                                      Maks
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                <span className={`font-bold text-xs ${newTotal >= req ? 'text-emerald-700' : 'text-blue-700'}`}>
                                  {newTotal}
                                </span>
                                <span className="text-slate-400 text-[10px]"> / {req}</span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dua Bagian Upload: 1. Surat Jalan & 2. Bukti Penerimaan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. UPLOAD SURAT JALAN GUDANG */}
                <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>1. Surat Jalan Gudang</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sjPhotos.length > 0 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {sjPhotos.length > 0 ? `${sjPhotos.length} Berkas` : 'Wajib Diisi'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Dokumen fisik resmi berstempel dan bertanda tangan petugas gudang PLN.
                    </p>
                  </div>

                  {/* Dropzone jika belum ada file */}
                  {sjPhotos.length === 0 ? (
                    <label
                      htmlFor="input-file-sj"
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 bg-white/70 hover:bg-emerald-50/30 flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition group"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center mb-0.5 transition">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                        Klik untuk Unggah Berkas
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        Format JPG, PNG, atau scan PDF
                      </span>
                    </label>
                  ) : (
                    /* Thumbnail List */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                      {sjPhotos.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex items-center justify-center">
                          <img
                            src={url}
                            alt={`Surat Jalan ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                            onClick={() => setFullscreenImage({ title: `Surat Jalan Gudang (File #${idx + 1})`, url })}
                          />
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSjPhoto(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md cursor-pointer transition"
                            title="Hapus foto ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="file"
                      id="input-file-sj"
                      multiple
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileSelectSj}
                    />
                    <label
                      htmlFor="input-file-sj"
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{sjPhotos.length > 0 ? 'Tambah Berkas' : 'Pilih Berkas'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleMockAddSj}
                      className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kamera</span>
                    </button>
                  </div>
                </div>

                {/* 2. UPLOAD BUKTI PENERIMAAN MATERIAL */}
                <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>2. Bukti Penerimaan Material</span>
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        receiptPhotos.length > 0 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {receiptPhotos.length > 0 ? `${receiptPhotos.length} Berkas` : 'Opsional'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Foto dokumentasi fisik serah terima material di loket gudang atau BA serah terima.
                    </p>
                  </div>

                  {/* Dropzone jika belum ada file */}
                  {receiptPhotos.length === 0 ? (
                    <label
                      htmlFor="input-file-receipt"
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 bg-white/70 hover:bg-blue-50/30 flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition group"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center mb-0.5 transition">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
                        Klik untuk Unggah Berkas
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        Format JPG, PNG, atau scan PDF
                      </span>
                    </label>
                  ) : (
                    /* Thumbnail List */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                      {receiptPhotos.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex items-center justify-center">
                          <img
                            src={url}
                            alt={`Bukti Penerimaan ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                            onClick={() => setFullscreenImage({ title: `Bukti Penerimaan Material (File #${idx + 1})`, url })}
                          />
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveReceiptPhoto(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md cursor-pointer transition"
                            title="Hapus foto ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="file"
                      id="input-file-receipt"
                      multiple
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileSelectReceipt}
                    />
                    <label
                      htmlFor="input-file-receipt"
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{receiptPhotos.length > 0 ? 'Tambah Berkas' : 'Pilih Berkas'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleMockAddReceipt}
                      className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Kamera</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Catatan Pengambilan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Pengambilan Rekanan:
                </label>
                <textarea
                  rows={2}
                  value={vendorReceiptNote}
                  onChange={(e) => setVendorReceiptNote(e.target.value)}
                  placeholder="Contoh: Material diambil lengkap, ada selisih kabel 5 meter..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadSjWo(null)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi Diterima & Kirim ke Pengawas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LAPORAN PENGEMBALIAN (RETUR) SISA MATERIAL KE GUDANG              */}
      {/* ========================================================================= */}
      {realizationWo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-bold text-sm">Laporan Pengembalian (Retur) Sisa Material ke Gudang</h3>
                  <p className="text-[11px] text-emerald-100">
                    WO: {realizationWo.noWorkOrder || realizationWo.id} • Pelanggan: {realizationWo.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRealizationWo(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRealization} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Jika seluruh material <b>habis terpasang</b> di lokasi, gunakan tombol cepat di samping. Jika ada sisa barang yang dikembalikan ke Gudang PLN, cukup isi kolom <b>Qty Retur Gudang</b>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePasangSemua}
                  className="px-3.5 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition shadow-2xs whitespace-nowrap"
                >
                  ⚡ Semua Terpasang (Nihil Retur)
                </button>
              </div>

              {/* Tabel Rincian Realisasi & Retur */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Material</th>
                      <th className="py-2.5 px-3 text-center">Satuan</th>
                      <th className="py-2.5 px-3 text-center">Qty Diambil (SJ)</th>
                      <th className="py-2.5 px-3 text-center w-32 bg-emerald-50 text-emerald-800">Qty Terpasang</th>
                      <th className="py-2.5 px-3 text-center w-32 bg-rose-50 text-rose-800">Qty Retur Gudang</th>
                      <th className="py-2.5 px-3 text-center w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {realizationItems.map((it, idx) => {
                      const isFullInstalled = it.qtyInstalled === it.qtyTaken && it.qtyReturned === 0;
                      const hasRetur = it.qtyReturned > 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {it.material}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{it.unit}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {it.qtyTaken}
                          </td>
                          {/* Input Qty Terpasang */}
                          <td className="py-2 px-3 text-center bg-emerald-50/40">
                            <input
                              type="number"
                              min="0"
                              max={it.qtyTaken}
                              step="any"
                              value={it.qtyInstalled}
                              onChange={(e) => handleRealizationInstalledChange(it.material, parseFloat(e.target.value) || 0)}
                              className="w-20 p-1 text-center font-mono font-bold rounded-lg border border-emerald-300 text-emerald-900 bg-white text-xs focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </td>
                          {/* Input Qty Retur */}
                          <td className="py-2 px-3 text-center bg-rose-50/40">
                            <input
                              type="number"
                              min="0"
                              max={it.qtyTaken}
                              step="any"
                              value={it.qtyReturned}
                              onChange={(e) => handleRealizationReturnChange(it.material, parseFloat(e.target.value) || 0)}
                              className="w-20 p-1 text-center font-mono font-bold rounded-lg border border-rose-300 text-rose-900 bg-white text-xs focus:ring-2 focus:ring-rose-500/20"
                            />
                          </td>
                          {/* Status Badge */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {isFullInstalled ? (
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                                Terpasang Penuh
                              </span>
                            ) : hasRetur ? (
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                                Retur {it.qtyReturned} {it.unit}
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
                                Selisih
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Catatan Realisasi Vendor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Sisa / Keterangan Pengembalian ke Gudang:
                </label>
                <textarea
                  rows={2}
                  value={vendorRealizationNote}
                  onChange={(e) => setVendorRealizationNote(e.target.value)}
                  placeholder="Contoh: Sisa potongan kabel 15 meter tidak terpakai telah diserahkan kembali ke gudang UP3..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRealizationWo(null)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Kirim Pemberitahuan Retur ke Pengawas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: LIHAT DOKUMEN SURAT JALAN & BUKTI PENERIMAAN MATERIAL             */}
      {/* ========================================================================= */}
      {viewSjPhotoWo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs font-mono">
                  Dokumen Surat Jalan: {viewSjPhotoWo.suratJalanNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewSjPhotoWo(null)}
                className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const allSjRecords: NonNullable<WorkOrderRecord['suratJalanList']> = viewSjPhotoWo.suratJalanList && viewSjPhotoWo.suratJalanList.length > 0
                ? viewSjPhotoWo.suratJalanList
                : (viewSjPhotoWo.suratJalanNumber ? [{
                    suratJalanNumber: viewSjPhotoWo.suratJalanNumber,
                    suratJalanDate: viewSjPhotoWo.suratJalanDate || '',
                    giNumber: viewSjPhotoWo.giNumber,
                    photos: viewSjPhotoWo.suratJalanPhotos || (viewSjPhotoWo.suratJalanPhoto ? [viewSjPhotoWo.suratJalanPhoto] : []),
                    notes: viewSjPhotoWo.vendorReceiptNotes,
                  }] : []);

              const activeSj = allSjRecords[selectedSjIndex] || allSjRecords[0];

              // Cari data material yang tercatat pada Surat Jalan ini
              const matchedTx = vendorPickupTransactions.find(
                (tx) => tx.woId === viewSjPhotoWo.id && tx.suratJalanNumber === activeSj?.suratJalanNumber
              );

              const itemsToShow: { material: string; qtyTaken: number }[] = (activeSj?.items && activeSj.items.length > 0)
                ? activeSj.items
                : (matchedTx?.items?.map(it => ({ material: it.material, qtyTaken: it.qtyTakenCurrent })) || []);

              return (
                <>
                  {/* Selector Tab Jika Ada Lebih Dari 1 Surat Jalan */}
                  {allSjRecords.length > 1 && (
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
                      <span className="text-[10.5px] font-bold text-slate-600 shrink-0">
                        Pilih Surat Jalan Bertahap ({allSjRecords.length}):
                      </span>
                      {allSjRecords.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSjIndex(idx)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            selectedSjIndex === idx
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Tahap #{allSjRecords.length - idx}: {s.suratJalanNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Info Metadata Surat Jalan: Vendor, No SJ, No Reservasi, No GI, Tgl */}
                  <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Vendor Pelaksana:</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate block" title={viewSjPhotoWo.vendor}>
                        {viewSjPhotoWo.vendor || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">No. Surat Jalan:</span>
                      <span className="font-bold font-mono text-slate-800 text-[11px] truncate block">
                        {activeSj?.suratJalanNumber || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">No. Reservasi:</span>
                      <span className="font-bold font-mono text-slate-800 text-[11px] truncate block">
                        {viewSjPhotoWo.reservationNumber || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">No. GI (Goods Issue):</span>
                      <span className="font-bold font-mono text-slate-800 text-[11px] truncate block">
                        {activeSj?.giNumber || viewSjPhotoWo.giNumber || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Tgl Pengambilan:</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate block">
                        {activeSj?.suratJalanDate || viewSjPhotoWo.suratJalanDate || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 overflow-y-auto space-y-4 flex-1">
                    {/* Seksi 0: Rincian Material yang Diambil pada Surat Jalan Ini */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Boxes className="w-3.5 h-3.5 text-blue-600" />
                          <span>Daftar Material yang Diambil (Klaim SJ)</span>
                        </span>
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {itemsToShow.filter((it: { material: string; qtyTaken: number }) => it.qtyTaken > 0).length} Material
                        </span>
                      </div>

                      {(() => {
                        if (itemsToShow.length === 0) {
                          // Fallback jika data historis belum mencatat item spesifik: tampilkan material WO yang diambil
                          const fallbackMats = (viewSjPhotoWo.materials || []).filter(m => (m.qtyTaken || 0) > 0);
                          if (fallbackMats.length === 0) {
                            return (
                              <div className="p-3 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Tidak ada data rincian material pada dokumen ini.
                              </div>
                            );
                          }
                          return (
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-600 text-[10.5px] uppercase font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="py-2 px-3 text-center w-10">No</th>
                                    <th className="py-2 px-3">Nama Material</th>
                                    <th className="py-2 px-2 text-center w-16">Satuan</th>
                                    <th className="py-2 px-3 text-center w-28 bg-slate-100 text-slate-700">Kebutuhan WO</th>
                                    <th className="py-2 px-3 text-center w-28 bg-blue-50/60 text-blue-900 font-bold">Qty Diambil</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {fallbackMats.map((m, idx) => {
                                    const req = m.qtyAllocated || m.qtyReksis || 1;
                                    return (
                                      <tr key={idx} className="hover:bg-slate-50/60">
                                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                        <td className="py-2 px-3 font-semibold text-slate-800">{m.material}</td>
                                        <td className="py-2 px-2 text-center text-slate-500">{m.unit || 'bh'}</td>
                                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-600 bg-slate-50/50">
                                          {req}
                                        </td>
                                        <td className="py-2 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/30">
                                          {m.qtyTaken}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        }

                        return (
                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 text-slate-600 text-[10.5px] uppercase font-bold border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-3 text-center w-10">No</th>
                                  <th className="py-2 px-3">Nama Material</th>
                                  <th className="py-2 px-2 text-center w-16">Satuan</th>
                                  <th className="py-2 px-3 text-center w-28 bg-slate-100 text-slate-700">Kebutuhan WO</th>
                                  <th className="py-2 px-3 text-center w-28 bg-blue-50/60 text-blue-900 font-bold">Qty Diambil</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {itemsToShow.map((it: { material: string; qtyTaken: number }, idx: number) => {
                                  const origMat = (viewSjPhotoWo.materials || []).find((m) => m.material === it.material);
                                  const req = origMat ? (origMat.qtyAllocated || origMat.qtyReksis || 1) : '-';
                                  return (
                                    <tr key={idx} className={`hover:bg-slate-50/60 ${it.qtyTaken > 0 ? '' : 'opacity-40'}`}>
                                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                      <td className="py-2 px-3 font-semibold text-slate-800">{it.material}</td>
                                      <td className="py-2 px-2 text-center text-slate-500">{origMat?.unit || 'bh'}</td>
                                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-600 bg-slate-50/50">
                                        {req}
                                      </td>
                                      <td className="py-2 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/30">
                                        {it.qtyTaken}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Seksi 1: Foto Berkas Surat Jalan */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Berkas Surat Jalan ({activeSj?.suratJalanNumber || 'Gudang'})</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {(() => {
                            const list = activeSj?.photos && activeSj.photos.length > 0
                              ? activeSj.photos
                              : (viewSjPhotoWo.suratJalanPhotos || []);
                            return `${list.length} File`;
                          })()}
                        </span>
                      </div>
                      {(() => {
                        const list = activeSj?.photos && activeSj.photos.length > 0
                          ? activeSj.photos
                          : (viewSjPhotoWo.suratJalanPhotos && viewSjPhotoWo.suratJalanPhotos.length > 0
                            ? viewSjPhotoWo.suratJalanPhotos
                            : (viewSjPhotoWo.suratJalanPhoto ? [viewSjPhotoWo.suratJalanPhoto] : []));
                        if (list.length === 0) {
                          return <p className="text-xs text-slate-400 italic">Belum ada foto surat jalan yang diunggah.</p>;
                        }
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {list.map((url, idx) => (
                              <div
                                key={idx}
                                className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex items-center justify-center cursor-pointer hover:shadow-md transition"
                                onClick={() => setFullscreenImage({ title: `Surat Jalan (File #${idx + 1})`, url })}
                              >
                                <img src={url} alt={`Surat Jalan ${idx + 1}`} className="w-full h-full object-cover" />
                                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
                                  SJ #{idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Seksi 2: Foto Bukti Penerimaan Material */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          <span>Foto Bukti Penerimaan Material di Gudang</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {(viewSjPhotoWo.receiptPhotos || []).length} File
                        </span>
                      </div>
                      {(() => {
                        const list = viewSjPhotoWo.receiptPhotos || [];
                        if (list.length === 0) {
                          return <p className="text-xs text-slate-400 italic">Belum ada foto bukti penerimaan yang diunggah.</p>;
                        }
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {list.map((url, idx) => (
                              <div
                                key={idx}
                                className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex items-center justify-center cursor-pointer hover:shadow-md transition"
                                onClick={() => setFullscreenImage({ title: `Bukti Penerimaan Material (File #${idx + 1})`, url })}
                              >
                                <img src={url} alt={`Bukti Penerimaan ${idx + 1}`} className="w-full h-full object-cover" />
                                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
                                  Bukti #{idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </>
              );
            })()}

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-end text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewSjPhotoWo(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: UPDATE PROGRES JASA KONSTRUKSI LAPANGAN (VENDOR)               */}
      {/* ========================================================================= */}
      {progressWo && (() => {
        const totalRencanaRp = progressJasaItems.reduce((sum, it) => sum + (it.qtyTarget * (it.hargaSatuan || 0)), 0);
        const totalRealisasiRp = progressJasaItems.reduce((sum, it) => sum + ((it.qtyRealisasi || 0) * (it.hargaSatuan || 0)), 0);
        const overrunItems = progressJasaItems.filter((it) => (it.qtyRealisasi || 0) > it.qtyTarget);

        const subKategoriList: string[] = [];
        const groupedMap = new Map<string, { item: WoJasaItem; originalIndex: number }[]>();
        
        progressJasaItems.forEach((item, originalIndex) => {
          const sub = item.subKategori || 'KELOMPOK JASA';
          if (!groupedMap.has(sub)) {
            groupedMap.set(sub, []);
            subKategoriList.push(sub);
          }
          groupedMap.get(sub)!.push({ item, originalIndex });
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Modal */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 rounded-t-2xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        Update Progres Jasa Konstruksi Lapangan
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        progressWo.category === 'WO Paket 1'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : progressWo.category === 'WO Paket 2'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {progressWo.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Mode Rekanan Vendor
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No. WO: <b className="text-slate-800 font-mono">{progressWo.id}</b> • SPK: <b className="text-slate-800 font-mono">{progressWo.spkNumber || '-'}</b> • Vendor: <b className="text-slate-800">{progressWo.vendor}</b> • Pelanggan: <b className="text-slate-800">{progressWo.customerName}</b>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProgressWo(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Modal */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Info Workflow Verifikasi Pengawas */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 shadow-2xs">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <p className="font-bold">
                      ℹ️ Mekanisme Pelaporan Progres Vendor:
                    </p>
                    <p className="text-[11px] text-blue-800">
                      Volume realisasi yang Anda input akan diajukan ke <b>Pengawas Lapangan PLN</b> untuk diverifikasi fisik di lapangan. Progres resmi akan diperbarui setelah mendapat persetujuan pengawas.
                    </p>
                  </div>
                </div>

                {/* Banner Status Ditolak Sebelumnya (Jika Ada) */}
                {progressWo.progressStatus === 'DITOLAK' && progressWo.progressRejectedReason && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-950 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-900">Pengajuan Sebelumnya Ditolak oleh Pengawas:</span>
                      <p className="text-[11px] text-rose-800 mt-0.5 bg-white/70 p-2 rounded-lg border border-rose-200 font-mono">
                        &quot;{progressWo.progressRejectedReason}&quot;
                      </p>
                      <p className="text-[10.5px] text-rose-700 mt-1">
                        Silakan periksa kembali volume realisasi fisik di bawah ini, sesuaikan dengan arahan pengawas, lalu ajukan ulang.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Kesiapan Material Gudang & Quick Action Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs">
                  {(() => {
                    const matProg = calculateMaterialProgress(progressWo);
                    return (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Package className={`w-4 h-4 shrink-0 ${matProg === 100 ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span>
                          Status Pasokan Material:{' '}
                          <b className={matProg === 100 ? 'text-emerald-700' : 'text-amber-700'}>
                            {matProg}%
                          </b>{' '}
                          {matProg === 100 ? '(Material Lengkap Diambil)' : '(Dalam Proses Gudang)'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Tombol Aksi Cepat / Shortcut Masal */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSetAll100Percent}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Set semua volume realisasi sama dengan target rencana (100%)"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Set Realisasi 100% Semua</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Reset semua volume realisasi ke 0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset 0%</span>
                    </button>
                  </div>
                </div>

                {/* Warning Alert Banner jika Terdeteksi Volume Lebih (Overrun) */}
                {overrunItems.length > 0 && (
                  <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        <span>⚠️ Terdeteksi Volume Tambah (Overrun) pada {overrunItems.length} item pekerjaan</span>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] bg-amber-200 text-amber-950 font-bold font-mono">
                          Selisih: +Rp {(totalRealisasiRp - totalRencanaRp > 0 ? totalRealisasiRp - totalRencanaRp : 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Sesuai ketentuan KHS PLN, selisih volume fisik lebih ini memerlukan dokumen <b>Justifikasi Teknis (Justek) Lapangan</b> dan persetujuan <b>Addendum WO</b> sebelum dapat disahkan oleh pengawas.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabel Kelompok Jasa yang Ada di Isian WO */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Isian Kelompok Jasa Pekerjaan (Sesuai Dokumen WO / RAB Kontrak)
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                        {progressJasaItems.length} Item Jasa
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Input <b className="text-slate-800">Volume Realisasi</b> fisik lapangan untuk menghitung capaian progres jasa
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                    <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
                      <thead className="bg-[#f8fafc] text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3 min-w-[200px]">Uraian Item Kelompok Jasa</th>
                          <th className="py-2.5 px-3 text-center w-16">Satuan</th>
                          <th className="py-2.5 px-3 text-right w-24">Harga Satuan</th>
                          <th className="py-2.5 px-3 text-center w-24 bg-blue-50/40">Vol. Rencana</th>
                          <th className="py-2.5 px-3 text-center min-w-[155px] bg-amber-50/40">Vol. Realisasi</th>
                          <th className="py-2.5 px-3 text-center min-w-[130px] bg-emerald-50/30">Bukti Foto</th>
                          <th className="py-2.5 px-3 text-center min-w-[180px] bg-rose-50/30">Laporan Kendala Lapangan</th>
                          <th className="py-2.5 px-3 text-right w-28">Nilai Realisasi</th>
                          <th className="py-2.5 px-3 text-center w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subKategoriList.map((subKatName) => {
                          const itemsInGroup = groupedMap.get(subKatName) || [];
                          return (
                            <React.Fragment key={subKatName}>
                              {/* Sub Header Kategori */}
                              <tr className="bg-slate-100/90 border-y border-slate-200">
                                <td colSpan={10} className="py-2 px-3">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                                    <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{subKatName}</span>
                                    <span className="text-[9.5px] text-slate-500 font-normal ml-1">
                                      ({itemsInGroup.length} item pekerjaan)
                                    </span>
                                  </div>
                                </td>
                              </tr>

                              {itemsInGroup.map(({ item, originalIndex }) => {
                                const rQty = item.qtyRealisasi !== undefined ? item.qtyRealisasi : 0;
                                const pct = item.qtyTarget > 0 ? Math.round((rQty / item.qtyTarget) * 100) : (rQty > 0 ? 100 : 0);
                                const isOver = rQty > item.qtyTarget;
                                const isExact = rQty === item.qtyTarget && item.qtyTarget > 0;
                                const isUnder = rQty > 0 && rQty < item.qtyTarget;
                                const isZero = rQty === 0;

                                const itemHarga = item.hargaSatuan || 0;
                                const nilaiRencana = item.qtyTarget * itemHarga;
                                const nilaiRealisasi = rQty * itemHarga;
                                const selisihNilai = nilaiRealisasi - nilaiRencana;

                                return (
                                  <tr 
                                    key={originalIndex} 
                                    className={`hover:bg-blue-50/30 transition-colors ${
                                      isOver 
                                        ? 'bg-amber-50/30' 
                                        : isExact 
                                        ? 'bg-emerald-50/20' 
                                        : isUnder 
                                        ? 'bg-blue-50/20' 
                                        : ''
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] align-middle">
                                      {originalIndex + 1}
                                    </td>
                                    <td className="py-2.5 px-3 align-middle">
                                      <div className="font-semibold text-slate-900 leading-snug">
                                        {item.deskripsi}
                                      </div>
                                      {item.kode && (
                                        <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                                          Kode: {item.kode}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-medium text-slate-600 align-middle">
                                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10.5px]">
                                        {item.unit}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 text-[11px] align-middle">
                                      Rp {itemHarga.toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-bold text-slate-800 bg-blue-50/20 font-mono align-middle">
                                      <span className="text-xs">{item.qtyTarget}</span>{' '}
                                      <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center bg-amber-50/20 align-middle">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <input
                                          type="number"
                                          min={0}
                                          max={item.qtyTarget * 2.5}
                                          step="any"
                                          value={rQty}
                                          onChange={(e) => handleUpdateItemRealisasi(originalIndex, parseFloat(e.target.value) || 0)}
                                          className={`w-24 px-2 py-1 text-xs text-center font-bold bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono transition ${
                                            isOver
                                              ? 'border-amber-400 text-amber-900 bg-amber-50/40 ring-1 ring-amber-300'
                                              : isExact 
                                              ? 'border-emerald-400 text-emerald-800 bg-emerald-50/30' 
                                              : isUnder 
                                              ? 'border-blue-400 text-blue-900 bg-blue-50/30' 
                                              : 'border-slate-300 text-slate-700'
                                          }`}
                                        />
                                        <span className="text-[10.5px] text-slate-500 font-medium">{item.unit}</span>
                                      </div>
                                      {/* Shortcut Chips: 0%, 50%, 100% */}
                                      <div className="flex items-center justify-center gap-1 mt-1">
                                        <button
                                          type="button"
                                          onClick={() => handleSetItemPercent(originalIndex, 0)}
                                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                            isZero ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                          }`}
                                        >
                                          0%
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetItemPercent(originalIndex, 50)}
                                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                            pct === 50 ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                          }`}
                                        >
                                          50%
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetItemPercent(originalIndex, 100)}
                                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                            isExact ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                          }`}
                                        >
                                          100%
                                        </button>
                                      </div>
                                    </td>
                                    {/* Kolom Bukti Foto Progres Lapangan */}
                                    <td className="py-2.5 px-3 align-middle bg-emerald-50/10">
                                      {item.evidencePhoto ? (
                                        <div className="flex items-center gap-1.5 justify-center">
                                          <div className="relative group w-11 h-11 rounded-lg border border-emerald-300 overflow-hidden shrink-0 shadow-2xs bg-white">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={item.evidencePhoto}
                                              alt={item.deskripsi}
                                              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition"
                                              onClick={() => setFullscreenImage(item.evidencePhoto ? { title: item.deskripsi, url: item.evidencePhoto } : null)}
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setFullscreenImage(item.evidencePhoto ? { title: item.deskripsi, url: item.evidencePhoto } : null)}
                                              className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition"
                                              title="Lihat Foto Fullscreen"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveItemPhoto(originalIndex)}
                                              className="p-1 rounded bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition"
                                              title="Hapus Foto"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center gap-1">
                                          <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[10px] font-semibold transition">
                                            <Camera className="w-3 h-3" />
                                            <span>Foto</span>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              capture="environment"
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  const reader = new FileReader();
                                                  reader.onload = (ev) => {
                                                    const res = ev.target?.result as string;
                                                    if (res) handleUpdateItemPhoto(originalIndex, res, `Foto Progres: ${item.deskripsi}`);
                                                  };
                                                  reader.readAsDataURL(file);
                                                }
                                                e.target.value = '';
                                              }}
                                            />
                                          </label>
                                          <span className="text-[9px] text-slate-400">Belum ada</span>
                                        </div>
                                      )}
                                    </td>
                                    {/* Kolom Laporan Kendala Lapangan */}
                                    <td className="py-2.5 px-3 align-middle bg-rose-50/10">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={item.kendala || ''}
                                          onChange={(e) => handleUpdateItemKendala(originalIndex, e.target.value)}
                                          placeholder="Tulis kendala (cuaca, izin warga, dll)..."
                                          className={`w-full px-2 py-1 text-[11px] rounded-lg border transition placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                                            item.kendala && item.kendala.trim()
                                              ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-rose-400'
                                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:ring-blue-400 focus:border-blue-400'
                                          }`}
                                        />
                                        {item.kendala && item.kendala.trim() && (
                                          <div className="flex items-center gap-1 mt-0.5 text-[9px] font-bold text-rose-700">
                                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                            <span>Ada Kendala Terlapor</span>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-right align-middle font-mono">
                                      <div className={`font-bold text-[11px] ${
                                        isOver ? 'text-amber-700' : isExact ? 'text-emerald-700' : isUnder ? 'text-blue-700' : 'text-slate-500'
                                      }`}>
                                        Rp {nilaiRealisasi.toLocaleString('id-ID')}
                                      </div>
                                      <div className="text-[9.5px] text-slate-400">
                                        Target: Rp {nilaiRencana.toLocaleString('id-ID')}
                                      </div>
                                      {isOver && (
                                        <div className="text-[9px] font-bold text-amber-700 font-mono mt-0.5">
                                          +Rp {selisihNilai.toLocaleString('id-ID')} (Lebih)
                                        </div>
                                      )}
                                      {isUnder && (
                                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                          -Rp {Math.abs(selisihNilai).toLocaleString('id-ID')} (Kurang)
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-center align-middle">
                                      {isOver ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs whitespace-nowrap" title="Volume fisik lapangan melebihi target rencana (Memerlukan Justek)">
                                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                          <span>{pct}% (Over)</span>
                                        </span>
                                      ) : isExact ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                                          <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                          <span>100% Sesuai</span>
                                        </span>
                                      ) : isUnder ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs whitespace-nowrap">
                                          <span>{pct}% (Proses)</span>
                                        </span>
                                      ) : (
                                        <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono bg-slate-100 text-slate-500 whitespace-nowrap">
                                          0%
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ringkasan & Akumulasi Progres Total Jasa */}
                <div className="p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 rounded-2xl border border-blue-200 shadow-2xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-tight">Total Nilai Rencana WO</div>
                      <div className="text-base font-black text-slate-800 font-mono mt-0.5">
                        Rp {totalRencanaRp.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Kelompok Jasa WO</div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <div className="text-[10.5px] font-bold text-blue-700 uppercase tracking-tight">Total Realisasi Fisik Lapangan</div>
                      <div className="text-base font-black text-blue-700 font-mono mt-0.5">
                        Rp {totalRealisasiRp.toLocaleString('id-ID')}
                      </div>
                      {totalRealisasiRp > totalRencanaRp ? (
                        <div className="text-[10px] text-amber-700 font-bold mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Lebih: +Rp {(totalRealisasiRp - totalRencanaRp).toLocaleString('id-ID')}</span>
                        </div>
                      ) : totalRealisasiRp === totalRencanaRp && totalRencanaRp > 0 ? (
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Tepat 100% Sesuai Rencana WO</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-blue-500 mt-0.5">
                          Tercapai {progressVal}% dari rencana
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="text-[10.5px] font-bold text-indigo-700 uppercase tracking-tight">Akumulasi Progres Fisik</div>
                        <div className="text-2xl font-black text-blue-700 font-mono mt-0.5">{progressVal}%</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono shadow-2xs ${
                        progressVal > 100 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : progressVal === 100 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : progressVal >= 50 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                          : progressVal > 0 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {progressVal > 100 
                          ? `⚠️ OVERRUN (${progressVal}%)` 
                          : progressVal === 100 
                          ? '✓ TUNTAS 100%' 
                          : progressVal > 0 
                          ? 'DALAM PROSES' 
                          : 'BELUM MULAI'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-950">
                      <span>Akumulasi Capaian Jasa Fisik Lapangan</span>
                      <span className="font-mono">
                        {progressVal}% {progressVal > 100 ? '(Fisik > Target Kontrak)' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200/60 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progressVal > 100 ? 'bg-amber-500' : progressVal === 100 ? 'bg-emerald-500' : progressVal >= 50 ? 'bg-blue-600' : progressVal > 0 ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.min(100, progressVal)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Catatan Lapangan / Kendala dari Vendor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Pekerjaan / Kendala di Lapangan dari Rekanan Vendor:
                  </label>
                  <textarea
                    rows={2}
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder="Contoh: Pekerjaan pondasi dan pemasangan travers telah tuntas 100%, siap untuk diperiksa pengawas..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => setProgressWo(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitProgressVendor}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Ajukan Progres ke Pengawas ({progressVal}%)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 6: Rekap Read-Only Status Capaian Jasa per Sub-Bab */}
      {rekapWo && (
        <ModalRekapProgresJasa
          wo={rekapWo}
          items={getWoJasaItems(rekapWo)}
          onClose={() => setRekapWo(null)}
          onPreviewPhoto={(url) => setFullscreenImage({ title: 'Foto Bukti Progres', url })}
        />
      )}

      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
              <span className="font-bold font-mono">{fullscreenImage.title}</span>
              <button
                type="button"
                onClick={() => setFullscreenImage(null)}
                className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={fullscreenImage.url}
                alt={fullscreenImage.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-2.5 bg-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setFullscreenImage(null)}
                className="px-4 py-1.5 bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
