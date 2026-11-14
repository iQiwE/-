'use client';

import { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ConciergeProvider } from '@/components/concierge/ConciergeChat';
import { DesktopNav } from './DesktopNav';
import { MobileBottomNav } from './MobileBottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Единая корневая обёртка страниц приложения (MainLayout):
 * соединяет ThemeProvider, ConciergeProvider (встроенный чат с консьержем),
 * DesktopNav (шапка ПК + бургер-меню), основной контейнер страниц,
 * Footer и MobileBottomNav (нижний таб-бар смартфонов).
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <ThemeProvider>
      <ConciergeProvider>
        <DesktopNav />
        <div className="flex-1 max-w-full overflow-x-hidden pt-12 md:pt-16">{children}</div>
        <Footer />
        <MobileBottomNav />
      </ConciergeProvider>
    </ThemeProvider>
  );
}
