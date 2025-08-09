"use client";
import BetterLink from "@/components/BetterLink";
import { usePathname } from "next/navigation";

const routes = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/charts", label: "Charts" },
  { href: "/dashboard/runs", label: "Runs" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed z-10 w-64 bg-sidebar h-[calc(100dvh-(var(--header-height)))] border-r">
      <div className="px-3 py-4">
        <div className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
          Dashboard
        </div>
        <div className="flex flex-col gap-1">
          {routes.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <BetterLink
                key={href}
                href={href}
                className={`relative px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r ${
                    active ? "bg-sidebar-primary" : "bg-transparent"
                  }`}
                />
                {label}
              </BetterLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
