"use client";
import { useRouter } from "next/navigation";
import { ThemeToggler } from "../themeToggler";
import Logo from "@/generated/svgs/Logo";
import Link from "next/link";
import useScrollShadow from "./useScrollShadow";
import LoginButton from "../LoginButton";

const Header = () => {
  const router = useRouter();
  const shadow = useScrollShadow();

  return (
    <header
      className={`[view-transition-name:header] fixed z-[100] w-full h-header bg-background border-b ${
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
          <LoginButton /> 
          <ThemeToggler />
        </div>
      </div>
    </header>
  );
};

export default Header;
