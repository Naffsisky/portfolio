'use client'

import React, { useState } from 'react'
import { Card, Image, Chip } from '@nextui-org/react'
import Link from 'next/link'
import LoadingAnimation from '@/components/AnimationLoading'
import { projects, tagColors } from '@/app/projects/data/projects'

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
        <div className="my-10 text-center">
          <p className="text-white text-sm">
            Some project can be live preview in here{' '}
            <Link href="https://live.webinap.com" className="text-purple-500 underline font-semibold">
              Demo Project!
            </Link>
          </p>
        </div>
        <section className="mt-10">
          <div className="grid gap-6">
            {visibleProjects.map((project) => (
              <Card key={project.id} className="flex flex-col md:flex-row items-center bg-zinc-800 p-3 rounded-lg border-2 border-violet-500">
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
                    className={`rounded-lg w-full h-auto border-1 border-white transition-opacity ${loadingImages[project.id] ? 'opacity-0' : 'opacity-100'}`}
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
                  <Link href={`/projects/${project.slug}`} className="mt-3 text-sm text-violet-400 hover:underline">
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
