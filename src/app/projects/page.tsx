'use client'

import React, { useState } from 'react'
import { Card, Image, Chip } from '@nextui-org/react'
import Link from 'next/link'
import LoadingAnimation from '@/components/AnimationLoading'
import { projects } from '@/app/projects/data/projects'

const tagColors: Record<string, string> = {
  'Full Stack': 'bg-red-400 border-red-500',
  Frontend: 'bg-teal-400 border-teal-500',
  Backend: 'bg-purple-400 border-purple-500',
  DevOps: 'bg-sky-400 border-sky-500',
  'React JS': 'bg-sky-500 border-sky-600',
  'UI/UX': 'bg-yellow-400 border-yellow-500',
  'CI/CD': 'bg-red-500 border-red-600',
  Figma: 'bg-purple-400 border-purple-500',
  Docker: 'bg-blue-400 border-blue-500',
  PHP: 'bg-indigo-500 border-indigo-600',
  Tailwind: 'bg-cyan-400 border-cyan-500',
  'System Admin': 'bg-green-500 border-green-600',
  'Next JS': 'bg-amber-400 border-amber-500',
  Bootstrap: 'bg-purple-500 border-purple-600',
  Laravel: 'bg-rose-500 border-rose-600',
}

const categories: string[] = ['All', ...Array.from(new Set(projects.flatMap((p) => p.tags)))]

function Projects() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [visibleCount, setVisibleCount] = useState(5)

  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>(
    projects.reduce((acc, project) => {
      acc[project.id] = true
      return acc
    }, {} as Record<number, boolean>)
  )

  const filteredProjects = selectedCategory === 'All' ? projects : projects.filter((p) => p.tags.includes(selectedCategory))
  const visibleProjects = filteredProjects.slice(0, visibleCount)

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between lg:p-24 p-7 bg-zinc-900 lg:ml-64">
      <h2 className="text-3xl font-bold text-purple-500 pb-5">Projects</h2>
      <div className="py-5">
        <section>
          <div className="flex items-center justify-center flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  setVisibleCount(5)
                }}
                className={`text-white border ${
                  tagColors[category] || 'bg-neutral-400 border-neutral-500'
                } hover:border-white focus:ring-4 focus:outline-none focus:ring-gray-300 rounded-full text-base font-medium px-5 py-2.5 text-center me-3 mb-3 ${selectedCategory === category ? 'ring-2 ring-white' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>
        <section className="mt-10">
          <div className="max-w-[900px] grid gap-6">
            {visibleProjects.map((project) => (
              <Card key={project.id} className="flex flex-col md:flex-row items-center bg-zinc-800 p-3 rounded-lg">
                <div className="relative w-full md:w-[400px]">
                  {loadingImages[project.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                      <LoadingAnimation />
                    </div>
                  )}
                  <Image
                    src={project.image}
                    alt={project.name}
                    width={400}
                    height={200}
                    className={`rounded-lg w-full h-auto transition-opacity ${loadingImages[project.id] ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setLoadingImages((prev) => ({ ...prev, [project.id]: false }))}
                    onError={() => setLoadingImages((prev) => ({ ...prev, [project.id]: false }))}
                  />
                </div>

                {/* Konten */}
                <div className="mt-4 md:mt-0 md:ml-4 flex flex-col flex-1 text-center md:text-left">
                  <h3 className="text-lg font-bold text-white">{project.name}</h3>

                  {/* Tags */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                    {project.tags.map((tag, index) => (
                      <Chip key={index} className={`text-white ${tagColors[tag] || 'bg-gray-400 border-gray-500'}`}>
                        {tag}
                      </Chip>
                    ))}
                  </div>

                  {/* Link */}
                  <Link href={`/projects/${project.name.toLowerCase().replace(/\s+/g, '-')}`} className="mt-3 text-sm text-violet-400 hover:underline">
                    View Project →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          {visibleCount < filteredProjects.length && (
            <div className="flex justify-center mt-6">
              <button onClick={handleLoadMore} className="bg-purple-500 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition">
                Load More
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Projects
