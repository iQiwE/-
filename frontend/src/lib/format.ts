const kzt = new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 });

export const formatPrice = (value: number) => kzt.format(value);

export const formatAddress = (a: { street: string; building: string; apartment: string | null }) =>
  `${a.street}, д. ${a.building}${a.apartment ? `, кв. ${a.apartment}` : ''}`;

