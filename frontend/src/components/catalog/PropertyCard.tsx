'use client';

import Link from 'next/link';
import { memo, MouseEvent, TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const AUTO_SLIDE_INTERVAL_MS = 3000;

/**
 * Презентационный (Dumb/UI) компонент карточки объекта:
 * - Автоматическое перелистывание фотографий каждые 3000ms на десктопе.
 * - Поддержка свайпа пальцем на мобильных, боковых стрелочек и точек пагинации внизу.
 * - При наведении курсора (hover) или ручном взаимодействии автопрокрутка ставится на паузу.
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
  const [isPaused, setIsPaused] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const didSwipeRef = useRef(false);

  useEffect(() => {
    setSlides(galleryBase);
    setActiveSlide(0);
  }, [galleryBase]);

  // Автопрокрутка фотографий каждые 3000ms на десктопе (ставится на паузу при hover или ручном клике)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handlePrevSlide = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsPaused(true);
      setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
    },
    [slides.length],
  );

  const handleNextSlide = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsPaused(true);
      setActiveSlide((prev) => (prev + 1) % slides.length);
    },
    [slides.length],
  );

  const handleSelectDot = useCallback((e: MouseEvent<HTMLButtonElement>, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPaused(true);
    setActiveSlide(idx);
  }, []);

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    setIsPaused(true);
    didSwipeRef.current = false;
    touchDeltaXRef.current = 0;
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchMove(e: TouchEvent<HTMLDivElement>) {
    if (touchStartXRef.current === null) return;
    const currentX = e.touches[0]?.clientX ?? touchStartXRef.current;
    touchDeltaXRef.current = currentX - touchStartXRef.current;
  }

  function handleTouchEnd() {
    if (touchStartXRef.current === null) return;
    const delta = touchDeltaXRef.current;
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;

    if (Math.abs(delta) > 36 && slides.length > 1) {
      didSwipeRef.current = true;
      if (delta < 0) {
        setActiveSlide((prev) => (prev + 1) % slides.length);
      } else {
        setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
  }

  const perks: string[] = [];
  if (fromOwner) perks.push('от хозяина');
  if (noDeposit) perks.push('без залога');
  if (petsAllowed) perks.push('можно с питомцами');

  return (
    <article
      data-property-card={id}
      data-active-slide={activeSlide}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group flex flex-col"
    >
      {/* Фото-карусель с плавным переключением слайдов без белых рамок */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#FADCD5]/30 shadow-[0_6px_20px_rgba(44,1,7,0.06)] transition-shadow duration-300 group-hover:shadow-[0_14px_34px_rgba(44,1,7,0.12)] sm:aspect-[4/3] dark:bg-[#2D222F] dark:shadow-[0_10px_28px_rgba(0,0,0,0.4)]"
      >
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((src, idx) => (
            <Link
              key={`${id}-photo-${idx}`}
              href={`/properties/${id}`}
              onClick={(e) => {
                if (didSwipeRef.current) {
                  e.preventDefault();
                  didSwipeRef.current = false;
                }
              }}
              className="block h-full w-full shrink-0 select-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title} — фото ${idx + 1}`}
                loading="lazy"
                draggable={false}
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

        {/* Бейдж в левом верхнем углу */}
        {is_good_price ? (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#C42759]/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-xs backdrop-blur-md dark:bg-[#6D3C52]/95 dark:text-[#FADCD5]">
            Ниже рынка
          </span>
        ) : fromOwner ? (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#1B0C1A]/65 px-2.5 py-1 text-[11px] font-medium text-[#FADCD5] backdrop-blur-md">
            Собственник
          </span>
        ) : null}

        {/* Боковые стрелочки переключения фото */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              data-testid="carousel-prev"
              onClick={handlePrevSlide}
              aria-label="Предыдущее фото"
              className="absolute left-2.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition duration-200 hover:bg-[#C42759] md:opacity-0 md:group-hover:opacity-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              data-testid="carousel-next"
              onClick={handleNextSlide}
              aria-label="Следующее фото"
              className="absolute right-2.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition duration-200 hover:bg-[#C42759] md:opacity-0 md:group-hover:opacity-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

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

        {/* Интерактивные точки пагинации внизу фото */}
        <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-testid="carousel-dot"
              aria-label={`Показать фото ${idx + 1}`}
              onClick={(e) => handleSelectDot(e, idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeSlide ? 'w-4 bg-white shadow-xs' : 'w-1.5 bg-white/55 hover:bg-white/85'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Чистая типографика с воздухом под фотографией */}
      <Link href={`/properties/${id}`} className="flex flex-col gap-0.5 px-0.5 pt-2.5 sm:pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="shrink-0 whitespace-nowrap text-base font-bold tracking-tight text-[#2C0107] sm:text-xl dark:text-[#FADCD5]">
            {formatPrice(monthlyPrice)}
            <span className="text-xs font-normal text-[#845962] dark:text-[#B08D87]"> / мес.</span>
          </p>
          <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#5A2D36] dark:text-[#DCBAB3]">
            {rooms}-комн. · {area} м²
          </span>
        </div>

        <h3 className="truncate text-sm font-medium text-[#2C0107] transition-colors group-hover:text-[#C42759] dark:text-[#FADCD5]/95 dark:group-hover:text-white">
          {title}
        </h3>

        <p className="truncate text-xs text-[#845962] dark:text-[#B08D87]">
          {address.district}, {formatAddress(address)}
        </p>

        {perks.length > 0 && (
          <p className="mt-0.5 truncate text-xs font-medium text-[#C42759]/85 dark:text-[#DCBAB3]/85">
            {perks.join(' · ')}
          </p>
        )}
      </Link>
    </article>
  );
}

export const PropertyCard = memo(PropertyCardBase);
