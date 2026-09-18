'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'

export default function CustomImage({ src, alt }: { src: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string>()
  const [imageAlt, caption] = alt.split('|').map(part => part.trim())

  return (
    <span className="block w-full">
      {failedSrc === src ? (
        <span role="img" aria-label={imageAlt} className="flex min-h-48 h-full flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center text-sm text-slate-500">
          <ImageOff size={26} aria-hidden="true" />
          <span>Image unavailable</span>
          <span className="text-xs">{imageAlt}</span>
        </span>
      ) : (
        <Image src={src} alt={imageAlt} loading="lazy" width={800} height={500} unoptimized onError={() => setFailedSrc(src)} className="h-auto w-full rounded-lg object-contain" />
      )}
      {caption && <span className="mt-2 block text-center text-sm text-slate-500">{caption}</span>}
    </span>
  )
}
