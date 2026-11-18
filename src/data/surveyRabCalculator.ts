import { PoleData, SurveyRecord } from '@/types';
import { RabRowItem, PAKET_1_TEMPLATE_RAW, PAKET_2_TEMPLATE_RAW } from './rabMasterData';

/** Sumber judul pekerjaan: SurveyRecord atau Work Order (cukup field yang sama namanya). */
export type WorkTitleSource = Partial<Omit<SurveyRecord, 'status'>>;

/** Data gardu / teknis bersarang dari format survey lama. */
type LegacyGardu = Partial<Record<'tipe' | 'kapasitas' | 'jumlahKabelNaik' | 'jenisPekerjaan' | 'trafoLama' | 'trafoBaru', string>>;
type LegacyDataTeknis = Partial<Record<'dayaBaru' | 'dayaLama' | 'tipeGardu' | 'kapasitasTrafo' | 'jumlahKabelNaik' | 'jenisPekerjaan', string>>;

/** Input kalkulator RAB: SurveyRecord, atau format lama (tiang terpisah jtmPoles/jtrPoles,
 *  data gardu sebagai objek, dan dataTeknis bersarang). */
export type RabSurveyInput = Partial<Omit<SurveyRecord, 'gardu' | 'poles'>> & {
  poles?: PoleData[];
  jtmPoles?: PoleData[];
  jtrPoles?: PoleData[];
  gardu?: string | LegacyGardu;
  dataTeknis?: LegacyDataTeknis;
};

/**
 * Generator Judul / Nama Pekerjaan Otomatis Standar PLN KHS 2026
 * Sumber: PROJECT MASTER WO KHS 2026.xlsx -> Sheet 'ISIAN PEKERJAAN' Baris 378 s/d 388 & Baris 478
 * Contoh Hasil:
 *  P1: "Pembangunan Jaringan SUTM Dan Pemasangan Instalasi Gardu (PKN240) Untuk PB POKTAN TANI BERKAH"
 *  P1: "Mutasi Trafo Distribusi 100 kVA ke 160 kVA (PKN240) Untuk PD BUDI"
 *  P2: "Pembangunan SKUTR Dan Pemasangan Dan Pembongkaran Box APP Untuk PD BUDI"
 */
export function generateWorkTitlePln(
  survey: WorkTitleSource | null | undefined,
  paket: 'paket1' | 'paket2' | 'tiang' | string = 'paket1'
): string {
  if (!survey) return '-';

  // 1. Ekstrak Nama Pelanggan Bersih
  const rawCust = survey.customerName || survey.namaDasar || '';
  let cleanCust = rawCust;
  const cutWords = [
    '(Pasang Baru', '(Perubahan Daya', '(PB', '(PD',
    'Pasang Baru', 'Perubahan Daya',
  ];
  for (const w of cutWords) {
    if (cleanCust.includes(w)) {
      cleanCust = cleanCust.split(w)[0].trim();
    }
  }
  cleanCust = cleanCust.replace(/^[-\s]+|[-\s]+$/g, '').trim();

  // 2. Jenis Transaksi (B479): PD bila ada Daya Lama, selain itu PB
  const jobType = (survey.jobType || '').toUpperCase();
  const dayaLamaVA = parseDayaVA(survey.dayaLama);
  const dayaBaruVA = parseDayaVA(survey.dayaBaru || survey.daya || survey.dayaPerUnit);
  const isPD = jobType.includes('PERUBAHAN') || dayaLamaVA > 0;
  const untuk = `Untuk ${isPD ? 'PD' : 'PB'} ${cleanCust}`;

  const poles = Array.isArray(survey.poles) ? survey.poles : [];
  const perluasan = resolvePerluasan(survey.perluasanJTM, survey.perluasanJTR, poles);
  const finish = (title: string) => title.replace(/\s+/g, ' ').trim();

  // WO Tiang mengikuti jaringan tiangnya: tiang baru JTM → judul Paket 1, selain itu judul Paket 2.
  const normalizedPaket = String(paket).toLowerCase();
  let target: 'paket1' | 'paket2' = normalizedPaket === 'paket1' || normalizedPaket.includes('p1') ? 'paket1' : 'paket2';
  if (normalizedPaket.includes('tiang') || normalizedPaket === 'tb') {
    const hasJtmNewPole = poles.some((p) => isJtmPole(p) && (isNewPole(p) || hasAutoMatrixPole(p)));
    const hasJtrNewPole = poles.some((p) => isJtrPole(p) && isNewPole(p));
    const jtmTiang = hasJtmNewPole ? true : hasJtrNewPole ? false : isFilled(perluasan.jtm);
    target = jtmTiang ? 'paket1' : 'paket2';
  }

  if (target === 'paket1') {
    // B378 - B388 & B478 (Paket 1: Jaringan JTM, Gardu, Mutasi Trafo)
    const jtmRaw = perluasan.jtm.toUpperCase();
    const jtmType = jtmRaw.includes('SKUTM') ? 'SKUTM (MVTIC)' : jtmRaw.includes('SKTM') ? 'SKTM' : 'SUTM';
    const jaringanSeg = perluasan.jtm ? `Jaringan ${jtmType}` : '';

    const jenisPekerjaan = cleanField(survey.jenisPekerjaanGardu);
    let garduWord = mapTipeGarduTitle(survey.tipePembangunanGardu || survey.tipeGardu);
    // "Pemasangan Instalasi Gardu" + "Gardu Portal Distribusi" → "Pemasangan Instalasi Gardu Portal Distribusi"
    if (/gardu$/i.test(jenisPekerjaan) && /^gardu\s/i.test(garduWord)) garduWord = garduWord.replace(/^gardu\s+/i, '');
    const garduSeg = [jenisPekerjaan, garduWord, formatKva(survey.kapasitasTrafo)].filter(Boolean).join(' ');

    // B385-B387: Mutasi Trafo Distribusi aktif jika Trafo Lama (B31) terisi
    const trafoLama = formatKva(survey.trafoLama);
    const trafoBaru = formatKva(survey.trafoBaru);
    const mutasiSeg = trafoLama
      ? `Mutasi Trafo Distribusi ${trafoLama}${trafoBaru ? ` ke ${trafoBaru}` : ''}`
      : '';

    const body = [jaringanSeg, garduSeg, mutasiSeg].filter(Boolean).join(' Dan ');
    const pembangunan = jaringanSeg || (garduWord && !jenisPekerjaan) ? 'Pembangunan ' : '';
    const garduName = cleanField(survey.gardu);
    const garduStr = garduName ? `(${garduName})` : '';

    return finish(`${body ? `${pembangunan}${body}` : ''} ${garduStr} ${untuk}`);
  }

  // C378 - C388 & C478 (Paket 2: Jaringan JTR & Box APP)
  const jtrRaw = perluasan.jtr.toUpperCase();
  const jtrType = jtrRaw.includes('SKUTR') ? 'SKUTR' : jtrRaw.includes('SUTR') ? 'SUTR' : jtrRaw.includes('SKTR') ? 'SKTR' : 'SKUTR';
  const jtrSeg = perluasan.jtr ? `Pembangunan ${jtrType}` : '';

  const pasangBox = dayaBaruVA >= 53000;
  const bongkarBox = dayaLamaVA >= 53000;
  const boxSeg = pasangBox || bongkarBox
    ? `${[pasangBox && 'Pemasangan', bongkarBox && 'Pembongkaran'].filter(Boolean).join(' Dan ')} Box APP`
    : '';

  const body = [jtrSeg, boxSeg].filter(Boolean).join(' Dan ');
  return finish(`${body} ${untuk}`);
}

