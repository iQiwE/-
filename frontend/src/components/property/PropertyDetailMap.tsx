'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { FALLBACK_UNSPLASH_URLS, formatAddress, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
import { Property } from '@/types/property';

interface Props {
  property: Property;
}

function createDetailPinIcon(price: number) {
  const label = `${Math.round(price / 1000)}k ₸`;
  return L.divIcon({
    html: `<div style="padding:4px 11px;border-radius:9999px;background:var(--accent-primary, #B85D3B);color:#141312;font-weight:700;font-size:12px;border:2px solid var(--bg-card, #FAF6F0);white-space:nowrap;box-shadow:0 6px 16px rgba(0,0,0,0.38);display:inline-flex;align-items:center;gap:4px;"><span>📍</span><span>${label}</span></div>`,
    className: 'property-detail-pin-marker',
    iconSize: [82, 30],
    iconAnchor: [41, 15],
    popupAnchor: [0, -14],
  });
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function PropertyDetailMap({ property }: Props) {
  const rawLat = property.latitude ?? property.address?.lat;
  const rawLng = property.longitude ?? property.address?.lng;
  const lat = Number.isFinite(Number(rawLat)) ? Number(rawLat) : 49.953;
  const lng = Number.isFinite(Number(rawLng)) ? Number(rawLng) : 82.618;

  const imgSrc = resolvePropertyImageUrl(property.image_url, property.id);

  return (
    <div className="mt-7 overflow-hidden rounded-2xl border border-[#ECE2D6] bg-[#FAF6F0] shadow-[0_4px_20px_rgba(44,34,30,0.04)] transition-colors duration-300 dark:border-white/10 dark:bg-[#141312] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE2D6] bg-[#FAF6F0] px-4 py-3 text-xs text-[#6B5B50] dark:border-white/10 dark:bg-[#181614] dark:text-[#A8A096]">
        <div className="flex items-center gap-2">
          <span className="font-medium uppercase tracking-wider text-[#2C221E] dark:text-[#F5F3EF]">
            Расположение на карте
          </span>
          <span className="hidden text-[#8C8278] sm:inline">· Нажмите на метку для просмотра превью</span>
        </div>
        <span className="font-mono text-[11px] text-[#7A6A5E] dark:text-[#D4B89C]">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
      </div>

      <div className="h-72 w-full">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={true}
          className="z-0 h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnChange lat={lat} lng={lng} />
          <Marker position={[lat, lng]} icon={createDetailPinIcon(property.monthlyPrice)}>
            <Popup>
              <div className="flex w-64 max-w-xs flex-col overflow-hidden bg-white text-sm text-[#2C221E] dark:bg-[#1D1B19] dark:text-[#F5F3EF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt={property.title}
                  className="h-36 w-full rounded-t-lg object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_UNSPLASH_URLS[0]) {
                      target.src = FALLBACK_UNSPLASH_URLS[0];
                    }
                  }}
                />
                <div className="flex flex-col gap-1.5 p-3.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#9E4B2D] dark:text-[#D4B89C]">
                    {property.type.name} · {property.rooms}-комн. · {property.area} м²
                  </span>
                  <p className="font-serif text-base font-medium leading-snug text-[#2C221E] dark:text-[#F5F3EF]">
                    {property.title}
                  </p>
                  <p className="text-xs text-[#6B5B50] dark:text-[#A8A096]">
                    {property.address.city}, {property.address.district}, {formatAddress(property.address)}
                  </p>
                  <div className="mt-1 flex items-baseline justify-between border-t border-[#ECE2D6] pt-2 dark:border-white/10">
                    <p className="text-base font-bold text-[#B85D3B] dark:text-[#D4B89C]">
                      {formatPrice(property.monthlyPrice)}{' '}
                      <span className="text-xs font-normal text-[#7A6A5E] dark:text-[#8C8278]">/ мес.</span>
                    </p>
                    <span className="rounded-full bg-[#F5E6DF] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#9E4B2D] dark:bg-[#B89778]/20 dark:text-[#D4B89C]">
                      {property.status}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
