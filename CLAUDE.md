# Лавандер — Интернет-магазин цветов, г. Гомель

## Что это за проект
Интернет-магазин букетной мастерской «Лавандер» (г. Гомель, Беларусь).
Клиент выбирает букет, оформляет заказ (доставка или самовывоз), выбирает временной слот,
платит картой онлайн. Флористы получают уведомление в Telegram-бот и управляют
ассортиментом через него же.

---

## Стек

| Слой | Технология |
|---|---|
| Frontend + API | Next.js 15 App Router, TypeScript strict |
| Стили | Tailwind CSS v4 |
| ORM | Prisma 5 |
| База данных | PostgreSQL 16 |
| Telegram-бот | grammY (webhook) + @grammyjs/conversations |
| Платежи | bePaid (bepaid.by) |
| Хранилище фото | Cloudinary (v2 SDK) |
| Деплой | VPS hoster.by, Docker Compose, Caddy |
| Пакетный менеджер | **pnpm** (не npm, не yarn) |

---

## Структура проекта

```
lavander/
├── app/
│   ├── (shop)/
│   │   ├── page.tsx                    # главная — каталог
│   │   ├── product/[slug]/page.tsx     # карточка товара
│   │   ├── cart/page.tsx               # корзина + форма заказа
│   │   ├── checkout/
│   │   │   ├── success/page.tsx        # успешная оплата
│   │   │   └── fail/page.tsx           # неудачная оплата
│   │   ├── about/page.tsx
│   │   ├── delivery/page.tsx
│   │   ├── oferta/page.tsx             # публичная оферта
│   │   └── privacy/page.tsx            # политика конфиденциальности
│   └── api/
│       ├── products/route.ts
│       ├── delivery/quote/route.ts     # Yandex check-price
│       ├── delivery/slots/route.ts     # доступные временные слоты
│       ├── orders/route.ts             # POST создать заказ
│       ├── orders/[id]/pay/route.ts    # POST инициировать платёж
│       ├── payments/bepaid/webhook/route.ts
│       └── telegram/webhook/route.ts
├── lib/
│   ├── db.ts                           # Prisma client (singleton)
│   ├── bepaid.ts                       # createToken, verifySignature, refund
│   ├── yandex-delivery.ts              # checkPrice
│   ├── yandex-geo.ts                   # geocode address → coords
│   ├── time-slots.ts                   # генерация доступных слотов
│   ├── order-number.ts                 # LAV-YYMMDD-XXXX
│   └── telegram/
│       ├── bot.ts                      # grammY instance
│       ├── notify.ts                   # notifyNewOrder, notifyStatusChange
│       └── handlers/
│           ├── orders.ts               # кнопки статусов
│           ├── catalog-add.ts          # /add wizard
│           ├── catalog-edit.ts         # /products, редактирование
│           └── stats.ts                # /today, /week
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Nav.tsx
│   │   ├── Footer.tsx
│   │   └── BurgerMenu.tsx
│   ├── catalog/
│   │   ├── ProductGrid.tsx
│   │   ├── ProductCard.tsx
│   │   └── CategoryNav.tsx
│   ├── product/
│   │   ├── Gallery.tsx
│   │   └── AddToCart.tsx
│   ├── cart/
│   │   ├── CartList.tsx
│   │   ├── CartItem.tsx
│   │   ├── OrderSidebar.tsx
│   │   ├── DeliveryToggle.tsx
│   │   ├── SlotPicker.tsx
│   │   └── PostcardBlock.tsx
│   └── ui/
│       ├── Pill.tsx
│       ├── Qty.tsx
│       ├── InputField.tsx
│       └── Toast.tsx
├── store/
│   └── cart.ts                         # Zustand — корзина
├── lib/schemas/
│   ├── order.ts                        # Zod-схема для POST /api/orders
│   └── product.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   ├── set-webhook.ts                  # установить TG webhook
│   └── revoke-webhook.ts
├── public/
│   └── logo.png                        # логотип магазина
├── docker-compose.yml                  # dev: web + db + caddy
├── docker-compose.prod.yml
├── Caddyfile
├── Dockerfile
├── CLAUDE.md                           # этот файл
└── .env.example
```

