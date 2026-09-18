import { ArrowUpRight } from 'lucide-react'
import CustomImage from '@/components/CustomImage'
import { certificate } from './data/certificates'
import styles from '@/app/content.module.css'

export default function Certificates() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>CERTIFICATES / ALWAYS LEARNING</p>
        <h1>Learning, put into practice.</h1>
        <p>Milestones from my learning journey in software development, cloud computing, and beyond.</p>
      </header>
      <p className={styles.resultCount}>{certificate.length} certificates</p>
      <div className={styles.grid}>
        {certificate.map(cert => (
          <a key={cert.link} href={cert.link} target="_blank" rel="noopener noreferrer" className={styles.card}>
            <span className={styles.imageFrame}><CustomImage src={cert.link} alt={cert.alt} /></span>
            <div className={styles.cardBody}>
              <h2>{cert.alt.replace('Certificate of Completion for ', '')}</h2>
              <span className={styles.textLink}>View certificate <ArrowUpRight size={16} /></span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
