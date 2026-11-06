import { Suspense } from 'react';
import { Catalog } from '@/components/catalog/Catalog';

export const metadata = { title: 'Каталог квартир — аренда жилья в ВКО' };

/** useSearchParams в клиентском компоненте требует обёртки в Suspense. */
export default function CatalogPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <Suspense fallback={null}>
        <Catalog />
      </Suspense>
    </main>
  );
}
