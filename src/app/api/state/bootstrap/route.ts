import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readAllState } from '@/lib/db/state';

// Config `dynamic` tidak dipakai: dengan cacheComponents, GET handler sudah
// berjalan pada saat request dan build tidak akan mem-prerender route ini
// karena ia mengakses database. Menulis `export const dynamic` justru error.

/**
 * Titik masuk hidrasi: kembalikan seluruh state aplikasi dari PostgreSQL.
 * Kalau database tidak terjangkau, balas 503 supaya sisi klien tahu ia
 * harus lanjut dengan seed in-memory (aplikasi tidak boleh mati).
 */
export async function GET() {
  try {
    const state = await prisma.$transaction((tx) => readAllState(tx));
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Database belum terjangkau; aplikasi lanjut memakai seed in-memory.',
        error: String(error),
      },
      { status: 503 }
    );
  }
}
