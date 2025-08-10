// client/src/components/hero/Hero.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VscGithubAlt, VscAzure } from "react-icons/vsc";
import { Cloud, LineChart, Radio, Server, GitBranch } from "lucide-react";
import { useWorkflowUpdates } from "@/components/github/realtime";
import { HubConnectionState } from "@microsoft/signalr";

export default function Hero() {
  const { state } = useWorkflowUpdates();

  const realtimeLabel =
    state === HubConnectionState.Connected
      ? "On"
      : state === HubConnectionState.Reconnecting
      ? "Reconnecting"
      : state === HubConnectionState.Connecting
      ? "Connecting"
      : "Off";

  const realtimeDotClass =
    state === HubConnectionState.Connected
      ? "bg-emerald-500"
      : state === HubConnectionState.Reconnecting || state === HubConnectionState.Connecting
      ? "bg-amber-400"
      : "bg-rose-500";

  return (
    <section
      className="relative isolate w-full mx-auto mt-10 max-w-[1200px] rounded-[28px] border bg-card text-card-foreground overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 520px at 75% 0%, rgba(99,102,241,0.16), transparent 65%)",
          maskImage:
            "radial-gradient(1100px 520px at 75% 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.35) 65%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(1100px 520px at 75% 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.35) 65%, transparent 75%)",
        }}
      />

      <div className="relative grid gap-10 p-6 sm:p-10 lg:p-12 xl:p-14 lg:grid-cols-[1.05fr_0.95fr] items-center justify-items-center lg:justify-items-stretch">
        {/* LEFT: copy + CTAs */}
        <div className="flex flex-col justify-center gap-6 w-full max-w-[600px] mx-auto lg:mx-0">
          <div className="inline-flex items-center gap-2 w-max px-3 py-1 rounded-full text-xs border bg-background/70 backdrop-blur mx-auto md:mx-0">
            <span className="relative flex size-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${realtimeDotClass} opacity-75`}
              />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${realtimeDotClass}`} />
            </span>
            <span className="text-muted-foreground">Live demo — Realtime:</span>
            <span className="font-medium">{realtimeLabel}</span>
          </div>

          <h1
            id="hero-title"
            className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-center md:text-left"
            style={{ textWrap: "balance" }}
          >
            Monitor & analyze your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300">
              CI pipelines
            </span>{" "}
            in real time
          </h1>

          <p
            className="text-base md:text-lg text-muted-foreground text-center md:text-left mx-auto md:mx-0 max-w-[60ch]"
            style={{ textWrap: "pretty" }}
          >
            Ingests <span className="font-medium">GitHub Actions</span> &{" "}
            <span className="font-medium">Azure Pipelines</span>, streams updates over{" "}
            <span className="font-medium">SignalR</span>, and renders interactive charts with{" "}
            <span className="font-medium">Next.js 15</span> (SSR) +{" "}
            <span className="font-medium">.NET&nbsp;8</span> — deployed on{" "}
            <span className="font-medium">Azure Container Apps</span>.
          </p>

          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
            <Link href="#demo">
              <Button size="lg" className="rounded-xl">
                Try the demo
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-xl">
                Open your Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT: showcase panel */}
        <div className="relative w-full max-w-[640px] mx-auto md:mx-0 lg:-mr-6">
          <div className="relative rounded-2xl border bg-background/60 backdrop-blur-xl p-5 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
              <CiTile
                title="GitHub Actions"
                icon={<VscGithubAlt size={20} />}
                bullets={["Runs, Jobs, Artifacts", "Branch & Event analytics", "Trend & duration"]}
                ring="ring-emerald-400/30"
              />
              <CiTile
                title="Azure Pipelines"
                icon={<VscAzure size={20} />}
                bullets={["Builds & Artifacts", "Success trend", "Duration analytics"]}
                ring="ring-sky-400/30"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="Providers" value="2" />
              <Stat label="Realtime" value={realtimeLabel} />
              <Stat label="Deployed" value="ACA" />
            </div>
          </div>

          {/* tech chips */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
            <TechChip
              icon={<Radio className="size-4" />}
              label={`SignalR realtime: ${realtimeLabel}`}
            />
            <TechChip icon={<LineChart className="size-4" />} label="Interactive charts" />
            <TechChip icon={<GitBranch className="size-4" />} label="GitHub & Azure CI" />
            <TechChip icon={<Server className="size-4" />} label=".NET 8 API" />
            <TechChip icon={<Cloud className="size-4" />} label="Azure Container Apps" />
          </div>

          {/* soft corner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 rounded-[32px]"
            style={{
              background:
                "radial-gradient(420px 260px at 100% 0%, rgba(99,102,241,0.18), transparent 60%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* helpers */

function TechChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs">
      {icon}
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function CiTile({
  title,
  icon,
  bullets,
  ring,
}: {
  title: string;
  icon: React.ReactNode;
  bullets: string[];
  ring: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-card p-3 md:p-4 ring-1 ${ring}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="grid place-items-center size-8 rounded-md bg-muted/60 border">{icon}</div>
        <div className="font-semibold">{title}</div>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {bullets.map((b) => (
          <li key={b} className="leading-snug">
            • {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
