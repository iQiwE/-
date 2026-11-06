import './globals.css';
import { Footer } from '@/components/Footer';
import { HeaderNav } from '@/components/HeaderNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-[#FAF6F0] text-[#2C221E] antialiased">
        <HeaderNav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
