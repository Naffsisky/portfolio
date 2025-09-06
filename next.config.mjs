/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // Default untuk semua halaman
      {
        source: '/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'index, follow' }],
      },
      // Contoh: folder private noindex
      // {
      //   source: '/private/(.*)',
      //   headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' }],
      // },
      // Contoh: blok indexing gambar file statis
      // {
      //   source: '/:path*\\.(png|jpe?g|webp|gif|pdf)',
      //   headers: [{ key: 'X-Robots-Tag', value: 'noimageindex' }],
      // },
    ]
  },
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'skillicons.dev',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'lh7-rt.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 's3.nevaobjects.id',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'is3.cloudhost.id',
        pathname: '**',
      },
    ],
  },
}

export default nextConfig
