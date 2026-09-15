"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GradientButton } from "@/components/ui/GradientButton";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Não foi possível criar sua conta.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/schedule");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-sm rounded-card bg-brand-surface p-8 shadow-soft-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gradient-brand">Slotty</h1>
          <p className="mt-2 text-sm text-brand-muted">Reserve seu slot grátis.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-medium text-brand-muted">
              Nome
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#E56BB4]"
            />
          </div>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#E56BB4]"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-xs font-medium text-brand-muted"
            >
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#E56BB4]"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <GradientButton type="submit" fullWidth disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </GradientButton>
        </form>

        <p className="mt-6 text-center text-xs text-brand-muted">
          Já tem uma conta?{" "}
          <a href="/login" className="font-medium text-gradient-brand">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}
