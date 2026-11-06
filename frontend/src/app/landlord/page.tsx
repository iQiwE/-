'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiRequest } from '@/lib/api/client';
import { propertiesApi } from '@/lib/api/properties.api';
import { getSessionUser, getToken } from '@/lib/auth';
import { FALLBACK_UNSPLASH_URLS, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
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

const inputCls =
  'rounded-xl border border-[#E2D6C8] bg-[#FAF6F0]/60 px-3.5 py-2.5 text-sm font-normal text-[#2C221E] transition focus:border-[#B85D3B] focus:bg-white focus:outline-none';

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
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [noDeposit, setNoDeposit] = useState(false);
  const [fromOwner, setFromOwner] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPropertyId, setUploadingPropertyId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }

  function clearSelectedFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  if (accessState === 'CHECKING') {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-[#6B5B50]">Проверка прав доступа...</main>;
  }

  if (accessState === 'FORBIDDEN') {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="rounded-2xl border border-[#ECE2D6] bg-white p-8 text-[#9E3B24] shadow-[0_4px_24px_rgba(44,34,30,0.05)]">
          <h1 className="font-serif text-xl font-bold text-[#2C221E]">403 — Доступ запрещён</h1>
          <p className="mt-2 text-sm text-[#6B5B50]">
            Кабинет арендодателя доступен только пользователям с ролью LANDLORD.
          </p>
          <Link
            href="/catalog"
            className="mt-5 inline-block rounded-xl bg-[#B85D3B] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9E4B2D]"
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
    setNotice(null);
    setSubmitting(true);
    try {
      const created = await apiRequest<Property>(
        'POST',
        '/properties',
        {
          title,
          typeId: 1,
          rooms: Number(rooms),
          area: Number(area),
          monthlyPrice: Number(monthlyPrice),
          petsAllowed,
          noDeposit,
          fromOwner,
          address: { city, district, street, building },
        },
        token,
      );

      if (selectedFile && created?.id) {
        await propertiesApi.uploadPropertyImage(created.id, selectedFile, token);
      }

      setTitle('');
      setStreet('');
      setBuilding('');
      clearSelectedFile();
      setPropPage(1);
      setNotice(
        selectedFile
          ? 'Объявление и собственная фотография успешно опубликованы.'
          : 'Объявление опубликовано.',
      );
      await loadData(token);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось создать объявление');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadExistingPropertyImage(propertyId: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    setError(null);
    setUploadingPropertyId(propertyId);
    try {
      await propertiesApi.uploadPropertyImage(propertyId, file, token);
      setNotice(`Фотография объекта #${propertyId} обновлена.`);
      await loadData(token);
    } catch (err: any) {
      setError(err.message ?? 'Не удалось загрузить фотографию');
    } finally {
      setUploadingPropertyId(null);
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
    <main className="flex flex-col">
      {/* Секция 1 (Кремовый фон): Заголовок и входящие заявки */}
      <section className="bg-[#FAF6F0] py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-[#2C221E]">Кабинет арендодателя</h1>
              <p className="mt-1 text-sm text-[#6B5B50]">
                Управление объектами недвижимости, фотографиями, заявками арендаторов и статусами публикации
              </p>
            </div>
            <Link href="/catalog" className="text-sm font-medium text-[#B85D3B] hover:underline">
              В каталог →
            </Link>
          </header>

          {notice && <div className="rounded-2xl bg-[#F5E6DF] p-4 text-sm text-[#7A3821]">{notice}</div>}
          {error && <div className="rounded-2xl bg-[#FDF2EE] p-4 text-sm text-[#9E3B24]">{error}</div>}

          <div className="rounded-2xl border border-[#ECE2D6] bg-white p-7 shadow-[0_4px_24px_rgba(44,34,30,0.05)]">
            <h2 className="font-serif text-xl font-semibold text-[#2C221E]">Входящие заявки на аренду</h2>
            {applications.length === 0 ? (
              <p className="mt-2 text-sm text-[#6B5B50]">Заявок пока нет.</p>
            ) : (
              <div className="mt-4 divide-y divide-[#F0E7DC]">
                {applications.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5 text-sm">
                    <div>
                      <p className="font-medium text-[#2C221E]">
                        #{a.id} · {a.propertyTitle}
                      </p>
                      <p className="mt-0.5 text-[#6B5B50]">
                        Арендатор: {a.tenantName} · Срок: {a.leaseMonths} мес. · Статус:{' '}
                        <b className="text-[#2C221E]">{a.status}</b>
                      </p>
                    </div>
                    {a.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(a.id)}
                          className="rounded-xl bg-[#4D724D] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#3B593B]"
                        >
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          className="rounded-xl bg-[#9E3B24] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#822E1A]"
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Секция 2 (Белый фон для чередования): Создание и список объектов */}
      <section className="border-t border-[#ECE3D8] bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[1fr_1.35fr] lg:px-8">
          <form
            onSubmit={handleCreateProperty}
            className="flex flex-col gap-4 rounded-2xl border border-[#ECE2D6] bg-[#FAF6F0]/60 p-7 shadow-[0_4px_24px_rgba(44,34,30,0.04)]"
          >
            <h2 className="font-serif text-xl font-semibold text-[#2C221E]">Добавить объявление</h2>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
              Заголовок объявления
              <input
                required
                placeholder="Например: 2-к квартира на набережной Славского"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
                Город (ВКО)
                <input
                  required
                  placeholder="Усть-Каменогорск"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
                Район
                <input
                  required
                  placeholder="Ульбинский / КШТ / Октябрьский"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
                Улица / Проспект
                <input
                  required
                  placeholder="пр-т Назарбаева"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
                Дом
                <input
                  required
                  placeholder="42"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
                Комнат
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="2"
                  value={rooms}
                  onChange={(e) => setRooms(Number(e.target.value))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
                Площадь, м²
                <input
                  type="number"
                  min={10}
                  required
                  placeholder="54"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
                Цена в месяц, ₸
                <input
                  type="number"
                  min={1000}
                  required
                  placeholder="180000"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                  className={inputCls}
                />
              </label>
            </div>

            {/* Поле загрузки фотографии квартиры с превью */}
            <div className="flex flex-col gap-2 text-sm font-medium text-[#3D302A]">
              <span>Фотография квартиры (необязательно)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-xl border border-dashed border-[#D6C5B3] bg-white px-3.5 py-2.5 text-xs text-[#5C4D44] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#F5E6DF] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#9E4B2D] hover:border-[#B85D3B]"
              />

              {previewUrl && (
                <div className="relative mt-1 overflow-hidden rounded-xl border border-[#E2D6C8] bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Превью выбранного фото"
                    className="h-40 w-full rounded-lg object-cover"
                  />
                  <div className="mt-2 flex items-center justify-between px-1 text-xs text-[#6B5B50]">
                    <span className="truncate">{selectedFile?.name}</span>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="font-medium text-[#9E3B24] hover:underline"
                    >
                      Удалить фото
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1 text-xs font-medium text-[#3D302A]">
              <label
                className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all duration-200 ${
                  petsAllowed
                    ? 'border-[#4D724D] bg-[#4D724D] text-white shadow-xs ring-2 ring-[#4D724D]/25'
                    : 'border-[#D5E0D5] bg-[#F2F6F2] text-[#3B593B] hover:border-[#B8CCB8] hover:bg-[#E6EFE6]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="sr-only"
                />
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className={`shrink-0 transition-all duration-200 ${
                    petsAllowed ? 'h-3.5 w-3.5 scale-100 opacity-100' : 'h-3.5 w-0 scale-0 opacity-0'
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>🐾 Можно с питомцами</span>
              </label>
              <label
                className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all duration-200 ${
                  noDeposit
                    ? 'border-[#B85D3B] bg-[#B85D3B] text-white shadow-xs ring-2 ring-[#B85D3B]/25'
                    : 'border-[#E8CFC4] bg-[#FAF0EB] text-[#8E4226] hover:border-[#D9B3A3] hover:bg-[#F5E6DF]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={noDeposit}
                  onChange={(e) => setNoDeposit(e.target.checked)}
                  className="sr-only"
                />
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className={`shrink-0 transition-all duration-200 ${
                    noDeposit ? 'h-3.5 w-3.5 scale-100 opacity-100' : 'h-3.5 w-0 scale-0 opacity-0'
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>⚡ Без залога</span>
              </label>
              <label
                className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all duration-200 ${
                  fromOwner
                    ? 'border-[#9C6B3B] bg-[#9C6B3B] text-white shadow-xs ring-2 ring-[#9C6B3B]/25'
                    : 'border-[#E6D6C3] bg-[#FBF5ED] text-[#785027] hover:border-[#D6BFA4] hover:bg-[#F5EBDC]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={fromOwner}
                  onChange={(e) => setFromOwner(e.target.checked)}
                  className="sr-only"
                />
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className={`shrink-0 transition-all duration-200 ${
                    fromOwner ? 'h-3.5 w-3.5 scale-100 opacity-100' : 'h-3.5 w-0 scale-0 opacity-0'
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>👤 От хозяина</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-xl bg-[#B85D3B] px-5 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-[#9E4B2D] disabled:opacity-50"
            >
              {submitting ? 'Публикация...' : 'Опубликовать'}
            </button>
          </form>

          <div className="flex flex-col justify-between rounded-2xl border border-[#ECE2D6] bg-[#FAF6F0]/60 p-7 shadow-[0_4px_24px_rgba(44,34,30,0.04)]">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-[#2C221E]">
                  Мои объекты ({filteredAndSortedProperties.length})
                </h2>
                {filteredAndSortedProperties.length > LANDLORD_PAGE_SIZE && (
                  <span className="text-xs text-[#6B5B50]">
                    Показано {(safePropPage - 1) * LANDLORD_PAGE_SIZE + 1}–
                    {Math.min(safePropPage * LANDLORD_PAGE_SIZE, filteredAndSortedProperties.length)} из{' '}
                    {filteredAndSortedProperties.length}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-[#5C4D44]">
                  Статус
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setPropPage(1);
                    }}
                    className="rounded-xl border border-[#E2D6C8] bg-white px-3 py-2 text-xs font-normal text-[#2C221E]"
                  >
                    <option value="ALL">Все статусы</option>
                    <option value="AVAILABLE">AVAILABLE (Свободно)</option>
                    <option value="RENTED">RENTED (Сдано)</option>
                    <option value="INACTIVE">INACTIVE (Снято)</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium text-[#5C4D44]">
                  Район
                  <select
                    value={districtFilter}
                    onChange={(e) => {
                      setDistrictFilter(e.target.value);
                      setPropPage(1);
                    }}
                    className="rounded-xl border border-[#E2D6C8] bg-white px-3 py-2 text-xs font-normal text-[#2C221E]"
                  >
                    <option value="ALL">Все районы</option>
                    {uniqueDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium text-[#5C4D44]">
                  Сортировка
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setPropPage(1);
                    }}
                    className="rounded-xl border border-[#E2D6C8] bg-white px-3 py-2 text-xs font-normal text-[#2C221E]"
                  >
                    <option value="newest">Сначала новые</option>
                    <option value="price_asc">Цена: по возрастанию</option>
                    <option value="price_desc">Цена: по убыванию</option>
                    <option value="status_avail">Сначала AVAILABLE</option>
                    <option value="status_rented">Сначала RENTED</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 divide-y divide-[#EAE0D5] text-sm">
                {filteredAndSortedProperties.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[#6B5B50]">Объектов по выбранным фильтрам нет.</p>
                ) : (
                  filteredAndSortedProperties
                    .slice((safePropPage - 1) * LANDLORD_PAGE_SIZE, safePropPage * LANDLORD_PAGE_SIZE)
                    .map((p) => {
                      const thumbUrl = resolvePropertyImageUrl(p.image_url, p.id);
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-3.5 py-3.5">
                          <div className="flex min-w-0 flex-1 items-center gap-3.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumbUrl}
                              alt={p.title}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== FALLBACK_UNSPLASH_URLS[0]) {
                                  target.src = FALLBACK_UNSPLASH_URLS[0];
                                }
                              }}
                              className="h-14 w-16 shrink-0 rounded-xl object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium leading-snug text-[#2C221E]">{p.title}</p>
                              <p className="mt-0.5 text-xs text-[#6B5B50]">
                                {p.address.city}, {p.address.district} · {formatPrice(p.monthlyPrice)}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 whitespace-nowrap">
                            <label className="cursor-pointer rounded-xl border border-[#DFD3C3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#5C4D44] transition hover:border-[#B85D3B]/40 hover:bg-[#FAF6F0]">
                              {uploadingPropertyId === p.id ? 'Загрузка...' : '📷 Фото'}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingPropertyId === p.id}
                                onChange={(e) => handleUploadExistingPropertyImage(p.id, e)}
                                className="sr-only"
                              />
                            </label>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                p.status === 'RENTED'
                                  ? 'bg-[#FBF5ED] text-[#785027]'
                                  : p.status === 'AVAILABLE'
                                    ? 'bg-[#F2F6F2] text-[#3B593B]'
                                    : 'bg-[#ECE3D8] text-[#5C4D44]'
                              }`}
                            >
                              {p.status}
                            </span>

                            {p.status === 'AVAILABLE' && (
                              <button
                                type="button"
                                onClick={() => handleDeactivateProperty(p.id)}
                                className="rounded-xl border border-[#DFD3C3] bg-white px-3 py-1.5 text-xs font-medium text-[#3D302A] transition hover:bg-[#F3ECE2]"
                              >
                                Снять с публикации
                              </button>
                            )}

                            {p.status === 'INACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleActivateProperty(p.id)}
                                className="rounded-xl bg-[#B85D3B] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#9E4B2D]"
                              >
                                Вернуть в каталог
                              </button>
                            )}

                            {p.status === 'RENTED' && (
                              <button
                                type="button"
                                onClick={() => handleActivateProperty(p.id)}
                                className="rounded-xl border border-[#D6BFA4] bg-[#FBF5ED] px-3 py-1.5 text-xs font-medium text-[#785027] transition hover:bg-[#F5EBDC]"
                              >
                                Освободить
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {filteredAndSortedProperties.length > LANDLORD_PAGE_SIZE && (
              <nav
                className="mt-5 flex items-center justify-center gap-2 border-t border-[#EAE0D5] pt-4"
                aria-label="Перелистывание объектов"
              >
                <button
                  type="button"
                  aria-label="Предыдущая страница"
                  disabled={safePropPage <= 1}
                  onClick={() => setPropPage(Math.max(1, safePropPage - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#DFD3C3] bg-white text-xs font-medium text-[#3D302A] hover:bg-[#FAF6F0] disabled:opacity-40"
                >
                  ←
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPropPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPropPage(pageNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-medium transition ${
                        pageNum === safePropPage
                          ? 'bg-[#B85D3B] text-white'
                          : 'border border-[#DFD3C3] bg-white text-[#3D302A] hover:bg-[#FAF6F0]'
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
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#DFD3C3] bg-white text-xs font-medium text-[#3D302A] hover:bg-[#FAF6F0] disabled:opacity-40"
                >
                  →
                </button>
              </nav>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
