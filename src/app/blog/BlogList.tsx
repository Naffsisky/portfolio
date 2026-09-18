import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import styles from '@/app/content.module.css'
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

  // Keep clearing filters an explicit query navigation.
  searchParams.set('category', params.category || ALL_CATEGORIES)

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
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>BLOG / NOTES FROM THE WORKBENCH</p>
        <h1>Things I build.<br />Things I learn.</h1>
        <p>Catatan tentang software development, cloud, DevOps, dan hal-hal yang saya pelajari sepanjang perjalanan.</p>
      </header>
      <div className={styles.searchPanel}>
        <form action="/blog" method="get" className={styles.search}>
          <div>
            <label htmlFor="blog-search">Search blog</label>
            <input key={searchQuery} id="blog-search" name="q" type="search" defaultValue={searchQuery} placeholder="Cari judul, topik, atau teknologi..." />
          </div>
          {selectedCategory !== ALL_CATEGORIES && <input type="hidden" name="category" value={selectedCategory} />}
          <button type="submit" className={styles.button}><Search size={16} /> Search</button>
          {(searchQuery || selectedCategory !== ALL_CATEGORIES) && <Link href={buildBlogHref({})} className={styles.secondaryButton}>Reset</Link>}
        </form>
        <div className={styles.filters} aria-label="Blog categories">
          {categories.map(category => <Link key={category} href={buildBlogHref({ category, q: searchQuery })} aria-current={selectedCategory === category ? 'true' : undefined} className={styles.filter}>{category}</Link>)}
        </div>
      </div>
      <div className={styles.resultCount}>
        <p>Menampilkan {posts.length} dari {totalPosts} blog</p><p>Halaman {currentPage} dari {totalPages}</p>
      </div>
      <ul className={styles.twoColumns}>
        {posts.map(post => (
          <li key={post.slug} className={styles.card}>
            <Link href={`/blog/${post.slug}`} className="block h-full">
              <div className={styles.cardBody}>
                <div className={styles.postMeta}><span>{post.category || 'Uncategorized'}</span><span>·</span><time dateTime={post.date}>{post.date}</time></div>
                <h2>{post.title}</h2>
                <p>{post.description || 'Deskripsi artikel belum tersedia.'}</p>
                <div className={styles.tags}>{post.tags?.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div>
                <span className={styles.textLink}>Read article <ArrowUpRight size={16} /></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {totalPosts === 0 && <div className={styles.empty}>Tidak ada blog yang cocok dengan filter atau kata kunci pencarian.</div>}
      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Blog pagination">
          <Link href={buildBlogHref({ category: selectedCategory, q: searchQuery, page: currentPage - 1 })} aria-disabled={currentPage === 1} tabIndex={currentPage === 1 ? -1 : undefined} className={styles.filter}>Previous</Link>
          {paginationItems.map(item => typeof item === 'number' ? (
            <Link key={item} href={buildBlogHref({ category: selectedCategory, q: searchQuery, page: item })} aria-current={currentPage === item ? 'page' : undefined} className={styles.filter}>{item}</Link>
          ) : <span key={item} aria-hidden="true">…</span>)}
          <Link href={buildBlogHref({ category: selectedCategory, q: searchQuery, page: currentPage + 1 })} aria-disabled={currentPage === totalPages} tabIndex={currentPage === totalPages ? -1 : undefined} className={styles.filter}>Next</Link>
        </nav>
      )}
    </div>
  )
}

export default BlogList
