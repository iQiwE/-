'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSessionUser, SessionUser } from '@/lib/auth';
import { useConcierge } from '@/components/concierge/ConciergeChat';

export function Footer() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const { openConcierge } = useConcierge();

  useEffect(() => {
    setUser(getSessionUser());
  }, [pathname]);

  return (
    <footer className="mt-auto border-t border-[#6D3C52]/15 bg-[#2C0107] text-[#FADCD5] transition-colors duration-300 dark:border-gray-800 dark:bg-[#140813] dark:text-[#FADCD5]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        {/* Основная сетка подвала */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Link href="/catalog" className="inline-flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6D3C52] font-serif text-sm font-bold text-[#FADCD5] shadow-md">
                ВКО
              </span>
              <div>
                <span className="block font-serif text-xl font-normal tracking-tight text-[#FADCD5]">
                  Velvet <span className="italic text-[#dcbab3]">Residence</span>
                </span>
                <span className="block text-[11px] uppercase tracking-[0.18em] text-[#B08D87]">
                  ИС Аренды Жилья · ВКО
                </span>
              </div>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-[#DCBAB3]/85">
              Элегантная платформа долгосрочной аренды квартир, студий и резиденций в Усть-Каменогорске и Риддере с
              интерактивной картой, аналитикой цен по районам и автоматическим формированием договоров.
            </p>
          </div>

          <div className="border-l border-white/10 pl-6 dark:border-gray-800">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FADCD5]">Навигация и помощь</h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#DCBAB3]">
              <li>
                <Link href="/catalog" className="transition hover:text-white">
                  Каталог резиденций
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="transition hover:text-white">
                  Избранные объекты
                </Link>
              </li>
              {user?.role === 'LANDLORD' && (
                <li>
                  <Link href="/landlord" className="transition hover:text-white">
                    Кабинет арендодателя
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/faq"
                  data-testid="footer-faq-link"
                  className="font-semibold text-[#FADCD5] transition hover:text-white hover:underline"
                >
                  Частые вопросы (FAQ)
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openConcierge}
                  className="text-left font-semibold text-[#dcbab3] transition hover:text-white hover:underline"
                >
                  Онлайн-чат с консьержем
                </button>
              </li>
              {!user && (
                <>
                  <li>
                    <Link href="/login" className="transition hover:text-white">
                      Вход в систему
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="transition hover:text-white">
                      Регистрация аккаунта
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="border-l border-white/10 pl-6 dark:border-gray-800">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FADCD5]">Контакты</h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#DCBAB3]">
              <li>
                <span className="block text-[11px] uppercase tracking-wider text-[#B08D87]">Локация</span>
                РК, ВКО, г. Усть-Каменогорск, пр-т Назарбаева, 42
              </li>
              <li>
                <span className="block text-[11px] uppercase tracking-wider text-[#B08D87]">Телефон</span>
                <a href="tel:+77232550101" className="transition hover:text-white">
                  +7 (7232) 55-01-01
                </a>
              </li>
              <li>
                <span className="block text-[11px] uppercase tracking-wider text-[#B08D87]">Электронная почта</span>
                <a href="mailto:support@vko-DirectRent.kz" className="transition hover:text-white">
                  support@vko-DirectRent.kz
                </a>
              </li>
              <li>
                <span className="block text-[11px] uppercase tracking-wider text-[#B08D87]">Часы работы</span>
                Ежедневно, 09:00 – 20:00 (GMT+5)
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#B08D87] sm:flex-row dark:border-gray-800">
          <p>© {new Date().getFullYear()} Velvet Residence · ИС Аренды Жилья (РК, ВКО). Все права защищены.</p>
          <p className="text-[11px] uppercase tracking-wider">
            Безопасные сделки · Проверенные собственники · Аналитика цен
          </p>
        </div>
      </div>
    </footer>
  );
}
