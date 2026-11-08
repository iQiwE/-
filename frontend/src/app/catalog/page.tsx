import { Suspense } from 'react';
import { Catalog } from '@/components/catalog/Catalog';

export const metadata = { title: 'Serenity Residence — Каталог аренды жилья в ВКО' };

/** useSearchParams в клиентском компоненте требует обёртки в Suspense. */
export default function CatalogPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0] transition-colors duration-300 dark:bg-[#141312]">
      <Suspense fallback={null}>
        <Catalog />
      </Suspense>
    </main>
  );
}
