import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import { NextUIProvider } from "@nextui-org/react";
import Sidebar from "@/components/Sidebar";
import GlowingCursor from "@/components/Cursor";
// import Loading from "@/components/Loading";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import "./globals.css";

const inter = Roboto_Mono({ subsets: ["latin"] });
const Loading = dynamic(() => import("@/components/Loading"), { ssr: false });

export const metadata: Metadata = {
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
      <body className={inter.className + " bg-zinc-900"}>
        <GlowingCursor />
        <Sidebar />
        <Loading />
        <Suspense fallback={<>Loading...</>} />
        <NextUIProvider>{children}</NextUIProvider>
        <Suspense />
      </body>
    </html>
  );
}
