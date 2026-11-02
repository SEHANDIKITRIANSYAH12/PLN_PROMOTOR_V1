'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PoleData } from '@/types';
import 'leaflet/dist/leaflet.css';

interface GeotagMapProps {
  poles: PoleData[];
  onViewPhoto?: (photoUrl: string, title: string, caption: string) => void;
}

export const GeotagMap: React.FC<GeotagMapProps> = ({ poles, onViewPhoto }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const extraLayersRef = useRef<any[]>([]);
  const currentTileRef = useRef<any>(null);

  const [mapType, setMapType] = useState<'googleHybrid' | 'googleStreets' | 'esriSatellite' | 'osm'>('googleHybrid');
  const [showDistances, setShowDistances] = useState<boolean>(true);

  const validPoles = poles.filter((p) => p.lat !== null && p.lng !== null);

  // Filter Tiang JTM & JTR
  const jtmPoles = validPoles.filter(
    (p) => p.networkType === 'JTM' || p.networkType === 'SUTM' || p.id.startsWith('TM')
  );
  const jtrPoles = validPoles.filter(
    (p) => p.networkType === 'JTR' || p.networkType === 'SUTR' || p.id.startsWith('TR')
  );

  const totalJtmMeters = jtmPoles.reduce(
    (sum, p) => sum + (p.conductorLength ?? (p.a3cs ? parseFloat(p.a3cs) || 0 : 0)),
    0
  );
  const totalJtrMeters = jtrPoles.reduce(
    (sum, p) => sum + (p.conductorLength ?? (p.lvTwisted ? parseFloat(p.lvTwisted) || 0 : 0)),
    0
  );

  const getTileLayer = (L: any, type: string) => {
    if (type === 'googleStreets') {
      return L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 21,
        attribution: '© Google Maps',
      });
    } else if (type === 'esriSatellite') {
      return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '© Esri Satellite',
      });
    } else if (type === 'osm') {
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      });
    } else {
      // Default: Google Satelit Hybrid (citra satelit asli + label jalan PLN)
      return L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 21,
        attribution: '© Google Maps Satellite',
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Initialize map if not yet done
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
        });

        currentTileRef.current = getTileLayer(L, mapType);
        currentTileRef.current.addTo(mapInstanceRef.current);
      } else {
        // Switch layer if changed
        if (currentTileRef.current) {
          mapInstanceRef.current.removeLayer(currentTileRef.current);
        }
        currentTileRef.current = getTileLayer(L, mapType);
        currentTileRef.current.addTo(mapInstanceRef.current);
      }

      // Clear existing markers & extra layers (polylines, distance badges)
      markersRef.current.forEach((m) => mapInstanceRef.current.removeLayer(m));
      markersRef.current = [];

      extraLayersRef.current.forEach((layer) => mapInstanceRef.current.removeLayer(layer));
      extraLayersRef.current = [];

      mapInstanceRef.current.invalidateSize();

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

          const isTM = p.networkType === 'JTM' || p.networkType === 'SUTM' || !p.networkType || p.id.startsWith('TM');
          const isTrafo = (p.tmConstruction || '').includes('GARDU') || (p.trConstruction || '').includes('GARDU');

          const labelText = p.id;
          const specText = isTM ? (p.tmConstruction || 'TM1') : (p.trConstruction || 'TR1');

          let markerHtml = '';

          if (isTrafo) {
            // Simbol Rencana Trafo: Node kompak dan terpusat (tidak melebar ke samping)
            markerHtml = `
              <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transform:translate(-50%,-50%);">
                <div style="
                  width: 24px;
                  height: 14px;
                  background: #000;
                  border: 1.5px solid #00e5ff;
                  border-radius: 2px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 2.5px;
                  box-shadow: 0 0 8px rgba(0,229,255,0.9);
                ">
                  <span style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:7px solid #ef4444;"></span>
                  <span style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:7px solid #22c55e;"></span>
                </div>
                <div style="
                  margin-top: 2px;
                  font-family: 'Consolas', 'Courier New', monospace;
                  font-size: 9.5px;
                  font-weight: 900;
                  color: #00ff66;
                  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 4px #000;
                  white-space: nowrap;
                  line-height: 1;
                ">
                  ${labelText}
                </div>
              </div>
            `;
          } else {
            // Node Tiang Kompak Terpusat: Tidak memakan ruang horizontal sehingga garis jalur antar tiang terlihat jelas & tidak dempet
            markerHtml = `
              <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transform:translate(-50%,-50%);">
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

          const marker = L.marker(pos, { icon: poleIcon }).addTo(mapInstanceRef.current);

          const specBadge = isTM
            ? `<span style="display:inline-block;padding:2px 6px;background:#eff6ff;color:#1d4ed8;font-weight:bold;font-size:10px;border-radius:4px;border:1px solid #bfdbfe">⚡ JTM • ${p.tmConstruction || '1B'} • ${p.a3cs || '3x150 mm²'}</span>`
            : `<span style="display:inline-block;padding:2px 6px;background:#ecfdf5;color:#047857;font-weight:bold;font-size:10px;border-radius:4px;border:1px solid #a7f3d0">🔌 JTR • ${p.trConstruction || '1B'} • ${p.lvTwisted || 'JTR 70'}</span>`;

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
                <span style="font-size:13px;font-weight:bold;color:#0f172a">${p.id}</span>
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

          marker.bindTooltip(`<b>${p.id}</b> [${p.tmConstruction || p.trConstruction || p.poleType}]`, {
            direction: 'top',
            offset: [0, -10],
          });

          markersRef.current.push(marker);
        });

        // ---------------------------------------------------------------------
        // FUNGSI PENGGAMBARAN JALUR & LABEL JARAK ANTAR TIANG
        // ---------------------------------------------------------------------
        const drawNetworkSegments = (netPoles: PoleData[], isTM: boolean) => {
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
              const distMeters = rawSurveyLen > 0 ? rawSurveyLen : (gpsDist > 0 ? gpsDist : (isTM ? 50 : 45));

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
                  " title="Jarak bentangan: ${prevP.id} ➔ ${p.id} = ${distMeters} meter">
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
                  .bindTooltip(`<b>Jarak Bentangan (Span):</b><br/>${prevP.id} ➔ ${p.id}: <b>${distMeters} meter</b>`, {
                    direction: 'top',
                    offset: [0, -8],
                  })
                  .addTo(mapInstanceRef.current);

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
            }).addTo(mapInstanceRef.current);
            extraLayersRef.current.push(casingLine);

            // Garis utama tebal & kontras tinggi (solid vibrant line)
            const line = L.polyline(points, {
              color: isTM ? '#f43f5e' : '#0284c7',
              weight: isTM ? 3.8 : 3.4,
              opacity: 1,
            }).addTo(mapInstanceRef.current);
            extraLayersRef.current.push(line);
          }
        };

        // Gambar JTM
        drawNetworkSegments(jtmPoles, true);

        // Gambar JTR
        drawNetworkSegments(jtrPoles, false);

        // Jika ada JTM dan JTR, sambungkan tiang gardu JTM ke tiang awal JTR
        if (jtmPoles.length > 0 && jtrPoles.length > 0) {
          const lastTm = jtmPoles[jtmPoles.length - 1];
          const firstTr = jtrPoles[0];
          const posTm = posMap[lastTm.id];
          const posTr = posMap[firstTr.id];

          if (posTm && posTr) {
            const linkCasing = L.polyline([posTm, posTr], {
              color: '#020617',
              weight: 4.5,
              opacity: 0.9,
            }).addTo(mapInstanceRef.current);
            extraLayersRef.current.push(linkCasing);

            const linkLine = L.polyline([posTm, posTr], {
              color: '#10b981',
              weight: 2.8,
              dashArray: '5, 4',
              opacity: 1,
            }).addTo(mapInstanceRef.current);
            extraLayersRef.current.push(linkLine);

            if (showDistances) {
              const linkGpsDist = Math.round(L.latLng(posTm).distanceTo(L.latLng(posTr)));
              const midLat = (posTm[0] + posTr[0]) / 2;
              const midLng = (posTm[1] + posTr[1]) / 2;

              const linkHtml = `
                <div style="
                  font-family: 'Consolas', 'Courier New', monospace, sans-serif;
                  font-size: 11px;
                  font-weight: 900;
                  color: #34d399;
                  text-shadow: -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 0 4px #000;
                  white-space: nowrap;
                  transform: translate(-50%, -135%);
                  pointer-events: auto;
                  user-select: none;
                  background: transparent;
                  border: none;
                  padding: 0;
                " title="Koneksi Gardu ke JTR: ${linkGpsDist} m">
                  ${linkGpsDist} m
                </div>
              `;
              const linkIcon = L.divIcon({
                className: 'pln-link-distance-text',
                html: linkHtml,
                iconSize: [0, 0],
                iconAnchor: [0, 0],
              });
              const linkMarker = L.marker([midLat, midLng], { icon: linkIcon }).addTo(mapInstanceRef.current);
              extraLayersRef.current.push(linkMarker);
            }
          }
        }

        const bounds = L.latLngBounds(latLngs);
        mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 18 });
      } else {
        mapInstanceRef.current.setView([-6.12, 106.15], 13);
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
  }, [poles, mapType, showDistances]);

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

          {/* Legend Badges with Total Length */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
            {jtmPoles.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-rose-700 border border-rose-200 shadow-2xs font-mono">
                <span className="w-2.5 h-2.5 bg-rose-600 border border-cyan-400 rounded-[2px] shadow-xs"></span>
                <span>JTM: {totalJtmMeters} m</span>
              </span>
            )}
            {jtrPoles.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-sky-700 border border-sky-200 shadow-2xs font-mono">
                <span className="w-2.5 h-2.5 bg-sky-600 border border-emerald-400 rounded-[2px] shadow-xs"></span>
                <span>JTR: {totalJtrMeters} m</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
              onChange={(e) => setMapType(e.target.value as any)}
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
      </div>
    </div>
  );
};
