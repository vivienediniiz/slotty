import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function publishToFacebook(token: string, content: string) {
  try {
    const res = await fetch("https://graph.facebook.com/v18.0/me/feed", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message: content,
        access_token: token
      }).toString()
    });
    const data = await res.json();
    return data.id || null;
  } catch (err) {
    console.error("Facebook publish error:", err);
    return null;
  }
}

async function publishToInstagram(token: string, content: string, mediaUrls: string[]) {
  // Instagram requer criar container de imagem primeiro, depois publicar
  // Por enquanto, apenas suportar texto
  try {
    const res = await fetch("https://graph.instagram.com/me/media", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        caption: content,
        access_token: token
      }).toString()
    });
    const data = await res.json();
    return data.id || null;
  } catch (err) {
    console.error("Instagram publish error:", err);
    return null;
  }
}

async function publishToLinkedIn(token: string, content: string) {
  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        author: "urn:li:person:me",
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc:ShareContent": {
            shareMediaCategory: "ARTICLE",
            shareCommentary: { text: content }
          }
        },
        visibility: {
          "com.linkedin.ugc:ShareVisibility": {
            code: "PUBLIC"
          }
        }
      })
    });
    const data = await res.json();
    return data.id || null;
  } catch (err) {
    console.error("LinkedIn publish error:", err);
    return null;
  }
}

async function publishToThreads(token: string, content: string) {
  try {
    const res = await fetch("https://graph.threads.net/v1.0/me/threads", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        text: content,
        access_token: token
      }).toString()
    });
    const data = await res.json();
    return data.id || null;
  } catch (err) {
    console.error("Threads publish error:", err);
    return null;
  }
}

export async function POST(request: Request) {
  // Verificar autorização via header secreto (Vercel Cron)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Buscar posts agendados para agora ou passado
    const now = new Date();
    const posts = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: { lte: now }
      },
      include: {
        user: true,
        media: true,
        channels: { include: { socialAccount: true } }
      },
      take: 10 // Processar até 10 posts por execução
    });

    let published = 0;
    let failed = 0;

    for (const post of posts) {
      for (const channel of post.channels) {
        if (!channel.socialAccount) continue;

        const platform = channel.socialAccount.platform;
        let externalPostId: string | null = null;

        // Publicar conforme a plataforma
        if (platform === "FACEBOOK") {
          externalPostId = await publishToFacebook(channel.socialAccount.accessToken, post.content);
        } else if (platform === "INSTAGRAM") {
          externalPostId = await publishToInstagram(
            channel.socialAccount.accessToken,
            post.content,
            post.media.map((m) => m.url)
          );
        } else if (platform === "LINKEDIN") {
          externalPostId = await publishToLinkedIn(channel.socialAccount.accessToken, post.content);
        } else if (platform === "THREADS") {
          externalPostId = await publishToThreads(channel.socialAccount.accessToken, post.content);
        }

        // Atualizar status do canal
        await prisma.postChannel.update({
          where: { id: channel.id },
          data: {
            status: externalPostId ? "PUBLISHED" : "FAILED",
            externalPostId: externalPostId || undefined,
            publishedAt: externalPostId ? now : undefined,
            errorMessage: externalPostId ? undefined : "Failed to publish"
          }
        });

        if (externalPostId) {
          published++;
        } else {
          failed++;
        }
      }

      // Atualizar status do post se todos os canais foram publicados
      const allPublished = post.channels.every(
        (c) => c.status === "PUBLISHED" || c.status === "FAILED"
      );

      if (allPublished) {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "PUBLISHED" }
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: posts.length,
      published,
      failed
    });
  } catch (error) {
    console.error("Publish job error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Job failed" },
      { status: 500 }
    );
  }
}
