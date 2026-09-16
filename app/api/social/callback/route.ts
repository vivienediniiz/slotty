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

type ResolvedAccount = {
  displayName: string;
  accessToken: string;
  externalId: string | null;
};

// Tokens de Página herdam a validade do token de usuário que os gerou. Sem trocar
// pelo de longa duração primeiro, o token morre em ~1h e todo agendamento falha.
async function exchangeForLongLivedToken(
  appId: string,
  appSecret: string,
  shortLivedToken: string
): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?${new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken
    })}`
  );
  const data = await res.json();
  return data.access_token || shortLivedToken;
}

async function resolveAccount(
  platform: string,
  accessToken: string,
  appId: string,
  appSecret: string
): Promise<ResolvedAccount | null> {
  try {
    // Facebook e Instagram publicam via Página, nunca via perfil pessoal.
    if (platform === "FACEBOOK" || platform === "INSTAGRAM") {
      const userToken = await exchangeForLongLivedToken(appId, appSecret, accessToken);
      const res = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${userToken}`
      );
      const data = await res.json();

      if (data.error) {
        console.error(`${platform} /me/accounts error:`, data.error);
        return null;
      }

      type Page = {
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: { id: string; username: string };
      };
      const pages: Page[] = data.data || [];

      if (platform === "FACEBOOK") {
        // MVP: usa a primeira Página. Se houver várias, vale deixar o usuário escolher.
        const page = pages[0];
        if (!page) return null;
        return {
          displayName: page.name,
          accessToken: page.access_token,
          externalId: page.id
        };
      }

      const pageWithInstagram = pages.find((page) => page.instagram_business_account);
      const instagram = pageWithInstagram?.instagram_business_account;
      if (!pageWithInstagram || !instagram) return null;
      return {
        displayName: `@${instagram.username}`,
        // Publicação no Instagram é autenticada com o token da Página vinculada.
        accessToken: pageWithInstagram.access_token,
        externalId: instagram.id
      };
    }

    if (platform === "THREADS") {
      const res = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${accessToken}`);
      const data = await res.json();
      if (!data.username) return null;
      return { displayName: `@${data.username}`, accessToken, externalId: data.id || null };
    }

    if (platform === "LINKEDIN") {
      // Endpoint padrão OpenID Connect (produto "Sign In with LinkedIn using OpenID Connect")
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (!data.name) return null;
      // sub = URN do membro, obrigatório para publicar via /v2/ugcPosts
      return { displayName: data.name, accessToken, externalId: data.sub || null };
    }

    return null;
  } catch (err) {
    console.error(`Failed to resolve account for ${platform}:`, err);
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
    const requiresPage = platform === "FACEBOOK" || platform === "INSTAGRAM";
    let displayName = MOCK_ACCOUNTS[platform as keyof typeof MOCK_ACCOUNTS]?.displayName || "";
    let accessToken = "mock_token_" + Date.now();
    let externalId: string | null = null;

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
          const resolved = await resolveAccount(
            platform,
            tokenData.access_token,
            config.appId,
            config.appSecret
          );

          if (resolved) {
            accessToken = resolved.accessToken;
            externalId = resolved.externalId;
            if (resolved.displayName) displayName = resolved.displayName;
          } else if (requiresPage) {
            // Sem Página não há como publicar. Salvar um mock aqui criaria uma
            // conexão que aparenta funcionar e falha silenciosamente no agendamento.
            return NextResponse.redirect(new URL("/connections?error=no_page", request.url));
          }
        } else if (requiresPage) {
          console.error(`${platform} token exchange failed`, tokenData);
          return NextResponse.redirect(new URL("/connections?error=token_exchange", request.url));
        } else {
          // Fallback para mock se falhar
          console.warn(`${platform} token exchange failed, using mock`, tokenData);
        }
      } catch (apiError) {
        console.error(`${platform} API error:`, apiError);
        if (requiresPage) {
          return NextResponse.redirect(new URL("/connections?error=server_error", request.url));
        }
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
          externalId,
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
          externalId,
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

