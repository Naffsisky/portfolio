'use client'

'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { certificate } from '@/app/certificates/data/certificates'
import LoadingAnimation from '@/components/AnimationLoading'

function Certificates() {
  const [loadingImages, setLoadingImages] = useState(
    certificate.reduce((acc, _, index) => {
      acc[index] = true
      return acc
    }, {} as Record<number, boolean>)
  )

  const handleImageLoad = (index: number) => {
    setLoadingImages((prev) => ({
      ...prev,
      [index]: false,
    }))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between lg:p-24 p-7 bg-zinc-900 lg:ml-64">
      <h2 className="text-3xl font-bold text-purple-500 pb-5">Certificates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {certificate.map((cert, index) => (
          <div key={index} className="border-4 border-violet-500 shadow-violet-500 rounded-lg p-2 shadow-lg hover:scale-105 transition-transform relative">
            {loadingImages[index] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <LoadingAnimation />
              </div>
            )}
            <Link href={cert.link} target="_blank">
              <Image
                src={cert.link}
                alt={cert.alt}
                width={400}
                height={300}
                className={`rounded-md w-full h-auto transition-opacity ${loadingImages[index] ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageLoad(index)}
                loading="lazy"
              />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Certificates