---

## Команды

```bash
pnpm dev                  # dev-сервер Next.js
pnpm build                # production build
pnpm db:push              # синк schema → БД без миграций (только dev!)
pnpm db:migrate           # создать migration файл (dev)
# продакшен: docker compose -f docker-compose.prod.yml exec web npx prisma migrate deploy
pnpm db:seed              # залить тестовые данные
pnpm db:studio            # Prisma Studio в браузере
pnpm tg:webhook:dev       # установить TG webhook на ngrok (нужен ngrok)
pnpm tg:webhook:prod      # установить TG webhook на production домен
pnpm test                 # jest unit-тесты (time-slots, bepaid signature)
docker compose up         # поднять dev-среду (web + postgres + caddy)
```

---

## Переменные окружения (.env)

```env
# Database
DATABASE_URL="postgresql://lavander:password@localhost:5432/lavander"

# Next.js
NEXTAUTH_SECRET="..."
NEXT_PUBLIC_APP_URL="https://lavender.by"

# Telegram
TELEGRAM_BOT_TOKEN="<your_telegram_bot_token>"
TELEGRAM_ADMIN_CHAT_ID="-100xxxxxxxxxx"   # id группового чата флористов
TELEGRAM_WEBHOOK_SECRET="..."             # секрет для верификации webhook от Telegram

# bePaid
BEPAID_SHOP_ID="..."
BEPAID_SHOP_KEY="..."
BEPAID_CHECKOUT_URL="https://checkout.bepaid.by"  # или sandbox

# Cloudinary (хранилище фото товаров)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Магазин
SHOP_LAT="52.423119"                      # широта ул. Речицкая 2, Гомель
SHOP_LNG="30.999243"                      # долгота
SHOP_ADDRESS="г. Гомель, ул. Речицкая, 2"
SHOP_PHONE="+375296634023"
SHOP_EMAIL="lavander.gomel@mail.ru"
```

---

## Prisma-схема (источник правды для всех типов)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ProductStatus { AVAILABLE OUT_OF_STOCK HIDDEN }
enum Category     { BOUQUET MONO BOX BASKET }
enum DeliveryType { DELIVERY PICKUP }
enum OrderStatus  {
  PENDING_PAYMENT
  PAID
  PREPARING
  READY
  OUT_FOR_DELIVERY
  DONE
  CANCELLED
  REFUNDED
}
enum AdminRole { OWNER FLORIST }

model Product {
  id                String        @id @default(cuid())
  slug              String        @unique
  name              String
  description       String?
  composition       String?       // состав букета
  care              String?       // уход
  category          Category
  featuredInVitrina Boolean       @default(false)
  basePrice         Int           // в КОПЕЙКАХ (89 BYN = 8900)
  discountPrice     Int?          // null = скидки нет
  status            ProductStatus @default(AVAILABLE)
  sortOrder         Int           @default(0)
  photos            ProductPhoto[]
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([status, category, sortOrder])
  @@index([featuredInVitrina, status])
}

model ProductPhoto {
  id        String  @id @default(cuid())
  productId String
  url       String
  position  Int     @default(0)   // 0 = главное фото
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId, position])
}

