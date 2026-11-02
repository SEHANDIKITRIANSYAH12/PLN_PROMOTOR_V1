'use client';
import React, { useState, useEffect } from 'react';
import { Layers, Download, Search, Plus, Save, Trash2, X, Columns, Network, Table, CheckCircle2 } from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { PoleData } from '@/types';

// -------------------------------------------------------------
// 1. DATA SPESIFIKASI MATERIAL JTM & JTR (DARI ISIAN PEKERJAAN)
// -------------------------------------------------------------
interface MaterialCol {
  key: string;
  label: string;
}

// 41 Kolom Material JTM (Baris 42 & Baris 244 ISIAN PEKERJAAN)
const INITIAL_JTM_MATERIALS: MaterialCol[] = [
  { key: 'serandangCantol', label: 'SERANDANG CANTOL' },
  { key: 'serandangPortal', label: 'SERANDANG PORTAL' },
  { key: 'lvsbCantol', label: 'LVSB CANTOL' },
  { key: 'lvsbPortal', label: 'LVSB PORTAL' },
  { key: 'nyy1x95', label: 'NYY 1X95' },
  { key: 'nyy1x240', label: 'NYY 1X240' },
  { key: 'cableShoeCu95', label: 'CABLE SHOE CU 95' },
  { key: 'cableShoeCu240', label: 'CABLE SHOE CU 240' },
  { key: 'cableShoeAlCu150', label: 'CABLE SHOE AL CU 150' },
  { key: 'la', label: 'LA' },
  { key: 'cutOut', label: 'CUT OUT' },
  { key: 'fuseLink2a', label: 'FUSE LINK 2A' },
  { key: 'fuseLink4a', label: 'FUSE LINK 4A' },
  { key: 'fuseLink8a', label: 'FUSE LINK 8A' },
  { key: 'fuseLink12a', label: 'FUSE LINK 12A' },
  { key: 'travesTumpu', label: 'TRAVES TUMPU' },
  { key: 'travesTumpuDouble', label: 'TRAVES TUMPU DOUBLE' },
  { key: 'travesAfspan', label: 'TRAVES AFSPAN' },
  { key: 'unpGalvanis', label: 'UNP GALVANIS' },
  { key: 'pinIsolator', label: 'PIN ISOLATOR' },
  { key: 'hangIsolator', label: 'HANG ISOLATOR' },
  { key: 'topTies', label: 'TOP TIES' },
  { key: 'doubleTies', label: 'DOUBLE TIES' },
  { key: 'staysetTm', label: 'STAYSET TM' },
  { key: 'groundRod', label: 'GROUND ROD' },
  { key: 'cableShoeCu50', label: 'CABLE SHOE CU 50' },
  { key: 'cco150', label: 'CCO 150' },
  { key: 'coverBushingTrafo', label: 'COVER BUSHING TRAFO' },
  { key: 'coverBushingIsolator', label: 'COVER BUSHING ISOLATOR' },
  { key: 'a3csGardu', label: 'A3CS GARDU' },
  { key: 'tiang9200Kontramask', label: 'TIANG 9/200 (KONTRAMASK)' },
  { key: 'tiang12350Gardu', label: 'TIANG 12/350 (GARDU)' },
  { key: 'n2xsy1x35', label: 'N2XSY 1X35' },
  { key: 'term20kvTrf', label: 'TERM;20KV;TRF;AL-CU;3P;3X1X35MM2;N ISO;OD' },
  { key: 'term20kvCub', label: 'TERM;20KV;CUB;CU;3P;3X1X35;N ISO;ID' },
  { key: 'kubikelLbsMotorized', label: 'KUBIKEL LBS MOTORIZED' },
  { key: 'kubikelPbTp', label: 'KUBIKEL PB/TP' },
  { key: 'kubikelPt', label: 'KUBIKEL PT' },
  { key: 'kubikelCbog', label: 'KUBIKEL CBOG' },
  { key: 'kabelNyfgby4x95Mm', label: 'KABEL NYFGBY 4X95 MM' },
  { key: 'pipaArdeGalvanized', label: 'PIPA ARDE GALVANIZED 1" - 6 METER' },
];

// 11 Kolom Material JTR (Baris 122 & Baris 270 ISIAN PEKERJAAN)
const INITIAL_JTR_MATERIALS: MaterialCol[] = [
  { key: 'suspension70', label: 'SUSPENSION 70' },
  { key: 'largeAngle70', label: 'LARGE ANGLE 70' },
  { key: 'deadEndFixed', label: 'DEAD END FIXED' },
  { key: 'deadEndAdj', label: 'DEAD END ADJ' },
  { key: 'bundleProtection', label: 'BUNDLE PROTECTION' },
  { key: 'groundRod', label: 'GROUND ROD' },
  { key: 'cableShoeCu70', label: 'CABLE SHOE CU 70' },
  { key: 'cco70', label: 'CCO 70' },
  { key: 'jointAlCu70', label: 'JOINT AL CU 70' },
  { key: 'staySetTr', label: 'STAY SET TR' },
  { key: 'nyy1x70', label: 'NYY 1X70' },
];

// -------------------------------------------------------------
// 2. MATRIKS STANDAR BOM (DARI ISIAN PEKERJAAN BARIS 244-284)
// -------------------------------------------------------------
interface MatrixRow {
  rowNum: number;
  code: string;
  materials: Record<string, number | null>;
}

