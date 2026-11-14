'use client';

import { useState } from 'react';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  tag?: string;
}

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    id: 'draw-area',
    tag: 'Интерактивная карта',
    question: 'Как искать квартиры по области?',
    answer:
      'Перейдите к интерактивной карте внизу каталога или откройте режим «На карте», нажмите кнопку «Нарисовать область» в правом верхнем углу и обведите нужный квартал пальцем или мышкой. После замыкания линии на карте и в каталоге останутся только объекты внутри вашего контура. Чтобы вернуть все объявления, нажмите плавающую кнопку «Сбросить область» поверх карты.',
  },
  {
    id: 'below-market',
    tag: 'Аналитика цен',
    question: 'Что значит бейдж «Ниже рынка»?',
    answer:
      'Алгоритм Velvet Residence в реальном времени сравнивает стоимость каждой квартиры со средней ставкой аренды в том же районе Усть-Каменогорска или Риддера. Если предложение выгоднее среднерыночного уровня по району, карточка помечается бейджем «Ниже рынка» / «Выгодно» и попадает в специальную подборку «Успейте снять».',
  },
  {
    id: 'rent-out',
    tag: 'Собственникам',
    question: 'Как сдать свою недвижимость?',
    answer:
      'Войдите или зарегистрируйтесь с ролью «Арендодатель» (LANDLORD) и откройте «Кабинет арендодателя». Заполните адрес, комнатность, площадь и арендную ставку, отметьте дом на интерактивной карте ВКО и прикрепите фотографии. После публикации объект мгновенно появится в каталоге, а все входящие заявки от арендаторов будут отображаться в вашем кабинете.',
  },
  {
    id: 'application-contract',
    tag: 'Бронирование и договор',
    question: 'Как оставить заявку и оформить договор долгосрочной аренды?',
    answer:
      'На странице выбранной квартиры укажите желаемую дату заезда, срок аренды (в месяцах) и комментарий для собственника. Как только арендодатель одобрит вашу заявку в личном кабинете, платформа автоматически сформирует договор аренды и прозрачный помесячный график платежей.',
  },
  {
    id: 'owner-no-deposit',
    tag: 'Условия аренды',
    question: 'Как найти квартиру от хозяина, без залога или с питомцами?',
    answer:
      'Используйте панель быстрых фильтров в верхней части каталога: кнопки «От хозяина», «Без залога», «До 200 000 ₸» и «С питомцами» мгновенно отбирают подходящие резиденции без перезагрузки страницы и синхронизируют выдачу с интерактивной картой.',
  },
];

interface FaqSectionProps {
  items?: FaqItem[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

/**
 * Презентационный (Dumb/UI) компонент секции вопросов и ответов (FAQ)
 * с плавным раскрытием аккордеона через transition-all и анимированным поворотом иконки.
 */
export function FaqSection({
  items = DEFAULT_FAQ_ITEMS,
  title = 'Частые вопросы',
  subtitle = 'Всё, что нужно знать о поиске по карте, аналитике цен и безопасной аренде жилья в ВКО',
  compact = false,
}: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className={`scroll-mt-20 ${compact ? 'py-6 md:py-10' : 'py-8 md:py-14'}`}
    >
      <div className="mx-auto max-w-7xl px-3.5 md:px-8">
        <div className="rounded-3xl border border-[#6D3C52]/12 bg-[#FADCD5]/30 p-4 shadow-[0_12px_36px_rgba(44,1,7,0.05)] transition-colors duration-300 sm:p-7 md:p-10 dark:border-gray-800 dark:bg-[#241423]/90 dark:shadow-[0_16px_44px_rgba(11,4,11,0.45)]">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:mb-7 md:flex-row md:items-end">
            <div>
              <span className="inline-block rounded-full bg-[#FADCD5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
                Справочник сервиса · FAQ
              </span>
              <h2
                id="faq-heading"
                className="mt-2 font-serif text-xl font-normal tracking-tight text-[#2C0107] sm:text-3xl dark:text-[#FADCD5]"
              >
                {title} · <span className="italic text-[#C42759] dark:text-[#dcbab3]">ответы</span>
              </h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[#5A2D36] sm:text-sm dark:text-[#DCBAB3]">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:gap-3">
            {items.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  data-faq-item={item.id}
                  className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isOpen
                      ? 'border-[#C42759]/30 bg-white shadow-[0_10px_28px_rgba(44,1,7,0.07)] dark:border-gray-700 dark:bg-[#2D222F] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
                      : 'border-[#6D3C52]/12 bg-[#FDF5F3]/90 hover:border-[#C42759]/25 hover:bg-white/95 dark:border-gray-800 dark:bg-[#1B0C1A]/75 dark:hover:border-gray-700 dark:hover:bg-[#2D222F]/70'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${item.id}`}
                    className="flex w-full items-center justify-between gap-3.5 px-4 py-3.5 text-left transition-colors sm:px-6 sm:py-4"
                  >
                    <div className="min-w-0 flex-1">
                      {item.tag && (
                        <span className="mb-1 inline-block rounded-full bg-[#FADCD5]/75 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#550416] dark:bg-[#6D3C52]/65 dark:text-[#FADCD5]">
                          {item.tag}
                        </span>
                      )}
                      <p className="text-sm font-semibold leading-snug text-[#2C0107] sm:text-base dark:text-[#FADCD5]">
                        {item.question}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 sm:h-9 sm:w-9 ${
                        isOpen
                          ? 'rotate-45 border-[#C42759] bg-[#C42759] text-white shadow-xs dark:border-[#6D3C52] dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                          : 'rotate-0 border-[#6D3C52]/15 bg-[#FADCD5]/55 text-[#550416] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]'
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </span>
                  </button>

                  <div
                    id={`faq-panel-${item.id}`}
                    role="region"
                    aria-hidden={!isOpen}
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] max-h-96 opacity-100' : 'grid-rows-[0fr] max-h-0 opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-[#6D3C52]/10 px-4 pt-3 pb-4 text-xs leading-relaxed text-[#5A2D36] sm:px-6 sm:pb-5 sm:text-sm dark:border-gray-800 dark:text-[#DCBAB3]">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
