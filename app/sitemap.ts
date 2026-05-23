import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { status: 'AVAILABLE' },
    select: { slug: true, updatedAt: true },
  })

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lavander.by'

  return [
    { url: base,                    lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${base}/delivery`,      changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/about`,         changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/payment`,       changeFrequency: 'monthly', priority: 0.5 },
    ...products.map((p) => ({
      url:             `${base}/product/${p.slug}`,
      lastModified:    p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    })),
  ]
}