/** Nilai isian kosong / placeholder ("-", "0") dianggap tidak diisi. */
const cleanField = (v?: string | null) => {
  const t = (v || '').trim();
  return t === '-' || t === '0' ? '' : t;
};

/** "100" / "100 kVA" / "100kva" → "100 kVA". */
const formatKva = (v?: string | null) => {
  const t = cleanField(v);
  const n = parseInt(t.match(/\d+/)?.[0] || '', 10);
  return n > 0 ? `${n} kVA` : '';
};

/** B383: Tipe Pembangunan Gardu → frasa judul. Gardu Beton tidak ditulis (diwakili Jenis Pekerjaan). */
const mapTipeGarduTitle = (v?: string | null) => {
  const t = cleanField(v);
  const u = t.toUpperCase();
  if (!t || u.includes('BETON')) return '';
  if (u === 'GARDU CANTOL KHUSUS') return 'Gardu Cantol Khusus Distribusi';
  if (u === 'GARDU PORTAL KHUSUS') return 'Gardu Portal (Khusus) Distribusi';
  return t;
};

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
 * Helper membersihkan string daya menjadi angka integer (VA).
 * Mendukung input VA ("53000", "53.000 VA") maupun kVA ("53 kVA", "82,5 kVA", "1.110 kVA").
 */
export function parseDayaVA(val?: string | number): number {
  if (!val) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? Math.round(val) : 0;
  const raw = String(val).trim();
  if (!raw) return 0;

  if (/kva/i.test(raw)) {
    const numMatch = raw.match(/[\d.,]+/);
    if (!numMatch) return 0;
    let numStr = numMatch[0];
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(numStr)) {
      numStr = numStr.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(numStr)) {
      numStr = numStr.replace(/,/g, '');
    } else {
      numStr = numStr.replace(',', '.');
    }
    const n = parseFloat(numStr);
    return Number.isFinite(n) ? Math.round(n * 1000) : 0;
  }

  const cleaned = raw.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Engine Kalkulasi RAB & Volume WO Murni Sesuai Rumus Master Excel KHS 2026.
 * Mengambil volume dari input survei lapangan (ISIAN PEKERJAAN) dan menghitung
 * volume kolom RENCANA pada master WO Paket 1 dan WO Paket 2.
 */
