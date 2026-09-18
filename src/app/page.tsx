import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, Cloud, Code2, GitBranch, Layers3, ShieldCheck, Workflow, Terminal, AppWindow, Database, LockKeyhole, FileSearch, ListChecks } from 'lucide-react'
import { SiDocker, SiGithub, SiGooglecloud, SiKubernetes, SiLinux } from 'react-icons/si'
import CloudTopology from '@/components/CloudTopology'
import { projects } from '@/app/projects/data/projects'
import styles from './home.module.css'

export default function Home() {
  return (
    <>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><span className={styles.statusDot} /> SOFTWARE DEVELOPER · DEVOPS & INFRASTRUCTURE</div>
            <p className={styles.intro}>Hi, I&apos;m Prinafsika <span aria-hidden="true">✳</span></p>
            <h1 id="hero-title">Good code.<br />Great <span>infrastructure.</span></h1>
            <p className={styles.heroDescription}>I develop software and the infrastructure behind it. From thoughtful applications to reliable deployments—with a growing interest in cybersecurity and system analysis.</p>
            <div className={styles.heroActions}>
              <Link href="/projects" className={styles.primaryButton}>Explore my work <ArrowUpRight size={18} /></Link>
              <a href="https://github.com/Naffsisky" target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}><SiGithub size={19} /> GitHub <ArrowUpRight size={15} /></a>
            </div>
            <div className={styles.heroNote}><span className={styles.mono}>01 —</span> Building. Deploying. Always learning.</div>
          </div>
          <CloudTopology />
          <a href="#expertise" className={styles.scrollHint}><ArrowDown size={14} /> A little more about what I do</a>
        </section>

        <div className={styles.stackBar} aria-label="Technology focus">
          <span className={styles.stackLabel}>TOOLS OF THE TRADE</span>
          <span><SiDocker /> Docker</span><span><SiKubernetes /> Kubernetes</span><span><SiGooglecloud /> Google Cloud</span><span><SiLinux /> Linux</span><span><GitBranch /> CI/CD</span>
        </div>

        <section id="expertise" className={styles.section} aria-labelledby="expertise-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>01 / WHAT I DO</p><h2 id="expertise-title">Built with purpose. Ready to scale.</h2></div>
            <p>Developing software. Running infrastructure.<br />Exploring security and system analysis.</p>
          </div>
          <div className={styles.expertiseGrid}>
            <article className={styles.expertiseCard}><span className={styles.cardIcon}><Code2 /></span><span className={styles.cardNumber}>01</span><h3>Software development</h3><p>Thoughtful interfaces, dependable APIs, and full-stack applications that solve real problems.</p><div className={styles.tags}><span>Next.js</span><span>Laravel</span><span>TypeScript</span></div></article>
            <article className={styles.expertiseCard}><span className={styles.cardIcon}><Cloud /></span><span className={styles.cardNumber}>02</span><h3>Cloud & infrastructure</h3><p>From virtual machines to containerized workloads. Infrastructure built for reliability and room to grow.</p><div className={styles.tags}><span>Google Cloud</span><span>Docker</span><span>Kubernetes</span></div></article>
            <article className={styles.expertiseCard}><span className={styles.cardIcon}><GitBranch /></span><span className={styles.cardNumber}>03</span><h3>DevOps & automation</h3><p>Repeatable builds, automated deployments, and less manual work between a commit and production.</p><div className={styles.tags}><span>Jenkins</span><span>GitHub Actions</span><span>Linux</span></div></article>
          </div>
        </section>

        <section id="focus" className={styles.section} aria-labelledby="focus-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>02 / BUILD · SECURE · UNDERSTAND</p><h2 id="focus-title">More than infrastructure.</h2></div>
            <p>Software development at the core.<br />Security and system analysis on the horizon.</p>
          </div>
          <div className={styles.focusGrid}>
            <article className={styles.focusCard} data-focus="software">
              <div className={styles.focusVisual}>
                <span className={styles.focusLabel}>01 / BUILDING</span>
                <div className={styles.focusFlow} aria-hidden="true"><span><Code2 /></span><ArrowRight /><span><Database /></span><ArrowRight /><span><AppWindow /></span></div>
                <span className={styles.focusCaption}>idea → code → application</span>
              </div>
              <div className={styles.focusBody}>
                <h3>Software developer</h3>
                <p>I turn ideas into working products, connecting thoughtful interfaces with APIs, databases, and the logic behind them.</p>
                <div className={styles.tags}><span>Full-stack applications</span><span>API development</span><span>Databases</span></div>
                <Link href="/projects" className={styles.textLink}>Explore my software projects <ArrowUpRight size={16} /></Link>
              </div>
            </article>
            <article className={styles.focusCard} data-focus="security">
              <div className={styles.focusVisual}>
                <span className={styles.focusLabel}>02 / EXPLORING</span>
                <div className={styles.focusFlow} aria-hidden="true"><span><AppWindow /></span><ArrowRight /><span><ShieldCheck /></span><ArrowRight /><span><LockKeyhole /></span></div>
                <span className={styles.focusCaption}>understand → protect → improve</span>
              </div>
              <div className={styles.focusBody}>
                <h3>Cybersecurity enthusiast</h3>
                <p>Learning how systems can fail, how to recognize threats, and how secure development and defensive practices can make a difference.</p>
                <div className={styles.tags}><span>Application security</span><span>Blue team</span><span>Secure configuration</span></div>
                <Link href="/blog/hashicorp-vault-setup" className={styles.textLink}>Read my notes on secrets management <ArrowUpRight size={16} /></Link>
              </div>
            </article>
            <article className={styles.focusCard} data-focus="analysis">
              <div className={styles.focusVisual}>
                <span className={styles.focusLabel}>03 / EXPLORING</span>
                <div className={styles.focusFlow} aria-hidden="true"><span><FileSearch /></span><ArrowRight /><span><Workflow /></span><ArrowRight /><span><ListChecks /></span></div>
                <span className={styles.focusCaption}>requirements → process → solution</span>
              </div>
              <div className={styles.focusBody}>
                <h3>System analyst enthusiast</h3>
                <p>Exploring the why before the how: understanding user needs, mapping business processes, and translating them into clearer system designs.</p>
                <div className={styles.tags}><span>Requirements analysis</span><span>Process modeling</span><span>System design</span></div>
                <Link href="/about#personal-title" className={styles.textLink}>Discover what I’m learning <ArrowUpRight size={16} /></Link>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.workSection} aria-labelledby="work-title">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>03 / SELECTED WORK</p><h2 id="work-title">A few things I&apos;ve shipped.</h2></div><Link href="/projects" className={styles.textLink}>All projects <ArrowUpRight size={17} /></Link></div>
          <div className={styles.projectGrid}>
            {projects.filter(project => ['portainer', 'jenkins', 'portfolio'].includes(project.slug)).map(project => (
              <Link key={project.id} href={`/projects/${project.slug}`} className={styles.projectCard}>
                <div className={styles.projectVisual} data-project={project.slug} aria-hidden="true">
                  {project.slug === 'portainer' ? <><SiDocker className={styles.projectLogo} /><span>container / management</span><div className={styles.miniContainers}><i /><i /><i /><i /></div></> : project.slug === 'jenkins' ? <><GitBranch className={styles.projectLogo} /><span>commit → build → deploy</span><div className={styles.pipeline}><i /><b /><i /><b /><i /></div></> : <><Terminal className={styles.projectLogo} /><span>~/prinafsika/portfolio</span><div className={styles.codePreview}><i /><i /><i /></div></>}
                </div>
                <div className={styles.projectBody}><div className={styles.projectTitle}><h3>{project.name}</h3><ArrowUpRight size={20} /></div><p>{project.slug === 'portainer' ? 'A simpler way to manage Docker containers on a VPS.' : project.slug === 'jenkins' ? 'Automating the journey from source code to deployment.' : 'My personal corner of the web, built with Next.js and Docker.'}</p><div className={styles.tags}>{project.tech_stack?.slice(0, 3).map(tech => <span key={tech}>{tech}</span>)}</div></div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.aboutSection} aria-labelledby="about-title">
          <div><p className={styles.eyebrow}>04 / THE PERSON BEHIND THE TERMINAL</p><h2 id="about-title">Curiosity is my<br />favorite dependency.</h2><p>I&apos;m a Computer Science graduate from UPN Veteran Jawa Timur, working as a software developer across web applications, DevOps, and infrastructure. I’m also a cybersecurity and system analyst enthusiast, curious about both how systems work and how to make them safer and more useful.</p><Link href="/about" className={styles.textLink}>More about me <ArrowRight size={17} /></Link></div>
          <div className={styles.notes}><div className={styles.notesHeading}><Layers3 size={19} /><span>Notes from the homelab</span><Link href="/blog" aria-label="Read all blog posts"><ArrowUpRight size={19} /></Link></div><Link href="/blog/jenkins-cicd-k3s-part-1"><span className={styles.mono}>KUBERNETES · CI/CD</span><h3>Building a Jenkins pipeline for a Kubernetes homelab <ArrowUpRight size={17} /></h3></Link><Link href="/blog/load-balancing-gcp"><span className={styles.mono}>GOOGLE CLOUD · NETWORKING</span><h3>Distributing traffic with Google Cloud Load Balancing <ArrowUpRight size={17} /></h3></Link></div>
        </section>

        <section className={styles.contact}><div><p className={styles.eyebrow}>LET&apos;S CONNECT</p><h2>Have something in mind?<br /><span>Let&apos;s build it together.</span></h2></div><a href="https://linkedin.com/in/prinafsika/" target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>Say hello on LinkedIn <ArrowUpRight size={18} /></a></section>
    </>
  )
}
