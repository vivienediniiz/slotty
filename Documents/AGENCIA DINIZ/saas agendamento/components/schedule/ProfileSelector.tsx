"use client";

import { useEffect, useState } from "react";
import type { ScheduleProfile } from "@/types";
import { PlatformIcon } from "./PlatformIcon";

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function ProfileSelector({ selectedIds, onChange }: Props) {
  const [profiles, setProfiles] = useState<ScheduleProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const response = await fetch("/api/social/accounts");
      const accounts = await response.json();

      const profileList: ScheduleProfile[] = accounts
        .filter((acc: any) => acc.isConnected)
        .map((acc: any) => ({
          id: acc.id,
          name: acc.displayName,
          platform: acc.platform.toLowerCase()
        }));

      setProfiles(profileList);

      // Se houver perfis, seleciona o primeiro por padrão
      if (profileList.length > 0 && selectedIds.length === 0) {
        onChange([profileList[0].id]);
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]
    );
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
        Selecionar perfis
      </label>
      <div className="flex flex-col gap-2 rounded-card border border-black/5 bg-brand-surface p-2 shadow-soft">
        {isLoading ? (
          <div className="py-4 text-center text-xs text-brand-muted">Carregando perfis...</div>
        ) : profiles.length === 0 ? (
          <div className="py-4 text-center text-xs text-brand-muted">
            Nenhum perfil conectado. Acesse Painel de Conexões para conectar.
          </div>
        ) : (
          profiles.map((profile) => {
            const active = selectedIds.includes(profile.id);
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => toggle(profile.id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                  active ? "bg-brand-bg" : "hover:bg-brand-bg/60"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-bg">
                  <PlatformIcon platform={profile.platform} className="h-4 w-4" />
                </span>
                <span className="flex-1 truncate font-medium">{profile.name}</span>
                <span
                  className={`h-4 w-4 rounded-full border ${
                    active ? "border-transparent bg-brand-gradient" : "border-black/20"
                  }`}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
