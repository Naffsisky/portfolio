import Link from 'next/link'

const RunningText = () => {
  const text = 'Jasa Pembuatan Website — https://napskytech.com'

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 overflow-hidden bg-zinc-950 border-b border-indigo-500/60"
      style={{ height: '32px' }}
    >
      <div className="flex items-center h-full">
        <div className="ticker-wrapper">
          <Link href="https://napskytech.com" target="_blank" rel="noopener noreferrer">
            <span className="ticker-item">{text}</span>
          </Link>
          <Link href="https://napskytech.com" target="_blank" rel="noopener noreferrer">
            <span className="ticker-item">{text}</span>
          </Link>
          <Link href="https://napskytech.com" target="_blank" rel="noopener noreferrer">
            <span className="ticker-item">{text}</span>
          </Link>
          <Link href="https://napskytech.com" target="_blank" rel="noopener noreferrer">
            <span className="ticker-item">{text}</span>
          </Link>
          <Link href="https://napskytech.com" target="_blank" rel="noopener noreferrer">
            <span className="ticker-item">{text}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RunningText