export function calculateRabFromSurvey(
  survey: RabSurveyInput,
  paket: 'paket1' | 'paket2' | 'PAKET_1' | 'PAKET_2',
  customPrices?: Record<string, number>
): RabRowItem[] {
  const isPaket2 = (paket || '').toString().toLowerCase().includes('2');

  // Poles array: periksa survey.poles atau (survey.jtmPoles + survey.jtrPoles)
  let poles: PoleData[] = [];
  if (Array.isArray(survey.poles)) {
    poles = survey.poles;
  } else {
    if (Array.isArray(survey.jtmPoles)) poles.push(...survey.jtmPoles);
    if (Array.isArray(survey.jtrPoles)) poles.push(...survey.jtrPoles);
  }
  const garduObj = typeof survey.gardu === 'object' ? survey.gardu : undefined;

  // Pisahkan Tiang JTR & JTM
  const jtrPoles = poles.filter(isJtrPole);
  const jtmPoles = poles.filter(isJtmPole);

  // Data Pelanggan & Teknis (Mendukung baik flat maupun nested di bawah gardu / dataTeknis)
  const dayaBaruVA = parseDayaVA(survey.dayaBaru || survey.daya || survey.dayaPerUnit || survey.dataTeknis?.dayaBaru);
  const dayaLamaVA = parseDayaVA(survey.dayaLama || survey.dataTeknis?.dayaLama);
  // These fields correspond to independent workbook inputs; blank is not a default design.
  const tipeGardu = cleanField(survey.tipePembangunanGardu || survey.tipeGardu || garduObj?.tipe || survey.dataTeknis?.tipeGardu);
  const kapasitasTrafo = formatKva(survey.kapasitasTrafo || garduObj?.kapasitas || survey.dataTeknis?.kapasitasTrafo);
  const jumlahKabelNaik = Math.max(0, parseInt(survey.jumlahKabelNaik || garduObj?.jumlahKabelNaik || survey.dataTeknis?.jumlahKabelNaik || '0', 10) || 0);
  const jumlahKubikelLBS = Math.max(0, parseInt(survey.jumlahKubikelLBS || '0', 10) || 0);
  const jenisPekerjaanGardu = cleanField(survey.jenisPekerjaanGardu || garduObj?.jenisPekerjaan || survey.dataTeknis?.jenisPekerjaan);
  const trafoLama = formatKva(survey.trafoLama || garduObj?.trafoLama);
  const trafoBaru = formatKva(survey.trafoBaru || garduObj?.trafoBaru);

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

      // Tiang (jika 'Tanpa Tiang' atau 'Terusan TM', jangan hitung penambahan tiang baru)
      const pType = (p.poleType || p.std || '').toUpperCase();
      if (isNewPole(p)) {
        if (pType.includes('350')) {
          countTiang9_350 += 1;
        } else {
          countTiang9_200 += 1;
        }
      }

      // Konstruksi TR
      const trKey = (p.trConstruction || '').trim().toUpperCase();
      const matchedKey = Object.keys(TR_CONSTRUCTION_MATRIX).find(
        (k) => k.replace(/\s+/g, '') === trKey.replace(/\s+/g, '')
      ) || '';

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
    const dayaLookup = DAYA_MATRIX[dayaBaruVA];
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
    volMap[38] = Number((sumC341_TIC * 1.03).toFixed(8));

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
    volMap[70] = (dayaLookup?.terminasi_indoor || 0) + sumN341_NYY / 40;

    // Baris 75 & 77: Pembuatan Pondasi Tiang 9m = I60 & I61
    volMap[75] = volMap[60];
    volMap[77] = volMap[61];

    // Baris 81: Pasang TIC 3x70 (kms) = I38 / 1000
    volMap[81] = Number((volMap[38] / 1000).toFixed(11));

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
    const hasPaket2Work = getSurveyPackages(survey).paket2;
    volMap[118] = hasPaket2Work ? 1 : 0;
    volMap[119] = hasPaket2Work ? 1 : 0;

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
  let sumConductorSpanMeters = 0; // SUM(C40:C108) panjang gawang 1 fasa (meter)
  let countGawangA3CS = 0; // C113 = COUNTA(C40:C108) jumlah gawang berkonduktor (>0)
  const jtmAccum: Record<string, number> = {};

  let countTiang12_200 = 0; // B492 = COUNTIF(A39:A108, "12/200")
  let countTiang12_350 = 0; // B493 = COUNTIF(A40:A109, "12/350")

  jtmPoles.forEach((p) => {
    const len = p.conductorLength ?? (p.a3cs ? parseFloat(p.a3cs) || 0 : 0);
    if (len > 0) {
      sumConductorSpanMeters += len;
      countGawangA3CS += 1;
    }

    const tmKey = (p.tmConstruction || '').trim().toUpperCase();
    const matchedKey = Object.keys(JTM_CONSTRUCTION_MATRIX).find(
      (k) => k.replace(/\s+/g, '') === tmKey.replace(/\s+/g, '')
    ) || '';

    const rowM = JTM_CONSTRUCTION_MATRIX[matchedKey] || {};
    Object.entries(rowM).forEach(([matName, q]) => {
      // TIANG 9/200 (KONTRAMASK) & TIANG 9/350 (GARDU) selalu dihitung dari matriks konstruksi
      // (ISIAN PEKERJAAN!AH111 -> B491 -> R132 dan AI111 -> B494 -> R135), meski kolom Tiang kosong/"Tanpa Tiang".
      jtmAccum[matName] = (jtmAccum[matName] || 0) + q;
    });
    // ISIAN PEKERJAAN!AK412 is a formula (=B28), not a fixed matrix quantity.
    if (matchedKey === 'GARDU BETON') {
      jtmAccum['KUBIKEL LBS MOTORIZED'] = (jtmAccum['KUBIKEL LBS MOTORIZED'] || 0) + jumlahKubikelLBS;
    }

    // Hitung Tiang 12/200 & 12/350 murni dari kolom Tiang (hindari dobel hitung dengan Tiang Gardu/Kontramask)
    const pType = (p.poleType || p.std || '').toUpperCase();
    const autoMatrixCount = countAutoMatrixPoles(p);
    if (isNewPole(p)) {
      if (pType.includes('GARDU')) {
        if (autoMatrixCount === 0) {
          jtmAccum['TIANG 9/350 (GARDU)'] = (jtmAccum['TIANG 9/350 (GARDU)'] || 0) + 1;
        }
      } else if (pType.includes('KONTRAMASK')) {
        if (autoMatrixCount === 0) {
          jtmAccum['TIANG 9/200 (KONTRAMASK)'] = (jtmAccum['TIANG 9/200 (KONTRAMASK)'] || 0) + 1;
        }
      } else if (pType.includes('200')) {
        countTiang12_200 += 1;
      } else {
        countTiang12_350 += 1;
      }
    }
  });

  const volMapP1: Record<number, number> = {};

  // Baris 27-32: Transformator Distribusi (Trafo Baru atau Trafo Mutasi Baru)
  volMapP1[27] = kapasitasTrafo === '50 kVA' || trafoBaru === '50 kVA' ? 1 : 0;
  volMapP1[28] = kapasitasTrafo === '100 kVA' || trafoBaru === '100 kVA' ? 1 : 0;
  volMapP1[29] = kapasitasTrafo === '160 kVA' || trafoBaru === '160 kVA' ? 1 : 0;
  volMapP1[30] = kapasitasTrafo === '200 kVA' || trafoBaru === '200 kVA' ? 1 : 0;
  volMapP1[31] = kapasitasTrafo === '250 kVA' || trafoBaru === '250 kVA' ? 1 : 0;
  volMapP1[32] = kapasitasTrafo === '400 kVA' || trafoBaru === '400 kVA' ? 1 : 0;

  // Baris 34 & 36: LVSB Cantol & Portal
  volMapP1[34] = jtmAccum['LVSB CANTOL'] || 0;
  volMapP1[36] = jtmAccum['LVSB PORTAL'] || 0;

  // Baris 37, 38, 40-42: Kabel NYY, NYFGBY, N2XSY
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

  // ISIAN PEKERJAAN!O110..R110: Tambahan 3 bh Fuse Link untuk Mutasi Trafo Baru (B32)
  const mutasiFuse2A = trafoBaru === '25 kVA' || trafoBaru === '50 kVA' ? 3 : 0;
  const mutasiFuse4A = trafoBaru === '100 kVA' ? 3 : 0;
  const mutasiFuse8A = trafoBaru === '160 kVA' || trafoBaru === '200 kVA' || trafoBaru === '250 kVA' ? 3 : 0;
  const mutasiFuse12A = trafoBaru === '400 kVA' ? 3 : 0;

  // Baris 49-69: Serandang, Arrester, Cut Out, Fuse Link, Traves, Isolator
  volMapP1[49] = jtmAccum['SERANDANG CANTOL'] || 0;
  volMapP1[50] = jtmAccum['SERANDANG PORTAL'] || 0;
  volMapP1[51] = jtmAccum['LA'] || 0;
  volMapP1[52] = jtmAccum['CUT OUT'] || 0;
  volMapP1[53] = (jtmAccum['FUSE LINK 2A'] || 0) + mutasiFuse2A;
  volMapP1[54] = (jtmAccum['FUSE LINK 4A'] || 0) + mutasiFuse4A;
  volMapP1[56] = (jtmAccum['FUSE LINK 8A'] || 0) + mutasiFuse8A;
  volMapP1[57] = (jtmAccum['FUSE LINK 12A'] || 0) + mutasiFuse12A;
  volMapP1[59] = jtmAccum['TRAVES TUMPU'] || 0;
  volMapP1[60] = jtmAccum['TRAVES TUMPU DOUBLE'] || 0;
  volMapP1[61] = jtmAccum['TRAVES AFSPAN'] || 0;
  volMapP1[62] = jtmAccum['UNP GALVANIS'] || 0;
  volMapP1[63] = jtmAccum['PIN ISOLATOR'] || 0;
  volMapP1[64] = jtmAccum['HANG ISOLATOR'] || 0;
  volMapP1[65] = jtmAccum['TOP TIES'] || 0;
  volMapP1[66] = jtmAccum['DOUBLE TIES'] || 0;
  volMapP1[67] = jtmAccum['STAYSET TM'] || 0;
  volMapP1[68] = jtmAccum['GROUND ROD'] || 0;
  volMapP1[69] = jtmAccum['CABLE SHOE CU 50'] || 0;

  // Baris 70-73: Kubikel Gardu Beton & Portal RMU
  volMapP1[70] = jtmAccum['KUBIKEL CBOG'] || 0;
  volMapP1[71] = jtmAccum['KUBIKEL PT'] || 0;
  volMapP1[72] = jtmAccum['KUBIKEL LBS MOTORIZED'] || 0;
  volMapP1[73] = jtmAccum['KUBIKEL PB/TP'] || 0;

  const isCantol = tipeGardu.toUpperCase().includes('CANTOL');
  const isPortalRMU = tipeGardu.toUpperCase().includes('RMU');
  const isBeton = tipeGardu.toUpperCase().includes('BETON');
  const isPortal = tipeGardu.toUpperCase().includes('PORTAL') && !isPortalRMU;
  const isPemasanganInstalasiGardu = jenisPekerjaanGardu.toUpperCase().includes('PEMASANGAN INSTALASI GARDU');

  // Baris 75-84: CT 20kV Gardu Beton (ISIAN PEKERJAAN!B497 & Tabel A501:E513)
  if (isPemasanganInstalasiGardu) {
    volMapP1[75] = dayaBaruVA === 240000 || dayaBaruVA === 345000 ? 3 : 0;
    volMapP1[76] = dayaBaruVA === 555000 || dayaBaruVA === 690000 ? 3 : 0;
    volMapP1[77] = dayaBaruVA === 865000 ? 3 : 0;
    volMapP1[78] = dayaBaruVA === 1110000 || dayaBaruVA === 1385000 ? 3 : 0;
    volMapP1[79] = dayaBaruVA === 1730000 ? 3 : 0;
    volMapP1[80] = dayaBaruVA === 2180000 ? 3 : 0;
    volMapP1[81] = dayaBaruVA === 2770000 ? 3 : 0;
    volMapP1[82] = dayaBaruVA === 3465000 ? 3 : 0;
    volMapP1[83] = dayaBaruVA === 4360000 ? 3 : 0;
    volMapP1[84] = dayaBaruVA === 8660000 ? 3 : 0;
  }

  // Baris 85-89: Material Proteksi Gardu Beton (WO PAKET 1!I85:I89 = IF(B21="Gardu Beton ", ...))
  if (isBeton) {
    volMapP1[85] = 1; // RELAY;OCR+GFR;DIGITAL;;110VDC;5A
    volMapP1[86] = 1; // TVS;Input 100 VAC;Output 125 VDC; 5 Watt
    volMapP1[87] = 3; // CT;20KV;K RING; 800/5A;0.2S;30VA;ID
    volMapP1[88] = 3; // GFD
    volMapP1[89] = 1; // UNIV ACC;KUNCI HS/LS
  }

  // Baris 94: Konduktor AAAC-S 150
  // ISIAN PEKERJAAN!C109 = SUM(C40:C108)*3, C110 = AG111 (A3CS Gardu), C111 = C109+C110, WO1!I94 = C111 * 110%
  const c111_aaacs = sumConductorSpanMeters * 3 + (jtmAccum['A3CS 150'] || 0);
  volMapP1[94] = Number((c111_aaacs * 1.1).toFixed(4));

  // Baris 103-104 & 115: Terminasi 20kV & CCO 150
  volMapP1[103] = jtmAccum['TERM;20KV;CUB;CU;3P;3X1X35;N ISO;ID'] || 0;
  volMapP1[104] = jtmAccum['TERM;20KV;TRF;AL-CU;3P;3X1X35MM2;N ISO;OD'] || 0;
  volMapP1[115] = jtmAccum['CCO 150'] || 0;

  // Baris 117-119: Aksesoris Link, Stainless Steel Strap, Stopping Buckle (=IF(B21>0, 5, 0))
  if (tipeGardu.length > 0) {
    volMapP1[117] = 5;
    volMapP1[118] = 5;
    volMapP1[119] = 5;
  }

  // Baris 126-127 & 129: Cover Bushing & Pipa Arde (=IF(B21>0, I68, ""))
  volMapP1[126] = jtmAccum['COVER BUSHING TRAFO'] || 0;
  volMapP1[127] = jtmAccum['COVER BUSHING ISOLATOR'] || 0;
  volMapP1[129] = tipeGardu.length > 0 ? (volMapP1[68] || 0) : 0;

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

  // Baris 191: Penarikan Kawat AAAC-S (gawang) = ISIAN PEKERJAAN!C115 (= COUNTA(C40:C108))
  volMapP1[191] = countGawangA3CS;
  volMapP1[193] = volMapP1[67] || 0;
  volMapP1[196] = volMapP1[65] || 0;
  volMapP1[197] = volMapP1[66] || 0;

  // ===========================================================================
  // PEKERJAAN PEMBANGUNAN GARDU DISTRIBUSI (CANTOL, PORTAL, PORTAL RMU)
  // ===========================================================================
  if (isCantol) {
    volMapP1[221] = 1; // GARDU CANTOL
    volMapP1[223] = 4; // PEKERJAAN PERSIAPAN, Stripping, tebal 20 cm
    volMapP1[224] = 1.2; // PEKERJAAN PERSIAPAN - Galian tanah keras
    volMapP1[226] = 1.875; // PEKERJAAN PASANGAN : Pasangan Pondasi batu kali
    volMapP1[228] = 0.1; // PEKERJAAN BETON DAN PONDASI : Beton bertulang
    volMapP1[230] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : - Pasang Rangka Dudukan Gardu Cantol
    volMapP1[231] = 1; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan penghalang panjat
    volMapP1[232] = 1; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan Tanda Kilat 20 kV
    volMapP1[233] = 2; // PEKERJAAN LAIN - LAIN : Pembuatan Tanda Gardu/nomer Gardu
    volMapP1[236] = 1; // PEMASANGAN ARRESTER DAN PENGADAAN DUDUKAN
    volMapP1[237] = 1; // PEMASANGAN CUT OUT DAN PENGADAAN DUDUKAN
    volMapP1[238] = kapasitasTrafo === '25 kVA' ? 1 : 0;
    volMapP1[239] = kapasitasTrafo === '50 kVA' ? 1 : 0;
    volMapP1[240] = kapasitasTrafo === '100 kVA' ? 1 : 0;
    volMapP1[241] = volMapP1[68] || 0; // I241 = I68 (Pemasangan penanaman earthing rod)
    volMapP1[242] = volMapP1[68] || 0; // I242 = I68 (PEMASANGAN PIPA ARDE)
    volMapP1[243] = 9.79; // INSTALASI LISTRIK & LAIN-LAIN : Upah pasang kawat BC 50 mm2
    volMapP1[244] = 9.79; // PEKERJAAN PEMIPAAN : Arde BC 50 mm2
    volMapP1[245] = jumlahKabelNaik; // Pasang kabel naik TR & pipa pelindung kabel
    volMapP1[246] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : - Pemasangan Hardware dan perlengkapannya
    volMapP1[248] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Trafo 25/ 50/ 100 /160/ 250 / 315 kVA
    volMapP1[249] = !isKhusus ? 1 : 0; // JASA ANGKUTAN MATERIAL : Angkutan Rak TR dan perlengkapannya
    volMapP1[250] = 1; // JASA ANGKUTAN MATERIAL : Angk Travers,Isolator,dudukan fuse,arrester
    volMapP1[251] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Kabel NYFGBY 4x95
    volMapP1[252] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Foto Dokumentasi @ 15 lembar
    volMapP1[253] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Gambar As Built Drawing
  }

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
    volMapP1[269] = 2; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan penghalang panjat
    volMapP1[270] = 2; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Pengadaan & Pemasangan Tanda Kilat 20 Kv
    volMapP1[271] = 2; // PEKERJAAN LAIN - LAIN : Pembuatan Tanda Gardu/nomer Gardu
    volMapP1[274] = 1; // PEMASANGAN ARRESTER DAN PENGADAAN DUDUKAN
    volMapP1[275] = 1; // PEMASANGAN CUT OUT DAN PENGADAAN DUDUKAN
    volMapP1[276] = kapasitasTrafo === '50 kVA' ? 1 : 0;
    volMapP1[277] = kapasitasTrafo === '100 kVA' ? 1 : 0;
    volMapP1[278] = kapasitasTrafo === '160 kVA' ? 1 : 0;
    volMapP1[279] = kapasitasTrafo === '200 kVA' ? 1 : 0;
    volMapP1[280] = kapasitasTrafo === '250 kVA' ? 1 : 0;
    volMapP1[281] = kapasitasTrafo === '400 kVA' ? 1 : 0;
    volMapP1[282] = volMapP1[68] || 0; // I282 = I68 (Pemasangan penanaman earthing rod)
    volMapP1[283] = volMapP1[68] || 0; // I283 = I68 (PEMASANGAN PIPA ARDE)
    volMapP1[284] = 9.79; // INSTALASI LISTRIK & LAIN-LAIN : Upah pasang kawat BC 50 mm2
    volMapP1[285] = 9.79; // PEKERJAAN PEMIPAAN : Arde BC 50 mm2
    volMapP1[286] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : - Pemasangan Hardware dan perlengkapannya
    volMapP1[287] = jumlahKabelNaik; // Pasang kabel naik TR & pipa pelindung
    volMapP1[289] = (volMapP1[276] || 0) + (volMapP1[277] || 0) + (volMapP1[278] || 0) + (volMapP1[279] || 0) + (volMapP1[280] || 0); // I289 = I276..I280
    volMapP1[290] = volMapP1[281] || 0; // I290 = I281 (Angkutan Trafo 400 kVA)
    volMapP1[291] = !isKhusus ? 1 : 0; // JASA ANGKUTAN MATERIAL : Angkutan Rak TR dan perlengkapannya
    volMapP1[292] = 1; // JASA ANGKUTAN MATERIAL : Angk Travers,Isolator,dudukan fuse,arrester
    volMapP1[293] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Kabel NYFGBY 4x95
    volMapP1[294] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Foto Dokumentasi @ 15 lembar
    volMapP1[295] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Gambar As Built Drawing
  }

  // Paket Gardu Portal RMU (Baris 297-375): HANYA aktif untuk Gardu Portal RMU (BUKAN Gardu Beton)
  if (isPortalRMU) {
    volMapP1[297] = 1; // GARDU PORTAL RMU
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
    volMapP1[348] = 2; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Penghalang panjat
    volMapP1[349] = 2; // PEKERJAAN PEMASANGAN INSTALASI GARDU : Tanda Kilat
    volMapP1[350] = 1; // PEKERJAAN LAIN - LAIN : Pembuatan Tanda Gardu
    volMapP1[352] = 1; // PEMASANGAN ARRESTER DAN PENGADAAN DUDUKAN
    volMapP1[353] = 1; // PEMASANGAN CUT OUT DAN PENGADAAN DUDUKAN

    // Baris 354-359: Pasang Trafo Gardu Portal RMU
    volMapP1[354] = kapasitasTrafo === '50 kVA' ? 1 : 0;
    volMapP1[355] = kapasitasTrafo === '100 kVA' ? 1 : 0;
    volMapP1[356] = kapasitasTrafo === '160 kVA' ? 1 : 0;
    volMapP1[357] = kapasitasTrafo === '200 kVA' ? 1 : 0;
    volMapP1[358] = kapasitasTrafo === '250 kVA' ? 1 : 0;
    volMapP1[359] = kapasitasTrafo === '400 kVA' ? 1 : 0;

    volMapP1[360] = volMapP1[68] || 0; // I360 = I68 (Pemasangan penanaman earthing rod)
    volMapP1[361] = volMapP1[68] || 0; // I361 = I68 (PEMASANGAN PIPA ARDE)
    volMapP1[362] = 9.79; // Upah pasang kawat BC 50 mm2
    volMapP1[363] = 9.79; // Arde BC 50 mm2
    volMapP1[364] = 1; // PEMBANGUNAN GARDU CANTOL & PORTAL : Pasang Hardware
    volMapP1[365] = jumlahKabelNaik; // Pasang kabel naik TR & pipa pelindung
    volMapP1[367] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Pickup
    volMapP1[368] = 1; // JASA ANGKUTAN MATERIAL : Angkutan kubikel
    volMapP1[369] = (volMapP1[354] || 0) + (volMapP1[355] || 0) + (volMapP1[356] || 0) + (volMapP1[357] || 0) + (volMapP1[358] || 0); // Angkutan Trafo 50-250 kVA
    volMapP1[370] = volMapP1[359] || 0; // Angkutan Trafo 400 kVA
    volMapP1[371] = !isKhusus ? 1 : 0; // I371 = IF(B486="KHUSUS", 0, 1)
    volMapP1[372] = 1; // JASA ANGKUTAN MATERIAL : Angk Travers, Isolator
    volMapP1[373] = 1; // JASA ANGKUTAN MATERIAL : Angkutan Kabel NYFGBY
    volMapP1[374] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Foto Dokumentasi
    volMapP1[375] = 1; // INSTALASI LISTRIK & LAIN-LAIN : Gambar As Built
  }

  // ===========================================================================
  // BAGIAN A: PEKERJAAN PEMASANGAN/PEMBONGKARAN INSTALASI GARDU (R379-R446)
  // ===========================================================================
  const totalKubikel = (volMapP1[70] || 0) + (volMapP1[71] || 0) + (volMapP1[72] || 0) + (volMapP1[73] || 0);
  volMapP1[379] = (volMapP1[71] || 0) + (volMapP1[72] || 0) + (volMapP1[73] || 0); // Kubikel LBS / PT / B1 / PB
  volMapP1[380] = volMapP1[70] || 0; // Kubikel PGDB / PGDT / CBOM
  volMapP1[399] = volMapP1[72] || 0; // Pengadaan Penyangga Kabel TM 20 kV
  volMapP1[400] = totalKubikel; // Pemasangan Instalasi Heater Kubikel
  volMapP1[401] = totalKubikel * 5; // Pengadaan Kabel Heater Kubikel

  // R402 = SUM(I75:I84) + I87 (Pemasangan CT/PT 20 KV di Cubikel)
  const totalCtMaterial = [75, 76, 77, 78, 79, 80, 81, 82, 83, 84].reduce((acc, r) => acc + (volMapP1[r] || 0), 0);
  volMapP1[402] = totalCtMaterial + (volMapP1[87] || 0);

  // R406, R408, R413, R414: aktif saat B27 = "Pemasangan Instalasi Gardu"
  volMapP1[406] = isPemasanganInstalasiGardu ? 1 : 0; // Pembersihan Ruangan Gardu
  volMapP1[408] = isPemasanganInstalasiGardu ? 2 : 0; // Lampu penerangan komplit untuk Gardu
  volMapP1[409] = totalKubikel; // Tanda LBS Masuk (=I70+I71+I72+I73)
  volMapP1[410] = totalKubikel; // Tanda LBS Keluar
  volMapP1[411] = totalKubikel; // Tanda Awas Jangan Dimasukkan
  volMapP1[412] = totalKubikel; // Tanda Aman Tidak Ada Tegangan
  volMapP1[413] = isPemasanganInstalasiGardu ? 1 : 0; // Pengadaan & pemasangan nomor gardu
  volMapP1[414] = isPemasanganInstalasiGardu ? 1 : 0; // Tanda K3 gardu (5 S)

  // R426: Pembongkaran CT/PT 20 KV di Cubikel (=IF(B27>0, 3, 0))
  volMapP1[426] = jenisPekerjaanGardu.length > 0 ? 3 : 0;

  // Baris 382-389: Pemasangan Trafo Baru di Gardu Tiang (Mutasi Trafo B32)
  volMapP1[382] = trafoBaru === '25 kVA' ? 1 : 0;
  volMapP1[383] = trafoBaru === '50 kVA' ? 1 : 0;
  volMapP1[384] = trafoBaru === '100 kVA' ? 1 : 0;
  volMapP1[385] = trafoBaru === '160 kVA' ? 1 : 0;
  volMapP1[386] = trafoBaru === '200 kVA' ? 1 : 0;
  volMapP1[387] = trafoBaru === '250 kVA' ? 1 : 0;
  volMapP1[388] = trafoBaru === '315 kVA' ? 1 : 0;
  volMapP1[389] = trafoBaru === '400 kVA' ? 1 : 0;

  // Baris 397: Pasang Single Core TR di Trafo (=SUM(I382:I389))
  volMapP1[397] = [382, 383, 384, 385, 386, 387, 388, 389].reduce((acc, r) => acc + (volMapP1[r] || 0), 0);

  // Baris 430-432: Pembongkaran Trafo Lama (B31)
  volMapP1[430] = trafoLama === '25 kVA' || trafoLama === '50 kVA' ? 1 : 0;
  volMapP1[431] =
    trafoLama === '100 kVA' ||
    trafoLama === '160 kVA' ||
    trafoLama === '200 kVA' ||
    trafoLama === '250 kVA' ||
    trafoLama === '315 kVA'
      ? 1
      : 0;
  volMapP1[432] = trafoLama === '400 kVA' || trafoLama === '630 kVA' ? 1 : 0;

  // Baris 441: Pembongkaran Instalasi Gardu Single Core TR di Trafo (=I430+I431+I432)
  volMapP1[441] = (volMapP1[430] || 0) + (volMapP1[431] || 0) + (volMapP1[432] || 0);

  // ===========================================================================
  // BAGIAN C: PEKERJAAN ANGKUTAN DAN LAIN - LAIN (R449-R467)
  // ===========================================================================
  // Baris 449: Angkutan Pickup (=IF(I426>0, 1, 0))
  volMapP1[449] = (volMapP1[426] || 0) > 0 ? 1 : 0;

  // Baris 450: Angkutan Trafo Mutasi 25 - 315 kVA (I382..I388 + I430 + I431; I432 hanya di R451 agar tidak dobel)
  volMapP1[450] =
    (volMapP1[382] || 0) +
    (volMapP1[383] || 0) +
    (volMapP1[384] || 0) +
    (volMapP1[385] || 0) +
    (volMapP1[386] || 0) +
    (volMapP1[387] || 0) +
    (volMapP1[388] || 0) +
    (volMapP1[430] || 0) +
    (volMapP1[431] || 0);

  // Baris 451: Angkutan Trafo 400 / 630 kVA (=I389+I432)
  volMapP1[451] = (volMapP1[389] || 0) + (volMapP1[432] || 0);

  // Baris 452: Angkutan Kubikel (=ROUNDUP(totalKubikel / 3, 0))
  volMapP1[452] = totalKubikel > 0 ? Math.ceil(totalKubikel / 3) : 0;

  // Baris 457: Angkutan Kawat AAAC-S (=ROUND(I94 / 250, 0))
  volMapP1[457] = volMapP1[94] > 0 ? Math.round(volMapP1[94] / 250) : 0;

  // Baris 466-467: Foto Dokumentasi & Gambar As Built Drawing Pembongkaran (=IF(B31>0, 1, 0))
  const hasTrafoLama = trafoLama.length > 0;
  volMapP1[466] = hasTrafoLama ? 1 : 0;
  volMapP1[467] = hasTrafoLama ? 1 : 0;

  return buildActiveRabList(PAKET_1_TEMPLATE_RAW, volMapP1, customPrices);
}

