'use client';

import dynamic from 'next/dynamic';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiRequest } from '@/lib/api/client';
import { propertiesApi } from '@/lib/api/properties.api';
import { getSessionUser, getToken } from '@/lib/auth';
import { FALLBACK_UNSPLASH_URLS, formatAddress, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
import { Property } from '@/types/property';

const LocationPickerMap = dynamic(() => import('@/components/landlord/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-2xl border border-[#6D3C52]/15 bg-[#FDF5F3] text-xs text-[#5A2D36] dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#DCBAB3]">
      Загрузка интерактивной карты выбора координат...
    </div>
  ),
});

interface ApplicationItem {
  id: number;
  propertyId: number;
  propertyTitle: string;
  tenantName: string;
  desiredStartDate: string;
  leaseMonths: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const inputCls =
  'min-h-11 w-full rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] px-4 py-2.5 text-sm font-normal text-[#2C0107] transition-all duration-300 focus:border-[#C42759] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C42759]/20 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:placeholder-[#B08D87] dark:focus:border-[#FADCD5]/45 dark:focus:ring-[#6D3C52]/40';

const LANDLORD_PAGE_SIZE = 5;

export default function LandlordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'checking' | 'authorized' | 'forbidden'>('checking');
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RENTED' | 'INACTIVE'>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'status_avail' | 'status_rented'>(
    'newest',
  );
  const [propPage, setPropPage] = useState<number>(1);

  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Усть-Каменогорск');
  const [district, setDistrict] = useState('Ульбинский');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [rooms, setRooms] = useState(2);
  const [area, setArea] = useState(54);
  const [monthlyPrice, setMonthlyPrice] = useState(180000);
  const [latitude, setLatitude] = useState<number>(49.953);
  const [longitude, setLongitude] = useState<number>(82.618);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [noDeposit, setNoDeposit] = useState(false);
  const [fromOwner, setFromOwner] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPropertyId, setUploadingPropertyId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function loadData(jwt: string) {
    setError(null);
    try {
      const [apps, props] = await Promise.all([
        apiGet<ApplicationItem[]>('/applications', undefined, undefined, jwt),
        apiGet<Property[]>('/properties/my', undefined, undefined, jwt),
      ]);
      setApplications(apps);
      setProperties(props);
    } catch (e: any) {
      setError(e.message ?? 'Ошибка загрузки данных кабинета');
    }
  }

  useEffect(() => {
    const existingToken = getToken();
    const existingUser = getSessionUser();

    if (!existingToken || !existingUser) {
      router.replace('/login?redirect=/landlord');
      return;
    }

    if (existingUser.role !== 'LANDLORD') {
      setAuthState('forbidden');
      return;
    }

    setToken(existingToken);
    setAuthState('authorized');
    loadData(existingToken);
  }, [router]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (authState === 'checking') {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-sm text-[#5A2D36] dark:text-[#DCBAB3]">
        Проверка прав доступа...
      </main>
    );
  }

  if (authState === 'forbidden') {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <div
          className="rounded-3xl border border-[#C42759]/25 bg-white p-8 text-[#2C0107] shadow-[0_14px_40px_rgba(44,1,7,0.08)] dark:border-[#FADCD5]/15 dark:bg-[#2D222F] dark:text-[#FADCD5]"
          role="alert"
        >
          <span className="inline-block rounded-full bg-[#FADCD5] px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
            Ошибка 403
          </span>
          <h1 className="mt-3 font-serif text-2xl font-normal">Доступ запрещён</h1>
          <p className="mt-2 text-sm text-[#5A2D36] dark:text-[#DCBAB3]">
            Личный кабинет арендодателя доступен только пользователям с ролью <b>LANDLORD</b>. Ваш текущий аккаунт имеет
            роль <b>TENANT</b>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="rounded-full bg-[#C42759] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
            >
              Перейти в каталог
            </Link>
            <Link
              href="/login?redirect=/landlord"
              className="rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#2C0107] transition hover:border-[#C42759] dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]"
            >
              Сменить аккаунт
            </Link>
          </div>
        </div>
      </main>
    );
  }

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

  function startEditingProperty(prop: Property) {
    setEditingPropertyId(prop.id);
    setTitle(prop.title);
    setCity(prop.address.city);
    setDistrict(prop.address.district);
    setStreet(prop.address.street);
    setBuilding(prop.address.building);
    setRooms(prop.rooms);
    setArea(prop.area);
    setMonthlyPrice(prop.monthlyPrice);
    setLatitude(Number(prop.latitude ?? prop.address.lat ?? 49.953));
    setLongitude(Number(prop.longitude ?? prop.address.lng ?? 82.618));
    setPetsAllowed(Boolean(prop.petsAllowed));
    setNoDeposit(Boolean(prop.noDeposit));
    setFromOwner(Boolean(prop.fromOwner));
    clearSelectedFile();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEditingProperty() {
    setEditingPropertyId(null);
    setTitle('');
    setCity('Усть-Каменогорск');
    setDistrict('Ульбинский');
    setStreet('');
    setBuilding('');
    setRooms(2);
    setArea(54);
    setMonthlyPrice(180000);
    setLatitude(49.953);
    setLongitude(82.618);
    setPetsAllowed(false);
    setNoDeposit(false);
    setFromOwner(true);
    clearSelectedFile();
  }

  async function handleSubmitProperty(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (editingPropertyId !== null) {
        await apiRequest<Property>(
          'PUT',
          `/properties/${editingPropertyId}`,
          {
            typeId: 1,
            title,
            rooms: Number(rooms),
            area: Number(area),
            monthlyPrice: Number(monthlyPrice),
            petsAllowed,
            noDeposit,
            fromOwner,
            latitude: Number(latitude),
            longitude: Number(longitude),
            address: {
              city,
              district,
              street,
              building,
              lat: Number(latitude),
              lng: Number(longitude),
            },
          },
          token,
        );

        if (selectedFile) {
          await propertiesApi.uploadPropertyImage(editingPropertyId, selectedFile, token);
        }

        setNotice(`Объект #${editingPropertyId} и его геопозиция успешно обновлены.`);
        cancelEditingProperty();
      } else {
        const created = await apiRequest<Property>(
          'POST',
          '/properties',
          {
            typeId: 1,
            title,
            rooms: Number(rooms),
            area: Number(area),
            monthlyPrice: Number(monthlyPrice),
            petsAllowed,
            noDeposit,
            fromOwner,
            latitude: Number(latitude),
            longitude: Number(longitude),
            address: {
              city,
              district,
              street,
              building,
              lat: Number(latitude),
              lng: Number(longitude),
            },
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
            ? 'Объявление, геопозиция и собственная фотография успешно опубликованы.'
            : 'Объявление с выбранной геопозицией на карте опубликовано.',
        );
      }
      await loadData(token);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось сохранить объявление');
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
      await apiRequest('PATCH', `/properties/${id}/deactivate`, undefined, token);
      setNotice(`Объект #${id} снят с публикации (статус INACTIVE).`);
      await loadData(token);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось снять объект с публикации');
    }
  }

  function handleDeleteProperty(prop: Property) {
    if (!token) return;
    setDeleteTarget(prop);
  }

  async function confirmDeleteProperty() {
    if (!token || !deleteTarget) return;
    const prop = deleteTarget;
    setDeletingProperty(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest('DELETE', `/properties/${prop.id}`, undefined, token);
      setProperties((prev) => prev.filter((item) => item.id !== prop.id));
      setApplications((prev) => prev.filter((app) => app.propertyId !== prop.id));
      if (editingPropertyId === prop.id) {
        cancelEditingProperty();
      }
      setNotice(`Объект #${prop.id} («${prop.title}») полностью удалён из базы данных.`);
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message ?? 'Не удалось удалить объект');
    } finally {
      setDeletingProperty(false);
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
      {/* Секция 1: Заголовок и входящие заявки */}
      <section className="bg-[#FDF5F3] py-10 transition-colors duration-300 md:py-14 dark:bg-[#1B0C1A]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:gap-8 md:px-8">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#6D3C52]/12 pb-5 md:pb-6 dark:border-[#FADCD5]/12">
            <div>
              <span className="inline-block rounded-full bg-[#FADCD5] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#550416] dark:bg-[#2D222F] dark:text-[#FADCD5]">
                Панель собственника
              </span>
              <h1 className="mt-3 font-serif text-2xl font-normal text-[#2C0107] sm:text-4xl dark:text-[#FADCD5]">
                Кабинет <span className="italic text-[#C42759] dark:text-[#dcbab3]">арендодателя</span>
              </h1>
              <p className="mt-1.5 text-sm text-[#5A2D36] dark:text-[#DCBAB3]">
                Управление резиденциями, геопозицией на карте, фотографиями и заявками арендаторов
              </p>
            </div>
            <Link
              href="/catalog"
              className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-[#6D3C52]/20 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2C0107] shadow-2xs transition-all duration-300 hover:border-[#C42759] hover:text-[#C42759] dark:border-[#FADCD5]/15 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#6D3C52]"
            >
              В каталог →
            </Link>
          </header>

          {notice && (
            <div className="rounded-2xl border border-[#C42759]/25 bg-[#FADCD5]/70 p-4 text-sm font-medium text-[#550416] shadow-xs sm:rounded-3xl dark:border-[#FADCD5]/20 dark:bg-[#6D3C52] dark:text-[#FADCD5]">
              {notice}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-[#C42759]/30 bg-[#FADCD5]/55 p-4 text-sm font-medium text-[#C42759] sm:rounded-3xl dark:border-[#FADCD5]/20 dark:bg-[#4B2138] dark:text-[#FADCD5]">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-[#6D3C52]/12 bg-white p-4 shadow-[0_14px_40px_rgba(44,1,7,0.06)] transition-colors duration-300 sm:rounded-3xl sm:p-6 md:p-7 dark:border-[#FADCD5]/12 dark:bg-[#2D222F] dark:shadow-[0_16px_44px_rgba(11,4,11,0.5)]">
            <h2 className="font-serif text-xl font-normal text-[#2C0107] sm:text-2xl dark:text-[#FADCD5]">
              Входящие <span className="italic text-[#C42759] dark:text-[#dcbab3]">заявки</span> на аренду
            </h2>
            {applications.length === 0 ? (
              <p className="mt-2 text-sm text-[#5A2D36] dark:text-[#DCBAB3]">Заявок пока нет.</p>
            ) : (
              <div className="mt-4 divide-y divide-[#6D3C52]/10 dark:divide-[#FADCD5]/10">
                {applications.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col justify-between gap-3.5 py-4 text-sm md:flex-row md:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="line-clamp-2 font-semibold text-[#2C0107] md:truncate dark:text-[#FADCD5]"
                        title={a.propertyTitle}
                      >
                        #{a.id} · {a.propertyTitle}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#5A2D36] dark:text-[#DCBAB3]">
                        <span>Арендатор: {a.tenantName}</span>
                        <span>· Срок: {a.leaseMonths} мес.</span>
                        <span>· Статус:</span>
                        <span className="inline-block rounded-full bg-[#FADCD5] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
                          {a.status}
                        </span>
                      </p>
                    </div>
                    {a.status === 'PENDING' && (
                      <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:shrink-0 md:items-center">
                        <button
                          type="button"
                          onClick={() => handleApprove(a.id)}
                          className="flex min-h-10 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#C42759] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#550416] md:w-auto dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
                        >
                          Одобрить
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(a.id)}
                          className="flex min-h-10 w-full items-center justify-center whitespace-nowrap rounded-full border border-[#6D3C52]/25 bg-[#FDF5F3] px-4 py-2 text-xs font-semibold text-[#550416] transition hover:bg-[#FADCD5] md:w-auto dark:border-[#FADCD5]/20 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
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

      {/* Секция 2: Создание/редактирование с интерактивной картой и список объектов */}
      <section className="border-t border-[#6D3C52]/12 bg-[#FADCD5]/20 py-10 transition-colors duration-300 md:py-14 dark:border-[#FADCD5]/10 dark:bg-[#241423]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-6 px-4 md:gap-8 md:px-8 lg:flex-row lg:items-start">
          <form
            ref={formRef}
            onSubmit={handleSubmitProperty}
            className="flex w-full shrink-0 scroll-mt-24 flex-col gap-4 rounded-2xl border border-[#6D3C52]/12 bg-white p-4 shadow-[0_14px_40px_rgba(44,1,7,0.06)] transition-colors duration-300 sm:rounded-3xl sm:p-6 md:p-7 lg:w-[410px] xl:w-[440px] dark:border-[#FADCD5]/12 dark:bg-[#2D222F] dark:shadow-[0_16px_44px_rgba(11,4,11,0.5)]"
          >
            <div className="flex min-h-[36px] items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-normal leading-tight text-[#2C0107] sm:text-2xl dark:text-[#FADCD5]">
                {editingPropertyId !== null ? (
                  <>
                    Редактировать{' '}
                    <span className="italic text-[#C42759] dark:text-[#dcbab3]">объект #{editingPropertyId}</span>
                  </>
                ) : (
                  <>
                    Добавить <span className="italic text-[#C42759] dark:text-[#dcbab3]">объявление</span>
                  </>
                )}
              </h2>
              {editingPropertyId !== null && (
                <button
                  type="button"
                  onClick={cancelEditingProperty}
                  className="min-h-9 shrink-0 rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] px-3.5 py-1 text-xs font-semibold text-[#5A2D36] transition hover:border-[#C42759] dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]"
                >
                  Отмена
                </button>
              )}
            </div>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
              <span className="pl-2">Заголовок объявления</span>
              <input
                required
                placeholder="Например: 2-к квартира на набережной Славского"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                <span className="pl-2">Город (ВКО)</span>
                <input
                  required
                  placeholder="Усть-Каменогорск"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                <span className="pl-2">Район</span>
                <input
                  required
                  placeholder="Ульбинский / КШТ"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                <span className="pl-2">Улица / Проспект</span>
                <input
                  required
                  placeholder="пр-т Назарбаева"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                <span className="pl-2">Дом</span>
                <input
                  required
                  placeholder="42"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                <span className="pl-2">Комнат</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={rooms}
                  onChange={(e) => setRooms(Number(e.target.value))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                <span className="pl-2">Площадь, м²</span>
                <input
                  type="number"
                  min={10}
                  required
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className={inputCls}
                />
              </label>

              <label className="col-span-2 flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] sm:col-span-1 dark:text-[#DCBAB3]">
                <span className="pl-2">Цена, ₸</span>
                <input
                  type="number"
                  min={1000}
                  required
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                  className={inputCls}
                />
              </label>
            </div>

            {/* Интерактивный выбор геопозиции на карте + поля координат */}
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="pl-2 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                  Геопозиция на карте
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(49.953);
                      setLongitude(82.618);
                    }}
                    className="rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] px-3 py-0.5 font-medium text-[#5A2D36] transition hover:border-[#C42759] dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]"
                  >
                    Центр УК
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(49.9235);
                      setLongitude(82.6515);
                    }}
                    className="rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] px-3 py-0.5 font-medium text-[#5A2D36] transition hover:border-[#C42759] dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]"
                  >
                    КШТ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(50.3441);
                      setLongitude(83.5129);
                    }}
                    className="rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] px-3 py-0.5 font-medium text-[#5A2D36] transition hover:border-[#C42759] dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]"
                  >
                    Риддер
                  </button>
                </div>
              </div>

              <LocationPickerMap
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                  <span className="pl-2">Широта (Latitude)</span>
                  <input
                    type="number"
                    step="0.000001"
                    min={-90}
                    max={90}
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className={inputCls}
                  />
                </label>

                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                  <span className="pl-2">Долгота (Longitude)</span>
                  <input
                    type="number"
                    step="0.000001"
                    min={-180}
                    max={180}
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className={inputCls}
                  />
                </label>
              </div>
            </div>

            {/* Поле загрузки фотографии квартиры с превью */}
            <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
              <span className="pl-2">Фотография квартиры (необязательно)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-full border border-dashed border-[#6D3C52]/30 bg-[#FDF5F3] px-4 py-2.5 text-xs font-normal normal-case tracking-normal text-[#5A2D36] file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#FADCD5] file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-[#550416] hover:border-[#C42759] dark:border-[#FADCD5]/20 dark:bg-[#1B0C1A] dark:text-[#DCBAB3] dark:file:bg-[#6D3C52] dark:file:text-[#FADCD5]"
              />

              {previewUrl && (
                <div className="relative mt-1 overflow-hidden rounded-2xl border border-[#6D3C52]/20 bg-[#FDF5F3] p-2 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Превью выбранного фото"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  <div className="mt-2 flex items-center justify-between px-2 text-xs normal-case tracking-normal text-[#5A2D36] dark:text-[#DCBAB3]">
                    <span className="truncate">{selectedFile?.name}</span>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="shrink-0 font-semibold text-[#C42759] hover:underline dark:text-[#FADCD5]"
                    >
                      Удалить фото
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-xs font-medium">
              <label
                className={`inline-flex min-h-9 cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all duration-300 ${
                  petsAllowed
                    ? 'border-[#C42759] bg-[#C42759] text-white shadow-xs dark:border-[#6D3C52] dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                    : 'border-[#6D3C52]/20 bg-[#FDF5F3] text-[#550416] hover:bg-[#FADCD5]/50 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="sr-only"
                />
                <span>🐾 Можно с питомцами</span>
              </label>

              <label
                className={`inline-flex min-h-9 cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all duration-300 ${
                  noDeposit
                    ? 'border-[#C42759] bg-[#C42759] text-white shadow-xs dark:border-[#6D3C52] dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                    : 'border-[#6D3C52]/20 bg-[#FDF5F3] text-[#550416] hover:bg-[#FADCD5]/50 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={noDeposit}
                  onChange={(e) => setNoDeposit(e.target.checked)}
                  className="sr-only"
                />
                <span>⚡ Без залога</span>
              </label>

              <label
                className={`inline-flex min-h-9 cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all duration-300 ${
                  fromOwner
                    ? 'border-[#550416] bg-[#550416] text-white shadow-xs dark:border-[#4B2138] dark:bg-[#4B2138] dark:text-[#FADCD5]'
                    : 'border-[#6D3C52]/20 bg-[#FDF5F3] text-[#550416] hover:bg-[#FADCD5]/50 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={fromOwner}
                  onChange={(e) => setFromOwner(e.target.checked)}
                  className="sr-only"
                />
                <span>👤 От хозяина</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 min-h-11 w-full rounded-full bg-[#C42759] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(196,39,89,0.28)] transition-all duration-300 hover:bg-[#550416] disabled:opacity-50 dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:shadow-[0_8px_22px_rgba(0,0,0,0.4)] dark:hover:bg-[#4B2138]"
            >
              {submitting
                ? 'Сохранение...'
                : editingPropertyId !== null
                  ? 'Сохранить изменения'
                  : 'Опубликовать'}
            </button>
          </form>

          {/* Правая колонка: Список объектов арендодателя */}
          <div className="flex min-w-0 w-full flex-1 flex-col justify-between rounded-2xl border border-[#6D3C52]/12 bg-white p-4 shadow-[0_14px_40px_rgba(44,1,7,0.06)] transition-colors duration-300 sm:rounded-3xl sm:p-6 md:p-7 dark:border-[#FADCD5]/12 dark:bg-[#2D222F] dark:shadow-[0_16px_44px_rgba(11,4,11,0.5)]">
            <div className="min-w-0 w-full">
              <div className="flex min-h-[36px] flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-xl font-normal leading-tight text-[#2C0107] sm:text-2xl dark:text-[#FADCD5]">
                  Мои <span className="italic text-[#C42759] dark:text-[#dcbab3]">объекты</span> (
                  {filteredAndSortedProperties.length})
                </h2>
                {filteredAndSortedProperties.length > LANDLORD_PAGE_SIZE && (
                  <span className="shrink-0 rounded-full bg-[#FADCD5]/60 px-3 py-1 text-xs font-medium text-[#550416] dark:bg-[#1B0C1A] dark:text-[#FADCD5]">
                    Показано {(safePropPage - 1) * LANDLORD_PAGE_SIZE + 1}–
                    {Math.min(safePropPage * LANDLORD_PAGE_SIZE, filteredAndSortedProperties.length)} из{' '}
                    {filteredAndSortedProperties.length}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                  <span className="pl-2">Статус</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setPropPage(1);
                    }}
                    className={inputCls}
                  >
                    <option value="ALL">Все статусы</option>
                    <option value="AVAILABLE">AVAILABLE (Свободно)</option>
                    <option value="RENTED">RENTED (Сдано)</option>
                    <option value="INACTIVE">INACTIVE (Снято)</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                  <span className="pl-2">Район</span>
                  <select
                    value={districtFilter}
                    onChange={(e) => {
                      setDistrictFilter(e.target.value);
                      setPropPage(1);
                    }}
                    className={inputCls}
                  >
                    <option value="ALL">Все районы</option>
                    {uniqueDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
                  <span className="pl-2">Сортировка</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setPropPage(1);
                    }}
                    className={inputCls}
                  >
                    <option value="newest">Сначала новые</option>
                    <option value="price_asc">Цена: по возрастанию</option>
                    <option value="price_desc">Цена: по убыванию</option>
                    <option value="status_avail">Сначала AVAILABLE</option>
                    <option value="status_rented">Сначала RENTED</option>
                  </select>
                </label>
              </div>

              {/* Список карточек объектов арендодателя: на мобильном вертикальные стеки (flex-col), на десктопе горизонтальные (md:flex-row) */}
              <div className="mt-5 flex flex-col gap-3.5 text-sm">
                {filteredAndSortedProperties.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[#5A2D36] dark:text-[#DCBAB3]">
                    Объектов по выбранным фильтрам нет.
                  </p>
                ) : (
                  filteredAndSortedProperties
                    .slice((safePropPage - 1) * LANDLORD_PAGE_SIZE, safePropPage * LANDLORD_PAGE_SIZE)
                    .map((p) => {
                      const thumbUrl = resolvePropertyImageUrl(p.image_url, p.id);
                      const propLat = Number(p.latitude ?? p.address.lat ?? 49.953).toFixed(4);
                      const propLng = Number(p.longitude ?? p.address.lng ?? 82.618).toFixed(4);
                      return (
                        <article
                          key={p.id}
                          className="flex flex-col gap-3.5 rounded-2xl border border-[#6D3C52]/12 bg-[#FDF5F3] p-4 shadow-[0_6px_20px_rgba(44,1,7,0.04)] transition-all duration-300 hover:border-[#C42759]/30 hover:shadow-[0_10px_28px_rgba(44,1,7,0.08)] md:flex-row md:items-center md:justify-between dark:border-[#FADCD5]/10 dark:bg-[#1B0C1A] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:hover:border-[#FADCD5]/25"
                        >
                          {/* Зона 1 (Фото слева) + Зона 2 (Текст посередине) */}
                          <div className="flex min-w-0 flex-1 items-start gap-3.5 md:items-center">
                            <Link
                              href={`/properties/${p.id}`}
                              className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#FADCD5]/40 dark:bg-[#2D222F]"
                            >
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
                                className="h-full w-full rounded-2xl object-cover transition duration-300 hover:scale-105"
                              />
                            </Link>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                                <span
                                  className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    p.status === 'AVAILABLE'
                                      ? 'bg-[#C42759] text-white dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                                      : p.status === 'RENTED'
                                        ? 'bg-[#FADCD5] text-[#550416] dark:bg-[#4B2138] dark:text-[#FADCD5]'
                                        : 'bg-[#D8D6D7] text-[#2C0107] dark:bg-[#2D222F] dark:text-[#DCBAB3]'
                                  }`}
                                >
                                  {p.status}
                                </span>
                                <span className="shrink-0 whitespace-nowrap text-sm font-bold text-[#C42759] dark:text-[#FADCD5]">
                                  {formatPrice(p.monthlyPrice)}
                                </span>
                                <span className="truncate text-xs text-[#845962] dark:text-[#B08D87]">
                                  · {p.rooms}-комн., {p.area} м²
                                </span>
                              </div>

                              <Link
                                href={`/properties/${p.id}`}
                                title={p.title}
                                className="mt-1 line-clamp-2 font-serif text-base font-medium leading-snug text-[#2C0107] transition hover:text-[#C42759] md:line-clamp-1 dark:text-[#FADCD5] dark:hover:text-white"
                              >
                                {p.title}
                              </Link>

                              <p
                                className="mt-0.5 line-clamp-2 text-xs text-[#5A2D36] md:truncate dark:text-[#DCBAB3]"
                                title={`${p.address.city}, ${p.address.district}, ${formatAddress(p.address)} · 📍 ${propLat}, ${propLng}`}
                              >
                                {p.address.city}, {p.address.district}, {formatAddress(p.address)} · 📍 {propLat},{' '}
                                {propLng}
                              </p>
                            </div>
                          </div>

                          {/* Зона 3: Тач-таргеты действий (минимум h-10, на мобильном сетка 2x2 на всю ширину w-full, на десктопе ряд справа) */}
                          <div className="grid w-full grid-cols-2 gap-2 border-t border-[#6D3C52]/10 pt-3 md:flex md:w-auto md:shrink-0 md:items-center md:justify-end md:gap-1.5 md:border-t-0 md:pt-0 dark:border-[#FADCD5]/10">
                            <button
                              type="button"
                              onClick={() => startEditingProperty(p)}
                              className="flex min-h-10 w-full items-center justify-center whitespace-nowrap rounded-full border border-[#6D3C52]/20 bg-white px-3.5 py-2 text-xs font-semibold text-[#2C0107] transition hover:border-[#C42759] hover:text-[#C42759] md:w-auto dark:border-[#FADCD5]/15 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#6D3C52]"
                            >
                              ✏️ Изменить
                            </button>

                            <label className="flex min-h-10 w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-[#6D3C52]/20 bg-white px-3.5 py-2 text-xs font-semibold text-[#2C0107] transition hover:border-[#C42759] hover:text-[#C42759] md:w-auto dark:border-[#FADCD5]/15 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#6D3C52]">
                              {uploadingPropertyId === p.id ? 'Загрузка...' : '📷 Фото'}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingPropertyId === p.id}
                                onChange={(e) => handleUploadExistingPropertyImage(p.id, e)}
                                className="sr-only"
                              />
                            </label>

                            {p.status === 'AVAILABLE' && (
                              <button
                                type="button"
                                onClick={() => handleDeactivateProperty(p.id)}
                                className="flex min-h-10 w-full items-center justify-center whitespace-nowrap rounded-full border border-[#6D3C52]/20 bg-white px-3.5 py-2 text-xs font-semibold text-[#2C0107] transition hover:border-[#C42759] hover:text-[#C42759] md:w-auto dark:border-[#FADCD5]/15 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#6D3C52]"
                              >
                                Снять
                              </button>
                            )}

                            {p.status === 'INACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleActivateProperty(p.id)}
                                className="flex min-h-10 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#C42759] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#550416] md:w-auto dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
                              >
                                В каталог
                              </button>
                            )}

                            {p.status === 'RENTED' && (
                              <button
                                type="button"
                                onClick={() => handleActivateProperty(p.id)}
                                className="flex min-h-10 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#FADCD5] px-3.5 py-2 text-xs font-semibold text-[#550416] transition hover:bg-[#C42759] hover:text-white md:w-auto dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
                              >
                                Освободить
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteProperty(p)}
                              title="Безвозвратно удалить объект из базы данных"
                              className="flex min-h-10 w-full items-center justify-center whitespace-nowrap rounded-full border border-[#C42759]/30 bg-[#FADCD5]/50 px-3.5 py-2 text-xs font-semibold text-[#550416] transition hover:border-[#550416] hover:bg-[#550416] hover:text-white md:w-auto dark:border-[#FADCD5]/20 dark:bg-[#4B2138] dark:text-[#FADCD5] dark:hover:bg-[#C42759] dark:hover:text-white"
                            >
                              🗑 Удалить
                            </button>
                          </div>
                        </article>
                      );
                    })
                )}
              </div>
            </div>

            {filteredAndSortedProperties.length > LANDLORD_PAGE_SIZE && (
              <nav
                className="mt-5 flex items-center justify-center gap-2 border-t border-[#6D3C52]/10 pt-4 dark:border-[#FADCD5]/10"
                aria-label="Перелистывание объектов"
              >
                <button
                  type="button"
                  aria-label="Предыдущая страница"
                  disabled={safePropPage <= 1}
                  onClick={() => setPropPage(Math.max(1, safePropPage - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] text-xs font-semibold text-[#2C0107] hover:bg-[#FADCD5]/50 disabled:opacity-40 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]"
                >
                  ←
                </button>

                <div className="flex flex-wrap items-center gap-1.5">
                  {Array.from({ length: totalPropPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPropPage(pageNum)}
                      className={`h-10 w-10 rounded-full text-xs font-semibold transition ${
                        pageNum === safePropPage
                          ? 'bg-[#C42759] text-white shadow-2xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                          : 'border border-[#6D3C52]/20 bg-[#FDF5F3] text-[#2C0107] hover:bg-[#FADCD5]/50 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]'
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] text-xs font-semibold text-[#2C0107] hover:bg-[#FADCD5]/50 disabled:opacity-40 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5]"
                >
                  →
                </button>
              </nav>
            )}
          </div>
        </div>
      </section>

      {/* Адаптивное модальное окно подтверждения удаления (w-[90%] на мобильных) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B0C1A]/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="w-[90%] max-w-md rounded-3xl border border-[#6D3C52]/20 bg-white p-6 shadow-2xl sm:p-7 dark:border-[#FADCD5]/20 dark:bg-[#2D222F]">
            <span className="inline-block rounded-full bg-[#FADCD5] px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#550416] dark:bg-[#4B2138] dark:text-[#FADCD5]">
              Подтверждение удаления
            </span>
            <h3
              id="delete-modal-title"
              className="mt-3 font-serif text-xl font-normal text-[#2C0107] sm:text-2xl dark:text-[#FADCD5]"
            >
              Удалить объект #{deleteTarget.id}?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5A2D36] dark:text-[#DCBAB3]">
              Вы действительно хотите безвозвратно удалить резиденцию{' '}
              <span className="font-semibold text-[#2C0107] dark:text-[#FADCD5]">«{deleteTarget.title}»</span>? Все
              связанные с ней заявки и записи в избранном также будут удалены.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                disabled={deletingProperty}
                onClick={() => setDeleteTarget(null)}
                className="flex min-h-11 w-full items-center justify-center rounded-full border border-[#6D3C52]/25 bg-[#FDF5F3] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#2C0107] transition hover:border-[#C42759] dark:border-[#FADCD5]/20 dark:bg-[#1B0C1A] dark:text-[#FADCD5]"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={deletingProperty}
                onClick={confirmDeleteProperty}
                className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#C42759] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-[#550416] disabled:opacity-50 dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
              >
                {deletingProperty ? 'Удаление...' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
