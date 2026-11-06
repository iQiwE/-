import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto">
      {/* Акцентный блок CTA на терракотовом фоне */}
      <section className="bg-[#B85D3B] text-[#FAF6F0]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-14 md:flex-row md:items-center lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-white/15 px-3.5 py-1 text-xs font-medium tracking-wide uppercase text-[#FAF6F0]">
              Поддержка и консультации · ВКО
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Остались вопросы? Свяжитесь с нами
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#F5E6DF]">
              Поможем подобрать уютную квартиру в Усть-Каменогорске или Риддере, оформить безопасный долгосрочный
              договор аренды или разместить вашу недвижимость в каталоге.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="tel:+77232550101"
              className="rounded-xl bg-[#FAF6F0] px-6 py-3.5 text-sm font-semibold text-[#2C221E] shadow-xs transition hover:bg-white"
            >
              Позвонить: +7 (7232) 55-01-01
            </a>
            <a
              href="mailto:support@vko-DirectRent.kz"
              className="rounded-xl border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              Написать на почту
            </a>
          </div>
        </div>
      </section>

      {/* Основной подвал на насыщенном темно-коричневом фоне */}
      <div className="bg-[#231A16] text-[#EDE3D8]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            {/* О системе и логотип */}
            <div className="flex flex-col gap-4">
              <Link href="/catalog" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B85D3B] font-serif text-lg font-bold text-white">
                  ВКО
                </span>
                <div>
                  <span className="block font-serif text-xl font-semibold tracking-tight text-[#FAF6F0]">
                    ИС Аренды Жилья
                  </span>
                  <span className="block text-xs text-[#A89688]">
                    Долгосрочная аренда недвижимости · Восточный Казахстан
                  </span>
                </div>
              </Link>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-[#B8A79A]">
                Единая платформа для прозрачной аренды квартир, студий и апартаментов в Усть-Каменогорске и Риддере с
                интерактивной картой, аналитикой цен по районам и электронным графиком платежей.
              </p>
            </div>

            {/* Навигация */}
            <div>
              <h3 className="font-serif text-base font-semibold tracking-wide text-[#FAF6F0]">Навигация</h3>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#C7B8AC]">
                <li>
                  <Link href="/catalog" className="transition hover:text-[#E28563]">
                    Каталог недвижимости
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="transition hover:text-[#E28563]">
                    Избранные объекты
                  </Link>
                </li>
                <li>
                  <Link href="/landlord" className="transition hover:text-[#E28563]">
                    Личный кабинет арендодателя
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="transition hover:text-[#E28563]">
                    Вход в систему
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition hover:text-[#E28563]">
                    Регистрация аккаунта
                  </Link>
                </li>
              </ul>
            </div>

            {/* Контакты */}
            <div>
              <h3 className="font-serif text-base font-semibold tracking-wide text-[#FAF6F0]">Контакты</h3>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#C7B8AC]">
                <li>
                  <span className="text-[#8E7D70]">Адрес:</span> РК, ВКО, г. Усть-Каменогорск, пр-т Назарбаева, 42
                </li>
                <li>
                  <span className="text-[#8E7D70]">Телефон:</span>{' '}
                  <a href="tel:+77232550101" className="transition hover:text-[#E28563]">
                    +7 (7232) 55-01-01
                  </a>
                </li>
                <li>
                  <span className="text-[#8E7D70]">Email:</span>{' '}
                  <a href="mailto:support@vko-DirectRent.kz" className="transition hover:text-[#E28563]">
                    support@vko-DirectRent.kz
                  </a>
                </li>
                <li>
                  <span className="text-[#8E7D70]">Режим работы:</span> Ежедневно, 09:00 – 20:00 (GMT+5)
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#382B25] pt-8 text-xs text-[#8E7D70] sm:flex-row">
            <p>© {new Date().getFullYear()} ИС Аренды Жилья (РК, ВКО). Все права защищены.</p>
            <p>Безопасные сделки · Проверенные собственники · Аналитика цен</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

