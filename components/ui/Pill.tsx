'use client'

interface Props {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export default function Pill({ active = false, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-[6px] px-[14px] py-[6px]',
        'border-[1.5px] border-ink rounded-full',
        'text-[14px] cursor-pointer transition-colors',
        active ? 'bg-lav' : 'bg-paper hover:bg-lav-soft',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
