// components/header/Header.tsx
"use client";
import { useSelectedLayoutSegments } from "next/navigation";
import BetterLink from "../BetterLink";
import { ThemeToggler } from "../themeToggler";
import Logo from "@/generated/svgs/Logo";

const Header = () => {
  const segments = useSelectedLayoutSegments();
  const pathname = segments[0] ? `/${segments[0]}` : "/";
  const links = ["/dashboard", "/login"] as const;

  return (
    <header className="h-header bg-main border-b dark:border-white/80 border-black">
      <div className="container-main h-full grid grid-cols-3 items-center">
        {/* left column - empty as of rn*/}
        <div></div>

        {/* middle column: logo centered automatically */}
        <div className="flex justify-center">
          <BetterLink href="/">
            <Logo className="w-16 h-16 dark:hidden block" fill="#000" />
            <Logo className="w-16 h-16 dark:block hidden" fill="#fff" />
          </BetterLink>
        </div>

        {/* right column: nav + toggler */}
        <div className="flex justify-end items-center gap-4 text-lg">
          {links.map((link) => (
            <BetterLink
              key={link}
              href={link}
              className={`capitalize hover:-translate-y-0.5 transition-transform duration-200 ${
                pathname === link ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.slice(1)}
            </BetterLink>
          ))}
          <ThemeToggler />
        </div>
      </div>
    </header>
  );
};

export default Header;
