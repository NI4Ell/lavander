'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CheckoutFailPage() {
  const router = useRouter()

  return (
    <div className="px-[60px] py-16 max-w-[760px] mx-auto text-center max-md:px-4 max-md:py-10">
      <div className="border-[1.5px] border-ink rounded-[18px] px-[40px] py-[40px] bg-lav-soft max-md:px-5 max-md:py-7">
        <h1 className="text-[44px] text-purple font-bold mt-1 mb-3 max-md:text-[30px]">
          ❌ Оплата не прошла
        </h1>
        <p className="text-[18px] text-ink-soft m-0 mb-6 leading-relaxed">
          Попробуйте ещё раз или свяжитесь с нами.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-block px-7 py-3 border-[1.5px] border-ink rounded-[8px] bg-ink text-paper text-[18px] hover:opacity-85 transition-opacity cursor-pointer"
          >
            Попробовать снова
          </button>
          <Link
            href="/"
            className="inline-block px-7 py-3 border-[1.5px] border-ink rounded-[8px] bg-paper text-ink text-[18px] hover:bg-lav/30 transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
