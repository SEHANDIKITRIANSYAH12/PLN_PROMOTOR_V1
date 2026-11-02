import { SurveyRecord } from '@/types';
import { RabRowItem, PAKET_1_TEMPLATE_RAW, PAKET_2_TEMPLATE_RAW } from './rabMasterData';

/**
 * MATRIKS STANDAR KONSTRUKSI JTM (SUTM & GARDU)
 * Sumber: PROJECT MASTER WO KHS 2026.xlsx -> Sheet 'ISIAN PEKERJAAN' Tabel $A$393:$AO$415
 */
export const JTM_CONSTRUCTION_MATRIX: Record<string, Record<string, number>> = {
  "TM - 1B": {
    "TRAVES TUMPU": 1,
    "UNP GALVANIS": 1,
    "PIN ISOLATOR": 3,
    "TOP TIES": 3,
    "COVER BUSHING ISOLATOR": 3
  },
  "TM - 2B": {
    "TRAVES TUMPU DOUBLE": 1,
    "UNP GALVANIS": 2,
    "PIN ISOLATOR": 6,
    "DOUBLE TIES": 3,
    "COVER BUSHING ISOLATOR": 6
  },
  "TM - 3B": {},
  "TM - 4B": {
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 2,
    "PIN ISOLATOR": 1,
    "HANG ISOLATOR": 6,
    "TOP TIES": 1,
    "COVER BUSHING ISOLATOR": 1
  },
  "TM - 5B": {
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 2,
    "PIN ISOLATOR": 1,
    "HANG ISOLATOR": 6,
    "TOP TIES": 1,
    "COVER BUSHING ISOLATOR": 1
  },
  "TM - 6B": {
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 2,
    "HANG ISOLATOR": 6
  },
  "TM - 7B": {
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 2,
    "PIN ISOLATOR": 1,
    "HANG ISOLATOR": 6,
    "TOP TIES": 1,
    "COVER BUSHING ISOLATOR": 1
  },
  "TM - 8B": {
    "TRAVES TUMPU": 1,
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 3,
    "PIN ISOLATOR": 4,
    "HANG ISOLATOR": 3,
    "TOP TIES": 4,
    "COVER BUSHING ISOLATOR": 4
  },
  "TM - 9B": {
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 2,
    "PIN ISOLATOR": 1,
    "HANG ISOLATOR": 3,
    "TOP TIES": 1,
    "COVER BUSHING ISOLATOR": 1
  },
  "TM - 10B": {
    "TRAVES TUMPU": 1,
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 3,
    "PIN ISOLATOR": 5,
    "HANG ISOLATOR": 6,
    "TOP TIES": 5,
    "COVER BUSHING ISOLATOR": 5
  },
  "TM - 11B": {
    "LA": 3,
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 2,
    "HANG ISOLATOR": 3,
    "STAYSET TM": 1,
    "GROUND ROD": 1,
    "CABLE SHOE CU 50": 2
  },
  "TM - 12B": {},
  "TM - 13B": {},
  "TM - 14B": {
    "LA": 3,
    "TRAVES TUMPU": 1,
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 3,
    "HANG ISOLATOR": 3
  },
  "GARDU CANTOL DISTRIBUSI": {
    "SERANDANG CANTOL": 1,
    "LVSB CANTOL": 1,
    "NYY 1X95": 44,
    "CABLE SHOE CU 95": 8,
    "CABLE SHOE AL CU 150": 12,
    "LA": 3,
    "CUT OUT": 3,
    "FUSE LINK 4A": 3,
    "TRAVES TUMPU": 1,
    "UNP GALVANIS": 1,
    "PIN ISOLATOR": 3,
    "TOP TIES": 3,
    "GROUND ROD": 3,
    "CABLE SHOE CU 50": 6,
    "CCO 150": 9,
    "COVER BUSHING TRAFO": 3,
    "COVER BUSHING ISOLATOR": 3,
    "A3CS 150": 15,
    "TIANG 9/350 (GARDU)": 1
  },
  "GARDU CANTOL KHUSUS": {
    "SERANDANG CANTOL": 1,
    "CABLE SHOE CU 95": 8,
    "CABLE SHOE AL CU 150": 12,
    "LA": 3,
    "CUT OUT": 3,
    "FUSE LINK 4A": 3,
    "TRAVES TUMPU": 1,
    "UNP GALVANIS": 1,
    "PIN ISOLATOR": 3,
    "TOP TIES": 3,
    "GROUND ROD": 3,
    "CABLE SHOE CU 50": 6,
    "CCO 150": 9,
    "COVER BUSHING TRAFO": 3,
    "COVER BUSHING ISOLATOR": 3,
    "A3CS 150": 15,
    "TIANG 9/350 (GARDU)": 1,
    "KABEL NYFGBY 4X95 MM": 11
  },
  "GARDU PORTAL DISTRIBUSI": {
    "SERANDANG PORTAL": 1,
    "LVSB PORTAL": 1,
    "NYY 1X240": 44,
    "CABLE SHOE CU 240": 8,
    "CABLE SHOE AL CU 150": 12,
    "LA": 3,
    "CUT OUT": 3,
    "FUSE LINK 8A": 3,
    "TRAVES TUMPU": 2,
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 4,
    "PIN ISOLATOR": 6,
    "HANG ISOLATOR": 3,
    "TOP TIES": 6,
    "GROUND ROD": 3,
    "CABLE SHOE CU 50": 6,
    "CCO 150": 9,
    "COVER BUSHING TRAFO": 3,
    "COVER BUSHING ISOLATOR": 6,
    "A3CS 150": 20,
    "TIANG 9/350 (GARDU)": 2
  },
  "GARDU PORTAL KHUSUS": {
    "SERANDANG PORTAL": 1,
    "CABLE SHOE CU 95": 16,
    "CABLE SHOE AL CU 150": 12,
    "LA": 3,
    "CUT OUT": 3,
    "FUSE LINK 8A": 3,
    "TRAVES TUMPU": 2,
    "TRAVES AFSPAN": 1,
    "UNP GALVANIS": 4,
    "PIN ISOLATOR": 6,
    "HANG ISOLATOR": 3,
    "TOP TIES": 6,
    "GROUND ROD": 3,
    "CABLE SHOE CU 50": 6,
    "CCO 150": 9,
    "COVER BUSHING TRAFO": 3,
    "COVER BUSHING ISOLATOR": 6,
    "A3CS 150": 20,
    "TIANG 9/350 (GARDU)": 2,
    "KABEL NYFGBY 4X95 MM": 22
  },
  "GARDU PORTAL RMU": {
    "SERANDANG PORTAL": 1,
    "LVSB PORTAL": 1,
    "NYY 1X240": 44,
    "CABLE SHOE CU 240": 8,
    "CABLE SHOE AL CU 150": 12,
    "LA": 3,
    "CUT OUT": 3,
    "FUSE LINK 8A": 3,
    "TRAVES TUMPU": 2,
    "UNP GALVANIS": 2,
    "PIN ISOLATOR": 6,
    "TOP TIES": 6,
    "GROUND ROD": 3,
    "CABLE SHOE CU 50": 6,
    "CCO 150": 9,
    "COVER BUSHING TRAFO": 3,
    "TIANG 9/350 (GARDU)": 2,
    "N2XSY 1X35": 44,
    "TERM;20KV;TRF;AL-CU;3P;3X1X35MM2;N ISO;OD": 1,
    "TERM;20KV;CUB;CU;3P;3X1X35;N ISO;ID": 1,
    "KUBIKEL LBS MOTORIZED": 2,
    "KUBIKEL PB/TP": 1
  },
  "GARDU BETON": {
    "KUBIKEL PT": 1,
    "KUBIKEL CBOG": 1
  },
  "STAYSET": {
    "STAYSET TM": 1
  },
  "KONTRAMASK": {
    "STAYSET TM": 1,
    "TIANG 9/200 (KONTRAMASK)": 1
  },
  "CO AFTAK": {
    "CUT OUT": 3,
    "FUSE LINK 12A": 3
  }
};

