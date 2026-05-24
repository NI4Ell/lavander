import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 1. Шапка сайта */}
      <Header />

      {/* 2. Промо-строка — между Header и Nav, по дизайну index.html */}
      <div className="bg-lav-soft text-ink text-center border-b-[1.5px] border-ink px-4 py-3 text-[13px] md:text-[20px]">
        Бесплатная доставка по Гомелю от 100 рублей
      </div>

      {/* 3. Навигация по категориям.
           Nav uses useSearchParams() → must be wrapped in Suspense to avoid
           the "should be wrapped in a suspense boundary" build error. */}
      <Suspense fallback={<div className="bg-purple h-[57px] max-md:h-[44px]" />}>
        <Nav />
      </Suspense>

      {/* 4. Основной контент */}
      <main>{children}</main>

      {/* 5. Футер */}
      <Footer />
    </>
  )
}
