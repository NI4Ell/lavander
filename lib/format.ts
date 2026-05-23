/**
 * Форматирует цену в копейках в строку "89,00 BYN".
 * Работает и на сервере, и на клиенте — не зависит от Zustand.
 */
export function formatPrice(kopecks: number): string {
  return (kopecks / 100).toLocaleString('ru-BY', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 2,
  })
}