model Order {
  id            String       @id @default(cuid())
  publicNumber  String       @unique   // LAV-250517-0001
  status        OrderStatus  @default(PENDING_PAYMENT)

  // Покупатель
  customerPhone   String
  customerEmail   String?

  // Получение
  deliveryType    DeliveryType
  scheduledAt     DateTime             // UTC, когда доставить/забрать

  // Доставка
  deliveryAddress String?
  deliveryLat     Float?
  deliveryLng     Float?
  recipientName   String?
  recipientPhone  String?

  // Самовывоз
  pickupName      String?

  // Допы
  postcardText    String?              // null = без открытки
  postcardPrice   Int       @default(0)  // 200 коп если открытка выбрана
  photoBeforeSend Boolean   @default(false)
  photoPhone      String?              // куда флорист отправит фото

  // Деньги (всё в КОПЕЙКАХ)
  itemsTotal    Int
  deliveryPrice Int    @default(0)
  totalPrice    Int

  // bePaid
  bepaidToken   String?
  bepaidUid     String?
  paidAt        DateTime?

  items   OrderItem[]
  events  OrderEvent[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status, createdAt])
  @@index([publicNumber])
}

model OrderItem {
  id              String  @id @default(cuid())
  orderId         String
  productId       String
  productName     String   // снимок на момент заказа
  productPhotoUrl String?
  pricePaid       Int      // в копейках
  quantity        Int
  order           Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

model OrderEvent {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  note      String?
  actorTgId BigInt?
  createdAt DateTime    @default(now())
  order     Order       @relation(fields: [orderId], references: [id])

  @@index([orderId, createdAt])
}

model AdminUser {
  id         String    @id @default(cuid())
  telegramId BigInt    @unique
  name       String
  role       AdminRole @default(FLORIST)
  active     Boolean   @default(true)
  createdAt  DateTime  @default(now())
}
```

---

## Критически важные правила кода

### Деньги — только в копейках (Int)
```typescript
// ✅ ПРАВИЛЬНО
const price = 8900  // 89.00 BYN

// ❌ НИКОГДА
const price = 89.00  // Float → ошибки округления
const price = 89     // непонятно — рубли или копейки?

// Отображение пользователю
function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toFixed(2)} BYN`
  // или: (kopecks / 100).toLocaleString('ru-BY', { style: 'currency', currency: 'BYN' })
}
```

### Время — UTC в БД, Europe/Minsk на фронте
```typescript
// ✅ ПРАВИЛЬНО: всегда сохранять UTC
const scheduledAt = toUTC(userSelectedTime, 'Europe/Minsk')

// ✅ ПРАВИЛЬНО: отображать в Минском времени
import { formatInTimeZone } from 'date-fns-tz'
formatInTimeZone(order.scheduledAt, 'Europe/Minsk', 'dd.MM.yyyy HH:mm')

// ❌ НЕЛЬЗЯ хардкодить "сегодня" без учёта таймзоны
const today = new Date()  // это UTC на сервере, не Минск!
```

### Цены доставки и временные слоты — только с сервера
```typescript
// ❌ НЕЛЬЗЯ доверять тому, что клиент прислал
const { deliveryPrice, scheduledAt } = req.body  // атака

// ✅ ПРАВИЛЬНО: пересчитывать на сервере при создании заказа
const deliveryPrice = getDeliveryPrice(itemsTotal, scheduledAt)  // lib/delivery-price.ts
const validSlots = generateSlots(new Date())
// проверить что scheduledAt из body входит в validSlots
```

### Webhook'и — сначала проверка подписи, потом всё остальное
```typescript
// POST /api/payments/bepaid/webhook
export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('x-signature')

  // ШАГ 1: проверка — до любой БД-операции
  if (!verifyBePaidSignature(body, signature)) {
    return new Response('Forbidden', { status: 403 })
  }

  // ШАГ 2: идемпотентность
  const data = JSON.parse(body)
  const order = await prisma.order.findUnique({ where: { bepaidUid: data.uid } })
  if (order?.status !== 'PENDING_PAYMENT') return new Response('OK')  // уже обработан

  // ШАГ 3: бизнес-логика
  await markOrderPaid(order.id)
  await notifyNewOrder(order.id)

  return new Response('OK')
}
```