/**
 * Helper menentukan kedalaman (depth level) suatu header RAB untuk menjaga hierarki:
 * Level 0: I / II (Kelompok Material / Jasa)
 * Level 1: A, B, C, D (Bagian Pekerjaan Utama, misal B. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN GARDU DISTRIBUSI)
 * Level 2: I, II, III (Sub-Paket Gardu: GARDU CANTOL, GARDU PORTAL, GARDU PORTAL RMU)
 * Level 3: a, b, c, d, ... (Sub-Pekerjaan: Persiapan, Pasangan, Beton, Rangka, Instalasi, Angkutan)
 */
export function getHeaderDepth(item: Omit<RabRowItem, 'rencanaVol' | 'rencanaTotal' | 'realisasiVol' | 'realisasiTotal'>): number {
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
          keterangan = 'Paket Gardu Portal RMU';
        }
      }

      return {
        ...it,
        keterangan: keterangan || it.keterangan,
      };
    });
}

/** Dokumen output RAB hasil survey. */
export type SurveyDocType = 'paket1' | 'paket2' | 'tiang';

/** Paket pekerjaan yang terbentuk dari isian survey. */
export type SurveyPackages = Record<SurveyDocType, boolean>;

const isFilled = (v?: string | null) => {
  const t = (v || '').trim().toLowerCase();
  return t !== '' && t !== '-' && t !== '0' && t !== '0 m';
};

