import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    if (data.error) {
      console.error("Facebook API Error:", data.error);
      throw new Error(data.error.message || "Facebook API Error");
    }

    return data.id || null;
  } catch (err) {
    console.error("Facebook publish error:", err);
    throw err;
  }
}

async function publishToInstagram(token: string, content: string) {
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

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const postId = params.postId;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        channels: { include: { socialAccount: true } }
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let published = 0;
    let failed = 0;
    const now = new Date();

    for (const channel of post.channels) {
      if (!channel.socialAccount) continue;

      const platform = channel.socialAccount.platform;
      let externalPostId: string | null = null;

      if (platform === "FACEBOOK") {
        externalPostId = await publishToFacebook(channel.socialAccount.accessToken, post.content);
      } else if (platform === "INSTAGRAM") {
        externalPostId = await publishToInstagram(channel.socialAccount.accessToken, post.content);
      } else if (platform === "LINKEDIN") {
        externalPostId = await publishToLinkedIn(channel.socialAccount.accessToken, post.content);
      } else if (platform === "THREADS") {
        externalPostId = await publishToThreads(channel.socialAccount.accessToken, post.content);
      }

      await prisma.postChannel.update({
        where: { id: channel.id },
        data: {
          status: externalPostId ? "PUBLISHED" : "FAILED",
          externalPostId: externalPostId || undefined,
          publishedAt: externalPostId ? now : undefined,
          errorMessage: externalPostId ? undefined : (externalPostId === null ? "API returned null" : "Failed to publish")
        }
      });

      if (externalPostId) {
        published++;
      } else {
        failed++;
      }
    }

    await prisma.post.update({
      where: { id: postId },
      data: { status: published > 0 ? "PUBLISHED" : "FAILED" }
    });

    return NextResponse.json({
      success: published > 0,
      postId,
      published,
      failed
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publish failed" },
      { status: 500 }
    );
  }
}
