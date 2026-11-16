'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import { PoleData } from '@/types';
import 'leaflet/dist/leaflet.css';

interface GeotagMapProps {
  poles: PoleData[];
  /** Bila diisi, tiang bisa digeser manual di peta (mode "Geser Tiang"). */
  onPoleMove?: (poleId: string, lat: number, lng: number) => void;
}

const isJtmPole = (pole: PoleData) => pole.networkType
  ? pole.networkType === 'JTM' || pole.networkType === 'SUTM'
  : !pole.id.startsWith('TR');

// Keep internal pole IDs for positioning and dragging; display the entered construction.
const getConstructionLabelHtml = (pole: PoleData, isTM: boolean) => {
  const construction = (isTM ? pole.tmConstruction : pole.trConstruction)?.trim() || '-';
  return construction
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getTileLayer = (L: typeof Leaflet, type: string) => {
  if (type === 'googleStreets') {
    return L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 21,
      crossOrigin: true,
      attribution: '© Google Maps',
    });
  } else if (type === 'esriSatellite') {
    return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      crossOrigin: true,
      attribution: '© Esri Satellite',
    });
  } else if (type === 'osm') {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
      attribution: '© OpenStreetMap',
    });
  } else {
    // Default: Google Satelit Hybrid (citra satelit asli + label jalan PLN)
    return L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 21,
      crossOrigin: true,
      attribution: '© Google Maps Satellite',
    });
  }
};

