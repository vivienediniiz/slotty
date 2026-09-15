import { NextResponse } from "next/server";

const MOCK_ACCOUNTS = {
  INSTAGRAM: {
    displayName: "@agenciadiniz",
    accessToken: "mock_ig_token_" + Math.random().toString(36).slice(2, 15)
  },
  FACEBOOK: {
    displayName: "Agência Diniz",
    accessToken: "mock_fb_token_" + Math.random().toString(36).slice(2, 15)
  },
  LINKEDIN: {
    displayName: "Agência Diniz",
    accessToken: "mock_li_token_" + Math.random().toString(36).slice(2, 15)
  },
  THREADS: {
    displayName: "@agenciadiniz.threads",
    accessToken: "mock_th_token_" + Math.random().toString(36).slice(2, 15)
  }
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform");
  const state = url.searchParams.get("state");

  if (!platform || !state) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const mock = MOCK_ACCOUNTS[platform as keyof typeof MOCK_ACCOUNTS];
  if (!mock) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  // Simula redirecionamento de volta para callback (em produção viria da API da rede)
  const callbackUrl = new URL("/api/social/callback", request.url);
  callbackUrl.searchParams.set("code", "mock_code_" + Date.now());
  callbackUrl.searchParams.set("state", state);
  callbackUrl.searchParams.set("platform", platform);

  return NextResponse.redirect(callbackUrl.toString());
}
