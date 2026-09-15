"use client";

import type { PlatformConnection } from "@/types";
import { PlatformIcon } from "@/components/schedule/PlatformIcon";

type Props = {
  connection: PlatformConnection;
  onConnect?: (platform: string) => void | Promise<void>;
  onDisconnect?: (accountId: string) => void | Promise<void>;
  loading?: boolean;
};

export function ConnectionCard({ connection, onConnect, onDisconnect, loading }: Props) {
  const { platform, label, handle, connected, accountId } = connection;

  async function handleClick() {
    if (connected && onDisconnect && accountId) {
      await onDisconnect(accountId);
    } else if (!connected && onConnect) {
      await onConnect(platform);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-card bg-brand-surface p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-bg">
          <PlatformIcon platform={platform} className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-brand-muted">
            {connected ? handle ?? "Conta conectada" : "Nenhuma conta conectada"}
          </p>
        </div>
      </div>

      {connected ? (
        <button
          onClick={handleClick}
          disabled={loading}
          className="rounded-pill border border-black/10 px-4 py-2 text-xs font-medium text-brand-ink/70 transition hover:bg-brand-bg disabled:opacity-50"
        >
          {loading ? "..." : "Desconectar"}
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="btn-gradient-brand px-4 py-2 text-xs disabled:opacity-50"
        >
          {loading ? "..." : "Conectar"}
        </button>
      )}
    </div>
  );
}
