'use client'

interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
}

const MinusIcon = () => (
  <svg width="14" height="2" viewBox="0 0 14 2" fill="none">
    <line x1="1" y1="1" x2="13" y2="1" stroke="#1f1a24" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="7" y1="1" x2="7" y2="13" stroke="#1f1a24" strokeWidth="2" strokeLinecap="round" />
    <line x1="1" y1="7" x2="13" y2="7" stroke="#1f1a24" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export default function Qty({ value, onChange, min = 1 }: Props) {
  return (
    <div className="inline-flex items-center border-[1.5px] border-ink rounded-[8px] overflow-hidden text-[22px]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-[42px] flex items-center justify-center py-[6px] cursor-pointer hover:bg-lav-soft transition-colors"
        aria-label="Уменьшить"
      >
        <MinusIcon />
      </button>
      <b className="px-[18px] py-[6px] border-l-[1.5px] border-r-[1.5px] border-ink min-w-[50px] text-center font-normal">
        {value}
      </b>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-[42px] flex items-center justify-center py-[6px] cursor-pointer hover:bg-lav-soft transition-colors"
        aria-label="Увеличить"
      >
        <PlusIcon />
      </button>
    </div>
  )
}
