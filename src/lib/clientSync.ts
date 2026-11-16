import { usePromotorStore } from '@/store/usePromotorStore';

// ============================================================================
//  SINKRONISASI STATE <-> DATABASE & LOCAL STORAGE (HYBRID RESILIENT)
//
//  Alur:
//    1. Browser dibuka -> Muat cache darurat dari LocalStorage (jika ada).
//    2. Hidrasi database -> GET /api/state/bootstrap -> satukan data dari PostgreSQL.
//    3. Store dipantau lewat subscribe() -> Simpan ke LocalStorage seketika (0ms),
//       lalu jadwalkan sinkronisasi ke PostgreSQL (debounce 600ms).
//    4. Mendukung flush instan (`flushSyncNow`) saat user membuat data penting (Survey, WO)
//       agar data tidak pernah hilang walau browser langsung di-refresh.
// ============================================================================

/** Slice yang ikut disimpan. UI state (peranan, halaman aktif, toast) tidak. */
export const SYNCED_KEYS = [
  'surveys', 'daftungs', 'workOrders', 'reservationTransactions',
  'vendorPickupTransactions', 'vendors', 'contracts', 'materialContracts',
  'supervisors', 'stocks', 'sweepings', 'audits', 'constructionRules',
  'customKhsPrices', 'materialCodeMap',
] as const;

const DEBOUNCE_MS = 600;
const STORAGE_PREFIX = 'promotor_pln_slice_';

type StoreState = ReturnType<typeof usePromotorStore.getState>;
export type SyncedKey = (typeof SYNCED_KEYS)[number];

let started = false;
let applyingRemote = false;
let failureLogged = false;
const timers = new Map<SyncedKey, ReturnType<typeof setTimeout>>();

export type SyncStatus = 'off' | 'hydrating' | 'live' | 'unavailable';
let status: SyncStatus = 'off';
const listeners = new Set<(s: SyncStatus) => void>();

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

/** Backup instan ke LocalStorage untuk mencegah data hilang saat refresh tiba-tiba */
function saveLocalBackup(key: SyncedKey, payload: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(payload));
  } catch {
    // Kuota localStorage penuh atau private browsing, lanjutkan tanpa crash
  }
}

function loadLocalBackup(key: SyncedKey): unknown | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function flushSlice(key: SyncedKey) {
  const payload = usePromotorStore.getState()[key];
  saveLocalBackup(key, payload);

  try {
    const res = await fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slice: key, payload }),
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

function queueSlice(key: SyncedKey) {
  // Selalu simpan lokal segera (0ms)
  saveLocalBackup(key, usePromotorStore.getState()[key]);

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

/**
 * Tulis segera semua slice yang masih mengantre (dipanggil saat refresh / unload).
 */
export function flushPendingNow() {
  for (const [key, t] of timers) {
    clearTimeout(t);
    void flushSlice(key);
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

  // Listeners untuk refresh & penutupan tab
  window.addEventListener('beforeunload', flushPendingNow);
  window.addEventListener('pagehide', flushPendingNow);

  // 1. Pulihkan cadangan lokal yang belum tersinkronisasi jika ada (Fast Offline Recovery)
  try {
    const localPatch: Partial<StoreState> = {};
    for (const key of SYNCED_KEYS) {
      const cached = loadLocalBackup(key);
      if (cached !== null) {
        (localPatch as Record<string, unknown>)[key] = cached;
      }
    }
    if (Object.keys(localPatch).length > 0) {
      applyingRemote = true;
      usePromotorStore.setState(localPatch);
      applyingRemote = false;
    }
  } catch {
    // Lewati jika local recovery gagal
  }

  // 2. Hidrasi database PostgreSQL
  let remote: Record<string, unknown> | null = null;
  try {
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

  // Database masih kosong: muat seed sekali saja, lalu baca ulang
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
        (patch as Record<string, unknown>)[key] = remote[key];
        saveLocalBackup(key, remote[key]);
      }
    }
    applyingRemote = true;
    usePromotorStore.setState(patch);
    applyingRemote = false;
    setStatus('live');
  }

  // 3. Write-through otomatis dengan debounce + backup lokal
  usePromotorStore.subscribe((state, prev) => {
    if (applyingRemote || status === 'unavailable') return;
    for (const key of SYNCED_KEYS) {
      if (state[key] !== prev[key]) {
        queueSlice(key);
      }
    }
  });
}

/** Buang semua antrian tulis -- dipakai saat komponen dilepas. */
export function cancelPendingSync() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}
