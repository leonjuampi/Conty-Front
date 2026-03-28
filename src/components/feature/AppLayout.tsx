import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { CashTimeAlert } from './CashTimeAlert';

interface AppLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function AppLayout({ children, noPadding = false }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CashTimeAlert />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        {/* Espaciador para compensar Navbar fixed en mobile */}
        <div className="h-[60px] md:h-0 safe-top shrink-0" />

        <main className={`flex-1 ${noPadding ? '' : 'p-4 md:p-6 pb-20 md:pb-6'} overflow-x-hidden`}>
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
