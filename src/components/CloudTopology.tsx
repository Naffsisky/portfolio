'use client'

import { useState, type CSSProperties } from 'react'
import { Cloud, Globe2, Network, Pause, Play, Server } from 'lucide-react'
import { SiDocker, SiKubernetes } from 'react-icons/si'
import styles from '@/app/home.module.css'

export default function CloudTopology() {
  const [paused, setPaused] = useState(false)

  return (
    <div className={styles.topology} data-paused={paused}>
      <div className={styles.topologyHeader}><span><span className={styles.statusDot} /> A LITTLE CLOUD, IN MOTION</span><span className={styles.simulation}>SIMULATION</span></div>
      <div className={styles.diagram} role="img" aria-label="Illustrative cloud topology: internet requests flow through a load balancer to three virtual machine worker nodes, each containing two Kubernetes pods. Traffic rotates between the nodes.">
        <div className={styles.cloudLabel}><Cloud size={15} /> cloud / asia-southeast</div>
        <div className={styles.internet}><Globe2 size={19} /><span>Internet</span></div>
        <svg className={styles.connections} viewBox="0 0 600 430" fill="none" aria-hidden="true">
          <path d="M300 98V149" className={styles.connection} />
          <path d="M300 98V149" className={styles.incomingPacket} pathLength="100" />
          {[100, 300, 500].map((x, i) => <g key={x} style={{ '--delay': `${i * 2}s` } as CSSProperties}><path d={`M300 206V233Q300 243 ${x === 300 ? 300 : x < 300 ? 290 : 310} 243H${x}V298`} className={styles.connection} /><path d={`M300 206V233Q300 243 ${x === 300 ? 300 : x < 300 ? 290 : 310} 243H${x}V298`} className={styles.requestPacket} pathLength="100" /></g>)}
        </svg>
        <div className={styles.balancer}><span className={styles.balancerIcon}><Network size={23} /></span><div><strong>Load balancer</strong><span>round_robin</span></div><span className={styles.statusDot} /></div>
        <div className={styles.cluster}><span className={styles.clusterLabel}><SiKubernetes size={15} /> KUBERNETES CLUSTER</span><span className={styles.clusterStatus}>3 nodes · 6 pods</span></div>
        <div className={styles.nodes}>{[1, 2, 3].map((node, i) => <div key={node} className={styles.node} style={{ '--delay': `${i * 2}s` } as CSSProperties}><div className={styles.nodeHeading}><Server size={14} /><strong>worker-0{node}</strong><span className={styles.statusDot} /></div><div className={styles.pods}><span><SiDocker /> pod-{node}a</span><span><SiDocker /> pod-{node}b</span></div><div className={styles.nodeFooter}><span>VM instance</span><span>Ready</span></div></div>)}</div>
      </div>
      <div className={styles.topologyFooter}><span><span className={styles.legendDot} /> Request traffic <span className={styles.legendDivider}>/</span> <span className={styles.statusDot} /> Healthy pods</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label="Pause animation">{paused ? <Play size={13} /> : <Pause size={13} />}<span>{paused ? 'Resume' : 'Pause'}</span></button></div>
      <div className={styles.terminal}><span className={styles.terminalPrompt}>❯</span><code>kubectl get pods</code><span>6/6 Running <span>✓</span></span></div>
      <p className={styles.diagramCaption}><span>Small containers. Big possibilities.</span><span>fig. 01</span></p>
    </div>
  )
}
