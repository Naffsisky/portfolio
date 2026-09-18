import type { Metadata } from "next";
import { NextUIProvider } from "@nextui-org/react";
import SiteFrame from "@/components/SiteFrame";
// import Loading from "@/components/Loading";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import "./globals.css";
import Analytics from '@/components/Analytics';
import { GoogleAnalytics } from '@next/third-parties/google';

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
    "software developer",
    "DevOps",
    "cybersecurity enthusiast",
    "system analyst enthusiast",
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
    "Prinafsika — software developer working across DevOps and cloud infrastructure, and a cybersecurity and system analyst enthusiast. Explore projects, experience, and technical notes.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>{/* <script defer src="https://umami.prinafsika.world/getinfo" data-website-id="b3c5039a-804e-4605-b9fa-84442d2788a5"></script> */}</head>
      <body className="bg-[#fcfcfd] text-slate-800">
        <Loading />

        <SiteFrame>
          <NextUIProvider>
            <Suspense fallback={null}>{children}</Suspense>
          </NextUIProvider>
        </SiteFrame>

        <Suspense fallback={null}>
          <Analytics />
        </Suspense>

        <GoogleAnalytics gaId="G-FPPJBDCL8D" />
      </body>
    </html>
  );
}
