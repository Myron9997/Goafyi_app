'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current path is an admin page
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/admin_access');
  
  if (isAdminPage) {
    // For admin pages, render without header and bottom nav
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }
  
  // For regular pages, render with header and bottom nav
  return (
    <>
      <Header />
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
