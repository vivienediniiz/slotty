import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SOCIAL_CONFIG, getCallbackUrl } from "@/lib/social-config";

export const dynamic = "force-dynamic";

const MOCK_ACCOUNTS = {
  INSTAGRAM: { displayName: "@agenciadiniz" },
  FACEBOOK: { displayName: "Agência Diniz" },
  LINKEDIN: { displayName: "Agência Diniz" },
  THREADS: { displayName: "@agenciadiniz.threads" }
};

async function fetchDisplayName(platform: string, accessToken: string): Promise<string | null> {
  try {
    if (platform === "FACEBOOK") {
      const res = await fetch(`https://graph.facebook.com/me?fields=name&access_token=${accessToken}`);
      const data = await res.json();
      return data.name || null;
    }

    if (platform === "INSTAGRAM") {
      // Busca as Páginas do Facebook do usuário e a conta profissional do Instagram vinculada
      const pagesRes = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{username}&access_token=${accessToken}`
      );
      const pagesData = await pagesRes.json();
      const pageWithInstagram = pagesData.data?.find((page: { instagram_business_account?: { username: string } }) => page.instagram_business_account);
      const username = pageWithInstagram?.instagram_business_account?.username;
      return username ? `@${username}` : null;
    }

    if (platform === "THREADS") {
      const res = await fetch(`https://graph.threads.net/v1.0/me?fields=username&access_token=${accessToken}`);
      const data = await res.json();
      return data.username ? `@${data.username}` : null;
    }

    if (platform === "LINKEDIN") {
      // Endpoint padrão OpenID Connect (produto "Sign In with LinkedIn using OpenID Connect")
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      return data.name || null;
    }

    return null;
  } catch (err) {
    console.error(`Failed to fetch display name for ${platform}:`, err);
    return null;
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Usuário rejeitou permissões
  if (error) {
    return NextResponse.redirect(new URL(`/connections?error=${error}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/connections?error=invalid_params", request.url));
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const platform = stateData.platform;

    // Valida state (proteção CSRF)
    if (stateData.userId !== session.user.email || !platform) {
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
    if (config.appId && config.appSecret && config.tokenUrl && code) {
      try {
        const tokenResponse = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: config.appId,
            client_secret: config.appSecret,
            redirect_uri: getCallbackUrl(),
            grant_type: "authorization_code",
            code
          }).toString()
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          const fetchedName = await fetchDisplayName(platform, accessToken);
          if (fetchedName) {
            displayName = fetchedName;
          }
        } else {
          // Fallback para mock se falhar
          console.warn(`${platform} token exchange failed, using mock`, tokenData);
        }
      } catch (apiError) {
        console.error(`${platform} API error:`, apiError);
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
          platform: platform as "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "THREADS",
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

