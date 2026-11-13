'use client';

import React, { useState } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { SurveyView } from '@/components/SurveyView';
import { PraDaftungView } from '@/components/PraDaftungView';
import { DaftungView } from '@/components/DaftungView';
import { StandardConstructionView } from '@/components/StandardConstructionView';
import { MasterKhsView } from '@/components/MasterKhsView';
import { MasterPengawasView } from '@/components/MasterPengawasView';
import { ContractView } from '@/components/ContractView';
import { MasterMaterialView } from '@/components/MasterMaterialView';
import { WorkOrderView } from '@/components/WorkOrderView';
import { PersetujuanWoView } from '@/components/PersetujuanWoView';
import { VendorPengambilanView } from '@/components/VendorPengambilanView';
import { ReservasiMaterialView } from '@/components/ReservasiMaterialView';
import { VerifikasiPengawasView } from '@/components/VerifikasiPengawasView';
import { WarehouseView } from '@/components/WarehouseView';
import { MutasiMaterialView } from '@/components/MutasiMaterialView';
import { SweepingMaterialView } from '@/components/SweepingMaterialView';
import { AnalisisKebutuhanMaterialView } from '@/components/AnalisisKebutuhanMaterialView';
import { AuditView } from '@/components/AuditView';
import { PengaturanView } from '@/components/PengaturanView';

export default function Home() {
  const { currentPage } = usePromotorStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Mode rail desktop: sidebar ditutup jadi lajur ikon. Tidak effect drawer mobile.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 print:pl-0 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
          {/* 1. WORKSPACE */}
          {currentPage === 'dashboard'        && <DashboardView />}
          {currentPage === 'survey'           && <SurveyView />}
          {currentPage === 'pradaftung'       && <PraDaftungView />}

          {/* 2. PELAKSANAAN */}
          {currentPage === 'wo'               && <WorkOrderView />}
          {currentPage === 'daftung'          && <DaftungView />}
          {currentPage === 'persetujuan-wo'   && <PersetujuanWoView />}
          {currentPage === 'vendor-ambil'     && <VendorPengambilanView />}
          {currentPage === 'sweeping-material'   && <SweepingMaterialView />}

          {/* 3. PENGAWASAN & RESERVASI */}
          {currentPage === 'reservasi-material'  && <ReservasiMaterialView />}
          {currentPage === 'verifikasi-pengawas' && <VerifikasiPengawasView />}

          {/* 4. PERSEDIAAN */}
          {currentPage === 'stok-gudang'              && <WarehouseView />}
          {currentPage === 'mutasi-material'          && <MutasiMaterialView />}
          {currentPage === 'analisis-material'        && <AnalisisKebutuhanMaterialView />}

          {/* 5. MASTER DATA & STANDAR */}
          {currentPage === 'kontrak'         && <ContractView />}
          {currentPage === 'master-material' && <MasterMaterialView />}
          {currentPage === 'pengawas'   && <MasterPengawasView />}
          {currentPage === 'khs'        && <MasterKhsView />}
          {currentPage === 'std'        && <StandardConstructionView />}
          {currentPage === 'audit'      && <AuditView />}
          {currentPage === 'pengaturan' && <PengaturanView />}
        </main>
      </div>
    </div>
  );
}

