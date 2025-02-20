/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
  },
}

export default nextConfig
