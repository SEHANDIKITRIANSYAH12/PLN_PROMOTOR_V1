import jasaSubSectionsJson from './jasaSubSections.json';
import jasaDescToSubSectionJson from './jasaDescToSubSection.json';

export const JASA_SUBSECTIONS_MAP: Record<string, string> = jasaSubSectionsJson;
export const JASA_DESC_TO_SUB_MAP: Record<string, string> = jasaDescToSubSectionJson;

/**
 * Normalisasi string deskripsi untuk pencarian toleran whitespace/case
 */
function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Mengembalikan nama Sub-Bab KHS 2026 berdasarkan:
 * 1. ID item (misal 'p1-257')
 * 2. Deskripsi item (misal 'PEKERJAAN PERSIAPAN, Stripping...')
 * 3. subKategori bawaan jika ada dan spesifik
 * 4. Heuristik kata kunci
 * 5. Fallback aman
 */
export function getJasaSubSection(id?: string, fallback?: string, deskripsi?: string): string {
  // 1. Cek berdasarkan ID jika ada
  if (id && JASA_SUBSECTIONS_MAP[id]) {
    return JASA_SUBSECTIONS_MAP[id];
  }

  // 2. Cek berdasarkan Deskripsi Pekerjaan (Sangat andal untuk data yang sudah tersimpan di localStorage)
  if (deskripsi) {
    const cleanDesc = normalizeText(deskripsi);
    if (JASA_DESC_TO_SUB_MAP[cleanDesc]) {
      return JASA_DESC_TO_SUB_MAP[cleanDesc];
    }

    // Pencarian parsial jika ada kemiripan tinggi
    for (const [key, sub] of Object.entries(JASA_DESC_TO_SUB_MAP)) {
      if (cleanDesc.includes(key) || key.includes(cleanDesc)) {
        return sub;
      }
    }
  }

  // 3. Cek apakah fallback mengandung nama spesifik (bukan sekadar 'KELOMPOK JASA')
  if (fallback && fallback.trim() !== '' && fallback !== 'KELOMPOK JASA' && fallback !== 'KELOMPOK JASA SUTM & GARDU DISTRIBUSI' && fallback !== 'KELOMPOK JASA JTR & APP') {
    return fallback;
  }

  // 4. Heuristik berdasarkan kata kunci jika deskripsi tersedia
  if (deskripsi) {
    const dUpper = deskripsi.toUpperCase();

    // SUTM / SKUTM
    if (
      dUpper.includes('TRAVERS') ||
      dUpper.includes('ISOLATOR') ||
      dUpper.includes('PENARIKAN KAWAT') ||
      dUpper.includes('A3CS') ||
      dUpper.includes('TOP TIES') ||
      dUpper.includes('SIDE TIES') ||
      dUpper.includes('STAYSET') ||
      dUpper.includes('PONDASI TIANG')
    ) {
      return 'A. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN SUTM/SKUTM';
    }

    // Gardu Distribusi - Persiapan
    if (dUpper.includes('STRIPPING') || dUpper.includes('BOUWPLANK') || dUpper.includes('BABAT RUMPUT')) {
      return 'B. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN GARDU DISTRIBUSI - I. GARDU PORTAL - a. Pekerjaan Persiapan';
    }

    // Gardu Distribusi - Tanah
    if (dUpper.includes('GALIAN') || dUpper.includes('URUGAN')) {
      return 'B. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN GARDU DISTRIBUSI - I. GARDU PORTAL - b. Pekerjaan Tanah';
    }

    // Gardu Distribusi - Pasangan & Beton
    if (
      dUpper.includes('BATU KALI') ||
      dUpper.includes('READYMIX') ||
      dUpper.includes('BATU BATA') ||
      dUpper.includes('PLESTERAN') ||
      dUpper.includes('ACIAN') ||
      dUpper.includes('COR BETON')
    ) {
      return 'B. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN GARDU DISTRIBUSI - I. GARDU PORTAL - c. Pekerjaan Beton';
    }

    // Gardu Distribusi - Rangka
    if (
      dUpper.includes('RANGKA GARDU') ||
      dUpper.includes('PENGHALANG PANJAT') ||
      dUpper.includes('TANDA KILAT') ||
      dUpper.includes('TANDA GARDU') ||
      dUpper.includes('NOMER GARDU')
    ) {
      return 'B. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN GARDU DISTRIBUSI - I. GARDU PORTAL - d. Pekerjaan Rangka Gardu Portal';
    }

    // Gardu Distribusi - Instalasi
    if (
      dUpper.includes('PASANG TRAFO') ||
      dUpper.includes('CUT OUT') ||
      dUpper.includes('ARRESTER') ||
      dUpper.includes('EARTHING ROD') ||
      dUpper.includes('PIPA ARDE') ||
      dUpper.includes('KAWAT BC') ||
      dUpper.includes('HARDWARE, ISOLATOR, PHBTR') ||
      dUpper.includes('KABEL NAIK TR')
    ) {
      return 'B. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN GARDU DISTRIBUSI - I. GARDU PORTAL - e. Pekerjaan Instalasi Gardu Portal';
    }

    // Gardu Distribusi - Angkutan
    if (dUpper.includes('ANGKUTAN') || dUpper.includes('DOKUMENTASI') || dUpper.includes('AS BUILT')) {
      return 'B. PEKERJAAN PEMBANGUNAN/PEMBONGKARAN GARDU DISTRIBUSI - I. GARDU PORTAL - f. Pekerjaan Angkutan Distribusi';
    }

    // JTR / APP
    if (dUpper.includes('SUTR') || dUpper.includes('SKUTR') || dUpper.includes('APP') || dUpper.includes('KABEL TWISTED')) {
      return 'A. JASA PEMASANGAN/PEMBONGKARAN SUTR/SKUTR DAN LENGKAPAN';
    }
  }

  return fallback || 'KELOMPOK JASA';
}
