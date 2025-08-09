import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export type BlogFrontmatter = {
  title: string
  date: string // ex: '2025-08-01' atau '2025-08-01T10:00:00+07:00'
  updatedAt?: string
  category?: string
  tags?: string[]
  excerpt?: string
  seoTitle?: string
  seoDescription?: string
  socialImage?: string
  draft?: boolean
  [key: string]: any
}

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export function getBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs.readdirSync(BLOG_DIR).filter((slug) => fs.existsSync(path.join(BLOG_DIR, slug, 'index.md')))
}

export function getBlogPosts(): (BlogFrontmatter & { slug: string })[] {
  const slugs = getBlogSlugs()
  return slugs
    .map((slug) => {
      const filePath = path.join(BLOG_DIR, slug, 'index.md')
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(fileContent)
      return { slug, ...(data as BlogFrontmatter) }
    })
    .filter(Boolean) as (BlogFrontmatter & { slug: string })[]
}

export function getSortedBlogPosts(opts: { includeDraft?: boolean } = {}) {
  const { includeDraft = false } = opts
  return getBlogPosts()
    .filter((p) => (includeDraft ? true : !p.draft))
    .sort((a, b) => (a.date > b.date ? -1 : 1))
}

export function getBlogPost(slug: string): {
  metadata: BlogFrontmatter & { slug: string }
  content: string
} {
  const postPath = path.join(BLOG_DIR, slug, 'index.md')
  if (!fs.existsSync(postPath)) {
    throw new Error(`Post ${slug} not found!`)
  }
  const fileContent = fs.readFileSync(postPath, 'utf-8')
  const { data, content } = matter(fileContent)
  return {
    metadata: { slug, ...(data as BlogFrontmatter) },
    content,
  }
}
