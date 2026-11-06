'use client';

import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
import { FALLBACK_UNSPLASH_URLS, formatAddress, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
import { Property } from '@/types/property';

interface Props {
  property: Property;
  isFavorite?: boolean;
  onToggleFavorite?: (propertyId: number) => void;
}

/** Карточка объекта в каталоге с фотографией интерьера, избранным, умными тегами и бейджем цены. */
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
    type,
    address,
  } = property;

  const fallbackSrc = FALLBACK_UNSPLASH_URLS[Math.max(0, id - 1) % FALLBACK_UNSPLASH_URLS.length];
  const [imgSrc, setImgSrc] = useState(() => resolvePropertyImageUrl(image_url, id));

  useEffect(() => {
    setImgSrc(resolvePropertyImageUrl(image_url, id));
  }, [image_url, id]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#EFE6DC]/80 bg-white shadow-[0_4px_24px_rgba(44,34,30,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(44,34,30,0.09)]">
      <div className="relative h-48 w-full overflow-hidden rounded-t-2xl bg-[#EFE6DC]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          onError={() => {
            if (imgSrc !== fallbackSrc) {
              setImgSrc(fallbackSrc);
            }
          }}
          className="h-48 w-full overflow-hidden rounded-t-2xl object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

        <div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-1.5 pr-10">
          <span className="rounded-full bg-[#FAF6F0]/95 px-3 py-1 text-xs font-medium text-[#3D302A] shadow-2xs backdrop-blur-xs">
            {type.name}
          </span>
          {is_good_price && (
            <span className="rounded-full bg-[#4D724D] px-2.5 py-1 text-xs font-semibold text-white shadow-2xs">
              🔥 Хорошая цена
            </span>
          )}
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(id);
            }}
            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            title={isFavorite ? 'В избранном' : 'Добавить в избранное'}
            className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF6F0]/95 shadow-2xs transition hover:scale-105 hover:bg-white"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 transition ${
                isFavorite ? 'fill-[#B85D3B] text-[#B85D3B]' : 'fill-none text-[#5C4D44] hover:text-[#B85D3B]'
              }`}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xl font-bold text-[#2C221E]">
            {formatPrice(monthlyPrice)}
            <span className="text-sm font-normal text-[#7A6A5E]"> / мес.</span>
          </p>
          {is_good_price && (
            <span className="rounded-md bg-[#F2F6F2] px-2 py-0.5 text-[11px] font-semibold text-[#3B593B]">
              Ниже рынка
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-snug text-[#2C221E] transition group-hover:text-[#B85D3B]">
          {title}
        </h3>

        <p className="text-sm text-[#5C4D44]">
          {rooms}-комн. · {area} м²
        </p>

        <p className="text-sm text-[#7A6A5E]">
          <span className="font-medium text-[#3D302A]">
            {address.city}, {address.district}
          </span>{' '}
          · {formatAddress(address)}
        </p>

        <div className="mt-1 flex flex-wrap gap-1.5">
          {petsAllowed && (
            <span className="rounded-lg bg-[#F2F6F2] px-2.5 py-0.5 text-xs font-medium text-[#3B593B]">
              🐾 Можно с питомцами
            </span>
          )}
          {noDeposit && (
            <span className="rounded-lg bg-[#FAF0EB] px-2.5 py-0.5 text-xs font-medium text-[#8E4226]">
              ⚡ Без залога
            </span>
          )}
          {fromOwner && (
            <span className="rounded-lg bg-[#FBF5ED] px-2.5 py-0.5 text-xs font-medium text-[#785027]">
              👤 От хозяина
            </span>
          )}
        </div>

        <Link href={`/properties/${id}`} className="mt-auto pt-3">
          <span className="block rounded-xl bg-[#B85D3B] px-4 py-2.5 text-center text-sm font-medium text-white shadow-2xs transition hover:bg-[#9E4B2D]">
            Подробнее и заявка
          </span>
        </Link>
      </div>
    </article>
  );
}

export const PropertyCard = memo(PropertyCardBase);
