// Configuração das plataformas sociais para OAuth
// App IDs e Secrets devem estar em variáveis de ambiente

export const SOCIAL_CONFIG = {
  FACEBOOK: {
    appId: process.env.FACEBOOK_APP_ID || "",
    appSecret: process.env.FACEBOOK_APP_SECRET || "",
    scope: ["public_profile", "pages_show_list", "pages_read_engagement", "pages_manage_posts"],
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token"
  },
  INSTAGRAM: {
    // Instagram Graph API (contas business) usa o mesmo app do Facebook,
    // vinculado a uma Página do Facebook com uma conta profissional do Instagram
    appId: process.env.FACEBOOK_APP_ID || "",
    appSecret: process.env.FACEBOOK_APP_SECRET || "",
    scope: ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"],
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token"
  },
  LINKEDIN: {
    appId: process.env.LINKEDIN_APP_ID || "",
    appSecret: process.env.LINKEDIN_APP_SECRET || "",
    scope: ["w_member_social", "r_organization_social"],
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken"
  },
  THREADS: {
    appId: process.env.THREADS_APP_ID || "",
    appSecret: process.env.THREADS_APP_SECRET || "",
    scope: ["threads_basic", "threads_content_publish"],
    authUrl: "https://threads.net/oauth/authorize",
    tokenUrl: "https://graph.threads.net/oauth/access_token"
  }
};

export function getCallbackUrl(): string {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/api/social/callback`;
}
