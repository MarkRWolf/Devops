"use client";
import BetterLink from "@/components/BetterLink";
import { usePathname } from "next/navigation";

const routes = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/charts", label: "Charts" },
  { href: "/dashboard/runs", label: "Runs" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed z-10 w-3xs bg-sidebar h-[calc(100dvh-(var(--header-height)))] p-4">
      <div className="flex flex-col gap-2">
        {routes.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <BetterLink
              key={href}
              href={href}
              className={`pb-2 ${
                isActive ? "text-blue-500" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </BetterLink>
          );
        })}
      </div>
    </nav>
  );
}
