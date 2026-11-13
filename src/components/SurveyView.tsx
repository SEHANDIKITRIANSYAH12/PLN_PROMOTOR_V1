'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { PoleData } from '@/types';
import { GeotagMap } from '@/components/GeotagMap';
import { Pagination } from '@/components/Pagination';
import { calculateRabFromSurvey } from '@/data/rabMasterData';
import { RabDocumentModal } from '@/components/RabDocumentModal';
import {
  Plus,
  MapPin,
  Camera,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  ExternalLink,
  Search,
  Eye,
  X,
  Zap,
  Home,
  Building2,
  Users,
  CheckCircle2,
  Sparkles,
  Calculator,
  RefreshCw,
  FileText,
  Wrench,
  Wifi,
  WifiOff,
  CloudOff,
  Download,
  Upload,
  Radio,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export const SurveyView: React.FC = () => {
  const { 
    surveys, 
    addSurvey, 
    updateSurveyStatus, 
    deleteSurvey, 
    syncOfflineSurvey,
    syncAllOfflineSurveys,
    showToast, 
    setCurrentPage,
    setActiveDaftungTab,
    openRabForSurvey,
    customKhsPrices,
    constructionRules
  } = usePromotorStore();

  // Connectivity & Offline (Blankspot) state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isManualOfflineSim, setIsManualOfflineSim] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Detect initial online state
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      showToast('📶 Jaringan terhubung kembali. Menyelaraskan draf survey...');
      // Auto-sync if not in manual simulation mode
      if (!isManualOfflineSim) {
        syncAllOfflineSurveys();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚠️ Koneksi terputus. Beralih ke Mode Blankspot (Offline-First).');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isManualOfflineSim, syncAllOfflineSurveys, showToast]);

  const effectiveIsOffline = !isOnline || isManualOfflineSim;
  const offlineSurveysCount = useMemo(() => surveys.filter((s) => s.isOfflineDraft).length, [surveys]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [detailSurveyId, setDetailSurveyId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [step5Tab, setStep5Tab] = useState<'rabPaket2' | 'rabPaket1' | 'poles'>('rabPaket2');
  const [selectedRabDoc, setSelectedRabDoc] = useState<{ survey: any; paket: 'paket1' | 'paket2' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [surveyPage, setSurveyPage] = useState(1);
  const [surveyPageSize, setSurveyPageSize] = useState(10);

  // Selected Photo Preview Modal
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; caption: string } | null>(null);

  // Form Step 1: Data Pelanggan Terperinci (Sesuai Format PLN)
  const [namaDasar, setNamaDasar] = useState('');
  const [jumlahUnit, setJumlahUnit] = useState('');
  const [dayaPerUnit, setDayaPerUnit] = useState('1.300');
  const [isMultiUnit, setIsMultiUnit] = useState(false);

  // Daya & Tarif (Lama vs Baru)
  const [dayaLama, setDayaLama] = useState('');
  const [tarifLama, setTarifLama] = useState('');
  const [dayaBaru, setDayaBaru] = useState('1.300');
  const [tarifBaru, setTarifBaru] = useState('R1T');

  // Alamat Terstruktur
  const [kampung, setKampung] = useState('');
  const [desa, setDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupaten, setKabupaten] = useState('Kabupaten Lebak');

  const [name, setName] = useState('');
  const [idpel, setIdpel] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Pasang Baru');
  const [address, setAddress] = useState('');
  const [officer, setOfficer] = useState('');

  // Koordinat Lokasi Pelanggan (Lat / Long)
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Ambil GPS perangkat untuk lokasi pelanggan
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ Perangkat tidak mendukung GPS Geolocation.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setIsGettingLocation(false);
        showToast(`✓ Koordinat GPS terkunci: ${lat}, ${lng}`);
      },
      (err) => {
        setIsGettingLocation(false);
        showToast('⚠️ Gagal mengambil koordinat GPS. Pastikan izin lokasi aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Computed Full Customer Name & Full Location
  const computedCustomerName = (jumlahUnit && dayaPerUnit)
    ? `${namaDasar.trim()} ${jumlahUnit} x ${dayaPerUnit} VA`
    : namaDasar.trim() || name;

  const computedLocation = [kampung.trim(), desa.trim(), kecamatan.trim(), kabupaten.trim()]
    .filter(Boolean)
    .join(', ') || location;


  // Form Step 2: Data Teknis (Sesuai Isian Excel Baris 21 - 38)
  const [daya, setDaya] = useState('197,000');
  const [tarif, setTarif] = useState('I2');
  const [garduInduk, setGarduInduk] = useState('RANGKASBITUNG BARU (ONA)'); // Baris 21
  const [penyulang, setPenyulang] = useState('CITRA'); // Baris 22
  const [gardu, setGardu] = useState('MAJA045'); // Baris 23
  const [ulp, setUlp] = useState('ULP Rangkasbitung'); // Baris 24

  const [perluasanJTM, setPerluasanJTM] = useState(''); // Baris 26
  const [tipeGardu, setTipeGardu] = useState('Portal'); // Baris 27
  const [kapasitasTrafo, setKapasitasTrafo] = useState('250'); // Baris 28
  const [jumlahKabelNaik, setJumlahKabelNaik] = useState('2 Jurusan'); // Baris 29
  const [perluasanJTR, setPerluasanJTR] = useState(''); // Baris 30

  // Mutasi Trafo Distribusi (Baris 32)
  const [trafoLama, setTrafoLama] = useState(''); // Baris 33
  const [trafoBaru, setTrafoBaru] = useState(''); // Baris 34

  // Gardu Beton Distribusi (Baris 36)
  const [jenisPekerjaanGardu, setJenisPekerjaanGardu] = useState(''); // Baris 37
  const [jumlahKubikelLBS, setJumlahKubikelLBS] = useState(''); // Baris 38

  // Form Step 3 & 4: Sub-Tab Tipe Jaringan JTM & JTR
  const [jtmTypeTab, setJtmTypeTab] = useState<'SUTM' | 'SKTM' | 'SKUTM'>('SUTM');
  const [jtrTypeTab, setJtrTypeTab] = useState<'SUTR' | 'SKUTR' | 'SKTR'>('SUTR');

  // Form Step 3: Data Survey Lapangan (Pilihan Sub-Tab: JTM, JTR, dan Upload Foto Lokasi)
  const [networkTab, setNetworkTab] = useState<'JTM' | 'JTR' | 'FOTO'>('JTM');
  const [locationPhotos, setLocationPhotos] = useState<Array<{ id: string; url: string; caption: string; date: string }>>([]);

  const handleLocationPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setLocationPhotos((prev) => [
          ...prev,
          {
            id: `FOTO-${Date.now()}-${i}`,
            url: base64,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          },
        ]);
        showToast(`✓ Foto lokasi "${file.name}" berhasil ditambahkan`);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeLocationPhoto = (id: string) => {
    setLocationPhotos((prev) => prev.filter((p) => p.id !== id));
    showToast('Foto lokasi dihapus');
  };

  // Form Step 4 & 5: Data Tiang JTM dan JTR dipisahkan (Awalnya kosong 0 baris, klik tambah jika dibutuhkan)
  const [tmPoles, setTmPoles] = useState<PoleData[]>([]);
  const [trPoles, setTrPoles] = useState<PoleData[]>([]);

  // Gabungan semua tiang untuk Peta & Review
  const allPoles = [...tmPoles, ...trPoles];

  // Real-time Live RAB preview from current survey form inputs
  const previewSurveyObj = useMemo(() => {
    return {
      id: 'DRAFT',
      customerName: (name.trim() || computedCustomerName || 'Survey Baru').trim(),
      namaDasar: (name.trim() || computedCustomerName || 'Survey Baru').trim(),
      location: (address.trim() || computedLocation || location || '-').trim(),
      jobType: dayaLama ? 'Perubahan Daya' : 'Pasang Baru',
      poles: allPoles,
      jumlahUnit: parseInt(jumlahUnit) || 1,
      dayaPerUnit: dayaBaru || daya || '1.300',
      dayaBaru: dayaBaru || daya,
      tarifBaru: tarifBaru || tarif,
      garduInduk,
      penyulang,
      gardu,
      ulp,
      tipePembangunanGardu: tipeGardu,
      tipeGardu,
      kapasitasTrafo,
      locationPhotos: locationPhotos.map((p) => p.url),
      status: 'Menunggu verifikasi Daftung' as const,
      createdAt: 'Baru saja',
    };
  }, [
    name,
    computedCustomerName,
    address,
    computedLocation,
    location,
    dayaLama,
    allPoles,
    jumlahUnit,
    dayaBaru,
    daya,
    tarifBaru,
    tarif,
    garduInduk,
    penyulang,
    gardu,
    ulp,
    tipeGardu,
    kapasitasTrafo,
    locationPhotos,
  ]);

  const liveRabP2 = useMemo(() => calculateRabFromSurvey(previewSurveyObj, 'paket2', customKhsPrices), [previewSurveyObj, customKhsPrices]);
  const liveRabP1 = useMemo(() => calculateRabFromSurvey(previewSurveyObj, 'paket1', customKhsPrices), [previewSurveyObj, customKhsPrices]);

  const liveRabTotals = useMemo(() => {
    const calc = (items: typeof liveRabP2) => {
      let mat = 0;
      let jas = 0;
      items.forEach((it) => {
        if (!it.isHeader) {
          if (it.section === 'MATERIAL') mat += it.rencanaTotal;
          else jas += it.rencanaTotal;
        }
      });
      const tot = mat + jas;
      const ppn = Math.round(tot * 0.11);
      const grand = tot + ppn;
      return {
        mat,
        jas,
        tot,
        ppn,
        grand,
        dibulatkan: Math.round(grand / 1000) * 1000,
        activeItems: items.filter((x) => !x.isHeader && x.rencanaVol > 0),
      };
    };
    return {
      p1: calc(liveRabP1),
      p2: calc(liveRabP2),
    };
  }, [liveRabP1, liveRabP2]);

  const addPoleRow = () => {
    if (networkTab === 'JTM') {
      const nextIdx = tmPoles.length + 1;
      setTmPoles([
        ...tmPoles,
        {
          id: `TM ${nextIdx}`,
          name: `Tiang TM #${nextIdx}`,
          std: 'Tiang 12/200',
          networkType: 'JTM',
          poleStatus: 'RENCANA',
          poleType: '12/200',
          tmConstruction: 'TM - 1B',
          a3cs: '50 m',
          conductorLength: 50,
          qty: 1,
          coordStr: '',
          lat: null,
          lng: null,
          note: '',
          photo: '',
        },
      ]);
    } else {
      const nextIdx = trPoles.length + 1;
      setTrPoles([
        ...trPoles,
        {
          id: `TR ${nextIdx}`,
          name: `Tiang TR #${nextIdx}`,
          std: 'Tiang 9/200',
          networkType: 'JTR',
          poleStatus: 'RENCANA',
          poleType: '9/200',
          trConstruction: 'TR - 1B',
          lvTwisted: '45 m',
          conductorLength: 45,
          qty: 1,
          coordStr: '',
          lat: null,
          lng: null,
          note: '',
          photo: '',
        },
      ]);
    }
  };

  // Fungsi khusus tambah baris JTR — tidak bergantung pada networkTab (menghindari race condition async state)
  const addTrPoleRow = () => {
    const nextIdx = trPoles.length + 1;
    setTrPoles([
      ...trPoles,
      {
        id: `TR ${nextIdx}`,
        name: `Tiang TR #${nextIdx}`,
        std: 'Tiang 9/200',
        networkType: 'JTR',
        poleStatus: 'RENCANA',
        poleType: '9/200',
        trConstruction: 'TR - 1B',
        lvTwisted: '45 m',
        conductorLength: 45,
        qty: 1,
        coordStr: '',
        lat: null,
        lng: null,
        note: '',
        photo: '',
      },
    ]);
  };

  // Fungsi khusus tambah baris JTM — tidak bergantung pada networkTab
  const addTmPoleRow = () => {
    const nextIdx = tmPoles.length + 1;
    setTmPoles([
      ...tmPoles,
      {
        id: `TM ${nextIdx}`,
        name: `Tiang TM #${nextIdx}`,
        std: 'Tiang 12/200',
        networkType: 'JTM',
        poleStatus: 'RENCANA',
        poleType: '12/200',
        tmConstruction: 'TM - 1B',
        a3cs: '50 m',
        conductorLength: 50,
        qty: 1,
        coordStr: '',
        lat: null,
        lng: null,
        note: '',
        photo: '',
      },
    ]);
  };

  const removePoleRow = (index: number, type: 'JTM' | 'JTR') => {
    if (type === 'JTM') {
      const updated = tmPoles
        .filter((_, i) => i !== index)
        .map((p, idx) => ({
          ...p,
          id: `TM ${idx + 1}`,
          name: `Tiang TM #${idx + 1}`,
        }));
      setTmPoles(updated);
      showToast('Baris tiang JTM dihapus');
    } else {
      const updated = trPoles
        .filter((_, i) => i !== index)
        .map((p, idx) => ({
          ...p,
          id: `TR ${idx + 1}`,
          name: `Tiang TR #${idx + 1}`,
        }));
      setTrPoles(updated);
      showToast('Baris tiang JTR dihapus');
    }
  };

  const handleGpsCurrentLocation = (index: number, type: 'JTM' | 'JTR') => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          if (type === 'JTM') {
            const updated = [...tmPoles];
            updated[index].lat = lat;
            updated[index].lng = lng;
            updated[index].coordStr = `${lat}, ${lng}`;
            setTmPoles(updated);
          } else {
            const updated = [...trPoles];
            updated[index].lat = lat;
            updated[index].lng = lng;
            updated[index].coordStr = `${lat}, ${lng}`;
            setTrPoles(updated);
          }
          showToast(`📍 GPS terisi: ${lat}, ${lng}`);
        },
        () => {
          // Simulation fallback if denied
          const simLat = parseFloat((-6.18 + Math.random() * 0.02).toFixed(6));
          const simLng = parseFloat((106.35 + Math.random() * 0.02).toFixed(6));
          if (type === 'JTM') {
            const updated = [...tmPoles];
            updated[index].lat = simLat;
            updated[index].lng = simLng;
            updated[index].coordStr = `${simLat}, ${simLng}`;
            setTmPoles(updated);
          } else {
            const updated = [...trPoles];
            updated[index].lat = simLat;
            updated[index].lng = simLng;
            updated[index].coordStr = `${simLat}, ${simLng}`;
            setTrPoles(updated);
          }
          showToast(`GPS diblokir/offline, mengisi koordinat simulasi: ${simLat}, ${simLng}`);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const handlePhotoUpload = (index: number, type: 'JTM' | 'JTR', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (type === 'JTM') {
        const updated = [...tmPoles];
        updated[index].photo = base64;
        setTmPoles(updated);
      } else {
        const updated = [...trPoles];
        updated[index].photo = base64;
        setTrPoles(updated);
      }
      showToast(`✓ Foto tiang #${index + 1} berhasil dilampirkan`);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSurvey = () => {
    const finalCustomerName = (name.trim() || computedCustomerName).trim();
    const finalLocation = (address.trim() || computedLocation || location).trim();

    if (!finalCustomerName || !finalLocation) {
      showToast('Nama pelanggan dan alamat lokasi pekerjaan wajib diisi');
      return;
    }

    const latNum = latitude ? parseFloat(latitude) : undefined;
    const lngNum = longitude ? parseFloat(longitude) : undefined;
    const coordString = (latitude && longitude) ? `${latitude}, ${longitude}` : undefined;

    addSurvey({
      customerName: finalCustomerName,
      namaDasar: finalCustomerName,
      latitude: latNum,
      longitude: lngNum,
      coordStr: coordString,
      dayaLama: dayaLama || undefined,
      tarifLama: tarifLama || undefined,
      dayaBaru: dayaBaru || daya,
      tarifBaru: tarifBaru || tarif,
      idpel: idpel || undefined,
      location: finalLocation,
      jobType: dayaLama ? 'Perubahan Daya' : 'Pasang Baru',
      address: finalLocation,
      officerName: officer || 'Petugas Lapangan',
      daya: dayaBaru || daya,
      tarif: tarifBaru || tarif,
      garduInduk,
      penyulang,
      gardu,
      ulp,
      perluasanJTM,
      tipePembangunanGardu: tipeGardu,
      tipeGardu,
      kapasitasTrafo,
      jumlahKabelNaik,
      perluasanJTR,
      trafoLama: trafoLama || undefined,
      trafoBaru: trafoBaru || undefined,
      jenisPekerjaanGardu: jenisPekerjaanGardu || undefined,
      jumlahKubikelLBS: jumlahKubikelLBS || undefined,
      poles: allPoles,
      locationPhotos: locationPhotos.map((lp) => lp.url),
      isOfflineDraft: effectiveIsOffline,
    });

    if (effectiveIsOffline) {
      showToast(`📦 Data survey berhasil disimpan secara OFFLINE (Tersimpan di perangkat). Siap disinkronkan ke server saat ada jaringan.`);
    } else {
      showToast(`✓ Survey berhasil disimpan! Data siap dikirim ke Potensi Daftung untuk verifikasi AP2T & pembuatan RAB.`);
    }

    // Reset Form
    setIsModalOpen(false);
    setStep(1);
    setNamaDasar('');
    setJumlahUnit('');
    setDayaPerUnit('1.300');
    setIsMultiUnit(false);
    setDayaLama('');
    setTarifLama('');
    setDayaBaru('1.300');
    setTarifBaru('R1T');
    setKampung('');
    setDesa('');
    setKecamatan('');
    setKabupaten('Kabupaten Lebak');
    setName('');
    setIdpel('');
    setLocation('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setOfficer('');
    setDaya('197,000');
    setTarif('I2');
    setPenyulang('GI Rangkasbitung Baru (ONA) ; P. Leuwidamar');
    setTipeGardu('Portal');
    setKapasitasTrafo('250');
    setJumlahKabelNaik('2 Jurusan');
    setLocationPhotos([]);
    setTmPoles([]);
    setTrPoles([]);
  };

  // Export Offline Surveys to JSON backup file
  const handleExportOfflineDrafts = () => {
    const offlineDrafts = surveys.filter((s) => s.isOfflineDraft);
    if (offlineDrafts.length === 0) {
      showToast('Tidak ada draf survey offline untuk diekspor.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(offlineDrafts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Draf_Survey_Blankspot_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`✓ Berhasil mengekspor ${offlineDrafts.length} draf survey offline ke file JSON`);
  };

  // Import Offline Surveys from JSON backup file
  const handleImportOfflineDrafts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          let count = 0;
          importedData.forEach((item: any) => {
            if (item.customerName) {
              addSurvey({
                ...item,
                isOfflineDraft: true,
              });
              count++;
            }
          });
          showToast(`✓ Berhasil mengimpor ${count} draf survey offline dari cadangan`);
        } else {
          showToast('⚠️ Format file cadangan JSON tidak sesuai.');
        }
      } catch (err) {
        showToast('⚠️ Gagal membaca file cadangan survey.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredSurveys = surveys.filter(
    (s) =>
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSurveys = filteredSurveys.slice(
    (surveyPage - 1) * surveyPageSize,
    surveyPage * surveyPageSize
  );

  return (
    <div className="space-y-6">
      {/* Hidden File Input for JSON Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportOfflineDrafts}
        accept=".json"
        className="hidden"
      />

      {/* Connectivity & Blankspot Indicator Bar */}
      <div className={`p-4 rounded-xl border transition-all ${
        effectiveIsOffline 
          ? 'bg-amber-500/10 border-amber-300 text-amber-950' 
          : 'bg-emerald-500/10 border-emerald-300 text-emerald-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              effectiveIsOffline ? 'bg-amber-500 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm'
            }`}>
              {effectiveIsOffline ? <CloudOff className="w-5 h-5 animate-pulse" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  effectiveIsOffline ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${effectiveIsOffline ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                  {effectiveIsOffline ? 'Mode Offline / Blankspot Aktif' : 'Online (Terkoneksi Server PLN)'}
                </span>
                {isManualOfflineSim && (
                  <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                    Simulasi Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {effectiveIsOffline
                  ? 'Perangkat dalam kondisi tanpa sinyal seluler. GPS Tiang & Foto tetap bekerja sempurna dan tersimpan aman di memori lokal.'
                  : 'Koneksi internet stabil. Data survey yang tersimpan dapat langsung diverifikasi dan diteruskan ke Potensi Daftung.'}
              </p>
            </div>
          </div>

          {/* Action buttons & Sim toggle */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {/* Simulation Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextState = !isManualOfflineSim;
                setIsManualOfflineSim(nextState);
                if (nextState) {
                  showToast('🟡 Simulasi Mode Blankspot diaktifkan.');
                } else {
                  showToast('🟢 Simulasi Mode Blankspot dinonaktifkan.');
                  if (navigator.onLine) {
                    syncAllOfflineSurveys();
                  }
                }
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                isManualOfflineSim
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Aktifkan simulasi untuk menguji sistem saat berada di area tanpa sinyal seluler"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{isManualOfflineSim ? 'Matikan Simulasi Blankspot' : 'Simulasi Blankspot'}</span>
            </button>

            {/* Backup / Export / Import JSON */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={handleExportOfflineDrafts}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium rounded flex items-center gap-1 hover:bg-slate-100 transition cursor-pointer"
                title="Cadangkan Draf Offline ke file JSON"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>Cadangkan</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium rounded flex items-center gap-1 hover:bg-slate-100 transition cursor-pointer"
                title="Pulihkan Draf dari file JSON"
              >
                <Upload className="w-3 h-3 text-slate-500" />
                <span>Pulihkan</span>
              </button>
            </div>

            {/* Sync All Button when offline drafts exist */}
            {offlineSurveysCount > 0 && !effectiveIsOffline && (
              <button
                type="button"
                onClick={() => {
                  syncAllOfflineSurveys();
                  showToast(`✓ Berhasil menyinkronkan ${offlineSurveysCount} draf survey ke sistem server PLN`);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition animate-bounce"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sinkronkan Semua ({offlineSurveysCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Offline Banner alert if drafts pending */}
        {offlineSurveysCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Terdapat <b>{offlineSurveysCount} draf survey</b> yang tersimpan di perangkat lokal.
            </span>
            {effectiveIsOffline ? (
              <span className="text-amber-800 font-medium">
                * Data aman tersimpan lokal & siap disinkronkan saat kembali online.
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  syncAllOfflineSurveys();
                  showToast(`✓ Berhasil menyinkronkan ${offlineSurveysCount} draf survey ke server`);
                }}
                className="text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Klik di sini untuk sinkronkan sekarang →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Tahap 1: Alur Utama
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Survey Pelanggan ➔ Potensi Daftung (Cek AP2T & RAB) ➔ Work Order ➔ Daftung
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Survey Pelanggan & Geotagging Tiang</h2>
          <p className="text-xs text-slate-500">
            Lakukan survey lapangan pelanggan terlebih dahulu untuk menentukan rincian teknis tiang/kabel. Setelah selesai, data dikirim ke <b>Potensi Daftung</b> untuk verifikasi AP2T dan penerbitan RAB.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentPage('pradaftung')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold transition-all duration-150 shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Lanjut ke menu Daftar Tunggu"
          >
            <span>Ke Daftar Tunggu</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsDetailMode(false);
              setDetailSurveyId(null);
              setName('');
              setNamaDasar('');
              setIdpel('');
              setDayaLama('');
              setTarifLama('');
              setDayaBaru('1.300');
              setTarifBaru('R1T');
              setAddress('');
              setLocation('');
              setLatitude('');
              setLongitude('');
              setOfficer('Petugas Lapangan');
              setTmPoles([]);
              setTrPoles([]);
              setLocationPhotos([]);
              setIsModalOpen(true);
              setStep(1);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all duration-150 shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Survey Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama pekerjaan, nomor survey, atau lokasi..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSurveyPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total: <b>{filteredSurveys.length}</b> Data Survey
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-blue-100/80 border-b border-blue-200 text-slate-900 uppercase font-bold text-[11px] tracking-wider">
              <tr className="divide-x divide-blue-200">
                <th className="py-3.5 px-4">No. Survey</th>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Lokasi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada data survey yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedSurveys.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors divide-x divide-slate-200">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {s.isOfflineDraft && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" title="Draf Offline" />
                      )}
                      <span>{s.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.customerName}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{s.location}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {s.isOfflineDraft ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <WifiOff className="w-3 h-3 text-amber-600" />
                        <span>Draf Offline (Blankspot)</span>
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        s.status === 'Terverifikasi'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'Masuk Antrean AP2T'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {s.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {s.isOfflineDraft && (
                        <button
                          type="button"
                          onClick={() => {
                            if (effectiveIsOffline) {
                              showToast('⚠️ Anda sedang dalam Mode Offline/Blankspot. Hubungkan ke jaringan untuk sinkronisasi.');
                              return;
                            }
                            syncOfflineSurvey(s.id);
                            showToast(`✓ Survey ${s.id} berhasil disinkronkan ke server PLN!`);
                          }}
                          className="px-2.5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                          title="Sinkronkan data offline ini ke server PLN"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Sinkronkan</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsDetailMode(true);
                          setDetailSurveyId(s.id);
                          const tm = s.poles.filter((p) => (p.networkType || 'JTM') === 'JTM' || p.networkType === 'SUTM');
                          const tr = s.poles.filter((p) => p.networkType === 'JTR' || p.networkType === 'SUTR');
                          setTmPoles(tm.length > 0 ? tm : []);
                          setTrPoles(tr.length > 0 ? tr : []);
                          setName(s.customerName);
                          setNamaDasar(s.namaDasar || s.customerName);
                          setJumlahUnit(s.jumlahUnit ? String(s.jumlahUnit) : '');
                          setDayaPerUnit(s.dayaPerUnit || '1.300');
                          setIsMultiUnit(Boolean(s.jumlahUnit));
                          setDayaLama(s.dayaLama || '');
                          setTarifLama(s.tarifLama || '');
                          setDayaBaru(s.dayaBaru || s.daya || '1.300');
                          setTarifBaru(s.tarifBaru || s.tarif || 'R1T');
                          setKampung(s.kampung || '');
                          setDesa(s.desa || '');
                          setKecamatan(s.kecamatan || '');
                          setKabupaten(s.kabupaten || 'Kabupaten Lebak');
                          setIdpel(s.idpel || '');
                          setLocation(s.location);
                          setAddress(s.address || '');
                          setLatitude(s.latitude !== undefined && s.latitude !== null ? String(s.latitude) : '');
                          setLongitude(s.longitude !== undefined && s.longitude !== null ? String(s.longitude) : '');
                          setOfficer(s.officerName || '');
                          setDaya(s.daya || '197,000');
                          setTarif(s.tarif || 'I2');
                          setPenyulang(s.penyulang || 'GI Rangkasbitung Baru (ONA) ; P. Leuwidamar');
                          setTipeGardu(s.tipeGardu || 'Portal');
                          setKapasitasTrafo(s.kapasitasTrafo || '250');
                          setJumlahKabelNaik(s.jumlahKabelNaik || '2 Jurusan');
                          setLocationPhotos((s.locationPhotos || []).map((url, idx) => ({
                            id: `FOTO-DETAIL-${idx}`,
                            url,
                            caption: `Foto Lokasi #${idx + 1}`,
                            date: 'Tersimpan',
                          })));
                          setStep(5);
                          setIsModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg transition border border-blue-200"
                      >
                        Detail
                      </button>

                      {s.status === 'Menunggu verifikasi Daftung' && (
                        <button
                          onClick={() => {
                            updateSurveyStatus(s.id, 'Masuk Antrean AP2T');
                            setCurrentPage('pradaftung');
                            showToast(`✓ Survey ${s.id} masuk ke Potensi Daftung (Menunggu Verifikasi AP2T)`);
                          }}
                          className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="Kirim survey ini ke Potensi Daftung untuk Verifikasi AP2T"
                        >
                          <span>Kirim ke Potensi Daftung →</span>
                        </button>
                      )}

                      {s.status === 'Masuk Antrean AP2T' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage('pradaftung');
                          }}
                          className="px-2.5 py-1.5 text-xs text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center gap-1.5 transition cursor-pointer"
                          title="Buka Verifikasi AP2T di menu Potensi Daftung"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>Verifikasi AP2T →</span>
                        </button>
                      )}

                      {s.status === 'Siap Apply WO' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage('pradaftung');
                          }}
                          className="px-2.5 py-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition cursor-pointer"
                          title="Buka data di Tabel Potensi Daftung"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Potensi Daftung (Siap WO) →</span>
                        </button>
                      )}

                      {s.status === 'Terverifikasi' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDaftungTab('daftung');
                            setCurrentPage('daftung');
                          }}
                          className="px-2.5 py-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition cursor-pointer"
                          title="Buka data resmi di Daftar Tunggu"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Masuk Daftung ✓</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus data survey ${s.id} (${s.customerName})?`)) {
                            deleteSurvey(s.id);
                          }
                        }}
                        className="p-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 font-semibold rounded-lg transition border border-rose-200 cursor-pointer"
                        title="Hapus data survey"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>

        <Pagination
          currentPage={surveyPage}
          totalItems={filteredSurveys.length}
          itemsPerPage={surveyPageSize}
          onPageChange={setSurveyPage}
          onItemsPerPageChange={setSurveyPageSize}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>

      {/* Survey Modal (3 Steps) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isDetailMode ? `Detail Data Survey: ${detailSurveyId || ''} (${name})` : 'Form Survey Lapangan & Geotagging'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isDetailMode
                    ? `Data Lengkap Survey Lapangan & Dokumentasi Visual • ${tmPoles.length} Tiang JTM, ${trPoles.length} Tiang JTR, ${locationPhotos.length} Foto`
                    : `Tahap ${step} dari 5: ${step === 1 ? 'Data Pelanggan' : step === 2 ? 'Data Teknis' : step === 3 ? 'Konstruksi JTM' : step === 4 ? 'Konstruksi JTR' : 'Review & Simpan Survey'}`}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs (Hanya ditampilkan pada mode Input Survey Baru, disembunyikan saat lihat Detail) */}
            {!isDetailMode && (
              <div className="flex border-b border-slate-200 bg-slate-100/90 text-xs font-semibold overflow-x-auto shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 px-2.5 text-center border-b-2 whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    step === 1 ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-xs' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
                  <span>Data Pelanggan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`flex-1 py-3 px-2.5 text-center border-b-2 whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    step === 2 ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-xs' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                  <span>Data Teknis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={`flex-1 py-3 px-2.5 text-center border-b-2 whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    step === 3 ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-xs' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                  <span>Konstruksi JTM ({tmPoles.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className={`flex-1 py-3 px-2.5 text-center border-b-2 whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    step === 4 ? 'border-emerald-600 text-emerald-700 bg-white font-bold shadow-xs' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>4</span>
                  <span>Konstruksi JTR ({trPoles.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className={`flex-1 py-3 px-2.5 text-center border-b-2 whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    step === 5 ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-xs' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 5 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>5</span>
                  <span>Review & Simpan</span>
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* STEP 1: Data Pelanggan */}
              {step === 1 && (
                <div className="space-y-5 text-xs">
                  {/* Notice Banner */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-blue-900 text-xs flex items-center gap-2.5 shadow-2xs">
                    <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className="leading-relaxed">
                      <b>Data Identitas Pemohon / Pelanggan:</b> Masukkan data identitas pemohon dan tarif daya sesuai formulir pendaftaran resmi PLN.
                    </span>
                  </div>

                  {/* Section 1: Data Identitas Pemohon */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <h4 className="font-bold text-slate-800 text-xs tracking-wide">1. Identitas Pelanggan & Lokasi</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Informasi Utama</span>
                    </div>

                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nama Pelanggan */}
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Nama Pelanggan <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setNamaDasar(e.target.value);
                          }}
                          placeholder="Contoh: PT BANTEN STEEL MANUFACTURING atau PERUMAHAN MUTIARA MAJA"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>

                      {/* Alamat Lokasi */}
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Alamat Lokasi Pelanggan <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            setLocation(e.target.value);
                          }}
                          placeholder="Contoh: Jl. Industri Modern Raya No. 88, Cikande, Serang"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>

                      {/* Koordinat Lokasi & Foto Dokumentasi Lapangan */}
                      <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                        {/* Koordinat Lat Long */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-600" />
                              <span>Koordinat Lokasi Pelanggan (Latitude & Longitude)</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleGetCurrentLocation}
                              disabled={isGettingLocation}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-100/80 hover:bg-blue-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                              title="Ambil koordinat GPS perangkat saat ini"
                            >
                              <MapPin className="w-3 h-3 text-blue-600" />
                              <span>{isGettingLocation ? 'Mencari GPS...' : 'Ambil GPS Lokasi'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10.5px] font-medium text-slate-500 block mb-1">Latitude (Lintang):</span>
                              <input
                                type="text"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="Contoh: -6.185200"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <span className="text-[10.5px] font-medium text-slate-500 block mb-1">Longitude (Bujur):</span>
                              <input
                                type="text"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="Contoh: 106.345100"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Foto Dokumentasi Lokasi (Disatukan di sini) */}
                        <div className="pt-3 border-t border-slate-200/80">
                          <div className="flex items-center justify-between mb-2.5">
                            <label className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-purple-600" />
                              <span>Foto Dokumentasi Lokasi Pelanggan ({locationPhotos.length} Foto)</span>
                            </label>
                            <label className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-100/80 hover:bg-purple-200 rounded-lg transition flex items-center gap-1 cursor-pointer">
                              <Camera className="w-3 h-3 text-purple-600" />
                              <span>+ Upload / Kamera</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleLocationPhotoUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {locationPhotos.length === 0 ? (
                            <label className="border-2 border-dashed border-slate-300 hover:border-purple-400 bg-white rounded-xl p-4 text-center transition flex flex-col items-center justify-center cursor-pointer group">
                              <Camera className="w-6 h-6 text-slate-400 group-hover:text-purple-600 transition mb-1" />
                              <span className="text-xs font-semibold text-slate-700">Klik untuk ambil foto dari kamera atau pilih file</span>
                              <span className="text-[10.5px] text-slate-400 mt-0.5">Mendukung format JPG, PNG, atau kamera HP</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleLocationPhotoUpload}
                                className="hidden"
                              />
                            </label>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {locationPhotos.map((photo, pIdx) => (
                                <div key={photo.id} className="relative group bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                                  <div
                                    className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer"
                                    onClick={() => setPreviewPhoto({ url: photo.url, title: `Foto Lokasi #${pIdx + 1}`, caption: photo.caption })}
                                  >
                                    <img
                                      src={photo.url}
                                      alt={photo.caption}
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                      <Eye className="w-3.5 h-3.5" /> Lihat
                                    </div>
                                  </div>
                                  <div className="p-2 bg-white">
                                    <input
                                      type="text"
                                      value={photo.caption}
                                      onChange={(e) => {
                                        const updated = [...locationPhotos];
                                        updated[pIdx].caption = e.target.value;
                                        setLocationPhotos(updated);
                                      }}
                                      placeholder="Ket. foto..."
                                      className="w-full text-[10px] font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none py-0.5 bg-transparent truncate"
                                    />
                                    <div className="flex items-center justify-end mt-1">
                                      <button
                                        type="button"
                                        onClick={() => removeLocationPhoto(photo.id)}
                                        className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Tarif & Daya (Lama vs Baru) */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <h4 className="font-bold text-slate-800 text-xs tracking-wide">2. Spesifikasi Tarif & Daya</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Lama vs Baru</span>
                    </div>

                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Daya Baru */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Daya Baru (VA) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={dayaBaru}
                          onChange={(e) => {
                            setDayaBaru(e.target.value);
                            setDaya(e.target.value);
                          }}
                          placeholder="Contoh: 1.300"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition"
                        />
                      </div>

                      {/* Tarif Baru */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Tarif Baru <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={tarifBaru}
                          onChange={(e) => {
                            setTarifBaru(e.target.value);
                            setTarif(e.target.value);
                          }}
                          placeholder="Contoh: R1T"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>

                      {/* Daya Lama */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Daya Lama (VA) <span className="text-[10px] text-slate-400 font-normal">(opsional jika perubahan daya)</span>
                        </label>
                        <input
                          type="text"
                          value={dayaLama}
                          onChange={(e) => setDayaLama(e.target.value)}
                          placeholder="Kosongkan jika Pasang Baru"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition"
                        />
                      </div>

                      {/* Tarif Lama */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Tarif Lama <span className="text-[10px] text-slate-400 font-normal">(opsional jika perubahan daya)</span>
                        </label>
                        <input
                          type="text"
                          value={tarifLama}
                          onChange={(e) => setTarifLama(e.target.value)}
                          placeholder="Kosongkan jika Pasang Baru"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Data Teknis */}
              {step === 2 && (
                <div className="space-y-5 text-xs">
                  {/* Notice Banner */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-blue-900 text-xs flex items-center gap-2.5 shadow-2xs">
                    <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
                      <Wrench className="w-4 h-4" />
                    </span>
                    <span className="leading-relaxed">
                      <b>Data Teknis Jaringan & Distribusi:</b> Masukkan data gardu induk, penyulang, gardu, perluasan jaringan, mutasi trafo, dan gardu beton sesuai kebutuhan survey lapangan PLN.
                    </span>
                  </div>

                  {/* Section 1: Data Gardu Induk & Penyulang */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <h4 className="font-bold text-slate-800 text-xs tracking-wide">1. Gardu Induk & Titik Pasok</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Wajib diisi</span>
                    </div>

                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Gardu Induk */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Gardu Induk <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={garduInduk}
                          onChange={(e) => setGarduInduk(e.target.value)}
                          placeholder="Contoh: RANGKASBITUNG BARU (ONA)"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>

                      {/* Penyulang */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Penyulang <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={penyulang}
                          onChange={(e) => setPenyulang(e.target.value)}
                          placeholder="Contoh: CITRA"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>

                      {/* Gardu */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Gardu Distribusi <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={gardu}
                          onChange={(e) => setGardu(e.target.value)}
                          placeholder="Contoh: MAJA045"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition"
                        />
                      </div>

                      {/* ULP */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Unit Layanan Pelanggan (ULP) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={ulp}
                          onChange={(e) => setUlp(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                        >
                          <option value="ULP Rangkasbitung">ULP Rangkasbitung</option>
                          <option value="ULP Pandeglang">ULP Pandeglang</option>
                          <option value="ULP Malingping">ULP Malingping</option>
                          <option value="ULP Labuan">ULP Labuan</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Spesifikasi Distribusi & Perluasan Jaringan */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <h4 className="font-bold text-slate-800 text-xs tracking-wide">2. Spesifikasi Gardu & Jaringan</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Konstruksi Distribusi</span>
                    </div>

                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Perluasan JTM */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Perluasan JTM
                        </label>
                        <select
                          value={perluasanJTM}
                          onChange={(e) => setPerluasanJTM(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                        >
                          <option value="">— Kosongkan / Tidak Ada —</option>
                          <option value="SUTM">SUTM (Saluran Udara Tegangan Menengah)</option>
                          <option value="SKUTM (MVTIC)">SKUTM (MVTIC)</option>
                          <option value="SKTM">SKTM (Saluran Kabel Tegangan Menengah)</option>
                        </select>
                      </div>

                      {/* Tipe Pembangunan Gardu */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Tipe Pembangunan Gardu
                        </label>
                        <select
                          value={tipeGardu}
                          onChange={(e) => setTipeGardu(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                        >
                          <option value="">— Kosongkan / Tidak Ada —</option>
                          <option value="Gardu Cantol Distribusi">Gardu Cantol Distribusi</option>
                          <option value="Gardu Cantol Khusus">Gardu Cantol Khusus</option>
                          <option value="Gardu Portal Distribusi">Gardu Portal Distribusi</option>
                          <option value="Gardu Portal Khusus">Gardu Portal Khusus</option>
                          <option value="Gardu Portal RMU">Gardu Portal RMU</option>
                        </select>
                      </div>

                      {/* Kapasitas Trafo */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Kapasitas Trafo
                        </label>
                        <select
                          value={kapasitasTrafo}
                          onChange={(e) => setKapasitasTrafo(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono transition"
                        >
                          <option value="">— Kosongkan / Tidak Ada —</option>
                          <option value="25 kVA">25 kVA</option>
                          <option value="50 kVA">50 kVA</option>
                          <option value="100 kVA">100 kVA</option>
                          <option value="160 kVA">160 kVA</option>
                          <option value="200 kVA">200 kVA</option>
                          <option value="250 kVA">250 kVA</option>
                          <option value="400 kVA">400 kVA</option>
                          <option value="630 kVA">630 kVA</option>
                        </select>
                      </div>

                      {/* Jumlah Kabel Naik */}
                      <div>
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Jumlah Kabel Naik
                        </label>
                        <select
                          value={jumlahKabelNaik}
                          onChange={(e) => setJumlahKabelNaik(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono transition"
                        >
                          <option value="">— Kosongkan / Tidak Ada —</option>
                          <option value="1">1 Jurusan</option>
                          <option value="2">2 Jurusan</option>
                          <option value="3">3 Jurusan</option>
                          <option value="4">4 Jurusan</option>
                        </select>
                      </div>

                      {/* Perluasan JTR */}
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                          Perluasan JTR (Jaringan Tegangan Rendah)
                        </label>
                        <select
                          value={perluasanJTR}
                          onChange={(e) => setPerluasanJTR(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                        >
                          <option value="">— Kosongkan / Tidak Ada —</option>
                          <option value="SUTR">SUTR (Saluran Udara Tegangan Rendah)</option>
                          <option value="SKUTR">SKUTR</option>
                          <option value="SKTR">SKTR (Saluran Kabel Tegangan Rendah)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Tambahan (Mutasi Trafo & Gardu Beton) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mutasi Trafo Distribusi */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col">
                      <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <h4 className="font-bold text-slate-800 text-xs tracking-wide">Mutasi Trafo Distribusi</h4>
                        </div>
                        <span className="text-[10px] text-slate-400">Opsional</span>
                      </div>

                      <div className="p-5 space-y-4 flex-1">
                        <div>
                          <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                            Trafo Lama (Eksisting)
                          </label>
                          <select
                            value={trafoLama}
                            onChange={(e) => setTrafoLama(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono transition"
                          >
                            <option value="">— Tidak Ada Mutasi —</option>
                            <option value="25 kVA">25 kVA</option>
                            <option value="50 kVA">50 kVA</option>
                            <option value="100 kVA">100 kVA</option>
                            <option value="160 kVA">160 kVA</option>
                            <option value="200 kVA">200 kVA</option>
                            <option value="250 kVA">250 kVA</option>
                            <option value="400 kVA">400 kVA</option>
                            <option value="630 kVA">630 kVA</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                            Trafo Baru (Pengganti)
                          </label>
                          <select
                            value={trafoBaru}
                            onChange={(e) => setTrafoBaru(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono transition"
                          >
                            <option value="">— Tidak Ada Mutasi —</option>
                            <option value="25 kVA">25 kVA</option>
                            <option value="50 kVA">50 kVA</option>
                            <option value="100 kVA">100 kVA</option>
                            <option value="160 kVA">160 kVA</option>
                            <option value="200 kVA">200 kVA</option>
                            <option value="250 kVA">250 kVA</option>
                            <option value="400 kVA">400 kVA</option>
                            <option value="630 kVA">630 kVA</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Gardu Beton Distribusi */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col">
                      <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                          <h4 className="font-bold text-slate-800 text-xs tracking-wide">Gardu Beton Distribusi</h4>
                        </div>
                        <span className="text-[10px] text-slate-400">Opsional</span>
                      </div>

                      <div className="p-5 space-y-4 flex-1">
                        <div>
                          <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                            Jenis Pekerjaan
                          </label>
                          <select
                            value={jenisPekerjaanGardu}
                            onChange={(e) => setJenisPekerjaanGardu(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                          >
                            <option value="">— Tidak Ada Pekerjaan —</option>
                            <option value="Pemasangan Instalasi Gardu">Pemasangan Instalasi Gardu</option>
                            <option value="Bongkar Pasang CT TM Gardu">Bongkar Pasang CT TM Gardu</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 text-xs mb-1.5">
                            Jumlah Kubikel LBS
                          </label>
                          <select
                            value={jumlahKubikelLBS}
                            onChange={(e) => setJumlahKubikelLBS(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono transition"
                          >
                            <option value="">— Tidak Ada —</option>
                            <option value="1">1 Unit</option>
                            <option value="2">2 Unit</option>
                            <option value="3">3 Unit</option>
                            <option value="4">4 Unit</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Survey Konstruksi JTM (Tegangan Menengah) */}
              {step === 3 && (
                <div className="space-y-4 text-xs">
                  {/* Notice Banner */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-blue-900 text-xs leading-relaxed flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
                        <Zap className="w-4 h-4" />
                      </span>
                      <span>
                        <b>Survey Konstruksi JTM (Jaringan Tegangan Menengah):</b> Tentukan tipe jaringan JTM, spesifikasi tiang, konstruksi standar TM, dan panjang konduktor (meter).
                      </span>
                    </div>
                    <span className="font-bold text-[11px] px-2.5 py-1 bg-white text-blue-700 rounded-lg border border-blue-200 shadow-2xs font-mono">
                      {tmPoles.length} Tiang TM
                    </span>
                  </div>

                  {/* Pilihan Sub-Tab Tipe Jaringan JTM: SUTM | SKTM | SKUTM (MVTIC) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setJtmTypeTab('SUTM');
                        setPerluasanJTM('SUTM');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                        jtmTypeTab === 'SUTM'
                          ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>SUTM (Saluran Udara)</span>
                      <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold border ${
                        jtmTypeTab === 'SUTM'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        ● Aktif Digunakan
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setJtmTypeTab('SKTM');
                        setPerluasanJTM('SKTM');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                        jtmTypeTab === 'SKTM'
                          ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>SKTM (Kabel Bawah Tanah)</span>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600 font-medium">
                        Belum Digunakan
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setJtmTypeTab('SKUTM');
                        setPerluasanJTM('SKUTM (MVTIC)');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                        jtmTypeTab === 'SKUTM'
                          ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>SKUTM (MVTIC)</span>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600 font-medium">
                        Belum Digunakan
                      </span>
                    </button>
                  </div>

                  {/* KONTEN BERDASARKAN SUB-TAB JTM */}
                  {jtmTypeTab === 'SUTM' ? (
                    <>
                      {/* Tabular Form Container for TM Poles */}
                      <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        {tmPoles.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs min-w-[780px] border-collapse">
                              <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                                <tr className="divide-x divide-slate-200">
                                  <th className="py-3.5 px-3 w-[26%]">{constructionRules?.jtm?.tiangLabel || 'Tiang'}</th>
                                  <th className="py-3.5 px-3 w-[34%]">{constructionRules?.jtm?.konstruksiLabel || 'Konstruksi TM (Standar)'}</th>
                                  <th className="py-3.5 px-3 w-[16%] text-center">{constructionRules?.jtm?.conductorLabel || 'Panjang Konduktor (m)'}</th>
                                  <th className="py-3.5 px-3 w-[18%]">Koordinat GPS (Lat, Long)</th>
                                  <th className="py-3.5 px-2 w-[6%] text-center">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {tmPoles.map((p, idx) => (
                                  <tr key={p.id || idx} className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                                    {/* 1. Input Tiang */}
                                    <td className="py-3 px-3">
                                      <select
                                        value={p.poleType || '12/200'}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const updated = [...tmPoles];
                                          updated[idx].poleType = val;
                                          // Logika otomatis PLN: Tanpa Tiang = Tiang Existing, Ukuran Tiang = Rencana Baru
                                          updated[idx].poleStatus = val === 'Tanpa Tiang' ? 'EXISTING' : 'RENCANA';
                                          setTmPoles(updated);
                                        }}
                                        className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                                      >
                                        <option value="Tanpa Tiang">— Tanpa Tiang (Tiang Eksisting / Tidak Tambah Tiang) —</option>
                                        <optgroup label="Tiang Beton TM (Standar Konstruksi)">
                                          {(constructionRules?.jtm?.tiangList || ['12/200', '12/350', '12/350 (GARDU)', '11/200', '11/350']).map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                          ))}
                                        </optgroup>
                                      </select>
                                      {p.poleType === 'Tanpa Tiang' && (
                                        <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-medium mt-1 inline-block border border-slate-300">
                                          ⚫ Tiang Eksisting
                                        </span>
                                      )}
                                    </td>

                                    {/* 2. Input Konstruksi TM */}
                                    <td className="py-3 px-3">
                                      <select
                                        value={p.tmConstruction || 'TM - 1B'}
                                        onChange={(e) => {
                                          const updated = [...tmPoles];
                                          updated[idx].tmConstruction = e.target.value;
                                          setTmPoles(updated);
                                        }}
                                        className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                                      >
                                        <option value="">Pilih Konstruksi TM</option>
                                        {(constructionRules?.jtm?.konstruksiList || ['TM - 1B', 'TM - 2B', 'TM - 3B', 'TM - 4B', 'TM - 5B', 'GARDU PORTAL DISTRIBUSI']).map((k) => (
                                          <option key={k} value={k}>{k}</option>
                                        ))}
                                      </select>
                                    </td>

                                    {/* 3. Input A3CS (meter) */}
                                    <td className="py-3 px-3">
                                      <div className="relative flex items-center">
                                        <input
                                          type="number"
                                          min="0"
                                          value={p.conductorLength ?? (p.a3cs ? parseFloat(p.a3cs) : 50)}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            const updated = [...tmPoles];
                                            updated[idx].conductorLength = val;
                                            updated[idx].a3cs = `${val} m`;
                                            setTmPoles(updated);
                                          }}
                                          className="w-full p-2 pr-7 border border-slate-200 rounded-xl text-xs text-center font-mono font-bold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                          placeholder="50"
                                        />
                                        <span className="absolute right-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">m</span>
                                      </div>
                                    </td>

                                    {/* 4. Koordinat (Lat, Long) & Tombol GPS */}
                                    <td className="py-3 px-3">
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          placeholder="-6.xxxxxx, 106.xxxxxx"
                                          value={p.coordStr}
                                          onChange={(e) => {
                                            const updated = [...tmPoles];
                                            updated[idx].coordStr = e.target.value;
                                            const val = e.target.value.trim();
                                            const parts = val.includes(',') ? val.split(',') : val.split(/\s+/);
                                            if (parts.length >= 2) {
                                              const lat = parseFloat(parts[0].trim());
                                              const lng = parseFloat(parts[1].trim());
                                              updated[idx].lat = isNaN(lat) ? null : lat;
                                              updated[idx].lng = isNaN(lng) ? null : lng;
                                            } else if (val === '') {
                                              updated[idx].lat = null;
                                              updated[idx].lng = null;
                                            }
                                            setTmPoles(updated);
                                          }}
                                          className="flex-1 p-2 border border-slate-200 rounded-xl text-xs font-mono font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleGpsCurrentLocation(idx, 'JTM');
                                          }}
                                          className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                                          title="Ambil titik GPS real-time saat ini"
                                        >
                                          <span>📍</span>
                                          <span>GPS</span>
                                        </button>
                                      </div>
                                    </td>

                                    {/* 5. Tombol Hapus */}
                                    <td className="py-3 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          removePoleRow(idx, 'JTM');
                                        }}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                                      >
                                        Hapus
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-slate-50/50">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3">
                              <Zap className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-slate-800 text-xs mb-1">Belum Ada Tiang JTM yang Ditambahkan</h4>
                            <p className="text-[11px] text-slate-500 max-w-md mx-auto mb-4">
                              Jika survey ini hanya pekerjaan JTR (tanpa konstruksi JTM), Anda dapat mengosongkan bagian ini dan langsung lanjut ke tahap berikutnya.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                addTmPoleRow();
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                            >
                              <Plus className="w-4 h-4" />
                              <span>+ Tambah Baris Tiang JTM</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Tombol Tambah Baris TM */}
                      {tmPoles.length > 0 && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              addTmPoleRow();
                            }}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Baris Tiang JTM</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : jtmTypeTab === 'SKTM' ? (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Konstruksi SKTM (Saluran Kabel Tegangan Menengah 20 kV Bawah Tanah)
                      </h4>
                      <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                        Konstruksi SKTM menggunakan penanaman kabel tanah 20 kV (XLPE/Underground) langsung ditanam atau melalui ducting. Saat ini, <b>standar survey yang aktif digunakan di wilayah UP3 Banten Selatan adalah SUTM (Saluran Udara)</b>. Fitur isian teknis SKTM disiapkan untuk pengembangan proyek kabel tanah mendatang.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setJtmTypeTab('SUTM');
                            setPerluasanJTM('SUTM');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Beralih ke Form SUTM (Aktif Digunakan)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Konstruksi SKUTM (Saluran Kabel Udara Tegangan Menengah MVTIC)
                      </h4>
                      <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                        Konstruksi SKUTM menggunakan kabel udara berisolasi penuh (MVTIC 3x150 mm²) untuk area khusus/padat pohon. Saat ini, <b>standar survey yang aktif digunakan di sistem adalah SUTM (Saluran Udara kawat A3CS)</b>.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setJtmTypeTab('SUTM');
                            setPerluasanJTM('SUTM');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Beralih ke Form SUTM (Aktif Digunakan)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Survey Konstruksi JTR (Tegangan Rendah) */}
              {step === 4 && (
                <div className="space-y-4 text-xs">
                  {/* Notice Banner */}
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs leading-relaxed flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                        <Zap className="w-4 h-4" />
                      </span>
                      <span>
                        <b>Survey Konstruksi JTR (Jaringan Tegangan Rendah):</b> Tentukan spesifikasi tiang, konstruksi standar TR, panjang kabel JTR 70 (meter), dan koordinat GPS.
                      </span>
                    </div>
                    <span className="font-bold text-[11px] px-2.5 py-1 bg-white text-emerald-700 rounded-lg border border-emerald-200 shadow-2xs font-mono">
                      {trPoles.length} Tiang TR
                    </span>
                  </div>

                  {/* Pilihan Sub-Tab Tipe Jaringan JTR: SUTR | SKUTR | SKTR */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setJtrTypeTab('SUTR');
                        setPerluasanJTR('SUTR');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                        jtrTypeTab === 'SUTR'
                          ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>SUTR (Saluran Udara TIC)</span>
                      <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold border ${
                        jtrTypeTab === 'SUTR'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        ● Aktif Digunakan
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setJtrTypeTab('SKUTR');
                        setPerluasanJTR('SKUTR');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                        jtrTypeTab === 'SKUTR'
                          ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>SKUTR (Kabel Udara TR)</span>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600 font-medium">
                        Belum Digunakan
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setJtrTypeTab('SKTR');
                        setPerluasanJTR('SKTR');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                        jtrTypeTab === 'SKTR'
                          ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>SKTR (Kabel Tanah TR)</span>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600 font-medium">
                        Belum Digunakan
                      </span>
                    </button>
                  </div>

                  {jtrTypeTab === 'SUTR' ? (
                    <>
                      {/* Tombol Cepat: Ambil Data Tiang dari JTM jika ada */}
                      {tmPoles.length > 0 && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] shrink-0">TM ➔ TR</span>
                        <span className="text-blue-900">
                          Terdapat <b>{tmPoles.length} Tiang JTM</b>. Anda bisa memakai tiang TM tersebut untuk saluran JTR (Underbuilt).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newTrPoles: PoleData[] = tmPoles.map((tm, tIdx) => {
                            const tmLabel = tm.id || `TM ${tIdx + 1}`;
                            return {
                              id: `TR (${tmLabel})`,
                              name: `Tiang TR Terusan ${tmLabel}`,
                              std: 'Underbuilt TM',
                              networkType: 'JTR',
                              poleStatus: tm.poleStatus || 'RENCANA',
                              poleType: `Terusan ${tmLabel}`,
                              trConstruction: 'TR - 1B',
                              lvTwisted: '45 m',
                              conductorLength: 45,
                              qty: 1,
                              coordStr: tm.coordStr || '',
                              lat: tm.lat,
                              lng: tm.lng,
                              note: `Terusan underbuilt dari ${tmLabel}`,
                              photo: tm.photo || '',
                            };
                          });
                          setTrPoles((prev) => [...prev, ...newTrPoles]);
                          showToast(`✓ Berhasil menambahkan ${newTrPoles.length} tiang terusan dari JTM ke JTR`);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Salin Semua Tiang JTM ke JTR (Underbuilt)</span>
                      </button>
                    </div>
                  )}

                  {/* Tabular Form Container for TR Poles */}
                  <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {trPoles.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[780px] border-collapse">
                          <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                            <tr className="divide-x divide-slate-200">
                              <th className="py-3.5 px-3 w-[26%]">{constructionRules?.jtr?.tiangLabel || 'Tiang'}</th>
                              <th className="py-3.5 px-3 w-[34%]">{constructionRules?.jtr?.konstruksiLabel || 'Konstruksi TR (Standar)'}</th>
                              <th className="py-3.5 px-3 w-[16%] text-center">{constructionRules?.jtr?.conductorLabel || 'JTR 70 (m)'}</th>
                              <th className="py-3.5 px-3 w-[18%]">Koordinat GPS (Lat, Long)</th>
                              <th className="py-3.5 px-2 w-[6%] text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {trPoles.map((p, idx) => (
                              <tr key={p.id || idx} className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                                {/* 1. Input Tiang */}
                                <td className="py-3 px-3">
                                  <select
                                    value={p.poleType || '9/200'}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const updated = [...trPoles];
                                      updated[idx].poleType = val;

                                      // Logika otomatis PLN: Tanpa Tiang = Tiang Existing, Ukuran Tiang = Rencana Baru
                                      updated[idx].poleStatus = val === 'Tanpa Tiang' ? 'EXISTING' : 'RENCANA';

                                      // Jika memilih terusan dari TM, otomatis salin koordinat GPS dari tiang TM jika ada
                                      if (val.startsWith('Terusan ')) {
                                        const tmId = val.replace('Terusan ', '').trim();
                                        const matchedTm = tmPoles.find((tm, tIdx) => (tm.id && tm.id.trim() === tmId) || `TM ${tIdx + 1}` === tmId || `TM #${tIdx + 1}` === tmId);
                                        if (matchedTm) {
                                          if (matchedTm.coordStr) updated[idx].coordStr = matchedTm.coordStr;
                                          if (matchedTm.lat !== null) updated[idx].lat = matchedTm.lat;
                                          if (matchedTm.lng !== null) updated[idx].lng = matchedTm.lng;
                                          if (matchedTm.poleStatus) updated[idx].poleStatus = matchedTm.poleStatus;
                                        }
                                      }
                                      setTrPoles(updated);
                                    }}
                                    className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium"
                                  >
                                    <option value="Tanpa Tiang">— Tanpa Tiang (Tiang Eksisting / Tidak Tambah Tiang) —</option>

                                    {tmPoles.length > 0 && (
                                      <optgroup label="━━ Terusan dari Tiang JTM (Underbuilt) ━━">
                                        {tmPoles.map((tm, tIdx) => {
                                          const tmLabel = tm.id || `TM ${tIdx + 1}`;
                                          const tmVal = `Terusan ${tmLabel}`;
                                          return (
                                            <option key={tIdx} value={tmVal}>
                                              Gunakan Tiang {tmLabel} ({tm.poleType === 'Tanpa Tiang' ? 'Eksisting' : tm.poleType || '12/200'})
                                            </option>
                                          );
                                        })}
                                      </optgroup>
                                    )}

                                    <optgroup label="━━ Tiang Standar TR (Dari Standar Konstruksi) ━━">
                                      {(constructionRules?.jtr?.tiangList || ['9/200', '9/350', '11/200', 'Tiang Besi 9m', 'Tiang Besi 11m']).map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                      ))}
                                    </optgroup>
                                  </select>
                                  {p.poleType?.startsWith('Terusan') && (
                                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium inline-block border border-blue-200 mt-1">
                                      ⚡ Underbuilt (Nempel Tiang TM)
                                    </span>
                                  )}
                                  {p.poleType === 'Tanpa Tiang' && (
                                    <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-medium inline-block border border-slate-300 mt-1">
                                      ⚫ Tiang Eksisting
                                    </span>
                                  )}
                                </td>

                                {/* 2. Input Konstruksi TR */}
                                <td className="py-3 px-3">
                                  <select
                                    value={p.trConstruction || 'TR - 1B'}
                                    onChange={(e) => {
                                      const updated = [...trPoles];
                                      updated[idx].trConstruction = e.target.value;
                                      setTrPoles(updated);
                                    }}
                                    className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium"
                                  >
                                    <option value="">Pilih Konstruksi TR</option>
                                    {(constructionRules?.jtr?.konstruksiList || [
                                      'TR - 1B', 'TR - 2B', 'TR - 3B', 'TR - 4B', 'TR - 5B', 'TR - 6B', 'TR - 7B',
                                      'TR - 8B', 'TR - 9B', 'TR - 10B AWAL', 'TR - 10B AKHIR', 'TR - 11B', 'PEMBUMIAN TR', 'STAY SET TR'
                                    ]).map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                    {p.trConstruction && !(constructionRules?.jtr?.konstruksiList || []).includes(p.trConstruction) && (
                                      <option value={p.trConstruction}>{p.trConstruction}</option>
                                    )}
                                  </select>
                                </td>

                                {/* 3. Input JTR 70 (meter) */}
                                <td className="py-3 px-3">
                                  <div className="relative flex items-center">
                                    <input
                                      type="number"
                                      min="0"
                                      value={p.conductorLength ?? (p.lvTwisted ? parseFloat(p.lvTwisted) : 45)}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        const updated = [...trPoles];
                                        updated[idx].conductorLength = val;
                                        updated[idx].lvTwisted = `${val} m`;
                                        setTrPoles(updated);
                                      }}
                                      className="w-full p-2 pr-7 border border-slate-200 rounded-xl text-xs text-center font-mono font-bold text-emerald-700 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                      placeholder="45"
                                    />
                                    <span className="absolute right-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">m</span>
                                  </div>
                                </td>

                                {/* 4. Koordinat (Lat, Long) & Tombol GPS */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="-6.xxxxxx, 106.xxxxxx"
                                      value={p.coordStr}
                                      onChange={(e) => {
                                        const updated = [...trPoles];
                                        updated[idx].coordStr = e.target.value;
                                        const val = e.target.value.trim();
                                        const parts = val.includes(',') ? val.split(',') : val.split(/\s+/);
                                        if (parts.length >= 2) {
                                          const lat = parseFloat(parts[0].trim());
                                          const lng = parseFloat(parts[1].trim());
                                          updated[idx].lat = isNaN(lat) ? null : lat;
                                          updated[idx].lng = isNaN(lng) ? null : lng;
                                        } else if (val === '') {
                                          updated[idx].lat = null;
                                          updated[idx].lng = null;
                                        }
                                        setTrPoles(updated);
                                      }}
                                      className="flex-1 p-2 border border-slate-200 rounded-xl text-xs font-mono font-medium bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleGpsCurrentLocation(idx, 'JTR');
                                      }}
                                      className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                                      title="Ambil titik GPS real-time saat ini"
                                    >
                                      <span>📍</span>
                                      <span>GPS</span>
                                    </button>
                                  </div>
                                </td>

                                {/* 5. Tombol Hapus */}
                                <td className="py-3 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      removePoleRow(idx, 'JTR');
                                    }}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                                  >
                                    Hapus
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50/50">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                          <Zap className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs mb-1">Belum Ada Tiang JTR yang Ditambahkan</h4>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto mb-4">
                          Jika survey ini hanya pekerjaan JTM / Gardu (tanpa perluasan JTR), Anda dapat mengosongkan bagian ini dan langsung lanjut ke tahap berikutnya.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            addTrPoleRow();
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Tambah Baris Tiang JTR</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tombol Tambah Baris TR */}
                  {trPoles.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          addTrPoleRow();
                        }}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Baris Tiang JTR</span>
                      </button>
                    </div>
                  )}
                    </>
                  ) : jtrTypeTab === 'SKUTR' ? (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Konstruksi SKUTR (Saluran Kabel Udara Tegangan Rendah)
                      </h4>
                      <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                        Konstruksi SKUTR menggunakan kabel pilin udara berisolasi penuh khusus. Saat ini, <b>standar survey yang aktif digunakan di wilayah kerja adalah SUTR (Saluran Udara Kabel Twisted/TIC)</b>.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setJtrTypeTab('SUTR');
                            setPerluasanJTR('SUTR');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Beralih ke Form SUTR (Aktif Digunakan)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Konstruksi SKTR (Saluran Kabel Tanah Tegangan Rendah)
                      </h4>
                      <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                        Konstruksi SKTR menggunakan penanaman kabel tanah TR (NYFGBY/Underground). Saat ini, <b>standar survey yang aktif digunakan adalah SUTR (Saluran Udara TIC)</b>. Fitur isian teknis SKTR disiapkan untuk proyek jaringan bawah tanah mendatang.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setJtrTypeTab('SUTR');
                            setPerluasanJTR('SUTR');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Beralih ke Form SUTR (Aktif Digunakan)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Review & Simpan */}
              {step === 5 && (
                <div className="space-y-4">
                  {/* Customer summary */}
                  <div className="bg-white p-5 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs shadow-2xs">
                    {/* Baris 1: Identitas Utama (2 Kolom Sejajar) */}
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold mb-0.5">Nama Pelanggan:</span>
                      <b className="text-slate-900 text-xs block leading-snug">{name || computedCustomerName || '— (Belum diisi)'}</b>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold mb-0.5">Petugas Survey:</span>
                      <b className="text-slate-800 text-xs">{officer || 'Petugas Lapangan'}</b>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold mb-0.5">Jenis Permohonan:</span>
                      <b className="text-slate-800 text-xs block">{jobType || 'Pasang Baru'}</b>
                    </div>

                    {/* Baris 2: Lokasi & Koordinat */}
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold mb-0.5">Alamat Lokasi:</span>
                      <b className="text-slate-800 text-xs block leading-snug">{address || computedLocation || location || '— (Belum diisi)'}</b>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold mb-0.5">Koordinat Lokasi (Lat, Long):</span>
                      <b className="text-slate-800 font-mono text-xs block">
                        {(latitude && longitude) ? `${latitude}, ${longitude}` : '—'}
                      </b>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold mb-0.5">Unit Layanan Pelanggan (ULP):</span>
                      <b className="text-slate-800 text-xs block">{ulp || 'ULP Rangkasbitung'}</b>
                    </div>

                    {/* Baris 3: Tarif & Daya (3 Kolom Sejajar) */}
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold mb-0.5">Daya & Tarif Baru:</span>
                      <b className="text-blue-700 font-mono text-xs">{dayaBaru || daya} VA ({tarifBaru || tarif})</b>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold mb-0.5">Daya & Tarif Lama:</span>
                      <b className="text-slate-700 font-mono text-xs">{dayaLama ? `${dayaLama} VA (${tarifLama || '-'})` : '— (Pasang Baru)'}</b>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-semibold mb-0.5">Unit / Sambungan:</span>
                      <b className="text-slate-800 text-xs block">{jumlahUnit ? `${jumlahUnit} Unit (${dayaPerUnit} VA)` : '1 Pelanggan'}</b>
                    </div>
                  </div>

                  {/* Technical Data summary */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs text-slate-800 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-blue-900/60 font-semibold uppercase tracking-wider block mb-0.5">Gardu Induk</span>
                      <b className="text-slate-900 truncate block text-xs">{garduInduk || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-900/60 font-semibold uppercase tracking-wider block mb-0.5">Penyulang</span>
                      <b className="text-slate-900 truncate block text-xs">{penyulang || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-900/60 font-semibold uppercase tracking-wider block mb-0.5">Gardu</span>
                      <b className="text-slate-900 font-mono text-xs">{gardu || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-900/60 font-semibold uppercase tracking-wider block mb-0.5">ULP</span>
                      <b className="text-slate-900 text-xs">{ulp || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-900/60 font-semibold uppercase tracking-wider block mb-0.5">Tipe Gardu</span>
                      <b className="text-slate-900 text-xs">{tipeGardu || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-900/60 font-semibold uppercase tracking-wider block mb-0.5">Kapasitas Trafo</span>
                      <b className="font-mono text-slate-900 text-xs">{kapasitasTrafo || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-900/60 font-semibold uppercase tracking-wider block mb-0.5">Kabel Naik</span>
                      <b className="text-slate-900 text-xs">{jumlahKabelNaik || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-900/60 font-semibold uppercase tracking-wider block mb-0.5">Perluasan JTM / JTR</span>
                      <b className="text-slate-900 text-xs">{[perluasanJTM, perluasanJTR].filter(Boolean).join(' • ') || '-'}</b>
                    </div>
                  </div>

                  {/* Peta Jalur & Hasil Geotagging Tiang */}
                  <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-800 text-xs">
                          Peta Jalur & Geotagging Titik Tiang ({allPoles.length} Titik Tiang)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Peta Satelit Hybrid & Koordinat GPS
                      </span>
                    </div>

                    {/* Leaflet Geotag Map */}
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <GeotagMap
                        poles={allPoles}
                        customerName={name || computedCustomerName}
                        onViewPhoto={(url, title, caption) => setPreviewPhoto({ url, title, caption })}
                      />
                    </div>

                    {/* Tabel Rincian Titik Tiang */}
                    {allPoles.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                            <tr className="divide-x divide-slate-200">
                              <th className="p-2.5">No</th>
                              <th className="p-2.5">Jaringan & Tiang</th>
                              <th className="p-2.5">Konstruksi</th>
                              <th className="p-2.5">Panjang Konduktor (m)</th>
                              <th className="p-2.5">Koordinat (GPS)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {allPoles.map((p, idx) => (
                              <tr key={idx} className="divide-x divide-slate-200 hover:bg-slate-50/60 transition">
                                <td className="p-2.5 font-bold text-slate-800">{p.id}</td>
                                <td className="p-2.5">
                                  <div className="font-semibold text-slate-800">{p.poleType || 'Tiang Beton 11m'}</div>
                                  <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    ((p.networkType || 'JTM') === 'JTM' || p.networkType === 'SUTM') ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {((p.networkType || 'JTM') === 'JTM' || p.networkType === 'SUTM') ? 'JTM' : 'JTR'}
                                  </span>
                                </td>
                                <td className="p-2.5">
                                  {((p.networkType || 'JTM') === 'JTM' || p.networkType === 'SUTM') ? (
                                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-bold border border-purple-200 text-[10px]">
                                      TM: {p.tmConstruction || 'TM - 1B'}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[10px]">
                                      TR: {p.trConstruction || 'TR - 1B'}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 font-mono font-bold text-slate-800">
                                  {((p.networkType || 'JTM') === 'JTM' || p.networkType === 'SUTM') ? (
                                    <span className="text-blue-700">{p.conductorLength !== undefined ? `${p.conductorLength} m` : (p.a3cs || '50 m')}</span>
                                  ) : (
                                    <span className="text-emerald-700">{p.conductorLength !== undefined ? `${p.conductorLength} m` : (p.lvTwisted || '45 m')}</span>
                                  )}
                                </td>
                                <td className="p-2.5 font-mono text-[11px]">
                                  {p.lat && p.lng ? (
                                    <span className="text-blue-700 font-bold">{p.lat.toFixed(6)}, {p.lng.toFixed(6)}</span>
                                  ) : (
                                    <span className="text-amber-600">Belum ada GPS</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl mt-3 text-xs">
                        Tidak ada titik tiang jaringan (JTM/JTR) yang didaftarkan pada survey ini.
                      </div>
                    )}
                  </div>

                  {/* Foto Dokumentasi Lokasi */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-purple-600" /> Foto Dokumentasi Lokasi ({locationPhotos.length} Foto)
                      </span>
                    </div>
                    {locationPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {locationPhotos.map((lp, idx) => (
                          <div
                            key={lp.id || idx}
                            onClick={() => setPreviewPhoto({ url: lp.url, title: lp.caption || `Foto Lokasi #${idx + 1}`, caption: lp.date })}
                            className="group relative aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer shadow-2xs hover:shadow-md transition"
                          >
                            <img src={lp.url} alt={lp.caption} className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                              Perbesar
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Belum ada foto dokumentasi lokasi tambahan yang diupload
                      </div>
                    )}
                  </div>
                  </div>
              )}
            </div>


            {/* Modal Footer Actions */}
            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as any)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Sebelumnya
                </button>
              ) : isDetailMode ? (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Tutup
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep((step + 1) as any)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  Lanjut Tahap Berikutnya <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : isDetailMode ? (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <X className="w-4 h-4" /> Tutup Detail
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveSurvey}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Simpan Survey Lapangan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Resolution Photo Viewer Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">{previewPhoto.title}</h4>
              <button onClick={() => setPreviewPhoto(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-h-[360px] max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
            <div className="p-3 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>{previewPhoto.caption || 'Dokumentasi visual fisik lapangan'}</span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="px-3 py-1 bg-slate-200 text-slate-700 rounded font-semibold text-xs hover:bg-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dokumen Resmi Output RAB Paket 1 (JTM) & Paket 2 (JTR) */}
      {selectedRabDoc && (
        <RabDocumentModal
          isOpen={!!selectedRabDoc}
          onClose={() => setSelectedRabDoc(null)}
          survey={selectedRabDoc.survey}
          initialPaket={selectedRabDoc.paket}
          mode="rab"
        />
      )}
    </div>
  );
};
