'use client';
import React, { useState, useEffect } from 'react';
import { Layers, Download, Search, Plus, Save, Trash2, X, Columns } from 'lucide-react';
import { usePromotorStore } from '@/store/usePromotorStore';

// -------------------------------------------------------------
// 1. DATA SPESIFIKASI MATERIAL JTM & JTR (KOLOM MATRIKS STANDAR BOM)
// -------------------------------------------------------------
interface MaterialCol {
  key: string;
  label: string;
}

// 41 Kolom Material JTM (BOM KHS PLN Distribusi 2026)
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

// 11 Kolom Material JTR (BOM KHS PLN Distribusi 2026)
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
// 2. MATRIKS STANDAR BOM
// -------------------------------------------------------------
interface MatrixRow {
  rowNum: number;
  code: string;
  tiang?: string;
  conductorLength?: number;
  materials: Record<string, number | null>;
}

const INITIAL_JTM_MATRIX: MatrixRow[] = [
  { rowNum: 393, code: 'TM - 1B', tiang: '12/200', conductorLength: 0, materials: { travesTumpu: 1, unpGalvanis: 1, pinIsolator: 3, topTies: 3, coverBushingIsolator: 3 } },
  { rowNum: 394, code: 'TM - 2B', tiang: '12/200', conductorLength: 0, materials: { travesTumpuDouble: 1, unpGalvanis: 2, pinIsolator: 6, doubleTies: 3, coverBushingIsolator: 6 } },
  { rowNum: 395, code: 'TM - 3B', tiang: '12/200', conductorLength: 0, materials: {} },
  { rowNum: 396, code: 'TM - 4B', tiang: '12/200', conductorLength: 0, materials: { travesAfspan: 1, unpGalvanis: 2, pinIsolator: 1, hangIsolator: 6, topTies: 1, coverBushingIsolator: 1 } },
  { rowNum: 397, code: 'TM - 5B', tiang: '12/200', conductorLength: 0, materials: { travesAfspan: 1, unpGalvanis: 2, pinIsolator: 1, hangIsolator: 6, topTies: 1, coverBushingIsolator: 1 } },
  { rowNum: 398, code: 'TM - 6B', tiang: '12/200', conductorLength: 0, materials: { travesAfspan: 1, unpGalvanis: 2, hangIsolator: 6 } },
  { rowNum: 399, code: 'TM - 7B', tiang: '12/200', conductorLength: 0, materials: { travesAfspan: 1, unpGalvanis: 2, pinIsolator: 1, hangIsolator: 6, topTies: 1, coverBushingIsolator: 1 } },
  { rowNum: 400, code: 'TM - 8B', tiang: '12/200', conductorLength: 0, materials: { travesTumpu: 1, travesAfspan: 1, unpGalvanis: 3, pinIsolator: 4, hangIsolator: 3, topTies: 4, coverBushingIsolator: 4 } },
  { rowNum: 401, code: 'TM - 9B', tiang: '12/200', conductorLength: 0, materials: { travesAfspan: 1, unpGalvanis: 2, pinIsolator: 1, hangIsolator: 3, topTies: 1, coverBushingIsolator: 1 } },
  { rowNum: 402, code: 'TM - 10B', tiang: '12/200', conductorLength: 0, materials: { travesTumpu: 1, travesAfspan: 1, unpGalvanis: 3, pinIsolator: 5, hangIsolator: 6, topTies: 5, coverBushingIsolator: 5 } },
  { rowNum: 403, code: 'TM - 11B', tiang: '12/200', conductorLength: 0, materials: { la: 3, travesAfspan: 1, unpGalvanis: 2, hangIsolator: 3, staysetTm: 1, groundRod: 1, cableShoeCu50: 2 } },
  { rowNum: 404, code: 'TM - 12B', tiang: '12/200', conductorLength: 0, materials: {} },
  { rowNum: 405, code: 'TM - 13B', tiang: '12/200', conductorLength: 0, materials: {} },
  { rowNum: 406, code: 'TM - 14B', tiang: '12/200', conductorLength: 0, materials: { la: 3, travesTumpu: 1, travesAfspan: 1, unpGalvanis: 3, hangIsolator: 3 } },
  { rowNum: 407, code: 'GARDU CANTOL DISTRIBUSI', tiang: '12/200', conductorLength: 0, materials: { serandangCantol: 1, lvsbCantol: 1, nyy1x95: 44, cableShoeCu95: 8, cableShoeAlCu150: 12, la: 3, cutOut: 3, fuseLink4a: 3, travesTumpu: 1, unpGalvanis: 1, pinIsolator: 3, topTies: 3, groundRod: 3, cableShoeCu50: 6, cco150: 9, coverBushingTrafo: 3, coverBushingIsolator: 3, a3csGardu: 15, tiang12350Gardu: 1 } },
  { rowNum: 408, code: 'GARDU CANTOL KHUSUS', tiang: '12/200', conductorLength: 0, materials: { serandangCantol: 1, cableShoeCu95: 8, cableShoeAlCu150: 12, la: 3, cutOut: 3, fuseLink4a: 3, travesTumpu: 1, unpGalvanis: 1, pinIsolator: 3, topTies: 3, groundRod: 3, cableShoeCu50: 6, cco150: 9, coverBushingTrafo: 3, coverBushingIsolator: 3, a3csGardu: 15, tiang12350Gardu: 1, kabelNyfgby4x95Mm: 11 } },
  { rowNum: 409, code: 'GARDU PORTAL DISTRIBUSI', tiang: '12/200', conductorLength: 0, materials: { serandangPortal: 1, lvsbPortal: 1, nyy1x240: 44, cableShoeCu240: 8, cableShoeAlCu150: 12, la: 3, cutOut: 3, fuseLink8a: 3, travesTumpu: 2, travesAfspan: 1, unpGalvanis: 4, pinIsolator: 6, hangIsolator: 3, topTies: 6, groundRod: 3, cableShoeCu50: 6, cco150: 9, coverBushingTrafo: 3, coverBushingIsolator: 6, a3csGardu: 20, tiang12350Gardu: 2 } },
  { rowNum: 410, code: 'GARDU PORTAL KHUSUS', tiang: '12/200', conductorLength: 0, materials: { serandangPortal: 1, cableShoeCu95: 16, cableShoeAlCu150: 12, la: 3, cutOut: 3, fuseLink8a: 3, travesTumpu: 2, travesAfspan: 1, unpGalvanis: 4, pinIsolator: 6, hangIsolator: 3, topTies: 6, groundRod: 3, cableShoeCu50: 6, cco150: 9, coverBushingTrafo: 3, coverBushingIsolator: 6, a3csGardu: 20, tiang12350Gardu: 2, kabelNyfgby4x95Mm: 22 } },
  { rowNum: 411, code: 'GARDU PORTAL RMU', tiang: '12/200', conductorLength: 0, materials: { serandangPortal: 1, lvsbPortal: 1, nyy1x240: 44, cableShoeCu240: 8, cableShoeAlCu150: 12, la: 3, cutOut: 3, fuseLink8a: 3, travesTumpu: 2, unpGalvanis: 2, pinIsolator: 6, topTies: 6, groundRod: 3, cableShoeCu50: 6, cco150: 9, coverBushingTrafo: 3, tiang12350Gardu: 2, n2xsy1x35: 44, term20kvTrf: 1, term20kvCub: 1, kubikelLbsMotorized: 2, kubikelPbTp: 1 } },
  { rowNum: 412, code: 'GARDU BETON', tiang: '12/200', conductorLength: 0, materials: { kubikelPt: 1, kubikelCbog: 1 } },
  { rowNum: 413, code: 'STAYSET', tiang: '12/200', conductorLength: 0, materials: { staysetTm: 1 } },
  { rowNum: 414, code: 'KONTRAMASK', tiang: '12/200', conductorLength: 0, materials: { staysetTm: 1, tiang9200Kontramask: 1 } },
  { rowNum: 415, code: 'CO AFTAK', tiang: '12/200', conductorLength: 0, materials: { cutOut: 3, fuseLink12a: 3 } },
];

