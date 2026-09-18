import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ChevronDown, Gamepad2, Fingerprint, Palette, Telescope } from 'lucide-react'
import Experience from '@/components/Experience'
import SecurityTopology from '@/components/SecurityTopology'
import styles from '@/app/content.module.css'

const interests = ['Software development', 'DevOps & infrastructure', 'Cybersecurity enthusiast', 'System analyst enthusiast']
const details = [
  { title: 'Outside the terminal', subtitle: 'A few ways I recharge', icon: Gamepad2, topic: 'life', content: 'Gaming, coding, cooking, and taking a break at the beach or in the mountains.', tags: ['Gaming', 'Cooking', 'Beach & mountains'] },
  { title: 'Personality', subtitle: 'The person behind the problem-solving', icon: Fingerprint, topic: 'personality', content: 'INTJ-T, according to 16personalities.com: 65% introverted, 57% intuitive, 53% thinking, 82% judging, and 57% turbulent.', tags: ['INTJ-T', 'Introverted', 'Curious'] },
  { title: 'Favorite colors', subtitle: 'My personal palette', icon: Palette, topic: 'palette', content: 'Black and navy, with a soft spot for white and purple.', tags: ['Black', 'Navy', 'White', 'Purple'] },
  { title: 'Currently exploring', subtitle: 'There’s always something new to learn', icon: Telescope, topic: 'learning', content: 'Next.js, React, databases, cloud infrastructure, and DevOps. I’m also learning about cybersecurity, requirements analysis, business processes, and system design.', tags: ['Software development', 'Cybersecurity', 'System analysis'] },
]

export default function About() {
  return (
    <div className={styles.page}>
      <div className={styles.aboutHero}>
        <div className={styles.bio}>
          <h1 className={styles.eyebrow}>ABOUT / THE PERSON BEHIND THE CODE</h1>
          <p>I’m a software developer and Computer Science graduate from UPN Veteran Jawa Timur. My work spans full-stack applications, APIs, cloud computing, system administration, and deployment automation.</p>
          <p>I’m also a cybersecurity and system analyst enthusiast. I’m interested in how applications can be made safer, how people use them, and how business needs become clear technical requirements.</p>
          <div className={styles.interests}>{interests.map(interest => <span key={interest}>{interest}</span>)}</div>
          <div className={styles.actions}><Link href="/cv" className={styles.button}>View résumé <ArrowUpRight size={16} /></Link><Link href="/projects" className={styles.secondaryButton}>Explore my work</Link></div>
        </div>
        <SecurityTopology />
      </div>
      <div className={styles.twoColumns}>
        <section className={styles.academicEntry} aria-labelledby="publication-title">
          <p className={styles.eyebrow}>PUBLICATION / AUGUST 2025</p>
          <h2 id="publication-title">Cloud-Based High Availability Architecture Using Least Connection Load Balancer and Integrated Alert System</h2>
          <p className={styles.postMeta}>bit-Tech · Vol. 8, No. 1 · DOI: 10.32877/bt.v8i1.2520</p>
          <p>Co-authored with Achmad Junaidi and Muhammad Muharrom Al Haromainy. This research explores cloud service reliability using Nginx Least Connection load balancing across Alibaba Cloud and Google Cloud, with real-time Telegram alerts and k6 load testing.</p>
          <div className={styles.actions}><a href="https://jurnal.kdi.or.id/index.php/bt/article/view/2520" target="_blank" rel="noopener noreferrer" className={styles.textLink}>Read the journal article <ArrowUpRight size={16} /></a></div>
        </section>
        <section className={styles.academicEntry} aria-labelledby="education-title">
          <p className={styles.eyebrow}>EDUCATION / 2021–2025</p>
          <h2 id="education-title"><Image src="/images/company/upn.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />UPN Veteran Jawa Timur</h2>
          <p>Bachelor’s degree in Informatics<br />GPA 3.94 / 4.00</p>
          <div className={styles.actions}><Link href="/certificates" className={styles.textLink}>Explore certificates <ArrowUpRight size={16} /></Link></div>
        </section>
      </div>
      <section className={styles.section} aria-labelledby="experience-title">
        <p className={styles.eyebrow}>EXPERIENCE / LEARNING BY DOING</p>
        <h2 id="experience-title">Where I’ve contributed.</h2>
        <div className={styles.timeline}><Experience /></div>
      </section>
      <section className={styles.personalSection} aria-labelledby="personal-title">
        <div className={styles.personalIntro}>
          <p className={styles.eyebrow}>OFF THE CLOCK / STILL CURIOUS</p>
          <h2 id="personal-title">A little more <br />human, a little <br /><span>less terminal.</span></h2>
          <p>The interests, little preferences, and things I’m learning along the way. Open a note and get to know me.</p>
          <span className={styles.personalFootnote}>4 personal notes · plenty left to explore</span>
        </div>
        <div className={styles.accordion}>
          {details.map(({ title, subtitle, icon: Icon, topic, content, tags }, index) => (
            <details key={topic} className={styles.details} data-topic={topic} open={index === 0}>
              <summary>
                <span className={styles.detailIcon}><Icon size={21} aria-hidden="true" /></span>
                <span className={styles.detailTitle}><strong>{title}</strong><span>{subtitle}</span></span>
                <span className={styles.detailToggle}><ChevronDown size={17} aria-hidden="true" /></span>
              </summary>
              <div className={styles.detailBody}>
                <p>{content}</p>
                <div className={styles.detailTags}>{tags.map(tag => <span key={tag}>{tag}</span>)}</div>
              </div>
            </details>
          ))}
        </div>
      </section>
      <section className={styles.section} aria-labelledby="gallery-title">
        <h2 id="gallery-title">Beyond the code.</h2>
        <div className={styles.gallery}>{[1, 2, 3, 6, 5, 4].map((photo, index) => <Image key={photo} src={`/images/profile/${photo}.png`} alt={`A moment from Prinafsika’s journey, photo ${index + 1}`} width={400} height={400} />)}</div>
      </section>
    </div>
  )
}
