import type { Metadata } from 'next'
import { Roboto_Mono } from 'next/font/google'
import { NextUIProvider } from '@nextui-org/react'
import Sidebar from '@/components/Sidebar'
import GlowingCursor from '@/components/Cursor'
// import Loading from "@/components/Loading";
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import './globals.css'
import Script from 'next/script'

const inter = Roboto_Mono({ subsets: ['latin'] })
const Loading = dynamic(() => import('@/components/Loading'), { ssr: false })

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-16x16.png',
  },
  title: ' + Prinafsika + ',
  description: 'This is my portfolio, made with Next.js and Tailwind CSS. In this portfolio, I showcase my projects and skills. I hope you find something that interests you. Thank you!',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>{/* <script defer src="https://umami.prinafsika.world/getinfo" data-website-id="b3c5039a-804e-4605-b9fa-84442d2788a5"></script> */}</head>
      <body className={inter.className + ' bg-zinc-900'}>
        <GlowingCursor />
        <Sidebar />
        <Loading />
        <Suspense fallback={<>Loading...</>} />
        <NextUIProvider>{children}</NextUIProvider>
        <Suspense />
        <Script defer src="http://umami.webinap.com/script.js" data-website-id="0a527cde-ce9b-4f48-92e1-05cdc731a19f" strategy="lazyOnload" data-domains="webinap.com" />
      </body>
    </html>
  )
}
