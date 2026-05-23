import Image from 'next/image'
import Link from 'next/link'

const SOCIAL = [
  { href: 'tel:+375291190699',                    src: '/icons/phone.png',     alt: 'Телефон',   target: undefined },
  { href: 'https://www.instagram.com/lavander.gomel/', src: '/icons/instagram.png', alt: 'Instagram', target: '_blank' },
  { href: 'https://t.me/+375291190699',            src: '/icons/telegram.png', alt: 'Telegram',  target: '_blank' },
]

const NAV_LINKS = [
  { label: 'Каталог',           href: '/' },
  { label: 'Доставка и оплата', href: '/delivery' },
  { label: 'О нас',             href: '/about' },
  { label: 'Корзина',           href: '/cart' },
]


export default function Footer() {
  return (
    <footer className="bg-lav border-t-[1.5px] border-ink px-[60px] pt-9 pb-7 max-md:px-4 max-md:pt-7 max-md:pb-5">

      {/* 4-column grid */}
      <div className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr] gap-[30px] text-[14px] text-ink-soft max-md:grid-cols-2 max-md:gap-5">

        {/* Col 1: Logo + socials */}
        <div>
          <Image
            src="/logo.png"
            alt="Лавандер"
            width={48}
            height={48}
            className="rounded-full object-cover border-[1.5px] border-ink"
          />
          <div className="flex gap-2 mt-[14px]">
            {SOCIAL.map(({ href, src, alt, target }) => (
              <a
                key={alt}
                href={href}
                target={target}
                rel={target ? 'noreferrer' : undefined}
                aria-label={alt}
              >
                <Image src={src} alt={alt} width={32} height={32} />
              </a>
            ))}
          </div>
        </div>

        {/* Col 2: Address */}
        <div>
          <h4 className="text-[22px] font-semibold text-ink mb-[10px] max-md:text-[17px]">наш адрес</h4>
          <p className="my-1 leading-[1.45]">
            г. Гомель, ул. Речицкая, 2<br />
            (перекрёсток ул. Гагарина и ул. Речицкая,<br />
            возле ТЦ «Секрет»)
          </p>
          <p className="mt-[10px] text-ink-soft">
            пн–вс<br />
            9:00 – 20:00
          </p>
        </div>

        {/* Col 3: Contacts */}
        <div>
          <h4 className="text-[22px] font-semibold text-ink mb-[10px] max-md:text-[17px]">контакты</h4>
          <p className="my-1">
            <a href="tel:+375291190699" className="hover:text-purple transition-colors">+375 (29) 119-06-99</a>
          </p>
          <p className="my-1">
            <a href="tel:+375296634023" className="hover:text-purple transition-colors">+375 (29) 663-40-23</a>
          </p>
          <p className="text-[13px] text-ink-soft my-1">Viber · Telegram</p>
          <p className="mt-1">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-purple transition-colors">
              @lavander.gomel
            </a>
          </p>
          <p className="mt-1">
            <a href="mailto:lavander.gomel@mail.ru" className="hover:text-purple transition-colors text-[13px]">
              lavander.gomel@mail.ru
            </a>
          </p>
        </div>

        {/* Col 4: Menu */}
        <div>
          <h4 className="text-[22px] font-semibold text-ink mb-[10px] max-md:text-[17px]">меню</h4>
          {NAV_LINKS.map(({ label, href }) => (
            <p key={href} className="my-1">
              <Link href={href} className="hover:text-purple transition-colors">{label}</Link>
            </p>
          ))}
        </div>
      </div>

      {/* Divider */}
      <hr className="h-line" />

      {/* Payment methods */}
      <div className="mt-[14px]">
        <Image src="/bepaid-badge.svg" alt="bepaid" width={521} height={48} />
      </div>

      {/* Legal */}
      <div className="mt-4 text-[13px] text-ink-soft leading-relaxed">
        ЧТУП «Красивый Край» · УНП 491388960 · зарегистрировано Гомельским городским исполнительным комитетом 15.07.2024 · Регистрационный номер в Торговом реестре 747719 от 25.04.2025 · 246050, г. Гомель, ул. Речицкая, 2-64 · Режим работы: пн–вс 9:00–20:00 · lavander.gomel@mail.ru · +375&nbsp;(29)&nbsp;119-06-99
        &nbsp;·&nbsp;
        <Link href="/privacy" className="hover:text-purple transition-colors">Политика конфиденциальности</Link>
        &nbsp;·&nbsp;
        <Link href="/oferta" className="hover:text-purple transition-colors">Публичная оферта</Link>
        &nbsp;·&nbsp;
        <Link href="/payment" className="hover:text-purple transition-colors">Оплата</Link>
      </div>
    </footer>
  )
}