const INITIAL_JTR_MATRIX: MatrixRow[] = [
  { rowNum: 419, code: 'TR - 1B', tiang: '9/200', conductorLength: 0, materials: { suspension70: 1 } },
  { rowNum: 420, code: 'TR - 2B', tiang: '9/200', conductorLength: 0, materials: { largeAngle70: 1 } },
  { rowNum: 421, code: 'TR - 3B', tiang: '9/200', conductorLength: 0, materials: { deadEndFixed: 1, deadEndAdj: 1 } },
  { rowNum: 422, code: 'TR - 4B', tiang: '9/200', conductorLength: 0, materials: { suspension70: 1, deadEndFixed: 1 } },
  { rowNum: 423, code: 'TR - 5B', tiang: '9/200', conductorLength: 0, materials: { largeAngle70: 1, deadEndFixed: 1 } },
  { rowNum: 424, code: 'TR - 6B', tiang: '9/200', conductorLength: 0, materials: { deadEndFixed: 1, deadEndAdj: 2 } },
  { rowNum: 425, code: 'TR - 7B', tiang: '9/200', conductorLength: 0, materials: { suspension70: 1, deadEndFixed: 2 } },
  { rowNum: 426, code: 'TR - 8B', tiang: '9/200', conductorLength: 0, materials: { largeAngle70: 1, deadEndFixed: 2 } },
  { rowNum: 427, code: 'TR - 9B', tiang: '9/200', conductorLength: 0, materials: { largeAngle70: 2 } },
  { rowNum: 428, code: 'TR - 10B AWAL', tiang: '9/200', conductorLength: 0, materials: { deadEndFixed: 1, cco70: 4 } },
  { rowNum: 429, code: 'TR - 10 B AKHIR', tiang: '9/200', conductorLength: 0, materials: { deadEndAdj: 1, bundleProtection: 1, groundRod: 1, cableShoeCu70: 1, cco70: 1, jointAlCu70: 1 } },
  { rowNum: 430, code: 'TR - 11B', tiang: '9/200', conductorLength: 0, materials: { deadEndFixed: 1, cableShoeCu70: 4, jointAlCu70: 4, nyy1x70: 40 } },
  { rowNum: 431, code: 'PEMBUMIAN TR', tiang: '9/200', conductorLength: 0, materials: { groundRod: 1, cableShoeCu70: 1, cco70: 1 } },
  { rowNum: 432, code: 'STAY SET TR', tiang: '9/200', conductorLength: 0, materials: { staySetTr: 1 } },
];

