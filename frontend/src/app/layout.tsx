import './globals.css';
import { BottomTabBar } from '@/components/BottomTabBar';
import { Footer } from '@/components/Footer';
import { HeaderNav } from '@/components/HeaderNav';
import { ThemeProvider } from '@/components/ThemeProvider';

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var mode = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    var root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen max-w-full flex-col overflow-x-hidden bg-[#FDF5F3] pb-16 text-[#2C0107] antialiased transition-colors duration-300 md:pb-0 dark:bg-[#1B0C1A] dark:text-[#FADCD5]">
        <ThemeProvider>
          <HeaderNav />
          <div className="flex-1 max-w-full overflow-x-hidden">{children}</div>
          <Footer />
          <BottomTabBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
