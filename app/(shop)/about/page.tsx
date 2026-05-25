import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'О нас',
  description: 'Букетная мастерская «Лавандер» в Гомеле. С 2018 года делаем букеты вручную — без шаблонов и наспех.',
}

// crosshatch placeholder — повторяет .ph.x из дизайна
const PH = ({ className = '', children }: { className?: string; children?: React.ReactNode }) => (
  <div
    className={`border-[1.5px] border-ink flex items-center justify-center text-ink-soft text-[15px] relative overflow-hidden ${className}`}
    style={{
      background: 'repeating-linear-gradient(135deg, transparent 0 10px, rgba(31,26,36,0.08) 10px 11px)',
    }}
  >
    {/* X lines */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'linear-gradient(to top right, transparent calc(50% - 1px), rgba(31,26,36,0.25) 50%, transparent calc(50% + 1px)), ' +
          'linear-gradient(to top left,  transparent calc(50% - 1px), rgba(31,26,36,0.25) 50%, transparent calc(50% + 1px))',
      }}
    />
    <span className="relative z-10">{children}</span>
  </div>
)

const STATS = [
  { value: '2018',    label: 'с этого года' },
  { value: '12 000+', label: 'собранных букетов' },
  { value: '3',       label: 'флориста в команде' },
  { value: '90 мин',  label: 'средняя доставка' },
]

const PRINCIPLES = [
  {
    title: 'только свежие цветы',
    text:  'Цветы покупаем у проверенных поставщиков — только свежие, только качественные.',
  },
  {
    title: 'с любовью и настроением',
    text:  'Каждый букет собирает флорист с душой. Внешний вид может незначительно отличаться от фото в каталоге при сохранении состава и стоимости.',
  },
  {
    title: 'фото перед отправкой',
    text:  'Перед тем как отдать курьеру, мы пришлём вам фото готового букета — чтобы вы видели, что получит адресат.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* ─────────── HERO ─────────────────────── */}
      <section className="grid grid-cols-2 gap-[30px] px-[60px] py-10 items-center max-md:grid-cols-1 max-md:px-4 max-md:py-6">
        <div>
          <p className="text-[22px]" style={{ color: '#b04a6a' }}>о мастерской</p>
          <h1 className="text-[64px] leading-none font-bold text-purple my-2 max-md:text-[40px]">
            Лавандер — букетная мастерская с душой!
          </h1>
          <p className="text-[18px] leading-[1.5] max-w-[520px] text-ink-soft mt-0 mb-[14px]">
            Это профессиональные флористы, понимающие менеджеры и быстрые курьеры. Лавандер — это не просто про цветы, это про чувства, настроение и эмоции.
          </p>
          <p className="text-[18px] leading-[1.5] max-w-[520px] text-ink-soft my-0 mb-[14px]">
            Мы уверены, что идеальный букет начинается с индивидуального подхода к каждому покупателю, поэтому мы слушаем Ваши пожелания, подбираем нужные сорта цветов, креативно упаковываем и всегда показываем готовый вариант до отправки.
          </p>
          <p className="text-[18px] leading-[1.5] max-w-[520px] text-ink-soft my-0">
            Наши флористы — это про открытость, душевность и клиентоориентированность. Мы рады быть частичкой Вашего праздника и всегда хотим видеть радость в Ваших глазах.
          </p>
        </div>
        <div className="relative self-stretch rounded-[18px] overflow-hidden max-md:h-[300px]">
          <Image
            src="/about/hero.jpg"
            alt="Мастерская Лавандер"
            fill
            className="object-cover ![h-full] rounded-[18px]"
          />
        </div>
      </section>


      {/* ─────────── OFFER ────────────────────── */}
      <section className="px-[60px] pb-[30px] max-md:px-4 max-md:pb-6">
        <h2 className="text-[44px] font-semibold text-purple mb-5 max-md:text-[28px]">
          Мы предлагаем нашим покупателям:
        </h2>
        <ul className="flex flex-col gap-[10px] m-0 p-0 list-none">
          {[
            'Только свежие цветы от проверенных поставщиков',
            'Работаем под любой бюджет: от лаконичного букета-комплимента до сложной дизайнерской сборки',
            'Профессиональные флористы помогут с подбором состава и упаковки, чтобы букет или композиция идеально передали ваши чувства',
            'Для постоянных покупателей действует накопительная система скидок',
            'Осуществляем доставку в любую точку города Гомеля к указанному времени',
          ].map((item) => (
            <li key={item} className="flex gap-3 items-start text-[18px] leading-[1.5] text-ink-soft">
              <span className="text-purple shrink-0 mt-[2px]">✦</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="text-[18px] leading-[1.6] text-ink-soft mt-[24px] mb-0 max-w-[680px]">
          Также работаем с юридическими лицами на основании заключенных договоров. Мы с удовольствием готовы помочь Вам красиво поздравить коллектив Вашей компании и празднично оформить офис.
        </p>
        <p className="text-[18px] leading-[1.5] text-ink mt-[10px] mb-0 font-medium">
          Делаем все от души и с любовью 💜
        </p>
      </section>

      {/* ─────────── PRINCIPLES ───────────────── */}
      <section className="px-[60px] py-[30px] max-md:px-4 max-md:py-5">
        <h2 className="text-[44px] font-semibold text-purple text-center mb-5 max-md:text-[28px]">
          наши принципы
        </h2>
        <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1 max-md:gap-4">
          {PRINCIPLES.map(({ title, text }) => (
            <div key={title}>
              <h3 className="text-[30px] font-normal text-purple mb-[6px] max-md:text-[22px]">{title}</h3>
              <p className="text-[16px] leading-[1.5] text-ink-soft m-0">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── GALLERY ──────────────────── */}
      <section className="px-[60px] pb-[50px] pt-[30px] max-md:px-4 max-md:pb-9 max-md:pt-5">
        <h2 className="text-[44px] font-semibold text-purple text-center mb-5 max-md:text-[28px]">
          наша мастерская
        </h2>

        {/*
          Gallery grid — 4 cols, auto-rows 160px (mobile: 2 cols, 120px)
          Slot 1 spans 2 cols + 2 rows; remaining 4 slots are 1×1
        */}
        <div
          className="grid grid-cols-4 gap-3 items-stretch max-md:grid-cols-2 max-md:gap-2"
        >
          <div className="relative rounded-[4px] col-span-2 overflow-hidden h-[420px]">
            <Image src="/about/gallery-1.jpg" alt="Лавандер фото 1" fill className="object-cover ![h-full]" />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-3 h-[420px]">
            <div className="relative overflow-hidden rounded-[4px]">
              <Image src="/about/gallery-2.jpg" alt="Лавандер фото 2" fill className="object-cover ![h-full]" />
            </div>
            <div className="relative overflow-hidden rounded-[4px]">
              <Image src="/about/gallery-3.jpg" alt="Лавандер фото 3" fill className="object-cover ![h-full]" />
            </div>
            <div className="relative overflow-hidden rounded-[4px]">
              <Image src="/about/gallery-4.jpg" alt="Лавандер фото 4" fill className="object-cover ![h-full]" />
            </div>
            <div className="relative overflow-hidden rounded-[4px]">
              <Image src="/about/gallery-5.jpg" alt="Лавандер фото 5" fill className="object-cover ![h-full]" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
