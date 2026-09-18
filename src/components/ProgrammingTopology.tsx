'use client'

import { useState, type CSSProperties } from 'react'
import { AppWindow, CheckCheck, Code2, GitBranch, Package, Pause, Play } from 'lucide-react'
import shared from '@/app/home.module.css'
import styles from './ProgrammingTopology.module.css'

const lines = ['export default function App() {', '  return (', '    <button>Hello, world.</button>', '  )', '}']
const stages = [
  { label: 'Build', detail: 'Compile source', icon: Package, path: 'M300 240V275H100V316' },
  { label: 'Test', detail: 'Checks passed', icon: CheckCheck, path: 'M192 357H216' },
  { label: 'Preview', detail: 'Hello, world.', icon: AppWindow, path: 'M384 357H408' },
]

export default function ProgrammingTopology() {
  const [paused, setPaused] = useState(false)

  return (
    <div className={shared.topology} data-paused={paused}>
      <div className={shared.topologyHeader}><span><span className={shared.statusDot} /> A LITTLE CODE, COMING TO LIFE</span><span className={shared.simulation}>SIMULATION</span></div>
      <div className={shared.diagram} role="img" aria-label="Illustrative programming workflow: code is typed in an editor, compiled, tested, and displayed as a Hello, world application preview.">
        <div className={shared.cloudLabel}><Code2 size={15} /> workspace / ideas into interfaces</div>
        <svg className={shared.connections} viewBox="0 0 600 430" fill="none" aria-hidden="true">
          {stages.map(({ label, path }, i) => <g key={label} style={{ '--delay': `${i}s` } as CSSProperties}><path d={path} className={shared.connection} /><path d={path} className={styles.packet} pathLength="100" /></g>)}
        </svg>
        <div className={styles.editor}>
          <div className={styles.editorHeader}><span><Code2 /> App.tsx</span><span><GitBranch /> main</span></div>
          <pre className={styles.code}>{lines.map((line, i) => <span key={i} className={styles.codeRow}><span className={styles.lineNumber}>{i + 1}</span><code className={styles.codeLine} style={{ '--delay': `${i * .35}s` } as CSSProperties}>{line}</code></span>)}</pre>
        </div>
        <span className={styles.pipelineLabel}>SAVE → BUILD → TEST → PREVIEW</span>
        <div className={styles.stages}>{stages.map(({ label, detail, icon: Icon }, i) => <div key={label} className={styles.stage} style={{ '--delay': `${i}s` } as CSSProperties}><strong><Icon />{label}</strong><span>{detail}</span></div>)}</div>
      </div>
      <div className={shared.topologyFooter}><span><span className={shared.legendDot} /> Code in motion <span className={shared.legendDivider}>/</span><span className={shared.statusDot} /> Checks passing</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label="Pause programming animation">{paused ? <Play size={13} /> : <Pause size={13} />}<span>{paused ? 'Resume' : 'Pause'}</span></button></div>
      <div className={shared.terminal}><span className={shared.terminalPrompt}>❯</span><code>npm run build</code><span>compiled successfully <span>✓</span></span></div>
      <p className={shared.diagramCaption}><span>One idea. A few lines. Something real.</span><span>fig. 03</span></p>
    </div>
  )
}
