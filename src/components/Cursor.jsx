'use client';

import { useEffect } from "react";

const GlowingCursor = () => {
  useEffect(() => {
    const cursor = document.querySelector(".cursor-glow");

    const moveCursor = (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
    };
  }, []);

  return <div className="cursor-glow"></div>;
};

export default GlowingCursor;
