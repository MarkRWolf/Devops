import BetterLink from "@/components/BetterLink";

const routes = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/stats", label: "Stats" },
];

export default async function DashboardNav({ slug }: { slug: string }) {
  return (
    <nav className="container-main mx-auto flex gap-4 border-b border-gray-200 mt-12">
      {routes.map(({ href, label }) => {
        const isActive = slug === href;
        return (
          <BetterLink
            key={href}
            href={href}
            className={`pb-2 border-b-2 ${
              isActive ? "text-blue-500" : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {label}
          </BetterLink>
        );
      })}
    </nav>
  );
}
