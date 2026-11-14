'use client';

import {
  createContext,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  TouchEvent as ReactTouchEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface ConciergeMessage {
  id: string;
  sender: 'concierge' | 'user';
  text: string;
  time: string;
}

export type SheetSnapPoint = 'half' | 'full';

interface ConciergeContextValue {
  isOpen: boolean;
  openConcierge: () => void;
  closeConcierge: () => void;
  toggleConcierge: () => void;
  messages: ConciergeMessage[];
  sendMessage: (text: string) => void;
  isTyping: boolean;
}

const ConciergeContext = createContext<ConciergeContextValue | null>(null);

function formatCurrentTime(): string {
  try {
    return new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '12:00';
  }
}

const INITIAL_MESSAGES: ConciergeMessage[] = [
  {
    id: 'welcome-1',
    sender: 'concierge',
    text: 'Добро пожаловать в Velvet Residence! Я ваш персональный консьерж по долгосрочной аренде в Усть-Каменогорске и Риддере. Чем могу помочь?',
    time: 'Сейчас',
  },
];

const QUICK_PROMPTS = [
  'Подобрать квартиру в Усть-Каменогорске',
  'Вопрос по договору аренды',
  'Как забронировать просмотр?',
];

/** Доля высоты экрана для точек прилипания (Snap Points) на мобильных */
const SNAP_HALF_RATIO = 0.58;
const SNAP_FULL_RATIO = 0.94;

export function ConciergeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ConciergeMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openConcierge = useCallback(() => setIsOpen(true), []);
  const closeConcierge = useCallback(() => setIsOpen(false), []);
  const toggleConcierge = useCallback(() => setIsOpen((prev) => !prev), []);

  const sendMessage = useCallback((rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const userMsg: ConciergeMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: formatCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const replyMsg: ConciergeMessage = {
        id: `concierge-${Date.now()}`,
        sender: 'concierge',
        text: 'Здравствуйте! Специалист скоро подключится... Мы уже проверяем актуальные резиденции по вашему запросу.',
        time: formatCurrentTime(),
      };
      setMessages((prev) => [...prev, replyMsg]);
      setIsTyping(false);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ConciergeContext.Provider
      value={{
        isOpen,
        openConcierge,
        closeConcierge,
        toggleConcierge,
        messages,
        sendMessage,
        isTyping,
      }}
    >
      {children}
      <ConciergeChatModal />
    </ConciergeContext.Provider>
  );
}

export function useConcierge(): ConciergeContextValue {
  const ctx = useContext(ConciergeContext);
  if (!ctx) {
    throw new Error('useConcierge must be used within a ConciergeProvider');
  }
  return ctx;
}

function ConciergeChatModal() {
  const { isOpen, closeConcierge, messages, sendMessage, isTyping } = useConcierge();
  const [inputValue, setInputValue] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(800);

  // Состояние Bottom Sheet (Snap Points & Drag Physics)
  const [snapPoint, setSnapPoint] = useState<SheetSnapPoint>('half');
  const [isDragging, setIsDragging] = useState(false);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [isClosingAnim, setIsClosingAnim] = useState(false);

  const messagesListRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Рефы для отслеживания физического жеста (Touch / Pointer)
  const dragStateRef = useRef<{
    active: boolean;
    source: 'header' | 'messages';
    startY: number;
    lastY: number;
    startTime: number;
    startSnap: SheetSnapPoint;
    capturedFromScroll: boolean;
  }>({
    active: false,
    source: 'header',
    startY: 0,
    lastY: 0,
    startTime: 0,
    startSnap: 'half',
    capturedFromScroll: false,
  });

  // Определение мобильного вьюпорта и высоты окна
  useEffect(() => {
    function updateViewport() {
      const w = window.innerWidth;
      const h = window.visualViewport?.height || window.innerHeight;
      setIsMobile(w < 768);
      setViewportHeight(h);
    }
    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
    };
  }, []);

  // Сброс позиции шторки при открытии и блокировка скролла фона (Scroll Lock)
  useEffect(() => {
    if (!isOpen) {
      setIsClosingAnim(false);
      setIsDragging(false);
      setDragDeltaY(0);
      return;
    }

    setSnapPoint('half');
    setIsClosingAnim(false);
    setIsDragging(false);
    setDragDeltaY(0);

    // Блокируем прокрутку body/html на мобильных устройствах, чтобы фон не скроллился под шторкой
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const prevBodyOverflow = bodyEl.style.overflow;
    const prevBodyOverscroll = bodyEl.style.overscrollBehavior;
    const prevHtmlOverflow = htmlEl.style.overflow;
    const prevHtmlOverscroll = htmlEl.style.overscrollBehavior;

    bodyEl.style.overflow = 'hidden';
    bodyEl.style.overscrollBehavior = 'none';
    htmlEl.style.overflow = 'hidden';
    htmlEl.style.overscrollBehavior = 'none';
    bodyEl.classList.add('overflow-hidden');

    return () => {
      bodyEl.style.overflow = prevBodyOverflow;
      bodyEl.style.overscrollBehavior = prevBodyOverscroll;
      htmlEl.style.overflow = prevHtmlOverflow;
      htmlEl.style.overscrollBehavior = prevHtmlOverscroll;
      bodyEl.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // На ПК фокусируем инпут сразу, на мобильном не вызываем клавиатуру при открытии шторки
      if (window.innerWidth >= 768) {
        const focusTimer = setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
        return () => clearTimeout(focusTimer);
      }
    }
  }, [isOpen, messages, isTyping]);

  // Плавное закрытие шторки со свайпом вниз
  const triggerSmoothClose = useCallback(() => {
    if (!isMobile) {
      closeConcierge();
      return;
    }
    setIsDragging(false);
    setIsClosingAnim(true);
    setTimeout(() => {
      closeConcierge();
      setIsClosingAnim(false);
      setDragDeltaY(0);
    }, 260);
  }, [closeConcierge, isMobile]);

  // Завершение жеста и выбор точки прилипания (Snap Point: full / half / closed)
  const finishDragGesture = useCallback(
    (deltaY: number, durationMs: number, startSnap: SheetSnapPoint) => {
      const velocityY = deltaY / Math.max(durationMs, 16); // px/ms (> 0 — движение вниз, < 0 — вверх)
      const halfPx = viewportHeight * SNAP_HALF_RATIO;
      const fullPx = viewportHeight * SNAP_FULL_RATIO;
      const startHeight = startSnap === 'full' ? fullPx : halfPx;
      const projectedHeight = startHeight - deltaY;

      setIsDragging(false);
      setDragDeltaY(0);

      if (startSnap === 'half') {
        // Свайп вверх из half -> раскрываем на весь экран (full)
        if (deltaY < -50 || velocityY < -0.35) {
          setSnapPoint('full');
          return;
        }
        // Свайп вниз из half -> закрываем чат
        if (deltaY > 85 || velocityY > 0.4) {
          triggerSmoothClose();
          return;
        }
        setSnapPoint('half');
      } else {
        // Из состояния full:
        // Если резко смахнули вниз или утянули значительно ниже half -> сразу закрываем
        if (projectedHeight < halfPx - 95 || velocityY > 0.95) {
          triggerSmoothClose();
          return;
        }
        // Если потянули вниз умеренно -> переводим в среднее состояние (half, 58%)
        if (deltaY > 60 || velocityY > 0.3) {
          setSnapPoint('half');
          return;
        }
        setSnapPoint('full');
      }
    },
    [triggerSmoothClose, viewportHeight],
  );

  // Обработчики Touch на шапке и ручке (Drag Handle)
  function handleHeaderTouchStart(e: ReactTouchEvent<HTMLDivElement>) {
    if (!isMobile || e.touches.length !== 1) return;
    const y = e.touches[0].clientY;
    dragStateRef.current = {
      active: true,
      source: 'header',
      startY: y,
      lastY: y,
      startTime: Date.now(),
      startSnap: snapPoint,
      capturedFromScroll: true,
    };
    setIsDragging(true);
    setDragDeltaY(0);
  }

  function handleHeaderTouchMove(e: ReactTouchEvent<HTMLDivElement>) {
    if (!dragStateRef.current.active || dragStateRef.current.source !== 'header') return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    const y = e.touches[0].clientY;
    dragStateRef.current.lastY = y;
    setDragDeltaY(y - dragStateRef.current.startY);
  }

  function handleHeaderTouchEnd() {
    if (!dragStateRef.current.active || dragStateRef.current.source !== 'header') return;
    const { startY, lastY, startTime, startSnap } = dragStateRef.current;
    dragStateRef.current.active = false;
    finishDragGesture(lastY - startY, Date.now() - startTime, startSnap);
  }

  // Поддержка Pointer Events (для тестирования мышкой в мобильном превью DevTools и гибридных экранов)
  function handleHeaderPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isMobile || e.pointerType === 'touch') return;
    // Не перехватываем клик по кнопке закрытия
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      source: 'header',
      startY: e.clientY,
      lastY: e.clientY,
      startTime: Date.now(),
      startSnap: snapPoint,
      capturedFromScroll: true,
    };
    setIsDragging(true);
    setDragDeltaY(0);
  }

  function handleHeaderPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current.active || dragStateRef.current.source !== 'header' || e.pointerType === 'touch') return;
    e.preventDefault();
    dragStateRef.current.lastY = e.clientY;
    setDragDeltaY(e.clientY - dragStateRef.current.startY);
  }

  function handleHeaderPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current.active || dragStateRef.current.source !== 'header' || e.pointerType === 'touch') return;
    const { startY, lastY, startTime, startSnap } = dragStateRef.current;
    dragStateRef.current.active = false;
    finishDragGesture(lastY - startY, Date.now() - startTime, startSnap);
  }

  // Обработчики Touch на списке сообщений:
  // скроллят переписку, но если scrollTop === 0 и пользователь тянет вниз — передают жест шторке!
  function handleMessagesTouchStart(e: ReactTouchEvent<HTMLDivElement>) {
    if (!isMobile || e.touches.length !== 1) return;
    const y = e.touches[0].clientY;
    dragStateRef.current = {
      active: true,
      source: 'messages',
      startY: y,
      lastY: y,
      startTime: Date.now(),
      startSnap: snapPoint,
      capturedFromScroll: false,
    };
  }

  function handleMessagesTouchMove(e: ReactTouchEvent<HTMLDivElement>) {
    if (!dragStateRef.current.active || dragStateRef.current.source !== 'messages') return;
    const listEl = messagesListRef.current;
    if (!listEl) return;

    const currentY = e.touches[0].clientY;
    const rawDeltaY = currentY - dragStateRef.current.startY;

    if (!dragStateRef.current.capturedFromScroll) {
      // Если список прокручен до самого верха (scrollTop <= 0) и палец тянет вниз
      if (listEl.scrollTop <= 0 && rawDeltaY > 6) {
        dragStateRef.current.capturedFromScroll = true;
        dragStateRef.current.startY = currentY;
        dragStateRef.current.startTime = Date.now();
        dragStateRef.current.startSnap = snapPoint;
        setIsDragging(true);
        setDragDeltaY(0);
      } else {
        // Обычный скролл сообщений внутри контейнера — останавливаем всплытие к фону
        e.stopPropagation();
        return;
      }
    }

    // Жест перехвачен шторкой (Pull-to-shrink / Pull-to-dismiss)
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    dragStateRef.current.lastY = currentY;
    const sheetDeltaY = Math.max(0, currentY - dragStateRef.current.startY);
    setDragDeltaY(sheetDeltaY);
  }

  function handleMessagesTouchEnd() {
    if (!dragStateRef.current.active || dragStateRef.current.source !== 'messages') return;
    const { capturedFromScroll, startY, lastY, startTime, startSnap } = dragStateRef.current;
    dragStateRef.current.active = false;

    if (capturedFromScroll) {
      finishDragGesture(Math.max(0, lastY - startY), Date.now() - startTime, startSnap);
    }
  }

  if (!isOpen) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  }

  // Вычисление динамической высоты и смещения (translateY) для мобильной шторки
  const halfHeightPx = Math.round(viewportHeight * SNAP_HALF_RATIO);
  const fullHeightPx = Math.round(viewportHeight * SNAP_FULL_RATIO);
  const baseHeightPx = snapPoint === 'full' ? fullHeightPx : halfHeightPx;

  let currentMobileHeightPx = baseHeightPx;
  let currentTranslateYPx = 0;

  if (isMobile) {
    if (isClosingAnim) {
      currentMobileHeightPx = halfHeightPx;
      currentTranslateYPx = halfHeightPx + 60;
    } else if (isDragging) {
      const rawTargetHeight = baseHeightPx - dragDeltaY;
      if (rawTargetHeight >= halfHeightPx) {
        // Растягивание/сжатие между 58% и 96% высоты экрана
        const maxStretchPx = Math.round(viewportHeight * 0.96);
        currentMobileHeightPx = Math.min(maxStretchPx, rawTargetHeight);
        currentTranslateYPx = 0;
      } else {
        // Ниже 58% — фиксируем высоту шторки и плавно уводим её вниз за экран (translateY)
        currentMobileHeightPx = halfHeightPx;
        currentTranslateYPx = halfHeightPx - rawTargetHeight;
      }
    }
  }

  const mobileSheetStyle = isMobile
    ? {
        height: `${currentMobileHeightPx}px`,
        maxHeight: '96dvh',
        transform: `translate3d(0, ${ Math.max(0, currentTranslateYPx) }px, 0)`,
        transition: isDragging
          ? 'none'
          : 'height 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      }
    : undefined;

  return (
    <>
      {/* Затемнение фона на мобильных устройствах (Bottom Sheet backdrop с блокировкой touchmove) */}
      <div
        onClick={triggerSmoothClose}
        onTouchMove={(e) => {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
        }}
        aria-hidden="true"
        data-testid="concierge-backdrop"
        className={`fixed inset-0 z-[60] bg-[#1B0C1A]/65 backdrop-blur-xs transition-opacity duration-300 touch-none md:hidden ${
          isClosingAnim ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Контейнер чата: интерактивный Bottom Sheet на мобильных, плавающее окно на ПК */}
      <section
        role="dialog"
        aria-label="Чат с персональным консьержем"
        data-testid="concierge-chat-window"
        data-snap-point={isMobile ? snapPoint : 'desktop'}
        style={mobileSheetStyle}
        className="fixed inset-x-0 bottom-0 z-[60] flex w-full flex-col overflow-hidden rounded-t-[2rem] border-t border-[#6D3C52]/15 bg-[#FDF5F3] shadow-[0_-18px_50px_rgba(44,1,7,0.28)] overscroll-contain md:inset-x-auto md:bottom-6 md:right-6 md:h-[560px] md:max-h-[600px] md:w-[395px] md:rounded-[2rem] md:border md:shadow-[0_24px_60px_rgba(44,1,7,0.25)] dark:border-gray-800 dark:bg-[#241423] dark:shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
      >
        {/* Зона захвата жестов (Drag Handle + Шапка чата) */}
        <div
          data-testid="concierge-drag-header"
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
          onTouchCancel={handleHeaderTouchEnd}
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
          onPointerCancel={handleHeaderPointerUp}
          className=" shrink-0 select-none touch-none bg-gradient-to-r from-[#2C0107] via-[#550416] to-[#6D3C52] text-[#FADCD5] md:touch-auto dark:from-[#1B0C1A] dark:via-[#2D222F] dark:to-[#4B2138]"
        >
          {/* Индикатор шторки (Drag Handle) на мобильном */}
          <div
            data-testid="concierge-drag-handle"
            onClick={() => {
              if (isMobile) {
                setSnapPoint((prev) => (prev === 'half' ? 'full' : 'half'));
              }
            }}
            className="flex cursor-grab flex-col items-center justify-center pt-2.5 pb-1 active:cursor-grabbing md:hidden"
          >
            <span className="h-1.5 w-12 rounded-full bg-[#FADCD5]/45 transition-all duration-200 dark:bg-gray-500" />
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-[#DCBAB3]/70">
              {snapPoint === 'full' ? 'Свайп вниз — свернуть' : 'Свайп вверх — на весь экран'}
            </span>
          </div>

          {/* Шапка чата с аватаром консьержа */}
          <div className="flex items-center justify-between gap-3 border-b border-[#6D3C52]/12 px-5 py-3.5 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#FADCD5]/25 bg-[#C42759] font-serif text-sm font-bold text-white shadow-md dark:border-gray-700 dark:bg-[#6D3C52] dark:text-[#FADCD5]">
                <span>АК</span>
                <span
                  title="В сети"
                  className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-[#2C0107] bg-emerald-400 dark:border-[#1B0C1A]"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-serif text-base font-medium text-[#FADCD5]">
                    Персональный консьерж
                  </h3>
                </div>
                <p className="truncate text-xs text-[#DCBAB3]/90">
                  Алия · Служба заботы ВКО · Онлайн
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={triggerSmoothClose}
              aria-label="Закрыть чат с консьержем"
              data-testid="close-concierge-chat"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm text-[#FADCD5] transition hover:bg-white/20 dark:border-gray-700 dark:bg-[#2D222F] dark:hover:bg-[#4B2138]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* История сообщений с независимым скроллом и передачей жеста вниз при scrollTop === 0 */}
        <div
          ref={messagesListRef}
          data-testid="concierge-messages-list"
          onTouchStart={handleMessagesTouchStart}
          onTouchMove={handleMessagesTouchMove}
          onTouchEnd={handleMessagesTouchEnd}
          onTouchCancel={handleMessagesTouchEnd}
          className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? 'rounded-br-xs bg-[#C42759] text-white dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                      : 'rounded-bl-xs border border-[#6D3C52]/12 bg-white text-[#2C0107] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="mt-1 px-1 text-[10px] text-[#845962] dark:text-[#B08D87]">
                  {msg.sender === 'concierge' ? 'Консьерж · ' : 'Вы · '}
                  {msg.time}
                </span>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-start gap-2" data-testid="concierge-typing-indicator">
              <div className="rounded-2xl rounded-bl-xs border border-[#6D3C52]/12 bg-white px-4 py-2.5 text-xs italic text-[#5A2D36] shadow-2xs dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#DCBAB3]">
                Специалист печатает...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Быстрые подсказки */}
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-[#6D3C52]/10 bg-[#FADCD5]/35 px-4 py-2.5 no-scrollbar dark:border-gray-800 dark:bg-[#1B0C1A]/60">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="shrink-0 rounded-full border border-[#6D3C52]/15 bg-white px-3 py-1.5 text-[11px] font-medium text-[#550416] transition hover:border-[#C42759] hover:bg-[#FADCD5]/60 dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Поле ввода сообщения */}
        <form
          onSubmit={handleSubmit}
          className="flex shrink-0 items-center gap-2 border-t border-[#6D3C52]/12 bg-white p-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] md:pb-3.5 dark:border-gray-800 dark:bg-[#1B0C1A]"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Напишите ваш вопрос консьержу..."
            data-testid="concierge-input"
            className="h-12 flex-1 rounded-full border border-[#6D3C52]/18 bg-[#FDF5F3] px-4 text-sm text-[#2C0107] placeholder:text-[#845962] focus:border-[#C42759] focus:outline-none dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:placeholder:text-[#B08D87]"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            data-testid="concierge-send-btn"
            aria-label="Отправить сообщение"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C42759] text-white shadow-[0_6px_18px_rgba(196,39,89,0.28)] transition hover:bg-[#550416] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </section>
    </>
  );
}
