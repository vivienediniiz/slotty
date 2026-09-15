"use client";

import { useEffect, useState } from "react";
import { PlatformIcon } from "@/components/schedule/PlatformIcon";
import type { MediaItem, Platform } from "@/types";

type ScheduledPost = {
  id: string;
  content: string;
  scheduledFor: string;
  status: "SCHEDULED" | "PUBLISHED" | "FAILED";
  media: Array<{ url: string; type: string }>;
  channels: Array<{ id: string; socialAccount: { platform: string; displayName: string }; status: string }>;
};

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const response = await fetch("/api/social/posts");
      if (!response.ok) throw new Error("Falha ao carregar posts");
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setIsLoading(false);
    }
  }

  async function cancelPost(postId: string) {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

    setDeletingId(postId);
    try {
      const response = await fetch(`/api/social/posts/${postId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Falha ao cancelar publicação");
      }

      setPosts(posts.filter((p) => p.id !== postId));
      alert("Publicação cancelada com sucesso!");
    } catch (err) {
      alert(`Erro ao cancelar: ${err instanceof Error ? err.message : "Tente novamente"}`);
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <p className="text-brand-muted">Carregando posts...</p>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-black/5 px-8 py-5">
        <h1 className="text-xl font-bold">Posts Agendados</h1>
        <p className="text-xs text-brand-muted">Acompanhe seus posts agendados para publicação</p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 rounded-card bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-brand-muted">Nenhum post agendado. Comece criando um no painel de agendamento.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <div key={post.id} className="rounded-card bg-white/40 p-6 shadow-soft">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-brand-ink">{post.content.substring(0, 100)}</p>
                    <p className="text-xs text-brand-muted">
                      Agendado para {new Date(post.scheduledFor).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        post.status === "SCHEDULED"
                          ? "bg-blue-100 text-blue-700"
                          : post.status === "PUBLISHED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {post.status === "SCHEDULED"
                        ? "Agendado"
                        : post.status === "PUBLISHED"
                          ? "Publicado"
                          : "Falha"}
                    </span>
                    {post.status === "SCHEDULED" && (
                      <button
                        onClick={() => cancelPost(post.id)}
                        disabled={deletingId === post.id}
                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === post.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    )}
                  </div>
                </div>

                {post.media.length > 0 && (
                  <div className="mb-4 grid grid-cols-4 gap-2">
                    {post.media.map((m, i) => (
                      <div key={i} className="aspect-square overflow-hidden rounded-lg bg-black/5">
                        {m.type.toLowerCase().startsWith("image") ? (
                          <img src={m.url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <video src={m.url} className="h-full w-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {post.channels.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-2 rounded-full bg-brand-bg px-3 py-1.5 text-xs font-medium text-brand-ink">
                      <PlatformIcon platform={ch.socialAccount.platform as Platform} className="h-4 w-4" />
                      {ch.socialAccount.displayName}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
