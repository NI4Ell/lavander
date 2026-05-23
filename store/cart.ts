import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  /** Product id (cuid) */
  id: string
  slug: string
  name: string
  /** URL of the first photo (position 0) */
  photoUrl: string | null
  /** Actual price paid (discountPrice ?? basePrice) — in kopecks */
  price: number
  qty: number

  // ── Аддоны ─────────────────────────────────────────
  hasPostcard?: boolean
  postcardText?: string
  hasAquabox?: boolean
  hasBag?: boolean
  /** Сумма цен выбранных аддонов на одну единицу товара, в копейках. Сервер пересчитает. */
  addonsPrice?: number
}

interface CartState {
  items: CartItem[]
  /** qty defaults to 1; pass a larger value from the product page qty-picker */
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, qty = 1) {
        const existing = get().items.find((i) => i.id === product.id)
        if (existing) {
          // Увеличиваем qty и заменяем аддоны на последние выбранные
          set((s) => ({
            items: s.items.map((i) =>
              i.id === product.id
                ? { ...i, ...product, qty: i.qty + qty }
                : i,
            ),
          }))
        } else {
          set((s) => ({ items: [...s.items, { ...product, qty }] }))
        }
      },

      removeItem(id) {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
      },

      updateQty(id, qty) {
        if (qty < 1) {
          set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
        } else {
          set((s) => ({
            items: s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
          }))
        }
      },

      clearCart() {
        set({ items: [] })
      },
    }),
    {
      name: 'lavander-cart',
      // Only runs on client — safe for Next.js SSR
      skipHydration: false,
    },
  ),
)

// ── Selectors ────────────────────────────────────────────
export const selectItemCount = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.qty, 0)

export const selectTotal = (s: CartState) =>
  s.items.reduce((acc, i) => acc + (i.price + (i.addonsPrice ?? 0)) * i.qty, 0)

// Re-export for convenience — but prefer @/lib/format in server components
export { formatPrice } from '@/lib/format'