### Клиентский код — без секретных ключей
```typescript
// ❌ НЕЛЬЗЯ вызывать bePaid или Cloudinary из браузера
// ❌ НЕЛЬЗЯ хранить BEPAID_SHOP_KEY / CLOUDINARY_API_SECRET в NEXT_PUBLIC_*

// ✅ Всё через /api/* роуты Next.js или серверный Telegram-бот
// ✅ Публичных NEXT_PUBLIC_* переменных сейчас нет
```

---

## Алгоритм временных слотов

Магазин: 9:00–20:00, Минск UTC+3, лид-тайм 3 часа, слоты по 30 минут.

Логика `earliest` по дням:
- `d === 0` (сегодня): `now + 3ч`
- `d === 1` (завтра): `12:00` (09:00 открытие + лид-тайм 3ч)
- `d >= 2` (послезавтра+): `09:00` (без лид-тайма, с самого открытия)

```typescript
// lib/time-slots.ts
import { addHours, addDays, setHours, setMinutes, isAfter } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const TZ = 'Europe/Minsk'
const OPEN_H = 9    // 9:00
const CLOSE_H = 20  // 20:00
const LEAD_H = 3    // минимум 3 часа
const SLOT_MIN = 30 // шаг слотов в минутах

export function generateSlots(nowUtc: Date, daysAhead = 7): Date[] {
  const nowMinsk = toZonedTime(nowUtc, TZ)
  const slots: Date[] = []

  for (let d = 0; d < daysAhead; d++) {
    const dayMinsk = addDays(nowMinsk, d)

    // Самое раннее возможное время для этого дня
    const earliest = d === 0
      ? addHours(nowMinsk, LEAD_H)
      : d === 1
        ? setHours(setMinutes(dayMinsk, 0), OPEN_H + LEAD_H)  // 12:00
        : setHours(setMinutes(dayMinsk, 0), OPEN_H)            // 09:00

    // Если earliest > 20:00 сегодня — сегодня пропускаем целиком
    const dayClose = setHours(setMinutes(dayMinsk, 0), CLOSE_H)
    if (isAfter(earliest, dayClose)) continue

    // Округлить earliest вверх до ближайших 30 минут
    const startH = earliest.getHours()
    const startM = earliest.getMinutes()
    let slotH = startH
    let slotM = startM <= 0 ? 0 : startM <= 30 ? 30 : 0
    if (slotM === 0 && startM > 0) slotH += 1

    // Начинаем не раньше открытия
    if (slotH < OPEN_H || (slotH === OPEN_H && slotM < 0)) {
      slotH = OPEN_H; slotM = 0
    }

    // Генерируем слоты до 20:00
    while (slotH < CLOSE_H || (slotH === CLOSE_H && slotM === 0)) {
      const slotMinsk = setHours(setMinutes(dayMinsk, slotM), slotH)
      slots.push(fromZonedTime(slotMinsk, TZ))  // сохраняем в UTC

      slotM += SLOT_MIN
      if (slotM >= 60) { slotH += 1; slotM -= 60 }
    }
  }

  return slots
}

// Edge cases, которые должны проходить тесты:
// generateSlots(09:00 Minsk) → первый слот 12:00 сегодня
// generateSlots(17:00 Minsk) → первый слот 20:00 сегодня
// generateSlots(17:31 Minsk) → сегодня нет слотов (17:31+3=20:31 > 20:00), первый = завтра 12:00
// generateSlots(23:00 Minsk) → первый слот = завтра 12:00
```

---

## Логика доставки

Доставка **фиксированная**, без внешних API (Yandex Delivery не используется).
Цена считается на сервере в `lib/delivery-price.ts` при создании заказа.

| Тип дня | Стоимость | Бесплатно от |
|---|---|---|
| Обычный день | 10 BYN (1 000 коп) | 100 BYN (10 000 коп) |
| Праздничный день | 15 BYN (1 500 коп) | — |

**Праздничные дни** (день/месяц): 14/02, 08/03, 31/08, 01/09, 14/10, 31/12, 01/01.

