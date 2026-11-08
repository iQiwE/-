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
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:var(--accent-primary, #B85D3B);color:#141312;font-weight:700;font-size:16px;border:3px solid var(--bg-card, #FAF6F0);box-shadow:0 6px 18px rgba(0,0,0,0.45);">📍</div>`,
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
    <div className="overflow-hidden rounded-xl border border-[#E2D6C8] bg-[#FAF6F0] dark:border-white/15 dark:bg-[#141312]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2D6C8] bg-[#FAF6F0] px-3.5 py-2 text-[11px] text-[#6B5B50] dark:border-white/10 dark:bg-[#181614] dark:text-[#A8A096]">
        <span>Кликните по карте или перетащите маркер 📍 для выбора точки</span>
        <span className="font-mono font-medium text-[#2C221E] dark:text-[#D4B89C]">
          {safeLat.toFixed(6)}, {safeLng.toFixed(6)}
        </span>
      </div>
      <div className="h-56 w-full">
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