/**
 * MATRIKS STANDAR KONSTRUKSI JTR (SUTR)
 * Sumber: PROJECT MASTER WO KHS 2026.xlsx -> Sheet 'ISIAN PEKERJAAN' Tabel $A$419:$L$432
 */
export const TR_CONSTRUCTION_MATRIX: Record<string, Record<string, number>> = {
  "TR - 1B": {
    "SUSPENSION 70": 1
  },
  "TR - 2B": {
    "LARGE ANGLE 70": 1
  },
  "TR - 3B": {
    "DEAD END FIXED": 1,
    "DEAD END ADJ": 1
  },
  "TR - 4B": {
    "SUSPENSION 70": 1,
    "DEAD END FIXED": 1
  },
  "TR - 5B": {
    "LARGE ANGLE 70": 1,
    "DEAD END FIXED": 1
  },
  "TR - 6B": {
    "DEAD END FIXED": 1,
    "DEAD END ADJ": 2
  },
  "TR - 7B": {
    "SUSPENSION 70": 1,
    "DEAD END FIXED": 2
  },
  "TR - 8B": {
    "LARGE ANGLE 70": 1,
    "DEAD END FIXED": 2
  },
  "TR - 9B": {
    "LARGE ANGLE 70": 2
  },
  "TR - 10B AWAL": {
    "DEAD END FIXED": 1,
    "CCO 70": 4
  },
  "TR - 10 B AKHIR": {
    "DEAD END ADJ": 1,
    "BUNDLE PROTECTION": 1,
    "GROUND ROD": 1,
    "CABLE SHOE CU 70": 1,
    "CCO 70": 1,
    "JOINT AL CU 70": 1
  },
  "TR - 11B": {
    "DEAD END FIXED": 1,
    "CABLE SHOE CU 70": 4,
    "JOINT AL CU 70": 4,
    "NYY 1 X 70": 40
  },
  "PEMBUMIAN TR": {
    "GROUND ROD": 1,
    "CABLE SHOE CU 70": 1,
    "CCO 70": 1
  },
  "STAY SET TR": {
    "STAY SET TR": 1
  }
};

/**
 * TABEL DAYA / BOX APP / KABEL NYY / TERMINASI
 * Sumber: PROJECT MASTER WO KHS 2026.xlsx -> Sheet 'ISIAN PEKERJAAN' Tabel A435:D442
 */
export const DAYA_MATRIX: Record<number, { nyy_1x70: number; cable_shoe_cu_70: number; terminasi_indoor: number }> = {
  53000: { nyy_1x70: 16, cable_shoe_cu_70: 8, terminasi_indoor: 2 },
  66000: { nyy_1x70: 16, cable_shoe_cu_70: 8, terminasi_indoor: 2 },
  82500: { nyy_1x70: 16, cable_shoe_cu_70: 8, terminasi_indoor: 2 },
  105000: { nyy_1x70: 16, cable_shoe_cu_70: 8, terminasi_indoor: 2 },
  131000: { nyy_1x70: 32, cable_shoe_cu_70: 16, terminasi_indoor: 4 },
  147000: { nyy_1x70: 32, cable_shoe_cu_70: 16, terminasi_indoor: 4 },
  164000: { nyy_1x70: 32, cable_shoe_cu_70: 16, terminasi_indoor: 4 },
  197000: { nyy_1x70: 32, cable_shoe_cu_70: 16, terminasi_indoor: 4 },
};

/**
 * Helper membersihkan string daya menjadi angka integer (VA)
 */
export function parseDayaVA(val?: string | number): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Engine Kalkulasi RAB & Volume WO Murni Sesuai Rumus Master Excel KHS 2026.
 * Mengambil volume dari input survei lapangan (ISIAN PEKERJAAN) dan menghitung
 * volume kolom RENCANA pada master WO Paket 1 dan WO Paket 2.
 */
