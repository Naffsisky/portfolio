import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import { NextUIProvider } from "@nextui-org/react";
import Sidebar from "@/components/Sidebar";
import GlowingCursor from "@/components/Cursor";
// import Loading from "@/components/Loading";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import "./globals.css";
import Script from "next/script";

const inter = Roboto_Mono({ subsets: ["latin"] });
const Loading = dynamic(() => import("@/components/Loading"), { ssr: false });

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-16x16.png",
  },
  title: " + Prinafsika + ",
  description: "This is my portfolio, made with Next.js and Tailwind CSS. In this portfolio, I showcase my projects and skills. I hope you find something that interests you. Thank you!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async defer src="http://prinafsika.world:4100/script.js" data-website-id="5c02e9b6-dfe4-4051-8c6c-17972939305e" data-domains="prinafsika.world"></script>
      </head>
      <body className={inter.className + " bg-zinc-900"}>
        <GlowingCursor />
        <Sidebar />
        <Loading />
        <Suspense fallback={<>Loading...</>} />
        <NextUIProvider>{children}</NextUIProvider>
        <Suspense />
        <Script defer src="http://prinafsika.world:4100/script.js" data-website-id="5c02e9b6-dfe4-4051-8c6c-17972939305e" strategy="lazyOnload" data-domains="prinafsika.world" />
      </body>
    </html>
  );
}
