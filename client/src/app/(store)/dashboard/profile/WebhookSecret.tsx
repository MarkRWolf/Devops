// ./client/src/app/(store)/dashboard/WebhookSecret.tsx
"use client";

import { Button } from "@/components/ui/button";
import { RxUpdate } from "react-icons/rx";
import { FiCopy } from "react-icons/fi";

export default function WebhookSecret({
  secret,
  busy,
  onRefresh,
  onCopy,
}: {
  secret: string | null;
  busy: boolean;
  onRefresh: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <p>Webhook&nbsp;Secret:</p>
      {secret ? (
        <>
          <code className="px-2 py-1 bg-muted rounded text-sm break-all">{secret}</code>
          <button
            type="button"
            className="p-1 hover:bg-muted rounded"
            onClick={onCopy}
            aria-label="Copy webhook secret"
            title="Copy webhook secret"
          >
            <FiCopy />
          </button>
        </>
      ) : (
        <span className="text-muted-foreground text-sm">not generated in this session</span>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={busy}
        aria-label="Refresh webhook secret"
        title="Refresh webhook secret"
      >
        {busy ? <RxUpdate className="animate-spin" /> : <RxUpdate />}
      </Button>
    </div>
  );
}
