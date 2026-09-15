// Configuração das plataformas sociais para OAuth
// App IDs e Secrets devem estar em variáveis de ambiente

export const SOCIAL_CONFIG = {
  FACEBOOK: {
    appId: process.env.FACEBOOK_APP_ID || "",
    appSecret: process.env.FACEBOOK_APP_SECRET || "",
    scope: ["pages_manage_posts", "pages_read_engagement", "pages_manage_metadata"],
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token"
  },
  INSTAGRAM: {
    appId: process.env.INSTAGRAM_APP_ID || "",
    appSecret: process.env.INSTAGRAM_APP_SECRET || "",
    scope: ["instagram_business_basic", "instagram_business_manage_messages"],
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://graph.instagram.com/v18.0/access_token"
  },
  LINKEDIN: {
    appId: process.env.LINKEDIN_APP_ID || "",
    appSecret: process.env.LINKEDIN_APP_SECRET || "",
    scope: ["w_member_social", "r_organization_social"],
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken"
  },
  THREADS: {
    // Threads ainda não tem OAuth público, usar Meta's Business SDK
    appId: process.env.FACEBOOK_APP_ID || "",
    appSecret: process.env.FACEBOOK_APP_SECRET || "",
    scope: ["instagram_business_basic"],
    authUrl: "", // Via Facebook OAuth
    tokenUrl: ""
  }
};

export function getCallbackUrl(platform: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/api/social/callback?platform=${platform.toUpperCase()}`;
}
