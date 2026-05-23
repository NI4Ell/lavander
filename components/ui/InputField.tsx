'use client'

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

const baseClasses = [
  'w-full border-[1.5px] border-ink rounded-[6px]',
  'px-[14px] py-[6px] bg-paper text-[14px] text-ink-soft',
  'outline-none focus:border-purple transition-colors',
].join(' ')

const InputField = forwardRef<HTMLInputElement, InputProps>(function InputField(
  { className = '', ...rest },
  ref,
) {
  return <input ref={ref} className={`${baseClasses} ${className}`} {...rest} />
})

export default InputField

// Textarea-вариант с тем же стилем
type TAProps = TextareaHTMLAttributes<HTMLTextAreaElement>
export const TextareaField = forwardRef<HTMLTextAreaElement, TAProps>(
  function TextareaField({ className = '', ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={`${baseClasses} min-h-[72px] resize-y leading-[1.5] ${className}`}
        {...rest}
      />
    )
  },
)
