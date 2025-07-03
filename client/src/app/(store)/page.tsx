export const dynamic = "force-dynamic";

import Demoxd from "./Demoxd";
import BetterLink from "@/components/BetterLink";

export default async function Home() {
  return (
    <div className="text-center">
      <h1>Welcome to the page</h1>
      <Demoxd />
      <BetterLink href="/login" className="rounded-md border-neutral-600 border-2 px-4 py-2">
        Sign up
      </BetterLink>
    </div>
  );
}
