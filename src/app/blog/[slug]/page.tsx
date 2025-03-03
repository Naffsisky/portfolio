import { getBlogPost } from '@/lib/blog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkToc from 'remark-toc'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkBreaks from 'remark-breaks'
import dynamic from 'next/dynamic'
import Image from 'next/image'

const CustomImage = dynamic(() => import('@/components/CustomImage'), { ssr: false })

interface CodeComponentProps {
  inline?: boolean
  className?: string
  children: React.ReactNode
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const { metadata, content } = getBlogPost(params.slug)
  const processedContent = content.replace(/<figure>\s*<img\s+src="([^"]+)"\s+alt="([^"]+)">\s*<figcaption>(.*?)<\/figcaption>\s*<\/figure>/g, '![[$1||$2||$3]]')

  return (
    <div className="flex min-h-screen flex-col items-center justify-between lg:p-24 p-7 bg-zinc-900 lg:ml-64">
      <article className="prose prose-lg prose-invert max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-2">{metadata.title}</h1>
        <p className="text-gray-400 mb-8">
          {metadata.date} | {metadata.category}
        </p>
        <div className="flex justify-center">
          <Image src={metadata.socialImage} alt={metadata.title} width={800} height={400} className="rounded-lg" />
        </div>
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
                <a href={href} className="text-violet-400 hover:text-violet-300 underline">
                  {children}
                </a>
              ),
              ul: ({ children }) => <ul className="list-disc pl-8 my-4 text-white">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-8 my-4 text-white">{children}</ol>,
              li: ({ children }) => <li className="mb-1 text-amber-400">{children}</li>,
              p: ({ children }) => <p className="my-4 text-white">{children}</p>,
              code: (props: any) => {
                const { inline, children } = props as CodeComponentProps
                const content = String(children).replace(/\n$/, '')
                if (inline) {
                  return <code className="bg-zinc-800 px-1 py-0.5 rounded text-yellow-200">{content}</code>
                }
                return <code className="block bg-zinc-800 p-4 rounded-md overflow-x-auto my-4 text-yellow-200">{content}</code>
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