```typescript
// lib/delivery-price.ts
export function getDeliveryPrice(itemsTotal: number, date: Date): number {
  const isHoliday = checkHoliday(date)   // по списку выше
  if (isHoliday) {
    return itemsTotal >= 15_000 ? 0 : 1_500
  }
  return itemsTotal >= 8_000 ? 0 : 1_000
}
```

Самовывоз — всегда бесплатно (`deliveryPrice = 0`).

---

## Аддоны товаров

Покупатель может добавить к каждой позиции аддоны на странице товара.
Хранятся в `OrderItem` как булевы поля + текст открытки.

| Аддон | Цена | Поле в `OrderItem` |
|---|---|---|
| Открытка с текстом | 200 коп (2 BYN) | `hasPostcard`, `postcardText` |
| Аквабокс | 1 000 коп (10 BYN) | `hasAquabox` |
| Пакет-переноска | 1 500 коп (15 BYN) | `hasBag` |

Цены аддонов пересчитываются на сервере при `POST /api/orders` — клиентским данным не доверяем.

---

## Бизнес-логика bePaid

Сценарий оплаты:
1. `POST /api/orders` → создаёт `Order { status: PENDING_PAYMENT }`
2. `POST /api/orders/[id]/pay` → вызывает `bepaid.createToken(order)` → получает `checkout_url`
3. Клиент редиректится на `checkout_url`
4. **bePaid шлёт webhook** на `/api/payments/bepaid/webhook` (серверный, не зависит от браузера)
5. Сайт проверяет подпись, обновляет статус → `PAID`, шлёт уведомление в Telegram
6. Клиент возвращается на `/checkout/success?id=ORDER_ID`

**Проверка подписи bePaid:**
```typescript
import crypto from 'crypto'

export function verifyBePaidSignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = crypto
    .createHmac('sha256', process.env.BEPAID_SHOP_KEY!)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

---

## Telegram-бот: структура и права

**Роли:**
- `OWNER` — управление товарами, просмотр статистики, управление флористами
- `FLORIST` — изменение статуса заказов, просмотр заказов

**Middleware авторизации:**
```typescript
bot.use(async (ctx, next) => {
  const tgId = BigInt(ctx.from?.id ?? 0)
  const admin = await prisma.adminUser.findUnique({
    where: { telegramId: tgId, active: true }
  })
  if (!admin) return ctx.reply('Нет доступа.')
  ctx.state.admin = admin
  return next()
})
```

**Формат уведомления о новом заказе:**
```
🌸 НОВЫЙ ЗАКАЗ #LAV-250517-0001
━━━━━━━━━━━━━━━━━━━━
💰 Итого: 333,00 BYN (оплачено)

• Лавандовый сон — 1 шт × 150,00 BYN
• Розовое утро — 2 шт × 89,00 BYN
• Открытка: «С днём рождения!»

📍 Доставка
ул. Советская, 15, кв. 4
Сегодня к 18:00

