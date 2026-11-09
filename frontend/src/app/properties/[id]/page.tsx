'use client';

import dynamic from 'next/dynamic';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiRequest } from '@/lib/api/client';
import { propertiesApi } from '@/lib/api/properties.api';
import { getSessionUser, getToken, SessionUser } from '@/lib/auth';
import { FALLBACK_UNSPLASH_URLS, formatAddress, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
import { Property } from '@/types/property';

const PropertyDetailMap = dynamic(() => import('@/components/property/PropertyDetailMap'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 flex h-72 items-center justify-center rounded-3xl border border-[#6D3C52]/12 bg-[#FDF5F3] text-xs text-[#5A2D36] dark:border-[#FADCD5]/12 dark:bg-[#1B0C1A] dark:text-[#DCBAB3]">
      Загрузка интерактивной карты объекта...
    </div>
  ),
});

const inputCls =
  'w-full rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] px-4 py-2.5 text-sm font-normal text-[#2C0107] transition-all duration-300 focus:border-[#C42759] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C42759]/20 disabled:opacity-50 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:focus:border-[#FADCD5]/45 dark:focus:ring-[#6D3C52]/40';

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [property, setProperty] = useState<Property | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(tomorrow);
  const [leaseMonths, setLeaseMonths] = useState(12);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getSessionUser();
    const token = getToken();
    setUser(currentUser);

    apiGet<Property>(`/properties/${id}`)
      .then(setProperty)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));

    if (token && currentUser?.role === 'TENANT') {
      propertiesApi
        .getFavorites(token)
        .then((favs) => setIsFavorite(favs.some((f) => f.id === id)))
        .catch(() => {});
    }
  }, [id]);

  const isOwner = Boolean(user && property && user.role === 'LANDLORD' && user.id === property.ownerId);
  const isLandlord = user?.role === 'LANDLORD';

  async function handleToggleFavorite() {
    const token = getToken();
    const currentUser = getSessionUser();
    if (!token || !currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(`/properties/${id}`)}`);
      return;
    }
    if (currentUser.role !== 'TENANT') return;

    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      if (prev) {
        await propertiesApi.removeFavorite(id, token);
      } else {
        await propertiesApi.addFavorite(id, token);
      }
    } catch {
      setIsFavorite(prev);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitResult(null);

    const token = getToken();
    const currentUser = getSessionUser();

    if (!token || !currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(`/properties/${id}`)}`);
      return;
    }

    setSubmitting(true);
    try {
      if (property && currentUser.role === 'LANDLORD' && currentUser.id === property.ownerId) {
        throw new Error('Нельзя подать заявку на аренду собственного объекта.');
      }
      if (currentUser.role !== 'TENANT') {
        throw new Error('Подавать заявки на аренду могут только пользователи с ролью TENANT.');
      }

      await apiRequest(
        'POST',
        `/properties/${id}/applications`,
        { desiredStartDate: startDate, leaseMonths: Number(leaseMonths), message },
        token,
      );
      setSubmitResult('Заявка на аренду отправлена арендодателю.');
    } catch (err: any) {
      setSubmitError(err.message ?? 'Ошибка отправки заявки');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-sm text-[#5A2D36] md:px-8 md:py-16 dark:text-[#DCBAB3]">
        Загрузка резиденции...
      </div>
    );
  }
  if (error || !property) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-sm text-[#C42759] md:px-8 md:py-16 dark:text-[#FADCD5]">
        Ошибка: {error ?? 'Объект не найден'}
      </div>
    );
  }

  const imgSrc = resolvePropertyImageUrl(property.image_url, property.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12 lg:py-20">
      <Link
        href="/catalog"
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#6D3C52]/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2C0107] shadow-2xs transition-all duration-300 hover:border-[#C42759] hover:text-[#C42759] dark:border-[#FADCD5]/15 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#6D3C52]"
      >
        ← Назад в каталог
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-6 md:mt-8 md:gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[#6D3C52]/12 bg-white shadow-[0_14px_40px_rgba(44,1,7,0.06)] transition-colors duration-300 sm:rounded-3xl dark:border-[#FADCD5]/12 dark:bg-[#2D222F] dark:shadow-[0_18px_48px_rgba(11,4,11,0.55)]">
          <div className="relative h-64 w-full overflow-hidden rounded-t-2xl bg-[#FADCD5]/40 sm:h-80 sm:rounded-t-3xl md:h-96 dark:bg-[#1B0C1A]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={property.title}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_UNSPLASH_URLS[0]) {
                  target.src = FALLBACK_UNSPLASH_URLS[0];
                }
              }}
              className="h-full w-full rounded-t-2xl object-cover sm:rounded-t-3xl"
            />
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FADCD5] px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
                  {property.type.name} · {property.status}
                </span>
                {property.is_good_price && (
                  <span className="rounded-full bg-[#C42759] px-4 py-1 text-xs font-semibold text-white shadow-sm dark:bg-[#4B2138] dark:text-[#FADCD5]">
                    🔥 Хорошая цена (ниже рынка по р-ну {property.address.district})
                  </span>
                )}
              </div>

              {(!user || user.role === 'TENANT') && (
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-300 ${
                    isFavorite
                      ? 'border-[#C42759] bg-[#C42759] text-white shadow-sm dark:border-[#6D3C52] dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                      : 'border-[#6D3C52]/20 bg-[#FDF5F3] text-[#2C0107] hover:border-[#C42759] dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]'
                  }`}
                >
                  <span>♥</span>
                  <span>{isFavorite ? 'В избранном' : 'В избранное'}</span>
                </button>
              )}
            </div>

            <h1 className="mt-5 font-serif text-3xl font-normal text-[#2C0107] sm:text-4xl dark:text-[#FADCD5]">
              {property.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <p className="shrink-0 whitespace-nowrap text-2xl font-bold text-[#C42759] dark:text-[#FADCD5]">
                {formatPrice(property.monthlyPrice)}{' '}
                <span className="whitespace-nowrap text-sm font-normal text-[#845962] dark:text-[#B08D87]">/ мес.</span>
              </p>
              {property.districtAvgPrice && (
                <span className="rounded-full bg-[#FADCD5]/50 px-3 py-1 text-xs text-[#5A2D36] dark:bg-[#1B0C1A]/60 dark:text-[#DCBAB3]">
                  Средняя по р-ну {property.address.district}: {formatPrice(property.districtAvgPrice)}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {property.petsAllowed && (
                <span className="rounded-full bg-[#FADCD5]/65 px-3.5 py-1 text-xs font-medium text-[#550416] dark:bg-[#1B0C1A]/70 dark:text-[#FADCD5]">
                  🐾 Можно с питомцами
                </span>
              )}
              {property.noDeposit && (
                <span className="rounded-full bg-[#FADCD5]/65 px-3.5 py-1 text-xs font-medium text-[#550416] dark:bg-[#6D3C52]/50 dark:text-[#FADCD5]">
                  ⚡ Без залога
                </span>
              )}
              {property.fromOwner && (
                <span className="rounded-full bg-[#D8D6D7]/60 px-3.5 py-1 text-xs font-medium text-[#2C0107] dark:bg-[#4B2138]/70 dark:text-[#FADCD5]">
                  👤 От хозяина
                </span>
              )}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-[#6D3C52]/12 bg-[#FDF5F3] p-5 text-sm dark:border-[#FADCD5]/12 dark:bg-[#1B0C1A]">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#845962] dark:text-[#B08D87]">
                  Комнат
                </dt>
                <dd className="mt-1 font-semibold text-[#2C0107] dark:text-[#FADCD5]">{property.rooms}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#845962] dark:text-[#B08D87]">
                  Площадь
                </dt>
                <dd className="mt-1 font-semibold text-[#2C0107] dark:text-[#FADCD5]">{property.area} м²</dd>
              </div>
              <div className="col-span-2 border-t border-[#6D3C52]/12 pt-3 dark:border-[#FADCD5]/12">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#845962] dark:text-[#B08D87]">
                  Адрес
                </dt>
                <dd className="mt-1 font-semibold text-[#2C0107] dark:text-[#FADCD5]">
                  {property.address.city}, р-н {property.address.district}, {formatAddress(property.address)}
                </dd>
              </div>
            </dl>

            {property.description && (
              <p className="mt-6 text-sm leading-relaxed text-[#5A2D36] dark:text-[#DCBAB3]">{property.description}</p>
            )}

            {/* Интерактивная карта расположения объекта с попапом-миниатюрой */}
            <PropertyDetailMap property={property} />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 self-start rounded-2xl border border-[#6D3C52]/12 bg-white p-5 shadow-[0_14px_40px_rgba(44,1,7,0.06)] transition-colors duration-300 sm:rounded-3xl sm:p-6 md:p-8 dark:border-[#FADCD5]/12 dark:bg-[#2D222F] dark:shadow-[0_18px_48px_rgba(11,4,11,0.55)]"
        >
          <span className="self-start rounded-full bg-[#FADCD5] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
            Бронирование
          </span>
          <h2 className="font-serif text-2xl font-normal text-[#2C0107] dark:text-[#FADCD5]">
            Оставить <span className="italic text-[#C42759] dark:text-[#dcbab3]">заявку</span>
          </h2>

          {!user && (
            <div className="rounded-2xl border border-[#C42759]/20 bg-[#FADCD5]/55 p-4 text-xs leading-relaxed text-[#550416] dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]">
              Вы просматриваете объект как гость. При нажатии кнопки «Оставить заявку» вы будете перенаправлены на
              страницу входа.
            </div>
          )}

          {isOwner && (
            <div
              className="rounded-2xl bg-[#FADCD5]/65 p-4 text-sm text-[#550416] dark:bg-[#4B2138] dark:text-[#FADCD5]"
              role="alert"
            >
              Это ваш объект недвижимости. Подача заявки на собственный объект запрещена.
            </div>
          )}

          {!isOwner && isLandlord && (
            <div
              className="rounded-2xl bg-[#FADCD5]/65 p-4 text-sm text-[#550416] dark:bg-[#4B2138] dark:text-[#FADCD5]"
              role="alert"
            >
              Подача заявок доступна только пользователям с ролью TENANT (арендатор).
            </div>
          )}

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
            <span className="pl-2">Желаемая дата заселения</span>
            <input
              type="date"
              required
              disabled={isOwner || isLandlord}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
            <span className="pl-2">Срок аренды (мес.)</span>
            <input
              type="number"
              min={1}
              max={60}
              required
              disabled={isOwner || isLandlord}
              value={leaseMonths}
              onChange={(e) => setLeaseMonths(Number(e.target.value))}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
            <span className="pl-2">Сообщение арендодателю</span>
            <textarea
              rows={3}
              disabled={isOwner || isLandlord}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-2xl border border-[#6D3C52]/20 bg-[#FDF5F3] px-4 py-3 text-sm font-normal text-[#2C0107] transition-all duration-300 focus:border-[#C42759] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C42759]/20 disabled:opacity-50 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:focus:border-[#FADCD5]/45"
            />
          </label>

          {submitResult && (
            <p className="rounded-2xl bg-[#FADCD5] p-3.5 text-sm font-medium text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
              {submitResult}
            </p>
          )}
          {submitError && (
            <p className="rounded-2xl bg-[#FADCD5]/70 p-3.5 text-sm font-medium text-[#C42759] dark:bg-[#4B2138] dark:text-[#FADCD5]">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || isOwner || isLandlord || property.status !== 'AVAILABLE'}
            className="mt-2 rounded-full bg-[#C42759] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(196,39,89,0.28)] transition-all duration-300 hover:bg-[#550416] disabled:opacity-50 dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:shadow-[0_8px_22px_rgba(0,0,0,0.4)] dark:hover:bg-[#4B2138]"
          >
            {submitting ? 'Отправка...' : 'Оставить заявку'}
          </button>
        </form>
      </div>
    </main>
  );
}
