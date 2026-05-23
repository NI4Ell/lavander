'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfDay } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { ru } from 'date-fns/locale'

const TZ         = 'Europe/Minsk'
const DAYS_RANGE = 30
const PAGE_SIZE  = 7   // дней на одной странице/неделе

export interface SlotOption {
  iso: string
  label: string
}

interface Props {
  slots:        SlotOption[]
  value:        string | null
  onChange:     (iso: string) => void
  /** Вызывается при смене дня — родитель должен сбросить выбранное время */
  onDayChange?: () => void
  loading?:     boolean
}

type Day = {
  key:        string   // "2024-05-23" (Minsk-дата)
  dayNum:     string   // "23"
  weekday:    string   // "пн", "вт"…
  isToday:    boolean
  isTomorrow: boolean
  slots:      SlotOption[]
  hasSlots:   boolean
}

/** Строит DAYS_RANGE дней, группируя слоты по дате в Europe/Minsk */
function buildDays(slots: SlotOption[], nowUtc: Date): Day[] {
  const nowMinsk   = toZonedTime(nowUtc, TZ)
  const todayStart = startOfDay(nowMinsk)

  const slotsByDay = new Map<string, SlotOption[]>()
  for (const slot of slots) {
    const slotMinsk = toZonedTime(new Date(slot.iso), TZ)
    const key = format(slotMinsk, 'yyyy-MM-dd')
    if (!slotsByDay.has(key)) slotsByDay.set(key, [])
    slotsByDay.get(key)!.push(slot)
  }

  const days: Day[] = []
  for (let i = 0; i < DAYS_RANGE; i++) {
    const dayMinsk = addDays(todayStart, i)
    const key      = format(dayMinsk, 'yyyy-MM-dd')
    const daySlots = slotsByDay.get(key) ?? []

    days.push({
      key,
      dayNum:     format(dayMinsk, 'd'),
      weekday:    format(dayMinsk, 'EEEEEE', { locale: ru }),
      isToday:    i === 0,
      isTomorrow: i === 1,
      slots:      daySlots,
      hasSlots:   daySlots.length > 0,
    })
  }

  return days
}

/**
 * Преобразует ключ дня "yyyy-MM-dd" в Date, соответствующий
 * 09:00 UTC (= 12:00 Minsk) — безопасная точка для форматирования.
 */
function keyToUtcDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!, 9, 0, 0))
}

/** Формирует строку диапазона для навигации: "22–28 мая" или "29 мая–4 июня" */
function weekRangeLabel(weekDays: Day[]): string {
  const first = weekDays[0]
  const last  = weekDays[weekDays.length - 1]
  if (!first || !last) return ''

  const firstMonth = first.key.slice(5, 7)   // "05"
  const lastMonth  = last.key.slice(5, 7)    // "06"

  const lastFull  = formatInTimeZone(keyToUtcDate(last.key),  TZ, 'd MMMM', { locale: ru })

  if (firstMonth === lastMonth) {
    // "22–28 мая"
    return `${first.dayNum}–${lastFull}`
  }

  // "29 мая–4 июня"
  const firstFull = formatInTimeZone(keyToUtcDate(first.key), TZ, 'd MMMM', { locale: ru })
  return `${firstFull}–${lastFull}`
}

