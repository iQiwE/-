import { useEffect, useState } from 'react';

/** Возвращает значение с задержкой: не отправляет запрос на каждое нажатие клавиши. */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

