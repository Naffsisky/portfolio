"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import "@/app/globals.css";

const Loading = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    handleStart();
    handleStop();

    return () => {
      handleStop();
    };
  }, [pathname, searchParams]);

  return null;
};

export default Loading;
