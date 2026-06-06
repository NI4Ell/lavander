import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Оплата и безопасность',
  description: 'Правила оплаты заказов в букетной мастерской Лавандер. Безопасная оплата картой онлайн через bePaid. Возврат средств.',
}

const CARD_METHODS = ['VISA', 'Mastercard', 'Белкарт', 'Apple Pay', 'Samsung Pay']

const SECURITY_POINTS = [
  {
    title: 'Данные карты не хранятся',
    text: 'Номер карты, срок действия и CVV никогда не передаются на сервер lavander.by. Всё вводится напрямую на защищённой странице bePaid.',
  },
  {
    title: 'Шифрование SSL/TLS',
    text: 'Соединение между браузером и платёжным шлюзом защищено протоколом TLS 1.3. Передаваемые данные не могут быть перехвачены третьими лицами.',
  },
  {
    title: 'Стандарт PCI DSS',
    text: 'bePaid — белорусский платёжный сервис, сертифицированный по стандарту PCI DSS. Оплата проходит через инфраструктуру МТБанка.',
  },
]

export default function PaymentPage() {
  return (
    <div className="px-[60px] py-10 max-md:px-4 max-md:py-6">

      {/* Hero */}
      <h1 className="text-[56px] leading-none font-bold text-purple text-center mb-2 max-md:text-[36px]">
        Оплата и безопасность
      </h1>
      <p className="text-[18px] text-center text-ink-soft mt-0 mb-[36px] max-w-[560px] mx-auto leading-relaxed">
        Принимаем оплату картой онлайн. Данные карты не хранятся на нашем сайте.
      </p>

      {/* ─── Способы оплаты ─────────────────────────────────── */}
      <section className="border-[1.5px] border-ink rounded-[18px] px-[40px] py-[32px] bg-lav-soft mb-6 max-md:px-5 max-md:py-6">
        <h2 className="text-[36px] font-semibold text-purple text-center m-0 mb-2 max-md:text-[26px]">
          Способы оплаты
        </h2>
        <p className="text-[16px] text-ink-soft text-center m-0 mb-6 leading-relaxed">
          Онлайн картой через защищённый платёжный шлюз bePaid (МТБанк)
        </p>

        {/* Card badges */}
        <div className="flex gap-3 flex-wrap justify-center mb-6">
          {CARD_METHODS.map((m) => (
            <span
              key={m}
              className="border-[1.5px] border-ink rounded-[6px] px-3 py-1 bg-paper text-[16px]"
            >
              {m}
            </span>
          ))}
        </div>

        {/* bepaid logo */}
        <div className="flex justify-center">
          <Image src="/bepaid-badge.svg" alt="bePaid" width={480} height={44} />
        </div>
      </section>

      {/* ─── Безопасность ────────────────────────────────────── */}
      <section className="mb-6">
        <h2 className="text-[36px] font-semibold text-purple text-center m-0 mb-5 max-md:text-[26px]">
          Безопасность платежей
        </h2>
        <div className="grid grid-cols-3 gap-4 items-stretch max-md:grid-cols-1">
          {SECURITY_POINTS.map(({ title, text }) => (
            <div
              key={title}
              className="border-[1.5px] border-ink rounded-[14px] px-5 py-5 bg-paper"
            >
              <p className="text-[16px] font-semibold text-ink m-0 mb-[6px]">{title}</p>
              <p className="text-[14px] text-ink-soft leading-[1.55] m-0">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Возврат средств ─────────────────────────────────── */}
      <section className="border-[1.5px] border-ink rounded-[18px] px-[40px] py-[32px] bg-pink-soft max-md:px-5 max-md:py-6">
        <h2 className="text-[36px] font-semibold text-purple text-center m-0 mb-5 max-md:text-[26px]">
          Возврат средств
        </h2>

        <ul className="flex flex-col gap-3 m-0 p-0 list-none text-left mb-5">
          <li className="flex gap-3 items-start text-[16px] leading-[1.5] text-ink-soft">
            <span className="text-purple shrink-0 mt-[3px]">—</span>
            <span>Цветочная продукция надлежащего качества обмену и возврату не подлежит.</span>
          </li>
          <li className="flex gap-3 items-start text-[16px] leading-[1.5] text-ink-soft">
            <span className="text-purple shrink-0 mt-[3px]">—</span>
            <span>
              Возврат денежных средств возможен в случаях: заказ не был выполнен по вине магазина;
              заказ не может быть исполнен по вине Продавца.
            </span>
          </li>
          <li className="flex gap-3 items-start text-[16px] leading-[1.5] text-ink-soft">
            <span className="text-purple shrink-0 mt-[3px]">—</span>
            <span>
              Возврат осуществляется на карту, с которой производилась оплата,
              в течение <strong>от 1 до 30 дней</strong>.
            </span>
          </li>
          <li className="flex gap-3 items-start text-[16px] leading-[1.5] text-ink-soft">
            <span className="text-purple shrink-0 mt-[3px]">—</span>
            <span>
              По вопросам возврата:{' '}
              <a href="tel:+375291190699" className="text-purple hover:underline font-medium">
                +375&nbsp;(29)&nbsp;119-06-99
              </a>
            </span>
          </li>
        </ul>

        <p className="text-[14px] text-ink-soft text-center m-0 leading-relaxed">
          Возврат средств осуществляется в соответствии с законодательством Республики Беларусь
          и условиями{' '}
          <Link href="/oferta" className="text-purple hover:underline">публичной оферты</Link>.
        </p>
      </section>

    </div>
  )
}
