"use client";
import { Link, useTransitionRouter } from "next-view-transitions";

interface BetterLinkProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

const BetterLink = ({ children, className, href }: BetterLinkProps) => {
  const router = useTransitionRouter();

  return (
    <Link href={href} className={className} onMouseOver={() => router.prefetch(href)}>
      {children}
    </Link>
  );
};

export default BetterLink;
