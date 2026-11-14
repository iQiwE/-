'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import Supercluster, { PointFeature } from 'supercluster';
import { FALLBACK_UNSPLASH_URLS, formatAddress, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
import { isPropertyInPolygon } from '@/lib/geo/turf';
import { Property } from '@/types/property';

export type LatLngTuple = [number, number];

export interface MapComponentProps {
  /** Полный список доступных объектов (до или после фильтрации) для отображения на карте. */
  properties: Property[];
  totalBeforePolygon?: number;
  drawnPolygon?: LatLngTuple[] | null;
  onPolygonChange?: (polygon: LatLngTuple[] | null) => void;
  /** Полноэкранный режим карты (вкладка «На карте») — на мобильных занимает всю доступную высоту. */
  fullscreen?: boolean;
}

interface PointProps {
  cluster: false;
  property: Property;
}

const DEFAULT_CENTER: [number, number] = [49.953, 82.618];
const DEFAULT_ZOOM = 12;
const WORLD_BOUNDS: [number, number, number, number] = [-180, -85, 180, 85];

// Кэшируем иконки маркеров и кластеров для стабильности ссылок L.DivIcon
const clusterIconCache = new Map<number, L.DivIcon>();
const pinIconCache = new Map<string, L.DivIcon>();

function getClusterIcon(count: number): L.DivIcon {
  const cached = clusterIconCache.get(count);
  if (cached) return cached;

  const size = count < 5 ? 34 : count < 10 ? 40 : 44;
  const icon = L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:var(--accent-primary, #C42759);color:#FADCD5;font-weight:700;font-size:13px;border:2px solid var(--bg-card, #2D222F);box-shadow:0 6px 16px rgba(27,12,26,0.38);">${count}</div>`,
    className: 'property-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  clusterIconCache.set(count, icon);
  return icon;
}

function getPinIcon(price: number, isSelected: boolean): L.DivIcon {
  const roundedKey = `${Math.round(price)}-${isSelected ? 'sel' : 'def'}`;
  const cached = pinIconCache.get(roundedKey);
  if (cached) return cached;

  const label = `${Math.round(price / 1000)}k ₸`;
  const bg = isSelected ? '#C42759' : 'var(--bg-card, #2D222F)';
  const color = isSelected ? '#FFFFFF' : 'var(--text-primary, #2C0107)';
  const border = isSelected ? '#C42759' : 'var(--accent-primary, #C42759)';
  const scale = isSelected ? 'transform:scale(1.08);' : '';

  const icon = L.divIcon({
    html: `<div style="padding:3px 8px;border-radius:9999px;background:${bg};color:${color};font-weight:700;font-size:11px;border:2px solid ${border};white-space:nowrap;box-shadow:0 4px 12px rgba(27,12,26,0.3);transition:transform 0.15s ease;${scale}">${label}</div>`,
    className: 'property-pin-marker',
    iconSize: [60, 24],
    iconAnchor: [30, 12],
    popupAnchor: [0, -10],
  });
  pinIconCache.set(roundedKey, icon);
  return icon;
}

/**
 * Блокировка нативного скролла страницы, пока пользователь рисует контур пальцем.
 */
function useLockPageScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    const blockTouchScroll = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    document.addEventListener('touchmove', blockTouchScroll, { passive: false });

    return () => {
      document.removeEventListener('touchmove', blockTouchScroll);
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overscrollBehavior = prev.bodyOverscroll;
    };
  }, [locked]);
}

/**
 * Плагин рисования произвольной области (Lasso / Freehand Polygon) пальцем или мышкой.
 * Поддерживает принудительную очистку чернового слоя через clearSignal.
 */