👤 Анна, +375291234567
📷 Фото перед отправкой → +375331112233
━━━━━━━━━━━━━━━━━━━━
[✅ Принять] [📦 Готов] [🚚 В пути] [✓ Доставлен]
```

**Команды бота (все — только OWNER):**
- `/add` — wizard добавления товара (фото → название → категория → цена → описание → состав → публикация)
- `/products` — постраничный список товаров с управлением (статус, витрина, цена, фото, удаление)
- `/admins` — текстовый список всех AdminUser с ролью и статусом
- `/addadmin` — wizard добавления админа (числовой Telegram ID → имя → роль → подтверждение → upsert)
- `/removeadmin` — список активных админов кнопками → подтверждение → полное удаление из БД
- `/editadmin` — сменить роль OWNER ↔ FLORIST для выбранного админа
- `/renameadmin` — wizard переименования: выбрать админа → ввести новое имя (2–50 символов)

---

## Дизайн: токены из index.html

**Цвета (Tailwind CSS v4 в globals.css):**
```css
@theme {
  --color-ink:        #1f1a24;
  --color-ink-soft:   #4a4452;
  --color-paper:      #fbfaf7;
  --color-paper-2:    #f4f2ec;
  --color-bg:         #ebe8e0;  /* body background */
  --color-line:       #1f1a24;
  --color-pink:       #f4c8d4;
  --color-pink-soft:  #fde6ec;
  --color-lav:        #c9b6e4;
  --color-lav-soft:   #ece4f7;
  --color-purple:     #6f4f9b;
  --color-green:      #d8e8b8;
}
```

**Типографика:**
- Шрифт: `Jost` (Google Fonts, 100–900, italic)
- Body: `font-family: "Jost", system-ui, sans-serif`
- Заголовки секций desktop: 44–48px, weight 600–700, цвет `--purple`
- Название товара на карточке: 18px, `--ink-soft`
- Цена товара: 18px, `--ink`

**Ключевые стилевые правила:**
- Все рамки: `1.5px solid #1f1a24` (не `1px`, не `2px`, именно `1.5px`)
- Border-radius: карточки 4px, кнопки 6-8px, боковая панель 12px, крупные блоки 14-18px
- Заливка header/footer/nav-pills: `--lav` (#c9b6e4)
- Фиолетовая nav-полоса: `#6f4f9b`
- Кнопка "Добавить в корзину": фон `--lav`, hover → `--pink-soft`
- Кнопка "Оформить заказ" (btn-buy): фон `--ink`, текст `--paper`
- Корзина (sidebar): фон `--lav-soft`
- Pill активный: фон `--lav`
- Dashed разделители: `1.5px dashed rgba(31,26,36,0.3)`
- Background body: `#ebe8e0`

**Сетки:**
- Каталог desktop: `grid-template-columns: repeat(4, 1fr)`, gap 28px
- Каталог mobile (≤680px): 2 колонки, gap 14px
- Карточка товара: `grid-template-columns: 1.1fr 1fr`, gap 36px
- Корзина: `grid-template-columns: 1.5fr 1fr`, gap 30px
- Padding секций desktop: `40px 60px`, mobile: `28px 16px`

**Компоненты из дизайна:**
- `.jh-top` — шапка: 3-колоночный grid (nav слева, логотип по центру, кнопки справа), фон `--lav`, border-bottom 1.5px
- `.jh-nav` — фиолетовая полоса категорий, flex, gap 36px
- `.jh-promo` — промо-строка, фон `--lav-soft`
- `.prod-badge` — бейдж скидки, круглый, фон `--green`
- `.acc` / `.acc-body` — аккордеон (состав/уход/доставка)
- `.qty` — счётчик количества, inline-flex, border 1.5px
- `.pill` / `.pill.solid` — теги/переключатели
- `.input-field` — поля формы, focus: border `--purple`
- `.jh-photo-block` — блок "фото перед отправкой", фон `--pink-soft`, border dashed
- `.toast` — уведомление снизу, фон `--purple`
- Бургер-меню на mobile: fullscreen, фон `--lav-soft`

---

## Структура каталога (категории)

```typescript
export const CATEGORIES = [
  { key: 'vitrina', label: 'актуальная витрина', flag: 'featuredInVitrina' },
  { key: 'bouquet', label: 'сборные букеты',     enum: 'BOUQUET' },
  { key: 'mono',    label: 'монобукеты',          enum: 'MONO' },
  { key: 'box',     label: 'композиции в коробках', enum: 'BOX' },
  { key: 'basket',  label: 'композиции в корзинах', enum: 'BASKET' },
] as const
```

"Актуальная витрина" — это не отдельная категория в БД, а флаг `featuredInVitrina: true` на любом товаре. Управляется через Telegram-бот.

---

## Реквизиты (для футера, оферты, политики)

```
ЧТУП «Лавандер»
УНП 491388960
246050, г. Гомель, ул. Речицкая, 2-64
Тел.: +375 (29) 663-40-23
E-mail: lavander.gomel@mail.ru
р/с BY88 MTBK 3012 0001 0933 0012 7012
ЗАО «МТБанк», БИК MTBKBY22
```

---

## Деплой (hoster.by VPS)

```yaml
# docker-compose.prod.yml (основное)
services:
  web:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file: /etc/lavander/.env
    expose:
      - "3000"

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    env_file: /etc/lavander/.env

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  pgdata:
  caddy_data:
  caddy_config:
```

```
# Caddyfile
lavender.by {
    reverse_proxy web:3000
}
```

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Что НЕЛЬЗЯ делать (частые ошибки)

1. ❌ Хранить деньги в `Float` — только `Int` в копейках
2. ❌ Использовать `new Date()` без учёта таймзоны `Europe/Minsk` в логике слотов
3. ❌ Доверять клиентским данным о цене/слоте/аддонах — всегда пересчитывать на сервере
4. ❌ Вызывать bePaid API из браузера — только через `/api/*` роуты Next.js
5. ❌ Вызывать Cloudinary из браузера — загрузка фото только через сервер (Telegram-бот)
6. ❌ Хардкодить токены и ключи — только через `.env`
7. ❌ Коммитить `.env` в git — он в `.gitignore`
8. ❌ Обрабатывать webhook bePaid до проверки HMAC-подписи
9. ❌ Использовать `npm` или `yarn` — только `pnpm`
10. ❌ `localStorage` в серверном коде (SSR)
11. ❌ Хостить на зарубежном провайдере (Vercel, Netlify) — только hoster.by по законодательству РБ
12. ❌ Менять официальное наименование ЧТУП «Красивый Край» в футере и офертах — нужно для прохождения модерации bePaid

---

## Требования bepaid (статус)

### ✅ Выполнено

- Реквизиты ЧТУП «Красивый Край» в футере (УНП, дата регистрации, орган, Торговый реестр, адрес, режим работы, контакты)
- Логотип bepaid + платёжные системы в футере (`/bepaid-badge.svg`)
- Страница `/delivery` — условия и сроки доставки
- Страница `/payment` — правила оплаты и безопасность *(создать)*

### ⏳ Осталось сделать (код)

- Страница `/payment` — правила оплаты, безопасность платежей, возврат средств
- Страница `/oferta` — публичная оферта (черновик на основе реквизитов ЧТУП)
- Страница `/privacy` — политика конфиденциальности
- Ссылки в футере уже есть, нужны только сами страницы

### ⏳ Осталось сделать (действия клиента)

- Регистрация домена `.by` и хостинг на hoster.by (сервер обязательно в РБ)
- Регистрация в РУП «БелГИЭ» — через hoster.by автоматически при регистрации домена
- Регистрация в Реестре бытовых услуг

### Реквизиты ЧТУП «Красивый Край»

| Поле | Значение |
|---|---|
| УНП | 491388960 |
| Зарегистрировано | Гомельским городским исполнительным комитетом 15.07.2024 |
| Торговый реестр | №747719 от 25.04.2025 |
| Адрес | 246050, г. Гомель, ул. Речицкая, 2-64 |
| Телефон | +375 (29) 119-06-99 |
| Email | lavander.gomel@mail.ru |
| Режим работы | пн–вс 9:00–20:00 |

### bePaid shop_id

| Среда | shop_id | Примечание |
|---|---|---|
| Тест (без 3DS) | 4225 | не использовать |
| Тест (с 3DS) | 4226 | **используем этот** |
| Продакшен | — | получить после подписания договора |
12. ❌ Менять пароль Яндекс-кабинета, если подключат Yandex Delivery — слетит OAuth-токен (`YANDEX_DELIVERY_TOKEN`)
