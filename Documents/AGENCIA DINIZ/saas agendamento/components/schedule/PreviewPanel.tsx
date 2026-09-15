"use client";

import type { MediaItem, Platform } from "@/types";
import { PlatformIcon } from "./PlatformIcon";

type Props = {
  platform: Platform;
  authorName: string;
  content: string;
  media: MediaItem[];
  date: string;
  time: string;
};

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  threads: "Threads"
};

function formatSchedule(date: string, time: string) {
  if (!date) return "Sem horário definido";
  const dt = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(dt.getTime())) return "Sem horário definido";
  return dt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function PreviewPanel({ platform, authorName, content, media, date, time }: Props) {
  const firstMedia = media[0];

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
        Preview · {PLATFORM_LABEL[platform]}
      </label>

      <div className="overflow-hidden rounded-card bg-brand-surface shadow-soft-lg">
        <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-white">
            <PlatformIcon platform={platform} className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{authorName}</p>
            <p className="text-[11px] text-brand-muted">Patrocinado · agendado</p>
          </div>
        </div>

        <div className="flex aspect-square items-center justify-center bg-brand-bg">
          {firstMedia ? (
            firstMedia.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={firstMedia.previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <video src={firstMedia.previewUrl} className="h-full w-full object-cover" muted controls />
            )
          ) : (
            <span className="text-sm text-brand-muted">Nenhuma mídia adicionada</span>
          )}
        </div>

        <div className="space-y-2 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {content || <span className="text-brand-muted">Sua legenda aparecerá aqui...</span>}
          </p>
          <p className="text-[11px] font-medium text-gradient-brand">
            {formatSchedule(date, time)}
          </p>
        </div>
      </div>
    </div>
  );
}
