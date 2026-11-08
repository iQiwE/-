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
    <div className="mt-7 flex h-72 items-center justify-center rounded-2xl border border-[#ECE2D6] bg-[#FAF6F0] text-xs text-[#6B5B50] dark:border-white/10 dark:bg-[#141312] dark:text-[#A8A096]">
      Загрузка интерактивной карты объекта...
    </div>
  ),
});

const inputCls =
  'rounded-xl border border-[#E2D6C8] bg-[#FAF6F0]/70 px-3.5 py-2.5 text-sm font-normal text-[#2C221E] transition focus:border-[#B85D3B] focus:bg-white focus:outline-none disabled:bg-[#F3ECE2] dark:border-white/12 dark:bg-[#141312] dark:text-[#F5F3EF] dark:focus:border-[#B89778] dark:focus:bg-[#181614] dark:disabled:bg-[#221F1C] dark:disabled:opacity-60';

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
      <div className="mx-auto max-w-5xl px-6 py-16 text-sm text-[#6B5B50] dark:text-[#A8A096]">
        Загрузка резиденции...
      </div>
    );
  }
  if (error || !property) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-sm text-[#9E3B24] dark:text-[#F29B88]">
        Ошибка: {error ?? 'Объект не найден'}
      </div>
    );
  }

  const imgSrc = resolvePropertyImageUrl(property.image_url, property.id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 lg:py-20">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-[#B85D3B] transition hover:underline dark:text-[#D4B89C]"
      >
        ← Назад в каталог
      </Link>

      <div className="mt-8 grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[#ECE2D6] bg-white shadow-[0_4px_24px_rgba(44,34,30,0.05)] transition-colors duration-300 dark:border-white/10 dark:bg-[#1C1A18] dark:shadow-[0_16px_44px_rgba(0,0,0,0.45)]">
          <div className="relative h-80 w-full bg-[#EFE6DC] dark:bg-[#25221F]">
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
              className="h-80 w-full object-cover"
            />
          </div>

          <div className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F5E6DF] px-3.5 py-1 text-xs font-medium uppercase tracking-wider text-[#9E4B2D] dark:border dark:border-[#B89778]/30 dark:bg-[#B89778]/15 dark:text-[#D4B89C]">
                  {property.type.name} · {property.status}
                </span>
                {property.is_good_price && (
                  <span className="rounded-full bg-[#4D724D] px-3.5 py-1 text-xs font-semibold text-white">
                    🔥 Хорошая цена (ниже рынка по р-ну {property.address.district})
                  </span>
                )}
              </div>

              {(!user || user.role === 'TENANT') && (
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                    isFavorite
                      ? 'border-[#E8CFC4] bg-[#FAF0EB] text-[#B85D3B] dark:border-[#B89778] dark:bg-[#B89778]/20 dark:text-[#D4B89C]'
                      : 'border-[#E2D6C8] bg-[#FAF6F0] text-[#3D302A] hover:border-[#B85D3B]/40 dark:border-white/15 dark:bg-[#25221F] dark:text-[#E5E0D8] dark:hover:border-[#B89778]'
                  }`}
                >
                  <span className={isFavorite ? 'text-[#B85D3B] dark:text-[#D4B89C]' : 'text-[#8E7D70]'}>♥</span>
                  {isFavorite ? 'В избранном' : 'В избранное'}
                </button>
              )}
            </div>

            <h1 className="mt-5 font-serif text-3xl font-normal text-[#2C221E] sm:text-4xl dark:text-[#F5F3EF]">
              {property.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <p className="text-2xl font-bold text-[#B85D3B] dark:text-[#D4B89C]">
                {formatPrice(property.monthlyPrice)}{' '}
                <span className="text-sm font-normal text-[#7A6A5E] dark:text-[#8C8278]">/ мес.</span>
              </p>
              {property.districtAvgPrice && (
                <span className="text-xs text-[#6B5B50] dark:text-[#A8A096]">
                  Средняя по р-ну {property.address.district}: {formatPrice(property.districtAvgPrice)}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {property.petsAllowed && (
                <span className="rounded-xl bg-[#F2F6F2] px-3 py-1 text-xs font-medium text-[#3B593B] dark:bg-white/5 dark:text-[#B8C9B8]">
                  🐾 Можно с питомцами
                </span>
              )}
              {property.noDeposit && (
                <span className="rounded-xl bg-[#FAF0EB] px-3 py-1 text-xs font-medium text-[#8E4226] dark:bg-[#B89778]/15 dark:text-[#D4B89C]">
                  ⚡ Без залога
                </span>
              )}
              {property.fromOwner && (
                <span className="rounded-xl bg-[#FBF5ED] px-3 py-1 text-xs font-medium text-[#785027] dark:bg-white/5 dark:text-[#C7B8A5]">
                  👤 От хозяина
                </span>
              )}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-[#ECE2D6] bg-[#FAF6F0] p-5 text-sm dark:border-white/10 dark:bg-[#141312]">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[#7A6A5E] dark:text-[#8C8278]">Комнат</dt>
                <dd className="mt-1 font-medium text-[#2C221E] dark:text-[#F5F3EF]">{property.rooms}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[#7A6A5E] dark:text-[#8C8278]">Площадь</dt>
                <dd className="mt-1 font-medium text-[#2C221E] dark:text-[#F5F3EF]">{property.area} м²</dd>
              </div>
              <div className="col-span-2 border-t border-[#E6DDD2] pt-3 dark:border-white/10">
                <dt className="text-[11px] uppercase tracking-wider text-[#7A6A5E] dark:text-[#8C8278]">Адрес</dt>
                <dd className="mt-1 font-medium text-[#2C221E] dark:text-[#F5F3EF]">
                  {property.address.city}, р-н {property.address.district}, {formatAddress(property.address)}
                </dd>
              </div>
            </dl>

            {property.description && (
              <p className="mt-6 text-sm leading-relaxed text-[#5C4D44] dark:text-[#B8B0A6]">{property.description}</p>
            )}

            {/* Интерактивная карта расположения объекта с попапом-миниатюрой */}
            <PropertyDetailMap property={property} />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 self-start rounded-2xl border border-[#ECE2D6] bg-white p-8 shadow-[0_4px_24px_rgba(44,34,30,0.05)] transition-colors duration-300 dark:border-white/10 dark:bg-[#1C1A18] dark:shadow-[0_16px_44px_rgba(0,0,0,0.45)]"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#B85D3B] dark:text-[#B89778]">
            Бронирование
          </span>
          <h2 className="font-serif text-2xl font-normal text-[#2C221E] dark:text-[#F5F3EF]">
            Оставить <span className="italic text-[#B85D3B] dark:text-[#B89778]">заявку</span>
          </h2>

          {!user && (
            <div className="rounded-xl border border-[#E8CFC4] bg-[#F5E6DF] p-3.5 text-xs leading-relaxed text-[#7A3821] dark:border-[#B89778]/30 dark:bg-[#B89778]/15 dark:text-[#D4B89C]">
              Вы просматриваете объект как гость. При нажатии кнопки «Оставить заявку» вы будете перенаправлены на
              страницу входа.
            </div>
          )}

          {isOwner && (
            <div
              className="rounded-xl bg-[#FBF5ED] p-3.5 text-sm text-[#785027] dark:bg-white/5 dark:text-[#D4B89C]"
              role="alert"
            >
              Это ваш объект недвижимости. Подача заявки на собственный объект запрещена.
            </div>
          )}

          {!isOwner && isLandlord && (
            <div
              className="rounded-xl bg-[#FBF5ED] p-3.5 text-sm text-[#785027] dark:bg-white/5 dark:text-[#D4B89C]"
              role="alert"
            >
              Подача заявок доступна только пользователям с ролью TENANT (арендатор).
            </div>
          )}

          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-[#3D302A] dark:text-[#C7BFB5]">
            Желаемая дата заселения
            <input
              type="date"
              required
              disabled={isOwner || isLandlord}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-[#3D302A] dark:text-[#C7BFB5]">
            Срок аренды (мес.)
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

          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-[#3D302A] dark:text-[#C7BFB5]">
            Сообщение арендодателю
            <textarea
              rows={3}
              disabled={isOwner || isLandlord}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={inputCls}
            />
          </label>

          {submitResult && (
            <p className="rounded-xl bg-[#F2F6F2] p-3.5 text-sm text-[#3B593B] dark:bg-[#4D724D]/25 dark:text-[#A3CFA3]">
              {submitResult}
            </p>
          )}
          {submitError && (
            <p className="rounded-xl bg-[#FDF2EE] p-3.5 text-sm text-[#9E3B24] dark:bg-[#2A1916] dark:text-[#F29B88]">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || isOwner || isLandlord || property.status !== 'AVAILABLE'}
            className="mt-2 rounded-full bg-[#B85D3B] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-xs transition hover:bg-[#9E4B2D] disabled:opacity-50 dark:bg-[#B89778] dark:text-[#141312] dark:hover:bg-[#CAB094]"
          >
            {submitting ? 'Отправка...' : 'Оставить заявку'}
          </button>
        </form>
      </div>
    </main>
  );
}
