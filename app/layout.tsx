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
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Лавандер — букетная мастерская' }],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FloristShop",
              "name": "Лавандер",
              "description": "Букетная мастерская в Гомеле. Свежие цветы, сборные букеты, монобукеты, доставка по Гомелю.",
              "url": "https://lavander.by",
              "telephone": "+375291190699",
              "email": "lavander.gomel@mail.ru",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "ул. Речицкая, 2",
                "addressLocality": "Гомель",
                "addressCountry": "BY",
                "postalCode": "246050"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "52.423119",
                "longitude": "30.999243"
              },
              "openingHours": "Mo-Su 09:00-20:00",
              "priceRange": "$$",
              "image": "https://lavander.by/og-image.jpg"
            })
          }}
        />
        {children}
        <YandexMetrika />
      </body>
    </html>
  )
}
