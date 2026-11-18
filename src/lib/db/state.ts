// Modul ini hanya boleh dipakai route handler (sisi server): ia mengimpor
// Prisma dan membaca DATABASE_URL. Paket `server-only` tidak terpasang di
// proyek ini, jadi pembatasnya adalah disiplin impor, bukan guard runtime.
import type { Prisma } from '@prisma/client';
import type {
  SurveyRecord, DaftungRecord, WorkOrderRecord, VendorRecord, SupervisorRecord,
  ContractRecord, MaterialContractRecord, StockMaterial, AuditRecord,
  ReservationTransaction, VendorPickupTransaction, SweepingRecord,
  StandardConstructionRules,
} from '@/types';

// ============================================================================
//  JEMBATAN STATE <-> POSTGRESQL
//
//  Kolom tabel sengaja diberi NAMA SAMA dengan field record aplikasi, jadi
//  pemetaannya bisa generik: buang key turunan (sysIdx, sysCreatedAt,
//  FK induk, idx anak), sisanya langsung cocok. Kalau suatu saat nama field
//  aplikasi dan schema tidak cocok lagi, TypeScript yang akan berteriak di
//  sini -- bukan error runtime di browser pengguna.
//
//  Cara tulis = "ganti seluruh slice" di dalam satu transaksi. Pilihan ini
//  sadar: aplikasi ini satu pengguna lokal, aksinya banyak mengubah beberapa
//  slice sekaligus (apply WO menyentuh daftung + survey + WO + audit), dan
//  dengan cara ini tidak ada satu action pun dari 52 action yang perlu
//  diubah. Muatannya tetap masuk ke tabel relasional yang ternormalisasi.
// ============================================================================

type Tx = Prisma.TransactionClient;

/** Buang key yang tidak boleh ikut tertulis/terbaca. */
function drop<T extends object, K extends string>(obj: T, keys: K[]): Omit<T, K> {
  const out = { ...obj } as Record<string, unknown>;
  for (const k of keys) delete out[k];
  return out as Omit<T, K>;
}

/** Kolom Json tidak boleh menerima null; biarkan default kolom yang bekerja. */
function json(v: unknown): Prisma.InputJsonValue | undefined {
  return v === null || v === undefined ? undefined : (v as Prisma.InputJsonValue);
}

/**
 * Baris hasil query Prisma -> bentuk record aplikasi.
 *
 * Kolom nullable yang kosong dikembalikan Prisma sebagai null, sedangkan field
 * aplikasi bertipe opsional: tidak ada. Bedanya menentukan, karena logika UI
 * menguji kelengkapan data dengan `!== undefined` (qtyReserved, qtyTaken,
 * progressJasa, progressMaterial, dan belasan lainnya). null lolos uji itu lalu
 * dianggap nilai, sehingga misalnya material yang belum direservasi
 * (qtyReserved null) dihitung "tidak ada yang perlu diambil" = progres material
 * 100%. Karena itu key bernilai null dilepas, bukan dipertahankan.
 */
function hydrate<T extends object>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== null) out[key] = value;
  }
  return out as T;
}

const SYS_KEYS = ['sysIdx', 'sysCreatedAt', 'sysUpdatedAt'] as const;

// ---------------------------------------------------------------------------
//  SURVEY + TIANG
// ---------------------------------------------------------------------------
async function writeSurveys(tx: Tx, rows: SurveyRecord[]) {
  await tx.survey.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const poles = r.poles ?? [];
    await tx.survey.create({
      data: {
        ...drop(r, ['poles', 'rabCustomOverrides', 'locationPhotos', 'originalCustomerName']),
        originalCustomerName: r.originalCustomerName ?? null,
        locationPhotos: r.locationPhotos ?? [],
        rabCustomOverrides: json(r.rabCustomOverrides),
        sysIdx: i,
        poles: {
          create: poles.map((p, idx) => ({
            ...drop(p, ['materialOverrides', 'photo']),
            idx,
            coordStr: p.coordStr ?? '',
            note: p.note ?? '',
            photo: p.photo ?? null,
            materialOverrides: json(p.materialOverrides),
          })),
        },
      },
    });
  }
}

