'use client';

import Link from 'next/link';
import { memo, UIEvent, useEffect, useMemo, useState } from 'react';
import {
  FALLBACK_UNSPLASH_URLS,
  formatAddress,
  formatPrice,
  resolvePropertyGalleryUrls,
} from '@/lib/format';
import { Property } from '@/types/property';

interface Props {
  property: Property;
  isFavorite?: boolean;
  onToggleFavorite?: (propertyId: number) => void;
}

/**
 * Крафтовая карточка основной выдачи без лишних рамок и визуального шума:
 * - Акцент на свайп-галерее фотографий (rounded-2xl) и крупной цене.
 * - Второстепенные параметры и адрес уведены в спокойный приглушенный тон.
 */
function PropertyCardBase({ property, isFavorite = false, onToggleFavorite }: Props) {
  const {
    id,
    title,
    rooms,
    area,
    monthlyPrice,
    petsAllowed,
    noDeposit,
    fromOwner,
    image_url,
    is_good_price,
    address,
  } = property;

  const galleryBase = useMemo(() => resolvePropertyGalleryUrls(image_url, id, 4), [image_url, id]);
  const [slides, setSlides] = useState<string[]>(galleryBase);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setSlides(galleryBase);
    setActiveSlide(0);
  }, [galleryBase]);

  function handleGalleryScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeSlide && idx >= 0 && idx < slides.length) {
      setActiveSlide(idx);
    }
  }

  // Спокойная текстовая строка преимуществ вместо шумных разноцветных рамок
  const perks: string[] = [];
  if (fromOwner) perks.push('от хозяина');
  if (noDeposit) perks.push('без залога');
  if (petsAllowed) perks.push('можно с питомцами');

  return (
    <article className="group flex flex-col">
      {/* Фото-карусель как самостоятельный обтекаемый холст без внешней рамки карточки */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#FADCD5]/30 shadow-[0_6px_20px_rgba(44,1,7,0.06)] transition-shadow duration-300 group-hover:shadow-[0_14px_34px_rgba(44,1,7,0.12)] sm:aspect-[4/3] dark:bg-[#2D222F] dark:shadow-[0_10px_28px_rgba(0,0,0,0.4)]">
        <div
          onScroll={handleGalleryScroll}
          className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
        >
          {slides.map((src, idx) => (
            <Link
              key={`${id}-photo-${idx}`}
              href={`/properties/${id}`}
              className="block h-full w-full shrink-0 snap-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title} — фото ${idx + 1}`}
                loading="lazy"
                onError={() => {
                  const fallback =
                    FALLBACK_UNSPLASH_URLS[(Math.max(0, id - 1) + idx + 1) % FALLBACK_UNSPLASH_URLS.length];
                  setSlides((prev) => prev.map((item, i) => (i === idx && item !== fallback ? fallback : item)));
                }}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </Link>
          ))}
        </div>

        {/* Деликатное затемнение только у нижнего края для читаемости точек пагинации */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/45 to-transparent" />

        {/* Только один осмысленный бейдж в левом верхнем углу */}
        {is_good_price ? (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#C42759]/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-xs backdrop-blur-md dark:bg-[#6D3C52]/95 dark:text-[#FADCD5]">
            Ниже рынка
          </span>
        ) : fromOwner ? (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#1B0C1A]/60 px-2.5 py-1 text-[11px] font-medium text-[#FADCD5] backdrop-blur-md">
            Собственник
          </span>
        ) : null}

        {/* Иконка "В избранное" поверх фотографии */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(id);
            }}
            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition duration-200 active:scale-90 hover:bg-black/55"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 transition ${
                isFavorite ? 'fill-[#C42759] text-[#C42759]' : 'fill-none text-white/95'
              }`}
              stroke="currentColor"
              strokeWidth={1.9}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </button>
        )}

        {/* Лаконичные точки пагинации поверх фото */}
        <div
          className="pointer-events-none absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5"
          aria-hidden="true"
        >
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeSlide ? 'w-3.5 bg-white shadow-xs' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Чистая типографика с воздухом под фотографией */}
      <Link href={`/properties/${id}`} className="flex flex-col gap-0.5 px-0.5 pt-2 sm:pt-3">
        {/* Первая строка: крупная цена + параметры комнат и площади */}
        <div className="flex items-baseline justify-between gap-2">
          <p className="shrink-0 whitespace-nowrap text-base font-bold tracking-tight text-[#2C0107] sm:text-xl dark:text-[#FADCD5]">
            {formatPrice(monthlyPrice)}
            <span className="text-[11px] font-normal text-[#845962] sm:text-xs dark:text-[#B08D87]"> / мес.</span>
          </p>
          <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#5A2D36] dark:text-[#DCBAB3]">
            {rooms}-комн. · {area} м²
          </span>
        </div>

        {/* Вторая строка: название объекта */}
        <h3 className="truncate text-sm font-medium text-[#2C0107] transition-colors group-hover:text-[#C42759] dark:text-[#FADCD5]/95 dark:group-hover:text-white">
          {title}
        </h3>

        {/* Третья строка: приглушенный адрес */}
        <p className="truncate text-xs text-[#845962] dark:text-[#B08D87]">
          {address.district}, {formatAddress(address)}
        </p>

        {/* Четвертая строка: спокойная микро-строка условий вместо тяжелых плашек */}
        {perks.length > 0 && (
          <p className="mt-0.5 truncate text-[11px] font-medium text-[#C42759]/85 dark:text-[#DCBAB3]/80">
            {perks.join(' · ')}
          </p>
        )}
      </Link>
    </article>
  );
}

export const PropertyCard = memo(PropertyCardBase);
