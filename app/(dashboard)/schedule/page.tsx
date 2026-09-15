"use client";

import { useState } from "react";
import { GradientButton } from "@/components/ui/GradientButton";
import { ProfileSelector } from "@/components/schedule/ProfileSelector";
import { PostTextArea } from "@/components/schedule/PostTextArea";
import { ChannelSelector } from "@/components/schedule/ChannelSelector";
import { MediaDropzone } from "@/components/schedule/MediaDropzone";
import { DateTimePicker } from "@/components/schedule/DateTimePicker";
import { PreviewPanel } from "@/components/schedule/PreviewPanel";
import type { MediaItem, Platform } from "@/types";

const CHAR_LIMIT: Record<Platform, number> = {
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  threads: 500
};

export default function SchedulePage() {
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<Platform>("instagram");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-black/5 px-8 py-5">
        <div>
          <h1 className="text-xl font-bold">Painel de Agendamento</h1>
          <p className="text-xs text-brand-muted">Menos tempo agendando, mais tempo criando.</p>
        </div>
        <GradientButton disabled={!content || selectedProfileIds.length === 0}>
          Agendar publicação
        </GradientButton>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden p-6 lg:grid-cols-3">
        {/* Coluna 1 — Configuração base */}
        <section className="flex flex-col gap-5 overflow-y-auto rounded-card bg-white/40 p-1 scrollbar-thin lg:col-span-1">
          <ProfileSelector selectedIds={selectedProfileIds} onChange={setSelectedProfileIds} />
          <PostTextArea value={content} onChange={setContent} charLimit={CHAR_LIMIT[channel]} />
        </section>

        {/* Coluna 2 — Mídias e horários */}
        <section className="flex flex-col gap-5 overflow-y-auto rounded-card bg-white/40 p-1 scrollbar-thin lg:col-span-1">
          <ChannelSelector selected={channel} onSelect={setChannel} />
          <MediaDropzone media={media} onChange={setMedia} />
          <DateTimePicker date={date} time={time} onDateChange={setDate} onTimeChange={setTime} />
        </section>

        {/* Coluna 3 — Visualização */}
        <section className="flex flex-col gap-5 overflow-y-auto rounded-card bg-white/40 p-1 scrollbar-thin lg:col-span-1">
          <PreviewPanel
            platform={channel}
            authorName="Seu perfil"
            content={content}
            media={media}
            date={date}
            time={time}
          />
        </section>
      </div>
    </main>
  );
}
