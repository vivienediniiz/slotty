"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<Platform>("instagram");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSchedulePost() {
    if (!content.trim() || selectedProfileIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const scheduledDateTime = date && time ? new Date(`${date}T${time}`) : new Date();

      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          scheduledFor: scheduledDateTime.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          hashtags: [],
          media: media.map((m) => ({ url: m.previewUrl, type: m.type.toUpperCase() })),
          accountIds: selectedProfileIds
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API Error:", error);
        throw new Error(error.error || "Falha ao agendar publicação");
      }

      console.log("✅ Post agendado com sucesso!");

      // Sucesso — mostrar overlay e redirecionar
      setShowSuccess(true);
      setContent("");
      setMedia([]);
      setDate("");
      setTime("09:00");

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push("/scheduled-posts");
      }, 2000);
    } catch (err) {
      console.error("Erro ao agendar:", err);
      alert(`Erro ao agendar: ${err instanceof Error ? err.message : "Tente novamente"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-black/5 px-8 py-5">
        <div>
          <h1 className="text-xl font-bold">Painel de Agendamento</h1>
          <p className="text-xs text-brand-muted">Menos tempo agendando, mais tempo criando.</p>
        </div>
        <GradientButton
          onClick={handleSchedulePost}
          disabled={!content || selectedProfileIds.length === 0 || isSubmitting}
        >
          {isSubmitting ? "Agendando..." : "Agendar publicação"}
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

      {/* Overlay de sucesso */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-brand-ink mb-2">Post agendado! ✨</h2>
            <p className="text-brand-muted mb-6">Sua publicação será postada no horário agendado</p>
            <p className="text-sm text-brand-muted">Redirecionando para Posts Agendados...</p>
          </div>
        </div>
      )}
    </main>
  );
}
