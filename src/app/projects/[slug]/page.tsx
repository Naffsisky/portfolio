'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { Image } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VscArrowLeft } from 'react-icons/vsc'
import LoadingAnimation from '@/components/AnimationLoading'
import { projects } from '@/app/projects/data/projects'

export default function ProjectDetail({ params }: { params: { slug: string } }) {
  const project = projects.find((p) => p.slug === params.slug)
  const router = useRouter()
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>(
    projects.reduce((acc, project) => {
      acc[project.id] = true
      return acc
    }, {} as Record<number, boolean>)
  )

  if (!project) return notFound()

  return (
    <div className="flex min-h-screen flex-col items-center p-7 bg-zinc-900 lg:ml-64">
      <div className="w-full flex items-center justify-between relative py-3">
        <button onClick={() => router.back()} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-700 transition hidden lg:block">
          <VscArrowLeft />
        </button>
        <h2 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold text-purple-500">{project.name}</h2>
      </div>

      <p className="text-white max-w-2xl text-justify pt-3">{project.description}</p>
      <div className="flex flex-col">
        <h3 className="text-2xl font-bold text-purple-500 pt-5 pb-2">Tech Stack</h3>
        <ul className="list-disc text-white self-start">
          {project.tech_stack?.map((tech) => (
            <li className="list-outside" key={tech}>
              {tech} ✅
            </li>
          ))}
        </ul>
      </div>

      <div className="border-2 border-purple-500 p-5 shadow-lg shadow-purple-500 mt-5 w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.photo.map((photo, index) => (
            <div key={photo} className="relative flex justify-center">
              {loadingImages[project.id] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <LoadingAnimation />
                </div>
              )}

              <Link href={photo} target="_blank">
                <Image
                  src={photo}
                  alt={project.name}
                  width={400}
                  height={300}
                  className="border-2 border-indigo-500 rounded-lg hover:scale-105 transition opacity-0"
                  onLoad={() => setLoadingImages((prev) => ({ ...prev, [project.id]: false }))}
                  onError={() => setLoadingImages((prev) => ({ ...prev, [project.id]: false }))}
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
