"use client";

import { useEffect, useState } from "react";
import { ConnectionCard } from "@/components/connections/ConnectionCard";
import type { PlatformConnection } from "@/types";

const PLATFORM_LABELS = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  THREADS: "Threads"
};

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    try {
      const response = await fetch("/api/social/accounts");
      const accounts = await response.json();

      // Cria conexões para todas as plataformas
      const allPlatforms = ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "THREADS"] as const;
      const connections = allPlatforms.map((platform) => {
        const account = accounts.find((a: any) => a.platform === platform);
        return {
          platform: platform.toLowerCase() as any,
          label: PLATFORM_LABELS[platform],
          handle: account?.displayName ?? null,
          connected: !!account?.isConnected,
          accountId: account?.id
        };
      });

      setConnections(connections);
    } catch (error) {
      console.error("Failed to load connections:", error);
    } finally {
      setIsInitializing(false);
    }
  }

  async function handleConnect(platform: string) {
    setLoading(platform);
    try {
      const response = await fetch("/api/social/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platform.toUpperCase() })
      });

      const { redirectUrl } = await response.json();
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Failed to connect:", error);
      setLoading(null);
    }
  }

  async function handleDisconnect(accountId: string) {
    setLoading(accountId);
    try {
      await fetch("/api/social/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialAccountId: accountId })
      });

      await loadConnections();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Painel de Conexões</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Gerencie as contas vinculadas ao seu Slotty para publicar automaticamente.
        </p>
      </header>

      {isInitializing ? (
        <div className="flex justify-center py-12">
          <p className="text-sm text-brand-muted">Carregando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.platform}
              connection={connection}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              loading={loading === connection.platform || loading === connection.accountId}
            />
          ))}
        </div>
      )}
    </main>
  );
}
