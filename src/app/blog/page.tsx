import BlogList from './BlogList'
import { getSortedBlogPosts } from '@/lib/blog'

const POSTS_PER_PAGE = 10
const ALL_CATEGORIES = 'All'

type SearchParams = {
  category?: string | string[]
  page?: string | string[]
  q?: string | string[]
}

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function BlogPage({ searchParams }: { searchParams?: SearchParams }) {
  const allPosts = getSortedBlogPosts()
  const categories = [
    ALL_CATEGORIES,
    ...Array.from(new Set(allPosts.map((post) => post.category).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)),
  ]
  const requestedCategory = getSingleValue(searchParams?.category) ?? ALL_CATEGORIES
  const selectedCategory = categories.includes(requestedCategory) ? requestedCategory : ALL_CATEGORIES
  const searchQuery = (getSingleValue(searchParams?.q) ?? '').trim()
  const normalizedQuery = searchQuery.toLowerCase()

  const filteredPosts = allPosts.filter((post) => {
    const matchesCategory = selectedCategory === ALL_CATEGORIES || post.category === selectedCategory
    const searchableContent = [post.title, post.description, post.category, ...(Array.isArray(post.tags) ? post.tags : [])].filter(Boolean).join(' ').toLowerCase()
    const matchesQuery = normalizedQuery.length === 0 || searchableContent.includes(normalizedQuery)
    return matchesCategory && matchesQuery
  })

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
  const rawPage = Number(getSingleValue(searchParams?.page) ?? '1')
  const currentPage = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, totalPages) : 1
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  return (
    <BlogList
      posts={paginatedPosts}
      categories={categories}
      selectedCategory={selectedCategory}
      searchQuery={searchQuery}
      currentPage={currentPage}
      totalPages={totalPages}
      totalPosts={filteredPosts.length}
    />
  )
}

export default BlogPage
