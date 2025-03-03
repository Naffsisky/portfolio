import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export function getBlogPosts() {
  const slugs = fs.readdirSync(BLOG_DIR)

  return slugs
    .map((slug) => {
      const filePath = path.join(BLOG_DIR, slug, 'index.md')
      if (!fs.existsSync(filePath)) return null

      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(fileContent)

      return {
        slug,
        ...data,
      }
    })
    .filter(Boolean) // Hapus null jika ada folder tanpa `index.md`
}

export function getBlogPost(slug: string) {
  const postPath = path.join(BLOG_DIR, slug, 'index.md')
  if (!fs.existsSync(postPath)) {
    throw new Error(`Post ${slug} not found!`)
  }

  const fileContent = fs.readFileSync(postPath, 'utf-8')
  const { data, content } = matter(fileContent)

  return {
    metadata: data,
    content,
  }
}
