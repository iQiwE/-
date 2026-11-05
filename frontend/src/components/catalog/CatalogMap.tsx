'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import Supercluster, { PointFeature } from 'supercluster';
import { formatAddress, formatPrice } from '@/lib/format';
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
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#1d4ed8;color:#fff;font-weight:700;font-size:14px;border:3px solid #bfdbfe;box-shadow:0 4px 10px rgba(0,0,0,0.25);">${count}</div>`,
    className: 'property-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createPinIcon(price: number) {
  const label = `${Math.round(price / 1000)}k ₸`;
  return L.divIcon({
    html: `<div style="padding:3px 8px;border-radius:9999px;background:#ffffff;color:#111827;font-weight:700;font-size:12px;border:2px solid #2563eb;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${label}</div>`,
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
              <div className="flex min-w-[210px] flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium text-blue-700">
                  {property.type.name} · {property.rooms}-комн. · {property.area} м²
                </span>
                <p className="font-semibold text-gray-900">{property.title}</p>
                <p className="text-xs text-gray-600">
                  {property.address.city}, {property.address.district}, {formatAddress(property.address)}
                </p>
                <p className="text-base font-bold text-blue-600">
                  {formatPrice(property.monthlyPrice)}{' '}
                  <span className="text-xs font-normal text-gray-500">/ мес.</span>
                </p>
                <Link
                  href={`/properties/${property.id}`}
                  className="mt-1 inline-block rounded-md bg-blue-600 px-3 py-1.5 text-center text-xs font-medium !text-white hover:bg-blue-700"
                >
                  Открыть карточку →
                </Link>
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs text-gray-600">
        <span className="font-semibold text-gray-800">Интерактивная карта объектов (ВКО)</span>
        <span>На карте: {properties.length} объ. · Отдаляйте карту для кластеризации</span>
      </div>
      <div className="h-[420px] w-full">
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full z-0">
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
