import * as XLSX from 'xlsx';

export interface SweepingExcelExportData {
  title: string;
  namaPekerjaan: string;
  noSpk: string;
  tanggal: string;
  lokasi: string;
  pelaksana: string;
  items: Array<{
    material: string;
    unit: string;
    picks: Array<{ vol: number; ref: string; ket?: string }>;
    installed: Array<{ vol: number; ket?: string }>;
    returs: Array<{ vol: number; tug10?: string; ket?: string }>;
  }>;
  signatories?: {
    direksiPekerjaan?: { jabatan1: string; jabatan2: string; unit: string; nama: string };
    pemeriksa?: { jabatan1: string; jabatan2: string; unit: string; nama: string };
    direksiPengawas?: { jabatan1: string; jabatan2: string; unit: string; nama: string };
    pelaksana?: { perusahaan: string; jabatan: string; nama: string };
  };
}

/**
 * Ekspor Dokumen Sweeping Material ke format Microsoft Excel (.xlsx) resmi dan rapi.
 */
export function exportSweepingToExcel(data: SweepingExcelExportData, filename?: string) {
  const wb = XLSX.utils.book_new();
  const rows: Array<Array<string | number | null>> = [];
  const merges: XLSX.Range[] = [];

  // 1. JUDUL DOKUMEN
  rows.push(['SWEEPING MATERIAL']);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } });

  rows.push([]); // Spasi kosong

  // 2. HEADER METADATA PEKERJAAN
  rows.push(['NAMA PEKERJAAN', `:\t${data.namaPekerjaan || '-'}`]);
  rows.push(['NO SPK', `:\t${data.noSpk || '-'}`]);
  rows.push(['TANGGAL', `:\t${data.tanggal || '-'}`]);
  rows.push(['LOKASI', `:\t${data.lokasi || '-'}`]);
  rows.push(['PELAKSANA', `:\t${data.pelaksana || '-'}`]);

  rows.push([]); // Spasi kosong

  // 3. TABLE HEADERS (2 Tingkat dengan Merge)
  const headerRow1Index = rows.length;
  rows.push([
    'NO',
    'JENIS MATERIAL',
    'MATERIAL PENGAMBILAN',
    null,
    null,
    null,
    'MATERIAL TERPASANG',
    null,
    null,
    'MATERIAL DIKEMBALIKAN',
    null,
    null,
    null,
  ]);

  const headerRow2Index = rows.length;
  rows.push([
    null, // NO (merged)
    null, // JENIS MATERIAL (merged)
    'VOL',
    'SAT',
    'RESERVASI / TUG 9 (NOMOR)',
    'KET',
    'VOL',
    'SAT',
    'KETERANGAN',
    'VOL',
    'SAT',
    'RESERVASI / TUG 10 (NOMOR)',
    'KETERANGAN',
  ]);

  // Merge untuk header
  merges.push({ s: { r: headerRow1Index, c: 0 }, e: { r: headerRow2Index, c: 0 } }); // NO
  merges.push({ s: { r: headerRow1Index, c: 1 }, e: { r: headerRow2Index, c: 1 } }); // JENIS MATERIAL
  merges.push({ s: { r: headerRow1Index, c: 2 }, e: { r: headerRow1Index, c: 5 } }); // PENGAMBILAN (C-F)
  merges.push({ s: { r: headerRow1Index, c: 6 }, e: { r: headerRow1Index, c: 8 } }); // TERPASANG (G-I)
  merges.push({ s: { r: headerRow1Index, c: 9 }, e: { r: headerRow1Index, c: 12 } }); // DIKEMBALIKAN (J-M)

  // 4. DATA BARIS MATERIAL & SUBTOTAL
  let grandTotalPick = 0;
  let grandTotalInst = 0;
  let grandTotalRet = 0;

  data.items.forEach((item, itemIdx) => {
    const picks = item.picks || [];
    const instList = item.installed || [];
    const retList = item.returs || [];
    const maxSubRows = Math.max(picks.length, instList.length, retList.length, 1);

    const subTotalPick = picks.reduce((sum, p) => sum + (p.vol || 0), 0);
    const subTotalInst = instList.reduce((sum, i) => sum + (i.vol || 0), 0);
    const subTotalRet = retList.reduce((sum, r) => sum + (r.vol || 0), 0);

    grandTotalPick += subTotalPick;
    grandTotalInst += subTotalInst;
    grandTotalRet += subTotalRet;

    const startRowIndex = rows.length;

    for (let r = 0; r < maxSubRows; r++) {
      const p = picks[r];
      const inst = instList[r];
      const ret = retList[r];

      rows.push([
        r === 0 ? itemIdx + 1 : null,
        r === 0 ? item.material : null,
        p ? p.vol : 0,
        item.unit || 'SET',
        p ? p.ref : '—',
        p ? p.ket || '' : '',
        inst ? inst.vol : 0,
        item.unit || 'SET',
        inst ? inst.ket || '' : '',
        ret ? ret.vol : 0,
        item.unit || 'SET',
        ret ? ret.tug10 || '' : '',
        ret ? ret.ket || '' : '',
      ]);
    }

    // Merge sel NO dan JENIS MATERIAL untuk semua sub-baris material ini
    if (maxSubRows > 1) {
      merges.push({ s: { r: startRowIndex, c: 0 }, e: { r: startRowIndex + maxSubRows - 1, c: 0 } });
      merges.push({ s: { r: startRowIndex, c: 1 }, e: { r: startRowIndex + maxSubRows - 1, c: 1 } });
    }

    // Baris Subtotal per Item
    const subtotalRowIndex = rows.length;
    rows.push([
      null,
      `SUBTOTAL ${item.material}`,
      subTotalPick,
      item.unit || 'SET',
      null,
      null,
      subTotalInst,
      item.unit || 'SET',
      null,
      subTotalRet,
      item.unit || 'SET',
      null,
      null,
    ]);
    merges.push({ s: { r: subtotalRowIndex, c: 4 }, e: { r: subtotalRowIndex, c: 5 } });
    merges.push({ s: { r: subtotalRowIndex, c: 11 }, e: { r: subtotalRowIndex, c: 12 } });
  });

  // 5. BARIS GRAND TOTAL KESELURUHAN
  const grandTotalRowIndex = rows.length;
  rows.push([
    null,
    'GRAND TOTAL KESELURUHAN',
    grandTotalPick,
    'BH/SET',
    null,
    null,
    grandTotalInst,
    'BH/SET',
    null,
    grandTotalRet,
    'BH/SET',
    null,
    null,
  ]);
  merges.push({ s: { r: grandTotalRowIndex, c: 0 }, e: { r: grandTotalRowIndex, c: 1 } });
  merges.push({ s: { r: grandTotalRowIndex, c: 4 }, e: { r: grandTotalRowIndex, c: 5 } });
  merges.push({ s: { r: grandTotalRowIndex, c: 11 }, e: { r: grandTotalRowIndex, c: 12 } });

  rows.push([]); // Spasi kosong
  rows.push([]); // Spasi kosong

  // 6. TANDA TANGAN & PENGESAHAN (4 PIHAK RESMI PLN)
  const sig = data.signatories || {};
  const direksiPekerjaan = sig.direksiPekerjaan || {
    jabatan1: 'Direksi Pekerjaan',
    jabatan2: 'Asisten Manager Jaringan',
    unit: 'UP3 Banten Selatan',
    nama: 'HENDRO PRASETYO',
  };
  const pemeriksa = sig.pemeriksa || {
    jabatan1: 'Pemeriksa',
    jabatan2: 'TL Logistik',
    unit: 'UP3 Banten Selatan',
    nama: 'BUDI ARIWIBOWO ASRI',
  };
  const direksiPengawas = sig.direksiPengawas || {
    jabatan1: 'Direksi Pengawas',
    jabatan2: 'TL Pemeliharaan',
    unit: 'UP3 Banten Selatan',
    nama: '',
  };
  const pelaksana = sig.pelaksana || {
    perusahaan: data.pelaksana || 'PT HILMAN PRIMA PERKASA',
    jabatan: 'DIREKTUR',
    nama: 'ADI CANDRA',
  };

  // Baris 1: Jabatan Utama
  rows.push([
    null,
    direksiPekerjaan.jabatan1,
    null,
    null,
    pemeriksa.jabatan1,
    null,
    null,
    direksiPengawas.jabatan1,
    null,
    null,
    null,
    'Pelaksana',
    null,
  ]);

  // Baris 2: Unit / Perusahaan
  rows.push([
    null,
    direksiPekerjaan.unit,
    null,
    null,
    pemeriksa.unit,
    null,
    null,
    direksiPengawas.unit,
    null,
    null,
    null,
    pelaksana.perusahaan,
    null,
  ]);

  // Baris 3: Jabatan Spesifik
  rows.push([
    null,
    direksiPekerjaan.jabatan2,
    null,
    null,
    pemeriksa.jabatan2,
    null,
    null,
    direksiPengawas.jabatan2,
    null,
    null,
    null,
    pelaksana.jabatan,
    null,
  ]);

  // Spasi tanda tangan & cap stempel (4 baris)
  rows.push([]);
  rows.push([]);
  rows.push([]);
  rows.push([]);

  // Baris Nama Penanggung Jawab
  rows.push([
    null,
    direksiPekerjaan.nama || '...........................................',
    null,
    null,
    pemeriksa.nama || '...........................................',
    null,
    null,
    direksiPengawas.nama || '...........................................',
    null,
    null,
    null,
    pelaksana.nama || 'ADI CANDRA',
    null,
  ]);

  // Buat Sheet dari Array of Arrays
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set merges
  ws['!merges'] = merges;

  // Lebar kolom yang proporsional dan rapi
  ws['!cols'] = [
    { wch: 5 },  // A: NO
    { wch: 42 }, // B: JENIS MATERIAL
    { wch: 8 },  // C: VOL AMBIL
    { wch: 7 },  // D: SAT AMBIL
    { wch: 32 }, // E: NO TUG 9
    { wch: 10 }, // F: KET AMBIL
    { wch: 8 },  // G: VOL TERPASANG
    { wch: 7 },  // H: SAT TERPASANG
    { wch: 22 }, // I: KET TERPASANG
    { wch: 8 },  // J: VOL DIKEMBALIKAN
    { wch: 7 },  // K: SAT DIKEMBALIKAN
    { wch: 25 }, // L: NO TUG 10
    { wch: 18 }, // M: KET DIKEMBALIKAN
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Sweeping Material');

  // Trigger download file di browser
  const cleanFilename = (filename || `SWEEPING_MATERIAL_${(data.noSpk || 'PLN').replace(/[^a-zA-Z0-9_-]/g, '_')}`).endsWith('.xlsx')
    ? (filename || `SWEEPING_MATERIAL_${(data.noSpk || 'PLN').replace(/[^a-zA-Z0-9_-]/g, '_')}`)
    : `${filename || `SWEEPING_MATERIAL_${(data.noSpk || 'PLN').replace(/[^a-zA-Z0-9_-]/g, '_')}`}.xlsx`;

  XLSX.writeFile(wb, cleanFilename);
}

