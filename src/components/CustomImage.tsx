import React from 'react'
import Image from 'next/image'

const CustomImage = ({ src, alt }: { src: string; alt: string }) => {
  const parts = alt.split('|')
  const imageAlt = parts[0].trim()
  const caption = parts.length > 1 ? parts[1].trim() : null

  return (
    <div className="flex flex-col items-center my-8">
      <div className="max-w-full">
        <Image src={src} alt={imageAlt} loading="lazy" width={600} height={400} unoptimized className="w-full max-w-full object-contain rounded-lg" />
      </div>
      {caption && <div className="text-center text-gray-400 mt-2">{caption}</div>}
    </div>
  )
}

export default CustomImage
