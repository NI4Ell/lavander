import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p
        className="text-[120px] leading-none font-bold max-md:text-[80px]"
        style={{ color: 'var(--color-purple)' }}
      >
        404
      </p>
      <h1
        className="text-[36px] font-semibold mt-2 mb-3 max-md:text-[26px]"
        style={{ color: 'var(--color-ink)' }}
      >
        Страница не найдена
      </h1>
      <p
        className="text-[18px] leading-[1.5] max-w-[480px] mb-8 max-md:text-[16px]"
        style={{ color: 'var(--color-ink-soft)' }}
      >
        Возможно, она была удалена или вы перешли по неверной ссылке.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="inline-block px-7 py-3 border-[1.5px] border-ink rounded-[8px] bg-ink text-paper text-[18px] hover:opacity-85 transition-opacity"
        >
          На главную
        </Link>
        <Link
          href="/#catalog"
          className="inline-block px-7 py-3 border-[1.5px] border-ink rounded-[8px] text-ink text-[18px] hover:bg-lav/30 transition-colors"
        >
          Каталог
        </Link>
      </div>
    </div>
  )
}
