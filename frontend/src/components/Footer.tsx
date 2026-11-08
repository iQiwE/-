import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E6DDD2] dark:border-white/10">
      {/* Редакционный блок обратной связи (Editorial CTA) */}
      <section className="border-b border-[#E6DDD2] bg-[#F3ECE2] text-[#2C221E] transition-colors duration-300 dark:border-white/10 dark:bg-[#191715] dark:text-[#F5F3EF]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-6 py-16 md:flex-row md:items-center lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] font-medium uppercase tracking-[0.22em] text-[#B85D3B] dark:text-[#B89778]">
              Персональный консьерж · Восточный Казахстан
            </span>
            <h2 className="mt-3 font-serif text-3xl font-normal tracking-tight text-[#2C221E] sm:text-4xl lg:text-[42px] dark:text-[#F5F3EF]">
              Обретите покой и найдите свой{' '}
              <span className="italic text-[#B85D3B] dark:text-[#B89778]">идеальный дом.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#6B5B50] dark:text-[#A8A096]">
              Поможем подобрать резиденцию в Усть-Каменогорске или Риддере, оформить безопасный долгосрочный договор
              аренды с прозрачным графиком платежей или представить вашу недвижимость в каталоге.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="tel:+77232550101"
              className="rounded-full bg-[#B85D3B] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#9E4B2D] dark:bg-[#B89778] dark:text-[#141312] dark:hover:bg-[#CAB094]"
            >
              +7 (7232) 55-01-01
            </a>
            <a
              href="mailto:support@vko-DirectRent.kz"
              className="rounded-full border border-[#C9B9A6] bg-transparent px-7 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#2C221E] transition hover:border-[#B85D3B] hover:text-[#B85D3B] dark:border-white/20 dark:text-[#F5F3EF] dark:hover:border-[#B89778] dark:hover:text-[#D4B89C]"
            >
              Написать нам
            </a>
          </div>
        </div>
      </section>

      {/* Глубокий монохромный подвал */}
      <div className="bg-[#1B1613] text-[#E5DDD3] dark:bg-[#0E0D0C] dark:text-[#D8D0C5]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            {/* О системе и логотип */}
            <div className="flex flex-col gap-5">
              <Link href="/catalog" className="inline-flex items-center gap-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#B89778]/40 bg-[#B89778] font-serif text-sm font-bold text-[#141312]">
                  ВКО
                </span>
                <div>
                  <span className="block font-serif text-xl font-normal tracking-tight text-[#FAF6F0]">
                    Serenity <span className="italic text-[#B89778]">Residence</span>
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[#8E8377]">
                    ИС Аренды Жилья · ВКО
                  </span>
                </div>
              </Link>
              <p className="max-w-md text-sm leading-relaxed text-[#9C9186]">
                Кураторская платформа долгосрочной аренды квартир, студий и резиденций в Усть-Каменогорске и Риддере с
                интерактивной картой, аналитикой цен по районам и автоматическим формированием договоров.
              </p>
            </div>

            {/* Навигация */}
            <div className="border-l border-white/10 pl-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B89778]">Навигация</h3>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-[#B8AEA2]">
                <li>
                  <Link href="/catalog" className="transition hover:text-[#F5F3EF]">
                    Каталог резиденций
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="transition hover:text-[#F5F3EF]">
                    Избранные объекты
                  </Link>
                </li>
                <li>
                  <Link href="/landlord" className="transition hover:text-[#F5F3EF]">
                    Кабинет арендодателя
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="transition hover:text-[#F5F3EF]">
                    Вход в систему
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition hover:text-[#F5F3EF]">
                    Регистрация аккаунта
                  </Link>
                </li>
              </ul>
            </div>

            {/* Контакты */}
            <div className="border-l border-white/10 pl-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B89778]">Контакты</h3>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-[#B8AEA2]">
                <li>
                  <span className="block text-[11px] uppercase tracking-wider text-[#7A7067]">Локация</span>
                  РК, ВКО, г. Усть-Каменогорск, пр-т Назарбаева, 42
                </li>
                <li>
                  <span className="block text-[11px] uppercase tracking-wider text-[#7A7067]">Телефон</span>
                  <a href="tel:+77232550101" className="transition hover:text-[#F5F3EF]">
                    +7 (7232) 55-01-01
                  </a>
                </li>
                <li>
                  <span className="block text-[11px] uppercase tracking-wider text-[#7A7067]">Электронная почта</span>
                  <a href="mailto:support@vko-DirectRent.kz" className="transition hover:text-[#F5F3EF]">
                    support@vko-DirectRent.kz
                  </a>
                </li>
                <li>
                  <span className="block text-[11px] uppercase tracking-wider text-[#7A7067]">Часы работы</span>
                  Ежедневно, 09:00 – 20:00 (GMT+5)
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#7A7067] sm:flex-row">
            <p>© {new Date().getFullYear()} Serenity Residence · ИС Аренды Жилья (РК, ВКО). Все права защищены.</p>
            <p className="tracking-wider uppercase text-[11px]">
              Безопасные сделки · Проверенные собственники · Аналитика цен
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