const INITIAL_JTM_MATRIX: MatrixRow[] = [
  {
    rowNum: 245,
    code: 'TM - 1B',
    materials: {
      travesTumpu: 1,
      unpGalvanis: 1,
      pinIsolator: 3,
      topTies: 3,
      coverBushingIsolator: 3,
    },
  },
  {
    rowNum: 246,
    code: 'TM - 2B',
    materials: {
      travesTumpuDouble: 1,
      unpGalvanis: 2,
      pinIsolator: 6,
      doubleTies: 3,
      coverBushingIsolator: 6,
    },
  },
  { rowNum: 247, code: 'TM - 3B', materials: {} },
  {
    rowNum: 248,
    code: 'TM - 4B',
    materials: {
      travesAfspan: 1,
      unpGalvanis: 2,
      pinIsolator: 1,
      hangIsolator: 6,
      topTies: 1,
      coverBushingIsolator: 1,
    },
  },
  {
    rowNum: 249,
    code: 'TM - 5B',
    materials: {
      travesAfspan: 1,
      unpGalvanis: 2,
      pinIsolator: 1,
      hangIsolator: 6,
      topTies: 1,
      coverBushingIsolator: 1,
    },
  },
  {
    rowNum: 250,
    code: 'TM - 6B',
    materials: {
      travesAfspan: 1,
      unpGalvanis: 2,
      hangIsolator: 6,
    },
  },
  {
    rowNum: 251,
    code: 'TM - 7B',
    materials: {
      travesAfspan: 1,
      unpGalvanis: 2,
      pinIsolator: 1,
      hangIsolator: 6,
      topTies: 1,
      coverBushingIsolator: 1,
    },
  },
  {
    rowNum: 252,
    code: 'TM - 8B',
    materials: {
      travesTumpu: 1,
      travesAfspan: 1,
      unpGalvanis: 3,
      pinIsolator: 4,
      hangIsolator: 3,
      topTies: 4,
      coverBushingIsolator: 4,
    },
  },
  {
    rowNum: 253,
    code: 'TM - 9B',
    materials: {
      travesAfspan: 1,
      unpGalvanis: 2,
      pinIsolator: 1,
      hangIsolator: 3,
      topTies: 1,
      coverBushingIsolator: 1,
    },
  },
  {
    rowNum: 254,
    code: 'TM - 10B',
    materials: {
      travesTumpu: 1,
      travesAfspan: 1,
      unpGalvanis: 3,
      pinIsolator: 5,
      hangIsolator: 6,
      topTies: 5,
      coverBushingIsolator: 5,
    },
  },
  {
    rowNum: 255,
    code: 'TM - 11B',
    materials: {
      la: 3,
      travesAfspan: 1,
      unpGalvanis: 2,
      hangIsolator: 3,
      staysetTm: 1,
      groundRod: 1,
      cableShoeCu50: 2,
    },
  },
  { rowNum: 256, code: 'TM - 12B', materials: {} },
  { rowNum: 257, code: 'TM - 13B', materials: {} },
  {
    rowNum: 258,
    code: 'TM - 14B',
    materials: {
      la: 3,
      travesTumpu: 1,
      travesAfspan: 1,
      unpGalvanis: 3,
      hangIsolator: 3,
    },
  },
  {
    rowNum: 259,
    code: 'GARDU CANTOL DISTRIBUSI',
    materials: {
      serandangCantol: 1,
      lvsbCantol: 1,
      nyy1x95: 44,
      cableShoeCu95: 8,
      cableShoeAlCu150: 12,
      la: 3,
      cutOut: 3,
      fuseLink4a: 3,
      travesTumpu: 1,
      unpGalvanis: 1,
      pinIsolator: 3,
      topTies: 3,
      groundRod: 3,
      cableShoeCu50: 6,
      cco150: 9,
      coverBushingTrafo: 3,
      coverBushingIsolator: 3,
      a3csGardu: 15,
      tiang9350Gardu: 1,
      pipaArdeGalvanized: 3,
    },
  },
  {
    rowNum: 260,
    code: 'GARDU CANTOL KHUSUS',
    materials: {
      serandangCantol: 1,
      cableShoeCu95: 8,
      cableShoeAlCu150: 12,
      la: 3,
      cutOut: 3,
      fuseLink4a: 3,
      travesTumpu: 1,
      unpGalvanis: 1,
      pinIsolator: 3,
      topTies: 3,
      groundRod: 3,
      cableShoeCu50: 6,
      cco150: 9,
      coverBushingTrafo: 3,
      coverBushingIsolator: 3,
      a3csGardu: 15,
      tiang9350Gardu: 1,
      kabelNyfgby4x95Mm: 11,
      pipaArdeGalvanized: 2,
    },
  },
  {
    rowNum: 261,
    code: 'GARDU PORTAL DISTRIBUSI',
    materials: {
      serandangPortal: 1,
      lvsbPortal: 1,
      nyy1x240: 44,
      cableShoeCu240: 8,
      cableShoeAlCu150: 12,
      la: 3,
      cutOut: 3,
      fuseLink8a: 3,
      travesTumpu: 2,
      travesAfspan: 1,
      unpGalvanis: 4,
      pinIsolator: 6,
      hangIsolator: 3,
      topTies: 6,
      groundRod: 3,
      cableShoeCu50: 6,
      cco150: 9,
      coverBushingTrafo: 3,
      coverBushingIsolator: 6,
      a3csGardu: 20,
      tiang9350Gardu: 2,
      pipaArdeGalvanized: 3,
    },
  },
  {
    rowNum: 262,
    code: 'GARDU PORTAL KHUSUS',
    materials: {
      serandangPortal: 1,
      cableShoeCu95: 16,
      cableShoeAlCu150: 12,
      la: 3,
      cutOut: 3,
      fuseLink8a: 3,
      travesTumpu: 2,
      travesAfspan: 1,
      unpGalvanis: 4,
      pinIsolator: 6,
      hangIsolator: 3,
      topTies: 6,
      groundRod: 3,
      cableShoeCu50: 6,
      cco150: 9,
      coverBushingTrafo: 3,
      coverBushingIsolator: 6,
      a3csGardu: 20,
      tiang9350Gardu: 2,
      kabelNyfgby4x95Mm: 22,
      pipaArdeGalvanized: 2,
    },
  },
  {
    rowNum: 263,
    code: 'GARDU PORTAL RMU',
    materials: {
      serandangPortal: 1,
      lvsbPortal: 1,
      nyy1x240: 44,
      cableShoeCu240: 8,
      cableShoeAlCu150: 12,
      la: 3,
      cutOut: 3,
      fuseLink8a: 3,
      travesTumpu: 2,
      unpGalvanis: 2,
      pinIsolator: 6,
      topTies: 6,
      groundRod: 3,
      cableShoeCu50: 6,
      cco150: 9,
      coverBushingTrafo: 3,
      tiang9350Gardu: 2,
      n2xsy1x35: 44,
      term20kvTrf: 1,
      term20kvCub: 1,
      kubikelLbsMotorized: 2,
      kubikelPbTp: 1,
    },
  },
  {
    rowNum: 264,
    code: 'GARDU BETON',
    materials: {
      kubikelPt: 1,
      kubikelCbog: 1,
    },
  },
  {
    rowNum: 265,
    code: 'STAYSET',
    materials: {
      staysetTm: 1,
    },
  },
  {
    rowNum: 266,
    code: 'KONTRAMASK',
    materials: {
      staysetTm: 1,
      tiang9200Kontramask: 1,
    },
  },
  {
    rowNum: 267,
    code: 'CO AFTAK',
    materials: {
      cutOut: 3,
      fuseLink12a: 3,
    },
  },
];

