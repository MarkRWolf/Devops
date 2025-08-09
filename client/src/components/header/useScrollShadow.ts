"use client";
import { useEffect, useState } from "react";

export default function useScrollShadow() {
  const [shadow, setShadow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShadow(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return shadow;
}
