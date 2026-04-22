'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { TopBar } from '@/components/layout/top-bar';
import { OnlineListener } from '@/components/providers/online-listener';
import { useUIStore } from '@/stores';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUIStore();

  return (
    <AuthGuard>
      <OnlineListener />
      <div className="min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div
          className={`transition-all duration-300 min-h-screen ${
            sidebarOpen ? 'lg:ml-60' : 'lg:ml-[72px]'
          }`}
        >
          {/* Top Bar */}
          <TopBar />

          {/* Page Content */}
          <main className="p-4 lg:p-6 pb-24 lg:pb-8">
            {children}
          </main>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
