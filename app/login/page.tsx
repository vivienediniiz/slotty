"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GradientButton } from "@/components/ui/GradientButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    router.push("/schedule");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-sm rounded-card bg-brand-surface p-8 shadow-soft-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gradient-brand">Slotty</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Encontre o slot perfeito para o seu conteúdo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-brand-muted">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#E56BB4]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-brand-muted">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#E56BB4]"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <GradientButton type="submit" fullWidth disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </GradientButton>
        </form>

        <p className="mt-6 text-center text-xs text-brand-muted">
          Ainda não tem conta?{" "}
          <a href="/register" className="font-medium text-gradient-brand">
            Reserve seu slot grátis
          </a>
        </p>
      </div>
    </main>
  );
}
