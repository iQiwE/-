'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

const pickerPinIcon = L.divIcon({
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:var(--accent-primary, #C42759);color:#FADCD5;font-weight:700;font-size:16px;border:3px solid var(--bg-card, #2D222F);box-shadow:0 6px 18px rgba(27,12,26,0.45);">📍</div>`,
  className: 'location-picker-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapClickAndSyncHandler({
  latitude,
  longitude,
  onChange,
}: LocationPickerMapProps) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const nextLat = Number(e.latlng.lat.toFixed(6));
      const nextLng = Number(e.latlng.lng.toFixed(6));
      onChange(nextLat, nextLng);
    },
  });

  useEffect(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const center = map.getCenter();
      const dist = Math.hypot(center.lat - latitude, center.lng - longitude);
      if (dist > 0.0005) {
        map.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude, map]);

  return (
    <Marker
      position={[latitude, longitude]}
      icon={pickerPinIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target as L.Marker;
          const pos = marker.getLatLng();
          onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
        },
      }}
    />
  );
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
}: LocationPickerMapProps) {
  const safeLat = Number.isFinite(latitude) ? latitude : 49.953;
  const safeLng = Number.isFinite(longitude) ? longitude : 82.618;

  return (
    <div className="w-full max-w-full overflow-hidden rounded-2xl border border-[#6D3C52]/15 bg-[#FDF5F3] shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-[#1B0C1A]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6D3C52]/10 bg-[#FDF5F3] px-3.5 py-2.5 text-xs text-[#5A2D36] sm:px-4 dark:border-gray-800 dark:bg-[#241423] dark:text-[#DCBAB3]">
        <span>Кликните по карте или перетащите маркер 📍 для выбора точки</span>
        <span className="rounded-full bg-[#FADCD5]/70 px-2.5 py-0.5 font-mono font-semibold text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
          {safeLat.toFixed(6)}, {safeLng.toFixed(6)}
        </span>
      </div>
      <div className="h-52 w-full sm:h-56">
        <MapContainer
          center={[safeLat, safeLng]}
          zoom={13}
          scrollWheelZoom={true}
          className="z-0 h-full w-full cursor-crosshair"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickAndSyncHandler
            latitude={safeLat}
            longitude={safeLng}
            onChange={onChange}
          />
        </MapContainer>
      </div>
    </div>
  );
}
