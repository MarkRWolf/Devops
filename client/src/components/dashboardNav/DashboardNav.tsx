"use client";
import BetterLink from "@/components/BetterLink";
import { usePathname } from "next/navigation";
import SignalStatus from "../realtime/SignalStatus";
import { FaChevronRight } from "react-icons/fa";

const routes = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/charts", label: "Charts" },
  { href: "/dashboard/runs", label: "Runs" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 bottom-0 z-20">
      <input id="dash-nav-toggle" type="checkbox" className="peer sr-only lg:hidden" />

      <nav className="sidebar [view-transition-name:sidebar] w-64 bg-sidebar h-[calc(100dvh-(var(--header-height)))] border-r transition-transform duration-300 -translate-x-64 peer-checked:translate-x-0 lg:translate-x-0">
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
                  className={`sidebar-link relative px-3 py-2 rounded-lg transition-colors ${
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
            <SignalStatus className="w-max" />
          </div>
        </div>
      </nav>

      <label
        htmlFor="dash-nav-toggle"
        className="absolute top-0 left-0 peer-checked:left-64 lg:hidden transition-all duration-300 z-30 [&>svg]:transition-transform peer-checked:[&>svg]:rotate-180 border-b-2 border-r-2 bg-background shadow-sm p-2"
        aria-label="Toggle sidebar"
      >
        <FaChevronRight size={24} />
      </label>
    </div>
  );
}
