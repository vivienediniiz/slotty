import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const posts = await prisma.post.findMany({
    where: { userId: user.id },
    orderBy: { scheduledFor: "desc" },
    include: {
      media: { orderBy: { order: "asc" } },
      channels: {
        include: { socialAccount: true }
      }
    }
  });

  return NextResponse.json(posts);
}

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
  const { content, scheduledFor, timezone, hashtags, media, accountIds } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (!accountIds || accountIds.length === 0) {
    return NextResponse.json({ error: "At least one social account is required" }, { status: 400 });
  }

  // Buscar contas sociais do usuário, garantindo que pertencem a ele
  const socialAccounts = await prisma.socialAccount.findMany({
    where: {
      userId: user.id,
      id: { in: accountIds }
    }
  });

  if (socialAccounts.length === 0) {
    return NextResponse.json(
      { error: "No valid social accounts found for the selected profiles" },
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