function LassoDrawController({
  isDrawingMode,
  clearSignal,
  onCompletePolygon,
}: {
  isDrawingMode: boolean;
  clearSignal: number;
  onCompletePolygon: (ring: LatLngTuple[]) => void;
}) {
  const map = useMap();
  const [draftPoints, setDraftPoints] = useState<LatLngTuple[]>([]);
  const isPointerDownRef = useRef(false);
  const pointsRef = useRef<LatLngTuple[]>([]);

  useEffect(() => {
    isPointerDownRef.current = false;
    pointsRef.current = [];
    setDraftPoints([]);
  }, [clearSignal]);

  useEffect(() => {
    const container = map.getContainer();

    if (!isDrawingMode) {
      isPointerDownRef.current = false;
      pointsRef.current = [];
      setDraftPoints([]);
      return;
    }

    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    container.classList.add('map-drawing');

    const clientToLatLng = (clientX: number, clientY: number): LatLngTuple => {
      const rect = container.getBoundingClientRect();
      const latLng = map.containerPointToLatLng(L.point(clientX - rect.left, clientY - rect.top));
      return [latLng.lat, latLng.lng];
    };

    const startStroke = (clientX: number, clientY: number) => {
      isPointerDownRef.current = true;
      const firstPt = clientToLatLng(clientX, clientY);
      pointsRef.current = [firstPt];
      setDraftPoints([firstPt]);
    };

    const addPoint = (clientX: number, clientY: number) => {
      const pt = clientToLatLng(clientX, clientY);
      const current = pointsRef.current;
      if (current.length > 0) {
        const last = current[current.length - 1];
        if (Math.abs(last[0] - pt[0]) < 0.0002 && Math.abs(last[1] - pt[1]) < 0.0002) return;
      }
      const next = [...current, pt];
      pointsRef.current = next;
      setDraftPoints(next);
    };

    const finishStroke = () => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;
      const collected = pointsRef.current;
      pointsRef.current = [];
      setDraftPoints([]);
      if (collected.length >= 3) {
        onCompletePolygon(collected);
      }
    };

    const isUiTarget = (target: EventTarget | null) =>
      Boolean((target as HTMLElement | null)?.closest?.('[data-map-ui="true"]'));

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || isUiTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      startStroke(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerDownRef.current) return;
      e.preventDefault();
      addPoint(e.clientX, e.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isUiTarget(e.target)) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      startStroke(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isPointerDownRef.current) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      if (touch) addPoint(touch.clientX, touch.clientY);
    };

    container.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', finishStroke);
    container.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('touchend', finishStroke);
    window.addEventListener('touchcancel', finishStroke);

    return () => {
      container.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', finishStroke);
      container.removeEventListener('touchstart', onTouchStart, true);
      container.removeEventListener('touchmove', onTouchMove, true);
      window.removeEventListener('touchend', finishStroke);
      window.removeEventListener('touchcancel', finishStroke);
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      container.classList.remove('map-drawing');
    };
  }, [isDrawingMode, map, onCompletePolygon]);

  if (draftPoints.length < 2) return null;

  return (
    <>
      <Polyline positions={draftPoints} pathOptions={{ color: '#C42759', weight: 3, dashArray: '6 4' }} />
      {draftPoints.length >= 3 && (
        <Polygon
          positions={draftPoints}
          pathOptions={{ color: '#C42759', weight: 0, fillColor: '#C42759', fillOpacity: 0.14 }}
        />
      )}
    </>
  );
}

/**
 * Управляет масштабом карты при рисовании и при сбросе полигона:
 * - При замыкании контура приближает карту к нарисованной зоне.
 * - При нажатии «Сбросить область» возвращает обзор ко всем объектам города.
 */
function PolygonViewportController({
  polygon,
  clearSignal,
}: {
  polygon: LatLngTuple[] | null;
  clearSignal: number;
}) {
  const map = useMap();
  const prevClearSignal = useRef(clearSignal);

  useEffect(() => {
    if (polygon && polygon.length >= 3) {
      map.fitBounds(L.latLngBounds(polygon), { padding: [28, 28], animate: true, maxZoom: 16 });
    }
  }, [polygon, map]);

  useEffect(() => {
    if (clearSignal !== prevClearSignal.current) {
      prevClearSignal.current = clearSignal;
      map.closePopup();
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
    }
  }, [clearSignal, map]);

  return null;
}

