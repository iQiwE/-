import Link from 'next/link';
import { memo } from 'react';
import { formatAddress, formatPrice } from '@/lib/format';
import { Property } from '@/types/property';

interface Props {
  property: Property;
}

/** Карточка объекта в каталоге. Компонент только отображает данные, без логики. */
function PropertyCardBase({ property }: Props) {
  const { id, title, rooms, area, monthlyPrice, type, address } = property;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-lg">
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
        <span className="text-4xl" aria-hidden>
          🏠
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700">
          {type.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xl font-bold text-gray-900">
          {formatPrice(monthlyPrice)}
          <span className="text-sm font-normal text-gray-500"> / мес.</span>
        </p>

        <h3 className="line-clamp-2 font-semibold text-gray-800 group-hover:text-blue-600">{title}</h3>

        <p className="text-sm text-gray-600">
          {rooms}-комн. · {area} м²
        </p>

        <p className="text-sm text-gray-500">
<<<<<<< Updated upstream
          <span className="font-medium text-gray-700">{address.city}, {address.district}</span> · {formatAddress(address)}
=======
          <span className="font-medium text-gray-700">{address.district}</span> · {formatAddress(address)}
>>>>>>> Stashed changes
        </p>

        <Link
          href={`/properties/${id}`}
          className="mt-auto rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Подробнее и заявка
        </Link>
      </div>
    </article>
  );
}

export const PropertyCard = memo(PropertyCardBase);

