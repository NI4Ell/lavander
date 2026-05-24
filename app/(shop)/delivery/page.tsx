import type { Metadata } from 'next'
import Accordion from '@/components/product/Accordion'

export const metadata: Metadata = {
  title: 'Доставка и оплата',
  description: 'Доставка букетов по Гомелю. 10 BYN, бесплатно от 100 BYN. В праздники — 15 BYN. Оплата картой онлайн.',
}

const STEPS = [
  { num: '1', title: 'Выбираете букет',  text: 'и пишете адрес доставки в корзине' },
  { num: '2', title: 'Мы собираем',      text: 'флорист собирает букет и присылает вам фото' },
  { num: '3', title: 'Курьер везёт',     text: 'обычно успеваем за 180 минут после оплаты' },
  { num: '4', title: 'Вручаем',          text: 'лично в руки или оставляем на ресепшене — как договоримся' },
]

const HOLIDAY_DATES = [
  '14 февраля', '8 марта', '31 августа', '1 сентября',
  '14 октября', '31 декабря', '1 января',
]

const FAQ = [
  {
    q: 'Можно ли заказать на завтра к точному времени?',
    a: 'Да, при оформлении заказа вы можете выбрать удобную дату и время из доступных слотов. Постараемся доставить в указанное время.',
  },
  {
    q: 'Что если получателя нет дома?',
    a: 'Курьер позвонит заранее. Если никто не откликнется, свяжемся с вами и договоримся о повторной доставке или оставим букет на ресепшене.',
  },
  {
    q: 'Можно ли изменить адрес после оплаты?',
    a: 'Напишите нам в мессенджер как можно скорее — постараемся внести изменения, пока букет ещё не передан курьеру.',
  },
  {
    q: 'Делаете ли вы анонимную доставку?',
    a: 'Да! При оформлении заказа оставьте в комментарии пожелание об анонимности — курьер не назовёт имя отправителя.',
  },
]

/* Number bubble — pink-soft bg, border, #b04a6a text */
function Num({ n }: { n: string }) {
  return (
    <div
      className="w-11 h-11 rounded-full bg-pink-soft border-[1.5px] border-ink grid place-items-center text-[26px] mx-auto mb-[10px] shrink-0"
      style={{ color: '#b04a6a' }}
    >
      {n}
    </div>
  )
}

export default function DeliveryPage() {
  return (
    <div className="px-[60px] py-10 max-md:px-4 max-md:py-6">

      {/* ─────────── Hero title ───────────────── */}
      <h1 className="text-[64px] leading-none font-bold text-purple text-center max-md:text-[40px]">
        Доставка и оплата
      </h1>
      <p className="text-[18px] text-center max-w-[640px] mx-auto mt-0 mb-[30px] text-ink-soft leading-relaxed">
        Возим букеты по Гомелю и пригороду. Бережно, вовремя и с фото перед отправкой.
      </p>

      {/* ─────────── Delivery cost ──────────── */}
      <div className="border-[1.5px] border-ink rounded-[18px] px-[40px] py-[30px] bg-lav-soft text-center mb-10 max-md:px-4 max-md:py-5">
        <p className="text-[22px] m-0" style={{ color: '#b04a6a' }}>стоимость доставки</p>

        <div className="grid grid-cols-2 gap-4 mt-5 max-md:grid-cols-1 max-md:gap-3">
          {/* Обычный день */}
          <div className="bg-paper border-[1.5px] border-ink rounded-[14px] p-5 text-center">
            <p className="text-[18px] text-ink-soft font-normal m-0 mb-1">Обычные дни</p>
            <p className="text-[48px] leading-none font-bold text-purple m-0">10 BYN</p>
            <p className="text-[15px] text-ink-soft mt-2 mb-0">бесплатно от <strong>100 BYN</strong></p>
          </div>

          {/* Праздничный день */}
          <div className="bg-pink-soft border-[1.5px] border-ink rounded-[14px] p-5 text-center">
            <p className="text-[18px] text-ink-soft font-normal m-0 mb-1">Праздничные дни</p>
            <p className="text-[48px] leading-none font-bold text-purple m-0">15 BYN</p>
            <p className="text-[15px] text-ink-soft mt-2 mb-0">фиксированная цена</p>
          </div>
        </div>

        <p className="text-[14px] text-ink-soft mt-5 mb-0 leading-relaxed">
          <span className="font-medium">Праздничные дни:</span>{' '}
          {HOLIDAY_DATES.join(', ')}
        </p>
      </div>

      {/* ─────────── Steps ────────────────────── */}
      <h2 className="text-[44px] font-semibold text-purple text-center mb-5 max-md:text-[28px]">
        как это работает
      </h2>
      <div className="grid grid-cols-4 gap-4 mb-10 max-md:grid-cols-2 max-md:gap-3">
        {STEPS.map(({ num, title, text }) => (
          <div key={num} className="border-[1.5px] border-dashed border-ink rounded-[14px] p-5 bg-paper">
            <Num n={num} />
            <p className="text-[22px] text-purple font-normal mt-0 mb-0">{title}</p>
            <p className="text-[15px] text-ink-soft mt-1 leading-[1.4] mb-0">{text}</p>
          </div>
        ))}
      </div>

      {/* ─────────── Payment ──────────────────── */}
      <h2 className="text-[44px] font-semibold text-purple text-center mb-5 max-md:text-[28px]">
        оплата
      </h2>
      <div className="border-[1.5px] border-ink rounded-[14px] px-[40px] py-8 bg-lav-soft flex flex-col gap-3 items-center text-center w-full mb-10 max-md:px-5 max-md:py-6">
        <p className="text-[28px] text-purple font-normal m-0">Карта онлайн</p>
        <p className="text-[16px] text-ink-soft leading-[1.5] m-0 max-w-[640px]">
          Безопасная оплата по карте Visa, Mastercard или Белкарт через защищённый платёжный шлюз.
        </p>
        <div className="flex gap-3 flex-wrap justify-center mt-1">
          {['VISA', 'MasterCard', 'Белкарт', 'Apple Pay', 'Samsung Pay'].map((m) => (
            <span key={m} className="border-[1.5px] border-ink rounded-[6px] px-3 py-1 bg-paper text-[16px]">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* ─────────── FAQ ──────────────────────── */}
      <h2 className="text-[44px] font-semibold text-purple text-center mb-5 max-md:text-[28px]">
        частые вопросы
      </h2>
      <div className="flex flex-col gap-2">
        {FAQ.map(({ q, a }) => (
          <Accordion key={q} title={q}>
            {a}
          </Accordion>
        ))}
      </div>
    </div>
  )
}
