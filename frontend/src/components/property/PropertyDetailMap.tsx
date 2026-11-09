'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { FALLBACK_UNSPLASH_URLS, formatAddress, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
import { Property } from '@/types/property';

interface Props {
  property: Property;
}

function createDetailPinIcon(price: number): L.DivIcon {
  const label = `${Math.round(price / 1000)}k ₸`;
  return L.divIcon({
    html: `<div style="padding:3px 10px;border-radius:9999px;background:var(--accent-primary, #C42759);color:#FADCD5;font-weight:700;font-size:11px;border:2px solid var(--bg-card, #FFFFFF);white-space:nowrap;box-shadow:0 5px 14px rgba(27,12,26,0.38);display:inline-flex;align-items:center;gap:4px;"><span>📍</span><span>${label}</span></div>`,
    className: 'property-detail-pin-marker',
    iconSize: [78, 26],
    iconAnchor: [39, 13],
    popupAnchor: [0, -11],
  });
}

function RecenterOnChange({
  lat,
  lng,
  onMapClick,
}: {
  lat: number;
  lng: number;
  onMapClick: () => void;
}) {
  const map = useMap();
  const prevCoords = useRef<{ lat: number; lng: number }>({ lat, lng });

  useMapEvents({
    click: () => onMapClick(),
  });

  useEffect(() => {
    if (prevCoords.current.lat !== lat || prevCoords.current.lng !== lng) {
      prevCoords.current = { lat, lng };
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [lat, lng, map]);

  return null;
}

function PropertyDetailMapBase({ property }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const rawLat = property.latitude ?? property.address?.lat;
  const rawLng = property.longitude ?? property.address?.lng;
  const lat = Number.isFinite(Number(rawLat)) ? Number(rawLat) : 49.953;
  const lng = Number.isFinite(Number(rawLng)) ? Number(rawLng) : 82.618;

  const imgSrc = resolvePropertyImageUrl(property.image_url, property.id);
  const pinIcon = useMemo(() => createDetailPinIcon(property.monthlyPrice), [property.monthlyPrice]);

  return (
    <div className="mt-5 w-full max-w-full overflow-hidden rounded-2xl border border-[#6D3C52]/15 bg-[#FDF5F3] shadow-[0_10px_30px_rgba(44,1,7,0.06)] transition-colors duration-300 sm:mt-7 sm:rounded-3xl dark:border-[#FADCD5]/12 dark:bg-[#1B0C1A] dark:shadow-[0_12px_36px_rgba(11,4,11,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6D3C52]/12 bg-[#FDF5F3] px-3.5 py-2.5 text-xs text-[#5A2D36] sm:px-5 sm:py-3 dark:border-[#FADCD5]/12 dark:bg-[#241423] dark:text-[#DCBAB3]">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-[#2C0107] dark:text-[#FADCD5]">
            Расположение на карте
          </span>
          <span className="hidden text-[#845962] sm:inline dark:text-[#B08D87]">
            · Нажмите на метку для просмотра
          </span>
        </div>
        <span className="rounded-full bg-[#FADCD5]/65 px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
      </div>

      <div className="h-60 w-full sm:h-72">
        <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={true} className="z-0 h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnChange lat={lat} lng={lng} onMapClick={() => setSheetOpen(false)} />
          <Marker
            key={property.id}
            position={[lat, lng]}
            icon={pinIcon}
            eventHandlers={{
              click: (e) => {
                e.originalEvent?.stopPropagation();
                if (isMobile) {
                  setSheetOpen(true);
                }
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
                    src={imgSrc}
                    alt={property.title}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== FALLBACK_UNSPLASH_URLS[0]) {
                        target.src = FALLBACK_UNSPLASH_URLS[0];
                      }
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
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        </MapContainer>
      </div>

      {/* Мобильная шторка (Bottom Sheet) над BottomTabBar */}
      {isMobile && sheetOpen && (
        <div className="fixed inset-x-3 bottom-[70px] z-40 rounded-2xl border border-[#6D3C52]/20 bg-white/98 p-2.5 shadow-[0_-8px_30px_rgba(27,12,26,0.28)] backdrop-blur-xl md:hidden dark:border-[#FADCD5]/18 dark:bg-[#2D222F]/98">
          <div className="mx-auto mb-1.5 h-1 w-8 rounded-full bg-[#6D3C52]/25 dark:bg-[#FADCD5]/25" />
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={property.title}
              className="h-16 w-18 shrink-0 rounded-xl object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_UNSPLASH_URLS[0]) {
                  target.src = FALLBACK_UNSPLASH_URLS[0];
                }
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="shrink-0 whitespace-nowrap text-sm font-extrabold text-[#2C0107] dark:text-[#FADCD5]">
                  {formatPrice(property.monthlyPrice)}
                  <span className="text-[10px] font-normal text-[#845962] dark:text-[#B08D87]"> / мес.</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FADCD5]/50 text-xs text-[#2C0107] dark:bg-[#1B0C1A]/60 dark:text-[#FADCD5]"
                >
                  ✕
                </button>
              </div>
              <p className="truncate text-xs font-semibold text-[#5A2D36] dark:text-[#DCBAB3]">
                {property.rooms}-комн. · {property.area} м² · {property.title}
              </p>
              <p className="truncate text-[11px] text-[#845962] dark:text-[#B08D87]">
                {property.address.district}, {formatAddress(property.address)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PropertyDetailMapBase);