async function readSurveys(tx: Tx) {
  const rows = await tx.survey.findMany({
    include: { poles: { orderBy: { idx: 'asc' } } },
    orderBy: { sysIdx: 'asc' },
  });
  return rows.map((r) => ({
    ...hydrate(drop(r, [...SYS_KEYS, 'poles'])),
    poles: r.poles.map((p) => hydrate(drop(p, ['surveyId', 'idx']))),
  }));
}

// ---------------------------------------------------------------------------
//  DAFTUNG
// ---------------------------------------------------------------------------
async function writeDaftungs(tx: Tx, rows: DaftungRecord[]) {
  await tx.daftung.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    await tx.daftung.create({ data: { ...drop(rows[i], []), sysIdx: i } });
  }
}

const readDaftungs = (tx: Tx) =>
  tx.daftung.findMany({ orderBy: { sysIdx: 'asc' } }).then((r) => r.map((x) => hydrate(drop(x, [...SYS_KEYS]))));

// ---------------------------------------------------------------------------
//  WORK ORDER + MATERIAL + JASA
// ---------------------------------------------------------------------------
async function writeWorkOrders(tx: Tx, rows: WorkOrderRecord[]) {
  await tx.workOrder.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    await tx.workOrder.create({
      data: {
        ...drop(r, [
          'materials', 'jasaItems', 'milestones', 'materialSubstitutions',
          'suratJalanList', 'rabCustomOverrides', 'pendingJasaItems',
          'suratJalanPhotos', 'receiptPhotos', 'slipReturPhotos', 'reservationExpiry',
        ]),
        milestones: json(r.milestones),
        materialSubstitutions: json(r.materialSubstitutions ?? []),
        suratJalanList: json(r.suratJalanList ?? []),
        rabCustomOverrides: json(r.rabCustomOverrides),
        pendingJasaItems: json(r.pendingJasaItems ?? []),
        suratJalanPhotos: r.suratJalanPhotos ?? [],
        receiptPhotos: r.receiptPhotos ?? [],
        slipReturPhotos: r.slipReturPhotos ?? [],
        sysIdx: i,
        materials: {
          create: (r.materials ?? []).map((m, idx) => ({ ...drop(m, ['woId', 'idx']), idx })),
        },
        jasaItems: {
          create: (r.jasaItems ?? []).map((j, idx) => ({ ...drop(j, ['woId', 'idx']), idx })),
        },
      },
    });
  }
}
1
async function readWorkOrders(tx: Tx) {
  const rows = await tx.workOrder.findMany({
    include: {
      materials: { orderBy: { idx: 'asc' } },
      jasaItems: { orderBy: { idx: 'asc' } },
    },
    orderBy: { sysIdx: 'asc' },
  });
  return rows.map((r) => ({
    ...hydrate(drop(r, [...SYS_KEYS, 'materials', 'jasaItems'])),
    materials: r.materials.map((m) => hydrate(drop(m, ['woId', 'idx']))),
    jasaItems: r.jasaItems.map((j) => hydrate(drop(j, ['woId', 'idx']))),
  }));
}

// ---------------------------------------------------------------------------
//  HISTORI TRANSAKSI
// ---------------------------------------------------------------------------
async function writeReservationTx(tx: Tx, rows: ReservationTransaction[]) {
  await tx.reservationTransaction.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    await tx.reservationTransaction.create({
      data: { ...drop(r, ['items']), items: json(r.items ?? []), sysIdx: i },
    });
  }
}

const readReservationTx = (tx: Tx) =>
  tx.reservationTransaction.findMany({ orderBy: { sysIdx: 'asc' } })
    .then((r) => r.map((x) => hydrate(drop(x, [...SYS_KEYS]))));

async function writePickupTx(tx: Tx, rows: VendorPickupTransaction[]) {
  await tx.vendorPickupTransaction.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    await tx.vendorPickupTransaction.create({
      data: {
        ...drop(r, ['items', 'suratJalanPhotos']),
        items: json(r.items ?? []),
        suratJalanPhotos: r.suratJalanPhotos ?? [],
        sysIdx: i,
      },
    });
  }
}

const readPickupTx = (tx: Tx) =>
  tx.vendorPickupTransaction.findMany({ orderBy: { sysIdx: 'asc' } })
    .then((r) => r.map((x) => hydrate(drop(x, [...SYS_KEYS]))));

