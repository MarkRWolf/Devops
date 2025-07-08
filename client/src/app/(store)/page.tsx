export const dynamic = "force-dynamic";

import BetterLink from "@/components/BetterLink";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <h1 className="text-xl">Welcome to my Devops Dashboard</h1>

      <BetterLink href="/login">
        <Button variant="outline">Login</Button>
      </BetterLink>
    </div>
  );
}