/** Tiang baru yang diinput di JTM / JTR (bukan "Tanpa Tiang", eksisting, atau terusan). */
export const isNewPole = (p: PoleData) =>
  p.poleStatus !== 'EXISTING' &&
  /\d/.test(p.poleType || p.std || '') &&
  !/TANPA|EKSISTING|EXISTING|TERUSAN|UNDERBUILT|NONE/i.test(p.poleType || p.std || '');

/** Jumlah tiang otomatis yang dihasilkan oleh matriks konstruksi JTM (Gardu 12/350 atau Kontramask 9/200). */
export const countAutoMatrixPoles = (p: PoleData): number => {
  const tmKey = (p.tmConstruction || '').trim().toUpperCase();
  if (!tmKey) return 0;
  const matchedKey = Object.keys(JTM_CONSTRUCTION_MATRIX).find(
    (k) => k.replace(/\s+/g, '') === tmKey.replace(/\s+/g, '')
  );
  if (!matchedKey) return 0;
  const rowM = JTM_CONSTRUCTION_MATRIX[matchedKey] || {};
  return (rowM['TIANG 9/200 (KONTRAMASK)'] || 0) + (rowM['TIANG 9/350 (GARDU)'] || 0);
};

/** True jika baris konstruksi otomatis memunculkan Tiang Gardu (R135) atau Tiang Kontramask (R132). */
export const hasAutoMatrixPole = (p: PoleData): boolean => countAutoMatrixPoles(p) > 0;

