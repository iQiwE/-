'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PropertyCard } from '@/components/catalog/PropertyCard';
import { propertiesApi } from '@/lib/api/properties.api';
import { getSessionUser, getToken } from '@/lib/auth';
import { Property } from '@/types/property';

export default function FavoritesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async (jwt: string) => {
    setLoading(true);
    setError(null);
    try {
      const items = await propertiesApi.getFavorites(jwt);
      setFavorites(items);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось загрузить избранное');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const existingToken = getToken();
    const existingUser = getSessionUser();

    if (!existingToken || !existingUser) {
      router.replace('/login?redirect=/favorites');
      return;
    }

    if (existingUser.role !== 'TENANT') {
      router.replace('/catalog');
      return;
    }

    setToken(existingToken);
    loadFavorites(existingToken);
  }, [loadFavorites, router]);

  const handleRemoveFavorite = useCallback(
    async (propertyId: number) => {
      if (!token) return;
      const previous = favorites;
      setFavorites((prev) => prev.filter((item) => item.id !== propertyId));
      try {
        await propertiesApi.removeFavorite(propertyId, token);
      } catch (e: any) {
        setFavorites(previous);
        setError(e.message ?? 'Ошибка удаления из избранного');
      }
    },
    [favorites, token],
  );

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:gap-10 md:px-8 md:py-14 lg:py-20">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#6D3C52]/12 pb-6 dark:border-gray-800">
        <div>
          <span className="inline-block rounded-full bg-[#FADCD5] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#550416] dark:bg-[#2D222F] dark:text-[#FADCD5]">
            Персональная подборка
          </span>
          <h1 className="mt-3 font-serif text-2xl font-normal text-[#2C0107] sm:text-4xl dark:text-[#FADCD5]">
            Избранные <span className="italic text-[#C42759] dark:text-[#dcbab3]">резиденции</span> ({favorites.length})
          </h1>
          <p className="mt-2 text-sm text-[#5A2D36] dark:text-[#DCBAB3]">
            Сохранённые объявления для вдумчивого сравнения и подачи заявок
          </p>
        </div>
        <Link
          href="/catalog"
          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#6D3C52]/15 bg-white px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#2C0107] shadow-2xs transition-all duration-300 hover:border-[#C42759] hover:text-[#C42759] sm:w-auto dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#6D3C52]"
        >
          ← Вернуться в каталог
        </Link>
      </header>

      {error && (
        <div
          className="rounded-2xl border border-[#C42759]/30 bg-[#FADCD5]/55 p-4 text-sm text-[#550416] sm:rounded-3xl dark:border-[#FADCD5]/20 dark:bg-[#4B2138] dark:text-[#FADCD5]"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-[#FADCD5]/50 sm:rounded-3xl dark:bg-[#2D222F]" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-[#6D3C52]/12 bg-white p-8 text-center shadow-[0_14px_40px_rgba(44,1,7,0.06)] sm:rounded-3xl sm:p-16 dark:border-gray-800 dark:bg-[#2D222F] dark:shadow-[0_16px_44px_rgba(11,4,11,0.5)]">
          <p className="font-serif text-xl font-normal text-[#2C0107] sm:text-2xl dark:text-[#FADCD5]">
            В избранном пока нет объектов
          </p>
          <p className="mt-2 text-sm text-[#5A2D36] dark:text-[#DCBAB3]">
            Нажмите на иконку сердечка на любой карточке в каталоге, чтобы сохранить понравившуюся резиденцию.
          </p>
          <Link
            href="/catalog"
            className="mt-6 inline-block rounded-full bg-[#C42759] px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(196,39,89,0.28)] transition-all duration-300 hover:bg-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              isFavorite={true}
              onToggleFavorite={handleRemoveFavorite}
            />
          ))}
        </div>
      )}
    </main>
  );
}
