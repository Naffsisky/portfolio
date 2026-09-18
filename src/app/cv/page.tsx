import { ArrowUpRight, FileText } from 'lucide-react'
import styles from '@/app/content.module.css'

const resumeUrl = 'https://is3.cloudhost.id/public-data/Prinafsika-resume-new.pdf'

export default function Cv() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>RÉSUMÉ / THE JOURNEY SO FAR</p>
        <h1>Experience, at a glance.</h1>
        <p>Software developer working across DevOps and infrastructure. Cybersecurity and system analyst enthusiast.</p>
      </header>
      <div className={styles.actions}>
        <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.button}><FileText size={17} /> Open résumé PDF <ArrowUpRight size={16} /></a>
        <span className="text-sm text-slate-500">Use the PDF viewer to save a copy.</span>
      </div>
      <iframe src={resumeUrl} className={styles.resume} title="Prinafsika résumé PDF" />
      <p className="mt-4 text-sm text-slate-500">Preview not loading? Open the PDF using the button above.</p>
    </div>
  )
}
