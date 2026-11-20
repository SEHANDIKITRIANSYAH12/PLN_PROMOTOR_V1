'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Printer, X, Plus, Trash2, ClipboardCheck, Check, Save, PenTool, FileSpreadsheet } from 'lucide-react';
import { WorkOrderRecord, VendorPickupTransaction, SweepingMaterialItem } from '@/types';
import { generateWorkTitlePln } from '@/data/surveyRabCalculator';
import { usePromotorStore } from '@/store/usePromotorStore';
import { SignaturePadModal } from './SignaturePadModal';
import { exportSweepingToExcel } from '@/lib/exportSweepingExcel';

interface Props {
  wo: WorkOrderRecord;
  transactions: VendorPickupTransaction[];
  onClose: () => void;
}

interface PickRow {
  vol: number;
  ref: string;
}
interface InstalledRow {
  vol: number;
  ket: string;
}
interface ReturRow {
  vol: number;
  tug10: string;
  ket: string;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

export const SweepingWoModal: React.FC<Props> = ({ wo, transactions, onClose }) => {
  const { addSweeping, sweepings, showToast } = usePromotorStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [vendorSignerName, setVendorSignerName] = useState('ADI CANDRA');
  const [vendorSignature, setVendorSignature] = useState<string | null>('DEFAULT');
  const [isSigPadOpen, setIsSigPadOpen] = useState(false);

  // Baris pengambilan per material: otomatis dari Surat Jalan / transaksi pengambilan vendor (urut lama -> baru)
  const baseRows = useMemo(() => {
    const woTx = transactions.filter((t) => t.woId === wo.id).slice().reverse();
    const sjList = (wo.suratJalanList || []).slice().reverse();

    return (wo.materials || [])
      .filter((m) => !m.isHold && ((m.qtyTaken || 0) > 0))
      .map((m) => {
        const picks: PickRow[] = [];
        sjList.forEach((sj) => {
          const it = (sj.items || []).find((i) => i.material === m.material);
          if (it && it.qtyTaken > 0) {
            picks.push({ vol: it.qtyTaken, ref: sj.reservationNumber || sj.suratJalanNumber });
          }
        });
        if (picks.length === 0) {
          woTx.forEach((tx) => {
            const it = tx.items.find((i) => i.material === m.material);
            if (it && it.qtyTakenCurrent > 0) {
              picks.push({ vol: it.qtyTakenCurrent, ref: tx.reservationNumber || tx.suratJalanNumber });
            }
          });
        }
        if (picks.length === 0) {
          picks.push({ vol: m.qtyTaken || 0, ref: wo.reservationNumber || wo.suratJalanNumber || '-' });
        }

        return { material: m.material, unit: (m.unit || 'SET').toUpperCase(), picks };
      });
  }, [wo, transactions]);

  // Baris material terpasang - bisa diedit vendor
  const [installedMap, setInstalledMap] = useState<Record<string, InstalledRow[]>>(() => {
    const init: Record<string, InstalledRow[]> = {};
    const woTx = transactions.filter((t) => t.woId === wo.id).slice().reverse();
    const sjList = (wo.suratJalanList || []).slice().reverse();

    (wo.materials || [])
      .filter((m) => !m.isHold && ((m.qtyTaken || 0) > 0))
      .forEach((m) => {
        const picks: number[] = [];
        sjList.forEach((sj) => {
          const it = (sj.items || []).find((i) => i.material === m.material);
          if (it && it.qtyTaken > 0) picks.push(it.qtyTaken);
        });
        if (picks.length === 0) {
          woTx.forEach((tx) => {
            const it = tx.items.find((i) => i.material === m.material);
            if (it && it.qtyTakenCurrent > 0) picks.push(it.qtyTakenCurrent);
          });
        }
        if (picks.length === 0) {
          picks.push(m.qtyTaken || 0);
        }

        const totalPickVol = picks.reduce((s, p) => s + p, 0);
        const installedTotal =
          m.qtyInstalled !== undefined ? m.qtyInstalled : Math.max(0, totalPickVol - (m.qtyReturned || 0));
        let remain = installedTotal;
        init[m.material] = picks.map((p) => {
          const v = Math.min(p, remain);
          remain -= v;
          return { vol: v, ket: '' };
        });
      });
    return init;
  });

  const updateInstalled = (mat: string, idx: number, patch: Partial<InstalledRow>) =>
    setInstalledMap((p) => {
      const cur = p[mat] ? [...p[mat]] : [];
      while (cur.length <= idx) cur.push({ vol: 0, ket: '' });
      cur[idx] = { ...cur[idx], ...patch };
      return { ...p, [mat]: cur };
    });

  const addInstalled = (mat: string) =>
    setInstalledMap((p) => ({ ...p, [mat]: [...(p[mat] || []), { vol: 1, ket: '' }] }));

  const removeInstalled = (mat: string, idx: number) =>
    setInstalledMap((p) => ({ ...p, [mat]: (p[mat] || []).filter((_, i) => i !== idx) }));

  // Baris dikembalikan (TUG 10) - bisa diedit vendor
  const [returs, setReturs] = useState<Record<string, ReturRow[]>>(() => {
    const init: Record<string, ReturRow[]> = {};
    (wo.materials || []).forEach((m) => {
      const r = m.qtyReturned || 0;
      init[m.material] = r > 0 ? [{ vol: r, tug10: wo.slipReturNumber || '', ket: 'SISA MATERIAL' }] : [];
    });
    return init;
  });

  const updateRetur = (mat: string, idx: number, patch: Partial<ReturRow>) =>
    setReturs((p) => ({ ...p, [mat]: (p[mat] || []).map((r, i) => (i === idx ? { ...r, ...patch } : r)) }));
  const addRetur = (mat: string) =>
    setReturs((p) => ({ ...p, [mat]: [...(p[mat] || []), { vol: 1, tug10: '', ket: 'BONGKARAN' }] }));
  const removeRetur = (mat: string, idx: number) =>
    setReturs((p) => ({ ...p, [mat]: (p[mat] || []).filter((_, i) => i !== idx) }));

  const title = useMemo(() => {
    const paket = wo.category === 'WO Tiang' ? 'tiang' : wo.category === 'WO Paket 2' ? 'paket2' : 'paket1';
    try {
      const t = generateWorkTitlePln(wo, paket);
      if (t && t !== '-') return t;
    } catch {
      /* fallback */
    }
    return `PEKERJAAN ${wo.customerName}`;
  }, [wo]);

  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();

  const handlePrint = () => {
    if (!printRef.current) return;
    // Sinkronkan nilai input ke atribut agar ikut tercetak
    printRef.current.querySelectorAll('input').forEach((inp) => inp.setAttribute('value', inp.value));
    const html = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<html><head><title>Sweeping Material ${wo.noWorkOrder || wo.id}</title>
<style>
@page { size: A4 landscape; margin: 10mm; }
body { font-family: Arial, sans-serif; font-size: 10px; color: #000; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #000; padding: 3px 4px; text-align: center; }
td.l, th.l { text-align: left; }
tr.sub td { background: #d9d9d9; font-weight: bold; }
.meta div { margin: 1px 0; }
.title { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px; }
.noprint { display: none; }
input { border: none; background: transparent; font-size: 10px; width: 100%; text-align: center; }
</style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const handleSaveToStore = () => {
    const items: SweepingMaterialItem[] = [];
    baseRows.forEach((b) => {
      const rr = returs[b.material] || [];
      const instList = installedMap[b.material] || [];
      const n = Math.max(b.picks.length, instList.length, rr.length, 1);
      for (let i = 0; i < n; i++) {
        const p = b.picks[i];
        const inst = instList[i];
        const r = rr[i];
        items.push({
          id: `item-${b.material}-${i}-${Date.now()}`,
          material: b.material,
          volPengambilan: p ? p.vol : 0,
          satPengambilan: b.unit,
          noTug9: p ? p.ref : '—',
          ketPengambilan: p ? fmt(p.vol) : '—',
          volTerpasang: inst ? inst.vol : 0,
          satTerpasang: b.unit,
          ketTerpasang: inst?.ket || (inst && inst.vol > 0 ? 'Terpasang Normal' : '—'),
          volDikembalikan: r ? r.vol : 0,
          satDikembalikan: b.unit,
          noTug10: r ? r.tug10 : '—',
          ketDikembalikan: r ? r.ket : '—',
        });
      }
    });

    const count = sweepings.length + 1;
    const nomorSweeping = `SWP/UP3-BTS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(count).padStart(3, '0')}`;

    addSweeping({
      nomorSweeping,
      namaPekerjaan: title,
      noSpk: wo.spkNumber || '—',
      tanggal: today,
      lokasi: `UP3 BANTEN SELATAN${wo.location ? ` — ${wo.location}` : ''}`,
      pelaksana: wo.vendor,
      woIds: [wo.id],
      items,
      status: 'DRAFT',
      catatan: `Dokumen Sweeping Material otomatis dari WO ${wo.noWorkOrder || wo.id}`,
      ttdVendorName: vendorSignerName,
      ttdPengawasName: '',
      ttdGudangName: '',
    });

    setIsSaved(true);
    showToast(`✓ Dokumen Sweeping ${nomorSweeping} berhasil disimpan ke arsip Sweeping Material!`);
  };

  const handleExportExcel = () => {
    const items = baseRows.map((b) => {
      const rr = returs[b.material] || [];
      const instList = installedMap[b.material] || [];
      return {
        material: b.material,
        unit: b.unit,
        picks: b.picks.map((p) => ({ vol: p.vol, ref: p.ref, ket: fmt(p.vol) })),
        installed: instList.map((inst) => ({
          vol: inst.vol,
          ket: inst.ket || (inst.vol > 0 ? 'Terpasang Normal' : '—'),
        })),
        returs: rr.map((r) => ({ vol: r.vol, tug10: r.tug10, ket: r.ket })),
      };
    });

    exportSweepingToExcel(
      {
        title,
        namaPekerjaan: title,
        noSpk: wo.spkNumber || '—',
        tanggal: today,
        lokasi: `UP3 BANTEN SELATAN${wo.location ? ` — ${wo.location}` : ''}`,
        pelaksana: wo.vendor || 'PT HILMAN PRIMA PERKASA',
        items,
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
            nama: '',
          },
          pelaksana: {
            perusahaan: wo.vendor || 'PT HILMAN PRIMA PERKASA',
            jabatan: 'DIREKTUR',
            nama: vendorSignerName || 'ADI CANDRA',
          },
        },
      },
      `SWEEPING_MATERIAL_${(wo.noWorkOrder || wo.id).replace(/[^a-zA-Z0-9_-]/g, '_')}`
    );
    showToast('✓ Berhasil mengunduh dokumen Sweeping Material ke format Excel (.xlsx)!');
  };

  let totalPick = 0;
  let totalInst = 0;
  let totalRet = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs">
              Sweeping Material (Otomatis) — WO {wo.noWorkOrder || wo.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaved}
              onClick={handleSaveToStore}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isSaved
                  ? 'bg-emerald-800 text-emerald-200 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Tersimpan ke Arsip' : 'Simpan Sweeping'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer text-white shadow-xs transition"
              title="Unduh format tabel resmi ke Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Cetak Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer text-white shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-white/70 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-[11px] text-emerald-900">
          Dokumen terbentuk otomatis dari pengambilan material (TUG 9), realisasi terpasang, dan retur WO ini. Kolom{' '}
          <b>Material Terpasang</b> dan <b>Material Dikembalikan</b> dapat disesuaikan bila ada retur/bongkaran.
        </div>

        <div className="overflow-auto p-5 flex-1">
          <div ref={printRef}>
            <div className="title text-center font-bold text-base mb-3 uppercase">SWEEPING MATERIAL</div>
            <div className="meta text-xs mb-3 space-y-0.5">
              <div><span className="inline-block w-32">NAMA PEKERJAAN</span>: <b className="uppercase">{title}</b></div>
              <div><span className="inline-block w-32">NO SPK</span>: <b>{wo.spkNumber || '-'}</b></div>
              <div><span className="inline-block w-32">TANGGAL</span>: {today}</div>
              <div><span className="inline-block w-32">LOKASI</span>: UP3 BANTEN SELATAN{wo.location ? ` — ${wo.location}` : ''}</div>
              <div><span className="inline-block w-32">PELAKSANA</span>: <b className="uppercase">{wo.vendor}</b></div>
            </div>

            <table className="w-full border-collapse text-[10px] text-center border border-black">
              <thead>
                <tr className="bg-slate-100 font-bold uppercase">
                  <th rowSpan={3} className="border border-black p-1 w-8">NO</th>
                  <th rowSpan={3} className="l border border-black p-1 text-left min-w-[200px]">JENIS MATERIAL</th>
                  <th colSpan={4} className="border border-black p-1">MATERIAL PENGAMBILAN</th>
                  <th colSpan={3} className="border border-black p-1">MATERIAL TERPASANG</th>
                  <th colSpan={4} className="border border-black p-1">MATERIAL DIKEMBALIKAN</th>
                </tr>
                <tr className="bg-slate-100 font-bold uppercase">
                  <th rowSpan={2} className="border border-black p-1 w-10">VOL</th>
                  <th rowSpan={2} className="border border-black p-1 w-10">SAT</th>
                  <th colSpan={2} className="border border-black p-1">RESERVASI/TUG 9</th>
                  <th rowSpan={2} className="border border-black p-1 w-10">VOL</th>
                  <th rowSpan={2} className="border border-black p-1 w-10">SAT</th>
                  <th rowSpan={2} className="border border-black p-1">KETERANGAN</th>
                  <th rowSpan={2} className="border border-black p-1 w-10">VOL</th>
                  <th rowSpan={2} className="border border-black p-1 w-10">SAT</th>
                  <th colSpan={2} className="border border-black p-1">RESERVASI/TUG 10</th>
                </tr>
                <tr className="bg-slate-100 font-bold uppercase">
                  <th className="border border-black p-1 min-w-[120px]">NOMOR</th>
                  <th className="border border-black p-1 w-14">KETERANGAN</th>
                  <th className="border border-black p-1 min-w-[120px]">NOMOR</th>
                  <th className="border border-black p-1 min-w-[90px]">KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                {baseRows.length === 0 && (
                  <tr>
                    <td colSpan={13} className="border border-black p-4 text-slate-400 italic">
                      Belum ada material yang diambil pada WO ini.
                    </td>
                  </tr>
                )}
                {baseRows.map((b, mi) => {
                  const instList = installedMap[b.material] || [];
                  const rr = returs[b.material] || [];
                  const n = Math.max(b.picks.length, instList.length, rr.length, 1);
                  const sumPick = b.picks.reduce((s, p) => s + p.vol, 0);
                  const sumInst = instList.reduce((s, row) => s + (Number(row.vol) || 0), 0);
                  const sumRet = rr.reduce((s, r) => s + (Number(r.vol) || 0), 0);
                  totalPick += sumPick;
                  totalInst += sumInst;
                  totalRet += sumRet;
                  return (
                    <React.Fragment key={b.material}>
                      {Array.from({ length: n }).map((_, i) => {
                        const p = b.picks[i];
                        const inst = instList[i];
                        const r = rr[i];
                        return (
                          <tr key={i}>
                            {i === 0 && (
                              <>
                                <td rowSpan={n + 1} className="border border-black p-1 align-top font-bold">{mi + 1}</td>
                                <td rowSpan={n + 1} className="l border border-black p-1 text-left align-top font-semibold uppercase">
                                  {b.material}
                                </td>
                              </>
                            )}
                            <td className="border border-black p-1 font-mono">{p ? fmt(p.vol) : ''}</td>
                            <td className="border border-black p-1">{p ? b.unit : ''}</td>
                            <td className="border border-black p-1 font-mono text-[9px]">{p ? p.ref : ''}</td>
                            <td className="border border-black p-1">{p ? fmt(p.vol) : ''}</td>
                            <td className="border border-black p-1 font-mono">
                              {p || inst ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={inst ? inst.vol : 0}
                                  onChange={(e) => updateInstalled(b.material, i, { vol: Number(e.target.value) || 0 })}
                                  className="w-12 text-center border border-slate-200 rounded font-mono"
                                />
                              ) : ''}
                            </td>
                            <td className="border border-black p-1">{p || inst ? b.unit : ''}</td>
                            <td className="border border-black p-1">
                              {p || inst ? (
                                <span className="inline-flex items-center gap-1 w-full">
                                  <input
                                    type="text"
                                    value={inst ? inst.ket : ''}
                                    onChange={(e) => updateInstalled(b.material, i, { ket: e.target.value.toUpperCase() })}
                                    placeholder="—"
                                    className="w-full text-center text-[9px] border border-slate-200 rounded"
                                  />
                                  {instList.length > b.picks.length && i >= b.picks.length && (
                                    <button
                                      type="button"
                                      onClick={() => removeInstalled(b.material, i)}
                                      className="noprint text-rose-500 cursor-pointer"
                                      title="Hapus baris terpasang"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </span>
                              ) : ''}
                            </td>
                            <td className="border border-black p-1 font-mono">
                              {r ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={r.vol}
                                  onChange={(e) => updateRetur(b.material, i, { vol: Number(e.target.value) || 0 })}
                                  className="w-12 text-center border border-slate-200 rounded"
                                />
                              ) : ''}
                            </td>
                            <td className="border border-black p-1">{r ? b.unit : ''}</td>
                            <td className="border border-black p-1">
                              {r ? (
                                <input
                                  type="text"
                                  value={r.tug10}
                                  onChange={(e) => updateRetur(b.material, i, { tug10: e.target.value })}
                                  placeholder="No. TUG 10"
                                  className="w-full text-center font-mono text-[9px] border border-slate-200 rounded"
                                />
                              ) : ''}
                            </td>
                            <td className="border border-black p-1">
                              {r ? (
                                <span className="inline-flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={r.ket}
                                    onChange={(e) => updateRetur(b.material, i, { ket: e.target.value.toUpperCase() })}
                                    className="w-20 text-center text-[9px] border border-slate-200 rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeRetur(b.material, i)}
                                    className="noprint text-rose-500 cursor-pointer"
                                    title="Hapus baris"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </span>
                              ) : ''}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="sub bg-slate-300 font-bold">
                        <td className="border border-black p-1 font-mono">{fmt(sumPick)}</td>
                        <td className="border border-black p-1">{b.unit}</td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1 font-mono">{fmt(sumInst)}</td>
                        <td className="border border-black p-1">{b.unit}</td>
                        <td className="border border-black p-1">
                          <button
                            type="button"
                            onClick={() => addInstalled(b.material)}
                            className="noprint text-[9px] font-bold text-emerald-700 inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> baris pasang
                          </button>
                        </td>
                        <td className="border border-black p-1 font-mono">{fmt(sumRet)}</td>
                        <td className="border border-black p-1">{b.unit}</td>
                        <td className="border border-black p-1" colSpan={2}>
                          <button
                            type="button"
                            onClick={() => addRetur(b.material)}
                            className="noprint text-[9px] font-bold text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> baris retur / bongkaran
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                {baseRows.length > 0 && (
                  <tr className="sub bg-slate-200 font-black">
                    <td colSpan={2} className="border border-black p-1.5 text-right">TOTAL VOLUME :</td>
                    <td className="border border-black p-1.5 font-mono">{fmt(totalPick)}</td>
                    <td colSpan={3} className="border border-black p-1.5"></td>
                    <td className="border border-black p-1.5 font-mono">{fmt(totalInst)}</td>
                    <td colSpan={2} className="border border-black p-1.5"></td>
                    <td className="border border-black p-1.5 font-mono">{fmt(totalRet)}</td>
                    <td colSpan={3} className="border border-black p-1.5"></td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Tanda Tangan 4 Penanggung Jawab Sesuai Format Resmi PLN */}
            <div className="grid grid-cols-4 gap-4 text-center text-[10.5px] mt-8 pt-2">
              {/* 1. Direksi Pekerjaan (PLN) - Nama diisi nanti oleh Pengawas */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="font-semibold">Direksi Pekerjaan</div>
                  <div className="text-[10px] text-slate-700">UP3 Banten Selatan</div>
                  <div className="text-[10px] font-bold">Asisten Manager Jaringan</div>
                </div>
                <div className="h-20 flex items-center justify-center my-1">
                  <span className="noprint text-[9px] text-slate-400 italic">
                    (Diisi Pengawas)
                  </span>
                </div>
                <div>
                  <div className="border-b border-black w-36 mx-auto" />
                  <div className="h-4 mt-1" />
                </div>
              </div>

              {/* 2. Pemeriksa (TL Logistik UP3) - Nama diisi nanti oleh Pengawas */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="font-semibold">Pemeriksa</div>
                  <div className="text-[10px] text-slate-700">UP3 Banten Selatan</div>
                  <div className="text-[10px] font-bold">TL Logistik</div>
                </div>
                <div className="h-20 flex items-center justify-center my-1">
                  <span className="noprint text-[9px] text-slate-400 italic">
                    (Diisi Pengawas)
                  </span>
                </div>
                <div>
                  <div className="border-b border-black w-36 mx-auto" />
                  <div className="h-4 mt-1" />
                </div>
              </div>

              {/* 3. Direksi Pengawas (TL Pemeliharaan / Konstruksi) - Nama diisi nanti oleh Pengawas */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="font-semibold">Direksi Pengawas</div>
                  <div className="text-[10px] text-slate-700">UP3 Banten Selatan</div>
                  <div className="text-[10px] font-bold">TL Pemeliharaan</div>
                </div>
                <div className="h-20 flex items-center justify-center my-1">
                  <span className="noprint text-[9px] text-slate-400 italic">
                    (Diisi Pengawas)
                  </span>
                </div>
                <div>
                  <div className="border-b border-black w-36 mx-auto" />
                  <div className="h-4 mt-1" />
                </div>
              </div>

              {/* 4. Pelaksana (Vendor Pelaksana - Bertanda Tangan & Nama Bisa Diganti) */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="font-semibold">Pelaksana</div>
                  <div className="text-[10px] font-bold uppercase truncate px-1">
                    {wo.vendor || 'PT HAFIZH PUTRA PERKASA'}
                  </div>
                  <div className="text-[10px] font-bold">DIREKTUR</div>
                </div>

                <div className="relative h-20 flex items-center justify-center my-1">
                  {vendorSignature ? (
                    <div className="relative flex items-center justify-center">
                      {vendorSignature === 'DEFAULT' ? (
                        /* Goresan TTD Biru Default Vendor */
                        <svg
                          className="w-24 h-14 text-blue-900"
                          viewBox="0 0 100 55"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10,40 C18,8 24,46 34,14 C40,6 46,38 56,18 C62,10 68,28 86,22 M38,26 Q50,6 68,10 C78,16 76,38 64,40 C50,42 54,18 66,22" />
                        </svg>
                      ) : (
                        <img
                          src={vendorSignature}
                          alt="Tanda Tangan Vendor"
                          className="h-16 max-w-[130px] object-contain"
                        />
                      )}

                      {/* Stempel Cap Bulat Biru Vendor */}
                      <div className="absolute -right-3 -top-1 w-16 h-16 rounded-full border-2 border-blue-600/75 border-dashed flex flex-col items-center justify-center text-[6px] font-black text-blue-700 uppercase rotate-[-12deg] pointer-events-none select-none bg-blue-50/25">
                        <span className="text-[5px] tracking-tighter truncate max-w-[52px]">
                          {wo.vendor?.slice(0, 20) || 'REKANAN'}
                        </span>
                        <span className="text-[7.5px] font-black text-blue-800">DISETUJUI</span>
                        <span className="text-[5.5px]">DIREKTUR</span>
                      </div>

                      {/* Tombol ganti/gambar tanda tangan vendor */}
                      <button
                        type="button"
                        onClick={() => setIsSigPadOpen(true)}
                        className="noprint absolute -bottom-1.5 bg-white/95 hover:bg-blue-50 text-blue-700 border border-blue-300 rounded px-1.5 py-0.5 text-[8px] font-bold shadow-xs cursor-pointer transition flex items-center gap-0.5"
                        title="Klik untuk menggambar / mengganti tanda tangan vendor"
                      >
                        <PenTool className="w-2.5 h-2.5" />
                        <span>Ganti TTD</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSigPadOpen(true)}
                      className="noprint px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      <PenTool className="w-3 h-3" />
                      <span>Goreskan TTD</span>
                    </button>
                  )}
                </div>

                <div>
                  <div className="border-b border-black w-36 mx-auto" />
                  <div className="mt-1">
                    <input
                      type="text"
                      value={vendorSignerName}
                      onChange={(e) => setVendorSignerName(e.target.value.toUpperCase())}
                      className="font-bold underline uppercase text-center w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1 py-0.5 text-[10.5px] tracking-tight transition"
                      placeholder="NAMA PENANGGUNG JAWAB VENDOR"
                      title="Klik untuk mengubah nama penanggung jawab vendor"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal untuk Vendor */}
      {isSigPadOpen && (
        <SignaturePadModal
          isOpen={isSigPadOpen}
          onClose={() => setIsSigPadOpen(false)}
          title={`Tanda Tangan Penanggung Jawab Vendor (${wo.vendor})`}
          initialName={vendorSignerName}
          initialRole="DIREKTUR"
          initialSignature={vendorSignature && vendorSignature !== 'DEFAULT' ? vendorSignature : undefined}
          signerType="creator"
          onSave={(sigDataUrl, name) => {
            setVendorSignature(sigDataUrl);
            if (name) setVendorSignerName(name.toUpperCase());
            setIsSigPadOpen(false);
            showToast('✓ Tanda tangan & nama penanggung jawab vendor berhasil diperbarui');
          }}
        />
      )}
    </div>
  );
};
