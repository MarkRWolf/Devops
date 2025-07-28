"use client";
import BetterLink from "@/components/BetterLink";
import { usePathname } from "next/navigation";

const routes = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/stats", label: "Stats" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="container-main mx-auto flex gap-4 border-b border-blue-500 mt-12">
      {routes.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <BetterLink
            key={href}
            href={href}
            className={`pb-2 border-b ${
              isActive
                ? "text-blue-500 border-blue-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </BetterLink>
        );
      })}
    </nav>
  );
}