// ---------------------------------------------------------------------------
//  MASTER: VENDOR, KONTRAK, KONTRAK MATERIAL, PENGAWAS, STOK
// ---------------------------------------------------------------------------
async function writeVendors(tx: Tx, rows: VendorRecord[]) {
  await tx.vendor.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    await tx.vendor.create({
      data: { ...drop(r, ['jenisPekerjaan']), jenisPekerjaan: r.jenisPekerjaan ?? [], sysIdx: i },
    });
  }
}

const readVendors = (tx: Tx) =>
  tx.vendor.findMany({ orderBy: { sysIdx: 'asc' } }).then((r) => r.map((x) => hydrate(drop(x, [...SYS_KEYS]))));

async function writeContracts(tx: Tx, rows: ContractRecord[]) {
  await tx.contract.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    await tx.contract.create({ data: { ...drop(rows[i], []), sysIdx: i } });
  }
}

const readContracts = (tx: Tx) =>
  tx.contract.findMany({ orderBy: { sysIdx: 'asc' } }).then((r) => r.map((x) => hydrate(drop(x, [...SYS_KEYS]))));

async function writeMaterialContracts(tx: Tx, rows: MaterialContractRecord[]) {
  await tx.materialContract.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    await tx.materialContract.create({
      data: {
        ...drop(r, ['rincianMaterial']),
        sysIdx: i,
        rincian: {
          create: (r.rincianMaterial ?? []).map((m, idx) => ({ ...drop(m, []), idx })),
        },
      },
    });
  }
}

async function readMaterialContracts(tx: Tx) {
  const rows = await tx.materialContract.findMany({
    include: { rincian: { orderBy: { idx: 'asc' } } },
    orderBy: { sysIdx: 'asc' },
  });
  return rows.map((r) => ({
    ...hydrate(drop(r, [...SYS_KEYS, 'rincian'])),
    rincianMaterial: r.rincian.map((m) => hydrate(drop(m, ['kontrakId', 'idx']))),
  }));
}

async function writeSupervisors(tx: Tx, rows: SupervisorRecord[]) {
  await tx.supervisor.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    await tx.supervisor.create({ data: { ...drop(rows[i], []), sysIdx: i } });
  }
}

const readSupervisors = (tx: Tx) =>
  tx.supervisor.findMany({ orderBy: { sysIdx: 'asc' } }).then((r) => r.map((x) => hydrate(drop(x, [...SYS_KEYS]))));

/// Kuncinya `code`, bukan `id`.
async function writeStocks(tx: Tx, rows: StockMaterial[]) {
  await tx.stock.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    await tx.stock.create({ data: { ...drop(rows[i], []), sysIdx: i } });
  }
}

const readStocks = (tx: Tx) =>
  tx.stock.findMany({ orderBy: { sysIdx: 'asc' } }).then((r) => r.map((x) => hydrate(drop(x, [...SYS_KEYS]))));

// ---------------------------------------------------------------------------
//  SWEEPING
// ---------------------------------------------------------------------------
async function writeSweepings(tx: Tx, rows: SweepingRecord[]) {
  await tx.sweeping.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    await tx.sweeping.create({
      data: {
        ...drop(r, ['items', 'woIds']),
        woIds: r.woIds ?? [],
        sysIdx: i,
        items: { create: (r.items ?? []).map((m, idx) => ({ ...drop(m, []), idx })) },
      },
    });
  }
}

async function readSweepings(tx: Tx) {
  const rows = await tx.sweeping.findMany({
    include: { items: { orderBy: { idx: 'asc' } } },
    orderBy: { sysIdx: 'asc' },
  });
  return rows.map((r) => ({
    ...hydrate(drop(r, [...SYS_KEYS, 'items'])),
    items: r.items.map((m) => hydrate(drop(m, ['sweepingId', 'idx']))),
  }));
}

// ---------------------------------------------------------------------------
//  AUDIT LOG  (baris ditulis bertumpuk, bukan diganti)
// ---------------------------------------------------------------------------
async function writeAudits(tx: Tx, rows: AuditRecord[]) {
  await tx.audit.deleteMany();
  for (let i = 0; i < rows.length; i++) {
    await tx.audit.create({ data: { ...drop(rows[i], []), sysIdx: i } });
  }
}

const readAudits = (tx: Tx) =>
  tx.audit.findMany({ orderBy: { sysIdx: 'asc' } })
    .then((r) => r.map((x) => hydrate(drop(x, ['seq', ...SYS_KEYS]))));

