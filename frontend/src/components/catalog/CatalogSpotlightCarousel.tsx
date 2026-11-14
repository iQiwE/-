'use client';

import Link from 'next/link';
import { memo } from 'react';
import { FALLBACK_UNSPLASH_URLS, formatAddress, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
import { Property } from '@/types/property';

interface CatalogSpotlightCarouselProps {
  spotlightDeal: Property | null;
  storyDeals: Property[];
}

/**
 * Презентационный (Dumb/UI) компонент горизонтальной витрины «Успейте снять · ниже рынка».
 * Принимает только подготовленные данные и отвечает исключительно за рендер.
 */
function CatalogSpotlightCarouselBase({ spotlightDeal, storyDeals }: CatalogSpotlightCarouselProps) {
  if (!spotlightDeal) return null;

  return (
    <section className="pt-1.5 pb-2 md:pt-4 md:pb-6">
      <div className="mx-auto max-w-7xl px-3.5 md:px-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-normal tracking-tight text-[#2C0107] sm:text-2xl dark:text-[#FADCD5]">
            Успейте снять · <span className="italic text-[#C42759] dark:text-[#dcbab3]">ниже рынка</span>
          </h2>
          <span className="text-xs text-[#845962] dark:text-[#B08D87]">Спецпредложения</span>
        </div>

        <div className="no-scrollbar -mx-3.5 flex snap-x snap-mandatory items-stretch gap-2.5 overflow-x-auto px-3.5 pb-1 md:mx-0 md:gap-3.5 md:px-0">
          {/* 1. Компактная акцентная карточка дня (Spotlight Card) */}
          <Link
            href={`/properties/${spotlightDeal.id}`}
            className="group relative flex h-[126px] w-[224px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl bg-[#2C0107] p-2.5 text-[#FADCD5] shadow-[0_8px_24px_rgba(44,1,7,0.16)] sm:h-[168px] sm:w-[310px] sm:rounded-3xl sm:p-4 dark:bg-[#2D222F]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvePropertyImageUrl(spotlightDeal.image_url, spotlightDeal.id)}
              alt={spotlightDeal.title}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_UNSPLASH_URLS[0]) {
                  target.src = FALLBACK_UNSPLASH_URLS[0];
                }
              }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1B0C1A] via-[#1B0C1A]/50 to-[#1B0C1A]/15" />

            <div className="relative z-10 flex items-center justify-between gap-1.5">
              <span className="rounded-full bg-[#C42759] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white sm:px-2.5 sm:text-[10px]">
                ★ Выбор дня
              </span>
              <span className="rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-medium text-[#FADCD5] backdrop-blur-md sm:text-[10px]">
                {spotlightDeal.rooms}-к · {spotlightDeal.area} м²
              </span>
            </div>

            <div className="relative z-10 mt-auto">
              <p className="text-base font-extrabold tracking-tight text-white sm:text-xl">
                {formatPrice(spotlightDeal.monthlyPrice)}
                <span className="text-[10px] font-normal text-[#DCBAB3]"> / мес.</span>
              </p>
              <p className="truncate text-[11px] font-medium text-[#FADCD5] sm:text-xs">{spotlightDeal.title}</p>
              <p className="truncate text-[10px] text-[#DCBAB3]/85">
                {spotlightDeal.address.district}, {formatAddress(spotlightDeal.address)}
              </p>
            </div>
          </Link>

          {/* 2. Компактные мини-карточки карусели */}
          {storyDeals.map((deal) => (
            <Link
              key={`story-${deal.id}`}
              href={`/properties/${deal.id}`}
              className="group relative flex h-[126px] w-[134px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl bg-[#2D222F] p-2.5 text-[#FADCD5] shadow-[0_8px_22px_rgba(44,1,7,0.12)] sm:h-[168px] sm:w-[164px] sm:rounded-3xl sm:p-3.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvePropertyImageUrl(deal.image_url, deal.id)}
                alt={deal.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== FALLBACK_UNSPLASH_URLS[1]) {
                    target.src = FALLBACK_UNSPLASH_URLS[1];
                  }
                }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1B0C1A]/95 via-[#1B0C1A]/35 to-transparent" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="rounded-full bg-[#1B0C1A]/70 px-2 py-0.5 text-[9px] font-semibold text-[#FADCD5] backdrop-blur-md sm:text-[10px]">
                  {deal.rooms}-к · {deal.area} м²
                </span>
              </div>

              <div className="relative z-10 mt-auto">
                <p className="text-xs font-extrabold tracking-tight text-white sm:text-sm">
                  {formatPrice(deal.monthlyPrice)}
                </p>
                <p className="truncate text-[10px] font-medium text-[#FADCD5] sm:text-xs">{deal.address.district}</p>
                <p className="truncate text-[9px] text-[#DCBAB3]/80 sm:text-[10px]">
                  {deal.address.street}, {deal.address.building}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export const CatalogSpotlightCarousel = memo(CatalogSpotlightCarouselBase);