/** Total kebutuhan tiang baru (gabungan tiang jalur + tiang otomatis dari konstruksi Gardu/Kontramask, tanpa dobel hitung). */
export const countSurveyNewPoles = (poles: PoleData[]): number =>
  poles.reduce((total, p) => {
    const autoCount = countAutoMatrixPoles(p);
    if (isJtmPole(p)) {
      const pType = (p.poleType || p.std || '').toUpperCase();
      const isLineNew = isNewPole(p) && !pType.includes('GARDU') && !pType.includes('KONTRAMASK');
      const isFallbackSpecial = isNewPole(p) && (pType.includes('GARDU') || pType.includes('KONTRAMASK')) && autoCount === 0;
      return total + autoCount + (isLineNew || isFallbackSpecial ? 1 : 0);
    }
    return total + (isNewPole(p) ? 1 : 0);
  }, 0);

const isJtmPole = (p: PoleData) => p.networkType
  ? p.networkType === 'JTM' || p.networkType === 'SUTM'
  : (p.id || '').startsWith('TM') || (!(p.id || '').startsWith('TR') && Boolean(p.tmConstruction));
const isJtrPole = (p: PoleData) => p.networkType
  ? p.networkType === 'JTR' || p.networkType === 'SUTR'
  : !isJtmPole(p) && ((p.id || '').startsWith('TR') || Boolean(p.trConstruction));

