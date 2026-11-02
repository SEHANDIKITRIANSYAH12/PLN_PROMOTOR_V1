'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { SurveyRecord, WorkOrderRecord } from '@/types';
import { calculateRabFromSurvey, RabRowItem } from '@/data/rabMasterData';
import { usePromotorStore } from '@/store/usePromotorStore';
import { 
  X, 
  Printer, 
  Download, 
  Zap, 
  CheckCircle2, 
  Layers,
  FileSpreadsheet,
  PenTool,
  Edit3
} from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';

// Paraf Otentik Hasian Sitorus dari Screenshot Excel User
const DEFAULT_HASIAN_PARAF = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120"><path d="M 40,70 C 50,50 70,25 78,12 C 82,5 75,8 70,22 C 62,48 55,80 48,112 M 52,72 C 60,48 72,40 82,42 C 90,44 88,62 89,76 C 92,28 102,20 108,30 C 112,38 110,68 112,80 C 116,48 126,45 132,56 C 136,66 138,82 144,102 M 62,58 L 130,56" fill="none" stroke="%23003366" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Paraf Standar Asman Konstruksi
const DEFAULT_ASMAN_PARAF = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120"><path d="M 35,45 C 45,80 55,85 62,35 C 70,75 80,80 88,30 C 95,45 110,25 125,50 C 135,68 120,85 95,80 M 45,90 L 140,88" fill="none" stroke="%23003366" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

interface RabDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey?: SurveyRecord | null;
  woData?: WorkOrderRecord | null;
  initialPaket?: 'paket1' | 'paket2';
  mode?: 'rab' | 'wo'; // 'rab' = Survey Output (no signatures), 'wo' = Work Order Contract (with signatures)
}

