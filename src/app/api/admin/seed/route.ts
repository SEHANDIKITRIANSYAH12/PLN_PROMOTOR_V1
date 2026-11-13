import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SLICE_SPECS } from '@/lib/db/state';
import {
  SEED_SURVEYS, SEED_DAFTUNGS, SEED_WORK_ORDERS, SEED_RESERVATION_TX, SEED_PICKUP_TX,
  SEED_VENDORS, SEED_CONTRACTS, SEED_MATERIAL_CONTRACTS, SEED_SUPERVISORS, SEED_STOCKS,
  SEED_AUDITS, SEED_SWEEPINGS, SEED_CONSTRUCTION_RULES, SEED_KHS_PRICES,
  SEED_MATERIAL_CODE_MAP,
} from '@/data/seedData';

// POST handler: tidak di-cache, dan config `dynamic` tidak berlaku di
// Next.js dengan cacheComponents.

/**
 * Peta slice -> data seed. Sumbernya file yang sama dengan nilai awal store,
 * jadi seed di database dan seed in-memory tidak bisa berbeda.
 */
const SEED_BY_SLICE: Record<string, unknown> = {
  surveys: SEED_SURVEYS,
  daftungs: SEED_DAFTUNGS,
  workOrders: SEED_WORK_ORDERS,
  reservationTransactions: SEED_RESERVATION_TX,
  vendorPickupTransactions: SEED_PICKUP_TX,
  vendors: SEED_VENDORS,
  contracts: SEED_CONTRACTS,
  materialContracts: SEED_MATERIAL_CONTRACTS,
  supervisors: SEED_SUPERVISORS,
  stocks: SEED_STOCKS,
  sweepings: SEED_SWEEPINGS,
  audits: SEED_AUDITS,
  constructionRules: SEED_CONSTRUCTION_RULES,
  customKhsPrices: SEED_KHS_PRICES,
  materialCodeMap: SEED_MATERIAL_CODE_MAP,
};

/**
 * Isi ulang database dari seed.
 *
 *   POST {}                    -> timpa total (dipakai tombol reset)
 *   POST { "ifEmpty": true }   -> hanya isi bila tabel Survey masih kosong
 *
 * Mode kedua itu yang dipakai aplikasi saat pertama kali bertemu database
 * kosong, supaya data hasil kerja pengguna tidak pernah tertimpa diam-diam.
 */
export async function POST(req: Request) {
  let ifEmpty = false;
  try {
    const body = (await req.json()) as { ifEmpty?: unknown };
    ifEmpty = body?.ifEmpty === true;
  } catch {
    // Body kosong diperbolehkan: artinya timpa total.
  }

  try {
    if (ifEmpty) {
      const ada = await prisma.survey.count();
      if (ada > 0) {
        return NextResponse.json({
          success: true,
          skipped: true,
          message: `Database sudah berisi ${ada} survey; seed tidak dijalankan.`,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      // Anak ikut terhapus lewat onDelete: Cascade, jadi cukup induknya.
      for (const spec of SLICE_SPECS) {
        await spec.write(tx, SEED_BY_SLICE[spec.key] as never);
      }
    });

    return NextResponse.json({
      success: true,
      skipped: false,
      message: `Seed dimuat ke database: ${SEED_SURVEYS.length} survey, ${SEED_STOCKS.length} material, ${SEED_CONTRACTS.length} kontrak.`,
      counts: {
        surveys: SEED_SURVEYS.length,
        workOrders: SEED_WORK_ORDERS.length,
        stocks: SEED_STOCKS.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal memuat seed ke database.', error: String(error) },
      { status: 500 }
    );
  }
}
