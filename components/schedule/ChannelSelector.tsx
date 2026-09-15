"use client";

import type { Platform } from "@/types";
import { PlatformIcon } from "./PlatformIcon";

const CHANNELS: { platform: Platform; label: string }[] = [
  { platform: "instagram", label: "Instagram" },
  { platform: "facebook", label: "Facebook" },
  { platform: "linkedin", label: "LinkedIn" },
  { platform: "threads", label: "Threads" }
];

type Props = {
  selected: Platform;
  onSelect: (platform: Platform) => void;
};

export function ChannelSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
        Canais
      </label>
      <div className="flex gap-2">
        {CHANNELS.map(({ platform, label }) => {
          const active = platform === selected;
          return (
            <button
              key={platform}
              type="button"
              title={label}
              onClick={() => onSelect(platform)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                active
                  ? "border-transparent bg-brand-gradient text-white shadow-soft"
                  : "border-black/10 bg-brand-surface text-brand-ink/60 hover:bg-brand-bg"
              }`}
            >
              <PlatformIcon platform={platform} className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