const INITIAL_JTR_MATRIX: MatrixRow[] = [
  { rowNum: 271, code: 'TR - 1B', materials: { suspension70: 1 } },
  { rowNum: 272, code: 'TR - 2B', materials: { largeAngle70: 1 } },
  { rowNum: 273, code: 'TR - 3B', materials: { deadEndFixed: 1, deadEndAdj: 1 } },
  { rowNum: 274, code: 'TR - 4B', materials: { suspension70: 1, deadEndFixed: 1 } },
  { rowNum: 275, code: 'TR - 5B', materials: { largeAngle70: 1, deadEndFixed: 1 } },
  { rowNum: 276, code: 'TR - 6B', materials: { deadEndFixed: 1, deadEndAdj: 2 } },
  { rowNum: 277, code: 'TR - 7B', materials: { suspension70: 1, deadEndFixed: 2 } },
  { rowNum: 278, code: 'TR - 8B', materials: { largeAngle70: 1, deadEndFixed: 2 } },
  { rowNum: 279, code: 'TR - 9B', materials: { largeAngle70: 2 } },
  {
    rowNum: 280,
    code: 'TR - 10B AWAL',
    materials: {
      deadEndFixed: 1,
      cco70: 4,
    },
  },
  {
    rowNum: 281,
    code: 'TR - 10 B AKHIR',
    materials: {
      deadEndAdj: 1,
      bundleProtection: 1,
      groundRod: 1,
      cableShoeCu70: 1,
      cco70: 1,
      jointAlCu70: 1,
    },
  },
  {
    rowNum: 282,
    code: 'TR - 11B',
    materials: {
      deadEndFixed: 1,
      cableShoeCu70: 4,
      jointAlCu70: 4,
      nyy1x70: 40,
    },
  },
  {
    rowNum: 283,
    code: 'PEMBUMIAN TR',
    materials: {
      groundRod: 1,
      cableShoeCu70: 1,
      cco70: 1,
    },
  },
  {
    rowNum: 284,
    code: 'STAY SET TR',
    materials: {
      staySetTr: 1,
    },
  },
];

// -------------------------------------------------------------
// 3. TABEL ISIAN PEKERJAAN JTM & JTR (BARIS 41-114 & BARIS 121-192)
// -------------------------------------------------------------
interface PoleItem {
  id: string;
  tiang: string;
  konstruksi: string;
  conductorLength: number; // A3CS untuk JTM, JTR 70 untuk JTR
  materialOverrides?: Record<string, number | null>; // Edit / override manual langsung di sel
}

// Data Isian Awal JTM (Persis format Baris 43+ ISIAN PEKERJAAN)
const INITIAL_JTM_POLES: PoleItem[] = [
  { id: 'jtm-1', tiang: '12/200', konstruksi: 'TM - 1B', conductorLength: 50 },
  { id: 'jtm-2', tiang: '12/200', konstruksi: 'TM - 1B', conductorLength: 50 },
  { id: 'jtm-3', tiang: '12/350', konstruksi: 'TM - 7B', conductorLength: 50 },
  { id: 'jtm-4', tiang: '12/200', konstruksi: 'TM - 1B', conductorLength: 50 },
  { id: 'jtm-5', tiang: '12/350', konstruksi: 'TM - 2B', conductorLength: 50 },
  { id: 'jtm-6', tiang: '12/200', konstruksi: 'TM - 1B', conductorLength: 50 },
  { id: 'jtm-7', tiang: '12/200', konstruksi: 'TM - 1B', conductorLength: 50 },
  { id: 'jtm-8', tiang: '12/350 (GARDU)', konstruksi: 'GARDU PORTAL DISTRIBUSI', conductorLength: 50 },
  { id: 'jtm-9', tiang: '12/350 (GARDU)', konstruksi: 'STAYSET', conductorLength: 10 },
];

// Data Isian Awal JTR (Persis format Baris 123+ ISIAN PEKERJAAN)
const INITIAL_JTR_POLES: PoleItem[] = [
  { id: 'jtr-1', tiang: '9/200', konstruksi: 'TR - 1B', conductorLength: 45 },
  { id: 'jtr-2', tiang: '9/200', konstruksi: 'TR - 1B', conductorLength: 45 },
  { id: 'jtr-3', tiang: '9/200', konstruksi: 'TR - 2B', conductorLength: 40 },
  { id: 'jtr-4', tiang: '9/200', konstruksi: 'TR - 1B', conductorLength: 50 },
  { id: 'jtr-5', tiang: '9/350', konstruksi: 'TR - 10 B AKHIR', conductorLength: 35 },
  { id: 'jtr-6', tiang: '9/200', konstruksi: 'STAY SET TR', conductorLength: 0 },
];