/**
 * Perluasan JTM / JTR efektif: mengikuti isian eksplisit user (ISIAN PEKERJAAN!B20 & B24).
 * Tidak memaksa 'SUTM'/'SKUTR' hanya karena ada baris konstruksi (mis. Gardu / Stayset / Pembumian TR).
 */
export function resolvePerluasan(perluasanJTM: string | undefined, perluasanJTR: string | undefined, _poles?: PoleData[]) {
  return {
    jtm: isFilled(perluasanJTM) ? perluasanJTM!.trim() : '',
    jtr: isFilled(perluasanJTR) ? perluasanJTR!.trim() : '',
  };
}

/**
 * Aturan paket output survey:
 *  a. Paket 1 → Perluasan JTM, baris konstruksi JTM, Tipe Pembangunan Gardu, Mutasi Trafo, atau Gardu Beton diisi.
 *  b. Paket 2 → Daya baru / Daya lama ≥ 53.000 VA (Box APP), Perluasan JTR, atau baris konstruksi JTR diisi.
 *  c. WO Tiang → ada tiang baru yang diinput di JTM/JTR atau konstruksi Gardu/Kontramask yang membutuhkan tiang.
 */
export function getSurveyPackages(survey: RabSurveyInput | null | undefined): SurveyPackages {
  if (!survey) return { paket1: false, paket2: false, tiang: false };
  const garduObj = typeof survey.gardu === 'object' ? survey.gardu : undefined;
  const poles = Array.isArray(survey.poles)
    ? survey.poles
    : [...(survey.jtmPoles || []), ...(survey.jtrPoles || [])];
  const perluasan = resolvePerluasan(survey.perluasanJTM, survey.perluasanJTR, poles);

  const paket1 =
    isFilled(perluasan.jtm) ||
    poles.some(isJtmPole) ||
    isFilled(survey.tipePembangunanGardu || survey.tipeGardu || garduObj?.tipe || survey.dataTeknis?.tipeGardu) ||
    isFilled(survey.trafoLama || garduObj?.trafoLama) ||
    isFilled(survey.trafoBaru || garduObj?.trafoBaru) ||
    isFilled(survey.jenisPekerjaanGardu || garduObj?.jenisPekerjaan || survey.dataTeknis?.jenisPekerjaan);
  const dayaBaruVA = parseDayaVA(survey.dayaBaru || survey.daya || survey.dataTeknis?.dayaBaru);
  const dayaLamaVA = parseDayaVA(survey.dayaLama || survey.dataTeknis?.dayaLama);
  const paket2 = dayaBaruVA >= 53000 || dayaLamaVA >= 53000 || isFilled(perluasan.jtr) || poles.some(isJtrPole);
  const tiang = poles.some((p) => isNewPole(p) || hasAutoMatrixPole(p));

  return { paket1, paket2, tiang };
}

