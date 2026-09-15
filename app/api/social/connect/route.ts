import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SOCIAL_CONFIG, getCallbackUrl } from "@/lib/social-config";

export const dynamic = "force-dynamic";

const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "THREADS"] as const;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await request.json();

  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ userId: session.user.email, platform })).toString(
    "base64"
  );

  const config = SOCIAL_CONFIG[platform as keyof typeof SOCIAL_CONFIG];

  // Se tiver credenciais reais, usar OAuth real. Senão, usar mock
  if (platform === "FACEBOOK" && config.appId && config.appSecret) {
    const params = new URLSearchParams({
      client_id: config.appId,
      redirect_uri: getCallbackUrl(),
      scope: "public_profile",
      state
    });

    return NextResponse.json({
      redirectUrl: `${config.authUrl}?${params.toString()}`
    });
  }

  // Fallback: mock OAuth
  const redirectUrl = new URL("/api/social/mock-oauth", request.url);
  redirectUrl.searchParams.set("platform", platform);
  redirectUrl.searchParams.set("state", state);

  return NextResponse.json({ redirectUrl: redirectUrl.toString() });
}