export const RabDocumentModal: React.FC<RabDocumentModalProps> = ({
  isOpen,
  onClose,
  survey: propSurvey,
  woData,
  initialPaket = 'paket2',
  mode,
}) => {
  const { workOrders, surveys, customKhsPrices } = usePromotorStore();
  const isWoMode = mode ? mode === 'wo' : Boolean(woData);
  const [activePaket, setActivePaket] = useState<'paket1' | 'paket2'>(
    woData?.category === 'WO Paket 1' ? 'paket1' : initialPaket
  );
  const [realisasiOverrides, setRealisasiOverrides] = useState<Record<string, number>>({});

  // Resolve survey
  const survey = useMemo(() => {
    if (propSurvey) return propSurvey;
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

  // Reset paket when initialPaket or woData changes
  useEffect(() => {
    if (woData?.category === 'WO Paket 1') {
      setActivePaket('paket1');
    } else if (woData?.category === 'WO Paket 2') {
      setActivePaket('paket2');
    } else {
      setActivePaket(initialPaket);
    }
  }, [initialPaket, woData]);

  // Match WO
  const targetCategory = activePaket === 'paket1' ? 'WO Paket 1' : 'WO Paket 2';
  const matchedWo = useMemo(() => {
    if (woData && woData.category === targetCategory) return woData;
    const found = workOrders.find(
      (w) =>
        w.category === targetCategory &&
        (
          (woData && (w.daftungId === woData.daftungId || w.idpel === woData.idpel || w.customerName.toLowerCase() === woData.customerName.toLowerCase())) ||
          (survey && (w.idpel === survey.idpel || w.customerName.toLowerCase().includes(survey.customerName.toLowerCase()) || survey.customerName.toLowerCase().includes(w.customerName.toLowerCase())))
        )
    );
    if (found) return found;
    if (woData) return woData;
    return null;
  }, [woData, targetCategory, workOrders, survey]);

  const vendorName = matchedWo?.vendor || (activePaket === 'paket1' ? 'PT. HILMAN PRIMA PERKASA' : 'PT. TAWAKAL KARYA TEKNIK');
  const noSpk = matchedWo?.spkNumber || (activePaket === 'paket1' ? '0021.PJ/DAN.02.03/UP3-BTS/2026' : '0022.PJ/DAN.02.03/UP3-BTS/2026');
  const noWo = matchedWo?.noWorkOrder || matchedWo?.id || (activePaket === 'paket1' ? '537.10.WO.2026' : '538.10.WO.2026');
  const tglAwal = matchedWo?.validFrom || '02 Jan 2026';
  const tglAkhir = matchedWo?.validTo || '31 Des 2026';
  const pengawas1 = matchedWo?.supervisor1 || matchedWo?.supervisor || (activePaket === 'paket1' ? 'Hasian Sitorus (TC Lola Konstruksi)' : 'Winnetou Chandra Sadli (Officer Kinerja Konstruksi)');
  const pengawas2 = matchedWo?.supervisor2 !== undefined ? matchedWo.supervisor2 : (activePaket === 'paket1' ? 'Daud Febrizer (TL Teknik ULP Rangkasbitung)' : '');

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

  useEffect(() => {
    if (matchedWo) {
      if (matchedWo.approverName) setApproverName(matchedWo.approverName);
      if (matchedWo.approverRole) setApproverRole(matchedWo.approverRole);
      setApproverSig(matchedWo.approverSignature || null);
      if (matchedWo.creatorName) setCreatorName(matchedWo.creatorName);
      if (matchedWo.creatorRole) setCreatorRole(matchedWo.creatorRole);
      setCreatorSig(matchedWo.creatorSignature || null);
    }
  }, [matchedWo]);

  // Calculate items
  const rabItems = useMemo(() => {
    let baseItems: RabRowItem[] = [];

    // 1. Coba kalkulasi dari data survey jika tersedia tiang
    if (survey && survey.poles && survey.poles.length > 0) {
      baseItems = calculateRabFromSurvey(survey, activePaket, customKhsPrices);
    }

    // 2. Jika item aktif dari survey kosong, gunakan material langsung dari Work Order (Fallback cerdas)
    const activeSurveyItems = baseItems.filter((it) => !it.isHeader && (it.rencanaVol > 0 || it.realisasiVol > 0));
    const targetWo = woData || matchedWo;

    if (activeSurveyItems.length === 0 && targetWo?.materials && targetWo.materials.length > 0) {
      const subTitle = activePaket === 'paket1' ? 'MATERIAL SUTM & GARDU' : 'BOX APP, JTR DAN LENGKAPAN';
      baseItems = targetWo.materials.map((m, idx) => {
        const vol = m.qtyAllocated || m.qtyReksis || 1;
        let harga = 250000;
        const matLower = m.material.toLowerCase();
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
        };
      });
    }

    return baseItems.map((item) => {
      if (realisasiOverrides[item.id] !== undefined) {
        const rVol = realisasiOverrides[item.id];
        return {
          ...item,
          realisasiVol: rVol,
          realisasiTotal: Math.round(rVol * item.hargaSatuan),
        };
      }
      return item;
    });
  }, [survey, activePaket, realisasiOverrides, customKhsPrices, woData, matchedWo]);

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
      let itemCounter = 0;
      let lastHdrDepth = -1; // kedalaman header terakhir yang ditemukan

      return rabItems.map((item) => {
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
    const result: RabRowItem[] = [];

    if (materialItems.length > 0) {
      if (hasJasa) result.push(makeHdr('hdr-mat', 'I', 'KELOMPOK MATERIAL', 'MATERIAL', 'I'));
      const matSubTitle = activePaket === 'paket1' ? 'MATERIAL SUTM & GARDU' : 'BOX APP, JTR DAN LENGKAPAN';
      result.push(makeHdr('hdr-mat-a', 'A', matSubTitle, 'MATERIAL', 'A'));
      materialItems.forEach((it, idx) => result.push({ ...it, no: String(idx + 1) }));
    }

    if (jasaItems.length > 0) {
      result.push(makeHdr('hdr-jas', 'II', 'KELOMPOK JASA', 'JASA', 'II'));
      const jasSubTitle = activePaket === 'paket1'
        ? 'PEKERJAAN SUTM & GARDU DISTRIBUSI'
        : 'JASA PEMASANGAN/PENARIKAN SUTR DAN LENGKAPAN';
      result.push(makeHdr('hdr-jas-a', 'A', jasSubTitle, 'JASA', 'A'));
      jasaItems.forEach((it, idx) => result.push({ ...it, no: String(idx + 1) }));
    }

    return result;
  }, [rabItems, activePaket]);

  // Totals
  const totals = useMemo(() => {
    let matRencana = 0;
    let matRealisasi = 0;
    let jasRencana = 0;
    let jasRealisasi = 0;

    rabItems.forEach((it) => {
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
  }, [rabItems]);

  const formatRp = (val: number) => {
    if (!val || val === 0) return '-';
    return 'Rp\u00A0' + val.toLocaleString('id-ID');
  };

  const handlePrint = () => {
    const logoUrl = `${window.location.origin}/Logo_PLN.png`;
    const fmtRp = (val: number) => {
      if (!val || val === 0) return '';
      return `Rp&nbsp;${val.toLocaleString('id-ID')}`;
    };
    const fmtRpLeft = (val: number) => {
      if (!val || val === 0) return '';
      return `<span style="display:inline-flex;justify-content:space-between;width:100%;"><span>Rp</span><span>${val.toLocaleString('id-ID')}</span></span>`;
    };

    // Build item rows
    const itemRows = displayRows.map((item) => {
      if (item.isHeader) {
        const isMainGroup = item.no === 'I' || item.no === 'II';
        return `<tr style="background:#fff;">
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-weight:bold;">${item.no}</td>
          <td colspan="7" style="border:1px solid #000;padding:2px 4px;font-weight:bold;text-transform:uppercase;${isMainGroup ? 'font-size:6.8pt;' : ''}">${item.desc}</td>
          <td style="border:1px solid #000;"></td>
        </tr>`;
      }
      return `<tr>
        <td style="border:1px solid #000;padding:1.5px 2px;text-align:center;">${item.no || ''}</td>
        <td style="border:1px solid #000;padding:1.5px 3px;">${item.desc}</td>
        <td style="border:1px solid #000;padding:1.5px 2px;text-align:center;">${item.sat || ''}</td>
        <td style="border:1px solid #000;padding:1.5px 3px;text-align:right;white-space:nowrap;">${fmtRpLeft(item.hargaSatuan)}</td>
        <td style="border:1px solid #000;padding:1.5px 2px;text-align:center;">${item.rencanaVol > 0 ? item.rencanaVol : ''}</td>
        <td style="border:1px solid #000;padding:1.5px 3px;text-align:right;white-space:nowrap;">${fmtRpLeft(item.rencanaTotal)}</td>
        <td style="border:1px solid #000;padding:1.5px 2px;text-align:center;">${item.realisasiVol > 0 ? item.realisasiVol : ''}</td>
        <td style="border:1px solid #000;padding:1.5px 3px;text-align:right;white-space:nowrap;">${fmtRpLeft(item.realisasiTotal)}</td>
        <td style="border:1px solid #000;padding:1.5px 3px;text-align:center;white-space:nowrap;font-size:5.8pt;">${item.keterangan || (item.section === 'MATERIAL' ? 'LOG UP3 BTS' : '')}</td>
      </tr>`;
    }).join('');

    // Summary footer rows
    const hasJasa = totals.jasRencana > 0 || totals.jasRealisasi > 0;
    const summaryRows = hasJasa ? `
      <tr>
        <td colspan="4" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:bold;text-transform:uppercase;">SUBTOTAL MATERIAL</td>
        <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:bold;white-space:nowrap;">${fmtRpLeft(totals.matRencana)}</td>
        <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:bold;white-space:nowrap;">${totals.matRealisasi > 0 ? fmtRpLeft(totals.matRealisasi) : ''}</td>
        <td style="border:1px solid #000;"></td>
      </tr>
      <tr>
        <td colspan="4" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:bold;text-transform:uppercase;">SUBTOTAL JASA</td>
        <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:bold;white-space:nowrap;">${fmtRpLeft(totals.jasRencana)}</td>
        <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:bold;white-space:nowrap;">${totals.jasRealisasi > 0 ? fmtRpLeft(totals.jasRealisasi) : ''}</td>
        <td style="border:1px solid #000;"></td>
      </tr>
      <tr>
        <td colspan="4" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:900;text-transform:uppercase;">JUMLAH</td>
        <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:900;white-space:nowrap;">${fmtRpLeft(totals.totRencana)}</td>
        <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:900;white-space:nowrap;">${totals.totRealisasi > 0 ? fmtRpLeft(totals.totRealisasi) : ''}</td>
        <td style="border:1px solid #000;"></td>
      </tr>` : `
      <tr>
        <td colspan="4" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:900;text-transform:uppercase;">JUMLAH MATERIAL</td>
        <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:900;white-space:nowrap;">${fmtRpLeft(totals.matRencana)}</td>
        <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:900;white-space:nowrap;">${totals.matRealisasi > 0 ? fmtRpLeft(totals.matRealisasi) : ''}</td>
        <td style="border:1px solid #000;"></td>
      </tr>`;

    const penyulangVal = survey?.penyulang || 'GI Menes ; P. Cigeulis ; Gardu : PNBG033';
    const ulpVal = survey?.ulp || 'ULP Labuan';
    const coordVal = (survey?.poles && survey.poles[0]?.lat)
      ? `${survey.poles[0].lat.toFixed(6)},${survey.poles[0].lng?.toFixed(6)}`
      : '-';
    const dayaVal = survey?.dayaBaru || survey?.daya || '-';
    const tarifVal = survey?.tarifBaru || survey?.tarif || '-';

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
      ? `WORK ORDER JASA PEMASARAN ${activePaket === 'paket1' ? 'PAKET 1' : 'PAKET 2'} UP3 BANTEN SELATAN`
      : `RENCANA ANGGARAN BIAYA (RAB) ${activePaket === 'paket1' ? 'JTM (PAKET 1)' : 'JTR (PAKET 2)'} UP3 BANTEN SELATAN`;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <title>${isWoMode ? 'WORK_ORDER' : 'RAB'}_${survey?.id || 'PLN'}</title>
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
      <div style="font-weight:900;font-size:8.5pt;text-transform:uppercase;text-decoration:underline;margin-top:1px;">${vendorName}</div>
      ` : `<div style="font-weight:900;font-size:8.5pt;text-transform:uppercase;text-decoration:underline;margin-top:1px;">${vendorName}</div>`}
    </td>
  </tr>
  <!-- METADATA -->
  <tr>
    <td style="padding:2.5mm 3mm;">
      <table style="border:none;width:100%;">
        <tr>
          <td style="border:none;padding:0;vertical-align:top;width:68%;">
            <table style="border:none;width:100%;font-size:6.8pt;line-height:1.4;">
              <tr><td style="border:none;padding:0.5px 0;width:80px;white-space:nowrap;">Nama Pekerjaan</td><td style="border:none;padding:0.5px 4px;width:8px;">:</td><td style="border:none;padding:0.5px 0;">${survey?.customerName || '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Nomor SPK</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${noSpk !== '—' ? noSpk : '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">No Work Order</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${noWo !== '—' ? noWo : '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Tanggal Awal *)</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${tglAwal !== '—' ? tglAwal : '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Tanggal Akhir *)</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${tglAkhir !== '—' ? tglAkhir : '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;vertical-align:top;">Pengawas</td><td style="border:none;padding:0.5px 4px;vertical-align:top;">:</td><td style="border:none;padding:0.5px 0;">${pengawas1 !== '—' ? pengawas1 : '-'}${pengawas2 && pengawas2 !== '—' ? '<br/>' + pengawas2 : ''}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Alamat</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${survey?.location || '-'}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Titik Koordinat</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${coordVal}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">ULP</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${ulpVal}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Penyulang</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${penyulangVal}</td></tr>
            </table>
          </td>
          <td style="border:none;padding:0 0 0 6mm;vertical-align:top;width:32%;">
            <table style="border:none;width:100%;font-size:6.8pt;line-height:1.4;">
              <tr><td style="border:none;padding:0.5px 0;width:36px;white-space:nowrap;">Daya</td><td style="border:none;padding:0.5px 4px;width:8px;">:</td><td style="border:none;padding:0.5px 0;">${dayaVal}</td></tr>
              <tr><td style="border:none;padding:0.5px 0;">Tarif</td><td style="border:none;padding:0.5px 4px;">:</td><td style="border:none;padding:0.5px 0;">${tarifVal}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- TABEL MATERIAL & JASA -->
<table style="border:1.5px solid #000;border-collapse:collapse;width:100%;font-size:6.5pt;">
  <thead>
    <tr style="background:#fff;font-weight:bold;">
      <th rowspan="2" style="border:1px solid #000;padding:2px 3px;text-align:center;white-space:nowrap;">NO</th>
      <th rowspan="2" style="border:1px solid #000;padding:2px 4px;text-align:center;">URAIAN MATERIAL &amp; JASA</th>
      <th rowspan="2" style="border:1px solid #000;padding:2px 3px;text-align:center;white-space:nowrap;">SAT</th>
      <th rowspan="2" style="border:1px solid #000;padding:2px 4px;text-align:center;white-space:nowrap;">HARGA SATUAN</th>
      <th colspan="2" style="border:1px solid #000;padding:2px 3px;text-align:center;">RENCANA</th>
      <th colspan="2" style="border:1px solid #000;padding:2px 3px;text-align:center;">REALISASI</th>
      <th rowspan="2" style="border:1px solid #000;padding:2px 3px;text-align:center;white-space:nowrap;">KETERANGAN</th>
    </tr>
    <tr style="background:#fff;font-weight:bold;">
      <th style="border:1px solid #000;padding:1.5px 3px;text-align:center;white-space:nowrap;">VOL</th>
      <th style="border:1px solid #000;padding:1.5px 4px;text-align:center;white-space:nowrap;">TOTAL HARGA</th>
      <th style="border:1px solid #000;padding:1.5px 3px;text-align:center;white-space:nowrap;">VOL</th>
      <th style="border:1px solid #000;padding:1.5px 4px;text-align:center;white-space:nowrap;">TOTAL HARGA</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
  <tfoot style="font-size:6.5pt;">
    ${summaryRows}
    <tr>
      <td colspan="4" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:bold;">PPN (11%)</td>
      <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:bold;white-space:nowrap;">${fmtRpLeft(totals.ppnRencana)}</td>
      <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:bold;white-space:nowrap;">${totals.ppnRealisasi > 0 ? fmtRpLeft(totals.ppnRealisasi) : ''}</td>
      <td style="border:1px solid #000;"></td>
    </tr>
    <tr>
      <td colspan="4" style="border:1.5px solid #000;padding:2px 4px;text-align:right;font-weight:900;text-transform:uppercase;">TOTAL NILAI WO / RAB (${activePaket === 'paket1' ? 'PAKET 1 JTM' : 'PAKET 2 JTR'})</td>
      <td colspan="2" style="border:1.5px solid #000;padding:2px 4px;text-align:right;font-weight:900;white-space:nowrap;">${fmtRpLeft(totals.grandRencana)}</td>
      <td colspan="2" style="border:1.5px solid #000;padding:2px 4px;text-align:right;font-weight:900;white-space:nowrap;">${totals.grandRealisasi > 0 ? fmtRpLeft(totals.grandRealisasi) : ''}</td>
      <td style="border:1.5px solid #000;"></td>
    </tr>
    <tr>
      <td colspan="4" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:900;text-transform:uppercase;">DIBULATKAN</td>
      <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:900;white-space:nowrap;">${fmtRpLeft(totals.dibulatkanRencana)}</td>
      <td colspan="2" style="border:1px solid #000;padding:2px 4px;text-align:right;font-weight:900;white-space:nowrap;">${totals.dibulatkanRealisasi > 0 ? fmtRpLeft(totals.dibulatkanRealisasi) : ''}</td>
      <td style="border:1px solid #000;"></td>
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



  const handleExportCSV = () => {
    const hasJasa = totals.jasRencana > 0 || totals.jasRealisasi > 0;
    const headers = [
      'No', 
      'Nomor Material', 
      hasJasa ? 'Uraian Material & Jasa' : 'Uraian Material', 
      'Sat', 
      'Harga Satuan', 
      'Rencana Vol', 
      'Rencana Total', 
      'Realisasi Vol', 
      'Realisasi Total', 
      'Keterangan'
    ];
    const rows = rabItems.map((r) => [
      r.no,
      r.kode,
      `"${r.desc.replace(/"/g, '""')}"`,
      r.sat,
      r.hargaSatuan,
      r.rencanaVol,
      r.rencanaTotal,
      r.realisasiVol,
      r.realisasiTotal,
      `"${r.keterangan || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OUTPUT_RAB_${activePaket.toUpperCase()}_${survey?.id || 'WO'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

            {/* Paket Toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl text-xs font-bold border border-slate-700">
              <button
                type="button"
                onClick={() => setActivePaket('paket1')}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activePaket === 'paket1' ? 'bg-purple-600 text-white shadow-xs font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>RAB JTM (Paket 1)</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePaket('paket2')}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activePaket === 'paket2' ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>RAB JTR (Paket 2)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isWoMode && (
              <button
                type="button"
                onClick={() => setSigPadConfig({
                  isOpen: true,
                  type: 'creator',
                  title: 'Tanda Tangan Digital & Ubah Penandatangan',
                  initialName: creatorName,
                  initialRole: creatorRole,
                  initialSig: creatorSig || undefined,
                })}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                title="Atur tanda tangan digital & nama pejabat"
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-400" /> Tanda Tangan
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak / PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
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
                  ? `WORK ORDER JASA PEMASARAN ${activePaket === 'paket1' ? 'PAKET 1' : 'PAKET 2'} UP3 BANTEN SELATAN`
                  : `RENCANA ANGGARAN BIAYA (RAB) ${activePaket === 'paket1' ? 'JTM (PAKET 1)' : 'JTR (PAKET 2)'} UP3 BANTEN SELATAN`}
              </h2>
              {isWoMode && (
                <div className="text-[10px] print:text-[6.5pt] font-semibold mt-0.5">
                  KEPADA PENYEDIA B/J :
                </div>
              )}
              <div className="text-[11px] print:text-[7.2pt] font-black uppercase underline">
                {vendorName !== '—' ? vendorName : (activePaket === 'paket1' ? 'PT. HAFIZ PUTRA PERKASA' : 'PT. TAWAKAL KARYA TEKNIK')}
              </div>
            </div>

            {/* Metadata Grid Dua Kolom Persis Excel */}
            <div className="p-2 grid grid-cols-1 md:grid-cols-12 gap-x-3 gap-y-0.5 leading-snug print:p-1.5 print-meta-grid">
              
              {/* Kolom Kiri: 8 Kolom */}
              <div className="md:col-span-8 space-y-0.5">
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">Nama Pekerjaan</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">{survey.customerName}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">Nomor SPK</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">
                    {noSpk !== '—' ? noSpk : '0050.SPK /DAN.01.01/F30020000/2026'}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">No Work Order</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">
                    {noWo !== '—' ? noWo : '253.06.WO.2026'}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">Tanggal Awal *)</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">
                    {tglAwal !== '—' ? tglAwal : '18 Juni 2026'}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">Tanggal Akhir *)</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">
                    {tglAkhir !== '—' ? tglAkhir : '12 Juli 2026'}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-24 shrink-0 font-normal">Pengawas</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">
                    {pengawas1 !== '—' ? pengawas1 : 'Fikry Budi Hasbillah (TL Teknik ULP Labuan)'}
                    {pengawas2 !== '—' && (
                      <>
                        <br />
                        {pengawas2 || 'Rizki Wahyu (OF KIN)'}
                      </>
                    )}
                  </span>
                </div>
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
                <div className="flex items-start">
                  <span className="w-12 shrink-0 font-normal">Daya</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">
                    {survey.dayaBaru || survey.daya || '23.000 VA - 33.000 VA, 16.500 VA - 23.000 VA, 10.600 VA, 10.600 VA'}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-12 shrink-0 font-normal">Tarif</span>
                  <span className="w-3 text-center">:</span>
                  <span className="font-normal flex-1">
                    {survey.tarifBaru || survey.tarif || 'I2'}
                  </span>
                </div>
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
                        <td colSpan={7} className="py-1 px-2 border border-black font-bold uppercase tracking-tight">
                          {item.desc}
                        </td>
                        <td className="py-1 px-2 border border-black"></td>
                      </tr>
                    );
                  }

                  const hasVol = item.rencanaVol > 0;

                  return (
                    <tr
                      key={item.id}
                      className="text-black border-b border-black hover:bg-slate-50 transition-colors text-[9.5px] print:text-[6.1pt]"
                    >
                      <td className="py-0.5 px-1.5 text-center border border-black font-normal">{item.no || '-'}</td>
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
                        {item.rencanaVol > 0 ? item.rencanaVol : ''}
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
                        {item.keterangan || (item.section === 'MATERIAL' ? 'LOG UP3 BTS' : '')}
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
                      <td colSpan={4} className="py-1 px-3 text-right uppercase border border-black font-bold">
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
                      <td colSpan={4} className="py-1 px-3 text-right uppercase border border-black font-bold">
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
                      <td colSpan={4} className="py-1.5 px-3 text-right uppercase border border-black font-black">
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
                    <td colSpan={4} className="py-1.5 px-3 text-right uppercase border border-black font-black">
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
                  <td colSpan={4} className="py-1 px-3 text-right border border-black font-normal text-black">
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
                  <td colSpan={4} className="py-1 px-3 text-right uppercase border border-black font-black">
                    TOTAL NILAI WO / RAB ({activePaket === 'paket1' ? 'PAKET 1 JTM' : 'PAKET 2 JTR'})
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
                  <td colSpan={4} className="py-1 px-3 text-right uppercase border border-black font-black text-black">
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
            {isWoMode ? ' • Klik tanda tangan untuk ubah/tanda tangan digital.' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak Dokumen / PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition cursor-pointer"
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
            setApproverName(newName || 'WEGIG DIDIK KURNIAWAN');
            setApproverRole(newRole || 'ASMAN KONSTRUKSI');
            setApproverSig(dataUrl);
          } else {
            setCreatorName(newName || 'HASIAN EFRAVODITUS SITORUS');
            setCreatorRole(newRole || 'TC LOLA KONS');
            setCreatorSig(dataUrl);
          }
        }}
      />
    </div>
  );
};
