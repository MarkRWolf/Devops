"use client";
import { useRouter, useSearchParams } from "next/navigation";

export type CIProvider = "gh" | "az";

interface CIFilterProps {
  available: { gh: boolean; az: boolean };
  defaultProvider: CIProvider;
}

const LABELS: Record<CIProvider, string> = { gh: "GitHub", az: "Azure" };
const ALL: readonly CIProvider[] = ["gh", "az"] as const;

export default function CIFilter({ available, defaultProvider }: CIFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const providers = ALL.filter((p) => available[p]);
  if (providers.length <= 1) return null;

  const ciParam = searchParams.get("ci");
  const current =
    providers.find((p) => p === ciParam) ??
    (providers.includes(defaultProvider) ? defaultProvider : providers[0]);

  const setProvider = (p: CIProvider) => {
    const url = new URL(window.location.href);
    url.searchParams.set("ci", p);
    router.push(url.pathname + url.search, { scroll: false });
  };

  return (
    <div className="w-max mx-auto mt-8">
      <div className="inline-flex rounded-full border bg-muted/40 p-1">
        {providers.map((p) => {
          const active = current === p;
          return (
            <button
              key={p}
              type="button"
              aria-pressed={active}
              onClick={() => setProvider(p)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {LABELS[p]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
