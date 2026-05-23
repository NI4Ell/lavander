'use client'

import Checkbox from '@/components/ui/Checkbox'
import InputField from '@/components/ui/InputField'

interface Props {
  enabled: boolean
  phone: string
  onEnabledChange: (v: boolean) => void
  onPhoneChange: (v: string) => void
}

/**
 * Блок "фото перед отправкой" — pink-soft фон, dashed border (.jh-photo-block).
 */
export default function PhotoBlock({
  enabled,
  phone,
  onEnabledChange,
  onPhoneChange,
}: Props) {
  return (
    <div className="mt-[14px] p-[14px] border-[1.5px] border-dashed border-ink rounded-[10px] bg-pink-soft flex flex-col gap-2">
      <label className="flex items-center gap-[10px] cursor-pointer text-[15px] select-none">
        <Checkbox checked={enabled} onChange={onEnabledChange} />
        <span>фото перед отправкой</span>
      </label>
      <p className="text-[14px] text-ink-soft leading-[1.4] m-0">
        пришлём фото готового букета на ваш номер до того, как передадим его курьеру
      </p>

      {enabled && (
        <div className="flex flex-col gap-1 mt-1">
          <label className="text-[13px] text-ink-soft">ваш номер для фото</label>
          <InputField
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+375 (__) ___-__-__"
          />
        </div>
      )}
    </div>
  )
}