export function calculateRabFromSurvey(
  survey: SurveyRecord | any,
  paket: 'paket1' | 'paket2' | 'PAKET_1' | 'PAKET_2',
  customPrices?: Record<string, number>
): RabRowItem[] {
  const isPaket2 = (paket || '').toString().toLowerCase().includes('2');

  // Poles array: periksa survey.poles atau (survey.jtmPoles + survey.jtrPoles)
  let poles: any[] = [];
  if (Array.isArray(survey.poles)) {
    poles = survey.poles;
  } else {
    if (Array.isArray(survey.jtmPoles)) poles.push(...survey.jtmPoles);
    if (Array.isArray(survey.jtrPoles)) poles.push(...survey.jtrPoles);
  }

  // Pisahkan Tiang JTR & JTM
  const jtrPoles = poles.filter((p) => p.networkType === 'JTR' || (p.id && p.id.startsWith('TR')) || p.trConstruction);
  const jtmPoles = poles.filter((p) => p.networkType === 'JTM' || (p.id && p.id.startsWith('TM')) || p.tmConstruction);

  // Data Pelanggan & Teknis (Mendukung baik flat maupun nested di bawah gardu / dataTeknis)
  const dayaBaruVA = parseDayaVA(survey.dayaBaru || survey.daya || survey.dayaPerUnit || survey.dataTeknis?.dayaBaru);
  const dayaLamaVA = parseDayaVA(survey.dayaLama || survey.dataTeknis?.dayaLama);
  let tipeGardu = (survey.tipePembangunanGardu || survey.tipeGardu || survey.gardu?.tipe || survey.dataTeknis?.tipeGardu || '').trim();
  let kapasitasTrafo = (survey.kapasitasTrafo || survey.gardu?.kapasitas || survey.dataTeknis?.kapasitasTrafo || '').trim();
  let jumlahKabelNaik = parseInt(survey.jumlahKabelNaik || survey.gardu?.jumlahKabelNaik || survey.dataTeknis?.jumlahKabelNaik || '0', 10);
  const jenisPekerjaanGardu = (survey.jenisPekerjaanGardu || survey.gardu?.jenisPekerjaan || survey.dataTeknis?.jenisPekerjaan || '').trim();
  const trafoLama = (survey.trafoLama || survey.gardu?.trafoLama || '').trim();
  const trafoBaru = (survey.trafoBaru || survey.gardu?.trafoBaru || '').trim();

  // Smart Fallback Detection jika tipeGardu belum terisi di root
  if (!tipeGardu && poles && poles.length > 0) {
    const garduPole = poles.find((p) => {
      const tm = (p.tmConstruction || '').toUpperCase();
      const name = (p.name || '').toUpperCase();
      const note = (p.note || '').toUpperCase();
      const std = (p.std || '').toUpperCase();
      return (
        tm.includes('GARDU') || tm.includes('PORTAL') || tm.includes('CANTOL') ||
        name.includes('GARDU') || note.includes('GARDU') || std.includes('GARDU')
      );
    });

    if (garduPole) {
      const combined = `${garduPole.tmConstruction || ''} ${garduPole.name || ''} ${garduPole.note || ''} ${garduPole.std || ''}`.toUpperCase();
      if (combined.includes('CANTOL')) {
        tipeGardu = 'Gardu Cantol Distribusi';
      } else if (combined.includes('BETON') || combined.includes('RMU')) {
        tipeGardu = 'Gardu Portal RMU / Beton';
      } else if (combined.includes('PORTAL')) {
        tipeGardu = 'Gardu Portal Distribusi';
      } else {
        tipeGardu = (dayaBaruVA >= 100000 || (survey.jumlahUnit && survey.jumlahUnit > 50))
          ? 'Gardu Portal Distribusi'
          : 'Gardu Cantol Distribusi';
      }
    } else if (dayaBaruVA >= 100000 || (survey.jumlahUnit && survey.jumlahUnit > 50)) {
      tipeGardu = 'Gardu Portal Distribusi';
    } else if (dayaBaruVA >= 33000) {
      tipeGardu = 'Gardu Cantol Distribusi';
    }
  }

  // Smart Fallback Detection kapasitasTrafo jika belum terisi
  if (!kapasitasTrafo) {
    const kvaRegex = /(\d+)\s*(?:kva|kVA|KVA)/;
    for (const p of poles) {
      const text = `${p.note || ''} ${p.name || ''} ${p.tmConstruction || ''}`;
      const match = text.match(kvaRegex);
      if (match) {
        kapasitasTrafo = `${match[1]} kVA`;
        break;
      }
    }
    if (!kapasitasTrafo) {
      const nameMatch = (survey.customerName || '').match(kvaRegex);
      if (nameMatch) {
        kapasitasTrafo = `${nameMatch[1]} kVA`;
      } else if (tipeGardu.toUpperCase().includes('CANTOL')) {
        kapasitasTrafo = dayaBaruVA <= 50000 ? '50 kVA' : '100 kVA';
      } else if (tipeGardu.toUpperCase().includes('PORTAL') || tipeGardu.toUpperCase().includes('BETON')) {
        if (dayaBaruVA <= 160000) kapasitasTrafo = '160 kVA';
        else if (dayaBaruVA <= 250000) kapasitasTrafo = '250 kVA';
        else if (dayaBaruVA <= 400000) kapasitasTrafo = '400 kVA';
        else kapasitasTrafo = '250 kVA';
      }
    }
  }

  if (!jumlahKabelNaik || jumlahKabelNaik === 0) {
    jumlahKabelNaik = tipeGardu.toUpperCase().includes('PORTAL') ? 2 : 1;
  }

  // Penentuan Pelanggan Khusus vs Umum (Baris 486)
  const isKhusus = tipeGardu.toUpperCase().includes('KHUSUS');

  // ===========================================================================
  // 1. EVALUASI JTR (PAKET 2)
  // ===========================================================================
  if (isPaket2) {
    // Akumulasi Matriks TR (Baris 341)
    let sumC341_TIC = 0; // JTR 70 konduktor
    let sumD341_Susp = 0;
    let sumE341_LargeAngle = 0;
    let sumF341_DeadEndFixed = 0;
    let sumG341_DeadEndAdj = 0;
    let sumH341_BundleProt = 0;
    let sumI341_GroundRod = 0;
    let sumJ341_CableShoe = 0;
    let sumK341_CCO = 0;
    let sumL341_JointAlCu = 0;
    let sumM341_StaysetTR = 0;
    let sumN341_NYY = 0;

    // Hitung tiang TR (Baris 489, 490)
    let countTiang9_200 = 0;
    let countTiang9_350 = 0;

    // Hitung konstruksi TR untuk Jasa Pemasangan (Baris 82-93 WO Paket 2)
    const countTRConst: Record<string, number> = {
      'TR - 1B': 0,
      'TR - 2B': 0,
      'TR - 3B': 0,
      'TR - 4B': 0,
      'TR - 5B': 0,
      'TR - 6B': 0,
      'TR - 7B': 0,
      'TR - 8B': 0,
      'TR - 9B': 0,
      'TR - 10B AWAL': 0,
      'TR - 10 B AKHIR': 0,
      'TR - 11B': 0,
    };

    jtrPoles.forEach((p) => {
      // Panjang kabel TIC
      const len = p.conductorLength ?? (p.lvTwisted ? parseFloat(p.lvTwisted) || 0 : 0);
      sumC341_TIC += len;

      // Tiang
      const pType = (p.poleType || p.std || '').toUpperCase();
      if (pType.includes('350')) {
        countTiang9_350 += 1;
      } else {
        countTiang9_200 += 1;
      }

      // Konstruksi TR
      const trKey = (p.trConstruction || 'TR - 1B').trim();
      const matchedKey = Object.keys(TR_CONSTRUCTION_MATRIX).find(
        (k) => k.replace(/\s+/g, '') === trKey.replace(/\s+/g, '')
      ) || 'TR - 1B';

      const rowM = TR_CONSTRUCTION_MATRIX[matchedKey] || {};
      sumD341_Susp += rowM['SUSPENSION 70'] || 0;
      sumE341_LargeAngle += rowM['LARGE ANGLE 70'] || 0;
      sumF341_DeadEndFixed += rowM['DEAD END FIXED'] || 0;
      sumG341_DeadEndAdj += rowM['DEAD END ADJ'] || 0;
      sumH341_BundleProt += rowM['BUNDLE PROTECTION'] || 0;
      sumI341_GroundRod += rowM['GROUND ROD'] || 0;
      sumJ341_CableShoe += rowM['CABLE SHOE CU 70'] || 0;
      sumK341_CCO += rowM['CCO 70'] || 0;
      sumL341_JointAlCu += rowM['JOINT AL CU 70'] || 0;
      sumM341_StaysetTR += rowM['STAY SET TR'] || 0;
      sumN341_NYY += rowM['NYY 1 X 70'] || 0;

      // Count untuk jasa konstruksi SUTR
      const jasaKey = Object.keys(countTRConst).find(
        (k) => k.replace(/\s+/g, '') === trKey.replace(/\s+/g, '')
      );
      if (jasaKey) {
        countTRConst[jasaKey] += 1;
      }
    });

    // Lookup Kebutuhan NYY & Sepatu Kabel dari Box APP (Baris 487 & 342)
    const dayaLookup = DAYA_MATRIX[dayaBaruVA] || (dayaBaruVA >= 53000 ? DAYA_MATRIX[53000] : null);
    const b487_nyyBoxApp = !isKhusus && dayaLookup ? dayaLookup.nyy_1x70 : 0;
    const j342_shoeBoxApp = !isKhusus && dayaLookup ? dayaLookup.cable_shoe_cu_70 : 0;
    const j343_totalShoeCu70 = sumJ341_CableShoe + j342_shoeBoxApp;

    // Evaluasi Volume per Baris WO PAKET 2
    const volMap: Record<number, number> = {};

    // Baris 25-32: BOX APP TRPDU berdasarkan Daya Baru
    volMap[25] = dayaBaruVA === 53000 ? 1 : 0;
    volMap[26] = dayaBaruVA === 66000 ? 1 : 0;
    volMap[27] = dayaBaruVA === 82500 ? 1 : 0;
    volMap[28] = dayaBaruVA === 105000 ? 1 : 0;
    volMap[29] = dayaBaruVA === 131000 ? 1 : 0;
    volMap[30] = dayaBaruVA === 147000 ? 1 : 0;
    volMap[31] = dayaBaruVA === 164000 ? 1 : 0;
    volMap[32] = dayaBaruVA === 197000 ? 1 : 0;

    // Baris 33: NYY 1x70 Opstig = B487 + N341
    volMap[33] = b487_nyyBoxApp + sumN341_NYY;

    // Baris 38: TIC 3x70 = 103% * C341 (Andongan 3%)
    volMap[38] = Math.round(sumC341_TIC * 1.03);

    // Baris 39-43: Aksesoris SUTR
    volMap[39] = sumD341_Susp;
    volMap[40] = sumE341_LargeAngle;
    volMap[41] = sumF341_DeadEndFixed;
    volMap[42] = sumG341_DeadEndAdj;
    volMap[43] = sumH341_BundleProt;
    volMap[45] = sumK341_CCO;
    volMap[46] = sumL341_JointAlCu;
    volMap[53] = sumI341_GroundRod;
    volMap[54] = sumM341_StaysetTR;
    volMap[55] = j343_totalShoeCu70;

    // Baris 60-61: Tiang TR 9/200 & 9/350
    volMap[60] = countTiang9_200;
    volMap[61] = countTiang9_350;

    // Baris 65: Pasang Box TR = SUM(I25:I32)
    volMap[65] = [25, 26, 27, 28, 29, 30, 31, 32].reduce((acc, r) => acc + (volMap[r] || 0), 0);

    // Baris 66: Bongkar Box TR = IF(B7>=53000, 1, 0)
    volMap[66] = dayaLamaVA >= 53000 ? 1 : 0;

    // Baris 69: Penarikan Kabel 4x70 = I33
    volMap[69] = volMap[33];

    // Baris 70: Terminasi Indoor = lookup terminasi + N341/40
    volMap[70] = (dayaLookup ? dayaLookup.terminasi_indoor : 0) + (sumN341_NYY > 0 ? Math.ceil(sumN341_NYY / 40) : 0);

    // Baris 75 & 77: Pembuatan Pondasi Tiang 9m = I60 & I61
    volMap[75] = volMap[60];
    volMap[77] = volMap[61];

    // Baris 81: Pasang TIC 3x70 (kms) = I38 / 1000
    volMap[81] = volMap[38] > 0 ? Number((volMap[38] / 1000).toFixed(3)) : 0;

    // Baris 82-93: Jasa Konstruksi TR-1B s/d TR-11B
    volMap[82] = countTRConst['TR - 1B'] || 0;
    volMap[83] = countTRConst['TR - 2B'] || 0;
    volMap[84] = countTRConst['TR - 3B'] || 0;
    volMap[85] = countTRConst['TR - 4B'] || 0;
    volMap[86] = countTRConst['TR - 5B'] || 0;
    volMap[87] = countTRConst['TR - 6B'] || 0;
    volMap[88] = countTRConst['TR - 7B'] || 0;
    volMap[89] = countTRConst['TR - 8B'] || 0;
    volMap[90] = countTRConst['TR - 9B'] || 0;
    volMap[91] = countTRConst['TR - 10B AWAL'] || 0;
    volMap[92] = countTRConst['TR - 10 B AKHIR'] || 0;
    volMap[93] = countTRConst['TR - 11B'] || 0;

    // Baris 94-96: Jasa Proteksi, Pembumian, Stayset
    volMap[94] = volMap[43];
    volMap[95] = volMap[53];
    volMap[96] = volMap[54];

    // Baris 117-119: Angkutan Box, As Built, Foto
    volMap[117] = (volMap[65] || 0) + (volMap[66] || 0);
    volMap[118] = sumC341_TIC > 0 ? 1 : 0;
    volMap[119] = sumC341_TIC > 0 ? 1 : 0;

    // Baris 124-128: Angkutan Kabel Twisted Bertingkat
    const ticLen = volMap[38] || 0;
    volMap[124] = ticLen >= 1 && ticLen <= 250 ? 1 : 0;
    volMap[125] = ticLen > 250 && ticLen <= 500 ? 1 : 0;
    volMap[126] = ticLen > 500 && ticLen <= 1000 ? 1 : 0;
    volMap[127] = ticLen > 1000 && ticLen <= 2000 ? 1 : 0;
    volMap[128] = ticLen > 2000 && ticLen <= 4000 ? 1 : 0;

    return buildActiveRabList(PAKET_2_TEMPLATE_RAW, volMap, customPrices);
  }

  // ===========================================================================
  // 2. EVALUASI JTM & GARDU (PAKET 1)
  // ===========================================================================
  let sumC111_AAACS = 0; // Panjang konduktor AAAC-S (meter)
  const jtmAccum: Record<string, number> = {};

  let countTiang12_200 = 0;
  let countTiang12_350 = 0;

  jtmPoles.forEach((p) => {
    const len = p.conductorLength ?? (p.a3cs ? parseFloat(p.a3cs) || 0 : 0);
    sumC111_AAACS += len;

    const pType = (p.poleType || p.std || '').toUpperCase();
    if (pType.includes('200')) {
      countTiang12_200 += 1;
    } else {
      countTiang12_350 += 1;
    }

    const tmKey = (p.tmConstruction || 'TM - 1B').trim();
    const matchedKey = Object.keys(JTM_CONSTRUCTION_MATRIX).find(
      (k) => k.replace(/\s+/g, '') === tmKey.replace(/\s+/g, '')
    ) || 'TM - 1B';

    const rowM = JTM_CONSTRUCTION_MATRIX[matchedKey] || {};
    Object.entries(rowM).forEach(([matName, q]) => {
      jtmAccum[matName] = (jtmAccum[matName] || 0) + (typeof q === 'number' ? q : parseFloat(q) || 0);
    });
  });

  const volMapP1: Record<number, number> = {};

  // Baris 27-32: Transformator Distribusi (Trafo Baru atau Trafo Mutasi Baru)
  volMapP1[27] = kapasitasTrafo.includes('50') || trafoBaru.includes('50') ? 1 : 0;
  volMapP1[28] = kapasitasTrafo.includes('100') || trafoBaru.includes('100') ? 1 : 0;
  volMapP1[29] = kapasitasTrafo.includes('160') || trafoBaru.includes('160') ? 1 : 0;
  volMapP1[30] = kapasitasTrafo.includes('200') || trafoBaru.includes('200') ? 1 : 0;
  volMapP1[31] = kapasitasTrafo.includes('250') || trafoBaru.includes('250') ? 1 : 0;
  volMapP1[32] = kapasitasTrafo.includes('400') || trafoBaru.includes('400') ? 1 : 0;

  // Baris 34 & 36: LVSB Cantol & Portal
  volMapP1[34] = jtmAccum['LVSB CANTOL'] || 0;
  volMapP1[36] = jtmAccum['LVSB PORTAL'] || 0;

  // Baris 37, 38, 40: Kabel NYY
  volMapP1[37] = jumlahKabelNaik * 40;
  volMapP1[38] = jtmAccum['NYY 1X95'] || 0;
  volMapP1[40] = jtmAccum['NYY 1X240'] || 0;
  volMapP1[41] = jtmAccum['KABEL NYFGBY 4X95 MM'] || 0;
  volMapP1[42] = jtmAccum['N2XSY 1X35'] || 0;

  // Baris 43-47: Sepatu Kabel Cu / Al-Cu
  volMapP1[43] = Math.round(volMapP1[37] / 10);
  volMapP1[44] = jtmAccum['CABLE SHOE CU 95'] || 0;
  volMapP1[46] = jtmAccum['CABLE SHOE CU 240'] || 0;
  volMapP1[47] = jtmAccum['CABLE SHOE AL CU 150'] || 0;

  // Baris 49-69: Serandang, Arrester, Cut Out, Traves, Isolator
  volMapP1[49] = jtmAccum['SERANDANG CANTOL'] || 0;
  volMapP1[50] = jtmAccum['SERANDANG PORTAL'] || 0;
  volMapP1[51] = jtmAccum['LA'] || 0;
  volMapP1[52] = jtmAccum['CUT OUT'] || 0;
  volMapP1[53] = jtmAccum['FUSE LINK 2A'] || 0;
  volMapP1[54] = jtmAccum['FUSE LINK 4A'] || 0;
  volMapP1[56] = jtmAccum['FUSE LINK 8A'] || 0;
  volMapP1[57] = jtmAccum['FUSE LINK 12A'] || 0;
  volMapP1[59] = jtmAccum['TRAVES TUMPU'] || 0;
  volMapP1[60] = jtmAccum['TRAVES TUMPU DOUBLE'] || 0;
  volMapP1[61] = jtmAccum['TRAVES AFSPAN'] || 0;
  volMapP1[62] = jtmAccum['UNP GALVANIS '] || 0;
  volMapP1[63] = jtmAccum['PIN ISOLATOR'] || 0;
  volMapP1[64] = jtmAccum['HANG ISOLATOR'] || 0;
  volMapP1[65] = jtmAccum['TOP TIES'] || 0;
  volMapP1[66] = jtmAccum['DOUBLE TIES'] || 0;
  volMapP1[67] = jtmAccum['STAYSET TM'] || 0;
  volMapP1[68] = jtmAccum['GROUND ROD'] || 0;
  volMapP1[69] = jtmAccum['CABLE SHOE CU 50'] || 0;

  // Baris 70-73: Kubikel Gardu Beton
  volMapP1[70] = jtmAccum['KUBIKEL CBOG'] || 0;
  volMapP1[71] = jtmAccum['KUBIKEL PT'] || 0;
  volMapP1[72] = jtmAccum['KUBIKEL LBS MOTORIZED'] || 0;
  volMapP1[73] = jtmAccum['KUBIKEL PB/TP'] || 0;

  // Baris 94: Konduktor AAAC-S 150 (Andongan 10%)
  volMapP1[94] = Math.round(sumC111_AAACS * 1.1);

  // Baris 103-104 & 115: Terminasi 20kV & CCO 150
  volMapP1[103] = jtmAccum[' TERM;20KV;CUB;CU;3P;3X1X35;N ISO;ID'] || 0;
  volMapP1[104] = jtmAccum[' TERM;20KV;TRF;AL-CU;3P;3X1X35MM2;N ISO;OD'] || 0;
  volMapP1[115] = jtmAccum['CCO 150'] || 0;

  // Baris 126-127: Cover Bushing
  volMapP1[126] = jtmAccum['COVER BUSHING TRAFO'] || 0;
  volMapP1[127] = jtmAccum['COVER BUSHING ISOLATOR'] || 0;
  volMapP1[129] = tipeGardu.length > 0 ? (volMapP1[68] || 1) : 0;

  // Baris 132-135: Tiang JTM (9/200 Kontramask, 12/200, 12/350, 12/350 Gardu)
  volMapP1[132] = jtmAccum['TIANG 9/200 (KONTRAMASK)'] || 0;
  volMapP1[133] = countTiang12_200;
  volMapP1[134] = countTiang12_350;
  volMapP1[135] = jtmAccum['TIANG 9/350 (GARDU)'] || 0;

  // Baris 175: Pondasi Tiang 12m = I133 + I134
  volMapP1[175] = (volMapP1[133] || 0) + (volMapP1[134] || 0);

  // Baris 184-188: Pemasangan Traves & Isolator
  volMapP1[184] = volMapP1[59] || 0;
  volMapP1[185] = (volMapP1[60] || 0) + (volMapP1[61] || 0);
  volMapP1[187] = volMapP1[63] || 0;
  volMapP1[188] = volMapP1[64] || 0;

  // Baris 191: Penarikan Kawat AAAC-S (gawang)
  volMapP1[191] = sumC111_AAACS > 0 ? Math.ceil(sumC111_AAACS / 40) : 0;
  volMapP1[193] = volMapP1[67] || 0;
  volMapP1[196] = volMapP1[65] || 0;
  volMapP1[197] = volMapP1[66] || 0;

  // ===========================================================================
  // PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI (CANTOL, PORTAL, BETON)
  // ===========================================================================
  const isCantol = tipeGardu.toUpperCase().includes('CANTOL');
  if (isCantol) {
    volMapP1[221] = 1; // GARDU CANTOL
    volMapP1[223] = 4; // PEKERJAAN PERSIAPAN, Stripping, tebal 20 cm
    volMapP1[224] = 1.2; // PEKERJAAN PERSIAPAN - Galian tanah keras
    volMapP1[226] = 1.875; // PEKERJAAN PASANGAN : Pasangan Pondasi batu kali
    volMapP1[228] = 0.1; // PEKERJAAN BETON DAN PONDASI : Beton bertulang
    volMapP1[230] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : - Pasang Rangka Dudukan Gardu Cantol
    volMapP1[231] = 1; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan Tanda Kilat 20 Kv
    volMapP1[232] = 1; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan Tanda Kilat 20 Kv
    volMapP1[233] = 2; // PEKERJAAN LAIN - LAIN : Pembuatan Tanda Gardu/nomer Gardu
    volMapP1[236] = 1; // PEMASANGAN ARRESTER DAN PENGADAAN DUDUKAN
    volMapP1[237] = 1; // PEMASANGAN CUT OUT DAN PENGADAAN DUDUKAN
    volMapP1[238] = kapasitasTrafo.includes('25') ? 1 : 0;
    volMapP1[239] = kapasitasTrafo.includes('50') ? 1 : 0;
    volMapP1[240] = kapasitasTrafo.includes('100') ? 1 : 0;
    volMapP1[241] = volMapP1[68] || 1; // Pemasangan penanaman earthing rod
    volMapP1[242] = volMapP1[68] || 1; // PEMASANGAN PIPA ARDE (1,5 Inc per 6 mtr)
    volMapP1[243] = 9.79; // INSTALASI LISTRIK & LAIN-LAIN : Upah pasang kawat BC 50 mm2
    volMapP1[244] = 9.79; // PEKERJAAN PEMIPAAN : Arde BC 50 mm2
    volMapP1[245] = jumlahKabelNaik; // Pasang kabel naik TR & pipa pelindung kabel
    volMapP1[246] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : - Pemasangan Hardware dan perlengkapannya
    volMapP1[248] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Trafo 25/ 50/ 100 /160/ 250 kVA
    volMapP1[249] = !isKhusus ? 1 : 0; // JASA ANGKUTAN MATERIAL : Angkutan Rak TR dan perlengkapannya
    volMapP1[250] = 1; // JASA ANGKUTAN MATERIAL : Angk Travers,Isolator,dudukan fuse,arrester
    volMapP1[251] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Kabel NYFGBY 4x95
    volMapP1[252] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Foto Dokumentasi @ 15 lembar
    volMapP1[253] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Gambar As Built Drawing
  }

  // Baris 117-119: Aksesoris Link, Stainless Steel Strap, Stopping Buckle (Gardu Cantol)
  if (isCantol) {
    volMapP1[117] = 5;
    volMapP1[118] = 5;
    volMapP1[119] = 5;
  }

  // Baris 75-84: CT 20kV di Gardu Beton / RMU berdasarkan Daya Baru / Daya Lama
  const isBeton = jenisPekerjaanGardu.includes('Pemasangan') || tipeGardu.toUpperCase().includes('BETON') || tipeGardu.toUpperCase().includes('RMU');
  const ctDaya = dayaBaruVA || dayaLamaVA;
  if (isBeton || jenisPekerjaanGardu.includes('CT') || jenisPekerjaanGardu.includes('Pemasangan')) {
    volMapP1[75] = ctDaya === 240000 ? 3 : 0;
    volMapP1[76] = ctDaya === 345000 ? 3 : 0;
    volMapP1[77] = (ctDaya === 555000 || ctDaya === 690000) ? 3 : 0;
    volMapP1[78] = ctDaya === 865000 ? 3 : 0;
    volMapP1[79] = (ctDaya === 1110000 || ctDaya === 1385000) ? 3 : 0;
    volMapP1[80] = ctDaya === 1730000 ? 3 : 0;
    volMapP1[81] = ctDaya === 2180000 ? 3 : 0;
    volMapP1[82] = ctDaya === 2770000 ? 3 : 0;
    volMapP1[83] = (ctDaya === 3465000 || ctDaya === 4360000) ? 3 : 0;
    volMapP1[84] = ctDaya === 8660000 ? 3 : 0;
  }

  const isPortal = tipeGardu.toUpperCase().includes('PORTAL') && !tipeGardu.toUpperCase().includes('RMU');
  if (isPortal) {
    volMapP1[255] = 1; // GARDU PORTAL
    volMapP1[257] = 12; // PEKERJAAN PERSIAPAN, Stripping, tebal 20 cm
    volMapP1[258] = 14; // PEKERJAAN PERSIAPAN, Pasang Bouwplank
    volMapP1[260] = 6; // PEKERJAAN GALIAN DAN URUGAN - Galian tanah keras
    volMapP1[262] = 3.7854; // PEKERJAAN PASANGAN : Pasangan Pondasi batu kali
    volMapP1[263] = 1.2519; // PEKERJAAN BETON DAN PONDASI : Beton bertulang
    volMapP1[264] = 2.55; // PEKERJAAN PASANGAN : Pasangan batu bata, tebal 1 bata
    volMapP1[265] = 2.6115; // PEKERJAAN PLESTERAN : Plesteran 1PC : 2PS ( 15 mm )
    volMapP1[266] = 2.6115; // PEKERJAAN PLESTERAN : Acian beton
    volMapP1[268] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : - Pasang Rangka Dudukan Gardu Portal
    volMapP1[269] = 2; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan Tanda Kilat 20 Kv
    volMapP1[270] = 2; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan Tanda Kilat 20 Kv
    volMapP1[271] = 2; // PEKERJAAN LAIN - LAIN : Pembuatan Tanda Gardu/nomer Gardu
    volMapP1[274] = 1; // PEMASANGAN ARRESTER DAN PENGADAAN DUDUKAN
    volMapP1[275] = 1; // PEMASANGAN CUT OUT DAN PENGADAAN DUDUKAN
    volMapP1[276] = kapasitasTrafo.includes('50') ? 1 : 0;
    volMapP1[277] = kapasitasTrafo.includes('100') ? 1 : 0;
    volMapP1[278] = kapasitasTrafo.includes('160') ? 1 : 0;
    volMapP1[279] = kapasitasTrafo.includes('200') ? 1 : 0;
    volMapP1[280] = kapasitasTrafo.includes('250') ? 1 : 0;
    volMapP1[281] = kapasitasTrafo.includes('400') ? 1 : 0;
    volMapP1[282] = volMapP1[68] || 2; // Pemasangan penanaman earthing rod
    volMapP1[283] = volMapP1[68] || 2; // PEMASANGAN PIPA ARDE (1,5 Inc per 6 mtr)
    volMapP1[284] = 9.79; // INSTALASI LISTRIK & LAIN-LAIN : Upah pasang kawat BC 50 mm2
    volMapP1[285] = 9.79; // PEKERJAAN PEMIPAAN : Arde BC 50 mm2
    volMapP1[286] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : - Pemasangan Hardware dan perlengkapannya
    volMapP1[287] = jumlahKabelNaik; // Pasang kabel naik TR & pipa pelindung
    volMapP1[289] = kapasitasTrafo.includes('400') ? 0 : 1; // JASA ANGKUTAN MATERIAL : Angkutan Trafo 25/ 50/ 100/ 160/ 250 kVA
    volMapP1[290] = kapasitasTrafo.includes('400') ? 1 : 0; // JASA ANGKUTAN MATERIAL : Angkutan Trafo 400 kVA
    volMapP1[291] = !isKhusus ? 1 : 0; // JASA ANGKUTAN MATERIAL : Angkutan Rak TR dan perlengkapannya
    volMapP1[292] = 1; // JASA ANGKUTAN MATERIAL : Angk Travers,Isolator,dudukan fuse,arrester
    volMapP1[293] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Kabel NYFGBY 4x95
    volMapP1[294] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Foto Dokumentasi @ 15 lembar
    volMapP1[295] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Gambar As Built Drawing
  }

  if (isBeton) {
    volMapP1[297] = 1; // GARDU PORTAL RMU / GARDU BETON
    volMapP1[299] = 3.3; // PEKERJAAN PERSIAPAN : Stripping, tebal 20 cm
    volMapP1[300] = 3.3; // PEKERJAAN PERSIAPAN : Babat Rumput/Alang-alang
    volMapP1[301] = 5.48; // PEKERJAAN PERSIAPAN : Pasang Bouwplank
    volMapP1[302] = 11; // PEKERJAAN PERSIAPAN : Pasang Pagar Pengaman Proyek
    volMapP1[303] = 3.3; // PEKERJAAN PERSIAPAN : Pembuangan tanah bekas galian
    volMapP1[305] = 8.75; // PEKERJAAN GALIAN DAN URUGAN - Galian tanah biasa
    volMapP1[306] = 0.33; // PEKERJAAN GALIAN DAN URUGAN - Urugan pasir urug
    volMapP1[308] = 0.33; // PEKERJAAN PASANGAN : Lantai kerja 1 : 2 : 3
    volMapP1[309] = 0.79; // PEKERJAAN PASANGAN : Pasangan batu kosong
    volMapP1[310] = 1.97; // PEKERJAAN PASANGAN : Pasangan Pondasi batu kali
    volMapP1[311] = 8.68; // PEKERJAAN PASANGAN : Pasangan batu bata
    volMapP1[313] = 3.47; // PEKERJAAN PLESTERAN : Plesteran 1PC : 2PS
    volMapP1[314] = 17.36; // PEKERJAAN PLESTERAN : Plesteran 1PC : 4PS
    volMapP1[315] = 20.83; // PEKERJAAN PLESTERAN : Acian beton
    volMapP1[317] = 0.46; // PEKERJAAN BETON DAN PONDASI : Beton bertulang
    volMapP1[318] = 0.49; // PEKERJAAN BETON DAN PONDASI : Beton bertulang
    volMapP1[320] = 2; // PEKERJAAN BETON DAN PONDASI : Beton bertulang plat
    volMapP1[322] = 20.83; // PEKERJAAN PENGECATAN : Pengecatan tembok - 3 lapis
    volMapP1[323] = 20.83; // PEKERJAAN PENGECATAN : Pengecatan tembok lama
    volMapP1[324] = 3.3; // PEKERJAAN PENGECATAN : Waterproofing
    volMapP1[326] = 2; // INSTALASI LISTRIK & LAIN-LAIN : Lampu penerangan
    volMapP1[327] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Pembuatan Tanda Gardu
    volMapP1[328] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Foto Dokumentasi
    volMapP1[329] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Tanda LBS Masuk
    volMapP1[330] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Tanda LBS Keluar
    volMapP1[331] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Tanda SMK3
    volMapP1[333] = 4.46; // PEMBUATAN MAINHOLE : 1 m3 BETON BERTULANG
    volMapP1[335] = 3; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Kubikel LBS
    volMapP1[336] = 1; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Kubikel RMU
    volMapP1[337] = 1; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Bracket
    volMapP1[339] = 3.4; // Pengadaan & Pemasangan Pintu & Ventilasi Besi Plat
    volMapP1[340] = 3.4; // PEKERJAAN BESI & PIPA : Cat besi
    volMapP1[342] = 3.25; // Arde BC 50 mm2
    volMapP1[343] = 3.25; // Upah pasang kawat BC 50 mm2
    volMapP1[344] = 1; // PEMASANGAN PIPA ARDE (1,5 Inc per 6 mtr)
    volMapP1[345] = 1; // Pemasangan penanaman earthing rod
    volMapP1[347] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : - Pasang Rangka
    volMapP1[348] = 2; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Tanda Kilat
    volMapP1[349] = 2; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Tanda Kilat
    volMapP1[350] = 1; // PEKERJAAN LAIN - LAIN : Pembuatan Tanda Gardu
    volMapP1[352] = 1; // PEMASANGAN ARRESTER DAN PENGADAAN DUDUKAN
    volMapP1[353] = 1; // PEMASANGAN CUT OUT DAN PENGADAAN DUDUKAN

    // Baris 354-359: Pasang Trafo Gardu Beton
    volMapP1[354] = kapasitasTrafo.includes('50') ? 1 : 0;
    volMapP1[355] = kapasitasTrafo.includes('100') ? 1 : 0;
    volMapP1[356] = kapasitasTrafo.includes('160') ? 1 : 0;
    volMapP1[357] = kapasitasTrafo.includes('200') ? 1 : 0;
    volMapP1[358] = kapasitasTrafo.includes('250') ? 1 : 0;
    volMapP1[359] = kapasitasTrafo.includes('400') ? 1 : 0;

    volMapP1[362] = 9.79; // Upah pasang kawat BC 50 mm2
    volMapP1[363] = 9.79; // Arde BC 50 mm2
    volMapP1[364] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : Pasang Hardware
    volMapP1[365] = jumlahKabelNaik; // Pasang kabel naik TR & pipa pelindung
    volMapP1[367] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Pickup
    volMapP1[368] = 1; // JASA ANGKUTAN MATERIAL : Angkutan kubikel
    volMapP1[369] = (volMapP1[354] || 0) + (volMapP1[355] || 0) + (volMapP1[356] || 0) + (volMapP1[357] || 0) + (volMapP1[358] || 0); // Angkutan Trafo 50-250 kVA
    volMapP1[370] = volMapP1[359] || 0; // Angkutan Trafo 400 kVA
    volMapP1[371] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Rak TR
    volMapP1[372] = 1; // JASA ANGKUTAN MATERIAL : Angk Travers, Isolator
    volMapP1[373] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Kabel NYFGBY
    volMapP1[374] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Foto Dokumentasi
    volMapP1[375] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Gambar As Built
    volMapP1[402] = 3; // Pemasangan CT/PT 20 KV
    volMapP1[406] = 1; // PEKERJAAN PEMELIHARAAN INSTALASI GARDU : Pembersihan Ruangan
    volMapP1[408] = 2; // Lampu penerangan
    volMapP1[413] = 1; // Pengadaan & pemasangan nomor gardu
    volMapP1[414] = 1; // Tanda K3 gardu (5 S)
    volMapP1[426] = 3; // Pembongkaran CT/PT 20 KV di Cubikel
    volMapP1[449] = 1; // Angkutan Pickup
  }

  // Kubikel & Aksesoris Instalasi Gardu (Portal RMU & Gardu Beton)
  const isPortalRMU = tipeGardu.toUpperCase().includes('RMU');
  const totalKubikel = (volMapP1[70] || 0) + (volMapP1[71] || 0) + (volMapP1[72] || 0) + (volMapP1[73] || 0);
  if (isBeton || isPortalRMU || totalKubikel > 0) {
    volMapP1[379] = (volMapP1[71] || 0) + (volMapP1[72] || 0) + (volMapP1[73] || 0); // Kubikel LBS/PT/PB
    volMapP1[380] = volMapP1[70] || 0; // Kubikel CBOM
    volMapP1[399] = volMapP1[72] || 0; // Penyangga Kabel TM 20 kV
    volMapP1[400] = totalKubikel; // Pemasangan Heater Kubikel
    volMapP1[401] = totalKubikel * 5; // Plat Bordes Penutup Saluran Kabel
    volMapP1[409] = totalKubikel > 0 ? 1 : 0; // Tanda LBS Masuk
    volMapP1[410] = totalKubikel > 0 ? 1 : 0; // Tanda LBS Keluar
    volMapP1[411] = totalKubikel > 0 ? 1 : 0; // Tanda Awas Jangan Dimasukkan
    volMapP1[412] = totalKubikel > 0 ? 1 : 0; // Tanda Aman Tidak Ada Tegangan
    volMapP1[452] = totalKubikel > 0 ? Math.ceil(totalKubikel / 3) : 0; // Angkutan Kubikel (1 rit per 3 bh)
  }

  // Baris 382-389: Pemasangan Trafo Baru di Gardu Tiang (Mutasi / Pasang Baru)
  volMapP1[382] = trafoBaru.includes('25') ? 1 : 0;
  volMapP1[383] = trafoBaru.includes('50') ? 1 : 0;
  volMapP1[384] = trafoBaru.includes('100') ? 1 : 0;
  volMapP1[385] = trafoBaru.includes('160') ? 1 : 0;
  volMapP1[386] = trafoBaru.includes('200') ? 1 : 0;
  volMapP1[387] = trafoBaru.includes('250') ? 1 : 0;
  volMapP1[389] = trafoBaru.includes('400') ? 1 : 0;

  // Baris 397: Pasang Single Core TR di Trafo
  const totalPasangTrafo = (volMapP1[382] || 0) + (volMapP1[383] || 0) + (volMapP1[384] || 0) + (volMapP1[385] || 0) + (volMapP1[386] || 0) + (volMapP1[387] || 0) + (volMapP1[389] || 0);
  volMapP1[397] = totalPasangTrafo > 0 ? 1 : 0;

  // Baris 430-432: Pembongkaran Trafo Lama
  volMapP1[430] = trafoLama.includes('25') || trafoLama.includes('50') ? 1 : 0;
  volMapP1[431] =
    trafoLama.includes('100') ||
    trafoLama.includes('160') ||
    trafoLama.includes('200') ||
    trafoLama.includes('250') ||
    trafoLama.includes('315')
      ? 1
      : 0;
  volMapP1[432] = trafoLama.includes('400') || trafoLama.includes('630') ? 1 : 0;

  // Baris 441: Pembongkaran Instalasi Gardu Single Core TR di Trafo
  const totalBongkarTrafo = (volMapP1[430] || 0) + (volMapP1[431] || 0) + (volMapP1[432] || 0);
  volMapP1[441] = totalBongkarTrafo > 0 ? 1 : 0;

  // Baris 450: Angkutan Trafo Mutasi 25 - 315 kVA
  volMapP1[450] =
    (volMapP1[382] || 0) +
    (volMapP1[383] || 0) +
    (volMapP1[384] || 0) +
    (volMapP1[385] || 0) +
    (volMapP1[386] || 0) +
    (volMapP1[387] || 0) +
    (volMapP1[430] || 0) +
    (volMapP1[431] || 0);

  // Baris 451: Angkutan Trafo 400 / 630 kVA
  volMapP1[451] = (volMapP1[389] || 0) + (volMapP1[432] || 0);

  // Baris 466-467: Foto Dokumentasi & Gambar As Built Drawing Pembongkaran
  const hasTrafoLama = trafoLama && trafoLama !== '' && !trafoLama.includes('Tidak');
  volMapP1[466] = hasTrafoLama ? 1 : 0;
  volMapP1[467] = hasTrafoLama ? 1 : 0;

  // Baris 457: Angkutan Kawat AAAC-S
  volMapP1[457] = volMapP1[94] > 0 ? Math.ceil(volMapP1[94] / 250) : 0;

  return buildActiveRabList(PAKET_1_TEMPLATE_RAW, volMapP1, customPrices);
}

