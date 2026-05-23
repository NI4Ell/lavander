'use client'

import Pill from '@/components/ui/Pill'

export type DeliveryType = 'DELIVERY' | 'PICKUP'

interface Props {
  value: DeliveryType
  onChange: (value: DeliveryType) => void
}

export default function DeliveryToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-[10px] flex-wrap">
      <Pill active={value === 'DELIVERY'} onClick={() => onChange('DELIVERY')}>
        доставка
      </Pill>
      <Pill active={value === 'PICKUP'} onClick={() => onChange('PICKUP')}>
        самовывоз
      </Pill>
    </div>
  )
}
