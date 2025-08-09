// ./client/src/components/common/ExpandablePanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function ExpandablePanel({
  title,
  subtitle,
  meta,
  onExpand,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode | string;
  onExpand?: () => Promise<void> | void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (open && !loadedRef.current && onExpand) {
      loadedRef.current = true;
      void onExpand();
    }
  }, [open, onExpand]);

  const toggle = () => setOpen((v) => !v);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKey}
        className="flex justify-between items-center gap-4 cursor-pointer select-none"
      >
        <div className="min-w-0">
          <div className="text-md font-semibold truncate">{title}</div>
          {subtitle && <div className="text-sm text-secondary-foreground">{subtitle}</div>}
          {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
        </div>

        <div className="flex items-center text-sm text-muted-foreground shrink-0">
          {open ? "Collapse" : "Expand"}
          <span className="ml-2 text-lg font-bold">{open ? "-" : "+"}</span>
        </div>
      </div>

      <div
        className={`transition-[max-height,opacity] duration-300 overflow-hidden ${
          open ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {open && <div className="pt-4">{children}</div>}
      </div>
    </div>
  );
}