/**
 * Helper menentukan kedalaman (depth level) suatu header RAB untuk menjaga hierarki:
 * Level 0: I / II (Kelompok Material / Jasa)
 * Level 1: A, B, C, D (Bagian Pekerjaan Utama, misal B. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN GARDU DISTRIBUSI)
 * Level 2: I, II, III (Sub-Paket Gardu: GARDU CANTOL, GARDU PORTAL, GARDU PORTAL RMU)
 * Level 3: a, b, c, d, ... (Sub-Pekerjaan: Persiapan, Pasangan, Beton, Rangka, Instalasi, Angkutan)
 */
function getHeaderDepth(item: Omit<RabRowItem, 'rencanaVol' | 'rencanaTotal' | 'realisasiVol' | 'realisasiTotal'>): number {
  if (!item.isHeader) return 999;
  const no = (item.no || '').trim();
  const desc = (item.desc || '').toUpperCase();

  if ((no === 'I' || no === 'II') && desc.includes('KELOMPOK')) return 0;
  if (['A', 'B', 'C', 'D', 'E', 'F'].includes(no)) return 1;
  if (['I', 'II', 'III', 'IV'].includes(no) || desc.includes('GARDU CANTOL') || desc.includes('GARDU PORTAL') || desc.includes('GARDU BETON')) return 2;
  if (no.length === 1 && no >= 'a' && no <= 'z') return 3;
  return 2;
}

