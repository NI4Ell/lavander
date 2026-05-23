'use client'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
}

/**
 * Кастомный чекбокс 22×22 в стиле макета.
 * Внутри — настоящий <input type="checkbox" className="sr-only">,
 * поэтому любой <label>, оборачивающий этот компонент,
 * работает нативно — клик по тексту переключает состояние.
 *
 * unchecked: белый с лиловой рамкой
 * checked:   фон --lav + SVG-галочка
 */
export default function Checkbox({ checked, onChange, id }: Props) {
  return (
    <span className="relative inline-flex shrink-0">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={[
          'inline-flex items-center justify-center',
          'w-[22px] h-[22px] rounded-[5px] border-[1.5px] cursor-pointer transition-colors',
          checked ? 'bg-lav border-lav' : 'bg-paper border-[#b8a8d0]',
        ].join(' ')}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 7.5L6 10.5L11.5 4"
              stroke="#1f1a24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </span>
  )
}
