'use client'

import Image from 'next/image'
import { useState } from 'react'
import PhotoLightbox from './PhotoLightbox'

interface Photo {
  url: string
  position: number
}

interface Props {
  photos: Photo[]
  name: string
}

// crosshatch placeholder style
const PH_BG = 'repeating-linear-gradient(135deg, transparent 0 10px, rgba(31,26,36,0.08) 10px 11px)'

export default function ProductGallery({ photos, name }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const mainPhoto = photos[activeIdx]

  return (
    <div>
      {/* ── Main photo ─────────────────────────── */}
      {mainPhoto ? (
        <PhotoLightbox
          photos={photos.map((p) => p.url)}
          initialIndex={activeIdx}
          alt={name}
        >
          <div className="relative w-full aspect-square border-[1.5px] border-ink rounded-[4px] overflow-hidden bg-paper-2">
            <Image
              src={mainPhoto.url}
              alt={name}
              fill
              priority
              sizes="(max-width: 768px) calc(100vw - 32px), 55vw"
              className="object-cover"
            />
          </div>
        </PhotoLightbox>
      ) : (
        <div className="relative w-full aspect-square border-[1.5px] border-ink rounded-[4px] overflow-hidden bg-paper-2">
          <div
            className="absolute inset-0 flex items-center justify-center text-ink-soft text-[15px]"
            style={{ background: PH_BG }}
          >
            фото букета
          </div>
        </div>
      )}

      {/* ── Thumbnails (always 4 slots) ─────────── */}
      <div className="mt-3 grid grid-cols-4 gap-[10px]">
        {Array.from({ length: 4 }, (_, i) => {
          const photo = photos[i]
          const isActive = i === activeIdx
          return (
            <button
              key={i}
              disabled={!photo}
              onClick={() => photo && setActiveIdx(i)}
              className={[
                'relative aspect-square border-[1.5px] border-ink rounded-[4px] overflow-hidden bg-paper-2',
                'transition-[box-shadow] duration-150',
                photo ? 'cursor-pointer' : 'cursor-default opacity-50',
                isActive && photo ? 'ring-2 ring-offset-1 ring-purple' : '',
              ].join(' ')}
              aria-label={photo ? `Фото ${i + 1}` : undefined}
            >
              {photo ? (
                <Image
                  src={photo.url}
                  alt={`${name} — фото ${i + 1}`}
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: PH_BG }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
