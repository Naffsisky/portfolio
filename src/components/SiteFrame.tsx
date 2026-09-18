'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import styles from '@/app/home.module.css'

const links = [['/', 'Home'], ['/about', 'About'], ['/projects', 'Projects'], ['/blog', 'Blog'], ['/certificates', 'Certificates']]

export default function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <div className={styles.home}>
      <a className={styles.skipLink} href="#main">Skip to content</a>
      <header className={styles.header} onKeyDown={event => {
        if (event.key === 'Escape' && menuOpen) {
          setMenuOpen(false)
          menuButton.current?.focus()
        }
      }}>
        <div className={styles.headerInner}>
          <button ref={menuButton} type="button" className={styles.menuToggle} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="header-menu" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
          <div id="header-menu" className={styles.headerMenu} data-open={menuOpen}>
            <nav className={styles.nav} aria-label="Main navigation">
              {links.map(([href, label]) => (
                <Link key={href} href={href === '/blog' ? '/blog?category=All' : href} onClick={() => setMenuOpen(false)} aria-current={pathname === href || pathname.startsWith(href + '/') ? 'page' : undefined}>{label}</Link>
              ))}
            </nav>
            <Link href="/cv" className={styles.resume} onClick={() => setMenuOpen(false)} aria-current={pathname === '/cv' ? 'page' : undefined}>View résumé <ArrowUpRight size={16} /></Link>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Prinafsika</span>
        <span>Crafted with code. Deployed with care.</span>
        <div>
          <a href="https://linkedin.com/in/prinafsika/" target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={12} /></a>
          <a href="https://github.com/Naffsisky" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={12} /></a>
        </div>
      </footer>
    </div>
  )
}
