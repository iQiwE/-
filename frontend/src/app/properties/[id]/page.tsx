import PropertyDetailClient from './PropertyDetailClient';

export function generateStaticParams() {
  return Array.from({ length: 50 }, (_, i) => ({ id: String(i + 1) }));
}

export default function PropertyDetailPage() {
  return <PropertyDetailClient />;
}