function ClusteredMarkers({
  properties,
  isMobile,
  isDrawingMode,
  disableClustering,
  selectedPropertyId,
  onSelectMobileProperty,
}: {
  properties: Property[];
  isMobile: boolean;
  isDrawingMode: boolean;
  disableClustering: boolean;
  selectedPropertyId: number | null;
  onSelectMobileProperty: (property: Property | null) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(() => Math.round(map.getZoom()));

  useMapEvents({
    zoomend: () => {
      const nextZoom = Math.round(map.getZoom());
      setZoom((prev) => (prev !== nextZoom ? nextZoom : prev));
    },
    click: () => {
      if (isMobile) onSelectMobileProperty(null);
    },
  });

  const index = useMemo(() => {
    const sc = new Supercluster<PointProps>({ radius: 56, maxZoom: disableClustering ? 0 : 17 });

    const points: PointFeature<PointProps>[] = [];
    for (const p of properties) {
      const lat = Number(p.latitude ?? p.address?.lat);
      const lng = Number(p.longitude ?? p.address?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      points.push({
        type: 'Feature',
        properties: { cluster: false, property: p },
        geometry: { type: 'Point', coordinates: [lng, lat] },
      });
    }

    sc.load(points);
    return sc;
  }, [properties, disableClustering]);

  const clusters = useMemo(
    () => index.getClusters(WORLD_BOUNDS, disableClustering ? Math.max(zoom, 1) : zoom),
    [index, zoom, disableClustering],
  );

  // Во время рисования экран остаётся чистым — никаких меток поверх линии контура
  if (isDrawingMode) return null;

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties as any;

        if (props.cluster) {
          const clusterId = props.cluster_id as number;
          const count = props.point_count as number;
          return (
            <Marker
              key={`cluster-${clusterId}`}
              position={[lat, lng]}
              icon={getClusterIcon(count)}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent?.stopPropagation();
                  const expansionZoom = Math.min(index.getClusterExpansionZoom(clusterId), 18);
                  map.setView([lat, lng], expansionZoom, { animate: true });
                },
              }}
            />
          );
        }

        const property = (feature.properties as PointProps).property;
        const isSelected = selectedPropertyId === property.id;

        return (
          <Marker
            key={property.id}
            position={[lat, lng]}
            icon={getPinIcon(property.monthlyPrice, isSelected)}
            eventHandlers={{
              click: (e) => {
                e.originalEvent?.stopPropagation();
                if (isMobile) onSelectMobileProperty(property);
              },
            }}
          >
            {!isMobile && (
              <Popup closeOnClick={true} autoClose={true} autoPanPadding={[20, 20]}>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex w-[248px] items-center gap-2.5 bg-white p-2 text-left text-[#2C0107] dark:bg-[#2D222F] dark:text-[#FADCD5]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvePropertyImageUrl(property.image_url, property.id)}
                    alt={property.title}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== FALLBACK_UNSPLASH_URLS[0]) target.src = FALLBACK_UNSPLASH_URLS[0];
                    }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-3">
                    <p className="shrink-0 whitespace-nowrap text-xs font-extrabold text-[#C42759] dark:text-[#FADCD5]">
                      {formatPrice(property.monthlyPrice)}{' '}
                      <span className="text-[10px] font-normal text-[#845962] dark:text-[#B08D87]">/ мес.</span>
                    </p>
                    <p className="truncate text-[11px] font-semibold text-[#2C0107] dark:text-[#FADCD5]">
                      {property.rooms}-комн. · {property.area} м²
                    </p>
                    <p className="truncate text-[10px] text-[#845962] dark:text-[#B08D87]">
                      {property.address.district}, {formatAddress(property.address)}
                    </p>
                    <Link
                      href={`/properties/${property.id}`}
                      className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#C42759] hover:underline dark:text-[#DCBAB3]"
                    >
                      <span>Открыть</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}
    </>
  );
}

