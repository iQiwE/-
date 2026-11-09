import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#6D3C52]/15 transition-colors duration-300 dark:border-[#FADCD5]/12">
      {/* Элегантный винно-пудровый блок обратной связи */}
      <section className="border-b border-[#6D3C52]/15 bg-[#FADCD5]/45 text-[#2C0107] transition-colors duration-300 dark:border-[#FADCD5]/12 dark:bg-[#2D222F]/70 dark:text-[#FADCD5]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-12 md:flex-row md:items-center md:gap-10 md:px-8 md:py-16 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-[#FADCD5] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#550416] sm:px-4 sm:text-[11px] sm:tracking-[0.2em] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
              Персональный консьерж · Восточный Казахстан
            </span>
            <h2 className="mt-4 font-serif text-2xl font-normal tracking-tight text-[#2C0107] sm:text-4xl lg:text-[42px] dark:text-[#FADCD5]">
              Обретите гармонию и найдите свой{' '}
              <span className="italic text-[#C42759] dark:text-[#dcbab3]">идеальный дом.</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5A2D36] sm:mt-4 dark:text-[#DCBAB3]">
              Поможем подобрать уютную резиденцию в Усть-Каменогорске или Риддере, оформить безопасный долгосрочный
              договор аренды с прозрачным графиком платежей или представить вашу недвижимость в каталоге.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <a
              href="tel:+77232550101"
              className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#C42759] px-7 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_25px_rgba(196,39,89,0.28)] transition-all duration-300 hover:bg-[#550416] sm:w-auto dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] dark:hover:bg-[#4B2138]"
            >
              +7 (7232) 55-01-01
            </a>
            <a
              href="mailto:support@vko-DirectRent.kz"
              className="flex min-h-11 w-full items-center justify-center rounded-full border border-[#6D3C52]/30 bg-white/80 px-7 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#2C0107] shadow-2xs transition-all duration-300 hover:border-[#C42759] hover:text-[#C42759] sm:w-auto dark:border-[#FADCD5]/25 dark:bg-[#1B0C1A]/60 dark:text-[#FADCD5] dark:hover:border-[#FADCD5] dark:hover:bg-[#4B2138]"
            >
              Написать нам
            </a>
          </div>
        </div>
      </section>

      {/* Нижняя часть подвала в глубоких винно-сливовых тонах */}
      <div className="bg-[#2C0107] text-[#FADCD5] transition-colors duration-300 dark:bg-[#140813] dark:text-[#FADCD5]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16 lg:py-20">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            <div className="flex flex-col gap-5">
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

            <div className="border-l border-[#FADCD5]/15 pl-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FADCD5]">Навигация</h3>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-[#DCBAB3]">
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
                <li>
                  <Link href="/landlord" className="transition hover:text-white">
                    Кабинет арендодателя
                  </Link>
                </li>
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
              </ul>
            </div>

            <div className="border-l border-[#FADCD5]/15 pl-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FADCD5]">Контакты</h3>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-[#DCBAB3]">
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

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#FADCD5]/15 pt-8 text-xs text-[#B08D87] sm:flex-row">
            <p>© {new Date().getFullYear()} Velvet Residence · ИС Аренды Жилья (РК, ВКО). Все права защищены.</p>
            <p className="text-[11px] uppercase tracking-wider">
              Безопасные сделки · Проверенные собственники · Аналитика цен
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
