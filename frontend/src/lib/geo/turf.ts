import { Property } from '@/types/property';

export type Position = [number, number]; // [longitude, latitude]

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: Position;
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: Position[][];
}

export function point(coordinates: Position): GeoJsonPoint {
  return {
    type: 'Point',
    coordinates,
  };
}

export function polygon(coordinates: Position[][]): GeoJsonPolygon {
  return {
    type: 'Polygon',
    coordinates,
  };
}

/**
 * Проверка нахождения точки на отрезке границы многоугольника.
 */
function isPointOnSegment(pt: Position, a: Position, b: Position): boolean {
  const [px, py] = pt;
  const [ax, ay] = a;
  const [bx, by] = b;

  // Вырожденный отрезок нулевой длины (замыкающая вершина кольца совпадает с первой).
  // Без этой проверки cross и dot равны 0 для ЛЮБОЙ точки, и все объекты в пределах
  // bounding box ошибочно считались «на границе» — т.е. внутри полигона.
  const lenSq = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
  if (lenSq === 0) {
    return px === ax && py === ay;
  }

  const cross = (py - ay) * (bx - ax) - (px - ax) * (by - ay);
  if (Math.abs(cross) > 1e-11) return false;

  const dot = (px - ax) * (bx - ax) + (py - ay) * (by - ay);
  if (dot < 0) return false;

  return dot <= lenSq;
}

/**
 * Алгоритм трассировки луча (Ray-Casting) для одного замкнутого кольца GeoJSON.
 */
function inRing(pt: Position, ring: Position[], ignoreBoundary: boolean): boolean {
  let isInside = false;
  const [px, py] = pt;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    if (isPointOnSegment(pt, ring[i], ring[j])) {
      return !ignoreBoundary;
    }

    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-16) + xi;
    if (intersect) {
      isInside = !isInside;
    }
  }

  return isInside;
}

/**
 * Turf.js-совместимый метод booleanPointInPolygon:
 * Проверяет, попадает ли GeoJSON-точка [longitude, latitude] внутрь GeoJSON-полигона.
 */
export function booleanPointInPolygon(
  ptInput: Position | GeoJsonPoint,
  polyInput: GeoJsonPolygon,
  options?: { ignoreBoundary?: boolean },
): boolean {
  const pt: Position = Array.isArray(ptInput) ? ptInput : ptInput.coordinates;
  const rings = polyInput.coordinates;
  if (!rings || rings.length === 0 || rings[0].length < 3) {
    return false;
  }

  const ignoreBoundary = Boolean(options?.ignoreBoundary);
  const outerRing = rings[0];

  // Быстрая проверка Bounding Box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of outerRing) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (pt[0] < minX || pt[0] > maxX || pt[1] < minY || pt[1] > maxY) {
    return false;
  }

  if (!inRing(pt, outerRing, ignoreBoundary)) {
    return false;
  }

  // Исключаем попадание во внутренние вырезы (holes), если они есть
  for (let k = 1; k < rings.length; k++) {
    if (inRing(pt, rings[k], !ignoreBoundary)) {
      return false;
    }
  }

  return true;
}

/**
 * Преобразует массив вершин Leaflet ([lat, lng][]) в замкнутый GeoJSON Polygon
 * и проверяет координаты объекта недвижимости (latitude, longitude) через booleanPointInPolygon.
 */
export function isPropertyInPolygon(property: Property, latLngVertices: [number, number][]): boolean {
  if (!latLngVertices || latLngVertices.length < 3) return true;

  const rawLat = property.latitude ?? property.address?.lat;
  const rawLng = property.longitude ?? property.address?.lng;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  const ring: Position[] = latLngVertices.map(([vLat, vLng]) => [vLng, vLat]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  return booleanPointInPolygon(point([lng, lat]), polygon([ring]));
}
