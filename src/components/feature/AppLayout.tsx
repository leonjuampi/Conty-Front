import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { CashTimeAlert } from './CashTimeAlert';

interface AppLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
  hideSidebar?: boolean;
}

export function AppLayout({ children, noPadding = false, hideSidebar = false }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`flex bg-gray-50 ${noPadding ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <CashTimeAlert />
      {!hideSidebar && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      <div className={`flex-1 flex flex-col min-w-0 ${hideSidebar ? '' : 'md:ml-64'} ${noPadding ? 'overflow-hidden' : ''}`}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className={`flex-1 ${noPadding ? 'overflow-hidden flex flex-col' : 'p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden'}`}>
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
