import { usePromotorStore } from '@/store/usePromotorStore';

// ============================================================================
//  SINKRONISASI STATE <-> DATABASE DI SISI BROWSER
//
//  Alur:
//    1. Halaman dibuka -> GET /api/state/bootstrap -> data dari PostgreSQL
//       menggantikan seed in-memory.
//    2. Store dipantau lewat subscribe(). Begitu sebuah slice berubah
//       referensi, slice itu dikirim ke POST /api/state/sync (dijeda supaya
//       satu aksi yang mengubah banyak hal tidak menulis berkali-kali).
//       Antrean yang masih tertunda ikut dipaksa keluar saat halaman
//       ditutup/di-refresh (event pagehide).
//    3. Database kosong -> seed dimuat otomatis sekali, lalu dibaca ulang.
//
//  Tidak ada satu pun dari 52 action store yang perlu diubah: write-through
//  terjadi di luar aksi. Kalau database mati, aplikasi tetap jalan penuh
//  dengan seed in-memory dan kegagalan dicatat sekali saja ke Log Audit.
// ============================================================================

/** Slice yang ikut disimpan. UI state (peranan, halaman aktif, toast) tidak. */
export const SYNCED_KEYS = [
  'surveys', 'daftungs', 'workOrders', 'reservationTransactions',
  'vendorPickupTransactions', 'vendors', 'contracts', 'materialContracts',
  'supervisors', 'stocks', 'sweepings', 'audits', 'constructionRules',
  'customKhsPrices', 'materialCodeMap',
] as const;

const DEBOUNCE_MS = 600;

type StoreState = ReturnType<typeof usePromotorStore.getState>;
type SyncedKey = (typeof SYNCED_KEYS)[number];

let started = false;
let applyingRemote = false;
let failureLogged = false;
const timers = new Map<SyncedKey, ReturnType<typeof setTimeout>>();

export type SyncStatus = 'off' | 'hydrating' | 'live' | 'unavailable';
let status: SyncStatus = 'off';
const listeners = new Set<(s: SyncStatus) => void>();

export function getSyncStatus() {
  return status;
}

/** Dipakai UI mana pun yang ingin menampilkan status koneksi database. */
export function onSyncStatusChange(fn: (s: SyncStatus) => void) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

function setStatus(next: SyncStatus) {
  if (status === next) return;
  status = next;
  for (const fn of listeners) fn(status);
}

function logOnce(message: string) {
  if (failureLogged) return;
  failureLogged = true;
  try {
    usePromotorStore.getState().addAudit(message, 'SYS-DATABASE', 'Core System');
  } catch {
    // addAudit sendiri sedang bermasalah; biarkan senyap.
  }
}

function queueSlice(key: SyncedKey) {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      void flushSlice(key);
    }, DEBOUNCE_MS)
  );
}

async function flushSlice(key: SyncedKey, keepalive = false) {
  const payload = usePromotorStore.getState()[key];
  try {
    const res = await fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slice: key, payload }),
      // keepalive: request boleh menyelesaikan diri walaupun halaman ditutup.
      keepalive,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      logOnce(`Sinkronisasi database gagal pada slice ${key} (HTTP ${res.status}) ${detail}`.trim());
      setStatus('unavailable');
      return;
    }
    setStatus('live');
  } catch (err) {
    logOnce(`Sinkronisasi database gagal pada slice ${key}: ${String(err)}`);
    setStatus('unavailable');
  }
}

/**
 * Tulis segera semua slice yang masih mengantre. Dipanggil saat halaman akan
 * ditutup/di-refresh: tanpa ini, perubahan yang dibuat kurang dari
 * DEBOUNCE_MS sebelum refresh akan ikut hilang bersama tab-nya.
 */
function flushPendingNow() {
  for (const [key, t] of timers) {
    clearTimeout(t);
    void flushSlice(key, true);
  }
  timers.clear();
}

/** Database dianggap kosong bila seluruh tabel data utama tidak berisi apa pun. */
function looksEmpty(remote: Record<string, unknown>): boolean {
  const probe = ['surveys', 'stocks', 'contracts', 'vendors', 'supervisors'];
  return probe.every((k) => {
    const v = remote[k];
    return Array.isArray(v) && v.length === 0;
  });
}

export async function startDbSync() {
  if (started) return;
  started = true;
  setStatus('hydrating');

  // pagehide = satu-satunya event yang andal saat tab ditutup atau di-refresh.
  window.addEventListener('pagehide', flushPendingNow);

  let remote: Record<string, unknown> | null = null;

  try {
    // cache: 'no-store' -- respons bootstrap tidak dikirim dengan Cache-Control
    // apa pun, jadi browser bebas menyajikannya dari cache dan hidrasi akan
    // memakai data lama. Permintaan ini harus selalu ke server.
    const res = await fetch('/api/state/bootstrap', { cache: 'no-store' });
    const json = (await res.json()) as { success?: boolean; data?: Record<string, unknown> };
    if (res.ok && json.success && json.data) remote = json.data;
    else if (res.status === 503) {
      setStatus('unavailable');
      return;
    }
  } catch (err) {
    logOnce(`Database tidak terjangkau saat hidrasi: ${String(err)}`);
    setStatus('unavailable');
    return;
  }

  // Database masih kosong: muat seed sekali saja, lalu baca ulang supaya
  // isinya sama persis dengan seed in-memory.
  if (remote && looksEmpty(remote)) {
    try {
      await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ifEmpty: true }),
      });
      const again = await fetch('/api/state/bootstrap', { cache: 'no-store' });
      const json2 = (await again.json()) as { success?: boolean; data?: Record<string, unknown> };
      if (json2.success && json2.data) remote = json2.data;
    } catch (err) {
      logOnce(`Gagal memuat seed ke database: ${String(err)}`);
    }
  }

  if (remote) {
    const patch: Partial<StoreState> = {};
    for (const key of SYNCED_KEYS) {
      if (remote[key] !== undefined) {
        // Semua SYNCED_KEYS adalah kunci sah StoreState, jadi penulisan dinamis
        // ini aman; kompilasi akan menolak kalau ada kunci yang bocor.
        (patch as Record<string, unknown>)[key] = remote[key];
      }
    }
    applyingRemote = true;
    usePromotorStore.setState(patch);
    applyingRemote = false;
    setStatus('live');
  }

  // Write-through otomatis.
  usePromotorStore.subscribe((state, prev) => {
    if (applyingRemote || status === 'unavailable') return;
    for (const key of SYNCED_KEYS) {
      if (state[key] !== prev[key]) queueSlice(key);
    }
  });
}

/** Buang semua antrian tulis -- dipakai saat komponen dilepas. */
export function cancelPendingSync() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}
