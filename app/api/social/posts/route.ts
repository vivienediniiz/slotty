import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content, scheduledFor, timezone, hashtags, media, platforms } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (!platforms || platforms.length === 0) {
    return NextResponse.json({ error: "At least one platform is required" }, { status: 400 });
  }

  // Buscar contas sociais do usuário para as plataformas selecionadas
  const socialAccounts = await prisma.socialAccount.findMany({
    where: {
      userId: user.id,
      platform: { in: platforms }
    }
  });

  if (socialAccounts.length === 0) {
    return NextResponse.json(
      { error: "No social accounts connected for selected platforms" },
      { status: 400 }
    );
  }

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      content,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      timezone,
      hashtags,
      status: "SCHEDULED",
      media: {
        create: (media || []).map((m: any, i: number) => ({
          url: m.url,
          type: m.type || "IMAGE",
          order: i
        }))
      },
      channels: {
        create: socialAccounts.map((account) => ({
          socialAccountId: account.id,
          status: "SCHEDULED"
        }))
      }
    },
    include: { media: true, channels: true }
  });

  return NextResponse.json(post, { status: 201 });
}
