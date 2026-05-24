import type { Metadata } from 'next'
import { Jost } from 'next/font/google'
import './globals.css'
import YandexMetrika from '@/components/YandexMetrika'

const jost = Jost({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jost',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://lavander.by'),
  title: { default: 'Лавандер — букетная мастерская в Гомеле', template: '%s | Лавандер' },
  description: 'Букетная мастерская Лавандер в Гомеле. Свежие цветы, авторские букеты, быстрая доставка по Гомелю от 180 минут. Заказ онлайн.',
  keywords: ['букеты Гомель', 'цветы Гомель', 'доставка цветов Гомель', 'букетная мастерская'],
  openGraph: {
    type: 'website',
    locale: 'ru_BY',
    siteName: 'Лавандер',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={jost.variable}>
      <body>
        {children}
        <YandexMetrika />
      </body>
    </html>
  )
}
