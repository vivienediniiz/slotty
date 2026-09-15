import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SOCIAL_CONFIG, getCallbackUrl } from "@/lib/social-config";

const MOCK_ACCOUNTS = {
  INSTAGRAM: { displayName: "@agenciadiniz" },
  FACEBOOK: { displayName: "Agência Diniz" },
  LINKEDIN: { displayName: "Agência Diniz" },
  THREADS: { displayName: "@agenciadiniz.threads" }
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const platform = url.searchParams.get("platform");
  const error = url.searchParams.get("error");

  // Usuário rejeitou permissões
  if (error) {
    return NextResponse.redirect(new URL(`/connections?error=${error}`, request.url));
  }

  if (!code || !state || !platform) {
    return NextResponse.redirect(new URL("/connections?error=invalid_params", request.url));
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());

    // Valida state (proteção CSRF)
    if (stateData.userId !== session.user.email) {
      return NextResponse.redirect(new URL("/connections?error=invalid_state", request.url));
    }

    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const config = SOCIAL_CONFIG[platform as keyof typeof SOCIAL_CONFIG];
    let displayName = MOCK_ACCOUNTS[platform as keyof typeof MOCK_ACCOUNTS]?.displayName || "";
    let accessToken = "mock_token_" + Date.now();

    // Se tiver credenciais reais e recebeu código, trocar por token real
    if (platform === "FACEBOOK" && config.appId && config.appSecret && code) {
      try {
        const tokenResponse = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: config.appId,
            client_secret: config.appSecret,
            redirect_uri: getCallbackUrl(platform),
            code
          }).toString()
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          accessToken = tokenData.access_token;

          // Busca informações do usuário no Facebook
          const meResponse = await fetch(
            `https://graph.facebook.com/me?fields=name,picture&access_token=${accessToken}`
          );
          const meData = await meResponse.json();

          if (meData.name) {
            displayName = meData.name;
          }
        } else {
          // Fallback para mock se falhar
          console.warn("Facebook token exchange failed, using mock", tokenData);
        }
      } catch (fbError) {
        console.error("Facebook API error:", fbError);
        // Fallback para mock
      }
    }

    // Verifica se já existe conexão com essa plataforma
    const existing = await prisma.socialAccount.findFirst({
      where: { userId: user.id, platform: platform as "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "THREADS" }
    });

    if (existing) {
      // Atualiza a conexão existente
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          displayName,
          accessToken,
          isConnected: true
        }
      });
    } else {
      // Cria nova conexão
      await prisma.socialAccount.create({
        data: {
          userId: user.id,
          platform,
          displayName,
          accessToken,
          isConnected: true
        }
      });
    }

    return NextResponse.redirect(new URL("/connections?success=true", request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/connections?error=server_error", request.url));
  }
}