export type MainTab = 'JTM' | 'JTR';

export const StandardConstructionView: React.FC = () => {
  const {
    constructionRules,
    updateConstructionKonstruksiList,
    updateConstructionTiangList,
    showToast,
  } = usePromotorStore();

  const [activeTab, setActiveTab] = useState<MainTab>('JTM');
  const [search, setSearch] = useState('');

  // Matriks BOM JTM & JTR (Tetap dipertahankan 100%)
  const [jtmMaterials, setJtmMaterials] = useState<MaterialCol[]>(INITIAL_JTM_MATERIALS);
  const [jtmMatrix, setJtmMatrix] = useState<MatrixRow[]>(INITIAL_JTM_MATRIX);

  const [jtrMaterials, setJtrMaterials] = useState<MaterialCol[]>(INITIAL_JTR_MATERIALS);
  const [jtrMatrix, setJtrMatrix] = useState<MatrixRow[]>(INITIAL_JTR_MATRIX);

  // Modals untuk Tambah Baris / Kolom Matriks BOM & Tambah Tiang
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState(false);
  const [newRowCode, setNewRowCode] = useState('');
  const [newRowTiang, setNewRowTiang] = useState('');
  const [newRowLength, setNewRowLength] = useState<number>(50);

  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');

  const [isAddTiangModalOpen, setIsAddTiangModalOpen] = useState(false);
  const [newTiangName, setNewTiangName] = useState('');

  // Sinkronisasi otomatis tipe konstruksi & tiang Matriks BOM ke Menu Survey
  useEffect(() => {
    const jtmCodes = jtmMatrix.map((r) => r.code.trim()).filter(Boolean);
    if (jtmCodes.length > 0) updateConstructionKonstruksiList('jtm', jtmCodes);

    const jtmTiang = jtmMatrix.map((r) => r.tiang?.trim()).filter(Boolean) as string[];
    if (jtmTiang.length > 0) updateConstructionTiangList('jtm', jtmTiang);
  }, [jtmMatrix, updateConstructionKonstruksiList, updateConstructionTiangList]);

  useEffect(() => {
    const jtrCodes = jtrMatrix.map((r) => r.code.trim()).filter(Boolean);
    if (jtrCodes.length > 0) updateConstructionKonstruksiList('jtr', jtrCodes);

    const jtrTiang = jtrMatrix.map((r) => r.tiang?.trim()).filter(Boolean) as string[];
    if (jtrTiang.length > 0) updateConstructionTiangList('jtr', jtrTiang);
  }, [jtrMatrix, updateConstructionKonstruksiList, updateConstructionTiangList]);

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    setSearch('');
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

  const handleMatrixTiangChange = (rowNum: number, newTiang: string) => {
    if (activeTab === 'JTR') {
      setJtrMatrix((prev) =>
        prev.map((r) => (r.rowNum === rowNum ? { ...r, tiang: newTiang } : r))
      );
    } else {
      setJtmMatrix((prev) =>
        prev.map((r) => (r.rowNum === rowNum ? { ...r, tiang: newTiang } : r))
      );
    }
  };

  const handleMatrixLengthChange = (rowNum: number, newLength: string) => {
    const len = newLength === '' ? 0 : parseFloat(newLength);
    const parsed = isNaN(len) ? 0 : len;
    if (activeTab === 'JTR') {
      setJtrMatrix((prev) =>
        prev.map((r) => (r.rowNum === rowNum ? { ...r, conductorLength: parsed } : r))
      );
    } else {
      setJtmMatrix((prev) =>
        prev.map((r) => (r.rowNum === rowNum ? { ...r, conductorLength: parsed } : r))
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
        tiang: newRowTiang.trim() || '9/200',
        conductorLength: Number(newRowLength) || 45,
        materials: {},
      };
      setJtrMatrix([...jtrMatrix, newRow]);
    } else {
      const nextNum = jtmMatrix.length > 0 ? Math.max(...jtmMatrix.map((r) => r.rowNum)) + 1 : 245;
      const newRow: MatrixRow = {
        rowNum: nextNum,
        code: newRowCode.trim().toUpperCase(),
        tiang: newRowTiang.trim() || '12/200',
        conductorLength: Number(newRowLength) || 50,
        materials: {},
      };
      setJtmMatrix([...jtmMatrix, newRow]);
    }

    showToast(`✓ Baris konstruksi "${newRowCode.trim().toUpperCase()}" berhasil ditambahkan ke Matriks BOM ${activeTab}`);
    setNewRowCode('');
    setNewRowTiang('');
    setNewRowLength(50);
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

  const handleAddTiang = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newTiangName.trim();
    if (!val) return;

    const netKey = activeTab === 'JTR' ? 'jtr' : 'jtm';
    const currentTiang = activeTab === 'JTR'
      ? (constructionRules?.jtr?.tiangList || ['9/200', '9/350', '9/200 (KONTRAMASK)'])
      : (constructionRules?.jtm?.tiangList || ['12/200', '12/350', '12/350 (GARDU)']);

    if (currentTiang.includes(val)) {
      showToast(`Tipe tiang "${val}" sudah ada dalam daftar`);
      return;
    }

    const updated = [...currentTiang, val];
    updateConstructionTiangList(netKey, updated);
    showToast(`✓ Tipe tiang "${val}" berhasil ditambahkan ke daftar ${activeTab}!`);
    setNewTiangName('');
    setIsAddTiangModalOpen(false);
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
  const currentMatrix = activeTab === 'JTR' ? jtrMatrix : jtmMatrix;

  const filteredMatrix = currentMatrix.filter((r) =>
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
              STANDAR KONTRAK KHS 2026
            </span>
            <span className="text-xs text-slate-400 font-medium">
              PLN Distribusi JTM &amp; JTR
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Matriks Standar BOM Material ({activeTab})
          </h2>
          <p className="text-xs text-slate-500">
            Formula kebutuhan material per jenis konstruksi standar PLN untuk kalkulasi otomatis RAB &amp; Survey.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast(`Template Excel Matriks BOM ${activeTab} siap diunduh`)}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Unduh Excel
          </button>
          <button
            onClick={() => {
              showToast(`✓ Master Matriks Standar BOM ${activeTab} berhasil disimpan!`);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Simpan Standar
          </button>
        </div>
      </div>

      {/* 2 TAB UTAMA: JTM & JTR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('JTM')}
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
            onClick={() => handleTabChange('JTR')}
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
      </div>

      {/* CONTAINER TABEL UTAMA MATRIKS STANDAR BOM */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tooling Bar (Search & Tambah) */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Cari tipe konstruksi ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddTiangModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Tiang ({activeTab})
            </button>
            <button
              onClick={() => setIsAddRowModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Tipe Konstruksi ({activeTab})
            </button>
            <button
              onClick={() => setIsAddColModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Columns className="w-3.5 h-3.5" /> Tambah Kolom Material
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TABEL MATRIKS MASTER STANDAR BOM JTM / JTR               */}
        {/* Desain Bersih & Elegan: Header Biru Solid & Baris Putih  */}
        {/* ======================================================== */}
        <div className="overflow-x-auto max-h-[75vh] bg-white">
          <table className="w-full text-left text-xs border-collapse bg-white">
            <thead className="sticky top-0 z-20 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 w-14 text-center">NO</th>
                <th className="py-3.5 px-4 min-w-[130px] text-center">TIANG</th>
                <th className="py-3.5 px-4 min-w-[200px]">
                  {activeTab === 'JTM' ? 'KONSTRUKSI TM' : 'KONSTRUKSI TR'}
                </th>
                <th className="py-3.5 px-4 min-w-[150px] text-center">
                  {activeTab === 'JTM' ? 'PANJANG KONDUKTOR (M)' : 'JTR 70 (M)'}
                </th>
                {currentMaterials.map((m) => (
                  <th key={m.key} className="py-3.5 px-3 text-center min-w-[160px] whitespace-normal group relative">
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex-1">{m.label}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(m.key, m.label)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-200 p-0.5 rounded transition cursor-pointer text-white/70"
                        title="Hapus kolom ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="py-3.5 px-3 w-16 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={currentMaterials.length + 5} className="py-8 text-center text-slate-400 bg-white">
                    Tidak ada data konstruksi yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((row) => (
                  <tr key={row.rowNum} className="hover:bg-blue-50/20 transition-colors divide-x divide-slate-100 bg-white">
                    <td className="py-3 px-3 text-center font-mono text-blue-400 text-xs bg-white">
                      {row.rowNum}
                    </td>

                    {/* Kolom TIANG (JTM & JTR) */}
                    <td className="p-1.5 bg-white">
                      <select
                        value={row.tiang || (activeTab === 'JTM' ? '12/200' : '9/200')}
                        onChange={(e) => handleMatrixTiangChange(row.rowNum, e.target.value)}
                        className="w-full px-2 py-1.5 font-bold text-slate-900 text-xs text-center rounded border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 bg-slate-50/50 cursor-pointer transition"
                      >
                        {(activeTab === 'JTR'
                          ? (constructionRules?.jtr?.tiangList || ['9/200', '9/350'])
                          : (constructionRules?.jtm?.tiangList || ['12/200', '12/350', '12/350 (GARDU)'])
                        ).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>

                    {/* Kode Konstruksi Bisa Diedit Langsung */}
                    <td className="p-1.5 bg-white">
                      <input
                        type="text"
                        value={row.code}
                        onChange={(e) => handleMatrixCodeChange(row.rowNum, e.target.value)}
                        className="w-full px-2.5 py-1.5 font-bold text-slate-900 text-xs rounded border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-400 uppercase transition"
                        placeholder="Kode Konstruksi"
                      />
                    </td>

                    {/* Kolom PANJANG KONDUKTOR (M) / JTR 70 (M) */}
                    <td className="p-1.5 text-center bg-white">
                      <div className="flex items-center justify-center gap-1 max-w-[120px] mx-auto">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          placeholder="-"
                          value={row.conductorLength !== undefined && row.conductorLength > 0 ? row.conductorLength : ''}
                          onChange={(e) => handleMatrixLengthChange(row.rowNum, e.target.value)}
                          className="w-16 py-1 text-center font-mono font-bold text-slate-900 text-xs rounded border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-400 transition"
                        />
                        <span className="text-slate-400 text-xs pointer-events-none">m</span>
                      </div>
                    </td>

                    {/* Sel Kuantitas Material Bisa Diedit Langsung */}
                    {currentMaterials.map((m) => {
                      const val = row.materials[m.key];
                      const hasVal = val !== undefined && val !== null && val > 0;
                      return (
                        <td
                          key={m.key}
                          className="p-1 text-center transition-colors bg-white"
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
                                ? 'font-bold text-blue-600 bg-blue-50/40 border-blue-200 shadow-2xs'
                                : 'text-slate-300 bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-400'
                            }`}
                          />
                        </td>
                      );
                    })}

                    {/* Tombol Hapus Baris */}
                    <td className="py-2 px-2 text-center whitespace-nowrap bg-white">
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
            <tfoot className="sticky bottom-0 z-20 bg-slate-50/90 text-slate-700 font-bold text-xs border-t border-slate-200">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-left uppercase tracking-wider text-slate-600">
                  TOTAL TIPE KONSTRUKSI {activeTab}: <b className="text-slate-900">{filteredMatrix.length} Jenis</b>
                  <span className="ml-4 text-blue-600 font-semibold">
                    • Total Panjang {activeTab === 'JTM' ? 'Kawat A3CS' : 'Kabel JTR 70'}: <b>{filteredMatrix.reduce((acc, r) => acc + (r.conductorLength || 0), 0)} m</b>
                  </span>
                </td>
                <td colSpan={currentMaterials.length + 1} className="py-3 px-4 text-right uppercase tracking-wider text-slate-500">
                  TOTAL KOLOM MATERIAL: <b className="text-blue-600">{currentMaterials.length} Item</b>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: Tambah Baris Konstruksi JTM/JTR                   */}
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
                  placeholder={activeTab === 'JTR' ? 'Mis: TR - 12B' : 'Mis: TM - 15B'}
                  value={newRowCode}
                  onChange={(e) => setNewRowCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-slate-900 uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tipe Tiang
                </label>
                <select
                  value={newRowTiang || (activeTab === 'JTM' ? '12/200' : '9/200')}
                  onChange={(e) => setNewRowTiang(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {(activeTab === 'JTR'
                    ? (constructionRules?.jtr?.tiangList || ['9/200', '9/350'])
                    : (constructionRules?.jtm?.tiangList || ['12/200', '12/350', '12/350 (GARDU)'])
                  ).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {activeTab === 'JTM' ? 'Panjang Konduktor (meter)' : 'Panjang Kabel JTR 70 (meter)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  placeholder={activeTab === 'JTM' ? '50' : '45'}
                  value={newRowLength}
                  onChange={(e) => setNewRowLength(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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

      {/* ======================================================== */}
      {/* MODAL: Tambah Tipe Tiang Standar (JTM / JTR)              */}
      {/* ======================================================== */}
      {isAddTiangModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Tambah Tipe Tiang ({activeTab})
              </h3>
              <button onClick={() => setIsAddTiangModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTiang} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama / Spesifikasi Tiang *
                </label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'JTM' ? 'Mis: 13/350 atau 14/350' : 'Mis: 11/200 atau Tiang Besi 9m'}
                  value={newTiangName}
                  onChange={(e) => setNewTiangName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-slate-900 uppercase focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  autoFocus
                />
              </div>

              {/* Daftar Tiang Saat Ini */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-2">Daftar Tiang {activeTab} Saat Ini:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(activeTab === 'JTR'
                    ? (constructionRules?.jtr?.tiangList || ['9/200', '9/350', '9/200 (KONTRAMASK)'])
                    : (constructionRules?.jtm?.tiangList || ['12/200', '12/350', '12/350 (GARDU)'])
                  ).map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-white border border-slate-300 text-slate-700 rounded-md text-[11px] font-medium font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTiangModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                >
                  Tambah Tiang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
