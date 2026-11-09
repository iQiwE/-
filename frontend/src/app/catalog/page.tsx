import { Suspense } from 'react';
import { Catalog } from '@/components/catalog/Catalog';

export const metadata = { title: 'Velvet Residence — Каталог аренды жилья в ВКО' };

/** useSearchParams в клиентском компоненте требует обёртки в Suspense. */
export default function CatalogPage() {
  return (
    <main className="min-h-screen bg-[#FDF5F3] text-[#2C0107] transition-colors duration-300 dark:bg-[#1B0C1A] dark:text-[#FADCD5]">
      <Suspense fallback={null}>
        <Catalog />
      </Suspense>
    </main>
  );
}
