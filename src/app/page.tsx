'use client';

import React, { useState } from 'react';
import { usePromotorStore } from '@/store/usePromotorStore';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { SurveyView } from '@/components/SurveyView';
import { DaftungView } from '@/components/DaftungView';
import { StandardConstructionView } from '@/components/StandardConstructionView';
import { MasterKhsView } from '@/components/MasterKhsView';
import { MasterVendorView } from '@/components/MasterVendorView';
import { MasterPengawasView } from '@/components/MasterPengawasView';
import { WorkOrderView } from '@/components/WorkOrderView';

export default function Home() {
  const { currentPage } = usePromotorStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 print:pl-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
          {currentPage === 'dashboard' && <DashboardView />}
          {currentPage === 'survey' && <SurveyView />}
          {currentPage === 'daftung' && <DaftungView />}
          {currentPage === 'wo' && <WorkOrderView />}
          {currentPage === 'vendor' && <MasterVendorView />}
          {currentPage === 'pengawas' && <MasterPengawasView />}
          {currentPage === 'khs' && <MasterKhsView />}
          {currentPage === 'std' && <StandardConstructionView />}
        </main>
      </div>
    </div>
  );
}
