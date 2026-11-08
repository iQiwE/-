'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import Supercluster, { PointFeature } from 'supercluster';
import { FALLBACK_UNSPLASH_URLS, formatAddress, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
import { Property } from '@/types/property';

interface Props {
  properties: Property[];
}

interface PointProps {
  cluster: false;
  property: Property;
}

const DEFAULT_CENTER: [number, number] = [49.953, 82.618]; // Усть-Каменогорск, ВКО
const DEFAULT_ZOOM = 12;

function createClusterIcon(count: number) {
  const size = count < 5 ? 38 : count < 10 ? 44 : 50;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:var(--accent-primary, #B85D3B);color:#141312;font-weight:700;font-size:14px;border:3px solid var(--bg-primary, #FAF6F0);box-shadow:0 6px 16px rgba(0,0,0,0.35);">${count}</div>`,
    className: 'property-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createPinIcon(price: number) {
  const label = `${Math.round(price / 1000)}k ₸`;
  return L.divIcon({
    html: `<div style="padding:3px 9px;border-radius:9999px;background:var(--bg-card, #FAF6F0);color:var(--text-primary, #2C221E);font-weight:700;font-size:12px;border:2px solid var(--accent-primary, #B85D3B);white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.28);">${label}</div>`,
    className: 'property-pin-marker',
    iconSize: [64, 26],
    iconAnchor: [32, 13],
    popupAnchor: [0, -12],
  });
}

function ClusteredMarkers({ properties }: Props) {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(map.getZoom());
  const [bounds, setBounds] = useState<[number, number, number, number]>(() => {
    const b = map.getBounds();
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
  });

  const syncViewport = () => {
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(Math.round(map.getZoom()));
  };

  useEffect(() => {
    syncViewport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, properties]);

  useMapEvents({
    moveend: syncViewport,
    zoomend: syncViewport,
  });

  const { clusters, index } = useMemo(() => {
    const sc = new Supercluster<PointProps>({
      radius: 60,
      maxZoom: 17,
    });

    const points: PointFeature<PointProps>[] = properties
      .filter((p) => Number.isFinite(p.address.lat) && Number.isFinite(p.address.lng))
      .map((p) => ({
        type: 'Feature',
        properties: { cluster: false, property: p },
        geometry: {
          type: 'Point',
          coordinates: [p.address.lng, p.address.lat],
        },
      }));

    sc.load(points);
    return {
      clusters: sc.getClusters(bounds, zoom),
      index: sc,
    };
  }, [properties, bounds, zoom]);

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
              icon={createClusterIcon(count)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(index.getClusterExpansionZoom(clusterId), 18);
                  map.setView([lat, lng], expansionZoom, { animate: true });
                },
              }}
            />
          );
        }

        const property = (feature.properties as PointProps).property;
        return (
          <Marker
            key={`prop-${property.id}`}
            position={[lat, lng]}
            icon={createPinIcon(property.monthlyPrice)}
          >
            <Popup>
              <div className="flex w-64 max-w-xs flex-col overflow-hidden bg-white text-sm text-[#2C221E] dark:bg-[#1D1B19] dark:text-[#F5F3EF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvePropertyImageUrl(property.image_url, property.id)}
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
                  <p className="text-base font-bold text-[#B85D3B] dark:text-[#D4B89C]">
                    {formatPrice(property.monthlyPrice)}{' '}
                    <span className="text-xs font-normal text-[#7A6A5E] dark:text-[#8C8278]">/ мес.</span>
                  </p>
                  <Link
                    href={`/properties/${property.id}`}
                    className="mt-1 inline-block rounded-full bg-[#B85D3B] px-3.5 py-2 text-center text-xs font-semibold uppercase tracking-wider !text-white transition hover:bg-[#9E4B2D] dark:bg-[#B89778] dark:!text-[#141312] dark:hover:bg-[#CAB094]"
                  >
                    Открыть карточку →
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function CatalogMap({ properties }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8DFD3] bg-[#FAF6F0] shadow-[0_4px_24px_rgba(44,34,30,0.04)] transition-colors duration-300 dark:border-white/10 dark:bg-[#1C1A18] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DFD3] bg-[#FAF6F0] px-5 py-3.5 text-xs text-[#6B5B50] dark:border-white/10 dark:bg-[#181614] dark:text-[#A8A096]">
        <span className="font-medium uppercase tracking-wider text-[#2C221E] dark:text-[#F5F3EF]">
          Интерактивная карта объектов (ВКО)
        </span>
        <span>На карте: {properties.length} объ. · Отдаляйте карту для кластеризации</span>
      </div>
      <div className="h-[420px] w-full">
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="z-0 h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClusteredMarkers properties={properties} />
        </MapContainer>
      </div>
    </div>
  );
}