// ---------------------------------------------------------------------------
//  KONFIGURASI: aturan standar, harga KHS, pemetaan kode material
// ---------------------------------------------------------------------------
async function writeConstructionRules(tx: Tx, rules: StandardConstructionRules) {
  await tx.constructionRule.deleteMany();
  for (const network of ['jtm', 'jtr'] as const) {
    const r = rules[network];
    if (!r) continue;
    await tx.constructionRule.create({
      data: {
        network,
        tiangLabel: r.tiangLabel,
        konstruksiLabel: r.konstruksiLabel,
        conductorLabel: r.conductorLabel,
        tiangList: r.tiangList ?? [],
        konstruksiList: r.konstruksiList ?? [],
      },
    });
  }
}

async function readConstructionRules(tx: Tx) {
  const rows = await tx.constructionRule.findMany({ orderBy: { network: 'asc' } });
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    out[r.network] = {
      tiangLabel: r.tiangLabel,
      konstruksiLabel: r.konstruksiLabel,
      conductorLabel: r.conductorLabel,
      tiangList: r.tiangList,
      konstruksiList: r.konstruksiList,
    };
  }
  return out;
}

async function writeKhsPrices(tx: Tx, map: Record<string, number>) {
  await tx.khsPrice.deleteMany();
  for (const [itemId, price] of Object.entries(map)) {
    await tx.khsPrice.create({ data: { itemId, price } });
  }
}

async function readKhsPrices(tx: Tx) {
  const rows = await tx.khsPrice.findMany();
  const out: Record<string, number> = {};
  for (const r of rows) out[r.itemId] = r.price;
  return out;
}

async function writeMaterialCodeMap(tx: Tx, map: Record<string, string>) {
  await tx.materialCodeMapping.deleteMany();
  for (const [key, value] of Object.entries(map)) {
    await tx.materialCodeMapping.create({ data: { key, value } });
  }
}

async function readMaterialCodeMap(tx: Tx) {
  const rows = await tx.materialCodeMapping.findMany();
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

// ---------------------------------------------------------------------------
//  REGISTRY
// ---------------------------------------------------------------------------
export interface SliceSpec {
  key: string;
  /** true kalau slice ini berupa objek (map/config), bukan array. */
  isMap: boolean;
  write: (tx: Tx, payload: never) => Promise<void>;
  read: (tx: Tx) => Promise<unknown>;
}

export const SLICE_SPECS: SliceSpec[] = [
  { key: 'surveys', isMap: false, write: writeSurveys as never, read: readSurveys },
  { key: 'daftungs', isMap: false, write: writeDaftungs as never, read: readDaftungs },
  { key: 'workOrders', isMap: false, write: writeWorkOrders as never, read: readWorkOrders },
  { key: 'reservationTransactions', isMap: false, write: writeReservationTx as never, read: readReservationTx },
  { key: 'vendorPickupTransactions', isMap: false, write: writePickupTx as never, read: readPickupTx },
  { key: 'vendors', isMap: false, write: writeVendors as never, read: readVendors },
  { key: 'contracts', isMap: false, write: writeContracts as never, read: readContracts },
  { key: 'materialContracts', isMap: false, write: writeMaterialContracts as never, read: readMaterialContracts },
  { key: 'supervisors', isMap: false, write: writeSupervisors as never, read: readSupervisors },
  { key: 'stocks', isMap: false, write: writeStocks as never, read: readStocks },
  { key: 'sweepings', isMap: false, write: writeSweepings as never, read: readSweepings },
  { key: 'audits', isMap: false, write: writeAudits as never, read: readAudits },
  { key: 'constructionRules', isMap: true, write: writeConstructionRules as never, read: readConstructionRules },
  { key: 'customKhsPrices', isMap: true, write: writeKhsPrices as never, read: readKhsPrices },
  { key: 'materialCodeMap', isMap: true, write: writeMaterialCodeMap as never, read: readMaterialCodeMap },
];

export const SLICE_KEYS = SLICE_SPECS.map((s) => s.key);

export function findSlice(key: string): SliceSpec | undefined {
  return SLICE_SPECS.find((s) => s.key === key);
}

/** Baca semua slice sekali jalan untuk hidrasi awal. */
export async function readAllState(tx: Tx): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const spec of SLICE_SPECS) out[spec.key] = await spec.read(tx);
  return out;
}
