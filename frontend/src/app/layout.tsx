import './globals.css';
import { HeaderNav } from '@/components/HeaderNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <HeaderNav />
        {children}
      </body>
    </html>
  );
}
