'use client';

import React, { useState } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import {
  LayoutGrid,
  Crosshair,
  FileText,
  Layers,
  Minus,
  Plus,
  LogOut,
  X,
  HardHat,
  UserCheck,
  ShieldCheck,
  ArrowLeftRight,
  HardDrive,
  FileCheck2,
  Warehouse,
  Boxes,
  Settings,
  FileSpreadsheet,
  History,
  Calculator,
  ClipboardCheck,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mode rail (hanya berlaku di layar besar): ikon saja tanpa teks. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    allowedRoles?: string[];
  }

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, collapsed, onToggleCollapsed }) => {
  const { currentPage, setCurrentPage, currentRole } = usePromotorStore();

  // Collapsible Groups state (default all open)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workspace: true,
    pelaksanaan: true,
    pengawasan: true,
    vendor: true,
    persediaan: true,
    master: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'workspace',
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard',  label: 'Dashboard',         icon: LayoutGrid, allowedRoles: ['Super Admin', 'Admin Survey', 'Admin Daftung', 'Admin WO', 'Pengawas', 'Vendor', 'Admin Gudang', 'Approval'] },
        { id: 'survey',     label: 'Survey Pelanggan',  icon: Crosshair, allowedRoles: ['Super Admin', 'Admin Survey', 'Admin Daftung', 'Admin WO'] },
        { id: 'pradaftung', label: 'Potensi Daftung',   icon: FileCheck2, allowedRoles: ['Super Admin', 'Admin Daftung', 'Admin Survey', 'Admin WO'] },
      ],
    },
    {
      id: 'pelaksanaan',
      title: 'PELAKSANAAN',
      items: [
        { id: 'wo',             label: 'Work Order',                 icon: HardHat, allowedRoles: ['Super Admin', 'Admin WO', 'Admin Daftung', 'Pengawas', 'Vendor', 'Admin Gudang', 'Approval'] },
        { id: 'persetujuan-wo', label: 'Persetujuan WO',             icon: ShieldCheck, allowedRoles: ['Super Admin', 'Approval', 'Admin WO'] },
        { id: 'daftung',        label: 'Daftar Tunggu (Daftung)',    icon: FileText, allowedRoles: ['Super Admin', 'Admin Daftung', 'Admin WO'] },
      ],
    },
    {
      id: 'pengawasan',
      title: 'PENGAWASAN',
      items: [
        { id: 'reservasi-material',  label: 'Reservasi Material (Gudang)',      icon: Boxes, allowedRoles: ['Super Admin', 'Pengawas', 'Admin Gudang', 'Admin WO', 'Vendor'] },
        { id: 'verifikasi-pengawas', label: 'Verifikasi & Progres Lapangan',    icon: UserCheck, allowedRoles: ['Super Admin', 'Pengawas', 'Admin WO', 'Vendor'] },
      ],
    },
    {
      id: 'vendor',
      title: 'VENDOR',
      items: [
        { id: 'vendor-ambil',        label: 'Menu Vendor (Pelaksanaan & SJ)',   icon: HardDrive, allowedRoles: ['Super Admin', 'Vendor', 'Pengawas', 'Admin WO', 'Admin Gudang'] },
        { id: 'sweeping-material',   label: 'Sweeping Material',                icon: ClipboardCheck, allowedRoles: ['Super Admin', 'Vendor', 'Pengawas', 'Admin Gudang', 'Admin WO'] },
      ],
    },
    {
      id: 'persediaan',
      title: 'PERSEDIAAN',
      items: [
        { id: 'stok-gudang', label: 'Stok Gudang', icon: Warehouse, allowedRoles: ['Super Admin', 'Admin Gudang', 'Admin WO', 'Vendor'] },
        { id: 'analisis-material', label: 'Analisis Kebutuhan Material', icon: Calculator, allowedRoles: ['Super Admin', 'Admin Daftung', 'Admin Gudang', 'Admin WO', 'Pengawas'] },
        { id: 'mutasi-material', label: 'Mutasi Material & GI', icon: ArrowLeftRight, allowedRoles: ['Super Admin', 'Admin Gudang', 'Admin WO', 'Pengawas'] },
      ],
    },
    {
      id: 'master',
      title: 'MASTER DATA & STANDAR',
      items: [
        { id: 'kontrak',         label: 'Master Kontrak (KHS)',        icon: FileSpreadsheet, allowedRoles: ['Super Admin', 'Admin Daftung', 'Admin WO'] },
        { id: 'master-material', label: 'Kontrak Pengadaan Material',  icon: Boxes, allowedRoles: ['Super Admin', 'Admin Daftung', 'Admin WO', 'Admin Gudang'] },
        { id: 'pengawas',        label: 'Master Pengawas',             icon: UserCheck, allowedRoles: ['Super Admin', 'Admin Daftung', 'Admin WO'] },
        { id: 'std',             label: 'Standar Konstruksi',   icon: Layers, allowedRoles: ['Super Admin', 'Admin Daftung', 'Admin WO', 'Pengawas'] },
        { id: 'audit',           label: 'Audit Log Aktivitas',  icon: History, allowedRoles: ['Super Admin', 'Admin Daftung', 'Admin WO', 'Approval'] },
        { id: 'pengaturan',      label: 'Pengaturan & User',    icon: Settings, allowedRoles: ['Super Admin', 'Admin Daftung'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 bg-white text-slate-800 border-r border-slate-200/90 flex flex-col transition-all duration-200 font-sans shadow-xs print:hidden
        w-64 ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-slate-100 bg-white ${collapsed ? 'lg:h-auto lg:flex-col lg:items-center lg:justify-center lg:gap-1.5 lg:py-2.5 lg:px-2' : ''}`}>
          <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'lg:flex-col lg:items-center lg:gap-1.5' : ''}`}>
            <img
              src="/Logo_PLN.png"
              alt="Logo PLN"
              className={`w-auto object-contain shrink-0 ${collapsed ? 'h-9 lg:h-7' : 'h-9'}`}
            />
            <div className={collapsed ? 'lg:hidden' : ''}>
              <div className="flex items-center gap-1.5 font-black text-sm text-[#0c3c60] tracking-tight">
                PLN <span className="text-[10px] text-slate-400 font-semibold">UP3 BANTEN SELATAN</span>
              </div>
              <div className="text-[10px] font-bold text-slate-700 tracking-wider flex items-center gap-1">
                PROMOTOR <span className="text-[9px] bg-sky-100 text-sky-700 font-mono px-1 py-0.2 rounded font-semibold">V1.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              aria-label="Tutup menu"
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Close / unclose sidebar (desktop) */}
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Unclose sidebar (buka)' : 'Close sidebar (tutup jadi ikon)'}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Current Active User Profile Card */}
        <div className="p-3.5 pb-2">
          <div className={`p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 ${collapsed ? 'lg:justify-center lg:gap-0 lg:p-2' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-xs shrink-0 shadow-2xs">
              👨‍💼
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="text-xs font-bold text-slate-800 truncate">Budi Santoso, S.T.</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span className="text-[10px] font-semibold text-blue-700">{currentRole}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu with Exact Collapsible Groups */}
        <div className={`flex-1 overflow-y-auto px-3.5 py-2 space-y-3 scrollbar-thin ${collapsed ? 'lg:px-2' : ''}`}>
          {navGroups.map((group) => {
            const isGroupOpen = !!openGroups[group.id];

            return (
              <div key={group.id} className="space-y-1">
                {/* Collapsible Header [-] / [+] — teks di lebar penuh, ikon saja di rail */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between py-1 px-1 text-[10.5px] font-bold tracking-wider text-slate-400 hover:text-slate-700 transition-colors uppercase ${collapsed ? 'lg:hidden' : ''}`}
                >
                  <span>{group.title}</span>
                  <span className="text-slate-400 hover:text-slate-600 p-0.5">
                    {isGroupOpen ? <Minus className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </span>
                </button>

                {collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    title={group.title}
                    aria-label={`${group.title} — ${isGroupOpen ? 'tutup grup' : 'buka grup'}`}
                    className="hidden lg:flex w-full items-center justify-center py-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {isGroupOpen ? <Minus className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>
                )}

                {/* Submenu Items with RBAC Filter */}
                {isGroupOpen && (
                  <div className="space-y-0.5 animate-in fade-in duration-150">
                    {group.items
                      .filter((item) => !item.allowedRoles || item.allowedRoles.includes(currentRole))
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentPage(item.id);
                              onClose();
                            }}
                            title={item.label}
                            className={`
                              w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer
                              ${collapsed ? 'lg:justify-center lg:px-0' : ''}
                              ${isActive 
                                ? 'bg-[#0066cc] text-white font-bold shadow-md shadow-blue-500/20' 
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
                            `}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                            <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3.5 border-t border-slate-100 bg-slate-50/60 space-y-2 ${collapsed ? 'lg:p-2' : ''}`}>
          <div className={`flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium ${collapsed ? 'lg:hidden' : ''}`}>
            <span>RBAC Aktif</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Role Protected
            </span>
          </div>

          <button
            onClick={() => alert('Simulasi Sesi: Keluar Akun')}
            title="Keluar (Logout)"
            className={`w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition ${collapsed ? 'lg:px-0 lg:gap-0' : ''}`}
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}> Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
