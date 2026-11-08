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
    <main className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-14 lg:px-8 lg:py-20">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E8DFD3] pb-6 dark:border-white/10">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#B85D3B] dark:text-[#B89778]">
            Персональная подборка
          </span>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[#2C221E] sm:text-4xl dark:text-[#F5F3EF]">
            Избранные <span className="italic text-[#B85D3B] dark:text-[#B89778]">резиденции</span> ({favorites.length})
          </h1>
          <p className="mt-2 text-sm text-[#6B5B50] dark:text-[#A8A096]">
            Сохранённые объявления для вдумчивого сравнения и подачи заявок
          </p>
        </div>
        <Link
          href="/catalog"
          className="text-xs font-medium uppercase tracking-[0.16em] text-[#B85D3B] transition hover:underline dark:text-[#D4B89C]"
        >
          ← Вернуться в каталог
        </Link>
      </header>

      {error && (
        <div
          className="rounded-2xl border border-[#E8C5B8] bg-[#FDF2EE] p-4 text-sm text-[#9E3B24] dark:border-[#E06C53]/30 dark:bg-[#2A1916] dark:text-[#F29B88]"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-[#EFE7DC] dark:bg-[#1E1C1A]" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-[#ECE2D6] bg-white p-16 text-center shadow-[0_4px_24px_rgba(44,34,30,0.04)] dark:border-white/10 dark:bg-[#1C1A18]">
          <p className="font-serif text-2xl font-normal text-[#2C221E] dark:text-[#F5F3EF]">
            В избранном пока нет объектов
          </p>
          <p className="mt-2 text-sm text-[#6B5B50] dark:text-[#A8A096]">
            Нажмите на иконку сердечка на любой карточке в каталоге, чтобы сохранить понравившуюся резиденцию.
          </p>
          <Link
            href="/catalog"
            className="mt-6 inline-block rounded-full bg-[#B85D3B] px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-xs transition hover:bg-[#9E4B2D] dark:bg-[#B89778] dark:text-[#141312] dark:hover:bg-[#CAB094]"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