/**
 * Filter dan strukturkan item template menjadi daftar RAB murni.
 * Mempertahankan seluruh hierarki heading (Kategori, Bagian B Gardu, Sub-Paket Gardu Cantol/Portal, Sub-Pekerjaan)
 * jika terdapat item aktif di dalamnya.
 */
function buildActiveRabList(
  template: Array<Omit<RabRowItem, 'rencanaVol' | 'rencanaTotal' | 'realisasiVol' | 'realisasiTotal'>>,
  volMap: Record<number, number>,
  customPrices?: Record<string, number>
): RabRowItem[] {
  // 1. Hitung seluruh item
  const evaluated = template.map((raw) => {
    const rowNum = parseInt(raw.rowNumber, 10);
    const vol = volMap[rowNum] || 0;

    const effectiveHarga =
      customPrices && customPrices[raw.id] !== undefined
        ? customPrices[raw.id]
        : raw.hargaSatuan || 0;

    const total = Math.round(vol * effectiveHarga);

    return {
      ...raw,
      hargaSatuan: effectiveHarga,
      rencanaVol: vol,
      rencanaTotal: total,
      realisasiVol: 0,
      realisasiTotal: 0,
      isSurveyItem: vol > 0,
    } as RabRowItem;
  });

  // 2. Kumpulkan index header yang memiliki setidaknya 1 item aktif di bawahnya (sebelum header setara/lebih tinggi berikutnya)
  const activeHeaderIndices = new Set<number>();
  evaluated.forEach((item, idx) => {
    if (item.isHeader) {
      const myDepth = getHeaderDepth(item);
      let hasActiveChild = false;
      for (let j = idx + 1; j < evaluated.length; j++) {
        const next = evaluated[j];
        if (next.isHeader) {
          const nextDepth = getHeaderDepth(next);
          if (nextDepth <= myDepth) {
            break;
          }
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

  // 3. Filter item aktif dan tambahkan penanda paket pembangunan gardu
  return evaluated
    .filter((it, idx) => {
      if (it.isHeader) {
        return activeHeaderIndices.has(idx);
      }
      return it.rencanaVol > 0 || it.realisasiVol > 0;
    })
    .map((it) => {
      const rowNum = parseInt(it.rowNumber, 10);
      let keterangan = it.keterangan || '';
      
      if (!it.isHeader) {
        if (rowNum >= 221 && rowNum <= 253) {
          keterangan = 'Paket Gardu Cantol';
        } else if (rowNum >= 255 && rowNum <= 295) {
          keterangan = 'Paket Gardu Portal';
        } else if (rowNum >= 297 && rowNum <= 375) {
          keterangan = 'Paket Gardu Portal RMU / Beton';
        }
      }

      return {
        ...it,
        keterangan: keterangan || it.keterangan,
      };
    });
}
