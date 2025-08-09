// ./client/src/app/(store)/dashboard/ProfileClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/user/user";
import { Button } from "@/components/ui/button";
import { VscAzure, VscGithubAlt } from "react-icons/vsc";

import ProviderToggle from "./ProviderToggle";
import GitHubSection from "./GitHubSection";
import AzureSection from "./AzureSection";

export default function ProfileClient({ user: me }: { user: User }) {
  const router = useRouter();
  const [showGitHub, setShowGitHub] = useState(false);
  const [showAzure, setShowAzure] = useState(false);
  const [err, setErr] = useState("");

  const logout = async () => {
    setErr("");
    try {
      await fetch(`/api/account/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      router.push("/");
    } catch {
      setErr("Logout failed. Likely a network error.");
    }
  };

  return (
    <main className="bg-card rounded-xl max-w-5xl mx-auto py-4 px-8 border space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p>Username: {me.username}</p>
          <p>Email: {me.email}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      {err && <p className="p-2 rounded bg-red-100 text-red-700">{err}</p>}

      <div className="flex items-center gap-4">
        <ProviderToggle
          title="GitHub"
          icon={<VscGithubAlt size={24} />}
          configured={me.hasGitHubConfig}
          onClick={() => setShowGitHub((v) => !v)}
        />
        <ProviderToggle
          title="Azure"
          icon={<VscAzure size={24} />}
          configured={me.hasAzureConfig}
          onClick={() => setShowAzure((v) => !v)}
        />
      </div>

      <div className="flex gap-2">
        {showGitHub && <GitHubSection />}
        {showAzure && <AzureSection />}
      </div>
    </main>
  );
}
