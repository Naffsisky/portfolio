import Image from 'next/image'
import React from 'react'

const logos = [
  {
    name: 'react',
    url: 'https://skillicons.dev/icons?i=react',
  },
  {
    name: 'laravel',
    url: 'https://skillicons.dev/icons?i=laravel',
  },
  {
    name: 'nextjs',
    url: 'https://skillicons.dev/icons?i=nextjs',
  },
  {
    name: 'typescript',
    url: 'https://skillicons.dev/icons?i=typescript',
  },
  {
    name: 'remixjs',
    url: 'https://skillicons.dev/icons?i=remix',
  },
  {
    name: 'nestjs',
    url: 'https://skillicons.dev/icons?i=nestjs',
  },
  {
    name: 'nuxt',
    url: 'https://skillicons.dev/icons?i=nuxt',
  },
  {
    name: 'docker',
    url: 'https://skillicons.dev/icons?i=docker',
  },
  {
    name: 'php',
    url: 'https://skillicons.dev/icons?i=php',
  },
  {
    name: 'javascript',
    url: 'https://skillicons.dev/icons?i=javascript',
  },
  {
    name: 'mongodb',
    url: 'https://skillicons.dev/icons?i=mongodb',
  },
  {
    name: 'tailwind',
    url: 'https://skillicons.dev/icons?i=tailwind',
  },
]

const TechLogo = () => {
  return (
    <div className="relative flex items-center">
      <div className="relative lg:max-w-screen-lg max-w-[22rem] overflow-hidden py-5">
        <div className="flex w-max animate-marquee [--duration:60s]">
          {[...logos, ...logos].map((logo, index) => (
            <div key={index} className="h-full px-2.5">
              <div className="relative h-full w-[18rem] rounded-2xl border border-white/5 bg-white/5 px-8 py-6">
                <div className="mt-auto flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line */}
                  <img src={logo.url} alt={logo.name} className="h-20 w-20 rounded-full" />
                  <div className="flex flex-col">
                    <h3 className="text-white text-3xl capitalize">{logo.name}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TechLogo
