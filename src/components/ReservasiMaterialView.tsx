'use client';

import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Eye,
  Edit3,
  X,
  Calendar,
  ArrowRight,
  Lock,
  Printer,
  Trash2
} from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { WorkOrderRecord, WoMaterialItem } from '@/types';
import { calculateRabFromSurvey } from '@/data/surveyRabCalculator';
import type { RabRowItem } from '@/data/rabMasterData';

const parseSupervisor = (s?: string) => {
  if (!s || s === '—' || s === '-') return { name: '—', role: '' };
  const parts = s.split('(');
  const name = parts[0].trim();
  const role = parts.length > 1 ? parts[1].replace(')', '').trim() : '';
  return { name, role };
};

export const ReservasiMaterialView: React.FC = () => {
  const { 
    workOrders, 
    stocks, 
    surveys,
    customKhsPrices,
    reserveMaterialWo,
    replaceMaterialWo,
    updateWoMaterialItem,
    holdMaterialWo,
    unholdMaterialWo,
    deleteWorkOrder,
    showToast,
    setCurrentPage
  } = usePromotorStore();

  const [activeTab, setActiveTab] = useState<'all' | 'belum' | 'terbit' | 'selesai' | 'hold'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // --------------------------------------------------------------------------
  // MODAL 1: Form Reservasi Material Gudang
  // --------------------------------------------------------------------------
  const [reservationWo, setReservationWo] = useState<WorkOrderRecord | null>(null);
  const [resNumber, setResNumber] = useState('');
  const [resNumberNonStock, setResNumberNonStock] = useState('');
  const [resDate, setResDate] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [viewSuratJalanModal, setViewSuratJalanModal] = useState<{ wo: WorkOrderRecord; type: 'STOK' | 'NON_STOK' } | null>(null);

  // --------------------------------------------------------------------------
  // MODAL 2: Sub-modal Substitusi Material
  // --------------------------------------------------------------------------
  const [substituteItem, setSubstituteItem] = useState<WoMaterialItem | null>(null);
  const [selectedAltStockCode, setSelectedAltStockCode] = useState('');
  const [substituteQty, setSubstituteQty] = useState<number>(1);
  const [substituteReason, setSubstituteReason] = useState('');
  const [substituteSearch, setSubstituteSearch] = useState('');
  const [substituteCategory, setSubstituteCategory] = useState('ALL');

  // Kategori stok unik yang memiliki stok fisik > 0
  const availableStockCategories = useMemo(() => {
    const cats = new Set<string>();
    stocks.forEach((s) => {
      if ((s.qtyFisik ?? s.qtySisa) > 0 && s.category) {
        cats.add(s.category);
      }
    });
    return Array.from(cats).sort();
  }, [stocks]);

  // Filter daftar stok pengganti berdasarkan pencarian dan kategori
  const filteredSubstituteStocks = useMemo(() => {
    return stocks.filter((s) => {
      const hasStock = (s.qtyFisik ?? s.qtySisa) > 0;
      if (!hasStock) return false;

      if (substituteCategory !== 'ALL' && s.category !== substituteCategory) {
        return false;
      }

      if (substituteSearch.trim()) {
        const q = substituteSearch.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = s.code.toLowerCase().includes(q);
        const matchCat = (s.category || '').toLowerCase().includes(q);
        return matchName || matchCode || matchCat;
      }

      return true;
    });
  }, [stocks, substituteCategory, substituteSearch]);

  // --------------------------------------------------------------------------
  // MODAL 2B: Sub-modal Edit Material WO
  // --------------------------------------------------------------------------
  const [editingWoItem, setEditingWoItem] = useState<{
    originalMaterial: string;
    material: string;
    kode: string;
    qty: number;
    unit: string;
    catatan: string;
  } | null>(null);

  // --------------------------------------------------------------------------
  // MODAL 3: Sub-modal Hold Reservasi
  // --------------------------------------------------------------------------
  const [holdTargetWo, setHoldTargetWo] = useState<WorkOrderRecord | null>(null);
  const [holdReasonInput, setHoldReasonInput] = useState('');

  // --------------------------------------------------------------------------
  // MODAL 3B: Sub-modal Hold Item Material (dengan Input Keterangan Pengawas)
  // --------------------------------------------------------------------------
  const [holdTargetItem, setHoldTargetItem] = useState<WoMaterialItem | null>(null);
  const [itemHoldReasonInput, setItemHoldReasonInput] = useState('');

  // --------------------------------------------------------------------------
  // MODAL 4: Detail Material WO
  // --------------------------------------------------------------------------
  const [detailWo, setDetailWo] = useState<WorkOrderRecord | null>(null);

  // Filter WO yang berstatus APPROVED atau dalam tahap pengerjaan
  const approvedWos = useMemo(() => {
    return workOrders.filter(
      (w) => w.approvalStatus === 'APPROVED' || w.status === 'Konstruksi' || w.status === 'Verifikasi SJ' || w.status === 'Selesai' || w.status === 'Closeout'
    );
  }, [workOrders]);

  // Helper pencarian stok gudang untuk material secara cerdas
  const findMatchingStock = (matName: string, matKode?: string) => {
    const norm = matName.toLowerCase();

    // 1. Cek kode SAP persis terlebih dahulu jika ada
    if (matKode && matKode !== '-' && matKode !== '—') {
      const matchByCode = stocks.find((s) => s.code.toLowerCase() === matKode.toLowerCase());
      if (matchByCode) return matchByCode;
    }

    // 2. Tiang Beton = NON-STOK (dari Vendor Pabrikan UID, bukan stok gudang PLN)
    // Tiang tidak pernah ada di gudang PLN, selalu return null
    const isConcretePole = (norm.includes('pole;concrete') || norm.startsWith('tiang beton') || (norm.includes('tiang') && !norm.includes('serandang') && !norm.includes('trafo')));
    if (isConcretePole || (matKode && matKode.toLowerCase().includes('tng'))) {
      return null; // Tiang bukan stok gudang PLN, dari Vendor Pabrikan Rekanan UID
    }

    // 3. Cek nama persis atau saling include
    const exactOrSub = stocks.find((s) => {
      const sName = s.name.toLowerCase();
      return sName === norm || sName.includes(norm) || norm.includes(sName);
    });
    if (exactOrSub) return exactOrSub;

    // 3. Pencocokan Cerdas Kata Kunci PLN UP3 Banten Selatan:
    // A. Konduktor A3CS 150 / AAAC-S
    if (norm.includes('a3cs') || (norm.includes('konduktor') && norm.includes('150')) || norm.includes('aaac-s')) {
      return stocks.find((s) => s.code === '3050084' || s.name.toLowerCase().includes('aaac-s;150'));
    }

    // B. Trafo Distribusi berdasarkan kapasitas kVA
    if (norm.includes('trafo') || norm.includes('trf')) {
      if (norm.includes('250')) return stocks.find((s) => s.code === '1030077' || s.name.includes('250kVA'));
      if (norm.includes('160')) return stocks.find((s) => s.code === '1030075' || s.name.includes('160kVA'));
      if (norm.includes('100')) return stocks.find((s) => s.code === '1030074' || s.name.includes('100kVA'));
      if (norm.includes('50'))  return stocks.find((s) => s.code === '1030097' || s.name.includes('50kVA'));
      if (norm.includes('400')) return stocks.find((s) => s.code === '1030114' || s.name.includes('400kVA'));
      return stocks.find((s) => s.category.toLowerCase() === 'trafo');
    }

    // C. Cut Out Fused (FCO)
    if (norm.includes('fco') || norm.includes('cut out') || norm.includes('fuse link')) {
      return stocks.find((s) => s.code === '3190012' || s.name.toLowerCase().includes('cut out'));
    }

    // D. Lightning Arrester (LA)
    if (norm.includes('arrester') || norm.includes('(la)') || norm.includes('la 20') || norm.startsWith('la ')) {
      return stocks.find((s) => s.code === '2090032' || s.name.toLowerCase().startsWith('la;'));
    }

    // E. Travers / Cross Arm
    if (norm.includes('travers') || norm.includes('cross arm') || norm.includes('crossarm') || norm.includes('cr arm')) {
      return stocks.find((s) => s.code === '3040035' || s.code === '3041017' || s.name.toLowerCase().includes('cr arm'));
    }

    // F. Isolator
    if (norm.includes('isolator')) {
      if (norm.includes('tumpu') || norm.includes('pinpost') || norm.includes('pin post')) {
        return stocks.find((s) => s.code === '3070151');
      }
      if (norm.includes('tarik') || norm.includes('strain') || norm.includes('hang')) {
        return stocks.find((s) => s.code === '3070160');
      }
      return stocks.find((s) => s.category.toLowerCase() === 'isolator');
    }

    // G. LVSB / PHB-TR
    if (norm.includes('lvsb') || norm.includes('phb-tr') || norm.includes('phb tr')) {
      return stocks.find((s) => s.category.toLowerCase() === 'panel' || s.name.toLowerCase().includes('lvsb'));
    }

    // H. Kabel Twisted TR (LVTC / NFA2X-T)
    if (norm.includes('lvtc') || norm.includes('twisted') || norm.includes('nfa2x')) {
      return stocks.find((s) => s.code === '3110542' || s.name.toLowerCase().includes('nfa2x'));
    }

    // I. Box APP
    if (norm.includes('app') || norm.includes('kwh')) {
      return stocks.find((s) => s.category.toLowerCase() === 'app' || s.code === '4120474');
    }

    return null;
  };

  // Helper cek apakah suatu material adalah Tiang Beton
  const isTiangMaterial = (m: WoMaterialItem) => {
    const k = (m.kategori || '').trim().toUpperCase();
    if (k.includes('TIANG')) return true;
    const norm = m.material.toLowerCase();
    if (norm.includes('pole;concrete') || norm.startsWith('tiang beton')) return true;
    if (norm.includes('tiang') && !norm.includes('serandang') && !norm.includes('trafo')) return true;
    if (m.kode && m.kode.toLowerCase().includes('tng')) return true;
    return false;
  };

  // Helper cek apakah WO adalah WO Tiang
  const isTiangWo = (wo: WorkOrderRecord) => {
    if (wo.category === 'WO Tiang' || wo.id.includes('.WO.TB.')) return true;
    const mats = wo.materials || [];
    return mats.length > 0 && mats.every((m) => isTiangMaterial(m));
  };

  // Status ketersediaan stok fisik gudang untuk sebuah WO
  // - WO Tiang: selalu "Siap Kirim (Pabrikan)" karena tiang dari vendor pabrikan, bukan dari gudang
  // - WO biasa: cek stok material gudang PLN UP3
  const checkWoStockStatus = (wo: WorkOrderRecord) => {
    // WO Tiang = semua material non-stok, selalu tersedia via Vendor Pabrikan UID
    if (wo.category === 'WO Tiang' || wo.id.includes('.WO.TB.')) {
      return { status: 'Pabrikan', label: 'Siap Kirim (Pabrikan Rekanan)', color: 'indigo' };
    }

    let totalItems = 0;
    let deficitItems = 0;

    (wo.materials || []).forEach((m) => {
      if (isTiangMaterial(m)) return; // Tiang di WO biasa tidak dihitung (harusnya tidak ada)
      totalItems++;
      const stock = findMatchingStock(m.material, m.kode);
      const req = m.qtyAllocated || m.qtyReksis || 1;
      if (!stock || stock.qtyFisik < req) {
        deficitItems++;
      }
    });

    if (totalItems === 0) return { status: 'Tersedia', label: 'Material Aman', color: 'emerald' };
    if (deficitItems === 0) return { status: 'Aman', label: 'Semua Stok Cukup di Gudang', color: 'emerald' };
    return { status: 'Kurang', label: `${deficitItems} Material Menipis/Kosong`, color: 'amber' };
  };

  // Helper label & format Kelompok Material (Kelompok A, B, C, D)
  const getKelompokMaterial = (m: WoMaterialItem) => {
    const k = (m.kategori || '').trim().toUpperCase();
    if (k.startsWith('A.') || k.startsWith('B.') || k.startsWith('C.') || k.startsWith('D.')) {
      return k;
    }
    if (k.includes('GARDU')) return 'A. MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN';
    if (k.includes('SKTM') || k.includes('SUTM') || k.includes('SKUTM') || k.includes('KABEL TM') || k.includes('KONDUKTOR')) {
      return 'B. MATERIAL SKTM/SUTM/SKUTM';
    }
    if (k.includes('ACESSORIES') || k.includes('AKSESORI') || k.includes('INSTALASI GARDU')) {
      return 'C. ACESSORIES SUTM, SKUTM, DAN INSTALASI GARDU';
    }
    if (k.includes('TIANG')) return 'D. TIANG BETON';

    const norm = m.material.toLowerCase();
    if (norm.includes('pole;concrete') || norm.startsWith('tiang beton')) {
      return 'D. TIANG BETON';
    }
    if (norm.includes('conductor') || norm.includes('aaac') || norm.includes('a3cs')) {
      return 'B. MATERIAL SKTM/SUTM/SKUTM';
    }
    if (norm.includes('conn;') || norm.includes('cover') || norm.includes('pipa arde')) {
      return 'C. ACESSORIES SUTM, SKUTM, DAN INSTALASI GARDU';
    }
    if (norm.includes('lvtc') || norm.includes('app') || norm.includes('kabel tr') || norm.includes('meter')) {
      return 'KELOMPOK MATERIAL JTR';
    }
    return 'A. MATERIAL GARDU DISTRIBUSI DAN LENGKAPAN';
  };

  // Helper ambil kuantitas yang sudah diambil per jalur (SAP vs Non-SAP)
  const getTakenByChannel = (m: WoMaterialItem) => {
    const isTiang = isTiangMaterial(m);
    const totalTaken = m.qtyTaken || (m.isTaken ? (m.qtyAllocated || m.qtyReksis || 1) : 0);
    if (m.qtyTakenSap !== undefined || m.qtyTakenNonSap !== undefined) {
      return {
        sap: m.qtyTakenSap || 0,
        nonSap: m.qtyTakenNonSap || 0,
      };
    }
    const resSap = m.qtyReservedSap !== undefined ? m.qtyReservedSap : (isTiang ? 0 : (m.qtyReserved || totalTaken));
    const takenSap = isTiang ? 0 : Math.min(totalTaken, resSap);
    const takenNonSap = isTiang ? totalTaken : Math.max(0, totalTaken - takenSap);
    return { sap: takenSap, nonSap: takenNonSap };
  };

  // Helper status reservasi WO
  const isWoReservationIssued = (w: WorkOrderRecord) => {
    if (w.isHold || w.reservationStatus === 'Hold') return false;
    return Boolean(
      w.reservationNumber ||
      w.reservationNumberNonStock ||
      w.reservationStatus === 'Siap Ambil' ||
      w.reservationStatus === 'Siap Ambil Sebagian' ||
      w.reservationStatus === 'Reservasi Sebagian' ||
      w.reservationStatus === 'Selesai' ||
      w.reservationStatus === 'Suplai Pabrikan' ||
      (w.materials || []).some((m) => (m.qtyReserved || 0) > 0 || (m.qtyTaken || 0) > 0)
    );
  };

  const isWoAllMaterialTaken = (w: WorkOrderRecord) => {
    const mats = w.materials || [];
    if (mats.length === 0 || !isWoReservationIssued(w)) return false;
    return mats.every((m) => {
      if (m.isHold) return false;
      const req = m.qtyAllocated || m.qtyReksis || 1;
      return (m.qtyTaken || 0) >= req;
    });
  };

  // Filter list WO berdasarkan tab dan pencarian
  const filteredWos = useMemo(() => {
    let list = approvedWos;

    if (activeTab === 'belum') {
      list = list.filter((w) => !isWoReservationIssued(w) && !w.isHold && w.reservationStatus !== 'Hold');
    } else if (activeTab === 'terbit') {
      list = list.filter((w) => isWoReservationIssued(w) && !isWoAllMaterialTaken(w));
    } else if (activeTab === 'selesai') {
      list = list.filter((w) => isWoAllMaterialTaken(w));
    } else if (activeTab === 'hold') {
      list = list.filter((w) => w.isHold || w.reservationStatus === 'Hold' || (w.materials || []).some((m) => m.isHold));
    }

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter(
      (w) =>
        w.id.toLowerCase().includes(term) ||
        w.customerName.toLowerCase().includes(term) ||
        w.vendor.toLowerCase().includes(term) ||
        (w.spkNumber && w.spkNumber.toLowerCase().includes(term)) ||
        (w.reservationNumber && w.reservationNumber.toLowerCase().includes(term)) ||
        (w.reservationNumberNonStock && w.reservationNumberNonStock.toLowerCase().includes(term)) ||
        (w.supervisor1 && w.supervisor1.toLowerCase().includes(term)) ||
        (w.supervisor2 && w.supervisor2.toLowerCase().includes(term))
    );
  }, [approvedWos, activeTab, searchTerm]);

  // Statistik ringkasan
  const summaryStats = useMemo(() => {
    const total = approvedWos.length;
    const belum = approvedWos.filter((w) => !isWoReservationIssued(w) && !w.isHold && w.reservationStatus !== 'Hold').length;
    const terbit = approvedWos.filter((w) => isWoReservationIssued(w) && !isWoAllMaterialTaken(w)).length;
    const selesai = approvedWos.filter((w) => isWoAllMaterialTaken(w)).length;
    const hold = approvedWos.filter((w) => w.isHold || w.reservationStatus === 'Hold' || (w.materials || []).some((m) => m.isHold)).length;
    return { total, belum, terbit, selesai, hold };
  }, [approvedWos]);

  // Handler Open Reservasi
  const handleOpenReservation = (wo: WorkOrderRecord) => {
    let currentMats = wo.materials ? [...wo.materials] : [];
    const isThisTiangWo = isTiangWo(wo);

    const matchedSurvey = (surveys || []).find(
      (s) => s.id === wo.surveyId || 
             s.idpel === wo.idpel || 
             s.customerName.toLowerCase().includes(wo.customerName.toLowerCase()) ||
             wo.customerName.toLowerCase().includes(s.customerName.toLowerCase())
    );

    if (isThisTiangWo) {
      if (currentMats.length === 0) {
        if (matchedSurvey && matchedSurvey.poles && matchedSurvey.poles.length > 0) {
          const isTiangRabRow = (r: RabRowItem) => {
            const sub = (r.subSection || '').toUpperCase();
            const desc = (r.desc || '').toLowerCase();
            return sub.includes('TIANG') || desc.includes('pole;concrete') || desc.startsWith('tiang beton') || (desc.includes('tiang') && !desc.includes('serandang') && !desc.includes('trafo'));
          };
          const rabP1 = calculateRabFromSurvey(matchedSurvey, 'paket1', customKhsPrices);
          const rabP2 = calculateRabFromSurvey(matchedSurvey, 'paket2', customKhsPrices);
          const tiangRows = [...rabP1, ...rabP2].filter((r) => !r.isHeader && r.rencanaVol > 0 && r.section === 'MATERIAL' && isTiangRabRow(r));
          if (tiangRows.length > 0) {
            currentMats = tiangRows.map((r) => ({
              material: r.desc,
              kode: r.kode || undefined,
              qtyReksis: r.rencanaVol,
              qtyAllocated: r.rencanaVol,
              unit: r.sat || 'btg',
              kategori: 'D. TIANG BETON',
              hargaSatuan: r.hargaSatuan,
            }));
          }
        }
      }
    } else {
      if (currentMats.length <= 4 && matchedSurvey && matchedSurvey.poles && matchedSurvey.poles.length > 0) {
        const paketType = wo.category === 'WO Paket 1' ? 'paket1' : 'paket2';
        const rab = calculateRabFromSurvey(matchedSurvey, paketType, customKhsPrices);
        const matRows = rab.filter((r) => {
          if (r.isHeader || r.rencanaVol <= 0 || r.section !== 'MATERIAL') return false;
          const sub = (r.subSection || '').toUpperCase();
          const desc = (r.desc || '').toLowerCase();
          const isTiangRow = sub.includes('TIANG') || desc.includes('pole;concrete') || desc.startsWith('tiang beton') || (desc.includes('tiang') && !desc.includes('serandang') && !desc.includes('trafo'));
          return !isTiangRow;
        });
        if (matRows.length > 0) {
          currentMats = matRows.map((r) => ({
            material: r.desc,
            kode: r.kode || undefined,
            qtyReksis: r.rencanaVol,
            qtyAllocated: r.rencanaVol,
            unit: r.sat || 'bh',
            kategori: r.subSection || r.section || 'KELOMPOK MATERIAL',
            hargaSatuan: r.hargaSatuan,
          }));
        }
      }
      currentMats = currentMats.filter((m) => !isTiangMaterial(m));
    }

    // Di dalam modal: qtyReservedSap dan qtyReservedNonSap adalah alokasi untuk SISA yang belum diambil (0..sisa).
    // Saat disimpan, nilai ini akan dijumlahkan dengan takenSap dan takenNonSap dari tahap sebelumnya.
    const initializedMats = currentMats.map((m) => {
      const req = m.qtyAllocated || m.qtyReksis || 1;
      const { sap: takenSap, nonSap: takenNonSap } = getTakenByChannel(m);
      const sudah = takenSap + takenNonSap;
      const sisa = Math.max(0, req - sudah);
      const isTiang = isTiangMaterial(m);

      // Sisa reservasi yang sebelumnya sudah diinput namun belum diambil vendor
      const prevPendingSap = m.qtyReservedSap !== undefined ? Math.max(0, m.qtyReservedSap - takenSap) : undefined;
      const prevPendingNonSap = m.qtyReservedNonSap !== undefined ? Math.max(0, m.qtyReservedNonSap - takenNonSap) : undefined;

      const defaultSap = isTiang
        ? 0
        : (prevPendingSap !== undefined ? Math.min(prevPendingSap, sisa) : sisa);
      const defaultNonSap = isTiang
        ? (prevPendingNonSap !== undefined ? Math.min(prevPendingNonSap, sisa) : sisa)
        : (prevPendingNonSap !== undefined ? Math.min(prevPendingNonSap, Math.max(0, sisa - defaultSap)) : 0);

      return {
        ...m,
        qtyReservedSap: defaultSap,
        qtyReservedNonSap: defaultNonSap,
        qtyReserved: sudah + defaultSap + defaultNonSap,
      };
    });

    setReservationWo({ ...wo, materials: initializedMats });

    const nowStr = new Date().toISOString().split('T')[0];
    const woSuffix = wo.id.split('.').pop() || '001';
    const yearStr = new Date().getFullYear();
    const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');

    const defaultResNoSap = wo.reservationNumber || `RES-SAP/UP3-BTS/${yearStr}/${monthStr}/${woSuffix}`;
    const defaultResNoNonSap = wo.reservationNumberNonStock || `RES-NONSAP/UP3-BTS/${yearStr}/${monthStr}/${woSuffix}`;
    
    const hasInitialSap = Boolean(wo.reservationNumber) || initializedMats.some((m) => (m.qtyReservedSap || 0) > 0 || getTakenByChannel(m).sap > 0);
    const hasInitialNonSap = Boolean(wo.reservationNumberNonStock) || initializedMats.some((m) => (m.qtyReservedNonSap || 0) > 0 || getTakenByChannel(m).nonSap > 0);

    setResNumber(hasInitialSap ? defaultResNoSap : '');
    setResNumberNonStock(hasInitialNonSap ? defaultResNoNonSap : '');
    setResDate(wo.reservationDate || nowStr);
    setResNotes(wo.reservationNotes || 'Pengambilan material di Gudang UP3 Banten Selatan.');
  };

  // Handler Simpan Reservasi
  const handleSaveReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationWo) return;

    const allAlreadyTaken =
      (reservationWo.materials || []).length > 0 &&
      (reservationWo.materials || []).every((m) => {
        if (m.isHold) return false;
        const req = m.qtyAllocated || m.qtyReksis || 1;
        const { sap: takenSap, nonSap: takenNonSap } = getTakenByChannel(m);
        return takenSap + takenNonSap >= req;
      });

    if (allAlreadyTaken) {
      showToast('ℹ️ Seluruh kebutuhan material WO sudah diambil lengkap. Tidak dapat menerbitkan reservasi baru.');
      return;
    }

    // Hitung total akumulasi reservasi = (sudah diambil di tahap sebelumnya) + (reservasi sisa tahap ini)
    const updatedMats = (reservationWo.materials || []).map((m) => {
      const { sap: takenSap, nonSap: takenNonSap } = getTakenByChannel(m);
      const batchSap = m.qtyReservedSap || 0;
      const batchNonSap = m.qtyReservedNonSap || 0;
      const totalSap = takenSap + batchSap;
      const totalNonSap = takenNonSap + batchNonSap;
      return {
        ...m,
        qtyReservedSap: totalSap,
        qtyReservedNonSap: totalNonSap,
        qtyReserved: totalSap + totalNonSap,
      };
    });

    const hasSap = updatedMats.some((m) => (m.qtyReservedSap || 0) > 0);
    const hasNonSap = updatedMats.some((m) => (m.qtyReservedNonSap || 0) > 0);

    if (hasSap && !resNumber.trim()) {
      showToast('⚠️ Mohon isi Nomor Reservasi SAP (Stok Gudang)!');
      return;
    }

    if (hasNonSap && !resNumberNonStock.trim()) {
      showToast('⚠️ Mohon isi Nomor Reservasi Non-SAP (Pabrikan / Pengadaan Luar)!');
      return;
    }

    if (!resNumber.trim() && !resNumberNonStock.trim()) {
      showToast('⚠️ Mohon isi minimal salah satu Nomor Reservasi (SAP atau Non-SAP)!');
      return;
    }

    reserveMaterialWo(
      reservationWo.id,
      resNumber.trim() || '',
      resDate,
      updatedMats,
      false,
      undefined,
      resNotes.trim(),
      resNumberNonStock.trim() || ''
    );

    const docLabels = [resNumber.trim() && `SAP: ${resNumber.trim()}`, resNumberNonStock.trim() && `Non-SAP: ${resNumberNonStock.trim()}`].filter(Boolean).join(' & ');
    showToast(`✅ Berhasil! Reservasi (${docLabels}) diterbitkan ke Vendor ${reservationWo.vendor}.`);
    setReservationWo(null);
  };

  // Handler Ubah Jumlah Qty Reservasi SAP & Non-SAP per Material
  const handleQtyReservedSapChange = (idx: number, newQtySap: number) => {
    if (!reservationWo) return;
    const updatedMats = (reservationWo.materials || []).map((mat, i) => {
      if (i === idx) {
        const req = mat.qtyAllocated || mat.qtyReksis || 1;
        const { sap: takenSap, nonSap: takenNonSap } = getTakenByChannel(mat);
        const sudah = takenSap + takenNonSap;
        const sisa = Math.max(0, req - sudah);
        const validSap = Math.max(0, Math.min(sisa, newQtySap));
        const curNonSap = mat.qtyReservedNonSap || 0;
        const adjustedNonSap = Math.min(curNonSap, Math.max(0, sisa - validSap));
        return {
          ...mat,
          qtyReservedSap: validSap,
          qtyReservedNonSap: adjustedNonSap,
          qtyReserved: sudah + validSap + adjustedNonSap,
        };
      }
      return mat;
    });

    const hasAnySap = Boolean(reservationWo.reservationNumber) || updatedMats.some((m) => (m.qtyReservedSap || 0) > 0 || getTakenByChannel(m).sap > 0);
    if (hasAnySap && !resNumber.trim()) {
      const woSuffix = reservationWo.id.split('.').pop() || '001';
      const yearStr = new Date().getFullYear();
      const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
      setResNumber(reservationWo.reservationNumber || `RES-SAP/UP3-BTS/${yearStr}/${monthStr}/${woSuffix}`);
    } else if (!hasAnySap) {
      setResNumber('');
    }

    setReservationWo({ ...reservationWo, materials: updatedMats });
  };

  const handleQtyReservedNonSapChange = (idx: number, newQtyNonSap: number) => {
    if (!reservationWo) return;
    const updatedMats = (reservationWo.materials || []).map((mat, i) => {
      if (i === idx) {
        const req = mat.qtyAllocated || mat.qtyReksis || 1;
        const { sap: takenSap, nonSap: takenNonSap } = getTakenByChannel(mat);
        const sudah = takenSap + takenNonSap;
        const sisa = Math.max(0, req - sudah);
        const validNonSap = Math.max(0, Math.min(sisa, newQtyNonSap));
        const curSap = mat.qtyReservedSap || 0;
        const adjustedSap = Math.min(curSap, Math.max(0, sisa - validNonSap));
        return {
          ...mat,
          qtyReservedSap: adjustedSap,
          qtyReservedNonSap: validNonSap,
          qtyReserved: sudah + adjustedSap + validNonSap,
        };
      }
      return mat;
    });

    const hasAnyNonSap = Boolean(reservationWo.reservationNumberNonStock) || updatedMats.some((m) => (m.qtyReservedNonSap || 0) > 0 || getTakenByChannel(m).nonSap > 0);
    if (hasAnyNonSap && !resNumberNonStock.trim()) {
      const woSuffix = reservationWo.id.split('.').pop() || '001';
      const yearStr = new Date().getFullYear();
      const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
      setResNumberNonStock(reservationWo.reservationNumberNonStock || `RES-NONSAP/UP3-BTS/${yearStr}/${monthStr}/${woSuffix}`);
    } else if (!hasAnyNonSap) {
      setResNumberNonStock('');
    }

    setReservationWo({ ...reservationWo, materials: updatedMats });
  };

  // Handler Open Modal Hold Per Item Material (dengan Input Keterangan Pengawas)
  const handleOpenHoldItemModal = (item: WoMaterialItem) => {
    setHoldTargetItem(item);
    setItemHoldReasonInput(item.holdReason || 'Stok fisik di gudang kosong / menunggu pasokan UID.');
  };

  // Handler Konfirmasi Hold Per Item Material
  const handleConfirmHoldItem = () => {
    if (!reservationWo || !holdTargetItem) return;
    if (!itemHoldReasonInput.trim()) {
      showToast('⚠️ Mohon masukkan alasan / keterangan penahanan material!');
      return;
    }

    const reason = itemHoldReasonInput.trim();
    const updated = (reservationWo.materials || []).map((m) => {
      if (m.material === holdTargetItem.material) {
        return {
          ...m,
          isHold: true,
          holdReason: reason,
        };
      }
      return m;
    });

    setReservationWo({ ...reservationWo, materials: updated });
    updateWoMaterialItem(reservationWo.id, holdTargetItem.material, {
      isHold: true,
      holdReason: reason,
    });
    showToast(`⛔ Material "${holdTargetItem.material}" di-HOLD: ${reason}`);
    setHoldTargetItem(null);
    setItemHoldReasonInput('');
  };

  // Handler Buka Hold (Unhold) Per Item Material
  const handleUnholdItem = (materialName: string) => {
    if (!reservationWo) return;
    const updated = (reservationWo.materials || []).map((m) => {
      if (m.material === materialName) {
        return {
          ...m,
          isHold: false,
          holdReason: undefined,
        };
      }
      return m;
    });

    setReservationWo({ ...reservationWo, materials: updated });
    updateWoMaterialItem(reservationWo.id, materialName, {
      isHold: false,
      holdReason: undefined,
    });
    showToast(`▶️ Penahanan material "${materialName}" berhasil dibuka.`);
  };

  // Handler Open Substitusi
  const handleOpenSubstitute = (item: WoMaterialItem) => {
    setSubstituteItem(item);
    setSubstituteSearch('');

    // Deteksi kategori material asal jika cocok dengan stok gudang
    const origStock = stocks.find((s) => s.name === item.material || (item.kode && s.code === item.kode));
    const detectedCategory = origStock?.category || item.kategori || 'ALL';
    const hasCategoryStock = detectedCategory !== 'ALL' && stocks.some((s) => s.category === detectedCategory && (s.qtyFisik ?? s.qtySisa) > 0);
    const initialCategory = hasCategoryStock ? detectedCategory : 'ALL';
    setSubstituteCategory(initialCategory);

    const available = stocks.filter((s) => {
      const hasStock = (s.qtyFisik ?? s.qtySisa) > 0;
      if (!hasStock) return false;
      if (initialCategory !== 'ALL' && s.category !== initialCategory) return false;
      return true;
    });

    const fallbackAvailable = stocks.filter((s) => (s.qtyFisik ?? s.qtySisa) > 0);
    setSelectedAltStockCode(available[0]?.code || fallbackAvailable[0]?.code || '');
    setSubstituteQty(item.qtyAllocated || item.qtyReksis || 1);
    setSubstituteReason(`Penyesuaian stok gudang: ${item.material} dialihkan ke material alternatif`);
  };

  const handleSubstituteCategoryChange = (cat: string) => {
    setSubstituteCategory(cat);
    const filtered = stocks.filter((s) => {
      const hasStock = (s.qtyFisik ?? s.qtySisa) > 0;
      if (!hasStock) return false;
      if (cat !== 'ALL' && s.category !== cat) return false;
      if (substituteSearch.trim()) {
        const q = substituteSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q);
      }
      return true;
    });
    if (filtered.length > 0 && !filtered.some((s) => s.code === selectedAltStockCode)) {
      setSelectedAltStockCode(filtered[0].code);
    }
  };

  const handleSubstituteSearchChange = (query: string) => {
    setSubstituteSearch(query);
    const filtered = stocks.filter((s) => {
      const hasStock = (s.qtyFisik ?? s.qtySisa) > 0;
      if (!hasStock) return false;
      if (substituteCategory !== 'ALL' && s.category !== substituteCategory) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q);
      }
      return true;
    });
    if (filtered.length > 0 && !filtered.some((s) => s.code === selectedAltStockCode)) {
      setSelectedAltStockCode(filtered[0].code);
    }
  };

  // Handler Simpan Substitusi
  const handleSaveSubstitute = () => {
    if (!reservationWo || !substituteItem) return;
    const altStock = stocks.find((s) => s.code === selectedAltStockCode);
    if (!altStock) {
      showToast('⚠️ Silakan pilih material pengganti yang tersedia di gudang!');
      return;
    }

    replaceMaterialWo(
      reservationWo.id,
      substituteItem.material,
      altStock.name,
      substituteQty,
      substituteReason
    );

    // Update state modal lokal
    const updatedMats = (reservationWo.materials || []).map((m) => {
      if (m.material === substituteItem.material) {
        return {
          ...m,
          material: altStock.name,
          kode: altStock.code,
          unit: altStock.unit,
          qtyAllocated: substituteQty,
          qtyReksis: substituteQty,
          isReplaced: true,
          originalMaterialName: substituteItem.material,
          replacementReason: substituteReason,
        };
      }
      return m;
    });

    setReservationWo({ ...reservationWo, materials: updatedMats });
    setSubstituteItem(null);
    showToast(`✅ Material berhasil disubstitusi dengan ${altStock.name}`);
  };

  // Handler Open Edit Material WO
  const handleOpenEditWoItem = (item: WoMaterialItem) => {
    setEditingWoItem({
      originalMaterial: item.material,
      material: item.material,
      kode: item.kode || '',
      qty: item.qtyAllocated || item.qtyReksis || 1,
      unit: item.unit || 'Buah',
      catatan: item.verificationNote || '',
    });
  };

  // Handler Simpan Edit Material WO
  const handleSaveEditWoItem = () => {
    if (!reservationWo || !editingWoItem) return;
    if (!editingWoItem.material.trim()) {
      showToast('⚠️ Nama material tidak boleh kosong!');
      return;
    }

    updateWoMaterialItem(reservationWo.id, editingWoItem.originalMaterial, {
      material: editingWoItem.material.trim(),
      kode: editingWoItem.kode.trim() || undefined,
      qtyAllocated: Number(editingWoItem.qty),
      qtyReksis: Number(editingWoItem.qty),
      unit: editingWoItem.unit.trim(),
      verificationNote: editingWoItem.catatan.trim() || undefined,
    });

    const updatedMats = (reservationWo.materials || []).map((m) => {
      if (m.material === editingWoItem.originalMaterial) {
        return {
          ...m,
          material: editingWoItem.material.trim(),
          kode: editingWoItem.kode.trim() || undefined,
          qtyAllocated: Number(editingWoItem.qty),
          qtyReksis: Number(editingWoItem.qty),
          unit: editingWoItem.unit.trim(),
          verificationNote: editingWoItem.catatan.trim() || undefined,
        };
      }
      return m;
    });

    setReservationWo({ ...reservationWo, materials: updatedMats });
    showToast(`✓ Material ${editingWoItem.material} berhasil diperbarui.`);
    setEditingWoItem(null);
  };

  // Handler Hold
  const handleOpenHoldModal = (wo: WorkOrderRecord) => {
    setHoldTargetWo(wo);
    setHoldReasonInput(wo.holdReason || 'Stok material di gudang kosong / menunggu pasokan pengadaan.');
  };

  const handleConfirmHold = () => {
    if (!holdTargetWo) return;
    if (!holdReasonInput.trim()) {
      showToast('⚠️ Mohon masukkan alasan penahanan material!');
      return;
    }
    holdMaterialWo(holdTargetWo.id, holdReasonInput.trim());
    showToast(`⛔ Reservasi material untuk ${holdTargetWo.id} berhasil di-HOLD!`);
    setHoldTargetWo(null);
  };

  const handleConfirmUnhold = (wo: WorkOrderRecord) => {
    unholdMaterialWo(wo.id);
    showToast(`▶️ Penahanan material untuk ${wo.id} telah dibuka kembali.`);
  };

  const renderMaterialSectionTable = (
    items: { m: WoMaterialItem; originalIdx: number }[],
    title: string,
    subtitle: string,
    badgeLabel: string,
    badgeColor: 'blue' | 'indigo' = 'blue'
  ) => {
    return (
      <div className="space-y-2 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              {title}
            </h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              badgeColor === 'blue' 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}>
              {badgeLabel}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">({items.length} Item)</span>
          </div>
          <span className="text-[11px] text-slate-500 italic">{subtitle}</span>
        </div>

        {items.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
            Tidak ada material pada alokasi pekerjaan WO ini.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3 min-w-[100px] text-center font-mono">No Material</th>
                  <th className="py-2.5 px-3 min-w-[200px] text-left">Material</th>
                  <th className="py-2.5 px-3 text-center min-w-[90px]">Material Kebutuhan WO</th>
                  <th className="py-2.5 px-3 text-center min-w-[85px] bg-blue-100/90 text-blue-950 border-l border-blue-200">
                    <div>
                      <span>QTY SAP</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[95px] bg-indigo-100/90 text-indigo-950 border-r border-indigo-200">
                    <div>
                      <span>QTY NON-SAP</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[105px] bg-amber-50 text-amber-950 border-r border-amber-200">
                    <div>
                      <span>Belum Reservasi</span>
                      <span className="block text-[8.5px] font-normal text-amber-700 normal-case">(Sisa Kebutuhan)</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[100px] bg-slate-100 text-slate-800 border-r border-slate-200">
                    <div>
                      <span>Sudah Reservasi</span>
                      <span className="block text-[8.5px] font-normal text-slate-500 normal-case">(Sudah Diambil)</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[115px] bg-blue-50/80 text-blue-900 border-r border-blue-200">
                    <div>
                      <span>STOK FISIK</span>
                      <span className="inline-block mt-0.5 text-[8.5px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded border border-blue-200 normal-case">
                        🕒 16/11/2026 08:00
                      </span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[115px]">
                    <div>
                      <span>STOK SAP</span>
                      <span className="inline-block mt-0.5 text-[8.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 normal-case">
                        🕒 16/11/2026 08:00
                      </span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[120px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {items.map(({ m, originalIdx }, rowNum) => {
                  const req = m.qtyAllocated || m.qtyReksis || 1;
                  const sudahReservasi = m.qtyTaken || (m.isTaken ? req : 0);
                  const belumReservasi = Math.max(0, req - sudahReservasi);

                  const isTiang = isTiangMaterial(m);
                  const qtySap = m.qtyReservedSap !== undefined ? Math.min(m.qtyReservedSap, belumReservasi) : (isTiang ? 0 : belumReservasi);
                  const qtyNonSap = m.qtyReservedNonSap !== undefined ? Math.min(m.qtyReservedNonSap, belumReservasi) : (isTiang ? belumReservasi : 0);
                  const totalResTrans = qtySap + qtyNonSap;

                  const stock = findMatchingStock(m.material, m.kode);
                  const isItemHeld = Boolean(m.isHold);
                  // Material hanya terkunci jika sudah diambil LENGKAP tanpa sisa (belumReservasi === 0).
                  // Jika masih ada sisa kebutuhan (belumReservasi > 0), maka aksi TIDAK TERKUNCI agar pengawas tetap bisa edit/substitusi/hold sisa material.
                  const isFullyTaken = Boolean(m.isTaken && belumReservasi === 0);
                  const isTakenPartial = Boolean(m.isTaken && (m.qtyTaken || 0) > 0 && belumReservasi > 0);
                  const isShortage = stock && stock.qtyFisik < req;

                  return (
                    <tr 
                      key={originalIdx} 
                      className={`transition-colors ${
                        isFullyTaken 
                          ? 'bg-emerald-50/20' 
                          : isTakenPartial
                          ? 'bg-blue-50/20'
                          : isItemHeld 
                          ? 'bg-rose-50/50' 
                          : isShortage 
                          ? 'bg-amber-50/30' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* No */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 align-top">
                        {rowNum + 1}
                      </td>

                      {/* No Material */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 align-top">
                        {m.kode || (stock ? stock.code : '—')}
                      </td>

                      {/* Material */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {m.material}
                        </div>
                        {m.isReplaced && (
                          <div className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                            ↻ Material Substitusi (Asli: {m.originalMaterialName})
                          </div>
                        )}
                        {isItemHeld && (
                          <div className="text-[10px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                            ⛔ Material Ditahan (Hold)
                          </div>
                        )}
                        {isFullyTaken && (
                          <div className="text-[10px] text-emerald-800 font-bold bg-emerald-100/90 px-1.5 py-0.5 rounded mt-0.5 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Diambil Vendor ({m.qtyTaken} {m.unit})</span>
                          </div>
                        )}
                        {isTakenPartial && (
                          <div className="text-[10px] text-amber-800 font-bold bg-amber-100/90 px-1.5 py-0.5 rounded mt-0.5 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Diambil Vendor Sebagian ({m.qtyTaken} {m.unit}) — Sisa: {belumReservasi} {m.unit}</span>
                          </div>
                        )}
                      </td>

                      {/* Qty Material */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800 font-mono align-top">
                        {req} <span className="font-sans font-normal text-slate-500 text-[10px]">{m.unit || 'Buah'}</span>
                      </td>

                      {/* Qty SAP */}
                      <td className="py-2.5 px-2 text-center align-top bg-blue-50/40 border-l border-blue-100">
                        <div className="inline-flex items-center justify-center gap-1">
                          <input 
                            type="number"
                            min={0}
                            max={belumReservasi}
                            disabled={belumReservasi === 0}
                            value={qtySap}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(belumReservasi, Number(e.target.value) || 0));
                              handleQtyReservedSapChange(originalIdx, val);
                            }}
                            className={`w-14 px-1.5 py-1 text-xs text-center font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 shadow-2xs ${
                              belumReservasi === 0 
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-blue-950 border-blue-300 focus:ring-blue-500'
                            }`}
                          />
                          <span className="text-[9.5px] text-slate-500">{m.unit || 'Buah'}</span>
                        </div>
                      </td>

                      {/* Qty Non-SAP */}
                      <td className="py-2.5 px-2 text-center align-top bg-indigo-50/40 border-r border-indigo-100">
                        <div className="inline-flex items-center justify-center gap-1">
                          <input 
                            type="number"
                            min={0}
                            max={belumReservasi}
                            disabled={belumReservasi === 0}
                            value={qtyNonSap}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(belumReservasi, Number(e.target.value) || 0));
                              handleQtyReservedNonSapChange(originalIdx, val);
                            }}
                            className={`w-14 px-1.5 py-1 text-xs text-center font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 shadow-2xs ${
                              belumReservasi === 0 
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-indigo-950 border-indigo-300 focus:ring-indigo-500'
                            }`}
                          />
                          <span className="text-[9.5px] text-slate-500">{m.unit || 'Buah'}</span>
                        </div>
                        {totalResTrans > 0 && (
                          <div className="text-[8.5px] text-slate-400 font-mono mt-0.5" title="Total reservasi batch ini">
                            Tot: {totalResTrans}
                          </div>
                        )}
                      </td>

                      {/* Belum Reservasi */}
                      <td className="py-2.5 px-3 text-center align-top bg-amber-50/40 border-r border-amber-100 font-mono">
                        {belumReservasi > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                            {belumReservasi} {m.unit || 'Buah'}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            0 (Lengkap)
                          </span>
                        )}
                      </td>

                      {/* Sudah Reservasi */}
                      <td className="py-2.5 px-3 text-center align-top bg-slate-50/70 font-mono font-semibold text-slate-700 border-r border-slate-200">
                        {sudahReservasi} <span className="font-sans font-normal text-slate-400 text-[10px]">{m.unit || 'Buah'}</span>
                      </td>

                      {/* Stok Fisik */}
                      <td className="py-2.5 px-3 text-center align-top bg-blue-50/40 border-r border-blue-100">
                        {stock ? (
                          <div className="font-mono">
                            <span className="font-black text-blue-900 text-xs">{stock.qtyFisik}</span>{' '}
                            <span className="text-[10px] text-slate-400">{stock.unit}</span>
                          </div>
                        ) : (
                          <div className="font-mono">
                            <span className="font-bold text-blue-900 text-xs">{req}</span>{' '}
                            <span className="text-[10px] text-slate-400">{m.unit || 'bh'}</span>
                          </div>
                        )}
                      </td>

                      {/* Stok SAP */}
                      <td className="py-2.5 px-3 text-center font-mono align-top border-r border-slate-100">
                        {stock ? (
                          <div>
                            <span className="font-semibold text-slate-700">
                              {stock.qtySap !== undefined ? stock.qtySap : stock.qtyFisik}
                            </span>{' '}
                            <span className="text-[10px] text-slate-400">{stock.unit}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 font-mono text-[10px]">Tersedia</span>
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 text-center align-top">
                        {isFullyTaken ? (
                          <span className="px-2 py-1 text-[9.5px] font-bold text-slate-600 bg-slate-100 border border-slate-300 rounded-lg inline-flex items-center justify-center gap-1 whitespace-nowrap shadow-2xs cursor-default">
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Terkunci</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditWoItem(m)}
                              title="Edit rincian material ini"
                              className="px-2 py-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-0.5 shadow-2xs"
                            >
                              <Edit3 className="w-3 h-3 text-amber-700" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenSubstitute(m)}
                              className="px-2 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition cursor-pointer whitespace-nowrap"
                            >
                              Substitusi
                            </button>

                            {isItemHeld ? (
                              <button
                                type="button"
                                onClick={() => handleUnholdItem(m.material)}
                                title="Buka penahanan material ini"
                                className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 transition cursor-pointer flex items-center gap-0.5 whitespace-nowrap shadow-2xs"
                              >
                                <PlayCircle className="w-3 h-3 text-emerald-600" />
                                <span>Unhold</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenHoldItemModal(m)}
                                title="Tahan material ini"
                                className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 transition cursor-pointer flex items-center gap-0.5 whitespace-nowrap shadow-2xs"
                              >
                                <PauseCircle className="w-3 h-3 text-rose-600" />
                                <span>Hold</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Reservasi Material Gudang
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                Menu Pengawas & Gudang
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Alokasikan material SPK dari stok fisik gudang, terbitkan nomor reservasi SAP/ERP, kelola substitusi material & hold status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage('verifikasi-pengawas')}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Ke Menu Verifikasi Lapangan</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'all' ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total WO Siap</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summaryStats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Seluruh WO yang disetujui</div>
        </div>

        <div 
          onClick={() => setActiveTab('belum')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'belum' ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Belum Reservasi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{summaryStats.belum}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Perlu alokasi nomor reservasi</div>
        </div>

        <div 
          onClick={() => setActiveTab('terbit')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'terbit' ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Siap Ambil / Sebagian</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700">{summaryStats.terbit}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Menunggu diambil lengkap vendor</div>
        </div>

        <div 
          onClick={() => setActiveTab('selesai')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeTab === 'selesai' ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Selesai Diambil</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{summaryStats.selesai}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">100% material diambil vendor</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({approvedWos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('belum')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'belum'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Reservasi ({summaryStats.belum})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terbit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'terbit'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Siap Ambil ({summaryStats.terbit})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('selesai')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'selesai'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Selesai ({summaryStats.selesai})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hold')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'hold'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ditahan (Hold) ({summaryStats.hold})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. WO, SPK, Pelanggan, Vendor, Pengawas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Tabel Reservasi Material */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr className="divide-x divide-slate-200">
                <th className="py-3 px-3.5 min-w-[155px]">NO. WO</th>
                <th className="py-3 px-3.5 min-w-[150px]">NO. SPK</th>
                <th className="py-3 px-3.5 min-w-[170px]">PELANGGAN</th>
                <th className="py-3 px-3.5 min-w-[155px]">LOKASI</th>
                <th className="py-3 px-3.5 min-w-[160px]">VENDOR</th>
                <th className="py-3 px-3.5 min-w-[210px]">PENGAWAS LAPANGAN</th>
                <th className="py-3 px-3 text-center min-w-[155px] bg-blue-50/50 text-blue-900">STATUS RESERVASI SAP</th>
                <th className="py-3 px-3 text-center min-w-[155px] bg-indigo-50/50 text-indigo-900">STATUS RESERVASI NON-SAP</th>
                <th className="py-3 px-2.5 text-center min-w-[125px] w-32">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
                    Tidak ada data Work Order pada kategori reservasi ini
                  </td>
                </tr>
              ) : (
                filteredWos.map((wo) => {
                  const isHold = wo.isHold || wo.reservationStatus === 'Hold';
                  const isReserved = isWoReservationIssued(wo);
                  const isTiang = isTiangWo(wo);
                  const isAllMaterialReserved = isWoAllMaterialTaken(wo);

                  // Pengawas 1 & Pengawas 2
                  const p1 = wo.supervisor1 || wo.supervisor || 'Hasian Sitorus (TC Lola Konstruksi)';
                  const p2 = wo.supervisor2 || (wo.category === 'WO Paket 2' ? 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)' : 'Daud Febrizer (TL Teknik ULP Rangkasbitung)');

                  return (
                    <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-200">
                      {/* 1. NO. WO */}
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-700 align-top">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-xs font-bold text-blue-700">{wo.id}</span>
                          <span className={`text-[9.5px] px-2 py-0.5 rounded-md font-bold tracking-tight whitespace-nowrap border ${
                            isTiang
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : wo.category === 'WO Paket 1'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : wo.category === 'WO Paket 2'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {isTiang ? 'WO Tiang (Pabrikan)' : wo.category === 'WO Paket 1' ? 'Paket 1 (TM)' : wo.category === 'WO Paket 2' ? 'Paket 2 (TR)' : 'Tiang Beton'}
                          </span>
                        </div>
                      </td>

                      {/* 2. NO. SPK (Kolom Sendiri) */}
                      <td className="py-3 px-3.5 align-top">
                        {wo.spkNumber ? (
                          <div className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-200/80 leading-relaxed">
                            {wo.spkNumber}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic font-sans">—</span>
                        )}
                      </td>

                      {/* 3. PELANGGAN */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="font-semibold text-slate-900 leading-snug text-[11.5px]">{wo.customerName}</div>
                      </td>

                      {/* 3b. LOKASI */}
                      <td className="py-3 px-3.5 align-top">
                        {wo.location ? (
                          <div className="text-[10px] text-slate-500 flex items-start gap-1 leading-snug" title={wo.location}>
                            <span className="shrink-0 mt-0.5">📍</span>
                            <span className="line-clamp-3">{wo.location}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">—</span>
                        )}
                      </td>

                      {/* 4. VENDOR (Kolom Sendiri) */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="text-xs font-bold text-slate-800 flex items-start gap-1.5 leading-snug">
                          <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <span>{wo.vendor}</span>
                        </div>
                        {wo.narahubung && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            Kontak: <span className="text-slate-700 font-medium">{wo.narahubung}</span>
                          </div>
                        )}
                      </td>

                      {/* 5. PENGAWAS LAPANGAN (P1 & P2 Badge) */}
                      <td className="py-3 px-3.5 align-top">
                        {(() => {
                          const s1 = parseSupervisor(p1);
                          const s2 = parseSupervisor(p2);

                          return (
                            <div className="flex flex-col gap-1.5 py-0.5">
                              {/* P1 */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                                  P1
                                </span>
                                <div className="min-w-0 flex items-baseline gap-1 truncate">
                                  <span className="font-bold text-slate-800 text-[11px] truncate" title={p1}>
                                    {s1.name}
                                  </span>
                                  {s1.role && (
                                    <span className="text-[9.5px] text-slate-500 font-medium truncate shrink-0">
                                      ({s1.role})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* P2 */}
                              {p2 && (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                    P2
                                  </span>
                                  <div className="min-w-0 flex items-baseline gap-1 truncate">
                                    <span className="font-semibold text-slate-700 text-[10.5px] truncate" title={p2}>
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
                        })()}
                      </td>

                      {/* 6A. STATUS RESERVASI SAP (Gudang PLN) */}
                      <td className="py-3 px-3 text-center align-top bg-blue-50/20">
                        {(() => {
                          const mats = wo.materials || [];
                          let totalSapRes = 0;
                          let totalSapTaken = 0;
                          let unreservedSapNeed = 0;
                          let hasPotentialSap = false;

                          mats.forEach((m) => {
                            const isTiang = isTiangMaterial(m);
                            if (!isTiang) hasPotentialSap = true;
                            const req = m.qtyAllocated || m.qtyReksis || 1;
                            const { sap: takenSap, nonSap: takenNonSap } = getTakenByChannel(m);
                            const resSap = Math.max(takenSap, m.qtyReservedSap !== undefined ? m.qtyReservedSap : (isTiang ? 0 : (m.qtyReserved || 0)));
                            const resNonSap = Math.max(takenNonSap, m.qtyReservedNonSap !== undefined ? m.qtyReservedNonSap : (isTiang ? (m.qtyReserved || 0) : 0));
                            const unreserved = Math.max(0, req - (resSap + resNonSap));

                            totalSapRes += resSap;
                            totalSapTaken += takenSap;
                            if (!isTiang) unreservedSapNeed += unreserved;
                          });

                          const targetSap = totalSapRes + unreservedSapNeed;
                          const hasSapItems = targetSap > 0 || Boolean(wo.reservationNumber) || (hasPotentialSap && !isTiang);
                          const isSapReserved = Boolean(wo.reservationNumber) || totalSapRes > 0;
                          const isSapPartial = isSapReserved && totalSapRes < targetSap;
                          const isSapFull = isSapReserved && totalSapRes >= targetSap && targetSap > 0;
                          const isSapTakenFull = isSapFull && totalSapTaken >= totalSapRes && totalSapRes > 0;

                          return (
                            <div className="flex flex-col items-center gap-1.5">
                              {!hasSapItems ? (
                                <span className="text-[10px] text-slate-400 italic">Nihil Item SAP</span>
                              ) : isHold ? (
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1 shadow-2xs">
                                  <PauseCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Hold SAP</span>
                                </span>
                              ) : isSapTakenFull ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 whitespace-nowrap shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Selesai Diambil</span>
                                </span>
                              ) : isSapFull ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 flex items-center gap-1 whitespace-nowrap shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>{totalSapTaken > 0 ? `Diambil (${totalSapTaken}/${totalSapRes})` : 'Siap Ambil SAP'}</span>
                                </span>
                              ) : isSapPartial ? (
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 whitespace-nowrap shadow-2xs">
                                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Sebagian ({totalSapRes}/{targetSap})</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 whitespace-nowrap">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Belum Reservasi</span>
                                </span>
                              )}

                              {/* Nomor Reservasi SAP */}
                              {wo.reservationNumber && (
                                <div className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 max-w-[140px] truncate" title={`No. Reservasi SAP: ${wo.reservationNumber}`}>
                                  {wo.reservationNumber}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 6B. STATUS RESERVASI NON-SAP (Pabrikan / Tiang) */}
                      <td className="py-3 px-3 text-center align-top bg-indigo-50/20">
                        {(() => {
                          const mats = wo.materials || [];
                          let totalNonSapRes = 0;
                          let totalNonSapTaken = 0;
                          let unreservedNonSapNeed = 0;

                          mats.forEach((m) => {
                            const isTiang = isTiangMaterial(m);
                            const req = m.qtyAllocated || m.qtyReksis || 1;
                            const { sap: takenSap, nonSap: takenNonSap } = getTakenByChannel(m);
                            const resSap = Math.max(takenSap, m.qtyReservedSap !== undefined ? m.qtyReservedSap : (isTiang ? 0 : (m.qtyReserved || 0)));
                            const resNonSap = Math.max(takenNonSap, m.qtyReservedNonSap !== undefined ? m.qtyReservedNonSap : (isTiang ? (m.qtyReserved || 0) : 0));
                            const unreserved = Math.max(0, req - (resSap + resNonSap));

                            totalNonSapRes += resNonSap;
                            totalNonSapTaken += takenNonSap;
                            if (isTiang) unreservedNonSapNeed += unreserved;
                          });

                          const targetNonSap = totalNonSapRes + unreservedNonSapNeed;
                          const hasNonSapItems = targetNonSap > 0 || Boolean(wo.reservationNumberNonStock) || isTiang;
                          const isNonSapReserved = Boolean(wo.reservationNumberNonStock) || totalNonSapRes > 0;
                          const isNonSapPartial = isNonSapReserved && totalNonSapRes < targetNonSap;
                          const isNonSapFull = isNonSapReserved && totalNonSapRes >= targetNonSap && targetNonSap > 0;
                          const isNonSapTakenFull = isNonSapFull && totalNonSapTaken >= totalNonSapRes && totalNonSapRes > 0;

                          return (
                            <div className="flex flex-col items-center gap-1.5">
                              {!hasNonSapItems ? (
                                <span className="text-[10px] text-slate-400 italic">Nihil Item Non-SAP</span>
                              ) : isHold ? (
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1 shadow-2xs">
                                  <PauseCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Hold Non-SAP</span>
                                </span>
                              ) : isNonSapTakenFull ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 whitespace-nowrap shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Selesai Diambil</span>
                                </span>
                              ) : isNonSapFull ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-300 flex items-center gap-1 whitespace-nowrap shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>{totalNonSapTaken > 0 ? `Diambil (${totalNonSapTaken}/${totalNonSapRes})` : 'Siap Ambil Non-SAP'}</span>
                                </span>
                              ) : isNonSapPartial ? (
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 whitespace-nowrap shadow-2xs">
                                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Sebagian ({totalNonSapRes}/{targetNonSap})</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 whitespace-nowrap">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Belum Reservasi</span>
                                </span>
                              )}

                              {/* Nomor Reservasi Non-SAP */}
                              {wo.reservationNumberNonStock && (
                                <div className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 max-w-[140px] truncate" title={`No. Reservasi Non-SAP: ${wo.reservationNumberNonStock}`}>
                                  {wo.reservationNumberNonStock}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 7. Aksi Pengawas / Gudang (Icon Button Sederhana & Bagus) */}
                      <td className="py-3 px-2.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Utama Reservasi */}
                          {isAllMaterialReserved ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReservation(wo)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                              title="Reservasi Selesai & Terkunci — Seluruh material sudah diambil (Klik untuk lihat rincian)"
                              aria-label="Reservasi Selesai"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenReservation(wo)}
                              className={`p-2 rounded-lg transition shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
                                isReserved
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                              }`}
                              title={isReserved ? 'Edit Reservasi' : 'Input Reservasi'}
                              aria-label={isReserved ? 'Edit Reservasi' : 'Input Reservasi'}
                            >
                              <Boxes className="w-4 h-4" />
                            </button>
                          )}

                          {/* Tombol Rincian Material */}
                          <button
                            type="button"
                            onClick={() => setDetailWo(wo)}
                            title="Detail Material WO"
                            aria-label="Detail Material WO"
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </button>

                          {/* Tombol Hapus WO dengan Konfirmasi Alert */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`⚠️ PERINGATAN:\nApakah Anda yakin ingin menghapus Work Order:\n"${wo.noWorkOrder || wo.id}" (${wo.customerName})?\n\nData yang dihapus tidak dapat dikembalikan.`)) {
                                deleteWorkOrder(wo.id);
                                showToast(`✓ WO ${wo.noWorkOrder || wo.id} berhasil dihapus.`);
                              }
                            }}
                            title="Hapus Data Work Order"
                            aria-label="Hapus Data Work Order"
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
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

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 1: FORM INPUT RESERVASI MATERIAL GUDANG */}
      {/* ---------------------------------------------------------------------- */}
      {reservationWo && (() => {
        const modalMats = reservationWo.materials || [];
        const isAllTakenInModal =
          modalMats.length > 0 &&
          modalMats.every((m) => {
            if (m.isHold) return false;
            const req = m.qtyAllocated || m.qtyReksis || 1;
            const { sap: takenSap, nonSap: takenNonSap } = getTakenByChannel(m);
            return takenSap + takenNonSap >= req;
          });

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`p-5 border-b border-slate-200 flex items-center justify-between rounded-t-2xl ${
              isAllTakenInModal
                ? 'bg-emerald-50/70'
                : isTiangWo(reservationWo)
                ? 'bg-indigo-50/60'
                : 'bg-blue-50/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${
                  isAllTakenInModal
                    ? 'bg-emerald-600'
                    : isTiangWo(reservationWo)
                    ? 'bg-indigo-600'
                    : 'bg-blue-600'
                }`}>
                  {isAllTakenInModal ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isTiangWo(reservationWo) ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <Boxes className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Reservasi Material
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-blue-100 text-blue-800 border-blue-200">
                      {reservationWo.id} • {reservationWo.category}
                    </span>
                    {isAllTakenInModal && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border bg-emerald-100 text-emerald-800 border-emerald-300 inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-700" />
                        <span>Selesai Diambil 100% (Reservasi Terkunci)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pelanggan: <b className="text-slate-800">{reservationWo.customerName}</b> | Vendor Pelaksana: <b className="text-slate-800">{reservationWo.vendor}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReservationWo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Box Info Pengawas 1 & 2 */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Pengawas 1 (PLN):</span>
                  <span className="font-bold text-slate-800">
                    {reservationWo.supervisor1 || reservationWo.supervisor || 'Hasian Sitorus (TC Lola Konstruksi)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Pengawas 2 (Lapangan):</span>
                  <span className="font-bold text-slate-800">
                    {reservationWo.supervisor2 || 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)'}
                  </span>
                </div>
              </div>

              {/* Material List & Form Reservasi */}
              {(() => {
                const allMats = (reservationWo.materials || []).map((m, originalIdx) => ({ m, originalIdx }));

                return (
                  <div className="space-y-4">
                    {/* Banner Penanda: Jika Seluruh Material Sudah Diambil vs Sebagian */}
                    {isAllTakenInModal ? (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                              <span>Seluruh Kebutuhan Material WO Sudah Diambil Lengkap (100%)</span>
                            </div>
                            <p className="text-[11px] text-emerald-800 mt-0.5">
                              Semua item material ({modalMats.length} jenis) telah diambil oleh Vendor
                              {reservationWo.suratJalanNumber ? ` (SJ Terakhir: ${reservationWo.suratJalanNumber})` : ''}. Tidak dapat menerbitkan reservasi baru pada WO ini.
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-white text-emerald-800 border border-emerald-300 font-bold text-[11px] whitespace-nowrap shrink-0 self-start sm:self-center">
                          ✓ Reservasi Selesai & Terkunci
                        </span>
                      </div>
                    ) : (() => {
                      const mats = reservationWo.materials || [];
                      const taken = mats.filter((m) => m.isTaken && (m.qtyTaken || 0) > 0);
                      const held = mats.filter((m) => m.isHold);
                      if (taken.length === 0 && held.length === 0) return null;
                      return (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs shadow-2xs">
                          <div className="flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800">Status Pengambilan Fisik oleh Rekanan Vendor: </span>
                              {taken.length > 0 && (
                                <span className="text-emerald-700 font-bold mr-2">
                                  ✓ {taken.length} Jenis Material Sudah Diambil ({reservationWo.suratJalanNumber ? `SJ: ${reservationWo.suratJalanNumber}` : 'Tercatat Loket Gudang'})
                                </span>
                              )}
                              {held.length > 0 && (
                                <span className="text-rose-700 font-bold">
                                  ⛔ {held.length} Material Ditahan (Hold Pengawas)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Input No Reservasi SAP & Non-SAP, Tanggal & Catatan Pengawas */}
                    {(() => {
                      const hasSapReserved = Boolean(reservationWo.reservationNumber) || (reservationWo.materials || []).some((m) => (m.qtyReservedSap || 0) > 0 || getTakenByChannel(m).sap > 0);
                      const hasNonSapReserved = Boolean(reservationWo.reservationNumberNonStock) || (reservationWo.materials || []).some((m) => (m.qtyReservedNonSap || 0) > 0 || getTakenByChannel(m).nonSap > 0);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                          <div>
                            <div className="mb-1">
                              <label className={`block text-xs font-bold ${hasSapReserved ? 'text-blue-900' : 'text-slate-400'}`}>
                                No. Reservasi SAP
                              </label>
                            </div>
                            <input
                              type="text"
                              disabled={!hasSapReserved || isAllTakenInModal}
                              value={hasSapReserved ? resNumber : ''}
                              onChange={(e) => setResNumber(e.target.value)}
                              placeholder={hasSapReserved ? 'Contoh: RES-SAP/UP3-BTS/...' : '(Tidak ada Qty SAP diisi)'}
                              className={`w-full px-3 py-2 text-xs rounded-xl font-mono font-bold transition shadow-2xs ${
                                hasSapReserved && !isAllTakenInModal
                                  ? 'bg-white border border-slate-300 text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                  : 'bg-slate-100/90 border border-slate-200 text-slate-500 cursor-not-allowed select-none'
                              }`}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              {hasSapReserved ? 'Untuk material stok gudang SAP.' : 'Otomatis aktif jika kolom QTY SAP terisi.'}
                            </p>
                          </div>

                          <div>
                            <div className="mb-1">
                              <label className={`block text-xs font-bold ${hasNonSapReserved ? 'text-indigo-900' : 'text-slate-400'}`}>
                                No. Reservasi Non-SAP
                              </label>
                            </div>
                            <input
                              type="text"
                              disabled={!hasNonSapReserved || isAllTakenInModal}
                              value={hasNonSapReserved ? resNumberNonStock : ''}
                              onChange={(e) => setResNumberNonStock(e.target.value)}
                              placeholder={hasNonSapReserved ? 'Contoh: RES-NONSAP/UP3-BTS/...' : '(Tidak ada Qty Non-SAP diisi)'}
                              className={`w-full px-3 py-2 text-xs rounded-xl font-mono font-bold transition shadow-2xs ${
                                hasNonSapReserved && !isAllTakenInModal
                                  ? 'bg-white border border-slate-300 text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                  : 'bg-slate-100/90 border border-slate-200 text-slate-500 cursor-not-allowed select-none'
                              }`}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              {hasNonSapReserved ? 'Untuk material pabrikan/tiang/non-SAP.' : 'Otomatis aktif jika kolom QTY NON-SAP terisi.'}
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Tanggal Terbit <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="date"
                              disabled={isAllTakenInModal}
                              value={resDate}
                              onChange={(e) => setResDate(e.target.value)}
                              className={`w-full px-3 py-2 text-xs border rounded-xl font-semibold shadow-2xs ${
                                isAllTakenInModal
                                  ? 'bg-slate-100/90 border-slate-200 text-slate-500 cursor-not-allowed'
                                  : 'bg-white border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                              }`}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              Tanggal penerbitan reservasi.
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Catatan Pengawas Lapangan
                            </label>
                            <input
                              type="text"
                              disabled={isAllTakenInModal}
                              value={resNotes}
                              onChange={(e) => setResNotes(e.target.value)}
                              placeholder="Catatan pengambilan material..."
                              className={`w-full px-3 py-2 text-xs border rounded-xl shadow-2xs ${
                                isAllTakenInModal
                                  ? 'bg-slate-100/90 border-slate-200 text-slate-500 cursor-not-allowed'
                                  : 'bg-white border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                              }`}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              Instruksi logistik & vendor.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Tabel Input Material */}
                    {renderMaterialSectionTable(
                      allMats,
                      'Daftar Alokasi Material WO',
                      'Rincian seluruh kebutuhan material yang dialokasikan untuk pekerjaan WO ini',
                      'Surat Jalan TUG-9 Gudang',
                      'blue'
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setReservationWo(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                {isAllTakenInModal ? 'Tutup' : 'Batal'}
              </button>

              {isAllTakenInModal ? (
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reservasi Selesai — Seluruh Material Sudah Diambil (Tidak Bisa Terbit Reservasi Lagi)</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {reservationWo.isHold ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleConfirmUnhold(reservationWo);
                        setReservationWo({ ...reservationWo, isHold: false, holdReason: undefined });
                      }}
                      className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Buka Penahanan (Unhold)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenHoldModal(reservationWo);
                        setReservationWo(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <PauseCircle className="w-4 h-4" />
                      <span>Tahan Reservasi (Hold)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveReservation}
                    className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Simpan & Terbitkan Reservasi
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2: SUB-MODAL SUBSTITUSI MATERIAL */}
      {/* ---------------------------------------------------------------------- */}
      {substituteItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Substitusi Material Gudang</h3>
              </div>
              <button
                type="button"
                onClick={() => setSubstituteItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Card Status Kebutuhan & Posisi Stok Fisik */}
            {(() => {
              const totalReq = substituteItem.qtyAllocated || substituteItem.qtyReksis || 1;
              const selectedStock = stocks.find((s) => s.code === selectedAltStockCode);

              return (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                      <span>Material Asal: {substituteItem.material}</span>
                      <span className="text-[10px] font-mono text-slate-400">{substituteItem.kode || '—'}</span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 inline-flex items-center gap-2 text-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Kebutuhan WO:</span>
                      <b className="text-slate-800 font-mono text-sm">{totalReq}</b>{' '}
                      <span className="text-[10px] text-slate-600 font-semibold">{substituteItem.unit}</span>
                    </div>
                  </div>

                  {/* Info Material Alternatif yang Dipilih */}
                  {selectedStock && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-indigo-900">
                        <span>Pilihan Pengganti: [{selectedStock.code}] {selectedStock.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-indigo-800 pt-0.5">
                        <span className="font-medium text-slate-600">Stok Fisik Gudang:</span>
                        <b className="font-mono text-indigo-950 bg-white px-2.5 py-0.5 rounded border border-indigo-200 text-xs">
                          {selectedStock.qtyFisik ?? selectedStock.qtySisa ?? 0} {selectedStock.unit}
                        </b>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Filter & Pilih Material Pengganti */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Material Pengganti di Gudang <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10.5px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {filteredSubstituteStocks.length} material cocok
                </span>
              </div>

              {/* Bar Filter: Search & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={substituteSearch}
                    onChange={(e) => handleSubstituteSearchChange(e.target.value)}
                    placeholder="Cari nama atau kode material..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                  {substituteSearch && (
                    <button
                      type="button"
                      onClick={() => handleSubstituteSearchChange('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="sm:col-span-5">
                  <select
                    value={substituteCategory}
                    onChange={(e) => handleSubstituteCategoryChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {availableStockCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropdown Material Pengganti */}
              <select
                value={selectedAltStockCode}
                onChange={(e) => setSelectedAltStockCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {filteredSubstituteStocks.length === 0 ? (
                  <option value="" disabled>
                    (Tidak ada material yang cocok dengan pencarian/kategori)
                  </option>
                ) : (
                  filteredSubstituteStocks.map((st) => (
                    <option key={st.code} value={st.code}>
                      [{st.code}] {st.name} — (Stok Fisik: {st.qtyFisik ?? st.qtySisa} {st.unit})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jumlah Qty Pengganti
              </label>
              <input
                type="number"
                min={1}
                value={substituteQty}
                onChange={(e) => setSubstituteQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Substitusi <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={substituteReason}
                onChange={(e) => setSubstituteReason(e.target.value)}
                placeholder="Contoh: Stok material asli kosong, diganti spesifikasi setara sesuai persetujuan Asman..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSubstituteItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSubstitute}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
              >
                Terapkan Substitusi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2B: SUB-MODAL EDIT MATERIAL WO */}
      {/* ---------------------------------------------------------------------- */}
      {editingWoItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Data Material WO</h3>
                  <p className="text-[11px] text-slate-500">Sesuaikan volume dan rincian kebutuhan material WO ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingWoItem(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama / Uraian Material <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editingWoItem.material}
                  onChange={(e) => setEditingWoItem({ ...editingWoItem, material: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Material</label>
                  <input
                    type="text"
                    value={editingWoItem.kode}
                    onChange={(e) => setEditingWoItem({ ...editingWoItem, kode: e.target.value })}
                    placeholder="Contoh: 1030097"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={editingWoItem.unit}
                    onChange={(e) => setEditingWoItem({ ...editingWoItem, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Volume / Kebutuhan WO <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={editingWoItem.qty}
                  onChange={(e) => setEditingWoItem({ ...editingWoItem, qty: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editingWoItem.catatan}
                  onChange={(e) => setEditingWoItem({ ...editingWoItem, catatan: e.target.value })}
                  placeholder="Keterangan penyesuaian..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingWoItem(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditWoItem}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 3: SUB-MODAL HOLD RESERVASI */}
      {/* ---------------------------------------------------------------------- */}
      {holdTargetWo && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <PauseCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Tahan Material WO (HOLD)</h3>
              </div>
              <button
                type="button"
                onClick={() => setHoldTargetWo(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Menahan material untuk WO <b className="text-slate-800">{holdTargetWo.id}</b> ({holdTargetWo.customerName}) agar tidak dapat diambil sebelum kendala terselesaikan.
            </p>

            {/* Quick Template Alasan WO */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Pilih Alasan Cepat:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Stok material di gudang kosong / menunggu pasokan UID',
                  'Kendala izin tanam tiang warga / perlintasan jalur',
                  'Lokasi pekerjaan belum siap / koordinasi eksternal',
                  'Evaluasi revisi desain konstruksi & re-survey',
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setHoldReasonInput(tmpl)}
                    className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition text-slate-700 cursor-pointer text-left"
                  >
                    + {tmpl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Penahanan (Hold Reason) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={holdReasonInput}
                onChange={(e) => setHoldReasonInput(e.target.value)}
                placeholder="Contoh: Stok material trafo kosong di gudang, menunggu kiriman pengadaan pusat..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setHoldTargetWo(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmHold}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer"
              >
                Tahan Material Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 3B: SUB-MODAL HOLD ITEM MATERIAL DENGAN INPUT KETERANGAN PENGAWAS */}
      {/* ---------------------------------------------------------------------- */}
      {holdTargetItem && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200 shadow-2xs">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tahan Pengeluaran Material (HOLD ITEM)</h3>
                  <p className="text-[11px] text-slate-500">
                    Input keterangan & alasan pengawas untuk material yang ditahan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHoldTargetItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ringkasan Material Yang Di-Hold */}
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-950">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-slate-800 text-[12.5px] leading-snug">
                  {holdTargetItem.material}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                  {holdTargetItem.qtyAllocated || holdTargetItem.qtyReksis || 1} {holdTargetItem.unit}
                </span>
              </div>
              {holdTargetItem.kode && (
                <div className="text-[11px] font-mono text-slate-500">
                  Kode SAP / Normalisasi: {holdTargetItem.kode}
                </div>
              )}
              {holdTargetItem.kategori && (
                <div className="text-[10.5px] text-slate-600">
                  Kelompok: <span className="font-semibold">{holdTargetItem.kategori}</span>
                </div>
              )}
            </div>

            {/* Quick Template Alasan (Chips Cepat) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Pilih Alasan Cepat (Template PLN):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Stok fisik di gudang kosong / habis',
                  'Menunggu kiriman pasokan dari UID',
                  'Stok kritis / diprioritaskan untuk penanganan gangguan',
                  'Material cacat fisik / rusak saat inspeksi',
                  'Perlu uji kelayakan / uji lab sebelum dipasang',
                  'Lokasi pekerjaan belum siap / izin warga terkendala',
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setItemHoldReasonInput(tmpl)}
                    className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition text-slate-700 cursor-pointer text-left"
                  >
                    + {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Input Alasan Pengawas */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Keterangan / Alasan Penahanan Pengawas <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={itemHoldReasonInput}
                onChange={(e) => setItemHoldReasonInput(e.target.value)}
                placeholder="Tuliskan keterangan detail alasan penahanan material ini agar diketahui petugas gudang dan rekanan..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 leading-relaxed font-sans"
              />
              <p className="text-[10px] text-slate-500">
                Keterangan ini akan tampil di Surat Jalan Gudang dan akun Vendor Pelaksana sebagai penjelas status penahanan.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setHoldTargetItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmHoldItem}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Simpan Penahanan (HOLD)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 4: DETAIL MATERIAL WO */}
      {/* ---------------------------------------------------------------------- */}
      {detailWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rincian Material: {detailWo.id}
                </h3>
                <p className="text-xs text-slate-500">{detailWo.customerName} - {detailWo.vendor}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailWo(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Nama Material</th>
                    <th className="py-2 px-3">Kode Material</th>
                    <th className="py-2 px-3 text-center">Volume</th>
                    <th className="py-2 px-3 text-center">Satuan</th>
                    <th className="py-2 px-3 text-center">Sumber Pasokan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const isDetailTiang = isTiangWo(detailWo);
                    const detailMats = (detailWo.materials || []).filter((m) => {
                      if (isDetailTiang) {
                        return isTiangMaterial(m) || getKelompokMaterial(m) === 'D. TIANG BETON';
                      }
                      return !isTiangMaterial(m) && getKelompokMaterial(m) !== 'D. TIANG BETON';
                    });

                    if (detailMats.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            Tidak ada material terdaftar pada WO ini.
                          </td>
                        </tr>
                      );
                    }

                    return detailMats.map((m, idx) => {
                      const kelompok = getKelompokMaterial(m);
                      const isTiang = isTiangMaterial(m) || kelompok === 'D. TIANG BETON';
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-400 text-center align-top">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 align-top">
                            <div>{m.material}</div>
                            {m.isHold && (
                              <div className="mt-1">
                                <span className="inline-block text-[9.5px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                  ⛔ DITAHAN PENGAWAS: {m.holdReason || 'Stok Kosong / Ditahan'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500 align-top">{m.kode || '—'}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800 align-top">{m.qtyAllocated || m.qtyReksis || 1}</td>
                          <td className="py-2 px-3 text-center text-slate-500 align-top">{m.unit || 'Buah'}</td>
                          <td className="py-2 px-3 text-center align-top">
                            {isTiang ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap inline-flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5 text-indigo-600" />
                                <span>Pabrikan Rekanan UID</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap inline-flex items-center gap-1">
                                <Boxes className="w-2.5 h-2.5 text-blue-600" />
                                <span>Gudang UP3 (TUG-9)</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setDetailWo(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 5: CETAK / PREVIEW SURAT JALAN (TUG-9 STOK & DO TIANG NON-STOK)  */}
      {/* ---------------------------------------------------------------------- */}
      {viewSuratJalanModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Header Dialog */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Dokumen Formulir Surat Jalan TUG-9 Gudang UP3
                  </h3>
                  <p className="text-[10px] text-slate-300">
                    Sistem Distribusi Logistik Ketenagalistrikan PT PLN (Persero)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewSuratJalanModal(null)}
                className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Body (Printable Area) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs bg-white">
              {/* Kop Surat PLN */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                <div>
                  <div className="font-black text-sm tracking-wide text-blue-900">PT PLN (PERSERO)</div>
                  <div className="font-bold text-xs text-slate-700">DISTRIBUSI BANTEN — UP3 BANTEN SELATAN</div>
                  <div className="text-[10px] text-slate-500">
                    Gudang Logistik Distribusi UP3 Banten Selatan
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded text-[10px] font-bold border font-mono bg-blue-50 text-blue-800 border-blue-300">
                    FORMULIR TUG-9 GUDANG
                  </span>
                  <div className="text-[10.5px] font-mono text-slate-600 mt-1">
                    No: <b>{viewSuratJalanModal.wo.reservationNumber || resNumber}</b>
                  </div>
                </div>
              </div>

              {/* Info Pekerjaan & Pihak Terkait */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div><span className="text-slate-400">Nomor WO / SPK:</span> <b className="font-mono text-slate-800">{viewSuratJalanModal.wo.id}</b> {viewSuratJalanModal.wo.spkNumber ? `(${viewSuratJalanModal.wo.spkNumber})` : ''}</div>
                  <div><span className="text-slate-400">Pelanggan:</span> <b className="text-slate-800">{viewSuratJalanModal.wo.customerName}</b></div>
                  <div><span className="text-slate-400">Lokasi Survey:</span> <span className="text-slate-700">{viewSuratJalanModal.wo.location || '-'}</span></div>
                </div>
                <div className="space-y-1">
                  <div><span className="text-slate-400">Vendor Rekanan:</span> <b className="text-slate-800">{viewSuratJalanModal.wo.vendor}</b></div>
                  <div><span className="text-slate-400">Pengawas Lapangan:</span> <b className="text-slate-800">{viewSuratJalanModal.wo.supervisor1 || viewSuratJalanModal.wo.supervisor || 'Hasian Sitorus'}</b></div>
                  <div><span className="text-slate-400">Tanggal Terbit:</span> <span className="font-mono text-slate-700">{resDate || new Date().toISOString().split('T')[0]}</span></div>
                </div>
              </div>

              {/* Rincian Material */}
              <div>
                <h5 className="font-bold text-xs uppercase text-slate-900 mb-2">
                  Daftar Pengeluaran Material (TUG-9 Gudang)
                </h5>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 text-center w-10">No</th>
                      <th className="py-2 px-3 text-center font-mono w-28">No Material</th>
                      <th className="py-2 px-3">Uraian Nama Material</th>
                      <th className="py-2 px-3 text-center w-24">Satuan</th>
                      <th className="py-2 px-3 text-center w-28 font-bold">Qty Dikeluarkan</th>
                      <th className="py-2 px-3 text-center w-28">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(() => {
                      const mats = viewSuratJalanModal.wo.materials || [];
                      if (mats.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-400">
                              Tidak ada material untuk kategori ini dalam surat jalan.
                            </td>
                          </tr>
                        );
                      }
                      return mats.map((m, idx) => {
                        const stock = findMatchingStock(m.material, m.kode);
                        const req = m.qtyAllocated || m.qtyReksis || 1;
                        const qty = m.qtyReserved !== undefined ? m.qtyReserved : req;
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">{m.kode || (stock ? stock.code : '—')}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{m.material}</td>
                            <td className="py-2 px-3 text-center text-slate-600">{m.unit || 'Buah'}</td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-blue-900 bg-blue-50/50">{qty}</td>
                            <td className="py-2 px-3 text-center text-[10px] text-slate-500">
                              {m.isHold ? 'DITAHAN' : 'SIAP AMBIL'}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan 3 Pihak */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px] border-t border-slate-200">
                <div>
                  <div className="text-slate-500">Penerima (Vendor Rekanan)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                    ({viewSuratJalanModal.wo.vendor})
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">
                    {viewSuratJalanModal.type === 'STOK' ? 'Petugas Gudang UP3' : 'Supervisor Pabrikan Tiang'}
                  </div>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                    (Petugas Logistik PLN)
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Pengawas Lapangan PLN</div>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                    ({viewSuratJalanModal.wo.supervisor1 || viewSuratJalanModal.wo.supervisor || 'Hasian Sitorus'})
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Dialog */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setViewSuratJalanModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