export default function SlotPicker({
  slots,
  value,
  onChange,
  onDayChange,
  loading = false,
}: Props) {
  const now = useMemo(() => new Date(), [])

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [timeVisible, setTimeVisible] = useState(false)
  const [weekPage,    setWeekPage]    = useState(0)

  const days        = useMemo(() => buildDays(slots, now), [slots, now])
  const totalWeeks  = Math.ceil(days.length / PAGE_SIZE)   // = 5 при 30 днях
  const weekDays    = days.slice(weekPage * PAGE_SIZE, (weekPage + 1) * PAGE_SIZE)

  // При первой загрузке (selectedDay=null, value пришёл) — синхронизируем день
  useEffect(() => {
    if (selectedDay === null && value !== null) {
      const slotMinsk = toZonedTime(new Date(value), TZ)
      setSelectedDay(format(slotMinsk, 'yyyy-MM-dd'))
    }
  }, [value, selectedDay])

  // Анимация сетки времени при смене дня
  useEffect(() => {
    if (!selectedDay) return
    setTimeVisible(false)
    const raf = requestAnimationFrame(() => setTimeVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [selectedDay])

  const selectedDaySlots = useMemo(
    () => days.find((d) => d.key === selectedDay)?.slots ?? [],
    [days, selectedDay],
  )

  // ── Обработчики ────────────────────────────────────

  function handleDayClick(day: Day) {
    if (!day.hasSlots || day.key === selectedDay) return
    setSelectedDay(day.key)
    onDayChange?.()
  }

  function handleWeekChange(newPage: number) {
    setWeekPage(newPage)
    // Если выбранный день не попадает в новую страницу — сбрасываем
    const newWeekDays = days.slice(newPage * PAGE_SIZE, (newPage + 1) * PAGE_SIZE)
    const stillVisible = newWeekDays.some((d) => d.key === selectedDay)
    if (!stillVisible && selectedDay !== null) {
      setSelectedDay(null)
      onDayChange?.()
    }
  }

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[80px] flex items-center text-[14px] text-ink-soft">
        Загружаем слоты…
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-[14px] text-ink-soft py-2">
        Нет доступных слотов
      </div>
    )
  }

  const prevDisabled = weekPage === 0
  const nextDisabled = weekPage === totalWeeks - 1
  const rangeLabel   = weekRangeLabel(weekDays)

  // Общий класс навигационных кнопок
  const navBtn = (disabled: boolean) =>
    [
      'px-3 py-[5px] border-[1.5px] border-ink rounded-[6px] bg-paper text-[13px]',
      'transition-colors select-none',
      disabled
        ? 'opacity-40 cursor-not-allowed text-ink-soft'
        : 'cursor-pointer hover:bg-lav/30 text-ink',
    ].join(' ')

  return (
    <div>

      {/* ── Навигация по неделям ───────────────────────── */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          disabled={prevDisabled}
          onClick={() => !prevDisabled && handleWeekChange(weekPage - 1)}
          className={navBtn(prevDisabled)}
        >
          ← Пред.
        </button>

        <span className="text-[14px] text-ink-soft flex-1 text-center leading-none">
          {rangeLabel}
        </span>

        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => !nextDisabled && handleWeekChange(weekPage + 1)}
          className={navBtn(nextDisabled)}
        >
          След. →
        </button>
      </div>

      {/* ── Шаг 1: строка дней текущей недели ─────────── */}
      <div className="flex gap-[6px]">
        {weekDays.map((day) => {
          const isActive = day.key === selectedDay
          const topLabel = day.isToday ? 'Сег' : day.isTomorrow ? 'Зав' : day.dayNum

          return (
            <button
              key={day.key}
              type="button"
              disabled={!day.hasSlots}
              onClick={() => handleDayClick(day)}
              className={[
                'flex-1 py-[10px] rounded-[8px] flex flex-col items-center gap-[3px]',
                'border-[1.5px] transition-colors',
                'max-md:py-[8px]',
                isActive
                  ? 'bg-lav border-ink cursor-pointer'
                  : day.hasSlots
                    ? 'bg-paper border-dashed border-ink cursor-pointer hover:bg-lav/30'
                    : 'bg-paper-2 border-dashed border-ink/30 opacity-50 cursor-not-allowed',
              ].join(' ')}
            >
              <span className="text-[15px] font-semibold text-ink leading-none max-md:text-[13px]">
                {topLabel}
              </span>
              <span className="text-[11px] text-ink-soft leading-none max-md:text-[10px]">
                {day.weekday}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Шаг 2: сетка временных слотов ────────────── */}
      {selectedDay && selectedDaySlots.length > 0 && (
        <div
          className={[
            'grid grid-cols-4 gap-[6px] mt-3',
            'max-md:grid-cols-3',
            'transition-all duration-200',
            timeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          ].join(' ')}
        >
          {selectedDaySlots.map((slot) => {
            const isActive  = slot.iso === value
            const timeLabel = formatInTimeZone(new Date(slot.iso), TZ, 'HH:mm')

            return (
              <button
                key={slot.iso}
                type="button"
                onClick={() => onChange(slot.iso)}
                className={[
                  'py-[7px] text-[14px] rounded-[6px] border-[1.5px] transition-colors font-medium',
                  isActive
                    ? 'bg-lav border-ink text-ink'
                    : 'bg-paper border-dashed border-ink text-ink-soft hover:bg-lav/30',
                ].join(' ')}
              >
                {timeLabel}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
