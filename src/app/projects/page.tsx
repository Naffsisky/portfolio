'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import CustomImage from '@/components/CustomImage'
import ProgrammingTopology from '@/components/ProgrammingTopology'
import { projects } from './data/projects'
import styles from '@/app/content.module.css'

const categories = ['All', ...Array.from(new Set(projects.flatMap(project => project.tags)))]

export default function Projects() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [visibleCount, setVisibleCount] = useState(6)
  const filteredProjects = selectedCategory === 'All' ? projects : projects.filter(project => project.tags.includes(selectedCategory))

  return (
    <div className={styles.page}>
      <div className={styles.projectsHero}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>PROJECTS / FROM IDEA TO DEPLOYMENT</p>
          <h1>Code, cloud, and everything in between.</h1>
          <p>A collection of software, interfaces, APIs, and infrastructure projects. Built to learn, solve problems, and put ideas into practice.</p>
        </header>
        <ProgrammingTopology />
      </div>
      <div className={styles.filters} aria-label="Project categories">
        {categories.map(category => (
          <button key={category} type="button" className={styles.filter} aria-pressed={selectedCategory === category}
            onClick={() => { setSelectedCategory(category); setVisibleCount(6) }}>{category}</button>
        ))}
      </div>
      <div className={styles.resultCount}>
        <p aria-live="polite">{filteredProjects.length} projects · {selectedCategory}</p>
        <a href="https://live.webinap.com" target="_blank" rel="noopener noreferrer" className={styles.textLink}>Explore live demos <ArrowUpRight size={15} /></a>
      </div>
      <div className={styles.grid}>
        {filteredProjects.slice(0, visibleCount).map(project => (
          <Link key={project.id} href={`/projects/${project.slug}`} className={styles.card}>
            <span className={styles.imageFrame}><CustomImage src={project.image} alt={project.name} /></span>
            <div className={styles.cardBody}>
              <h2>{project.name}</h2>
              <p>{project.tech_stack?.join(' · ')}</p>
              <div className={styles.tags}>{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
              <span className={styles.textLink}>View project <ArrowUpRight size={16} /></span>
            </div>
          </Link>
        ))}
      </div>
      {visibleCount < filteredProjects.length && <div className={styles.loadMore}><button type="button" className={styles.secondaryButton} onClick={() => setVisibleCount(count => count + 6)}>Load more projects</button></div>}
    </div>
  )
}
