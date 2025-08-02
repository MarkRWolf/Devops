// components/header/Header.tsx
"use client";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import { ThemeToggler } from "../themeToggler";
import Logo from "@/generated/svgs/Logo";
import Link from "next/link";

const Header = () => {
  const segments = useSelectedLayoutSegments();
  const pathname = segments[0] ? `/${segments[0]}` : "/";
  const links = [["dashboard", "/login"]] as const;
  const router = useRouter();

  return (
    <header className="fixed z-[100] w-full h-header bg-background border-b-2 border-sidebar">
      <div className="max-w-7xl mx-auto h-full grid grid-cols-3 items-center">
        {/* left column - empty as of rn*/}
        <div></div>

        {/* middle column: logo centered automatically */}
        <div className="flex justify-center">
          <Link href="/" onMouseOver={() => router.prefetch("/")}>
            <Logo className="w-16 h-16 dark:hidden block" fill="#000" />
            <Logo className="w-16 h-16 dark:block hidden" fill="#fff" />
          </Link>
        </div>

        {/* right column: nav + toggler */}
        <div className="flex justify-end items-center gap-4 text-lg">
          {links.map((link) => {
            const [name, href] = link;
            return (
              <Link
                key={name}
                href={href}
                onMouseOver={() => router.prefetch(href)}
                className={`capitalize hover:-translate-y-0.5 transition-transform duration-200 ${
                  pathname === href ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {name}
              </Link>
            );
          })}
          <ThemeToggler />
        </div>
      </div>
    </header>
  );
};

export default Header;
