import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import { NextUIProvider } from "@nextui-org/react";
import Sidebar from "@/components/Sidebar";
import GlowingCursor from "@/components/Cursor";
// import Loading from "@/components/Loading";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import "./globals.css";
import Analytics from "@/components/Analytics";

const inter = Roboto_Mono({ subsets: ["latin"] });
const Loading = dynamic(() => import("@/components/Loading"), { ssr: false });

export const metadata: Metadata = {
  metadataBase: new URL("https://webinap.com"),
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-16x16.png",
  },
  title: {
    default: "Prinafsika Website Portfolio",
    template: "%s | Prinafsika Portfolio",
  },
  openGraph: {
    type: "website",
    siteName: "Prinafsika Portfolio",
    url: "https://webinap.com",
  },
  alternates: {
    canonical: "/",
    languages: { "id-ID": "/" },
  },
  keywords: [
    "portfolio",
    "next.js",
    "tailwind css",
    "webinap",
    "prinafsika",
    "docker",
    "github actions",
    "software engineer",
    "cloud solutions architect",
    "web development",
    "programming",
    "blog",
    "projects",
    "skills",
    "technology",
    "tech stack",
    "education",
    "experience",
    "gallery",
    "learning company",
    "typescript",
  ],
  authors: [{ name: "Prinafsika", url: "https://webinap.com" }],
  creator: "Prinafsika",
  publisher: "Prinafsika",
  description:
    "This is my portfolio, made with Next.js, Tailwind CSS, and deployed using Docker container integrate with Github actions. In this portfolio, I showcase my projects and skills. I hope you find something that interests you. Thank you!",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>{/* <script defer src="https://umami.prinafsika.world/getinfo" data-website-id="b3c5039a-804e-4605-b9fa-84442d2788a5"></script> */}</head>
      <body className={inter.className + " bg-zinc-900"}>
        <GlowingCursor />
        <Sidebar />
        <Loading />
        <Suspense fallback={<>Loading...</>} />
        <NextUIProvider>{children}</NextUIProvider>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
