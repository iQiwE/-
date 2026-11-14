import Link from 'next/link';
import { FaqSection } from '@/components/faq/FaqSection';

export const metadata = {
  title: 'Velvet Residence — Частые вопросы (FAQ)',
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[#FDF5F3] py-6 text-[#2C0107] transition-colors duration-300 md:py-10 dark:bg-[#1B0C1A] dark:text-[#FADCD5]">
      <div className="mx-auto max-w-7xl px-3.5 md:px-8">
        <Link
          href="/catalog"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[#6D3C52]/15 bg-white px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#2C0107] shadow-2xs transition-all duration-300 hover:border-[#C42759] hover:text-[#C42759] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#6D3C52]"
        >
          ← Вернуться в каталог
        </Link>
      </div>

      <FaqSection />
    </main>
  );
}