export type MainTab = 'JTM' | 'JTR';
export type SubViewMode = 'ISIAN' | 'BOM_MATRIX';

export const StandardConstructionView: React.FC = () => {
  const { surveys, updateSurveyPoles, showToast } = usePromotorStore();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(() => {
    return surveys[0]?.id || 'SRV-0285';
  });

  const currentSurvey = surveys.find((s) => s.id === selectedSurveyId) || surveys[0];

  const [activeTab, setActiveTab] = useState<MainTab>('JTM');
  const [subView, setSubView] = useState<SubViewMode>('ISIAN');

  // Matriks BOM JTM & JTR
  const [jtmMaterials, setJtmMaterials] = useState<MaterialCol[]>(INITIAL_JTM_MATERIALS);
  const [jtmMatrix, setJtmMatrix] = useState<MatrixRow[]>(INITIAL_JTM_MATRIX);

  const [jtrMaterials, setJtrMaterials] = useState<MaterialCol[]>(INITIAL_JTR_MATERIALS);
  const [jtrMatrix, setJtrMatrix] = useState<MatrixRow[]>(INITIAL_JTR_MATRIX);

  // Lembar Isian Tiang JTM & JTR
  const [jtmPoles, setJtmPoles] = useState<PoleItem[]>(INITIAL_JTM_POLES);
  const [jtrPoles, setJtrPoles] = useState<PoleItem[]>(INITIAL_JTR_POLES);

  // Sinkronisasi data tiang saat project survey yang dipilih berubah
  useEffect(() => {
    if (!currentSurvey) return;
    const srvPoles = currentSurvey.poles || [];
    const jtm = srvPoles
      .filter((p) => (p.networkType || '').toUpperCase() === 'JTM')
      .map((p, idx) => ({
        id: p.id || `jtm-${idx + 1}`,
        tiang: p.poleType || '12/200',
        konstruksi: p.tmConstruction || 'TM - 1B',
        conductorLength: p.conductorLength ?? (p.a3cs ? (parseFloat(p.a3cs) || 50) : 50),
        materialOverrides: p.materialOverrides || {},
      }));

    const jtr = srvPoles
      .filter((p) => (p.networkType || '').toUpperCase() === 'JTR')
      .map((p, idx) => ({
        id: p.id || `jtr-${idx + 1}`,
        tiang: p.poleType || '9/200',
        konstruksi: p.trConstruction || 'TR - 1B',
        conductorLength: p.conductorLength ?? (p.lvTwisted ? (parseFloat(p.lvTwisted) || 45) : 45),
        materialOverrides: p.materialOverrides || {},
      }));

    if (jtm.length > 0) {
      setJtmPoles(jtm);
    }
    if (jtr.length > 0) {
      setJtrPoles(jtr);
    }
  }, [selectedSurveyId, currentSurvey?.id]);

  // Helper untuk sinkronisasi ke data survey aktif di store
  const syncToSurvey = (newJtm: PoleItem[], newJtr: PoleItem[]) => {
    if (!currentSurvey) return;
    const originalPoles = currentSurvey.poles || [];
    const jtmPoleData: PoleData[] = newJtm.map((item, idx) => {
      const existing = originalPoles.find((p) => p.id === item.id && p.networkType === 'JTM');
      return {
        id: item.id || `TM-${idx + 1}`,
        name: existing?.name || `Tiang TM #${idx + 1}`,
        std: `Tiang ${item.tiang}`,
        networkType: 'JTM',
        poleType: item.tiang,
        tmConstruction: item.konstruksi,
        a3cs: `${item.conductorLength} m`,
        conductorLength: item.conductorLength,
        materialOverrides: item.materialOverrides,
        qty: 1,
        coordStr: existing?.coordStr || '',
        lat: existing?.lat ?? null,
        lng: existing?.lng ?? null,
        note: existing?.note || '',
        photo: existing?.photo || '',
      };
    });

    const jtrPoleData: PoleData[] = newJtr.map((item, idx) => {
      const existing = originalPoles.find((p) => p.id === item.id && p.networkType === 'JTR');
      return {
        id: item.id || `TR-${idx + 1}`,
        name: existing?.name || `Tiang TR #${idx + 1}`,
        std: `Tiang ${item.tiang}`,
        networkType: 'JTR',
        poleType: item.tiang,
        trConstruction: item.konstruksi,
        lvTwisted: `${item.conductorLength} m`,
        conductorLength: item.conductorLength,
        materialOverrides: item.materialOverrides,
        qty: 1,
        coordStr: existing?.coordStr || '',
        lat: existing?.lat ?? null,
        lng: existing?.lng ?? null,
        note: existing?.note || '',
        photo: existing?.photo || '',
      };
    });

    const otherPoles = originalPoles.filter(
      (p) => (p.networkType || '').toUpperCase() !== 'JTM' && (p.networkType || '').toUpperCase() !== 'JTR'
    );

    updateSurveyPoles(currentSurvey.id, [...jtmPoleData, ...jtrPoleData, ...otherPoles]);
  };

  const [search, setSearch] = useState('');

  // Modals untuk Tambah Baris / Kolom Matriks BOM
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState(false);
  const [newRowCode, setNewRowCode] = useState('');

  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');

  // Modal untuk Tambah Titik Tiang Isian Pekerjaan
  const [isAddPoleModalOpen, setIsAddPoleModalOpen] = useState(false);
  const [newPoleTiang, setNewPoleTiang] = useState('');
  const [newPoleKonstruksi, setNewPoleKonstruksi] = useState('');
  const [newPoleLength, setNewPoleLength] = useState<number>(50);

  // Helper Lookup Matriks BOM
  const getBOM = (tab: MainTab, konstruksiCode: string): Record<string, number | null> => {
    const matrix = tab === 'JTM' ? jtmMatrix : jtrMatrix;
    const row = matrix.find((r) => r.code.toUpperCase() === konstruksiCode.toUpperCase());
    return row ? row.materials : {};
  };

  // -------------------------------------------------------------
  // HANDLERS TABEL ISIAN PEKERJAAN (TIANG, KONSTRUKSI, KAWAT, EDIT SEL)
  // -------------------------------------------------------------
  const handlePoleTiangChange = (id: string, newTiang: string) => {
    if (activeTab === 'JTM') {
      const updated = jtmPoles.map((p) => (p.id === id ? { ...p, tiang: newTiang } : p));
      setJtmPoles(updated);
      syncToSurvey(updated, jtrPoles);
    } else {
      const updated = jtrPoles.map((p) => (p.id === id ? { ...p, tiang: newTiang } : p));
      setJtrPoles(updated);
      syncToSurvey(jtmPoles, updated);
    }
  };

  const handlePoleKonstruksiChange = (id: string, newKonstruksi: string) => {
    if (activeTab === 'JTM') {
      const updated = jtmPoles.map((p) => (p.id === id ? { ...p, konstruksi: newKonstruksi } : p));
      setJtmPoles(updated);
      syncToSurvey(updated, jtrPoles);
    } else {
      const updated = jtrPoles.map((p) => (p.id === id ? { ...p, konstruksi: newKonstruksi } : p));
      setJtrPoles(updated);
      syncToSurvey(jtmPoles, updated);
    }
  };

  const handlePoleLengthChange = (id: string, newLength: string) => {
    const len = newLength === '' ? 0 : parseFloat(newLength);
    const parsed = isNaN(len) ? 0 : len;
    if (activeTab === 'JTM') {
      const updated = jtmPoles.map((p) => (p.id === id ? { ...p, conductorLength: parsed } : p));
      setJtmPoles(updated);
      syncToSurvey(updated, jtrPoles);
    } else {
      const updated = jtrPoles.map((p) => (p.id === id ? { ...p, conductorLength: parsed } : p));
      setJtrPoles(updated);
      syncToSurvey(jtmPoles, updated);
    }
  };

  const handlePoleMaterialCellChange = (id: string, materialKey: string, value: string) => {
    const num = value === '' ? null : parseFloat(value);
    const parsed = isNaN(num as number) ? null : num;

    const updater = (prev: PoleItem[]) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const currentOverrides = p.materialOverrides || {};
        return {
          ...p,
          materialOverrides: {
            ...currentOverrides,
            [materialKey]: parsed,
          },
        };
      });

    if (activeTab === 'JTM') {
      const updated = updater(jtmPoles);
      setJtmPoles(updated);
      syncToSurvey(updated, jtrPoles);
    } else {
      const updated = updater(jtrPoles);
      setJtrPoles(updated);
      syncToSurvey(jtmPoles, updated);
    }
  };

  const handleAddPole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoleKonstruksi) return;

    const newPole: PoleItem = {
      id: `${activeTab.toLowerCase()}-${Date.now()}`,
      tiang: newPoleTiang.trim() || (activeTab === 'JTM' ? '12/200' : '9/200'),
      konstruksi: newPoleKonstruksi,
      conductorLength: Number(newPoleLength) || 0,
      materialOverrides: {},
    };

    if (activeTab === 'JTM') {
      const updated = [...jtmPoles, newPole];
      setJtmPoles(updated);
      syncToSurvey(updated, jtrPoles);
    } else {
      const updated = [...jtrPoles, newPole];
      setJtrPoles(updated);
      syncToSurvey(jtmPoles, updated);
    }

    showToast(`✓ Titik tiang (${newPole.tiang} - ${newPole.konstruksi}) berhasil ditambahkan ke ${activeTab} & disinkronkan`);
    setNewPoleTiang('');
    setNewPoleKonstruksi('');
    setNewPoleLength(50);
    setIsAddPoleModalOpen(false);
  };

  const handleDeletePole = (id: string) => {
    if (confirm('Hapus baris titik tiang ini?')) {
      if (activeTab === 'JTM') {
        const updated = jtmPoles.filter((p) => p.id !== id);
        setJtmPoles(updated);
        syncToSurvey(updated, jtrPoles);
      } else {
        const updated = jtrPoles.filter((p) => p.id !== id);
        setJtrPoles(updated);
        syncToSurvey(jtmPoles, updated);
      }
      showToast(`Titik tiang telah dihapus & disinkronkan ke Survey`);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS MATRIKS MASTER STANDAR BOM
  // -------------------------------------------------------------
  const handleMatrixCodeChange = (rowNum: number, newCode: string) => {
    if (activeTab === 'JTR') {
      setJtrMatrix((prev) =>
        prev.map((r) => (r.rowNum === rowNum ? { ...r, code: newCode.toUpperCase() } : r))
      );
    } else {
      setJtmMatrix((prev) =>
        prev.map((r) => (r.rowNum === rowNum ? { ...r, code: newCode.toUpperCase() } : r))
      );
    }
  };

  const handleMatrixCellChange = (rowNum: number, materialKey: string, value: string) => {
    const num = value === '' ? null : parseFloat(value);
    const parsedVal = isNaN(num as number) ? null : num;
    if (activeTab === 'JTR') {
      setJtrMatrix((prev) =>
        prev.map((r) =>
          r.rowNum === rowNum ? { ...r, materials: { ...r.materials, [materialKey]: parsedVal } } : r
        )
      );
    } else {
      setJtmMatrix((prev) =>
        prev.map((r) =>
          r.rowNum === rowNum ? { ...r, materials: { ...r.materials, [materialKey]: parsedVal } } : r
        )
      );
    }
  };

  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRowCode.trim()) return;

    if (activeTab === 'JTR') {
      const nextNum = jtrMatrix.length > 0 ? Math.max(...jtrMatrix.map((r) => r.rowNum)) + 1 : 271;
      const newRow: MatrixRow = {
        rowNum: nextNum,
        code: newRowCode.trim().toUpperCase(),
        materials: {},
      };
      setJtrMatrix([...jtrMatrix, newRow]);
    } else {
      const nextNum = jtmMatrix.length > 0 ? Math.max(...jtmMatrix.map((r) => r.rowNum)) + 1 : 245;
      const newRow: MatrixRow = {
        rowNum: nextNum,
        code: newRowCode.trim().toUpperCase(),
        materials: {},
      };
      setJtmMatrix([...jtmMatrix, newRow]);
    }

    showToast(`✓ Baris konstruksi "${newRowCode.trim().toUpperCase()}" berhasil ditambahkan ke Matriks BOM ${activeTab}`);
    setNewRowCode('');
    setIsAddRowModalOpen(false);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const key = `mat_${Date.now()}`;
    const newCol: MaterialCol = {
      key,
      label: newColName.trim().toUpperCase(),
    };

    if (activeTab === 'JTR') {
      setJtrMaterials([...jtrMaterials, newCol]);
    } else {
      setJtmMaterials([...jtmMaterials, newCol]);
    }

    showToast(`✓ Kolom material "${newColName.trim().toUpperCase()}" berhasil ditambahkan`);
    setNewColName('');
    setIsAddColModalOpen(false);
  };

  const handleDeleteRow = (rowNum: number, code: string) => {
    if (confirm(`Hapus baris tipe konstruksi "${code}" dari Matriks BOM ${activeTab}?`)) {
      if (activeTab === 'JTR') {
        setJtrMatrix((prev) => prev.filter((r) => r.rowNum !== rowNum));
      } else {
        setJtmMatrix((prev) => prev.filter((r) => r.rowNum !== rowNum));
      }
      showToast(`Baris "${code}" telah dihapus`);
    }
  };

  const handleDeleteColumn = (colKey: string, label: string) => {
    if (confirm(`Hapus kolom material "${label}" dari tabel ${activeTab}?`)) {
      if (activeTab === 'JTR') {
        setJtrMaterials((prev) => prev.filter((m) => m.key !== colKey));
      } else {
        setJtmMaterials((prev) => prev.filter((m) => m.key !== colKey));
      }
      showToast(`Kolom "${label}" telah dihapus`);
    }
  };

  // Data saat ini
  const currentMaterials = activeTab === 'JTR' ? jtrMaterials : jtmMaterials;
  const currentPoles = activeTab === 'JTR' ? jtrPoles : jtmPoles;
  const currentMatrix = activeTab === 'JTR' ? jtrMatrix : jtmMatrix;

  const filteredPoles = currentPoles.filter(
    (p) =>
      p.tiang.toLowerCase().includes(search.toLowerCase()) ||
      p.konstruksi.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMatrix = currentMatrix.filter((r) =>
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 0. Relasi ke Survey Lapangan Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-blue-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Relasi Survey Aktif
                </span>
                <span className="text-xs text-blue-200">
                  Sinkronisasi 2 Arah (Auto-Kalkulasi Material Matriks BOM)
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-1">
                Pekerjaan Terpilih: <span className="text-blue-300">{currentSurvey?.customerName || '-'}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentSurvey?.location || currentSurvey?.address} • Petugas: {currentSurvey?.officerName || 'Surveyor'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
            <div className="text-left sm:text-right px-2">
              <div className="text-[11px] text-blue-200 font-medium">Pilih Pekerjaan / Survey:</div>
              <div className="text-xs font-bold text-white">
                {jtmPoles.length} Tiang JTM • {jtrPoles.length} Tiang JTR
              </div>
            </div>
            <select
              value={selectedSurveyId}
              onChange={(e) => setSelectedSurveyId(e.target.value)}
              className="bg-white text-slate-900 text-xs font-bold py-2 px-3 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-blue-400 cursor-pointer min-w-[260px]"
            >
              {surveys.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.id} - {srv.customerName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Isian Pekerjaan & Standar Konstruksi ({activeTab})
          </h2>
          <p className="text-xs text-slate-500">
            Format data identik sheet ISIAN PEKERJAAN (Baris 41-115 JTM & Baris 121-193 JTR) dari Project Master WO KHS 2026.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast(`Template Excel Isian ${activeTab} siap diunduh`)}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Unduh Excel
          </button>
          <button
            onClick={() => {
              syncToSurvey(jtmPoles, jtrPoles);
              showToast(`✓ Seluruh data ${activeTab} dan kebutuhan material berhasil disinkronkan ke Survey Lapangan (${currentSurvey?.id})!`);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Simpan & Sinkron Survey
          </button>
        </div>
      </div>

      {/* 2 TAB UTAMA: JTM & JTR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('JTM');
              setSearch('');
            }}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'JTM'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            JTM (Jaringan Tegangan Menengah)
          </button>
          <button
            onClick={() => {
              setActiveTab('JTR');
              setSearch('');
            }}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'JTR'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            JTR (Jaringan Tegangan Rendah)
          </button>
        </div>

        {/* Sub-View Switcher: Tabel Isian Pekerjaan VS Matriks Standar BOM */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setSubView('ISIAN')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subView === 'ISIAN'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Tabel Isian Pekerjaan {activeTab}
          </button>
          <button
            onClick={() => setSubView('BOM_MATRIX')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subView === 'BOM_MATRIX'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Matriks Standar BOM {activeTab}
          </button>
        </div>
      </div>

      {/* CONTAINER TABEL UTAMA (TANPA PAGINATION) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tooling Bar (Search & Tambah) */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                subView === 'ISIAN'
                  ? `Cari tiang / konstruksi ${activeTab}...`
                  : `Cari tipe konstruksi ${activeTab}...`
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            {subView === 'ISIAN' ? (
              <button
                onClick={() => setIsAddPoleModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> ＋ Tambah Titik Tiang {activeTab}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsAddRowModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> ＋ Tambah Tipe Konstruksi ({activeTab})
                </button>
                <button
                  onClick={() => setIsAddColModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Columns className="w-3.5 h-3.5" /> ＋ Tambah Kolom Material
                </button>
              </>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAMPILAN 1: TABEL ISIAN PEKERJAAN JTM / JTR              */}
        {/* Sesuai Persis Baris 41-115 (JTM) & Baris 121-193 (JTR)   */}
        {/* ======================================================== */}
        {subView === 'ISIAN' && (
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr className="divide-x divide-blue-500/80">
                  <th className="py-3 px-3 w-12 text-center bg-blue-700">No</th>
                  <th className="py-3 px-3 min-w-[150px] sticky left-0 z-30 bg-blue-700 shadow-sm">
                    TIANG
                  </th>
                  <th className="py-3 px-3 min-w-[210px] sticky left-[150px] z-30 bg-blue-700 shadow-sm">
                    {activeTab === 'JTM' ? 'KONSTRUKSI TM' : 'KONSTRUKSI TR'}
                  </th>
                  <th className="py-3 px-3 min-w-[110px] text-center bg-blue-700">
                    {activeTab === 'JTM' ? 'A3CS (m)' : 'JTR 70 (m)'}
                  </th>
                  {currentMaterials.map((m) => (
                    <th key={m.key} className="py-3 px-3 text-center min-w-[150px] whitespace-normal">
                      {m.label}
                    </th>
                  ))}
                  <th className="py-3 px-2 w-14 text-center bg-blue-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPoles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={currentMaterials.length + 5}
                      className="py-8 text-center text-slate-400"
                    >
                      Belum ada data titik tiang {activeTab}.
                    </td>
                  </tr>
                ) : (
                  filteredPoles.map((pole, idx) => {
                    const bom = getBOM(activeTab, pole.konstruksi);
                    const availableKonstruksi = activeTab === 'JTM' ? jtmMatrix : jtrMatrix;

                    return (
                      <tr key={pole.id} className="hover:bg-blue-50/50 transition-colors divide-x divide-slate-200">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px] bg-slate-50/60">
                          {idx + 1}
                        </td>

                        {/* 1. Tiang Bisa Diedit Langsung */}
                        <td className="p-1 sticky left-0 z-10 bg-white shadow-xs">
                          <input
                            type="text"
                            value={pole.tiang}
                            onChange={(e) => handlePoleTiangChange(pole.id, e.target.value)}
                            placeholder={activeTab === 'JTM' ? 'Mis: 12/200' : 'Mis: 9/200'}
                            className="w-full px-2 py-1 font-semibold text-slate-800 text-xs rounded border border-transparent hover:border-slate-300 focus:bg-blue-50/40 focus:border-blue-500 transition"
                          />
                        </td>

                        {/* 2. Konstruksi Bisa Dipilih / Diganti Langsung */}
                        <td className="p-1 sticky left-[150px] z-10 bg-white shadow-xs">
                          <select
                            value={pole.konstruksi}
                            onChange={(e) => handlePoleKonstruksiChange(pole.id, e.target.value)}
                            className="w-full px-2 py-1 font-bold text-blue-700 text-xs bg-white rounded border border-slate-200 hover:border-blue-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
                          >
                            <option value="">-- Pilih Konstruksi --</option>
                            {availableKonstruksi.map((r) => (
                              <option key={r.code} value={r.code}>
                                {r.code}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 3. Panjang Kawat / Kabel (A3CS / JTR 70) Bisa Diedit Langsung */}
                        <td className="p-1 text-center bg-slate-50/40">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            placeholder="0"
                            value={pole.conductorLength > 0 ? pole.conductorLength : ''}
                            onChange={(e) => handlePoleLengthChange(pole.id, e.target.value)}
                            className="w-full py-1 text-center font-mono font-bold text-slate-900 text-xs rounded border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-500 transition"
                          />
                        </td>

                        {/* 4. Sel Material: Rumus VLOOKUP Otomatis dari Matriks BOM + Bisa Diedit Langsung */}
                        {currentMaterials.map((m) => {
                          const overrideVal = pole.materialOverrides?.[m.key];
                          const defaultVal = bom[m.key] ?? null;
                          const currentVal = overrideVal !== undefined ? overrideVal : defaultVal;
                          const hasVal = currentVal !== null && currentVal !== undefined && currentVal > 0;
                          const isOverridden = overrideVal !== undefined && overrideVal !== null;

                          return (
                            <td
                              key={m.key}
                              className={`p-1 text-center transition-colors ${
                                hasVal ? (isOverridden ? 'bg-amber-50/60' : 'bg-blue-50/40') : ''
                              }`}
                            >
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="-"
                                value={currentVal ?? ''}
                                onChange={(e) => handlePoleMaterialCellChange(pole.id, m.key, e.target.value)}
                                className={`w-full py-1 text-center text-xs font-mono rounded border transition-colors ${
                                  hasVal
                                    ? isOverridden
                                      ? 'font-bold text-amber-900 bg-white border-amber-400 shadow-2xs'
                                      : 'font-bold text-blue-900 bg-transparent border-transparent hover:border-blue-300 focus:bg-white focus:border-blue-500'
                                    : 'text-slate-300 bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500'
                                }`}
                                title={isOverridden ? 'Nilai di-override manual' : 'Nilai otomatis dari Matriks BOM'}
                              />
                            </td>
                          );
                        })}

                        {/* Aksi Hapus Titik Tiang */}
                        <td className="py-2 px-2 text-center bg-slate-50/40">
                          <button
                            type="button"
                            onClick={() => handleDeletePole(pole.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* REKAPITULASI TOTAL KEBUTUHAN (Baris 115 JTM & Baris 193 JTR Excel) */}
              {filteredPoles.length > 0 && (
                <tfoot className="sticky bottom-0 z-20 bg-slate-900 text-white font-bold text-xs">
                  <tr className="divide-x divide-slate-700">
                    <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider sticky left-0 z-30 bg-slate-900">
                      TOTAL KEBUTUHAN {activeTab}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-400 bg-slate-800">
                      {filteredPoles.reduce((acc, p) => acc + (p.conductorLength || 0), 0)} m
                    </td>
                    {currentMaterials.map((m) => {
                      const total = filteredPoles.reduce((acc, p) => {
                        const overrideVal = p.materialOverrides?.[m.key];
                        if (overrideVal !== undefined && overrideVal !== null) {
                          return acc + Number(overrideVal);
                        }
                        const bom = getBOM(activeTab, p.konstruksi);
                        return acc + (Number(bom[m.key]) || 0);
                      }, 0);
                      return (
                        <td key={m.key} className="py-3 px-3 text-center font-mono text-amber-400">
                          {total > 0 ? total : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-2 text-center bg-slate-800">-</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAMPILAN 2: MATRIKS MASTER STANDAR BOM JTM / JTR         */}
        {/* Sesuai Persis Baris 244-267 (JTM) & Baris 270-284 (JTR)  */}
        {/* ======================================================== */}
        {subView === 'BOM_MATRIX' && (
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr className="divide-x divide-blue-500/80">
                  <th className="py-3 px-3 w-14 text-center bg-blue-700">No</th>
                  <th className="py-3 px-3 min-w-[220px] sticky left-0 z-30 bg-blue-700 shadow-sm">
                    {activeTab === 'JTM' ? 'KONSTRUKSI TM' : 'KONSTRUKSI TR'}
                  </th>
                  {currentMaterials.map((m) => (
                    <th key={m.key} className="py-3 px-3 text-center min-w-[160px] whitespace-normal group relative">
                      <div className="flex items-center justify-between gap-1">
                        <span className="flex-1">{m.label}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(m.key, m.label)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-200 p-0.5 rounded transition cursor-pointer"
                          title="Hapus kolom ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 w-16 text-center bg-blue-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={currentMaterials.length + 3} className="py-8 text-center text-slate-400">
                      Tidak ada data konstruksi yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((row) => (
                    <tr key={row.rowNum} className="hover:bg-blue-50/50 transition-colors divide-x divide-slate-200">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px] bg-slate-50/60">
                        {row.rowNum}
                      </td>

                      {/* Kode Konstruksi Bisa Diedit Langsung */}
                      <td className="p-1 sticky left-0 z-10 bg-white shadow-xs">
                        <input
                          type="text"
                          value={row.code}
                          onChange={(e) => handleMatrixCodeChange(row.rowNum, e.target.value)}
                          className="w-full px-2.5 py-1.5 font-bold text-slate-900 text-xs rounded border border-transparent hover:border-slate-300 focus:bg-blue-50/40 focus:border-blue-500 uppercase transition"
                          placeholder="Kode Konstruksi"
                        />
                      </td>

                      {/* Sel Kuantitas Material Bisa Diedit Langsung */}
                      {currentMaterials.map((m) => {
                        const val = row.materials[m.key];
                        const hasVal = val !== undefined && val !== null && val > 0;
                        return (
                          <td
                            key={m.key}
                            className={`p-1 text-center transition-colors ${hasVal ? 'bg-blue-50/50' : ''}`}
                          >
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="-"
                              value={val ?? ''}
                              onChange={(e) => handleMatrixCellChange(row.rowNum, m.key, e.target.value)}
                              className={`w-full py-1 text-center text-xs font-mono rounded border transition-colors ${
                                hasVal
                                  ? 'font-bold text-blue-900 bg-white border-blue-400 shadow-2xs'
                                  : 'text-slate-400 bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Tombol Hapus Baris */}
                      <td className="py-2 px-2 text-center whitespace-nowrap bg-slate-50/40">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.rowNum, row.code)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: Tambah Titik Tiang Isian Pekerjaan                */}
      {/* ======================================================== */}
      {isAddPoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Tambah Titik Tiang {activeTab}
              </h3>
              <button onClick={() => setIsAddPoleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPole} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Spesifikasi Tiang
                </label>
                <input
                  type="text"
                  placeholder={activeTab === 'JTM' ? 'Mis: 12/200, 12/350, 12/350 (GARDU)' : 'Mis: 9/200, 9/350'}
                  value={newPoleTiang}
                  onChange={(e) => setNewPoleTiang(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilihan Konstruksi {activeTab === 'JTM' ? 'TM' : 'TR'} *
                </label>
                <select
                  required
                  value={newPoleKonstruksi}
                  onChange={(e) => setNewPoleKonstruksi(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- Pilih Konstruksi --</option>
                  {(activeTab === 'JTM' ? jtmMatrix : jtrMatrix).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {activeTab === 'JTM' ? 'Panjang Kawat A3CS (meter)' : 'Panjang Kabel JTR 70 (meter)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={newPoleLength}
                  onChange={(e) => setNewPoleLength(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPoleModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                >
                  Simpan Titik Tiang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Tambah Baris Matriks Konstruksi JTM / JTR          */}
      {/* ======================================================== */}
      {isAddRowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Tambah Tipe Konstruksi ({activeTab})
              </h3>
              <button onClick={() => setIsAddRowModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRow} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode / Nama Konstruksi *
                </label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'JTR' ? 'Mis: TR - 15B' : 'Mis: TM - 15B'}
                  value={newRowCode}
                  onChange={(e) => setNewRowCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-slate-900 uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRowModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                >
                  Tambah Baris
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Tambah Kolom Material Matriks Konstruksi JTM/JTR   */}
      {/* ======================================================== */}
      {isAddColModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Tambah Kolom Material ({activeTab})
              </h3>
              <button onClick={() => setIsAddColModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddColumn} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama / Spesifikasi Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'JTR' ? 'Mis: DEAD END CLAMP 70' : 'Mis: ISOLATOR TUMPU 20kV'}
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-slate-900 uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddColModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                >
                  Tambah Kolom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
