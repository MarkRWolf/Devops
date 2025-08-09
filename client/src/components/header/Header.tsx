"use client";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import { ThemeToggler } from "../themeToggler";
import Logo from "@/generated/svgs/Logo";
import Link from "next/link";
import useScrollShadow from "./useScrollShadow";

const Header = () => {
  const segments = useSelectedLayoutSegments();
  const pathname = segments[0] ? `/${segments[0]}` : "/";
  const links = [["dashboard", "/login"]] as const;
  const router = useRouter();
  const shadow = useScrollShadow();

  return (
    <header
      className={`fixed z-[100] w-full h-header bg-background border-b ${
        shadow ? "shadow-[0_1px_0_0_rgba(0,0,0,0.06)]" : "shadow-none"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full grid grid-cols-3 items-center">
        <div />
        <div className="flex justify-center">
          <Link href="/" onMouseOver={() => router.prefetch("/")}>
            <Logo className="w-16 h-16 dark:hidden block" fill="#000" />
            <Logo className="w-16 h-16 dark:block hidden" fill="#fff" />
          </Link>
        </div>
        <div className="flex justify-end items-center gap-4 text-lg">
          {links.map(([name, href]) => (
            <Link
              key={name}
              href={href}
              onMouseOver={() => router.prefetch(href)}
              className={`capitalize transition-transform duration-200 hover:-translate-y-0.5 ${
                pathname === href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {name}
            </Link>
          ))}
          <ThemeToggler />
        </div>
      </div>
    </header>
  );
};

export default Header;
