import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CustomImage from '@/components/CustomImage'
import styles from '@/app/content.module.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkToc from 'remark-toc'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { notFound } from 'next/navigation'
import { getBlogPost, getBlogSlugs } from '@/lib/blog'


export const revalidate = 3600 // ISR 1 jam

type Props = { params: { slug: string } }

// SSG untuk semua slug
export async function generateStaticParams() {
  const slugs = getBlogSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Metadata per halaman (title/desc/OG/canonical)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { metadata } = getBlogPost(params.slug)
    if (!metadata || metadata.draft) {
      return { robots: { index: false, follow: false } }
    }

    const base = 'https://webinap.com'
    const url = `${base}/blog/${params.slug}`
    const title = metadata.seoTitle || metadata.title
    const description = metadata.seoDescription || metadata.excerpt || 'Artikel di blog Prinafsika tentang software engineering dan proyek.'
    const ogImage = metadata.socialImage || `${base}/api/og?title=${encodeURIComponent(title)}`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        url,
        title,
        description,
        images: [ogImage],
        siteName: 'Prinafsika Portfolio',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
      robots: { index: true, follow: true },
    }
  } catch {
    return {}
  }
}

export default function BlogPost({ params }: Props) {
  let post
  try {
    post = getBlogPost(params.slug)
  } catch {
    return notFound()
  }

  const { metadata, content } = post
  if (metadata.draft) return notFound()

  // JSON-LD: Article
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: metadata.title,
    description: metadata.seoDescription || metadata.excerpt || 'Artikel dari webinap.com',
    image: metadata.socialImage ? [metadata.socialImage] : ['https://webinap.com/og.jpg'],
    datePublished: metadata.date, // pakai format ISO di frontmatter kalau bisa
    dateModified: metadata.updatedAt || metadata.date,
    author: [{ '@type': 'Person', name: 'Prinafsika' }],
    mainEntityOfPage: `https://webinap.com/blog/${params.slug}`,
  }

  // JSON-LD: Breadcrumbs
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://webinap.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://webinap.com/blog' },
      { '@type': 'ListItem', position: 3, name: metadata.title, item: `https://webinap.com/blog/${params.slug}` },
    ],
  }

  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }} />
      <article className={styles.article}>
        <Link href="/blog" className={styles.back}><ArrowLeft size={16} /> Back to all articles</Link>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>BLOG / {metadata.category || 'NOTES'}</p>
          <h1>{metadata.title}</h1>
          <div className={styles.postMeta}><span>Prinafsika</span><span>·</span><time dateTime={metadata.date}>{metadata.date}</time></div>
          <div className={styles.tags}>{Array.isArray(metadata.tags) && metadata.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        </header>
        {metadata.socialImage && (
          <div className={styles.articleCover}><Image src={metadata.socialImage} alt={metadata.title} width={1200} height={630} priority /></div>
        )}
        <div className={styles.markdown}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks, [remarkToc, { heading: 'daftar-isi', tight: true }]]}
            rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
            components={{
              img: ({ src, alt }) => <CustomImage src={src || ''} alt={alt || ''} />,
              table: ({ children }) => <div className={styles.tableScroll}><table>{children}</table></div>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
