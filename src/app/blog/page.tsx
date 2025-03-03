import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

function BlogPage() {
  const posts = getBlogPosts()

  return (
    <div className="flex min-h-screen flex-col items-center justify-between lg:p-24 p-7 bg-zinc-900 lg:ml-64">
      <h1 className="text-3xl font-bold text-purple-500 mb-8 text-center lg:text-left">Welcome to my Blog!</h1>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
        {posts.map((post: any) => (
          <li key={post.slug} className="bg-zinc-800 rounded-lg border-2 border-violet-500 shadow-violet-500 overflow-hidden transition-transform hover:scale-105 hover:shadow-lg">
            <Link href={`/blog/${post.slug}`} className="block p-6 h-full">
              <h2 className="text-xl font-semibold text-white mb-2">{post.title}</h2>
              <p className="text-sm text-zinc-300 mb-2">
                {' '}
                &gt; {post.category} | {post.date}
              </p>
              <p className="text-zinc-300 text-sm text-justify">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BlogPage
