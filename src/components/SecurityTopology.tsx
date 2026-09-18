'use client'

import { useState } from 'react'
import { Cloud, Globe2, LockKeyhole, Pause, Play, Server, ShieldCheck, ShieldX } from 'lucide-react'
import shared from '@/app/home.module.css'
import styles from './SecurityTopology.module.css'

export default function SecurityTopology() {
  const [paused, setPaused] = useState(false)

  return (
    <div className={`${shared.topology} ${styles.topology}`} data-paused={paused}>
      <div className={shared.topologyHeader}><span><span className={shared.statusDot} /> A LITTLE CLOUD, UNDER GUARD</span><span className={shared.simulation}>SIMULATION</span></div>
      <div className={shared.diagram} role="img" aria-label="Illustrative defensive cloud security: HTTPS requests pass through a cloud firewall to private application servers. Suspicious traffic is blocked at the firewall.">
        <div className={shared.cloudLabel}><Cloud size={15} /> cloud / defense in depth</div>
        <div className={`${shared.internet} ${styles.trusted}`}><Globe2 size={19} /><span>HTTPS requests</span></div>
        <div className={`${shared.internet} ${styles.untrusted}`}><ShieldX size={19} /><span>Suspicious traffic</span></div>
        <svg className={shared.connections} viewBox="0 0 600 430" fill="none" aria-hidden="true">
          <path d="M180 98V118Q180 128 190 128H240Q250 128 250 138V149" className={shared.connection} />
          <path d="M180 98V118Q180 128 190 128H240Q250 128 250 138V149" className={styles.allowedPacket} pathLength="100" />
          <path d="M420 98V118Q420 128 410 128H360Q350 128 350 138V149" className={styles.threatConnection} />
          <path d="M420 98V118Q420 128 410 128H360Q350 128 350 138V149" className={styles.blockedPacket} pathLength="100" />
          {[100, 300, 500].map(x => <g key={x}><path d={`M300 206V243H${x}V298`} className={shared.connection} /><path d={`M300 206V243H${x}V298`} className={styles.forwardPacket} pathLength="100" /></g>)}
        </svg>
        <div className={`${shared.balancer} ${styles.firewall}`}><span className={shared.balancerIcon}><ShieldCheck size={23} /></span><div><strong>Cloud firewall</strong><span>inspect · allow · deny</span></div><span className={shared.statusDot} /></div>
        <span className={styles.blocked}><ShieldX /> BLOCKED</span>
        <span className={styles.allowed}><LockKeyhole /> ALLOWED</span>
        <div className={shared.cluster}><span className={shared.clusterLabel}><Cloud size={15} /> PRIVATE CLOUD NETWORK</span></div>
        <div className={shared.nodes}>{['web-01', 'api-01', 'api-02'].map(node => <div key={node} className={`${shared.node} ${styles.workload}`}><div className={shared.nodeHeading}><Server size={14} /><strong>{node}</strong><span className={shared.statusDot} /></div><div className={shared.pods}><span><LockKeyhole /> TLS enabled</span></div><div className={shared.nodeFooter}><span>Private IP</span><span>Healthy</span></div></div>)}</div>
      </div>
      <div className={shared.topologyFooter}><span><span className={shared.legendDot} /> Allowed traffic <span className={shared.legendDivider}>/</span><span className={styles.threatDot} /> Blocked traffic</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label="Pause security animation">{paused ? <Play size={13} /> : <Pause size={13} />}<span>{paused ? 'Resume' : 'Pause'}</span></button></div>
      <div className={shared.terminal}><span className={shared.terminalPrompt}>❯</span><code>firewall / policy active</code><span>default deny <span>✓</span></span></div>
      <p className={shared.diagramCaption}><span>Stay curious. Keep the cloud protected.</span><span>fig. 02</span></p>
    </div>
  )
}
