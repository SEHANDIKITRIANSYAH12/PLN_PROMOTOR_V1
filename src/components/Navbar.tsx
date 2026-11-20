'use client';

import React, { useState } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { Role } from '@/types';
import { RefreshCw, ChevronDown, Check, LogOut, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { currentRole, setCurrentRole, currentUser, setCurrentUser, users, currentPage, toastMessage, clearToast, showToast } = usePromotorStore();
  const [isRbacOpen, setIsRbacOpen] = useState(false);

  const titles: Record<string, { title: string; sub: string }> = {
    dashboard: { title: 'SURVEY PELANGGAN', sub: 'Proses survey lapangan & kalkulasi material otomatis' },
    survey: { title: 'SURVEY PELANGGAN', sub: 'Proses survey lapangan & kalkulasi material otomatis' },
    pradaftung: { title: 'POTENSI DAFTUNG', sub: 'Verifikasi data AP2T & prakiraan potensi calon pelanggan sebelum masuk daftar tunggu' },
    daftung: { title: 'DAFTAR TUNGGU (DAFTUNG)', sub: 'Monitoring SLA & verifikasi data pelanggan AP2T' },
    wo: { title: 'WORK ORDER (WO)', sub: 'Penerbitan perintah kerja & alokasi kontrak vendor' },
    'persetujuan-wo': { title: 'PERSETUJUAN WORK ORDER', sub: 'Approval Asman atas WO, penerbitan nomor WO, & beban pagu kontrak rekanan' },
    'reservasi-material': { title: 'RESERVASI MATERIAL GUDANG', sub: 'Alokasi stok gudang PLN, nomor reservasi ERP/SAP, substitusi & penahanan material' },
    'verifikasi-pengawas': { title: 'VERIFIKASI & PROGRES LAPANGAN', sub: 'Verifikasi fisik Surat Jalan, monitoring progres fisik (%), dan opname realisasi/retur' },
    'vendor-ambil': { title: 'MENU VENDOR PELAKSANA', sub: 'Pengambilan material di gudang, penerimaan Surat Jalan, & laporan progres pekerjaan' },
    'stok-gudang': { title: 'GUDANG & LOGISTIK', sub: 'Stok fisik gudang & sinkronisasi SAP' },
    'mutasi-material': { title: 'MUTASI MATERIAL (GI SAP)', sub: 'Pergerakan material gudang ke GI/SAP: nomor reservasi, surat jalan, dan posting GI Sistem/Non-Sistem' },
    'sweeping-material': { title: 'SWEEPING MATERIAL', sub: 'Rekonsiliasi material pengambilan (TUG-9) vs terpasang vs pengembalian/bongkaran (TUG-10)' },
    'analisis-material': { title: 'ANALISIS KEBUTUHAN MATERIAL', sub: 'Neraca ketersediaan material: Potensi Daftung, Reservasi vs Stok Fisik Gudang' },
    kontrak: { title: 'MASTER KONTRAK (KHS)', sub: 'SPK rekanan, pagu anggaran, tautan pengawas, dan realisasi terpakai dari Work Order' },
    'master-material': { title: 'KONTRAK PENGADAAN MATERIAL', sub: 'SPK pabrikan, HPS/RAB Nodin, masa kontrak, & rincian pasokan material ke gudang UP3' },
    pengawas: { title: 'MASTER PENGAWAS', sub: 'Data pengawas teknik 1 & 2, unit kerja, dan cakupan wilayah pengawasan' },
    khs: { title: 'MASTER HS WO PAKET 1 & 2', sub: 'Katalog harga satuan material dan jasa distribusi UP3 Banten Selatan' },
    audit: { title: 'AUDIT LOG AKTIVITAS', sub: 'Jejak rekam historis setiap aktivitas sistem' },
    std: { title: 'STANDAR KONSTRUKSI', sub: 'Master matriks konstruksi TM/TR & BOM' },
    pengaturan: { title: 'PENGATURAN SISTEM', sub: 'Manajemen akun pengguna dan konfigurasi sistem' },
  };

  const headerInfo = titles[currentPage] || { title: 'PROMOTOR PLN', sub: 'Sistem Monitoring & Material Kontrol' };

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'Super Admin':
        return { badge: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'Admin Survey':
        return { badge: 'Admin Survey', color: 'bg-sky-100 text-sky-700 border-sky-200' };
      case 'Admin Daftung':
        return { badge: 'Admin Daftung', color: 'bg-violet-100 text-violet-700 border-violet-200' };
      case 'Admin WO':
        return { badge: 'Admin WO', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'Pengawas':
        return { badge: 'Pengawas', color: 'bg-teal-100 text-teal-700 border-teal-200' };
      case 'Vendor':
        return { badge: 'Vendor', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'Admin Gudang':
        return { badge: 'Admin Gudang', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'Approval':
        return { badge: 'Asman (Approval)', color: 'bg-rose-100 text-rose-700 border-rose-200' };
      default:
        return { badge: role, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between shadow-2xs print:hidden">
        {/* Left: Module Title & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base lg:text-lg font-black text-slate-900 tracking-tight uppercase">
              {headerInfo.title}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {headerInfo.sub}
            </p>
          </div>
        </div>

        {/* Right: PLN Unit Badge, Sync Data Button, and RBAC User Switcher Dropdown */}
        <div className="flex items-center gap-3">
          {/* PLN UP3 Banten Selatan Small Logo Badge */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
            <img
              src="/Logo_PLN.png"
              alt="PLN Logo"
              className="h-5 w-auto object-contain shrink-0"
            />
            <span className="font-bold text-[11px] text-slate-800">PLN UP3 BANTEN SELATAN</span>
          </div>

          {/* Sync Data Button */}
          <button
            onClick={() => showToast('Sinkronisasi data berhasil: Data AP2T & Fisik Gudang terbarukan')}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-2xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Sync Data</span>
          </button>

          {/* RBAC User Account Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsRbacOpen(!isRbacOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 shadow-2xs transition text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-xs shadow-2xs">
                {currentUser?.role === 'Vendor' ? '🏢' : currentUser?.role === 'Pengawas' ? '👷' : currentUser?.role === 'Approval' ? '👔' : '👨‍💼'}
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{currentUser?.name || 'Pengguna'}</span>
                  <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(currentRole).color}`}>
                    {getRoleBadgeStyle(currentRole).badge}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">
                  {currentUser?.unit || currentUser?.vendorName || 'PLN UP3 Banten Selatan'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-0.5" />
            </button>

            {/* RBAC Modal Dropdown (Exactly Matching Mockup) */}
            {isRbacOpen && (
              <div className="absolute right-0 top-14 w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="pb-3 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SIMULASI AKUN & HAK AKSES (8 ROLES)
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Pilih akun pengguna untuk menguji tampilan menu & pembatasan aksi:
                  </div>
                </div>

                <div className="py-2 space-y-1.5 max-h-96 overflow-y-auto">
                  {users.map((u) => {
                    const isSelected = currentUser?.id === u.id || (!currentUser && currentRole === u.role);
                    const badgeInfo = getRoleBadgeStyle(u.role);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setCurrentUser(u);
                          setIsRbacOpen(false);
                          showToast(`Hak akses berganti ke: ${u.name} (${u.role})`);
                        }}
                        className={`
                          w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer
                          ${isSelected 
                            ? 'bg-blue-50/70 border-blue-300 shadow-2xs' 
                            : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'}
                        `}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm shrink-0">
                            {u.role === 'Vendor' ? '🏢' : u.role === 'Pengawas' ? '👷' : u.role === 'Approval' ? '👔' : '👤'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{u.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{u.unit || u.vendorName || u.role}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${badgeInfo.color}`}>
                            {badgeInfo.badge}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    💡 Info: Akun Terotentikasi
                  </span>
                  <button
                    onClick={() => setIsRbacOpen(false)}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-xs flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" /> Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Centralized Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-medium">{toastMessage}</span>
          <button 
            onClick={clearToast}
            className="text-slate-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};