export const GeotagMap: React.FC<GeotagMapProps> = ({ poles, onPoleMove }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Leaflet.Marker[]>([]);
  const extraLayersRef = useRef<Leaflet.Layer[]>([]);
  const currentTileRef = useRef<Leaflet.TileLayer | null>(null);
  const currentTileTypeRef = useRef<string | null>(null);
  // Peta hanya di-fit ulang bila daftar tiang berubah, bukan saat tiang digeser.
  const fittedKeyRef = useRef<string | null>(null);
  const onPoleMoveRef = useRef(onPoleMove);
  // Marker tidak boleh dihapus saat sedang ditarik (autoPan Leaflet masih memakai ikonnya → error _leaflet_pos).
  const draggingRef = useRef(false);
  const pendingRebuildRef = useRef(false);
  const [rebuildTick, setRebuildTick] = useState(0);

  const [mapType, setMapType] = useState<'googleHybrid' | 'googleStreets' | 'esriSatellite' | 'osm'>('googleHybrid');
  const [showDistances, setShowDistances] = useState<boolean>(true);
  const [isDragMode, setIsDragMode] = useState<boolean>(false);
  const canDrag = Boolean(onPoleMove);
  const dragActive = canDrag && isDragMode;

  useEffect(() => {
    onPoleMoveRef.current = onPoleMove;
  }, [onPoleMove]);

  // Bersihkan instance peta saat komponen dilepas agar timer / animasi Leaflet tidak menyentuh DOM yang sudah hilang.
  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      currentTileRef.current = null;
      currentTileTypeRef.current = null;
      fittedKeyRef.current = null;
      markersRef.current = [];
      extraLayersRef.current = [];
      draggingRef.current = false;
    };
  }, []);

  const validPoles = useMemo(() => poles.filter((p) => p.lat !== null && p.lng !== null), [poles]);

  // Filter Tiang JTM & JTR
  const jtmPoles = useMemo(
    () => validPoles.filter(isJtmPole),
    [validPoles]
  );
  const jtrPoles = useMemo(
    () => validPoles.filter((p) => !isJtmPole(p)),
    [validPoles]
  );

  const totalJtmMeters = jtmPoles.reduce(
    (sum, p) => sum + (p.conductorLength ?? (p.a3cs ? parseFloat(p.a3cs) || 0 : 0)),
    0
  );
  const totalJtrMeters = jtrPoles.reduce(
    (sum, p) => sum + (p.conductorLength ?? (p.lvTwisted ? parseFloat(p.lvTwisted) || 0 : 0)),
    0
  );

  useEffect(() => {
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      // Tunda gambar ulang sampai tiang selesai ditarik
      if (draggingRef.current) {
        pendingRebuildRef.current = true;
        return;
      }

      // Initialize map if not yet done
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
        });
      }
      const map = mapInstanceRef.current;
      // Ganti layer hanya bila jenis peta berubah (hindari kedip saat tiang digeser)
      if (currentTileTypeRef.current !== mapType) {
        if (currentTileRef.current) map.removeLayer(currentTileRef.current);
        currentTileRef.current = getTileLayer(L, mapType).addTo(map);
        currentTileTypeRef.current = mapType;
      }

      // Clear existing markers & extra layers (polylines, distance badges)
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      extraLayersRef.current.forEach((layer) => map.removeLayer(layer));
      extraLayersRef.current = [];

      map.invalidateSize();

      if (validPoles.length > 0) {
        const latLngs: [number, number][] = [];
        const coordCountMap: Record<string, number> = {};
        const posMap: Record<string, [number, number]> = {};

        validPoles.forEach((p) => {
          let lat = p.lat!;
          let lng = p.lng!;
          const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;

          // Offset identical coordinates slightly so both markers remain visible
          if (coordCountMap[key]) {
            const count = coordCountMap[key];
            const angle = (count * Math.PI) / 3;
            const offsetDist = 0.00018 * count;
            lat = lat + Math.sin(angle) * offsetDist;
            lng = lng + Math.cos(angle) * offsetDist;
            coordCountMap[key] = count + 1;
          } else {
            coordCountMap[key] = 1;
          }

          const pos: [number, number] = [lat, lng];
          posMap[p.id] = pos;
          latLngs.push(pos);

          const isTM = isJtmPole(p);
          const isExisting = p.poleStatus === 'EXISTING' || (p.name || '').toLowerCase().includes('existing') || (p.note || '').toLowerCase().includes('eksisting') || (p.note || '').toLowerCase().includes('existing');

          const fullLabelText = getConstructionLabelHtml(p, isTM);
          const labelText = /\bgardu\b/i.test(fullLabelText) ? 'Gardu' : fullLabelText;

          let markerHtml = '';

          if (isExisting) {
            // Simbol Tiang Existing Standar PLN: Berwarna Hitam Pekat berbingkai putih/abu-abu
            markerHtml = `
              <div style="display:flex;flex-direction:column;align-items:center;cursor:${dragActive ? 'move' : 'pointer'};transform:translate(-50%,-50%);">
                <div style="
                  width: ${isTM ? '14px' : '12px'};
                  height: ${isTM ? '14px' : '12px'};
                  background: #0f172a;
                  border: 2px solid #ffffff;
                  box-shadow: 0 0 0 1.5px #000000, 0 0 8px rgba(0,0,0,0.8);
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                ">
                  <div style="width: 4px; height: 4px; background: #94a3b8; border-radius: 50%;"></div>
                </div>

                <div style="
                  margin-top: 2px;
                  font-family: 'Consolas', 'Courier New', monospace;
                  font-size: 9px;
                  font-weight: 900;
                  color: #e2e8f0;
                  background: rgba(15,23,42,0.85);
                  padding: 1px 4px;
                  border-radius: 3px;
                  border: 0.5px solid #475569;
                  white-space: nowrap;
                  line-height: 1;
                  letter-spacing: -0.2px;
                ">
                  ${labelText} (EX)
                </div>
              </div>
            `;
          } else {
            // Node Tiang Rencana Baru: Warna Merah (TM) atau Biru (TR) menyala
            markerHtml = `
              <div style="display:flex;flex-direction:column;align-items:center;cursor:${dragActive ? 'move' : 'pointer'};transform:translate(-50%,-50%);">
                <div style="
                  width: ${isTM ? '13px' : '11px'};
                  height: ${isTM ? '13px' : '11px'};
                  background: ${isTM ? '#e11d48' : '#0284c7'};
                  border: 2px solid #ffffff;
                  box-shadow: 0 0 0 1.5px #020617, 0 0 6px ${isTM ? '#ff0055' : '#00e5ff'};
                  border-radius: ${isTM ? '2px' : '50%'};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                ">
                  <div style="width: 3px; height: 3px; background: #ffffff; border-radius: 50%;"></div>
                </div>

                <div style="
                  margin-top: 2px;
                  font-family: 'Consolas', 'Courier New', monospace;
                  font-size: 9px;
                  font-weight: 900;
                  color: ${isTM ? '#ffe600' : '#38bdf8'};
                  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px #000;
                  white-space: nowrap;
                  line-height: 1;
                  letter-spacing: -0.2px;
                ">
                  ${labelText}
                </div>
              </div>
            `;
          }

          const poleIcon = L.divIcon({
            className: 'pln-compact-tag',
            html: markerHtml,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          const marker = L.marker(pos, { icon: poleIcon, draggable: dragActive, autoPan: dragActive }).addTo(map);
          if (dragActive) {
            marker.on('dragstart', () => {
              draggingRef.current = true;
            });
            marker.on('dragend', () => {
              draggingRef.current = false;
              const ll = marker.getLatLng();
              onPoleMoveRef.current?.(p.id, ll.lat, ll.lng);
              if (pendingRebuildRef.current) {
                pendingRebuildRef.current = false;
                setRebuildTick((t) => t + 1);
              }
            });
          }

          const specBadge = isTM
            ? `<span style="display:inline-block;padding:2px 6px;background:#eff6ff;color:#1d4ed8;font-weight:bold;font-size:10px;border-radius:4px;border:1px solid #bfdbfe">⚡ JTM • ${fullLabelText} • ${p.a3cs || '3x150 mm²'}</span>`
            : `<span style="display:inline-block;padding:2px 6px;background:#ecfdf5;color:#047857;font-weight:bold;font-size:10px;border-radius:4px;border:1px solid #a7f3d0">🔌 JTR • ${fullLabelText} • ${p.lvTwisted || 'JTR 70'}</span>`;

          const noteHtml = p.note
            ? `<div style="margin-top:6px;padding:5px 8px;background:#f8fafc;border-left:3px solid #64748b;border-radius:4px;font-size:11px;color:#334155"><b>Keterangan:</b> ${p.note}</div>`
            : '';

          const photoHtml = p.photo
            ? `<div style="margin-top:8px;text-align:center">
                <img src="${p.photo}" style="width:100%;max-height:110px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1;cursor:pointer" alt="${p.name}" />
                <span style="display:block;margin-top:4px;color:#1a56db;font-size:11px;font-weight:600">Dokumentasi Foto Lapangan</span>
               </div>`
            : '<div style="margin-top:5px;font-size:10px;color:#94a3b8;font-style:italic">📷 Belum ada foto terlampir</div>';

          marker.bindPopup(`
            <div style="min-width:210px;max-width:250px;font-family:sans-serif">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:4px">
                <span style="font-size:13px;font-weight:bold;color:#0f172a">${fullLabelText}</span>
                <span style="font-size:10px;font-weight:800;color:${isTM ? '#dc2626' : '#0284c7'}">${isTM ? 'JTM (TM)' : 'JTR (TR)'}</span>
              </div>
              <div style="margin-bottom:6px">${specBadge}</div>
              <div style="font-size:10px;color:#475569;font-family:monospace;background:#f1f5f9;padding:3px 6px;border-radius:4px;border:1px solid #cbd5e1;margin-bottom:4px">
                📍 GPS: ${p.lat!.toFixed(7)}, ${p.lng!.toFixed(7)}
              </div>
              ${noteHtml}
              ${photoHtml}
            </div>
          `);

          marker.bindTooltip(`<b>${fullLabelText}</b>`, {
            direction: 'top',
            offset: [0, -10],
          });

          markersRef.current.push(marker);
        });

        // ---------------------------------------------------------------------
        // FUNGSI PENGGAMBARAN JALUR & LABEL JARAK ANTAR TIANG
        // ---------------------------------------------------------------------
        const drawNetworkSegments = (netPoles: PoleData[], isTM: boolean, isCrossNetwork = false) => {
          if (netPoles.length < 2) return;
          const points: [number, number][] = [];

          for (let i = 0; i < netPoles.length; i++) {
            const p = netPoles[i];
            const pos = posMap[p.id];
            if (!pos) continue;
            points.push(pos);

            if (i > 0) {
              const prevP = netPoles[i - 1];
              const prevPos = posMap[prevP.id];
              if (!prevPos) continue;

              // Hitung jarak: Prioritas inputan survey (conductorLength / a3cs / lvTwisted), fallback jarak GPS
              const rawSurveyLen = p.conductorLength ?? (
                p.a3cs ? parseFloat(p.a3cs) : (
                  p.lvTwisted ? parseFloat(p.lvTwisted) : 0
                )
              );
              const gpsDist = Math.round(L.latLng(prevPos).distanceTo(L.latLng(pos)));
              // Cross-network connectors have no separate surveyed length.
              const distMeters = isCrossNetwork ? gpsDist : rawSurveyLen > 0 ? rawSurveyLen : (gpsDist > 0 ? gpsDist : (isTM ? 50 : 45));

              // Titik tengah antar 2 tiang untuk menaruh badge jarak
              const midLat = (prevPos[0] + pos[0]) / 2;
              const midLng = (prevPos[1] + pos[1]) / 2;

              if (showDistances) {
                // Konsep tulisan saja tanpa background (contoh: 50 m, 40 m)
                // Mengambang tepat di atas garis sehingga kabel di bawahnya tetap terlihat jelas tanpa perlu di-zoom
                const distHtml = `
                  <div style="
                    font-family: 'Consolas', 'Courier New', monospace, sans-serif;
                    font-size: 11px;
                    font-weight: 900;
                    color: ${isTM ? '#ffe600' : '#ffffff'};
                    text-shadow: -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 0 4px #000;
                    white-space: nowrap;
                    transform: translate(-50%, -135%);
                    pointer-events: auto;
                    cursor: pointer;
                    user-select: none;
                    background: transparent;
                    border: none;
                    padding: 0;
                  " title="Jarak bentangan: ${getConstructionLabelHtml(prevP, isJtmPole(prevP))} ➔ ${getConstructionLabelHtml(p, isJtmPole(p))} = ${distMeters} meter">
                    ${distMeters} m
                  </div>
                `;

                const distIcon = L.divIcon({
                  className: 'pln-span-distance-text',
                  html: distHtml,
                  iconSize: [0, 0],
                  iconAnchor: [0, 0],
                });

                const distMarker = L.marker([midLat, midLng], { icon: distIcon, interactive: true })
                  .bindTooltip(`<b>Jarak Bentangan (Span):</b><br/>${getConstructionLabelHtml(prevP, isJtmPole(prevP))} ➔ ${getConstructionLabelHtml(p, isJtmPole(p))}: <b>${distMeters} meter</b>`, {
                    direction: 'top',
                    offset: [0, -8],
                  })
                  .addTo(map);

                extraLayersRef.current.push(distMarker);
              }
            }
          }

          if (points.length > 1) {
            // Garis underlay gelap (casing) agar kontur jalur sangat menonjol di atas peta satelit tanpa perlu di-zoom
            const casingLine = L.polyline(points, {
              color: '#020617',
              weight: isTM ? 6 : 5.5,
              opacity: 0.95,
              dashArray: isCrossNetwork ? '8, 8' : undefined,
              lineCap: isCrossNetwork ? 'butt' : 'round',
            }).addTo(map);
            extraLayersRef.current.push(casingLine);

            // Garis utama tebal & kontras tinggi (solid vibrant line)
            const line = L.polyline(points, {
              color: isTM ? '#f43f5e' : '#0284c7',
              weight: isTM ? 3.8 : 3.4,
              opacity: 1,
              dashArray: isCrossNetwork ? '8, 8' : undefined,
              lineCap: isCrossNetwork ? 'butt' : 'round',
            }).addTo(map);
            extraLayersRef.current.push(line);
          }
        };

        // Gambar JTM
        drawNetworkSegments(jtmPoles, true);

        // Gambar JTR
        drawNetworkSegments(jtrPoles, false);

        // Follow survey order; each cross-network connection uses its starting pole's color.
        for (let i = 1; i < validPoles.length; i++) {
          const from = validPoles[i - 1];
          const to = validPoles[i];
          if (isJtmPole(from) !== isJtmPole(to)) {
            drawNetworkSegments([from, to], isJtmPole(from), true);
          }
        }

        const fitKey = validPoles.map((p) => p.id).join('|');
        if (fittedKeyRef.current !== fitKey) {
          map.fitBounds(L.latLngBounds(latLngs), { padding: [35, 35], maxZoom: 18 });
          fittedKeyRef.current = fitKey;
        }
      } else {
        map.setView([-6.12, 106.15], 13);
        fittedKeyRef.current = null;
      }

      // Ensure leaflet recalculates container size immediately after mounting in modal tab
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    });

    return () => {
      isMounted = false;
    };
  }, [validPoles, jtmPoles, jtrPoles, mapType, showDistances, dragActive, rebuildTick]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800">Visualisasi Peta Geotagging Tiang & Jarak Bentangan</span>
            <p className="text-[11px] text-slate-500">
              {validPoles.length} dari {poles.length} titik tiang terpetakan dengan jarak gawang
            </p>
          </div>

          {/* Legend Badges with Total Length & Status */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-900 text-slate-100 border border-slate-700 shadow-2xs font-mono">
              <span className="w-2.5 h-2.5 bg-slate-900 border-2 border-white rounded-full shadow-xs"></span>
              <span>Existing (Hitam)</span>
            </span>
            {jtmPoles.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-white text-rose-700 border border-rose-200 shadow-2xs font-mono">
                <span className="w-2.5 h-2.5 bg-rose-600 border border-cyan-400 rounded-[2px] shadow-xs"></span>
                <span>Rencana JTM ({totalJtmMeters} m)</span>
              </span>
            )}
            {jtrPoles.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-white text-sky-700 border border-sky-200 shadow-2xs font-mono">
                <span className="w-2.5 h-2.5 bg-sky-600 border border-emerald-400 rounded-[2px] shadow-xs"></span>
                <span>Rencana JTR ({totalJtrMeters} m)</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Mode Geser Tiang (hanya bila halaman induk mengizinkan) */}
          {canDrag && (
            <button
              type="button"
              onClick={() => setIsDragMode(!isDragMode)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                isDragMode
                  ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
              title="Aktifkan lalu tarik titik tiang di peta untuk memindahkan posisinya secara manual"
            >
              <span>✋ Geser Tiang:</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${isDragMode ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {isDragMode ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* Toggle Button Jarak Tiang */}
          <button
            type="button"
            onClick={() => setShowDistances(!showDistances)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
              showDistances
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
            title="Klik untuk menyembunyikan atau menampilkan label jarak antar tiang"
          >
            <span>📏 Jarak Tiang:</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${showDistances ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {showDistances ? 'ON' : 'OFF'}
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-500 font-medium">Layer Peta:</label>
            <select
              value={mapType}
              onChange={(e) => setMapType(e.target.value as typeof mapType)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="googleHybrid">🛰️ Google Satelit (Hybrid)</option>
              <option value="googleStreets">🗺️ Google Maps (Jalan)</option>
              <option value="esriSatellite">🌍 Esri Satelit HD</option>
              <option value="osm">🌐 OpenStreetMap</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[500px] md:h-[540px] bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
        {dragActive && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1000 px-3 py-1.5 rounded-lg bg-amber-500/95 text-white text-[11px] font-bold shadow-md pointer-events-none">
            Mode Geser Tiang aktif — tarik titik tiang ke posisi yang benar, koordinat GPS ikut diperbarui
          </div>
        )}
      </div>
    </div>
  );
};
