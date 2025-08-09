// client/src/components/ci/CIFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export type CIProvider = "gh" | "az";

interface CIFilterProps {
  available: { gh: boolean; az: boolean };
  defaultProvider: CIProvider;
}

const PROVIDER_LABELS: Record<CIProvider, string> = {
  gh: "GitHub",
  az: "Azure",
};

// static list of all possible providers (typed as literal tuple)
const ALL_PROVIDERS: readonly CIProvider[] = ["gh", "az"] as const;

export default function CIFilter({ available, defaultProvider }: CIFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Only keep available providers
  const providers = ALL_PROVIDERS.filter((p) => available[p]);

  // return null if nothing to filter
  if (providers.length <= 1) return null;

  // Current = ?ci= (or fallback to defaultProvider)
  const ciParam = searchParams.get("ci");
  const current =
    providers.find((p) => p === ciParam) ??
    (providers.includes(defaultProvider) ? defaultProvider : providers[0]);

  const computeUrl = (provider: CIProvider): string => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("ci", provider);
    return url.pathname + url.search;
  };

  const selectProvider = (provider: CIProvider) => {
    router.push(computeUrl(provider), { scroll: false });
  };

  return (
    <div className="flex gap-2 mb-6 w-max mx-auto">
      {providers.map((provider) => (
        <Button
          key={provider}
          variant={current === provider ? "default" : "outline"}
          onClick={() => selectProvider(provider)}
        >
          {PROVIDER_LABELS[provider]}
        </Button>
      ))}
    </div>
  );
}
