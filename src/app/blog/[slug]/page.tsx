import type { Metadata } from 'next'
import Image from 'next/image'
import dynamic from 'next/dynamic'
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

const CustomImage = dynamic(() => import('@/components/CustomImage'), { ssr: false })

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

  // Convert <figure>..</figure> -> sintaks gambar custom
  const processedContent = content.replace(/<figure>\s*<img\s+src="([^"]+)"\s+alt="([^"]+)">\s*<figcaption>(.*?)<\/figcaption>\s*<\/figure>/g, '![[$1||$2||$3]]')

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
    <div className="flex min-h-screen flex-col items-center justify-between lg:p-24 p-7 bg-zinc-900 lg:ml-64">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <article className="prose prose-lg prose-invert max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-2">{metadata.title}</h1>

        <p className="text-gray-400 mb-8">
          {metadata.date}
          {metadata.category ? <> &nbsp;|&nbsp; {metadata.category}</> : null}
          {Array.isArray(metadata.tags) && metadata.tags.length > 0 ? <> &nbsp;•&nbsp; {metadata.tags.join(', ')}</> : null}
        </p>

        {metadata.socialImage ? (
          <div className="flex justify-center mb-8">
            <Image src={metadata.socialImage} alt={metadata.title} width={1200} height={630} className="rounded-lg w-full h-auto" priority />
          </div>
        ) : null}

        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks, [remarkToc, { heading: 'daftar-isi', tight: true }]]}
            rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
            components={{
              img: ({ src, alt }) => <CustomImage src={src || ''} alt={alt || ''} />,
              h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-purple-400">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-purple-300">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-bold mt-5 mb-2 text-purple-200">{children}</h3>,
              a: ({ href, children }) => (
                <a href={href || '#'} className="text-violet-400 hover:text-violet-300 underline">
                  {children}
                </a>
              ),
              ul: ({ children }) => <ul className="list-disc pl-8 my-4 text-white">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-8 my-4 text-white">{children}</ol>,
              li: ({ children }) => <li className="mb-1 text-amber-400">{children}</li>,
              p: ({ children }) => <p className="my-4 text-white">{children}</p>,
              code: (props: any) => {
                const { inline, children } = props as { inline?: boolean; children: React.ReactNode }
                const value = String(children).replace(/\n$/, '')
                if (inline) return <code className="bg-zinc-800 px-1 py-0.5 rounded text-yellow-200">{value}</code>
                return <code className="block bg-zinc-800 p-4 rounded-md overflow-x-auto my-4 text-yellow-200">{value}</code>
              },
              pre: ({ children }) => <pre className="bg-zinc-800 p-0 rounded-md overflow-x-auto my-4">{children}</pre>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-500 pl-4 italic my-4">{children}</blockquote>,
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
