import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findSlice, SLICE_KEYS } from '@/lib/db/state';

// Method non-GET (POST) tidak pernah di-cache, dan dengan cacheComponents
// config `dynamic` tidak boleh ditulis di sini.

/**
 * Write-through: satu slice masuk, satu transaksi menimpa tabelnya.
 *
 * Nama slice divalidasi ke daftar izin (allowlist) -- pemanggil dari browser
 * tidak bisa menentukan tabel mana pun yang tidak terdaftar di sini.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Body bukan JSON valid.' }, { status: 400 });
  }

  const { slice, payload } = (body ?? {}) as { slice?: unknown; payload?: unknown };

  if (typeof slice !== 'string' || !SLICE_KEYS.includes(slice)) {
    return NextResponse.json(
      { success: false, message: `Slice tidak dikenal: ${String(slice)}` },
      { status: 400 }
    );
  }

  const spec = findSlice(slice)!;
  const expected = spec.isMap ? 'objek' : 'array';
  const given = Array.isArray(payload) ? 'array' : typeof payload;
  if (payload === null || payload === undefined || (spec.isMap ? given !== 'object' : given !== 'array')) {
    return NextResponse.json(
      { success: false, message: `Payload slice ${slice} seharusnya ${expected}, dapat ${given}.` },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction((tx) => spec.write(tx, payload as never), {
      maxWait: 15000,
      timeout: 30000,
    });
    return NextResponse.json({ success: true, slice, count: Array.isArray(payload) ? payload.length : undefined });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: `Gagal menyimpan slice ${slice}.`, error: String(error) },
      { status: 500 }
    );
  }
}