/** Urutan dokumen output yang tersedia untuk sebuah survey. */
export const listSurveyDocs = (packages: SurveyPackages): SurveyDocType[] =>
  (['paket1', 'paket2', 'tiang'] as const).filter((doc) => packages[doc]);

/** Baris pekerjaan tiang murni (material tiang beton & jasa pondasi/penanaman tiang) — sama dengan isi WO Tiang. */
export const isTiangRabRow = (row: RabRowItem) => {
  const desc = (row.desc || '').toLowerCase();
  const sub = (row.subSection || '').toLowerCase();

  // Kecualikan item yang hanya menyebut 'tiang' tetapi bukan tiang (misal trafo gardu tiang, serandang trafo 1 tiang, dsb)
  if (desc.includes('pasang trafo') || desc.includes('serandang trafo') || desc.includes('tic')) {
    return false;
  }

  if (row.section === 'MATERIAL') {
    return sub.includes('tiang beton') || desc.includes('pole;concrete') || desc.includes('tiang');
  }

  // Untuk JASA: harus jasa pembuatan pondasi tiang, penanaman/pembongkaran tiang, atau angkutan tiang
  return (
    desc.includes('pondasi tiang') ||
    desc.includes('penanaman tiang') ||
    desc.includes('pemasangan, tiang') ||
    desc.includes('pasang tiang') ||
    desc.includes('pembongkaran tiang') ||
    desc.includes('angkutan tiang') ||
    desc.includes('angkt tiang')
  );
};

/** RAB WO Tiang hasil survey: baris tiang dari kalkulasi Paket 1 dan Paket 2. */
export function calculateTiangRabFromSurvey(
  survey: RabSurveyInput,
  customPrices?: Record<string, number>
): RabRowItem[] {
  return (['paket1', 'paket2'] as const).flatMap((paket) =>
    calculateRabFromSurvey(survey, paket, customPrices)
      .filter((row) => !row.isHeader && row.rencanaVol > 0 && isTiangRabRow(row))
      .map((row) => ({ ...row, id: `tb-${paket}-${row.id}` }))
  );
}
