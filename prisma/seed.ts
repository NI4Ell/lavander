import { PrismaClient, Category, ProductStatus, AdminRole } from '@prisma/client'

const prisma = new PrismaClient()

type SeedProduct = {
  slug: string
  name: string
  description: string
  composition: string
  care: string
  category: Category
  featuredInVitrina: boolean
  basePrice: number
  discountPrice: number | null
  sortOrder: number
  photoUrl: string
}

const PRODUCTS: SeedProduct[] = [
  // ── BOUQUET (3) ─────────────────────────────────────
  {
    slug: 'lavandovyj-son',
    name: 'Лавандовый сон',
    description:
      'Воздушный букет в лавандово-сиреневой гамме — нежный подарок на любой повод.',
    composition: 'Лизиантус, статица, эвкалипт, гипсофила',
    care: 'Подрезать стебли по диагонали, менять воду каждые 1–2 дня, держать вдали от прямых солнечных лучей.',
    category: 'BOUQUET',
    featuredInVitrina: true,
    basePrice: 15000,
    discountPrice: null,
    sortOrder: 10,
    photoUrl:
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=900&q=80',
  },
  {
    slug: 'rozovoe-utro',
    name: 'Розовое утро',
    description:
      'Сборный букет с пионовидными розами и хлопком — мягкая пастельная палитра.',
    composition: 'Роза пионовидная, хлопок, эустома, питтоспорум',
    care: 'Подрезать стебли, использовать чистую вазу с прохладной водой.',
    category: 'BOUQUET',
    featuredInVitrina: false,
    basePrice: 8900,
    discountPrice: 7900,
    sortOrder: 20,
    photoUrl:
      'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80',
  },
  {
    slug: 'belyj-shyolk',
    name: 'Белый шёлк',
    description:
      'Белоснежный букет с фрезией и эустомой — лёгкость и свежесть.',
    composition: 'Фрезия, эустома, гипсофила, рускус',
    care: 'Менять воду ежедневно, удалять увядшие листья.',
    category: 'BOUQUET',
    featuredInVitrina: false,
    basePrice: 12500,
    discountPrice: null,
    sortOrder: 30,
    photoUrl:
      'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=900&q=80',
  },

  // ── MONO (3) ────────────────────────────────────────
  {
    slug: 'mono-pion-rozovyj',
    name: 'Монобукет из розовых пионов',
    description: '15 пионовидных бутонов, собранных вручную.',
    composition: '15 пионов',
    care: 'Распускаются на 2–3 день. Менять воду каждый день.',
    category: 'MONO',
    featuredInVitrina: true,
    basePrice: 18000,
    discountPrice: null,
    sortOrder: 40,
    photoUrl:
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=900&q=80',
  },
  {
    slug: 'mono-tyulpan-belyj',
    name: 'Монобукет из белых тюльпанов',
    description: '25 крепких голландских тюльпанов в крафтовой упаковке.',
    composition: '25 тюльпанов',
    care: 'Тюльпаны любят прохладу — держите вдали от батарей.',
    category: 'MONO',
    featuredInVitrina: false,
    basePrice: 7500,
    discountPrice: 6500,
    sortOrder: 50,
    photoUrl:
      'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=900&q=80',
  },
  {
    slug: 'mono-roza-krasnaya',
    name: 'Монобукет из красных роз',
    description: '25 эквадорских роз сорта «Freedom», 60 см.',
    composition: '25 роз',
    care: 'Подрезать стебли под углом 45°, удалить нижние листья.',
    category: 'MONO',
    featuredInVitrina: false,
    basePrice: 14000,
    discountPrice: null,
    sortOrder: 60,
    photoUrl:
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=900&q=80',
  },

  // ── BOX (2) ─────────────────────────────────────────
  {
    slug: 'box-mini-pastel',
    name: 'Композиция «Мини-пастель»',
    description:
      'Компактная коробка с пастельными цветами — отличный комплимент.',
    composition: 'Кустовая роза, эустома, статица, эвкалипт',
    care: 'Поддерживать влажность губки в коробке — поливать каждые 1–2 дня.',
    category: 'BOX',
    featuredInVitrina: false,
    basePrice: 9000,
    discountPrice: null,
    sortOrder: 70,
    photoUrl:
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900&q=80',
  },
  {
    slug: 'box-cherry-blossom',
    name: 'Композиция «Cherry Blossom»',
    description: 'Бархатная коробка с розами и хризантемами в розовых тонах.',
    composition: 'Роза кустовая, хризантема, рускус, питтоспорум',
    care: 'Не ставить под прямые солнечные лучи. Поливать губку.',
    category: 'BOX',
    featuredInVitrina: false,
    basePrice: 11500,
    discountPrice: null,
    sortOrder: 80,
    photoUrl:
      'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=900&q=80',
  },

  // ── BASKET (2) ──────────────────────────────────────
  {
    slug: 'basket-letniy-sad',
    name: 'Корзина «Летний сад»',
    description: 'Большая ивовая корзина с садовыми цветами и зеленью.',
    composition: 'Подсолнух, гербера, ромашка, рускус, эвкалипт',
    care: 'Регулярно поливать флористическую губку. Срок жизни 5–7 дней.',
    category: 'BASKET',
    featuredInVitrina: false,
    basePrice: 22000,
    discountPrice: 19500,
    sortOrder: 90,
    photoUrl:
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=900&q=80',
  },
  {
    slug: 'basket-romantica',
    name: 'Корзина «Романтика»',
    description: 'Корзина с пионами, розами и гипсофилой в нежных тонах.',
    composition: 'Пион, роза, гипсофила, эвкалипт',
    care: 'Держать вдали от батарей и сквозняков, поливать губку.',
    category: 'BASKET',
    featuredInVitrina: false,
    basePrice: 19000,
    discountPrice: null,
    sortOrder: 100,
    photoUrl:
      'https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=900&q=80',
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.productPhoto.deleteMany()
  await prisma.product.deleteMany()

  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        composition: p.composition,
        care: p.care,
        category: p.category,
        featuredInVitrina: p.featuredInVitrina,
        basePrice: p.basePrice,
        discountPrice: p.discountPrice,
        sortOrder: p.sortOrder,
        status: ProductStatus.AVAILABLE,
        photos: {
          create: [{ url: p.photoUrl, position: 0 }],
        },
      },
    })
  }

  const total = await prisma.product.count()
  const featured = await prisma.product.count({
    where: { featuredInVitrina: true },
  })
  console.log(`✅ Seeded ${total} products (${featured} in vitrina).`)

  // ── AdminUsers ──────────────────────────────────────
  // Идемпотентно через upsert — безопасно перезапускать seed.
  await prisma.adminUser.upsert({
    where: { telegramId: 802188377n },
    update: {},
    create: {
      telegramId: 802188377n,
      name: 'Kirill',
      role: AdminRole.OWNER,
      active: true,
    },
  })
  const adminCount = await prisma.adminUser.count({ where: { active: true } })
  console.log(`✅ Active admins: ${adminCount}.`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
