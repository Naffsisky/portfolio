import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import styles from './content.module.css'

export default function NotFound() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>404 / ROUTE NOT FOUND</p>
        <h1>This route leads nowhere.</h1>
        <p>The page may have moved, or the address may be incorrect.</p>
      </header>
      <Link href="/" className={styles.button}><ArrowLeft size={16} /> Back to home</Link>
    </div>
  )
}
