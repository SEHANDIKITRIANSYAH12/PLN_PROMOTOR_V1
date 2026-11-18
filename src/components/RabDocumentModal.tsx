'use client';

import React, { useState, useMemo } from 'react';
import { SurveyRecord, WorkOrderRecord } from '@/types';
import { calculateRabFromSurvey, RabRowItem } from '@/data/rabMasterData';
import {
  generateWorkTitlePln,
  getSurveyPackages,
  listSurveyDocs,
  calculateTiangRabFromSurvey,
  getHeaderDepth,
  SurveyDocType,
} from '@/data/surveyRabCalculator';
import { usePromotorStore, isWoEditable } from '@/store/usePromotorStore';
import {
  X,
  Printer,
  PenTool,
  Edit3,
  Save,
  Trash2,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';

const DEFAULT_HASIAN_PARAF = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCI+PHBhdGggZD0iTSA0MCw3MCBDIDUwLDUwIDcwLDI1IDc4LDEyIEMgODIsNSA3NSw4IDcwLDIyIEMgNjIsNDggNTUsODAgNDgsMTEyIE0gNTIsNzIgQyA2MCw0OCA3Miw0MCA4Miw0MiBDIDkwLDQ0IDg4LDYyIDg5LDc2IEMgOTIsMjggMTAyLDIwIDEwOCwzMCBDIDExMiwzOCAxMTAsNjggMTEyLDgwIEMgMTE2LDQ4IDEyNiw0NSAxMzIsNTYgQyAxMzYsNjYgMTM4LDgyIDE0NCwxMDIgTSA2Miw1OCBMIDEzMCw1NiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAzMzY2IiBzdHJva2Utd2lkdGg9IjIuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';

const DEFAULT_WEGIG_PARAF = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMjAgMTIwIiB3aWR0aD0iMjIwIiBoZWlnaHQ9IjEyMCI+CiAgPHBhdGggZD0iTSAyOCw2MiBDIDM4LDMyIDUwLDIyIDYyLDQ4IEMgNzIsNzAgNzgsODUgODYsNTIgQyA5NCwyMiAxMDYsMzAgMTE0LDY1IEMgMTIwLDg1IDEyOCw0NSAxMzgsNDAgQyAxNDgsMzUgMTU2LDYwIDE2OCw1MiBDIDE3OCw0NCAxODYsMzAgMTk2LDI1IE0gNDAsODggQyA3NSw4MiAxMjAsODAgMTg1LDgyIE0gNzAsOTUgQyAxMDUsOTIgMTQ1LDkwIDE3NSw5MyIgCiAgICBmaWxsPSJub25lIiBzdHJva2U9IiMwMDJiNjYiIHN0cm9rZS13aWR0aD0iMi44IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';

/** Penunjuk baris dokumen ke item WO asalnya (indeks di `materials` / `jasaItems`). */
type WoItemRef = { group: 'materials' | 'jasaItems'; index: number };
type DocRow = RabRowItem & { woRef?: WoItemRef };

const refKey = (ref: WoItemRef) => `${ref.group}:${ref.index}`;

/** Input volume ditulis bebas (boleh koma desimal); NaN berarti belum valid. */
const parseVolume = (raw: string) => (raw.trim() === '' ? NaN : Number(raw.replace(',', '.')));

/** Tab dokumen di mode RAB survey. */
const SURVEY_DOC_TABS: Record<SurveyDocType, { label: string; activeClass: string }> = {
  paket1: { label: 'RAB JTM (Paket 1)', activeClass: 'bg-purple-600' },
  paket2: { label: 'RAB JTR (Paket 2)', activeClass: 'bg-blue-600' },
  tiang: { label: 'RAB WO Tiang', activeClass: 'bg-sky-700' },
};

/** Subtotal, PPN 11%, total, dan pembulatan dokumen RAB/WO — sama persis dengan tabel. */
const computeDocTotals = (items: RabRowItem[]) => {
  let matRencana = 0;
  let matRealisasi = 0;
  let jasRencana = 0;
  let jasRealisasi = 0;

  items.forEach((it) => {
    if (!it.isHeader) {
      if (it.section === 'MATERIAL') {
        matRencana += it.rencanaTotal;
        matRealisasi += it.realisasiTotal;
      } else {
        jasRencana += it.rencanaTotal;
        jasRealisasi += it.realisasiTotal;
      }
    }
  });

  const totRencana = matRencana + jasRencana;
  const totRealisasi = matRealisasi + jasRealisasi;
  const ppnRencana = Math.round(totRencana * 0.11);
  const ppnRealisasi = Math.round(totRealisasi * 0.11);
  const grandRencana = totRencana + ppnRencana;
  const grandRealisasi = totRealisasi + ppnRealisasi;

  return {
    matRencana,
    matRealisasi,
    jasRencana,
    jasRealisasi,
    totRencana,
    totRealisasi,
    ppnRencana,
    ppnRealisasi,
    grandRencana,
    grandRealisasi,
    dibulatkanRencana: Math.round(grandRencana / 1000) * 1000,
    dibulatkanRealisasi: Math.round(grandRealisasi / 1000) * 1000,
  };
};

interface RabDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey?: SurveyRecord | null;
  woData?: WorkOrderRecord | null;
  /** Kumpulan WO milik satu pelanggan. Kalau diisi, dokumen bisa dipindah-pindah
   *  lewat tab (WO P1 / WO P2 / WO Tiang) tanpa menutup modal. */
  woList?: WorkOrderRecord[];
  /** Dokumen awal. Di mode RAB survey hanya paket yang terbentuk dari isian survey yang bisa dipilih. */
  initialPaket?: SurveyDocType;
  mode?: 'rab' | 'wo'; // 'rab' = Survey Output (no signatures), 'wo' = Work Order Contract (with signatures)
  /** Asman boleh merevisi volume rencana langsung di dokumen selama WO menunggu persetujuan. */
  allowVolumeEdit?: boolean;
  /** Callback opsional saat menyimpan volume pada WO draft / preview (sebelum WO resmi di-submit ke store) */
  onSavePreviewVolumes?: (woId: string, volumes: { materials: number[]; jasaItems: number[] }) => void;
}

