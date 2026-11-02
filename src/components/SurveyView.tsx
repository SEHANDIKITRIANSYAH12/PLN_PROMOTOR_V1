'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

export const SurveyView: React.FC = () => {
  const { 
    surveys, 
    addSurvey, 
    updateSurveyStatus, 
    deleteSurvey, 
    showToast, 
    setCurrentPage,
    setActiveDaftungTab,
    openRabForSurvey,
    customKhsPrices 
  } = usePromotorStore();

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

  const [tmPoles, setTmPoles] = useState<PoleData[]>([
    {
      id: 'TM 1',
      name: 'Tiang TM #1',
      std: 'Tiang 12/200',
      networkType: 'JTM',
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

  const [trPoles, setTrPoles] = useState<PoleData[]>([
    {
      id: 'TR 1',
      name: 'Tiang TR #1',
      std: 'Tiang 9/200',
      networkType: 'JTR',
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

  const removePoleRow = (index: number) => {
    if (networkTab === 'JTM') {
      if (tmPoles.length === 1) {
        showToast('Minimal satu baris survey tiang JTM harus ada');
        return;
      }
      const updated = tmPoles
        .filter((_, i) => i !== index)
        .map((p, idx) => ({
          ...p,
          id: `TM ${idx + 1}`,
          name: `Tiang TM #${idx + 1}`,
        }));
      setTmPoles(updated);
    } else {
      if (trPoles.length === 1) {
        showToast('Minimal satu baris survey tiang JTR harus ada');
        return;
      }
      const updated = trPoles
        .filter((_, i) => i !== index)
        .map((p, idx) => ({
          ...p,
          id: `TR ${idx + 1}`,
          name: `Tiang TR #${idx + 1}`,
        }));
      setTrPoles(updated);
    }
  };

  const handleGpsCurrentLocation = (index: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          if (networkTab === 'JTM') {
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
          if (networkTab === 'JTM') {
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

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (networkTab === 'JTM') {
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
      showToast('Nama pekerjaan dan alamat lokasi pekerjaan wajib diisi');
      return;
    }

    addSurvey({
      customerName: finalCustomerName,
      namaDasar: finalCustomerName,
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
    });

    showToast(`✓ Survey berhasil dibuat! Output RAB Paket 1 (JTM) & Paket 2 (JTR) otomatis diterbitkan.`);

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
    setOfficer('');
    setDaya('197,000');
    setTarif('I2');
    setPenyulang('GI Rangkasbitung Baru (ONA) ; P. Leuwidamar');
    setTipeGardu('Portal');
    setKapasitasTrafo('250');
    setJumlahKabelNaik('2 Jurusan');
    setLocationPhotos([]);
    setTmPoles([
      {
        id: 'TM 1',
        name: 'Tiang TM #1',
        std: 'Tiang 12/200',
        networkType: 'JTM',
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
    setTrPoles([
      {
        id: 'TR 1',
        name: 'Tiang TR #1',
        std: 'Tiang 9/200',
        networkType: 'JTR',
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Tahap 1: Alur Utama
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Survey Pelanggan ➔ Daftar Tunggu (Daftung) ➔ Work Order
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Survey Pelanggan & Geotagging Tiang</h2>
          <p className="text-xs text-slate-500">
            Lakukan survey lapangan pelanggan terlebih dahulu untuk menentukan rincian teknis tiang/kabel dan RAB. Setelah selesai, data dikirim ke Daftar Tunggu (Daftung / AP2T).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentPage('daftung')}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Lanjut ke menu Daftar Tunggu"
          >
            <span>Ke Daftar Tunggu →</span>
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
              setOfficer('Petugas Lapangan');
              setIsModalOpen(true);
              setStep(1);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> ＋ Survey Baru
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
                <th className="py-3.5 px-4">IDPEL</th>
                <th className="py-3.5 px-4">Nama Pekerjaan</th>
                <th className="py-3.5 px-4">Lokasi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data survey yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedSurveys.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors divide-x divide-slate-200">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{s.id}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">{s.idpel || '—'}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.customerName}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{s.location}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      s.status === 'Terverifikasi'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : s.status === 'Masuk Antrean AP2T'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
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

                      {/* 1 Tombol Dokumen RAB */}
                      <button
                        type="button"
                        onClick={() => {
                          const initialPaket = s.poles?.some((p) => p.networkType === 'JTM' || p.id.startsWith('TM'))
                            ? 'paket1'
                            : 'paket2';
                          setSelectedRabDoc({ survey: s, paket: initialPaket });
                        }}
                        className="px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold rounded-lg transition border border-indigo-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Buka Dokumen RAB (Paket 1 & Paket 2)"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>RAB</span>
                      </button>

                      {s.status === 'Menunggu verifikasi Daftung' && (
                        <button
                          onClick={() => {
                            updateSurveyStatus(s.id, 'Masuk Antrean AP2T');
                            setActiveDaftungTab('ap2t');
                            showToast(`✓ Survey ${s.id} masuk ke Daftung (Menunggu Verifikasi AP2T)`);
                          }}
                          className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="Kirim survey ini ke Daftung untuk Verifikasi AP2T"
                        >
                          <span>Kirim ke Daftung →</span>
                        </button>
                      )}

                      {s.status === 'Masuk Antrean AP2T' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDaftungTab('ap2t');
                            setCurrentPage('daftung');
                          }}
                          className="px-2.5 py-1.5 text-xs text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center gap-1.5 transition cursor-pointer"
                          title="Buka Verifikasi AP2T di menu Daftung"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>Verifikasi AP2T →</span>
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
                  Tahap {step} dari 5: {step === 1 ? 'Data Pelanggan' : step === 2 ? 'Data Teknis' : step === 3 ? 'Survey Lapangan & Koordinat' : step === 4 ? 'Peta & Hasil Tagging' : isDetailMode ? 'Detail Survey & Foto' : 'Detail Survey & Simpan'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs (5 Tabs) */}
            <div className="flex border-b border-slate-200 bg-slate-100/60 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setStep(1)}
                className={`flex-1 py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition ${step === 1 ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500'}`}
              >
                1. Data Pelanggan
              </button>
              <button
                onClick={() => setStep(2)}
                className={`flex-1 py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition ${step === 2 ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500'}`}
              >
                2. Data Teknis
              </button>
              <button
                onClick={() => setStep(3)}
                className={`flex-1 py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition ${step === 3 ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500'}`}
              >
                3. Survey Lapangan
              </button>
              <button
                onClick={() => setStep(4)}
                className={`flex-1 py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition ${step === 4 ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500'}`}
              >
                4. Peta & Hasil Tagging
              </button>
              <button
                onClick={() => setStep(5)}
                className={`flex-1 py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition ${step === 5 ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500'}`}
              >
                {isDetailMode ? '5. Detail & Foto' : '5. Detail & Simpan'}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* STEP 1: Data Pelanggan */}
              {step === 1 && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
                    <b>Data Pelanggan:</b> Masukkan data identitas pemohon sesuai formulir survey PLN.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* ID Pelanggan (IDPEL) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        ID Pelanggan (IDPEL)
                      </label>
                      <input
                        type="text"
                        value={idpel}
                        onChange={(e) => setIdpel(e.target.value)}
                        placeholder="Contoh: 547100123456 (opsional)"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Nama Pekerjaan */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Nama Pekerjaan *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setNamaDasar(e.target.value);
                        }}
                        placeholder="Contoh: Pembangunan SUTR Untuk PB / PERUMAHAN MUTIARA MAJA 212 X 1.300 VA"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* Daya Lama */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Daya Lama
                      </label>
                      <input
                        type="text"
                        value={dayaLama}
                        onChange={(e) => setDayaLama(e.target.value)}
                        placeholder="Kosongkan jika Pasang Baru"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Tarif Lama */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Tarif Lama
                      </label>
                      <input
                        type="text"
                        value={tarifLama}
                        onChange={(e) => setTarifLama(e.target.value)}
                        placeholder="Kosongkan jika Pasang Baru"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* Daya Baru */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Daya Baru *
                      </label>
                      <input
                        type="text"
                        value={dayaBaru}
                        onChange={(e) => {
                          setDayaBaru(e.target.value);
                          setDaya(e.target.value);
                        }}
                        placeholder="Contoh: 1.300"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Tarif Baru */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Tarif Baru *
                      </label>
                      <input
                        type="text"
                        value={tarifBaru}
                        onChange={(e) => {
                          setTarifBaru(e.target.value);
                          setTarif(e.target.value);
                        }}
                        placeholder="Contoh: R1T"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* Alamat */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Alamat *
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setLocation(e.target.value);
                        }}
                        placeholder="Contoh: Curug Badak, Kabupaten Lebak, Banten"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Data Teknis */}
              {step === 2 && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
                    <b>Data Teknis:</b> Masukkan data gardu induk, penyulang, gardu, perluasan jaringan, mutasi trafo, dan gardu beton sesuai format survey PLN.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Baris 21: Gardu Induk */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Gardu Induk *
                      </label>
                      <input
                        type="text"
                        value={garduInduk}
                        onChange={(e) => setGarduInduk(e.target.value)}
                        placeholder="Contoh: RANGKASBITUNG BARU (ONA)"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* Baris 22: Penyulang */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Penyulang *
                      </label>
                      <input
                        type="text"
                        value={penyulang}
                        onChange={(e) => setPenyulang(e.target.value)}
                        placeholder="Contoh: CITRA"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* Baris 23: Gardu */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Gardu *
                      </label>
                      <input
                        type="text"
                        value={gardu}
                        onChange={(e) => setGardu(e.target.value)}
                        placeholder="Contoh: MAJA045"
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Baris 24: ULP (Dropdown) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        ULP *
                      </label>
                      <select
                        value={ulp}
                        onChange={(e) => setUlp(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                      >
                        <option value="ULP Rangkasbitung">ULP Rangkasbitung</option>
                        <option value="ULP Pandeglang">ULP Pandeglang</option>
                        <option value="ULP Malingping">ULP Malingping</option>
                        <option value="ULP Labuan">ULP Labuan</option>
                      </select>
                    </div>

                    {/* Baris 26: Perluasan JTM (Dropdown) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Perluasan JTM
                      </label>
                      <select
                        value={perluasanJTM}
                        onChange={(e) => setPerluasanJTM(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">— Kosongkan / Tidak Ada —</option>
                        <option value="SUTM">SUTM</option>
                        <option value="SKUTM (MVTIC)">SKUTM (MVTIC)</option>
                        <option value="SKTM">SKTM</option>
                      </select>
                    </div>

                    {/* Baris 27: Tipe Pembangunan Gardu (Dropdown) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Tipe Pembangunan Gardu
                      </label>
                      <select
                        value={tipeGardu}
                        onChange={(e) => setTipeGardu(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">— Kosongkan / Tidak Ada —</option>
                        <option value="Gardu Cantol Distribusi">Gardu Cantol Distribusi</option>
                        <option value="Gardu Cantol Khusus">Gardu Cantol Khusus</option>
                        <option value="Gardu Portal Distribusi">Gardu Portal Distribusi</option>
                        <option value="Gardu Portal Khusus">Gardu Portal Khusus</option>
                        <option value="Gardu Portal RMU">Gardu Portal RMU</option>
                      </select>
                    </div>

                    {/* Baris 28: Kapasitas Trafo (Dropdown) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Kapasitas Trafo
                      </label>
                      <select
                        value={kapasitasTrafo}
                        onChange={(e) => setKapasitasTrafo(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono"
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

                    {/* Baris 29: Jumlah Kabel Naik (Dropdown) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Jumlah Kabel Naik
                      </label>
                      <select
                        value={jumlahKabelNaik}
                        onChange={(e) => setJumlahKabelNaik(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono"
                      >
                        <option value="">— Kosongkan / Tidak Ada —</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>

                    {/* Baris 30: Perluasan JTR (Dropdown) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Perluasan JTR
                      </label>
                      <select
                        value={perluasanJTR}
                        onChange={(e) => setPerluasanJTR(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">— Kosongkan / Tidak Ada —</option>
                        <option value="SUTR">SUTR</option>
                        <option value="SKUTR">SKUTR</option>
                        <option value="SKTR">SKTR</option>
                      </select>
                    </div>

                    {/* Baris 32: Mutasi Trafo Distribusi Header */}
                    <div className="sm:col-span-2 pt-2">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center gap-2">
                        <span>Mutasi Trafo Distribusi</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(kosongkan jika tidak ada)</span>
                      </div>
                    </div>

                    {/* Baris 33: Trafo Lama (Dropdown - Sama dengan Kapasitas Trafo) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Mutasi: Trafo Lama
                      </label>
                      <select
                        value={trafoLama}
                        onChange={(e) => setTrafoLama(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono"
                      >
                        <option value="">— Kosongkan jika tidak ada mutasi —</option>
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

                    {/* Baris 34: Trafo Baru (Dropdown - Sama dengan Kapasitas Trafo) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Mutasi: Trafo Baru
                      </label>
                      <select
                        value={trafoBaru}
                        onChange={(e) => setTrafoBaru(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono"
                      >
                        <option value="">— Kosongkan jika tidak ada mutasi —</option>
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

                    {/* Baris 36: Gardu Beton Distribusi Header */}
                    <div className="sm:col-span-2 pt-2">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center gap-2">
                        <span>Gardu Beton Distribusi</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(kosongkan jika tidak ada)</span>
                      </div>
                    </div>

                    {/* Baris 37: Jenis Pekerjaan (Dropdown) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Gardu Beton: Jenis Pekerjaan
                      </label>
                      <select
                        value={jenisPekerjaanGardu}
                        onChange={(e) => setJenisPekerjaanGardu(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">— Kosongkan jika tidak ada —</option>
                        <option value="Pemasangan Instalasi Gardu">Pemasangan Instalasi Gardu</option>
                        <option value="Bongkar Pasang CT TM Gardu">Bongkar Pasang CT TM Gardu</option>
                      </select>
                    </div>

                    {/* Baris 38: Jumlah Kubikel LBS (Dropdown) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        Jumlah Kubikel LBS
                      </label>
                      <select
                        value={jumlahKubikelLBS}
                        onChange={(e) => setJumlahKubikelLBS(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-mono"
                      >
                        <option value="">— Kosongkan jika tidak ada —</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Data Survey Lapangan & Koordinat (Pilihan Tab JTM vs JTR) */}
              {step === 3 && (
                <div className="space-y-4 text-xs">
                  {/* Notice Banner */}
                  <div className="p-3.5 bg-[#f0f6fd] border border-[#d6e6f7] rounded-xl text-[#1e40af] text-xs leading-relaxed flex items-center justify-between">
                    <div>
                      <b>Survey Lapangan & Koordinat:</b> Input spesifikasi teknis dan titik koordinat GPS (ketik manual atau klik tombol 📍 <b>GPS</b>) langsung di setiap baris tiang. Tahap 4 berikutnya akan menampilkan visualisasi peta dan hasil tagging tiangnya.
                    </div>
                  </div>

                  {/* JTM / JTR / Upload Foto Lokasi Segmented Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNetworkTab('JTM')}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                          networkTab === 'JTM'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <span>⚡ JTM</span>
                        <span className="text-[10px] font-normal opacity-90">({tmPoles.length} Tiang)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNetworkTab('JTR')}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                          networkTab === 'JTR'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <span>🔌 JTR</span>
                        <span className="text-[10px] font-normal opacity-90">({trPoles.length} Tiang)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNetworkTab('FOTO')}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                          networkTab === 'FOTO'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload Foto Lokasi</span>
                        <span className="text-[10px] font-normal opacity-90">({locationPhotos.length} Foto)</span>
                      </button>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 pr-2 flex items-center gap-2">
                      <span>Total: <b className="text-slate-800">{allPoles.length} Tiang • {locationPhotos.length} Foto Lokasi</b></span>
                    </div>
                  </div>

                  {/* Content Tab: If FOTO, display Photo Upload Gallery; otherwise display Pole Table */}
                  {networkTab === 'FOTO' ? (
                    <div className="space-y-4">
                      {/* Photo Upload Zone */}
                      <div className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 rounded-2xl p-6 text-center transition flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2 shadow-2xs">
                          <Camera className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs mb-1">Upload Dokumentasi Foto Lapangan</h4>
                        <p className="text-[11px] text-slate-500 max-w-md mb-3">
                          Lampirkan foto kondisi lokasi, akses jalan, calon titik tiang, atau patokan lapangan (bisa langsung dari kamera HP atau galeri).
                        </p>
                        <label className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition">
                          <Plus className="w-4 h-4" />
                          <span>Pilih Foto dari Perangkat</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleLocationPhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Photo Grid Gallery */}
                      {locationPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {locationPhotos.map((photo, pIdx) => (
                            <div key={photo.id} className="relative group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition">
                              <div className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto({ url: photo.url, title: `Foto Lokasi #${pIdx + 1}`, caption: photo.caption })}>
                                <img
                                  src={photo.url}
                                  alt={photo.caption}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                  <Eye className="w-4 h-4" /> Perbesar
                                </div>
                              </div>
                              <div className="p-2.5">
                                <input
                                  type="text"
                                  value={photo.caption}
                                  onChange={(e) => {
                                    const updated = [...locationPhotos];
                                    updated[pIdx].caption = e.target.value;
                                    setLocationPhotos(updated);
                                  }}
                                  placeholder="Keterangan foto..."
                                  className="w-full text-[11px] font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none py-0.5 bg-transparent"
                                />
                                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                                  <span>{photo.date}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeLocationPhoto(photo.id)}
                                    className="text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-xl bg-slate-50 text-xs">
                          Belum ada foto lokasi yang diunggah. Klik tombol di atas untuk menambahkan foto dokumentasi.
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Tabular Form Container for Poles */}
                      <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[880px] border-collapse">
                            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                              <tr className="divide-x divide-slate-200">
                                <th className="py-3.5 px-3 w-[8%] text-center">No Tiang</th>
                                <th className="py-3.5 px-3 w-[26%]">Tiang</th>
                                {networkTab === 'JTM' ? (
                                  <>
                                    <th className="py-3.5 px-3 w-[28%]">Konstruksi TM (Standar)</th>
                                    <th className="py-3.5 px-3 w-[16%] text-center">A3CS (m)</th>
                                  </>
                                ) : (
                                  <>
                                    <th className="py-3.5 px-3 w-[28%]">Konstruksi TR (Standar)</th>
                                    <th className="py-3.5 px-3 w-[16%] text-center">JTR 70 (m)</th>
                                  </>
                                )}
                                <th className="py-3.5 px-3 w-[16%]">Koordinat GPS (Lat, Long)</th>
                                <th className="py-3.5 px-2 w-[6%] text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {(networkTab === 'JTM' ? tmPoles : trPoles).map((p, idx) => (
                                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                                  {/* No Tiang */}
                                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      networkTab === 'JTM' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                      {p.id}
                                    </span>
                                  </td>

                                  {/* 1. Input Tiang */}
                                  <td className="py-3 px-3">
                                    <select
                                      value={p.poleType || (networkTab === 'JTM' ? '12/200' : '9/200')}
                                      onChange={(e) => {
                                        if (networkTab === 'JTM') {
                                          const updated = [...tmPoles];
                                          updated[idx].poleType = e.target.value;
                                          setTmPoles(updated);
                                        } else {
                                          const updated = [...trPoles];
                                          updated[idx].poleType = e.target.value;
                                          setTrPoles(updated);
                                        }
                                      }}
                                      className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                                    >
                                      <option value="">Pilih Tiang</option>
                                      {networkTab === 'JTM' ? (
                                        <>
                                          <option value="12/200">12/200</option>
                                          <option value="12/350">12/350</option>
                                          <option value="12/350 (GARDU)">12/350 (GARDU)</option>
                                          <option value="11/200">11/200</option>
                                          <option value="11/350">11/350</option>
                                          <option value="11/500">11/500</option>
                                          <option value="13/350">13/350</option>
                                          <option value="14/350">14/350</option>
                                          <option value="Tiang Besi 11m">Tiang Besi 11m</option>
                                          <option value="Tiang Besi 12m">Tiang Besi 12m</option>
                                        </>
                                      ) : (
                                        <>
                                          <option value="9/200">9/200</option>
                                          <option value="9/350">9/350</option>
                                          <option value="11/200">11/200</option>
                                          <option value="Tiang Besi 9m">Tiang Besi 9m</option>
                                          <option value="Tiang Besi 11m">Tiang Besi 11m</option>
                                        </>
                                      )}
                                    </select>
                                  </td>

                                  {/* 2 & 3. JTM vs JTR Fields */}
                                  {networkTab === 'JTM' ? (
                                    <>
                                      {/* Input Konstruksi TM */}
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
                                          <option value="TM - 1B">TM - 1B (Tumpu)</option>
                                          <option value="TM - 2B">TM - 2B (Sudut Kecil)</option>
                                          <option value="TM - 3B">TM - 3B (Sudut Sedang)</option>
                                          <option value="TM - 4B">TM - 4B (Sudut Besar)</option>
                                          <option value="TM - 5B">TM - 5B (Awal / Akhir)</option>
                                          <option value="TM - 6B">TM - 6B (Cabang)</option>
                                          <option value="TM - 7B">TM - 7B (Double Arm)</option>
                                          <option value="TM - 8B">TM - 8B (Transposisi)</option>
                                          <option value="TM - 9B">TM - 9B (Portal TM)</option>
                                          <option value="TM - 10B">TM - 10B (Section)</option>
                                          <option value="TM - 11B">TM - 11B (+ LA 3)</option>
                                          <option value="TM - 12B">TM - 12B (+ LA 3)</option>
                                          <option value="TM - 13B">TM - 13B</option>
                                          <option value="TM - 14B">TM - 14B</option>
                                          <option value="GARDU CANTOL DISTRIBUSI">GARDU CANTOL DISTRIBUSI</option>
                                          <option value="GARDU CANTOL KHUSUS">GARDU CANTOL KHUSUS</option>
                                          <option value="GARDU PORTAL DISTRIBUSI">GARDU PORTAL DISTRIBUSI</option>
                                          <option value="GARDU PORTAL KHUSUS">GARDU PORTAL KHUSUS</option>
                                          <option value="GARDU PORTAL RMU">GARDU PORTAL RMU</option>
                                          <option value="GARDU BETON">GARDU BETON</option>
                                          <option value="STAYSET">STAYSET</option>
                                          <option value="KONTRAMASK">KONTRAMASK</option>
                                          <option value="CO AFTAK">CO AFTAK</option>
                                        </select>
                                      </td>

                                      {/* Input A3CS (meter) - Kolom D Baris 41 Master Excel */}
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
                                    </>
                                  ) : (
                                    <>
                                      {/* Input Konstruksi TR */}
                                      <td className="py-3 px-3">
                                        <select
                                          value={p.trConstruction || 'TR - 1B'}
                                          onChange={(e) => {
                                            const updated = [...trPoles];
                                            updated[idx].trConstruction = e.target.value;
                                            setTrPoles(updated);
                                          }}
                                          className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                                        >
                                          <option value="">Pilih Konstruksi TR</option>
                                          <option value="TR - 1B">TR - 1B (Tumpu TR)</option>
                                          <option value="TR - 2B">TR - 2B (Sudut Kecil TR)</option>
                                          <option value="TR - 3B">TR - 3B (Sudut Sedang TR)</option>
                                          <option value="TR - 4B">TR - 4B</option>
                                          <option value="TR - 5B">TR - 5B</option>
                                          <option value="TR - 6B">TR - 6B</option>
                                          <option value="TR - 7B">TR - 7B</option>
                                          <option value="TR - 8B">TR - 8B</option>
                                          <option value="TR - 9B">TR - 9B</option>
                                          <option value="TR - 10B AWAL">TR - 10B AWAL (Tegang Awal TR)</option>
                                          <option value="TR - 10 B AKHIR">TR - 10 B AKHIR (Tegang Akhir TR)</option>
                                          <option value="TR - 11B">TR - 11B (Tiang Akhir Kabel TR)</option>
                                          <option value="PEMBUMIAN TR">PEMBUMIAN TR</option>
                                          <option value="STAY SET TR">STAY SET TR</option>
                                        </select>
                                      </td>

                                      {/* Input JTR 70 (meter) - Kolom D Baris 121 Master Excel */}
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
                                    </>
                                  )}

                                  {/* 4. Koordinat (Lat, Long) & Tombol GPS */}
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        placeholder="-6.xxxxxx, 106.xxxxxx"
                                        value={p.coordStr}
                                        onChange={(e) => {
                                          const isTM = networkTab === 'JTM';
                                          const updated = isTM ? [...tmPoles] : [...trPoles];
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
                                          if (isTM) setTmPoles(updated);
                                          else setTrPoles(updated);
                                        }}
                                        className="flex-1 p-2 border border-slate-200 rounded-xl text-xs font-mono font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleGpsCurrentLocation(idx)}
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
                                      onClick={() => removePoleRow(idx)}
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
                      </div>

                      {/* Tombol Tambah Baris */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={addPoleRow}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambah baris survey ({networkTab})</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 4: Koordinat Map (Hanya Gambar Peta dan Hasil Tagging) */}
              {step === 4 && (
                <div className="space-y-4 text-xs">
                  {/* Notice Banner */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center justify-between">
                    <div>
                      <b>Peta Geotagging & Hasil Tagging:</b> Menampilkan gambar peta satelit dan persebaran titik tiang (<b>⚡ TM</b> dan <b>🔌 TR</b>) serta bentangan jaringan yang telah diinput di tahap sebelumnya.
                    </div>
                  </div>

                  {/* Leaflet Map with Google Satelit Hybrid & Tagging Markers */}
                  <GeotagMap
                    poles={allPoles}
                    onViewPhoto={(url, title, caption) => setPreviewPhoto({ url, title, caption })}
                  />
                </div>
              )}

              {/* STEP 5: Review & Simpan */}
              {step === 5 && (
                <div className="space-y-4">
                  {/* Customer summary */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block font-semibold">Nama Pekerjaan:</span>
                      <b className="text-slate-900 text-xs">{name || computedCustomerName || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">IDPEL:</span>
                      <b className="text-slate-800 font-mono">{idpel || '—'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Petugas Survey:</span>
                      <b className="text-slate-800">{officer || 'Petugas Lapangan'}</b>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block font-semibold">Alamat:</span>
                      <b className="text-slate-800">{address || computedLocation || location || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Daya & Tarif Baru:</span>
                      <b className="text-blue-900 font-mono">{dayaBaru || daya} VA ({tarifBaru || tarif})</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Daya & Tarif Lama:</span>
                      <b className="text-slate-700 font-mono">{dayaLama ? `${dayaLama} VA (${tarifLama || '-'})` : '— (Baru)'}</b>
                    </div>
                  </div>

                  {/* Technical Data summary */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Gardu Induk</span>
                      <b className="text-slate-900 truncate block">{garduInduk || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Penyulang</span>
                      <b className="text-slate-900 truncate block">{penyulang || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Gardu</span>
                      <b className="text-slate-900 font-mono">{gardu || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">ULP</span>
                      <b className="text-slate-900">{ulp || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Tipe Gardu</span>
                      <b className="text-slate-900">{tipeGardu || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Kapasitas Trafo</span>
                      <b className="font-mono text-slate-900">{kapasitasTrafo || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Kabel Naik</span>
                      <b className="text-slate-900">{jumlahKabelNaik || '-'}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Perluasan JTM / JTR</span>
                      <b className="text-slate-900">{[perluasanJTM, perluasanJTR].filter(Boolean).join(' • ') || '-'}</b>
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
                        onViewPhoto={(url, title, caption) => setPreviewPhoto({ url, title, caption })}
                      />
                    </div>

                    {/* Tabel Rincian Titik Tiang */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                          <tr className="divide-x divide-slate-200">
                            <th className="p-2.5">No</th>
                            <th className="p-2.5">Jaringan & Tiang</th>
                            <th className="p-2.5">Konstruksi</th>
                            <th className="p-2.5">A3CS / JTR 70 (m)</th>
                            <th className="p-2.5">Koordinat (GPS)</th>
                            <th className="p-2.5">Keterangan</th>
                            <th className="p-2.5 text-center">Foto</th>
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
                              <td className="p-2.5 text-slate-600">{p.note || '—'}</td>
                              <td className="p-2.5 text-center">
                                {p.photo ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewPhoto({ url: p.photo!, title: `Foto ${p.name}`, caption: p.note || p.std })}
                                    className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
                                  >
                                    <Camera className="w-3 h-3" /> Lihat Foto
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
