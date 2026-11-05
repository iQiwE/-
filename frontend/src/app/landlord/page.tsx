'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiRequest } from '@/lib/api/client';
import { getSessionUser, getToken } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { Property } from '@/types/property';

interface ApplicationItem {
  id: number;
  propertyId: number;
  propertyTitle: string;
  tenantName: string;
  desiredStartDate: string;
  leaseMonths: number;
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const LANDLORD_PAGE_SIZE = 5;

export default function LandlordDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<'CHECKING' | 'ALLOWED' | 'FORBIDDEN'>('CHECKING');
  const [properties, setProperties] = useState<Property[]>([]);
  const [propPage, setPropPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RENTED' | 'INACTIVE'>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'status_avail' | 'status_rented'>('newest');
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Усть-Каменогорск');
  const [district, setDistrict] = useState('Ульбинский');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [rooms, setRooms] = useState(2);
  const [area, setArea] = useState(54);
  const [monthlyPrice, setMonthlyPrice] = useState(180000);

  const loadData = useCallback(async (jwt: string) => {
    try {
      const [props, apps] = await Promise.all([
        apiGet<Property[]>('/landlord/properties', {}, undefined, jwt),
        apiGet<ApplicationItem[]>('/landlord/applications', {}, undefined, jwt),
      ]);
      setProperties(props);
      setApplications(apps);
    } catch (e: any) {
      setError(e.message ?? 'Ошибка загрузки данных');
    }
  }, []);

  useEffect(() => {
    const existingToken = getToken();
    const existingUser = getSessionUser();

    if (!existingToken || !existingUser) {
      router.replace('/login');
      return;
    }

    if (existingUser.role !== 'LANDLORD') {
      setAccessState('FORBIDDEN');
      router.replace('/catalog');
      return;
    }

    setToken(existingToken);
    setAccessState('ALLOWED');
    loadData(existingToken);
  }, [loadData, router]);

  if (accessState === 'CHECKING') {
    return <main className="mx-auto max-w-4xl p-8 text-sm text-gray-500">Проверка прав доступа...</main>;
  }

  if (accessState === 'FORBIDDEN') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-xl bg-red-50 p-6 text-red-800">
          <h1 className="text-lg font-bold">403 — Доступ запрещён</h1>
          <p className="mt-2 text-sm">Кабинет арендодателя доступен только пользователям с ролью LANDLORD.</p>
          <Link
            href="/catalog"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Перейти в каталог
          </Link>
        </div>
      </main>
    );
  }

  async function handleCreateProperty(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiRequest(
        'POST',
        '/properties',
        {
          title,
          typeId: 1,
          rooms: Number(rooms),
          area: Number(area),
          monthlyPrice: Number(monthlyPrice),
          address: { city, district, street, building },
        },
        token,
      );
      setTitle('');
      setStreet('');
      setBuilding('');
      setPropPage(1);
      setNotice('Объявление опубликовано.');
      await loadData(token);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось создать объявление');
    }
  }

  async function handleApprove(id: number) {
    if (!token) return;
    setError(null);
    try {
      const res = await apiRequest<{ contractId: number; paymentsCreated: number }>(
        'PATCH',
        `/applications/${id}/approve`,
        undefined,
        token,
      );
      setNotice(`Заявка #${id} одобрена. Создан договор #${res.contractId} и платежей: ${res.paymentsCreated}.`);
      await loadData(token);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось одобрить заявку');
    }
  }

  async function handleReject(id: number) {
    if (!token) return;
    setError(null);
    try {
      await apiRequest('PATCH', `/applications/${id}/reject`, undefined, token);
      setNotice(`Заявка #${id} отклонена.`);
      await loadData(token);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось отклонить заявку');
    }
  }

  async function handleDeactivateProperty(id: number) {
    if (!token) return;
    setError(null);
    try {
      await apiRequest('DELETE', `/properties/${id}`, undefined, token);
      setNotice(`Объект #${id} снят с публикации (статус INACTIVE).`);
      await loadData(token);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось снять объект с публикации');
    }
  }

  async function handleActivateProperty(id: number) {
    if (!token) return;
    setError(null);
    try {
      await apiRequest('PATCH', `/properties/${id}/activate`, undefined, token);
      setNotice(`Объект #${id} возвращён в публикацию (статус AVAILABLE).`);
      await loadData(token);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось активировать объект');
    }
  }

  const uniqueDistricts = Array.from(new Set(properties.map((p) => p.address.district))).sort();

  const filteredAndSortedProperties = properties
    .filter((p) => (statusFilter === 'ALL' ? true : p.status === statusFilter))
    .filter((p) => (districtFilter === 'ALL' ? true : p.address.district === districtFilter))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.monthlyPrice - b.monthlyPrice;
      if (sortBy === 'price_desc') return b.monthlyPrice - a.monthlyPrice;
      if (sortBy === 'status_avail') return a.status === 'AVAILABLE' ? -1 : b.status === 'AVAILABLE' ? 1 : 0;
      if (sortBy === 'status_rented') return a.status === 'RENTED' ? -1 : b.status === 'RENTED' ? 1 : 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPropPages = Math.max(1, Math.ceil(filteredAndSortedProperties.length / LANDLORD_PAGE_SIZE));
  const safePropPage = Math.min(propPage, totalPropPages);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Кабинет арендодателя</h1>
        <Link href="/catalog" className="text-sm text-blue-600 hover:underline">
          В каталог →
        </Link>
      </header>

      {notice && <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">{notice}</div>}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Входящие заявки на аренду</h2>
        {applications.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Заявок пока нет.</p>
        ) : (
          <div className="mt-4 divide-y">
            {applications.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    #{a.id} · {a.propertyTitle}
                  </p>
                  <p className="text-gray-600">
                    Арендатор: {a.tenantName} · Срок: {a.leaseMonths} мес. · Статус: <b>{a.status}</b>
                  </p>
                </div>
                {a.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(a.id)}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleReject(a.id)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                    >
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
        <form onSubmit={handleCreateProperty} className="flex flex-col gap-3.5 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Добавить объявление</h2>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Заголовок объявления
            <input
              required
              placeholder="Например: 2-к квартира на набережной Славского"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Город (ВКО)
              <input
                required
                placeholder="Усть-Каменогорск"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Район
              <input
                required
                placeholder="Ульбинский / КШТ / Октябрьский"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Улица / Проспект
              <input
                required
                placeholder="пр-т Назарбаева"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Дом
              <input
                required
                placeholder="42"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Комнат
              <input
                type="number"
                min={1}
                required
                placeholder="2"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Площадь, м²
              <input
                type="number"
                min={10}
                required
                placeholder="54"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Цена в месяц, ₸
              <input
                type="number"
                min={1000}
                required
                placeholder="180000"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Опубликовать
          </button>
        </form>

        <div className="flex flex-col justify-between rounded-xl bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Мои объекты ({filteredAndSortedProperties.length})
              </h2>
              {filteredAndSortedProperties.length > LANDLORD_PAGE_SIZE && (
                <span className="text-xs text-gray-500">
                  Показано {(safePropPage - 1) * LANDLORD_PAGE_SIZE + 1}–
                  {Math.min(safePropPage * LANDLORD_PAGE_SIZE, filteredAndSortedProperties.length)} из{' '}
                  {filteredAndSortedProperties.length}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                Статус
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setPropPage(1);
                  }}
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-normal text-gray-900"
                >
                  <option value="ALL">Все статусы</option>
                  <option value="AVAILABLE">AVAILABLE (Свободно)</option>
                  <option value="RENTED">RENTED (Сдано)</option>
                  <option value="INACTIVE">INACTIVE (Снято)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                Район
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setPropPage(1);
                  }}
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-normal text-gray-900"
                >
                  <option value="ALL">Все районы</option>
                  {uniqueDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                Сортировка
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setPropPage(1);
                  }}
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-normal text-gray-900"
                >
                  <option value="newest">Сначала новые</option>
                  <option value="price_asc">Цена: по возрастанию</option>
                  <option value="price_desc">Цена: по убыванию</option>
                  <option value="status_avail">Сначала AVAILABLE</option>
                  <option value="status_rented">Сначала RENTED</option>
                </select>
              </label>
            </div>

            <div className="mt-3 divide-y text-sm">
              {filteredAndSortedProperties.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">Объектов по выбранным фильтрам нет.</p>
              ) : (
                filteredAndSortedProperties
                  .slice((safePropPage - 1) * LANDLORD_PAGE_SIZE, safePropPage * LANDLORD_PAGE_SIZE)
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug text-gray-900">{p.title}</p>
                        <p className="mt-0.5 text-gray-500">
                          {p.address.city}, {p.address.district} · {formatPrice(p.monthlyPrice)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center justify-end gap-2 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            p.status === 'RENTED'
                              ? 'bg-amber-100 text-amber-800'
                              : p.status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {p.status}
                        </span>

                        {p.status === 'AVAILABLE' && (
                          <button
                            type="button"
                            onClick={() => handleDeactivateProperty(p.id)}
                            className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            Снять с публикации
                          </button>
                        )}

                        {p.status === 'INACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleActivateProperty(p.id)}
                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Вернуть в каталог
                          </button>
                        )}

                        {p.status === 'RENTED' && (
                          <button
                            type="button"
                            onClick={() => handleActivateProperty(p.id)}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                          >
                            Освободить
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {filteredAndSortedProperties.length > LANDLORD_PAGE_SIZE && (
            <nav className="mt-4 flex items-center justify-center gap-2 border-t pt-4" aria-label="Перелистывание объектов">
              <button
                type="button"
                aria-label="Предыдущая страница"
                disabled={safePropPage <= 1}
                onClick={() => setPropPage(Math.max(1, safePropPage - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                ←
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPropPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPropPage(pageNum)}
                    className={`h-7 w-7 rounded-md text-xs font-medium ${
                      pageNum === safePropPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                aria-label="Следующая страница"
                disabled={safePropPage >= totalPropPages}
                onClick={() => setPropPage(Math.min(totalPropPages, safePropPage + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                →
              </button>
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