export const RabDocumentModal: React.FC<RabDocumentModalProps> = ({
  isOpen,
  onClose,
  survey: propSurvey,
  woData: woDataProp,
  woList,
  initialPaket = 'paket2',
  mode,
  allowVolumeEdit = false,
  onSavePreviewVolumes,
}) => {
  const { workOrders, surveys, customKhsPrices, updateWoVolumes, removeWoMaterialItem, removeWoJasaItem, updateWoSignatures, currentPage } = usePromotorStore();
  const isAsmanPage = currentPage === 'persetujuan-wo';

  // --- Tab dokumen WO: satu tab per WO milik pelanggan yang sama ---
  const tabWos = useMemo(
    () => (woList && woList.length > 0 ? woList : woDataProp ? [woDataProp] : []),
    [woList, woDataProp]
  );
  const [activeWoId, setActiveWoId] = useState<string | null>(woDataProp?.id ?? null);

  // Semua bagian dokumen di bawah ini membaca `woData` = WO yang sedang ditab.
  // Tab yang dipilih tidak ada di daftar (mis. pemakai berpindah ke WO lain tanpa
  // menutup modal) -> jatuh kembali ke WO yang dibuka, jadi tidak pernah kosong.
  // Selalu dibaca ulang dari store supaya revisi volume langsung tampil di dokumen.
  const selectedWo = tabWos.find((w) => w.id === activeWoId) ?? woDataProp ?? tabWos[0] ?? null;
  const woData = (selectedWo && workOrders.find((w) => w.id === selectedWo.id)) || selectedWo;

  const isWoMode = mode ? mode === 'wo' : Boolean(woDataProp);

  // --- Revisi volume rencana langsung di tabel dokumen ---
  const canEditVolume = allowVolumeEdit && isWoMode && Boolean(woData && isWoEditable(woData));
  const [isEditingVolume, setIsEditingVolume] = useState(false);
  const [volumeDrafts, setVolumeDrafts] = useState<Record<string, string>>({});
  const isVolumeEditActive = canEditVolume && isEditingVolume;

  const stopVolumeEdit = () => {
    setIsEditingVolume(false);
    setVolumeDrafts({});
  };

  const resolvePaket = (wo?: WorkOrderRecord | null, initPkt: SurveyDocType = 'paket2'): SurveyDocType => {
    if (!wo) return initPkt;
    const cat = (wo.category || '').toLowerCase();
    const no = (wo.noWorkOrder || wo.id || '').toLowerCase();
    if (cat.includes('paket 1') || cat.includes('jtm') || no.includes('.p1.')) {
      return 'paket1';
    }
    if (cat.includes('paket 2') || cat.includes('jtr') || no.includes('.p2.')) {
      return 'paket2';
    }
    return initPkt;
  };

  const [activeDoc, setActiveDoc] = useState<SurveyDocType>(resolvePaket(woData, initialPaket));

  // Paket ikut berpindah saat WO yang dibuka / paket awal berganti. Disinkronkan
  // saat render (bukan di effect) supaya tidak ada render ganda.
  const paketSourceKey = `${woData?.id ?? ''}|${woData?.category ?? ''}|${woData?.noWorkOrder ?? ''}|${initialPaket}`;
  const [syncedPaketKey, setSyncedPaketKey] = useState(paketSourceKey);
  if (syncedPaketKey !== paketSourceKey) {
    setSyncedPaketKey(paketSourceKey);
    setActiveDoc(resolvePaket(woData, initialPaket));
  }
  const [realisasiOverrides, setRealisasiOverrides] = useState<Record<string, number>>({});

  // Resolve survey
  const survey = useMemo(() => {
    // Ambil versi terbaru dari store agar koreksi AP2T (nama, daya, alamat) langsung tampil.
    if (propSurvey) return surveys.find((s) => s.id === propSurvey.id) || propSurvey;
    if (woData) {
      const found = surveys.find(
        (s) =>
          (woData.surveyId && s.id === woData.surveyId) ||
          (woData.idpel && s.idpel === woData.idpel) ||
          s.customerName.toLowerCase() === woData.customerName.toLowerCase() ||
          s.customerName.toLowerCase().includes(woData.customerName.toLowerCase()) ||
          woData.customerName.toLowerCase().includes(s.customerName.toLowerCase())
      );
      if (found) return found;
      // Fallback virtual survey from woData
      return {
        id: woData.id,
        customerName: woData.customerName,
        idpel: woData.idpel,
        location: 'UP3 Banten Selatan',
        jobType: 'Pasang Baru',
        status: 'Terverifikasi' as const,
        poles: [],
        createdAt: '2026',
      } as SurveyRecord;
    }
    return null;
  }, [propSurvey, woData, surveys]);

  // Perubahan daya menampilkan daya & tarif lama di samping yang baru.
  const dayaBaruVal = survey?.dayaBaru || survey?.daya || '-';
  const tarifBaruVal = survey?.tarifBaru || survey?.tarif || '-';
  const dayaTarifRows: Array<[string, string]> = survey?.dayaLama || survey?.tarifLama
    ? [
        ['Daya Baru', dayaBaruVal],
        ['Tarif Baru', tarifBaruVal],
        ['Daya Lama', survey.dayaLama || '-'],
        ['Tarif Lama', survey.tarifLama || '-'],
      ]
    : [
        ['Daya', dayaBaruVal],
        ['Tarif', tarifBaruVal],
      ];

  // Mode RAB survey: hanya dokumen paket yang terbentuk dari isian survey yang ditampilkan.
  const surveyDocs = useMemo(
    () => (isWoMode ? [] : listSurveyDocs(getSurveyPackages(survey))),
    [isWoMode, survey]
  );
  const noSurveyDoc = !isWoMode && surveyDocs.length === 0;
  const currentDoc: SurveyDocType =
    isWoMode || noSurveyDoc || surveyDocs.includes(activeDoc) ? activeDoc : surveyDocs[0];
  const activePaket: 'paket1' | 'paket2' = currentDoc === 'paket1' ? 'paket1' : 'paket2';
  const isSurveyTiang = !isWoMode && currentDoc === 'tiang';

  // Judul & nama bagian dokumen mengikuti jenis WO yang sedang dibuka, bukan
  // hanya paket 1/2. WO Tiang berdiri sendiri di data, jadi labelnya pun sendiri.
  const docMeta = useMemo(() => {
    const cat = (woData?.category || '').toLowerCase();
    const no = (woData?.noWorkOrder || woData?.id || '').toLowerCase();
    const isTiang = isSurveyTiang || cat.includes('tiang') || cat.includes('(tb)') || no.includes('.tb.');
    if (isTiang) {
      return {
        isTiang,
        titlePaket: 'WO TIANG',
        rabTitlePaket: 'WO TIANG (TB)',
        totalLabel: 'WO TIANG (TB)',
        matSub: 'MATERIAL TIANG BETON & PENUNJANG',
        jasSub: 'PEKERJAAN PENDIRIAN TIANG BETON',
      };
    }
    return activePaket === 'paket1'
      ? {
          isTiang,
          titlePaket: 'PAKET 1',
          rabTitlePaket: 'JTM (PAKET 1)',
          totalLabel: 'PAKET 1 JTM',
          matSub: 'MATERIAL SUTM & GARDU',
          jasSub: 'PEKERJAAN SUTM & GARDU DISTRIBUSI',
        }
      : {
          isTiang,
          titlePaket: 'PAKET 2',
          rabTitlePaket: 'JTR (PAKET 2)',
          totalLabel: 'PAKET 2 JTR',
          matSub: 'BOX APP, JTR DAN LENGKAPAN',
          jasSub: 'JASA PEMASANGAN/PENARIKAN SUTR DAN LENGKAPAN',
        };
  }, [woData, activePaket, isSurveyTiang]);

  // Label pendek untuk tab WO
  const woTabLabel = (category?: string): string => {
    const c = (category || '').toLowerCase();
    if (c.includes('tiang')) return 'WO Tiang';
    if (c.includes('paket 1')) return 'WO P1';
    if (c.includes('paket 2')) return 'WO P2';
    return category || 'WO';
  };

  // Match WO
  const targetCategory = isSurveyTiang ? 'WO Tiang' : activePaket === 'paket1' ? 'WO Paket 1' : 'WO Paket 2';
  const matchedWo = useMemo(() => {
    // Kalau pemakai membuka dokumen WO tertentu, tampilkan WO itu apa adanya.
    // Pencocokan di bawah hanya untuk mode RAB hasil survey (tanpa woData); kalau
    // tidak dikunci, WO Tiang akan tertukar dengan WO Paket 2 milik pelanggan sama.
    if (woData) return woData;
    const found = workOrders.find(
      (w) =>
        w.category === targetCategory &&
        Boolean(
          survey &&
          (w.idpel === survey.idpel ||
            w.customerName.toLowerCase().includes(survey.customerName.toLowerCase()) ||
            survey.customerName.toLowerCase().includes(w.customerName.toLowerCase()))
        )
    );
    return found || null;
  }, [woData, targetCategory, workOrders, survey]);

  // Penyedia B/J, SPK, nomor WO, masa berlaku, dan pengawas baru ditetapkan
  // saat WO di-apply. Kalau WO-nya belum punya nilai itu, jangan dikarang:
  // pakai penanda '—' yang sudah ditangani blok cetak sebagai strip kosong.
  const vendorName = matchedWo?.vendor || '—';
  const noSpk = matchedWo?.spkNumber || '—';
  const noWo = matchedWo?.noWorkOrder || matchedWo?.id || '—';
  const tglAwal = matchedWo?.validFrom || '—';
  const tglAkhir = matchedWo?.validTo || '—';
  const pengawas1 = matchedWo?.supervisor1 || matchedWo?.supervisor || '—';
  const pengawas2 = matchedWo?.supervisor2 || '—';

  // Nama Pekerjaan Otomatis Sesuai Rumus Excel (PROJECT MASTER WO KHS 2026.xlsx -> ISIAN PEKERJAAN B478/C478)
  const workTitle = useMemo(() => {
    const dataSource = survey || matchedWo || woData;
    const generated = generateWorkTitlePln(dataSource, docMeta.isTiang ? 'tiang' : activePaket);
    if (generated && generated !== '-') return generated;
    return survey?.customerName || matchedWo?.customerName || '-';
  }, [survey, matchedWo, woData, activePaket, docMeta.isTiang]);

  // State Penandatangan (Dapat diubah dan diberi tanda tangan digital)
  const [approverName, setApproverName] = useState(matchedWo?.approverName || 'WEGIG DIDIK KURNIAWAN');
  const [approverRole, setApproverRole] = useState(matchedWo?.approverRole || 'ASMAN KONSTRUKSI');
  const [approverSig, setApproverSig] = useState<string | null>(matchedWo?.approverSignature || null);

  const [creatorName, setCreatorName] = useState(matchedWo?.creatorName || 'HASIAN EFRAVODITUS SITORUS');
  const [creatorRole, setCreatorRole] = useState(matchedWo?.creatorRole || 'TC LOLA KONS');
  const [creatorSig, setCreatorSig] = useState<string | null>(matchedWo?.creatorSignature || null);

  const [sigPadConfig, setSigPadConfig] = useState<{
    isOpen: boolean;
    type: 'approver' | 'creator';
    title: string;
    initialName: string;
    initialRole: string;
    initialSig?: string;
  }>({
    isOpen: false,
    type: 'creator',
    title: '',
    initialName: '',
    initialRole: '',
  });

  // Data penandatangan mengikuti WO yang cocok setiap kali WO itu berubah.
  const [signerSourceWo, setSignerSourceWo] = useState(matchedWo);
  if (matchedWo && matchedWo !== signerSourceWo) {
    setSignerSourceWo(matchedWo);
    if (matchedWo.approverName) setApproverName(matchedWo.approverName);
    if (matchedWo.approverRole) setApproverRole(matchedWo.approverRole);
    setApproverSig(matchedWo.approverSignature || null);
    if (matchedWo.creatorName) setCreatorName(matchedWo.creatorName);
    if (matchedWo.creatorRole) setCreatorRole(matchedWo.creatorRole);
    setCreatorSig(matchedWo.creatorSignature || null);
  }

  // Calculate items
  const rabItemsSaved = useMemo(() => {
    let baseItems: DocRow[] = [];

    // 1. Coba kalkulasi dari data survey jika tersedia tiang.
    //    Khusus WO Tiang, isi dokumen memang milik WO-nya sendiri (material & jasa
    //    tiang), jadi jangan dihitung ulang dari survey paket 2. Di mode RAB survey,
    //    WO Tiang = baris tiang dari Paket 1 & 2, dan paket tanpa pemicu tidak dihitung.
    if (isSurveyTiang && survey) {
      baseItems = calculateTiangRabFromSurvey(survey, customKhsPrices);
    } else if (
      survey &&
      !noSurveyDoc &&
      !docMeta.isTiang &&
      (!isWoMode || (survey.poles && survey.poles.length > 0))
    ) {
      baseItems = calculateRabFromSurvey(survey, activePaket, customKhsPrices);
    }

    // 2. Jika item aktif dari survey kosong, gunakan material langsung dari Work Order (Fallback cerdas)
    const activeSurveyItems = baseItems.filter((it) => !it.isHeader && (it.rencanaVol > 0 || it.realisasiVol > 0));
    const targetWo = woData || matchedWo;

    if (activeSurveyItems.length === 0 && targetWo?.materials && targetWo.materials.length > 0) {
      const subTitle = docMeta.matSub;
      baseItems = targetWo.materials.map((m, idx) => {
        const vol = m.qtyAllocated || m.qtyReksis || 1;
        // Harga satuan dari WO dipakai kalau benar-benar ada (0 dianggap belum ada).
        let harga = m.hargaSatuan && m.hargaSatuan > 0 ? m.hargaSatuan : 250000;
        const matLower = m.material.toLowerCase();
        if (!m.hargaSatuan || m.hargaSatuan <= 0) {
          if (matLower.includes('tiang beton 11') || matLower.includes('tiang 11')) harga = 2850000;
          else if (matLower.includes('tiang beton 12') || matLower.includes('tiang 12')) harga = 3450000;
          else if (matLower.includes('tiang beton 9') || matLower.includes('tiang 9')) harga = 1950000;
          else if (matLower.includes('cross arm')) harga = 485000;
          else if (matLower.includes('isolator')) harga = 185000;
          else if (matLower.includes('lvtc') || matLower.includes('twisted')) harga = 48500;
          else if (matLower.includes('a3cs')) harga = 56000;
          else if (matLower.includes('suspension')) harga = 75000;
          else if (matLower.includes('dead end') || matLower.includes('tension')) harga = 110000;
          else if (matLower.includes('bracket')) harga = 65000;
        }

        return {
          id: `mat-wo-${idx + 1}`,
          rowNumber: String(idx + 1),
          no: String(idx + 1),
          kode: `MAT-${1000 + idx}`,
          desc: m.material,
          sat: m.unit || 'Buah',
          isHeader: false,
          headerLevel: undefined,
          section: 'MATERIAL' as const,
          subSection: subTitle,
          hargaSatuan: harga,
          rencanaVol: vol,
          rencanaTotal: vol * harga,
          realisasiVol: 0,
          realisasiTotal: 0,
          keterangan: 'Kebutuhan Material WO',
          woRef: { group: 'materials' as const, index: idx },
        };
      });

      // Jasa milik WO (mis. pendirian tiang beton) punya harga sendiri di data,
      // jadi ikut ditampilkan supaya dokumen tidak kehilangan Kelompok Jasa.
      const woJasa = (targetWo.jasaItems || []).filter(
        (j) => (j.qtyTarget || 0) > 0 || (j.hargaSatuan || 0) > 0
      );
      woJasa.forEach((j, idx) => {
        const vol = j.qtyTarget || 0;
        const harga = j.hargaSatuan && j.hargaSatuan > 0 ? j.hargaSatuan : 0;
        baseItems.push({
          id: `jas-wo-${idx + 1}`,
          rowNumber: `J${idx + 1}`,
          no: String(idx + 1),
          kode: j.kode || `JSA-${1000 + idx}`,
          desc: j.deskripsi,
          sat: j.unit || 'Lot',
          isHeader: false,
          headerLevel: undefined,
          section: 'JASA' as const,
          subSection: docMeta.jasSub,
          hargaSatuan: harga,
          rencanaVol: vol,
          rencanaTotal: Math.round(vol * harga),
          realisasiVol: j.qtyRealisasi || 0,
          realisasiTotal: Math.round((j.qtyRealisasi || 0) * harga),
          keterangan: 'Pekerjaan sesuai WO',
          woRef: { group: 'jasaItems', index: (targetWo.jasaItems || []).indexOf(j) },
        });
      });
    }

    // 3. Baris dokumen yang berasal dari survey ditautkan ke item WO-nya. Item WO
    //    dibentuk dari baris survey aktif dengan urutan yang sama, jadi dicocokkan per
    //    (kelompok, uraian/deskripsi) secara berurutan agar item kembar tetap tepat.
    //    Volume WO menjadi acuan dokumen bila sudah direvisi Asman / sedang diedit.
    if (targetWo && activeSurveyItems.length > 0) {
      const isWoCustomized = Boolean(targetWo.volumeEditedAt) || isVolumeEditActive;
      const normalizeDesc = (str?: string) =>
        (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const rowKey = (section?: string, desc?: string) =>
        `${section || ''}|${normalizeDesc(desc)}`;
      const woVolumes = new Map<string, { vol: number; harga: number; ref: WoItemRef }[]>();
      const addVolume = (key: string, vol: number, harga: number | undefined, ref: WoItemRef) => {
        woVolumes.set(key, [...(woVolumes.get(key) || []), { vol, harga: harga || 0, ref }]);
      };
      (targetWo.materials || []).forEach((m, index) =>
        addVolume(rowKey('MATERIAL', m.material), m.qtyAllocated || m.qtyReksis || 0, m.hargaSatuan, { group: 'materials', index })
      );
      (targetWo.jasaItems || []).forEach((j, index) =>
        addVolume(rowKey('JASA', j.deskripsi), j.qtyTarget || 0, j.hargaSatuan, { group: 'jasaItems', index })
      );

      baseItems = baseItems.map((item) => {
        if (item.isHeader || item.rencanaVol <= 0) return item;
        const fromWo = woVolumes.get(rowKey(item.section, item.desc))?.shift();
        if (!fromWo) {
          // Jika WO sudah pernah diedit (misal baris material/jasa ini dihapus dari WO),
          // maka di dokumen resmi WO baris ini harus disembunyikan (rencanaVol = 0)
          if (isWoCustomized) {
            return {
              ...item,
              rencanaVol: 0,
              rencanaTotal: 0,
            };
          }
          return item;
        }
        if (!isWoCustomized) return { ...item, woRef: fromWo.ref };
        const harga = fromWo.harga > 0 ? fromWo.harga : item.hargaSatuan;
        return {
          ...item,
          woRef: fromWo.ref,
          hargaSatuan: harga,
          rencanaVol: fromWo.vol,
          rencanaTotal: Math.round(fromWo.vol * harga),
        };
      });
    }

    return baseItems.map((item) => {
      // 1. Prioritaskan Realisasi Fisik yang diinput Pengawas dari WO jika ada
      const activeWo = woData || matchedWo;
      let rVol = 0;
      if (activeWo?.jasaItems && item.section === 'JASA') {
        const foundJasa = activeWo.jasaItems.find(
          (j) => (j.id && j.id === item.id) || (j.kode && j.kode === item.kode) || (j.deskripsi && j.deskripsi.trim().toLowerCase() === (item.desc || '').trim().toLowerCase())
        );
        if (foundJasa && foundJasa.qtyRealisasi !== undefined) {
          rVol = foundJasa.qtyRealisasi;
        }
      }

      // 2. Override manual lokal di modal jika ada
      if (realisasiOverrides[item.id] !== undefined) {
        rVol = realisasiOverrides[item.id];
      }

      if (rVol > 0) {
        return {
          ...item,
          realisasiVol: rVol,
          realisasiTotal: Math.round(rVol * item.hargaSatuan),
        };
      }
      return item;
    });
  }, [survey, activePaket, realisasiOverrides, customKhsPrices, woData, matchedWo, docMeta, isVolumeEditActive, isSurveyTiang, noSurveyDoc, isWoMode]);

  // Volume yang sedang diketik Asman (belum disimpan) langsung dihitung ke total dokumen.
  const rabItems = useMemo(() => {
    if (!isVolumeEditActive) return rabItemsSaved;
    return rabItemsSaved.map((item) => {
      const draft = item.woRef ? volumeDrafts[refKey(item.woRef)] : undefined;
      if (draft === undefined) return item;
      const vol = parseVolume(draft);
      if (!Number.isFinite(vol) || vol <= 0) return item;
      return { ...item, rencanaVol: vol, rencanaTotal: Math.round(vol * item.hargaSatuan) };
    });
  }, [rabItemsSaved, isVolumeEditActive, volumeDrafts]);

  // HANYA tampilkan item material & jasa yang benar-benar diinput di survey (rencanaVol > 0)
  // Sub-header yang kosong tidak ditampilkan sama sekali
  const displayRows = useMemo(() => {
    // ──────────────────────────────────────────────────────────────────────
    // JALUR UTAMA: rabItems dari calculateRabFromSurvey sudah punya hierarki
    // header yang benar (I, A, B, I, II, a, b, …).
    //
    // Aturan penomoran sesuai referensi PLN:
    //   depth 0 = KELOMPOK (I/II)         → reset counter, items SEBELUM sub-header dinomori
    //   depth 1 = Sub-group (A/B/C/D)     → reset counter, items di bawahnya dinomori 1,2,3...
    //   depth ≥ 2 = Gardu/sub-pekerjaan   → items di bawahnya TIDAK dinomori (kosong)
    // ──────────────────────────────────────────────────────────────────────
    const hasSurveyHierarchy = rabItems.some((r) => r.isHeader);

    if (hasSurveyHierarchy) {
      // 1. Saring item non-header yang volume rencananya 0 dan tidak punya realisasi (misal baris dihapus dari WO)
      const validItems = rabItems.filter(
        (it) => it.isHeader || it.rencanaVol > 0 || it.realisasiVol > 0
      );

      // 2. Bersihkan header yatim (header yang tidak memiliki item aktif di bawahnya)
      const activeHeaderIndices = new Set<number>();
      validItems.forEach((item, idx) => {
        if (item.isHeader) {
          const myDepth = getHeaderDepth(item);
          let hasActiveChild = false;
          for (let j = idx + 1; j < validItems.length; j++) {
            const next = validItems[j];
            if (next.isHeader) {
              const nextDepth = getHeaderDepth(next);
              if (nextDepth <= myDepth) break;
            } else {
              if (next.rencanaVol > 0 || next.realisasiVol > 0) {
                hasActiveChild = true;
                break;
              }
            }
          }
          if (hasActiveChild) {
            activeHeaderIndices.add(idx);
          }
        }
      });

      const prunedItems = validItems.filter((it, idx) => {
        if (it.isHeader) return activeHeaderIndices.has(idx);
        return it.rencanaVol > 0 || it.realisasiVol > 0;
      });

      let itemCounter = 0;
      let lastHdrDepth = -1; // kedalaman header terakhir yang ditemukan

      return prunedItems.map((item) => {
        if (item.isHeader) {
          const no  = (item.no || '').trim();
          const desc = (item.desc || '').toUpperCase();

          if (desc.includes('KELOMPOK')) {
            // Level 0: KELOMPOK MATERIAL / KELOMPOK JASA
            itemCounter = 0;
            lastHdrDepth = 0;
          } else if (['A', 'B', 'C', 'D', 'E', 'F'].includes(no)) {
            // Level 1: Sub-group utama (A, B, C, D) → counter reset
            itemCounter = 0;
            lastHdrDepth = 1;
          } else {
            // Level ≥ 2: gardu type (I, II, III), sub-pekerjaan (a, b, c, ...)
            lastHdrDepth = 2;
          }
          return item;
        }

        // Item data (bukan header)
        if (lastHdrDepth <= 1) {
          // Langsung di bawah KELOMPOK atau Sub-group A/B/C/D → nomori 1, 2, 3...
          itemCounter++;
          return { ...item, no: String(itemCounter) };
        } else {
          // Di bawah sub-pekerjaan gardu (a/b/c...) → NO dikosongkan
          return { ...item, no: '' };
        }
      });
    }

    // ──────────────────────────────────────────────────────────────────────
    // FALLBACK: rabItems dari WO.materials (tidak punya header).
    // Bangun struktur sederhana I → A → 1,2,3 dan II → A → 1,2,3
    // ──────────────────────────────────────────────────────────────────────
    const makeHdr = (
      id: string, no: string, desc: string, section: 'MATERIAL' | 'JASA', headerLevel: string
    ): RabRowItem => ({
      id, rowNumber: no, no, kode: '', desc, sat: '', isHeader: true,
      headerLevel, section, hargaSatuan: 0, rencanaVol: 0, rencanaTotal: 0,
      realisasiVol: 0, realisasiTotal: 0, keterangan: '',
    });

    const activeItems = rabItems.filter(
      (r) => !r.isHeader && (r.rencanaVol > 0 || r.realisasiVol > 0)
    );
    const materialItems = activeItems.filter((r) => r.section === 'MATERIAL');
    const jasaItems    = activeItems.filter((r) => r.section === 'JASA');
    const hasJasa      = jasaItems.length > 0;
    const result: DocRow[] = [];

    if (materialItems.length > 0) {
      if (hasJasa) result.push(makeHdr('hdr-mat', 'I', 'KELOMPOK MATERIAL', 'MATERIAL', 'I'));
      const matSubTitle = docMeta.matSub;
      result.push(makeHdr('hdr-mat-a', 'A', matSubTitle, 'MATERIAL', 'A'));
      materialItems.forEach((it, idx) => result.push({ ...it, no: String(idx + 1) }));
    }

    if (jasaItems.length > 0) {
      result.push(makeHdr('hdr-jas', 'II', 'KELOMPOK JASA', 'JASA', 'II'));
      const jasSubTitle = docMeta.jasSub;
      result.push(makeHdr('hdr-jas-a', 'A', jasSubTitle, 'JASA', 'A'));
      jasaItems.forEach((it, idx) => result.push({ ...it, no: String(idx + 1) }));
    }

    return result;
  }, [rabItems, docMeta]);

  // Totals (persis seperti baris ringkasan di tabel dokumen)
  const totals = useMemo(() => computeDocTotals(rabItems), [rabItems]);

  // Volume akhir per item WO (draft yang diketik, atau volume WO bila tidak diubah).
  const volumeEdit = useMemo(() => {
    if (!isVolumeEditActive || !woData) return null;
    const materials = woData.materials || [];
    const jasaItems = woData.jasaItems || [];
    const resolve = (ref: WoItemRef, current: number) => {
      const draft = volumeDrafts[refKey(ref)];
      return draft === undefined ? current : parseVolume(draft);
    };
    const matVols = materials.map((m, index) => resolve({ group: 'materials', index }, m.qtyAllocated || m.qtyReksis || 0));
    const jasaVols = jasaItems.map((j, index) => resolve({ group: 'jasaItems', index }, j.qtyTarget || 0));
    const invalidCount = Object.values(volumeDrafts).filter((d) => {
      const v = parseVolume(d);
      return !(Number.isFinite(v) && v > 0);
    }).length;
    const changedCount =
      materials.filter((m, i) => matVols[i] !== (m.qtyAllocated || m.qtyReksis || 0)).length +
      jasaItems.filter((j, i) => jasaVols[i] !== (j.qtyTarget || 0)).length;

    return { matVols, jasaVols, invalidCount, changedCount };
  }, [isVolumeEditActive, woData, volumeDrafts]);

  const handleSaveVolumes = () => {
    if (!woData || !volumeEdit) return;
    if (volumeEdit.invalidCount > 0) {
      alert('Volume yang diedit wajib diisi dengan angka lebih dari 0.');
      return;
    }

    const isInStore = workOrders.some((w) => w.id === woData.id);

    if (isInStore) {
      updateWoVolumes(
        woData.id,
        { materials: volumeEdit.matVols, jasaItems: volumeEdit.jasaVols },
        woData.approverName
      );
      stopVolumeEdit();
    } else {
      // Draft / Preview WO: update data preview in-place
      const targetMats = woData.materials;
      if (targetMats) {
        volumeEdit.matVols.forEach((v, i) => {
          if (targetMats[i]) {
            targetMats[i].qtyAllocated = v;
            targetMats[i].qtyReksis = v;
          }
        });
      }
      const targetJasa = woData.jasaItems;
      if (targetJasa) {
        volumeEdit.jasaVols.forEach((v, i) => {
          if (targetJasa[i]) {
            targetJasa[i].qtyTarget = v;
          }
        });
      }
      woData.volumeEditedAt = new Date().toLocaleString('id-ID');
      if (onSavePreviewVolumes) {
        onSavePreviewVolumes(woData.id, {
          materials: volumeEdit.matVols,
          jasaItems: volumeEdit.jasaVols,
        });
      }
      stopVolumeEdit();
    }
  };

  const handlePrint = () => {
    const logoUrl = `${window.location.origin}/Logo_PLN.png`;
    const fmtRpLeft = (val: number) => {
      if (!val || val === 0) return '';
      return `<span style="display:inline-flex;justify-content:space-between;width:100%;"><span>Rp</span><span>${val.toLocaleString('id-ID')}</span></span>`;
    };

    // Build item rows
    const itemRows = displayRows.map((item) => {
      if (item.isHeader) {
        const isMainGroup = item.no === 'I' || item.no === 'II';
        return `<tr style="background:#fff;">
          <td style="border:1px solid #000;padding:2.5px 2px;text-align:center;font-weight:bold;vertical-align:middle;width:28px;">${item.no}</td>
          <td colspan="8" style="border:1px solid #000;padding:2.5px 5px;font-weight:bold;text-transform:uppercase;vertical-align:middle;${isMainGroup ? 'font-size:7pt;' : ''}">${item.desc}</td>
          <td style="border:1px solid #000;vertical-align:middle;"></td>
        </tr>`;
      }
      return `<tr>
        <td style="border:1px solid #000;padding:2px 2px;text-align:center;vertical-align:middle;">${item.no || ''}</td>
        <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-family:monospace;font-weight:600;font-size:6.3pt;white-space:nowrap;vertical-align:middle;">${item.kode || ''}</td>
        <td style="border:1px solid #000;padding:2px 5px;vertical-align:middle;text-transform:uppercase;">${item.desc}</td>
        <td style="border:1px solid #000;padding:2px 2px;text-align:center;vertical-align:middle;">${item.sat || ''}</td>
        <td style="border:1px solid #000;padding:2px 4px;text-align:right;white-space:nowrap;vertical-align:middle;">${item.hargaSatuan > 0 ? fmtRpLeft(item.hargaSatuan) : ''}</td>
        <td style="border:1px solid #000;padding:2px 2px;text-align:center;vertical-align:middle;">${item.rencanaVol > 0 ? item.rencanaVol : ''}</td>
        <td style="border:1px solid #000;padding:2px 4px;text-align:right;white-space:nowrap;vertical-align:middle;">${item.rencanaTotal > 0 ? fmtRpLeft(item.rencanaTotal) : ''}</td>
        <td style="border:1px solid #000;padding:2px 2px;text-align:center;vertical-align:middle;">${item.realisasiVol > 0 ? item.realisasiVol : ''}</td>
        <td style="border:1px solid #000;padding:2px 4px;text-align:right;white-space:nowrap;vertical-align:middle;">${item.realisasiTotal > 0 ? fmtRpLeft(item.realisasiTotal) : ''}</td>
        <td style="border:1px solid #000;padding:2px 4px;text-align:center;white-space:nowrap;font-size:6.2pt;vertical-align:middle;">${item.keterangan || (item.section === 'MATERIAL' ? 'LOG UP3 BTS' : '')}</td>
      </tr>`;
    }).join('');

    // Summary footer rows
    const hasJasa = totals.jasRencana > 0 || totals.jasRealisasi > 0;
    const summaryRows = hasJasa ? `
      <tr>
        <td colspan="5" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:bold;text-transform:uppercase;vertical-align:middle;">SUBTOTAL MATERIAL</td>
        <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:bold;white-space:nowrap;vertical-align:middle;">${totals.matRencana > 0 ? fmtRpLeft(totals.matRencana) : '-'}</td>
        <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:bold;white-space:nowrap;vertical-align:middle;">${totals.matRealisasi > 0 ? fmtRpLeft(totals.matRealisasi) : ''}</td>
        <td style="border:1px solid #000;vertical-align:middle;"></td>
      </tr>
      <tr>
        <td colspan="5" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:bold;text-transform:uppercase;vertical-align:middle;">SUBTOTAL JASA</td>
        <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:bold;white-space:nowrap;vertical-align:middle;">${fmtRpLeft(totals.jasRencana)}</td>
        <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:bold;white-space:nowrap;vertical-align:middle;">${totals.jasRealisasi > 0 ? fmtRpLeft(totals.jasRealisasi) : ''}</td>
        <td style="border:1px solid #000;vertical-align:middle;"></td>
      </tr>
      <tr>
        <td colspan="5" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:900;text-transform:uppercase;vertical-align:middle;">JUMLAH</td>
        <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:900;white-space:nowrap;vertical-align:middle;">${fmtRpLeft(totals.totRencana)}</td>
        <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:900;white-space:nowrap;vertical-align:middle;">${totals.totRealisasi > 0 ? fmtRpLeft(totals.totRealisasi) : ''}</td>
        <td style="border:1px solid #000;vertical-align:middle;"></td>
      </tr>` : `
      <tr>
        <td colspan="5" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:900;text-transform:uppercase;vertical-align:middle;">JUMLAH MATERIAL</td>
        <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:900;white-space:nowrap;vertical-align:middle;">${totals.matRencana > 0 ? fmtRpLeft(totals.matRencana) : '-'}</td>
        <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:900;white-space:nowrap;vertical-align:middle;">${totals.matRealisasi > 0 ? fmtRpLeft(totals.matRealisasi) : ''}</td>
        <td style="border:1px solid #000;vertical-align:middle;"></td>
      </tr>`;

    const penyulangVal = survey?.penyulang || 'GI Menes ; P. Cigeulis ; Gardu : PNBG033';
    const ulpVal = survey?.ulp || 'ULP Labuan';
    const coordVal = (survey?.poles && survey.poles[0]?.lat)
      ? `${survey.poles[0].lat.toFixed(6)},${survey.poles[0].lng?.toFixed(6)}`
      : '-';
    const dayaTarifHtml = dayaTarifRows
      .map(([label, val]) => `<tr><td style="border:none;padding:0.5px 0;width:48px;white-space:nowrap;">${label}</td><td style="border:none;padding:0.5px 4px;width:8px;">:</td><td style="border:none;padding:0.5px 0;">${val}</td></tr>`)
      .join('');

    const signatureBlock = isWoMode ? `
      <div style="margin-top:4mm;border:1px solid #000;padding:3mm 4mm;">
        <p style="margin:0 0 2mm 0;font-size:6.5pt;"><u><b>Catatan</b></u> *) Mulai kegiatan disesuaikan dengan kondisi kesiapan sarana pendukung (Tiang Beton, Gardu Distribusi dll)</p>
        <table style="width:100%;border-collapse:collapse;border:none;">
          <tr>
            <td style="width:50%;text-align:center;border:none;padding:2mm;">
              <div style="font-weight:bold;font-size:7pt;text-transform:uppercase;margin-bottom:12mm;">Menyetujui,</div>
              ${approverSig ? `<img src="${approverSig}" style="height:18mm;max-width:50mm;object-fit:contain;display:block;margin:0 auto 2mm;" alt="ttd" />` : '<div style="height:18mm;"></div>'}
              <div style="font-weight:900;font-size:7pt;text-transform:uppercase;text-decoration:underline;">${approverName}</div>
              <div style="font-weight:bold;font-size:6.5pt;text-transform:uppercase;">${approverRole}</div>
            </td>
            <td style="width:50%;text-align:center;border:none;padding:2mm;">
              <div style="font-weight:bold;font-size:7pt;text-transform:uppercase;margin-bottom:12mm;">Dibuat Oleh,</div>
              ${creatorSig ? `<img src="${creatorSig}" style="height:18mm;max-width:50mm;object-fit:contain;display:block;margin:0 auto 2mm;" alt="ttd" />` : '<div style="height:18mm;"></div>'}
              <div style="font-weight:900;font-size:7pt;text-transform:uppercase;text-decoration:underline;">${creatorName}</div>
              <div style="font-weight:bold;font-size:6.5pt;text-transform:uppercase;">${creatorRole}</div>
            </td>
          </tr>
        </table>
      </div>` : '';

    const docTitle = isWoMode
      ? `WORK ORDER JASA PEMASARAN ${docMeta.titlePaket} UP3 BANTEN SELATAN`
      : `RENCANA ANGGARAN BIAYA (RAB) ${docMeta.rabTitlePaket} UP3 BANTEN SELATAN`;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <title>${isWoMode ? 'WORK_ORDER' : 'RAB'}_${woData?.id || survey?.id || 'PLN'}</title>
  <style>
    @page { size: A4 portrait; margin: 6mm 7mm; }
    *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body {
      margin: 0; padding: 0;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 7pt;
      line-height: 1.2;
      color: #000;
      background: #fff;
    }
    table { border-collapse: collapse; width: 100%; }
    @media print {
      body { margin: 0; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

<!-- KOP SURAT -->
<table style="border:1.5px solid #000;width:100%;margin-bottom:1mm;">
  <tr>
    <td style="border-bottom:1px solid #000;padding:2.5mm 3mm;vertical-align:middle;">
      <table style="border:none;width:100%;">
        <tr>
          <td style="border:none;padding:0;vertical-align:middle;width:36px;">
            <img src="${logoUrl}" alt="PLN" style="height:26px;width:auto;display:block;" />
          </td>
          <td style="border:none;padding:0 0 0 6px;vertical-align:middle;">
            <div style="font-weight:bold;font-size:7pt;">PT. PLN ( Persero )</div>
            <div style="font-weight:bold;font-size:8pt;">UID BANTEN</div>
            <div style="font-weight:bold;font-size:7pt;">UP3 BANTEN SELATAN</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="border-bottom:1px solid #000;padding:3mm 4mm;text-align:center;">
      <div style="font-weight:bold;font-size:9pt;text-transform:uppercase;">${docTitle}</div>
      ${isWoMode ? `
      <div style="font-size:7.5pt;font-weight:600;margin-top:2px;">KEPADA PENYEDIA B/J :</div>
      <div style="font-weight:900;font-size:8.5pt;text-transform:uppercase;text-decoration:underline;margin-top:1px;">${vendorName !== '—' ? vendorName : '-'}</div>
      ` : ''}
    </td>
  </tr>
  <!-- METADATA -->
  <tr>
    <td style="padding:2.5mm 3mm;">
      <table style="border:none;width:100%;">
        <tr>
          <td style="border:none;padding:0;vertical-align:top;width:68%;">
            <table style="border:none;width:100%;font-size:6.8pt;line-height:1.4;">
              <tr><td style="border:none;padding:0.5px 0;width:80px;white-space:nowrap;">Nama Pekerjaan</td><td style="border:none;padding:0.5px 4px;width:8px;">:</td><td style="border:none;padding:0.5px 0;font-weight:bold;">${workTitle}</td></tr>
              ${isWoMode ? `
              <tr><td style="border:none;padding:0.5px 0;">Nomor SPK</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${noSpk !== '—' ? noSpk : '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">No Work Order</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${noWo !== '—' ? noWo : '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Tanggal Awal *)</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${tglAwal !== '—' ? tglAwal : '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Tanggal Akhir *)</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${tglAkhir !== '—' ? tglAkhir : '-'}</td></tr>
              ` : ''}
              ${isWoMode ? `<tr><td style="border:none;padding:0.5px 0;vertical-align:top;">Pengawas</td><td style="border:none;padding:0.5px 4px;vertical-align:top;">:</td><td style="border:none;padding:0.5px 0;">${pengawas1 !== '—' ? pengawas1 : '-'}${pengawas2 && pengawas2 !== '—' ? '<br/>' + pengawas2 : ''}</td></tr>` : ''}
              <tr><td style="border:none;padding:0.5px 0;">Alamat</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${survey?.location || '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Titik Koordinat</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${coordVal}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">ULP</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${ulpVal}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Penyulang</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${penyulangVal}</td></tr>
            </table>
          </td>
          <td style="border:none;padding:0 0 0 6mm;vertical-align:top;width:32%;">
            <table style="border:none;width:100%;font-size:6.8pt;line-height:1.4;">
              ${dayaTarifHtml}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- TABEL MATERIAL & JASA -->
<table style="border:1.5px solid #000;border-collapse:collapse;width:100%;font-size:6.8pt;font-family:Arial,Helvetica,sans-serif;">
  <thead>
    <tr style="background:#fff;font-weight:bold;">
      <th rowspan="2" style="border:1px solid #000;padding:3px 2px;text-align:center;vertical-align:middle;width:26px;">NO</th>
      <th rowspan="2" style="border:1px solid #000;padding:3px 4px;text-align:center;vertical-align:middle;width:58px;white-space:nowrap;">NOMOR MATERIAL</th>
      <th rowspan="2" style="border:1px solid #000;padding:3px 5px;text-align:center;vertical-align:middle;">URAIAN MATERIAL &amp; JASA</th>
      <th rowspan="2" style="border:1px solid #000;padding:3px 2px;text-align:center;vertical-align:middle;width:34px;white-space:nowrap;">SAT</th>
      <th rowspan="2" style="border:1px solid #000;padding:3px 4px;text-align:center;vertical-align:middle;width:82px;white-space:nowrap;">HARGA SATUAN</th>
      <th colspan="2" style="border:1px solid #000;padding:2px 3px;text-align:center;vertical-align:middle;">RENCANA</th>
      <th colspan="2" style="border:1px solid #000;padding:2px 3px;text-align:center;vertical-align:middle;">REALISASI</th>
      <th rowspan="2" style="border:1px solid #000;padding:3px 4px;text-align:center;vertical-align:middle;width:85px;white-space:nowrap;">KETERANGAN</th>
    </tr>
    <tr style="background:#fff;font-weight:bold;">
      <th style="border:1px solid #000;padding:2px 2px;text-align:center;vertical-align:middle;width:34px;white-space:nowrap;">VOL</th>
      <th style="border:1px solid #000;padding:2px 4px;text-align:center;vertical-align:middle;width:82px;white-space:nowrap;">TOTAL HARGA</th>
      <th style="border:1px solid #000;padding:2px 2px;text-align:center;vertical-align:middle;width:34px;white-space:nowrap;">VOL</th>
      <th style="border:1px solid #000;padding:2px 4px;text-align:center;vertical-align:middle;width:82px;white-space:nowrap;">TOTAL HARGA</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
  <tfoot style="font-size:6.8pt;">
    ${summaryRows}
    <tr>
      <td colspan="5" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:bold;vertical-align:middle;">PPN (11%)</td>
      <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:bold;white-space:nowrap;vertical-align:middle;">${fmtRpLeft(totals.ppnRencana)}</td>
      <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:bold;white-space:nowrap;vertical-align:middle;">${totals.ppnRealisasi > 0 ? fmtRpLeft(totals.ppnRealisasi) : ''}</td>
      <td style="border:1px solid #000;vertical-align:middle;"></td>
    </tr>
    <tr>
      <td colspan="5" style="border:1.5px solid #000;padding:3px 5px;text-align:right;font-weight:900;text-transform:uppercase;vertical-align:middle;">TOTAL NILAI WO / RAB (${docMeta.totalLabel})</td>
      <td colspan="2" style="border:1.5px solid #000;padding:3px 5px;text-align:right;font-weight:900;white-space:nowrap;vertical-align:middle;">${fmtRpLeft(totals.grandRencana)}</td>
      <td colspan="2" style="border:1.5px solid #000;padding:3px 5px;text-align:right;font-weight:900;white-space:nowrap;vertical-align:middle;">${totals.grandRealisasi > 0 ? fmtRpLeft(totals.grandRealisasi) : ''}</td>
      <td style="border:1.5px solid #000;vertical-align:middle;"></td>
    </tr>
    <tr>
      <td colspan="5" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:900;text-transform:uppercase;vertical-align:middle;">DIBULATKAN</td>
      <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:900;white-space:nowrap;vertical-align:middle;">${fmtRpLeft(totals.dibulatkanRencana)}</td>
      <td colspan="2" style="border:1px solid #000;padding:2.5px 5px;text-align:right;font-weight:900;white-space:nowrap;vertical-align:middle;">${totals.dibulatkanRealisasi > 0 ? fmtRpLeft(totals.dibulatkanRealisasi) : ''}</td>
      <td style="border:1px solid #000;vertical-align:middle;"></td>
    </tr>
  </tfoot>
</table>

${signatureBlock}

</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) {
      alert('Pop-up diblokir browser. Izinkan pop-up untuk tab ini lalu coba lagi.');
      return;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      setTimeout(() => printWin.close(), 1000);
    }, 600);
  };

  if (!isOpen || !survey) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto rab-modal-backdrop print:bg-transparent print:p-0 print:m-0 print:static print:overflow-visible print:block print:inset-auto">
      {/* CSS Khusus Print A4 Portrait Resmi PLN (Isolasi Murni Dokumen WO - Maksimal 1-2 Halaman) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 4mm 5mm !important;
          }
          /* Sembunyikan elemen luar: sidebar, navbar, header, footer */
          aside, nav, header, footer, .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 6.8pt !important;
            line-height: 1.1 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-rab-document,
          #printable-rab-document * {
            visibility: visible !important;
          }
          #printable-rab-document {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin-bottom: 1mm !important;
          }
          .print-header-box {
            padding: 1mm 1.5mm !important;
            margin: 0 !important;
            font-size: 7pt !important;
          }
          .print-meta-grid {
            font-size: 6.5pt !important;
            line-height: 1.15 !important;
          }
          .print-compact-table {
            font-size: 6.3pt !important;
            width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
          }
          .print-compact-table th, .print-compact-table td {
            padding-top: 0.8px !important;
            padding-bottom: 0.8px !important;
            padding-left: 1.5px !important;
            padding-right: 1.5px !important;
            line-height: 1.05 !important;
          }
          .print-compact-table th {
            font-size: 6.4pt !important;
            padding: 1.2px 1.5px !important;
          }
          .print-sig-box {
            min-height: 0 !important;
            padding-top: 1mm !important;
            padding-bottom: 1mm !important;
            margin-top: 1mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-sig-space {
            height: 9mm !important;
            min-height: 9mm !important;
            max-height: 10mm !important;
            margin: 0 !important;
          }
          table, tr, td, th {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}} />

      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-300 font-sans text-slate-800 animate-in fade-in zoom-in-95 duration-150 rab-modal-card print:border-none print:shadow-none print:rounded-none print:max-h-none print:w-full print:max-w-none print:p-0 print:m-0 print:block">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3.5 px-5 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {isWoMode ? 'Dokumen Resmi Work Order Pelaksanaan (KHS 2026)' : 'Dokumen Resmi Output RAB Hasil Survey'}
              </span>
            </div>

            {/* Paket Indicator: Jika mode Dokumen WO, kunci dan tampilkan paket yang dibuka saja (tanpa toggle switch) */}
            {isWoMode ? (
              tabWos.length > 1 ? (
                /* Beberapa WO milik pelanggan dibuka lewat tab: WO P1 | WO P2 | WO Tiang */
                <div className="flex items-center bg-slate-800 p-0.5 rounded-xl text-xs font-bold border border-slate-700 gap-0.5">
                  {tabWos.map((w) => {
                    const isActive = w.id === woData?.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          if (w.id !== woData?.id) stopVolumeEdit();
                          setActiveWoId(w.id);
                        }}
                        title={`${w.category || 'WO'} — ${w.id}`}
                        className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                          isActive ? 'bg-amber-500 text-slate-900 shadow-xs font-black' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {woTabLabel(w.category)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span
                  className={`px-3.5 py-1.5 rounded-xl text-white font-black text-xs border shadow-xs tracking-wide ${
                    docMeta.isTiang
                      ? 'bg-sky-700 border-sky-400/50'
                      : activePaket === 'paket1'
                      ? 'bg-purple-600 border-purple-400/50'
                      : 'bg-blue-600 border-blue-400/50'
                  }`}
                >
                  {docMeta.isTiang ? 'WO Tiang (TB)' : activePaket === 'paket1' ? 'WO Paket 1 (JTM)' : 'WO Paket 2 (JTR)'}
                </span>
              )
            ) : noSurveyDoc ? (
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-300">
                Belum ada paket dari isian survey
              </span>
            ) : (
              /* Mode RAB Survey: hanya paket yang terbentuk dari isian survey */
              <div className="flex items-center bg-slate-800 p-0.5 rounded-xl text-xs font-bold border border-slate-700">
                {surveyDocs.map((doc) => {
                  const meta = SURVEY_DOC_TABS[doc];
                  return (
                    <button
                      key={doc}
                      type="button"
                      onClick={() => setActiveDoc(doc)}
                      className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                        currentDoc === doc ? `${meta.activeClass} text-white shadow-xs font-black` : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEditVolume && (
              isVolumeEditActive ? (
                <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700 shadow-inner">
                  <button
                    type="button"
                    onClick={stopVolumeEdit}
                    className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    title="Batalkan perubahan volume"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Batal</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveVolumes}
                    disabled={!volumeEdit || volumeEdit.invalidCount > 0}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                    title="Simpan volume rencana hasil revisi ke Work Order"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Simpan Volume</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingVolume(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 border border-indigo-400/40 shadow-sm transition-all cursor-pointer hover:shadow-indigo-500/20"
                  title="Edit volume rencana material & jasa langsung di dokumen"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Volume</span>
                </button>
              )
            )}

            {isWoMode && (
              <button
                type="button"
                onClick={() => setSigPadConfig({
                  isOpen: true,
                  type: isAsmanPage ? 'approver' : 'creator',
                  title: isAsmanPage
                    ? 'Tanda Tangan Digital Asman Konstruksi (Menyetujui)'
                    : 'Tanda Tangan Digital Pembuat Work Order (Dibuat Oleh)',
                  initialName: isAsmanPage ? (approverName || 'WEGIG DIDIK KURNIAWAN') : (creatorName || 'HASIAN EFRAVODITUS SITORUS'),
                  initialRole: isAsmanPage ? (approverRole || 'ASMAN KONSTRUKSI') : (creatorRole || 'TC LOLA KONS'),
                  initialSig: isAsmanPage ? (approverSig || DEFAULT_WEGIG_PARAF) : (creatorSig || DEFAULT_HASIAN_PARAF),
                })}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 text-slate-100 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700/80 shadow-sm cursor-pointer"
                title={isAsmanPage ? 'Tanda tangan digital Asman Konstruksi' : 'Atur tanda tangan digital pembuat WO'}
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tanda Tangan {isAsmanPage ? 'Asman' : ''}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-blue-400/40 shadow-sm cursor-pointer hover:shadow-blue-500/20"
              title="Cetak atau unduh dokumen sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              title="Tutup Dokumen (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div id="printable-rab-document" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 rab-modal-body print:p-0 print:m-0 print:overflow-visible print:max-h-none print:w-full">
          
          {/* Header Box Terpadu Persis Screenshot Excel Asli */}
          <div className="border border-black bg-white text-black text-[10.5px] print:text-[6.5pt] print-full-width">
            
            {/* Row 1: Logo PLN & UP3 Kiri */}
            <div className="p-2 border-b border-black flex items-center justify-between print:p-1.5">
              <div className="flex items-center gap-2.5">
                <img
                  src="/Logo_PLN.png"
                  alt="Logo PT. PLN (Persero)"
                  className="h-8 w-auto object-contain shrink-0 print:h-6.5"
                />
                <div className="leading-tight">
                  <div className="font-bold text-[10px] print:text-[6.5pt]">PT. PLN ( Persero )</div>
                  <div className="font-bold text-[11px] print:text-[7pt]">UID BANTEN</div>
                  <div className="font-bold text-[10px] print:text-[6.5pt]">UP3 BANTEN SELATAN</div>
                </div>
              </div>
            </div>

            {/* Row 2: Full-Width Center Box untuk Judul Dokumen (Persis Screenshot User) */}
            <div className="w-full py-2 px-3 border-b border-black flex flex-col justify-center items-center text-center print:py-1">
              <h2 className="font-bold text-[11px] print:text-[7.5pt] uppercase tracking-wide">
                {isWoMode
                  ? `WORK ORDER JASA PEMASARAN ${docMeta.titlePaket} UP3 BANTEN SELATAN`
                  : `RENCANA ANGGARAN BIAYA (RAB) ${docMeta.rabTitlePaket} UP3 BANTEN SELATAN`}
              </h2>
              {/* Penyedia B/J baru ditetapkan saat WO di-apply, jadi tidak tampil di RAB */}
              {isWoMode && (
                <>
                  <div className="text-[10px] print:text-[6.5pt] font-semibold mt-0.5">
                    KEPADA PENYEDIA B/J :
                  </div>
                  <div className="text-[11px] print:text-[7.2pt] font-black uppercase underline">
                    {vendorName !== '—' ? vendorName : '-'}
                  </div>
                </>
              )}
            </div>

            {/* Metadata Grid Dua Kolom Persis Excel */}
            <div className="p-2 grid grid-cols-1 md:grid-cols-12 gap-x-3 gap-y-0.5 leading-snug print:p-1.5 print-meta-grid">
              
              {/* Kolom Kiri: 8 Kolom */}
              <div className="md:col-span-8 space-y-0.5">
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">Nama Pekerjaan</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-semibold flex-1 text-slate-900">{workTitle}</span>
                </div>
                {/* Nomor SPK / WO / Tanggal baru ada setelah WO di-apply, jadi
                    tidak ditampilkan pada dokumen RAB hasil survey. */}
                {isWoMode && (
                  <>
                    <div className="flex items-start">
                      <span className="w-24 shrink-0 font-normal">Nomor SPK</span>
                      <span className="w-3 text-center">:</span>
                      <span className="font-normal flex-1">
                        {noSpk !== '—' ? noSpk : '-'}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 shrink-0 font-normal">No Work Order</span>
                      <span className="w-3 text-center">:</span>
                      <span className="font-normal flex-1">
                        {noWo !== '—' ? noWo : '-'}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 shrink-0 font-normal">Tanggal Awal *)</span>
                      <span className="w-3 text-center">:</span>
                      <span className="font-normal flex-1">
                        {tglAwal !== '—' ? tglAwal : '-'}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 shrink-0 font-normal">Tanggal Akhir *)</span>
                      <span className="w-3 text-center">:</span>
                      <span className="font-normal flex-1">
                        {tglAkhir !== '—' ? tglAkhir : '-'}
                      </span>
                    </div>
                  </>
                )}
                {/* Pengawas pelaksanaan juga baru diisi pada saat apply WO */}
                {isWoMode && (
                  <div className="flex items-start">
                    <span className="w-24 shrink-0 font-normal">Pengawas</span>
                    <span className="w-3 text-center">:</span>
                    <span className="font-normal flex-1">
                      {pengawas1 !== '—' ? pengawas1 : '-'}
                      {pengawas2 !== '—' && (
                        <>
                          <br />
                          {pengawas2}
                        </>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">Alamat</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">{survey.location}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">Titik Koordinat</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">
                    {survey.poles && survey.poles[0]?.lat 
                      ? `${survey.poles[0].lat.toFixed(6)},${survey.poles[0].lng?.toFixed(6)}`
                      : '-6.5533165,105.7421052'}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">ULP</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">{survey.ulp || 'ULP Labuan'}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">Penyulang</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">
                    {survey.penyulang || 'GI Menes ; P. Cigeulis ; Gardu : PNBG033'}
                  </span>
                </div>
              </div>

              {/* Kolom Kanan: 4 Kolom (Daya & Tarif) */}
              <div className="md:col-span-4 space-y-0.5">
                {dayaTarifRows.map(([label, val]) => (
                  <div key={label} className="flex items-start">
                    <span className="w-16 shrink-0 font-normal whitespace-nowrap">{label}</span>
                    <span className="w-3 text-center">:</span>
                    <span className="font-normal flex-1">{val}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Master Table Persis Screenshot Excel */}
          <div className="border border-black overflow-x-auto bg-white print:border print:border-black print:overflow-visible print-full-width">
            <table className="w-full text-left border-collapse border border-black bg-white text-black font-sans print-compact-table">
              <thead>
                <tr className="bg-white text-black font-bold border-b border-black text-[10px] print:text-[6.4pt]">
                  <th rowSpan={2} className="py-1 px-1.5 w-7 text-center border border-black">
                    NO
                  </th>
                  <th rowSpan={2} className="py-1 px-2 w-24 text-center align-middle border border-black font-bold whitespace-nowrap font-mono text-[10px] print:text-[6.2pt]">
                    NOMOR MATERIAL
                  </th>
                  <th rowSpan={2} className="py-1 px-2 text-center border border-black">
                    URAIAN MATERIAL & JASA
                  </th>
                  <th rowSpan={2} className="py-1 px-1.5 w-10 text-center border border-black whitespace-nowrap">
                    SAT
                  </th>
                  <th rowSpan={2} className="py-1 px-2 w-20 text-center border border-black whitespace-nowrap">
                    HARGA SATUAN
                  </th>
                  <th colSpan={2} className="py-0.5 px-1.5 text-center border border-black font-bold">
                    RENCANA
                  </th>
                  <th colSpan={2} className="py-0.5 px-1.5 text-center border border-black font-bold">
                    REALISASI
                  </th>
                  <th rowSpan={2} className="py-1 px-2 w-28 text-center border border-black whitespace-nowrap">
                    KETERANGAN
                  </th>
                </tr>
                <tr className="bg-white text-black font-bold border-b border-black text-[9.5px] print:text-[6.2pt]">
                  <th className="py-0.5 px-1 w-9 text-center border border-black">VOL</th>
                  <th className="py-0.5 px-1.5 w-20 text-center border border-black whitespace-nowrap">TOTAL HARGA</th>
                  <th className="py-0.5 px-1 w-9 text-center border border-black">VOL</th>
                  <th className="py-0.5 px-1.5 w-20 text-center border border-black whitespace-nowrap">TOTAL HARGA</th>
                </tr>
              </thead>

              <tbody>
                {displayRows.map((item) => {
                  if (item.isHeader) {
                    return (
                      <tr
                        key={item.id}
                        className="bg-white text-black font-bold border-b border-black text-[9.5px] print:text-[6.2pt]"
                      >
                        <td className="py-1 px-1.5 text-center border border-black font-bold">{item.no}</td>
                        <td colSpan={8} className="py-1 px-2 border border-black font-bold uppercase tracking-tight">
                          {item.desc}
                        </td>
                        <td className="py-1 px-2 border border-black"></td>
                      </tr>
                    );
                  }

                  const draftKey = isVolumeEditActive && item.woRef ? refKey(item.woRef) : null;
                  const draftValue = draftKey ? volumeDrafts[draftKey] : undefined;
                  const draftNum = draftValue === undefined ? NaN : parseVolume(draftValue);
                  const isDraftInvalid = draftValue !== undefined && !(Number.isFinite(draftNum) && draftNum > 0);

                  return (
                    <tr
                      key={item.id}
                      className={`text-black border-b border-black hover:bg-slate-50 transition-colors text-[9.5px] print:text-[6.1pt] ${
                        draftValue !== undefined ? 'bg-indigo-50/60' : ''
                      }`}
                    >
                      <td className="py-0.5 px-1.5 text-center border border-black font-normal">{item.no || '-'}</td>
                      <td className="py-0.5 px-2 text-center border border-black font-mono font-semibold text-slate-700 text-[10px] print:text-[6pt] whitespace-nowrap align-middle">
                        {item.kode || '—'}
                      </td>
                      <td className="py-0.5 px-2 border border-black">
                        <span className="font-normal text-black">
                          {item.desc}
                        </span>
                      </td>
                      <td className="py-0.5 px-1.5 text-center border border-black font-normal">{item.sat || '-'}</td>
                      <td className="py-0.5 px-2 text-right border border-black whitespace-nowrap tabular-nums">
                        {item.hargaSatuan > 0 ? (
                          <div className="flex justify-between items-center w-full">
                            <span>Rp</span>
                            <span>{item.hargaSatuan.toLocaleString('id-ID')}</span>
                          </div>
                        ) : ''}
                      </td>
                      {/* Rencana Vol */}
                      <td className="py-0.5 px-1 text-center border border-black tabular-nums">
                        {draftKey ? (
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            inputMode="decimal"
                            value={draftValue ?? String(item.rencanaVol)}
                            onChange={(e) => {
                              const next = e.target.value;
                              setVolumeDrafts((prev) => ({ ...prev, [draftKey]: next }));
                            }}
                            title="Volume rencana (klik untuk ubah)"
                            className={`w-full min-w-12 px-0.5 py-0.5 text-center font-bold rounded border text-[9.5px] tabular-nums focus:outline-hidden focus:ring-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              isDraftInvalid
                                ? 'border-rose-400 bg-rose-50 text-rose-700 focus:ring-rose-500'
                                : draftValue !== undefined
                                ? 'border-indigo-400 bg-white text-indigo-700 focus:ring-indigo-500'
                                : 'border-indigo-200 bg-white text-black focus:ring-indigo-500'
                            }`}
                          />
                        ) : (
                          item.rencanaVol > 0 ? item.rencanaVol : ''
                        )}
                      </td>
                      {/* Rencana Total */}
                      <td className="py-0.5 px-1.5 text-right border border-black whitespace-nowrap tabular-nums">
                        {item.rencanaTotal > 0 ? (
                          <div className="flex justify-between items-center w-full">
                            <span>Rp</span>
                            <span>{item.rencanaTotal.toLocaleString('id-ID')}</span>
                          </div>
                        ) : ''}
                      </td>
                      {/* Realisasi Vol */}
                      <td className="py-0.5 px-1 text-center border border-black">
                        <input
                          type="number"
                          step="any"
                          value={item.realisasiVol === 0 ? '' : item.realisasiVol}
                          placeholder=""
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setRealisasiOverrides((prev) => ({
                              ...prev,
                              [item.id]: val,
                            }));
                          }}
                          className="w-full px-0.5 py-0 text-center font-bold text-black bg-transparent border-none text-[9.5px] print:text-[6.1pt] tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      {/* Realisasi Total */}
                      <td className="py-0.5 px-1.5 text-right border border-black whitespace-nowrap tabular-nums">
                        {item.realisasiTotal > 0 ? (
                          <div className="flex justify-between items-center w-full">
                            <span>Rp</span>
                            <span>{item.realisasiTotal.toLocaleString('id-ID')}</span>
                          </div>
                        ) : ''}
                      </td>
                      {/* Keterangan */}
                      <td className="py-0.5 px-2 text-center text-[9px] print:text-[5.9pt] border border-black whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{item.keterangan || (item.section === 'MATERIAL' ? 'LOG UP3 BTS' : '')}</span>
                          {isVolumeEditActive && item.woRef?.group === 'materials' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus material "${item.desc}" dari daftar rencana Work Order ini?`)) {
                                  if (item.woRef && woData) {
                                    removeWoMaterialItem(woData.id, item.woRef.index);
                                  }
                                }
                              }}
                              className="p-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer print:hidden"
                              title="Hapus baris material ini"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                            </button>
                          )}
                          {isVolumeEditActive && item.woRef?.group === 'jasaItems' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus pekerjaan jasa "${item.desc}" dari daftar rencana Work Order ini?`)) {
                                  if (item.woRef && woData) {
                                    removeWoJasaItem(woData.id, item.woRef.index);
                                  }
                                }
                              }}
                              className="p-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer print:hidden"
                              title="Hapus baris jasa ini"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Summary Bottom matching Excel */}
              <tfoot className="border-t border-black bg-white font-bold text-[9.5px] print:text-[6.2pt] text-black">
                {totals.jasRencana > 0 || totals.jasRealisasi > 0 ? (
                  <>
                    <tr>
                      <td colSpan={5} className="py-1 px-3 text-right uppercase border border-black font-bold">
                        SUBTOTAL MATERIAL
                      </td>
                      <td colSpan={2} className="py-1 px-2 text-right border border-black font-bold whitespace-nowrap tabular-nums">
                        <div className="flex justify-between items-center w-full">
                          <span>Rp</span>
                          <span>{totals.matRencana.toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                      <td colSpan={2} className="py-1 px-2 text-right border border-black font-bold whitespace-nowrap tabular-nums">
                        {totals.matRealisasi > 0 ? (
                          <div className="flex justify-between items-center w-full">
                            <span>Rp</span>
                            <span>{totals.matRealisasi.toLocaleString('id-ID')}</span>
                          </div>
                        ) : ''}
                      </td>
                      <td className="border border-black"></td>
                    </tr>

                    <tr>
                      <td colSpan={5} className="py-1 px-3 text-right uppercase border border-black font-bold">
                        SUBTOTAL JASA
                      </td>
                      <td colSpan={2} className="py-1 px-2 text-right border border-black font-bold whitespace-nowrap tabular-nums">
                        <div className="flex justify-between items-center w-full">
                          <span>Rp</span>
                          <span>{totals.jasRencana.toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                      <td colSpan={2} className="py-1 px-2 text-right border border-black font-bold whitespace-nowrap tabular-nums">
                        {totals.jasRealisasi > 0 ? (
                          <div className="flex justify-between items-center w-full">
                            <span>Rp</span>
                            <span>{totals.jasRealisasi.toLocaleString('id-ID')}</span>
                          </div>
                        ) : ''}
                      </td>
                      <td className="border border-black"></td>
                    </tr>

                    <tr className="font-black bg-white">
                      <td colSpan={5} className="py-1.5 px-3 text-right uppercase border border-black font-black">
                        JUMLAH
                      </td>
                      <td colSpan={2} className="py-1.5 px-2 text-right border border-black font-black whitespace-nowrap tabular-nums">
                        <div className="flex justify-between items-center w-full">
                          <span>Rp</span>
                          <span>{totals.totRencana.toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                      <td colSpan={2} className="py-1.5 px-2 text-right border border-black font-black whitespace-nowrap tabular-nums">
                        {totals.totRealisasi > 0 ? (
                          <div className="flex justify-between items-center w-full">
                            <span>Rp</span>
                            <span>{totals.totRealisasi.toLocaleString('id-ID')}</span>
                          </div>
                        ) : ''}
                      </td>
                      <td className="border border-black"></td>
                    </tr>
                  </>
                ) : (
                  <tr className="font-black bg-white">
                    <td colSpan={5} className="py-1.5 px-3 text-right uppercase border border-black font-black">
                      JUMLAH MATERIAL
                    </td>
                    <td colSpan={2} className="py-1.5 px-2 text-right border border-black font-black whitespace-nowrap tabular-nums">
                      <div className="flex justify-between items-center w-full">
                        <span>Rp</span>
                        <span>{totals.matRencana.toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td colSpan={2} className="py-1.5 px-2 text-right border border-black font-black whitespace-nowrap tabular-nums">
                      {totals.matRealisasi > 0 ? (
                        <div className="flex justify-between items-center w-full">
                          <span>Rp</span>
                          <span>{totals.matRealisasi.toLocaleString('id-ID')}</span>
                        </div>
                      ) : ''}
                    </td>
                    <td className="border border-black"></td>
                  </tr>
                )}

                <tr className="bg-white">
                  <td colSpan={5} className="py-1 px-3 text-right border border-black font-normal text-black">
                    PPN (11%)
                  </td>
                  <td colSpan={2} className="py-1 px-2 text-right border border-black font-bold text-black whitespace-nowrap tabular-nums">
                    <div className="flex justify-between items-center w-full">
                      <span>Rp</span>
                      <span>{totals.ppnRencana.toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td colSpan={2} className="py-1 px-2 text-right border border-black font-bold text-black whitespace-nowrap tabular-nums">
                    {totals.ppnRealisasi > 0 ? (
                      <div className="flex justify-between items-center w-full">
                        <span>Rp</span>
                        <span>{totals.ppnRealisasi.toLocaleString('id-ID')}</span>
                      </div>
                    ) : ''}
                  </td>
                  <td className="border border-black"></td>
                </tr>

                <tr className="bg-white font-black border-t-2 border-b-2 border-black">
                  <td colSpan={5} className="py-1 px-3 text-right uppercase border border-black font-black">
                    TOTAL NILAI WO / RAB ({docMeta.totalLabel})
                  </td>
                  <td colSpan={2} className="py-1 px-2 text-right border border-black font-black whitespace-nowrap tabular-nums">
                    <div className="flex justify-between items-center w-full">
                      <span>Rp</span>
                      <span>{totals.grandRencana.toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td colSpan={2} className="py-1 px-2 text-right border border-black font-black whitespace-nowrap tabular-nums">
                    {totals.grandRealisasi > 0 ? (
                      <div className="flex justify-between items-center w-full">
                        <span>Rp</span>
                        <span>{totals.grandRealisasi.toLocaleString('id-ID')}</span>
                      </div>
                    ) : ''}
                  </td>
                  <td className="border border-black"></td>
                </tr>

                <tr className="bg-white font-black">
                  <td colSpan={5} className="py-1 px-3 text-right uppercase border border-black font-black text-black">
                    DIBULATKAN
                  </td>
                  <td colSpan={2} className="py-1 px-2 text-right border border-black font-black whitespace-nowrap tabular-nums text-black">
                    <div className="flex justify-between items-center w-full">
                      <span>Rp</span>
                      <span>{totals.dibulatkanRencana.toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td colSpan={2} className="py-1 px-2 text-right border border-black font-black whitespace-nowrap tabular-nums text-black">
                    {totals.dibulatkanRealisasi > 0 ? (
                      <div className="flex justify-between items-center w-full">
                        <span>Rp</span>
                        <span>{totals.dibulatkanRealisasi.toLocaleString('id-ID')}</span>
                      </div>
                    ) : ''}
                  </td>
                  <td className="border border-black"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Kolom Tanda Tangan & Catatan KHUSUS DOKUMEN WORK ORDER (Belum ada di RAB Survey) */}
          {isWoMode && (
            <>
              {/* Catatan Kaki Persis Sesuai Screenshot Excel */}
              <div className="pt-2 text-[11px] text-black">
                <span className="underline font-bold">Catatan</span> *) Mulai kegiatan disesuaikan dengan kondisi kesiapan sarana pendukung (Tiang Beton, Gardu Distribusi dll)
              </div>

              {/* Kolom Tanda Tangan Menyetujui & Dibuat Oleh Persis Screenshot Excel */}
              <div className="grid grid-cols-2 gap-8 pt-4 pb-2 text-center text-xs text-black border border-black p-4 bg-white mt-3 print-sig-box print:border print:border-black print:p-2 print:mt-1 print:gap-4 print-full-width">
                {/* 1. Menyetujui */}
                <div className="flex flex-col items-center justify-between min-h-[175px] print:min-h-0">
                  <span className="font-bold text-[12px] uppercase tracking-wide print:text-[10px]">Menyetujui</span>

                  {/* Area Paraf / Tanda Tangan */}
                  <div
                    onClick={() => setSigPadConfig({
                      isOpen: true,
                      type: 'approver',
                      title: 'Ubah Pejabat & Tanda Tangan: Menyetujui',
                      initialName: approverName,
                      initialRole: approverRole,
                      initialSig: approverSig || undefined,
                    })}
                    className="my-2 h-24 w-56 flex items-center justify-center cursor-pointer hover:bg-neutral-50 rounded border border-dashed border-transparent hover:border-blue-400 transition group relative print-sig-space print:my-0.5"
                    title="Klik untuk ubah nama atau gores tanda tangan digital"
                  >
                    {approverSig ? (
                      <img src={approverSig} alt="Tanda Tangan Menyetujui" className="max-h-24 max-w-full object-contain print:max-h-12" />
                    ) : (
                      <div className="h-24 w-56 flex items-center justify-center print-sig-space" />
                    )}
                    <span className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold transition print:hidden flex items-center gap-1">
                      <Edit3 className="w-2.5 h-2.5" /> Ubah
                    </span>
                  </div>

                  <div>
                    <div className="font-black text-[12px] uppercase underline tracking-tight print:text-[10px]">
                      {approverName}
                    </div>
                    <div className="font-bold text-[11px] uppercase text-black mt-0.5 print:text-[9px]">
                      {approverRole}
                    </div>
                  </div>
                </div>

                {/* 2. Dibuat Oleh (Hasian Sitorus) */}
                <div className="flex flex-col items-center justify-between min-h-[175px] print:min-h-0">
                  <span className="font-bold text-[12px] uppercase tracking-wide print:text-[10px]">Dibuat Oleh</span>

                  {/* Area Paraf / Tanda Tangan */}
                  <div
                    onClick={() => setSigPadConfig({
                      isOpen: true,
                      type: 'creator',
                      title: 'Ubah Pejabat & Tanda Tangan: Dibuat Oleh',
                      initialName: creatorName,
                      initialRole: creatorRole,
                      initialSig: creatorSig || undefined,
                    })}
                    className="my-2 h-24 w-56 flex items-center justify-center cursor-pointer hover:bg-neutral-50 rounded border border-dashed border-transparent hover:border-blue-400 transition group relative print-sig-space print:my-0.5"
                    title="Klik untuk ubah nama atau gores tanda tangan digital"
                  >
                    {creatorSig ? (
                      <img src={creatorSig} alt="Tanda Tangan Dibuat Oleh" className="max-h-24 max-w-full object-contain print:max-h-12" />
                    ) : (
                      <div className="h-24 w-56 flex items-center justify-center print-sig-space" />
                    )}
                    <span className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold transition print:hidden flex items-center gap-1">
                      <Edit3 className="w-2.5 h-2.5" /> Ubah
                    </span>
                  </div>

                  <div>
                    <div className="font-black text-[12px] uppercase underline tracking-tight print:text-[10px]">
                      {creatorName}
                    </div>
                    <div className="font-bold text-[11px] uppercase text-black mt-0.5 print:text-[9px]">
                      {creatorRole}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>
            Acuan: <b>KHS 2026 PT PLN (Persero) UP3 Banten Selatan</b>
            {isWoMode ? ' • Klik kotak tanda tangan untuk ubah/tanda tangan digital.' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold transition-all cursor-pointer shadow-xs"
            >
              Tutup Dokumen
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tanda Tangan Digital */}
      <SignaturePadModal
        isOpen={sigPadConfig.isOpen}
        onClose={() => setSigPadConfig((prev) => ({ ...prev, isOpen: false }))}
        title={sigPadConfig.title}
        signerType={sigPadConfig.type}
        initialName={sigPadConfig.initialName}
        initialRole={sigPadConfig.initialRole}
        initialSignature={sigPadConfig.initialSig}
        onSave={(dataUrl, newName, newRole) => {
          if (sigPadConfig.type === 'approver') {
            const finalName = newName || 'WEGIG DIDIK KURNIAWAN';
            const finalRole = newRole || 'ASMAN KONSTRUKSI';
            setApproverName(finalName);
            setApproverRole(finalRole);
            setApproverSig(dataUrl);
            if (woData) {
              updateWoSignatures(woData.id, {
                approverName: finalName,
                approverRole: finalRole,
                approverSignature: dataUrl,
              });
            }
          } else {
            const finalName = newName || 'HASIAN EFRAVODITUS SITORUS';
            const finalRole = newRole || 'TC LOLA KONS';
            setCreatorName(finalName);
            setCreatorRole(finalRole);
            setCreatorSig(dataUrl);
            if (woData) {
              updateWoSignatures(woData.id, {
                creatorName: finalName,
                creatorRole: finalRole,
                creatorSignature: dataUrl,
              });
            }
          }
        }}
      />
    </div>
  );
};