function CatalogMapBase({
  properties,
  totalBeforePolygon,
  drawnPolygon,
  onPolygonChange,
  fullscreen = false,
}: MapComponentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<number | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [localPolygon, setLocalPolygon] = useState<LatLngTuple[] | null>(drawnPolygon ?? null);
  const [clearSignal, setClearSignal] = useState(0);
  const [selectedMobileProperty, setSelectedMobileProperty] = useState<Property | null>(null);

  // Синхронизируем локальный стейт полигона при внешнем сбросе из родительского компонента
  useEffect(() => {
    if (drawnPolygon !== undefined) {
      setLocalPolygon(drawnPolygon);
    }
  }, [drawnPolygon]);

  const activePolygon = drawnPolygon !== undefined ? drawnPolygon : localPolygon;
  const hasPolygon = Boolean(activePolygon && activePolygon.length >= 3);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useLockPageScroll(isDrawingMode);

  // Фильтрация меток на уровне карты: когда активен полигон, показываем строго объекты внутри контура;
  // при сбросе полигона возвращаются абсолютно все доступные метки.
  const visibleProperties = useMemo(() => {
    if (!hasPolygon || !activePolygon) return properties;
    return properties.filter((p) => isPropertyInPolygon(p, activePolygon));
  }, [properties, activePolygon, hasPolygon]);

  const totalAvailableCount = totalBeforePolygon ?? properties.length;

  useEffect(() => {
    if (selectedMobileProperty && !visibleProperties.some((p) => p.id === selectedMobileProperty.id)) {
      setSelectedMobileProperty(null);
    }
  }, [visibleProperties, selectedMobileProperty]);

  const rememberScrollAnchor = () => {
    if (rootRef.current) scrollAnchorRef.current = rootRef.current.getBoundingClientRect().top;
  };

  useLayoutEffect(() => {
    if (scrollAnchorRef.current === null || !rootRef.current) return;
    const delta = rootRef.current.getBoundingClientRect().top - scrollAnchorRef.current;
    scrollAnchorRef.current = null;
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
  });

  const handleCompletePolygon = useCallback(
    (ring: LatLngTuple[]) => {
      rememberScrollAnchor();
      setIsDrawingMode(false);
      setLocalPolygon(ring);
      onPolygonChange?.(ring);
    },
    [onPolygonChange],
  );

  const handleClearPolygon = useCallback(() => {
    rememberScrollAnchor();
    setIsDrawingMode(false);
    setSelectedMobileProperty(null);
    setLocalPolygon(null);
    setClearSignal((prev) => prev + 1);
    onPolygonChange?.(null);
  }, [onPolygonChange]);

  const toggleDrawingMode = () => {
    setSelectedMobileProperty(null);
    setIsDrawingMode((prev) => !prev);
  };

  return (
    <div
      ref={rootRef}
      className="relative w-full max-w-full overflow-hidden rounded-2xl border border-[#6D3C52]/12 bg-white shadow-[0_10px_30px_rgba(44,1,7,0.06)] transition-colors duration-300 sm:rounded-3xl dark:border-gray-800 dark:bg-[#2D222F] dark:shadow-[0_14px_36px_rgba(11,4,11,0.5)]"
    >
      {/* Компактная шапка карты */}
      <div className="flex items-center justify-between gap-2 border-b border-[#6D3C52]/10 bg-[#FDF5F3] px-3.5 py-2.5 text-xs text-[#5A2D36] sm:px-5 sm:py-3 dark:border-gray-800 dark:bg-[#241423] dark:text-[#DCBAB3]">
        <span className="font-semibold uppercase tracking-wider text-[#2C0107] dark:text-[#FADCD5]">Карта ВКО</span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#FADCD5]/70 px-2.5 py-0.5 text-xs font-bold text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
            {isDrawingMode
              ? 'Режим рисования'
              : hasPolygon
                ? `В зоне: ${visibleProperties.length} из ${totalAvailableCount}`
                : `${visibleProperties.length} объ.`}
          </span>
          {hasPolygon && !isDrawingMode && (
            <button
              type="button"
              onClick={handleClearPolygon}
              className="rounded-full bg-[#C42759] px-3 py-0.5 text-xs font-bold text-white transition hover:bg-[#550416] dark:bg-[#6D3C52]"
            >
              Очистить фильтр ({totalAvailableCount})
            </button>
          )}
        </div>
      </div>

      <div
        className={`relative w-full ${
          fullscreen ? 'h-[calc(100dvh-300px)] min-h-[300px] md:h-[560px]' : 'h-[340px] sm:h-[420px]'
        } ${isDrawingMode ? 'map-drawing' : ''}`}
      >
        {/* Плавающие кнопки управления областью поверх карты (правый верхний угол) */}
        <div
          data-map-ui="true"
          className="absolute right-3 top-3 z-[500] flex flex-col items-end gap-1.5 sm:flex-row sm:items-center"
        >
          {hasPolygon && !isDrawingMode && (
            <button
              type="button"
              data-testid="reset-polygon-btn"
              onClick={handleClearPolygon}
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-800 bg-[#1B0C1A]/95 px-4 text-xs font-semibold text-[#FADCD5] shadow-[0_8px_22px_rgba(0,0,0,0.42)] backdrop-blur-md transition active:scale-95 hover:bg-[#C42759] hover:text-white"
            >
              <span>✕</span>
              <span>Сбросить область</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleDrawingMode}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-semibold shadow-[0_6px_18px_rgba(27,12,26,0.28)] backdrop-blur-md transition active:scale-95 ${
              isDrawingMode
                ? 'bg-[#C42759] text-white'
                : 'bg-white/95 text-[#2C0107] hover:bg-[#C42759] hover:text-white dark:border dark:border-gray-800 dark:bg-[#2D222F]/95 dark:text-[#FADCD5]'
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
              />
            </svg>
            <span>{isDrawingMode ? 'Отмена' : hasPolygon ? 'Перерисовать' : 'Нарисовать область'}</span>
          </button>
        </div>

        {isDrawingMode && (
          <div
            data-map-ui="true"
            className="pointer-events-none absolute left-3 top-14 z-[500] whitespace-nowrap rounded-full bg-[#1B0C1A]/90 px-3.5 py-1.5 text-[11px] font-medium text-[#FADCD5] shadow-lg backdrop-blur-md"
          >
            ✏️ Обведите район и отпустите палец
          </div>
        )}

        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="z-0 h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LassoDrawController
            isDrawingMode={isDrawingMode}
            clearSignal={clearSignal}
            onCompletePolygon={handleCompletePolygon}
          />
          <PolygonViewportController polygon={hasPolygon ? activePolygon : null} clearSignal={clearSignal} />

          {hasPolygon && activePolygon && !isDrawingMode && (
            <Polygon
              positions={activePolygon}
              pathOptions={{
                color: '#C42759',
                weight: 2.5,
                dashArray: '6 4',
                fillColor: '#C42759',
                fillOpacity: 0.12,
              }}
            />
          )}

          <ClusteredMarkers
            properties={visibleProperties}
            isMobile={isMobile}
            isDrawingMode={isDrawingMode}
            disableClustering={hasPolygon}
            selectedPropertyId={selectedMobileProperty?.id ?? null}
            onSelectMobileProperty={setSelectedMobileProperty}
          />
        </MapContainer>
      </div>

      {/* Мобильная шторка (Bottom Sheet) над MobileBottomNav */}
      {isMobile && selectedMobileProperty && !isDrawingMode && (
        <div
          role="dialog"
          aria-label="Превью выбранного объекта"
          className="fixed inset-x-3 bottom-[70px] z-40 rounded-2xl border border-[#6D3C52]/15 bg-white/98 p-2.5 shadow-[0_-8px_30px_rgba(27,12,26,0.28)] backdrop-blur-xl md:hidden dark:border-gray-800 dark:bg-[#2D222F]/98 dark:shadow-[0_-10px_34px_rgba(0,0,0,0.65)]"
        >
          <div className="mx-auto mb-1.5 h-1 w-8 rounded-full bg-[#6D3C52]/25 dark:bg-[#FADCD5]/25" />
          <div className="flex items-center gap-2.5">
            <Link
              href={`/properties/${selectedMobileProperty.id}`}
              className="relative h-18 w-20 shrink-0 overflow-hidden rounded-xl bg-[#FADCD5]/30 dark:bg-[#1B0C1A]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvePropertyImageUrl(selectedMobileProperty.image_url, selectedMobileProperty.id)}
                alt={selectedMobileProperty.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== FALLBACK_UNSPLASH_URLS[0]) target.src = FALLBACK_UNSPLASH_URLS[0];
                }}
              />
              {selectedMobileProperty.is_good_price && (
                <span className="absolute bottom-1 left-1 rounded-full bg-[#C42759] px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                  Выгодно
                </span>
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <p className="shrink-0 whitespace-nowrap text-sm font-extrabold text-[#2C0107] dark:text-[#FADCD5]">
                  {formatPrice(selectedMobileProperty.monthlyPrice)}
                  <span className="text-[10px] font-normal text-[#845962] dark:text-[#B08D87]"> / мес.</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedMobileProperty(null)}
                  aria-label="Закрыть шторку"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FADCD5]/50 text-xs text-[#2C0107] dark:bg-[#1B0C1A]/60 dark:text-[#FADCD5]"
                >
                  ✕
                </button>
              </div>
              <p className="truncate text-xs font-semibold text-[#5A2D36] dark:text-[#DCBAB3]">
                {selectedMobileProperty.rooms}-комн. · {selectedMobileProperty.area} м² · {selectedMobileProperty.title}
              </p>
              <p className="truncate text-[11px] text-[#845962] dark:text-[#B08D87]">
                {selectedMobileProperty.address.district}, {formatAddress(selectedMobileProperty.address)}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-medium text-[#C42759] dark:text-[#DCBAB3]">
                  {[
                    selectedMobileProperty.fromOwner ? 'от хозяина' : null,
                    selectedMobileProperty.noDeposit ? 'без залога' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Проверенный объект'}
                </span>
                <Link
                  href={`/properties/${selectedMobileProperty.id}`}
                  className="shrink-0 rounded-full bg-[#C42759] px-3 py-1 text-[11px] font-semibold text-white shadow-2xs transition hover:bg-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]"
                >
                  Подробнее →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const MapComponent = memo(CatalogMapBase);
export default MapComponent;