/**
 * Ekspor dari arsip SweepingRecord yang sudah tersimpan di database.
 */
export function exportSavedSweepingToExcel(swp: {
  nomorSweeping: string;
  namaPekerjaan: string;
  noSpk: string;
  tanggal: string;
  lokasi: string;
  pelaksana: string;
  items?: Array<{
    material: string;
    volPengambilan: number;
    satPengambilan?: string;
    noTug9?: string;
    ketPengambilan?: string;
    volTerpasang: number;
    satTerpasang?: string;
    ketTerpasang?: string;
    volDikembalikan: number;
    satDikembalikan?: string;
    noTug10?: string;
    ketDikembalikan?: string;
  }>;
  ttdVendorName?: string;
  ttdPengawasName?: string;
  ttdGudangName?: string;
}) {
  const grouped: Record<
    string,
    {
      material: string;
      unit: string;
      picks: Array<{ vol: number; ref: string; ket?: string }>;
      installed: Array<{ vol: number; ket?: string }>;
      returs: Array<{ vol: number; tug10?: string; ket?: string }>;
    }
  > = {};

  (swp.items || []).forEach((it) => {
    if (!grouped[it.material]) {
      grouped[it.material] = {
        material: it.material,
        unit: it.satPengambilan || it.satTerpasang || 'SET',
        picks: [],
        installed: [],
        returs: [],
      };
    }
    const g = grouped[it.material];
    if (it.volPengambilan > 0 || (it.noTug9 && it.noTug9 !== '—')) {
      g.picks.push({ vol: it.volPengambilan, ref: it.noTug9 || '—', ket: it.ketPengambilan });
    }
    if (it.volTerpasang > 0 || it.ketTerpasang) {
      g.installed.push({ vol: it.volTerpasang, ket: it.ketTerpasang });
    }
    if (it.volDikembalikan > 0 || (it.noTug10 && it.noTug10 !== '—')) {
      g.returs.push({ vol: it.volDikembalikan, tug10: it.noTug10, ket: it.ketDikembalikan });
    }
  });

  const exportItems = Object.values(grouped).map((g) => {
    if (g.picks.length === 0) g.picks.push({ vol: 0, ref: '—' });
    if (g.installed.length === 0) g.installed.push({ vol: 0 });
    if (g.returs.length === 0) g.returs.push({ vol: 0 });
    return g;
  });

  exportSweepingToExcel(
    {
      title: swp.namaPekerjaan,
      namaPekerjaan: swp.namaPekerjaan,
      noSpk: swp.noSpk,
      tanggal: swp.tanggal,
      lokasi: swp.lokasi,
      pelaksana: swp.pelaksana,
      items: exportItems,
      signatories: {
        direksiPekerjaan: {
          jabatan1: 'Direksi Pekerjaan',
          jabatan2: 'Asisten Manager Jaringan',
          unit: 'UP3 Banten Selatan',
          nama: 'HENDRO PRASETYO',
        },
        pemeriksa: {
          jabatan1: 'Pemeriksa',
          jabatan2: 'TL Logistik',
          unit: 'UP3 Banten Selatan',
          nama: 'BUDI ARIWIBOWO ASRI',
        },
        direksiPengawas: {
          jabatan1: 'Direksi Pengawas',
          jabatan2: 'TL Pemeliharaan',
          unit: 'UP3 Banten Selatan',
          nama: swp.ttdPengawasName || '',
        },
        pelaksana: {
          perusahaan: swp.pelaksana || 'PT HILMAN PRIMA PERKASA',
          jabatan: 'DIREKTUR',
          nama: swp.ttdVendorName || 'ADI CANDRA',
        },
      },
    },
    `SWEEPING_MATERIAL_${(swp.nomorSweeping || 'PLN').replace(/[^a-zA-Z0-9_-]/g, '_')}`
  );
}
