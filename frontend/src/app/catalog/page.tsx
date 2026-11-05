import { Suspense } from 'react';
import { Catalog } from '@/components/catalog/Catalog';

export const metadata = { title: 'Каталог квартир — аренда жилья' };

/** useSearchParams в клиентском компоненте требует обёртки в Suspense. */
export default function CatalogPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <Catalog />
      </Suspense>
    </main>
  );
}

