import Link from 'next/link'
import type { BlogFrontmatter } from '@/lib/blog'

type BlogPost = BlogFrontmatter & { slug: string }

type BlogListProps = {
  posts: BlogPost[]
  categories: string[]
  selectedCategory: string
  searchQuery: string
  currentPage: number
  totalPages: number
  totalPosts: number
}

const ALL_CATEGORIES = 'All'

type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right'

function buildBlogHref(params: { category?: string; page?: number; q?: string }) {
  const searchParams = new URLSearchParams()

  if (params.q) {
    searchParams.set('q', params.q)
  }

  if (params.category && params.category !== ALL_CATEGORIES) {
    searchParams.set('category', params.category)
  }

  if (params.page && params.page > 1) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `/blog?${query}` : '/blog'
}

function getPaginationItems(totalPages: number, currentPage: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages]
}

function BlogList({ posts, categories, selectedCategory, searchQuery, currentPage, totalPages, totalPosts }: BlogListProps) {
  const paginationItems = getPaginationItems(totalPages, currentPage)

  return (
    <div className="flex min-h-screen flex-col bg-zinc-900 p-7 lg:ml-64 lg:p-24">
      <div className="mb-8 flex w-full flex-col gap-6">
        <div>
          <h1 className="mb-3 text-center text-3xl font-bold text-purple-500 lg:text-left">Welcome to my Blog!</h1>
          <p className="text-center text-sm text-zinc-300 lg:text-left">
            Telusuri artikel berdasarkan kategori, cari topik tertentu, dan baca per halaman.
          </p>
        </div>

        <div className="rounded-2xl border border-violet-500/50 bg-zinc-800/90 p-5 shadow-lg shadow-violet-950/30">
          <form action="/blog" method="get" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="blog-search" className="mb-2 block text-sm font-medium text-white">
                Search blog
              </label>
              <input
                id="blog-search"
                name="q"
                type="search"
                defaultValue={searchQuery}
                placeholder="Cari judul, deskripsi, kategori, atau tag..."
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400"
              />
            </div>

            {selectedCategory !== ALL_CATEGORIES ? <input type="hidden" name="category" value={selectedCategory} /> : null}

            <button
              type="submit"
              className="rounded-xl border border-violet-400 bg-violet-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-600"
            >
              Search
            </button>

            {(searchQuery || selectedCategory !== ALL_CATEGORIES) && (
              <Link
                href="/blog"
                className="rounded-xl border border-zinc-600 px-5 py-3 text-center text-sm font-medium text-zinc-200 transition hover:border-violet-400"
              >
                Reset
              </Link>
            )}
          </form>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const isActive = selectedCategory === category
              return (
                <Link
                  key={category}
                  href={buildBlogHref({ category, q: searchQuery })}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'border-violet-400 bg-violet-500 text-white' : 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-violet-400'
                  }`}
                >
                  {category}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan {posts.length} dari {totalPosts} blog
          </p>
          <p>Halaman {currentPage} dari {totalPages}</p>
        </div>
      </div>

      <ul className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <li
            key={post.slug}
            className="overflow-hidden rounded-lg border-2 border-violet-500 bg-zinc-800 shadow-violet-500 transition-transform hover:scale-105 hover:shadow-lg"
          >
            <Link href={`/blog/${post.slug}`} className="block h-full p-6">
              <h2 className="mb-2 text-xl font-semibold text-white">{post.title}</h2>
              <p className="mb-2 text-sm text-zinc-300">
                &gt; {post.category || 'Uncategorized'} | {post.date}
              </p>
              <p className="text-justify text-sm text-zinc-300">{post.description || 'Deskripsi artikel belum tersedia.'}</p>
            </Link>
          </li>
        ))}
      </ul>

      {totalPosts === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-600 bg-zinc-800/70 px-6 py-10 text-center text-zinc-300">
          Tidak ada blog yang cocok dengan filter atau kata kunci pencarian.
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={buildBlogHref({ category: selectedCategory, q: searchQuery, page: currentPage - 1 })}
            aria-disabled={currentPage === 1}
            className={`rounded-full border px-4 py-2 text-sm text-white transition ${
              currentPage === 1 ? 'pointer-events-none border-zinc-700 opacity-50' : 'border-zinc-600 hover:border-violet-400'
            }`}
          >
            Previous
          </Link>

          {paginationItems.map((item, index) => {
            if (typeof item !== 'number') {
              return (
                <span key={`${item}-${index}`} className="px-1 text-sm text-zinc-400">
                  ...
                </span>
              )
            }

            const isActive = currentPage === item
            return (
              <Link
                key={item}
                href={buildBlogHref({ category: selectedCategory, q: searchQuery, page: item })}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm transition ${
                  isActive ? 'border-violet-400 bg-violet-500 text-white' : 'border-zinc-600 text-zinc-200 hover:border-violet-400'
                }`}
              >
                {item}
              </Link>
            )
          })}

          <Link
            href={buildBlogHref({ category: selectedCategory, q: searchQuery, page: currentPage + 1 })}
            aria-disabled={currentPage === totalPages}
            className={`rounded-full border px-4 py-2 text-sm text-white transition ${
              currentPage === totalPages ? 'pointer-events-none border-zinc-700 opacity-50' : 'border-zinc-600 hover:border-violet-400'
            }`}
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default BlogList
