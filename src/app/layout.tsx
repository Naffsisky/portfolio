import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import { NextUIProvider } from "@nextui-org/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const inter = Roboto_Mono({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-grow">
            <NextUIProvider>{children}</NextUIProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
