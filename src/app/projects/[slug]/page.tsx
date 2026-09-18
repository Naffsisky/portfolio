import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import CustomImage from '@/components/CustomImage'
import { projects } from '../data/projects'
import styles from '@/app/content.module.css'

export default function ProjectDetail({ params }: { params: { slug: string } }) {
  const project = projects.find(project => project.slug === params.slug)
  if (!project) notFound()

  return (
    <div className={styles.page}>
      <Link href="/projects" className={styles.back}><ArrowLeft size={16} /> Back to projects</Link>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>PROJECT / {project.tags.join(' + ')}</p>
        <h1>{project.name}</h1>
        <p>{project.description}</p>
      </header>
      <section className={styles.panel} aria-labelledby="stack-title">
        <h2 id="stack-title">Built with</h2>
        <div className={styles.tags}>{project.tech_stack?.map(tech => <span key={tech}>{tech}</span>)}</div>
      </section>
      <section className={styles.section} aria-labelledby="gallery-title">
        <h2 id="gallery-title">A closer look</h2>
        <div className={styles.twoColumns}>
          {project.photo.map((photo, index) => (
            <a key={photo} href={photo} target="_blank" rel="noopener noreferrer" className={styles.card}>
              <span className={styles.imageFrame}><CustomImage src={photo} alt={`${project.name} — screenshot ${index + 1}`} /></span>
              <div className={styles.cardBody}><span className={styles.textLink}>Open screenshot {index + 1} <ArrowUpRight size={15} /></span></div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
