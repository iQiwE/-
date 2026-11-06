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
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:px-8 lg:py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#2C221E]">
            Избранные квартиры ({favorites.length})
          </h1>
          <p className="mt-1.5 text-sm text-[#6B5B50]">
            Сохранённые объявления для быстрого сравнения и подачи заявок
          </p>
        </div>
        <Link href="/catalog" className="text-sm font-medium text-[#B85D3B] hover:underline">
          ← В каталог
        </Link>
      </header>

      {error && (
        <div className="rounded-2xl bg-[#FDF2EE] p-4 text-sm text-[#9E3B24]" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-[#EFE7DC]" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-[#ECE2D6] bg-white p-14 text-center shadow-[0_4px_24px_rgba(44,34,30,0.04)]">
          <p className="font-serif text-xl font-medium text-[#2C221E]">В избранном пока нет объектов</p>
          <p className="mt-2 text-sm text-[#6B5B50]">
            Нажмите на иконку сердечка на любой карточке в каталоге, чтобы сохранить понравившуюся квартиру.
          </p>
          <Link
            href="/catalog"
            className="mt-6 inline-block rounded-xl bg-[#B85D3B] px-6 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-[#9E4B2D]"
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
