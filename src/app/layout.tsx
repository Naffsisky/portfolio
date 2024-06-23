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
        <NextUIProvider>
          <div className="h-screen flex flex-col justify-center items-center lg:ml-64">
            <div className="border-2 border-indigo-500 p-5 shadow-lg shadow-indigo-500">
              <h1 className="text-3xl font-bold text-center text-white">Belum jadi sabar bro!</h1>
              <h1 className="text-3xl font-bold text-center text-purple-500 pt-5">Website under construction!</h1>
            </div>
          </div>
          {children}
        </NextUIProvider>
        <Suspense />
      </body>
    </html>
  );
}
