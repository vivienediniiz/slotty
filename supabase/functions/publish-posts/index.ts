import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const GRAPH = "https://graph.facebook.com/v18.0";

async function graphPost(url: string, params: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString()
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || "Graph API Error");
  }
  return data;
}

// A Meta removeu a publicação em perfil pessoal junto com publish_actions (2018),
// então o alvo é sempre uma Página.
async function publishToFacebook(
  token: string,
  pageId: string,
  content: string,
  imageUrl: string | null
) {
  const data = imageUrl
    ? await graphPost(`${GRAPH}/${pageId}/photos`, {
        url: imageUrl,
        caption: content,
        access_token: token
      })
    : await graphPost(`${GRAPH}/${pageId}/feed`, {
        message: content,
        access_token: token
      });

  return data.post_id || data.id || null;
}

// Instagram publica em duas etapas: cria um container com a mídia e depois publica.
// A imagem precisa estar numa URL pública — os servidores da Meta é que a baixam.
async function publishToInstagram(
  token: string,
  igUserId: string,
  content: string,
  imageUrl: string | null
) {
  if (!imageUrl) {
    throw new Error("Instagram exige uma imagem: post somente com texto não é aceito pela API");
  }

  const container = await graphPost(`${GRAPH}/${igUserId}/media`, {
    image_url: imageUrl,
    caption: content,
    access_token: token
  });

  const published = await graphPost(`${GRAPH}/${igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: token
  });

  return published.id || null;
}

async function publishToLinkedIn(token: string, memberId: string, content: string) {
  if (!memberId) {
    throw new Error("LinkedIn exige o URN do membro; reconecte a conta para obtê-lo");
  }

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0"
    },
    body: JSON.stringify({
      author: `urn:li:person:${memberId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    })
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "LinkedIn API Error");
  }

  return data.id || null;
}

async function publishToThreads(token: string, userId: string, content: string) {
  const container = await graphPost(`https://graph.threads.net/v1.0/${userId || "me"}/threads`, {
    media_type: "TEXT",
    text: content,
    access_token: token
  });

  const published = await graphPost(
    `https://graph.threads.net/v1.0/${userId || "me"}/threads_publish`,
    {
      creation_id: container.id,
      access_token: token
    }
  );

  return published.id || null;
}

Deno.serve(async () => {
  try {
    const now = new Date();
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(
        `
        id,
        content,
        status,
        scheduledFor,
        media:post_media(url, type, order),
        postChannels:post_channels(
          id,
          status,
          socialAccountId,
          socialAccount:social_accounts(
            id,
            platform,
            accessToken,
            externalId
          )
        )
      `
      )
      .eq("status", "SCHEDULED")
      .lte("scheduledFor", now.toISOString())
      .limit(10);

    if (postsError) {
      throw postsError;
    }

    let published = 0;
    let failed = 0;

    for (const post of posts || []) {
      const sortedMedia = [...(post.media || [])].sort((a, b) => a.order - b.order);
      const imageUrl = sortedMedia.find((m) => m.type === "IMAGE")?.url || null;

      let postPublished = 0;

      for (const channel of post.postChannels || []) {
        if (!channel.socialAccount) continue;

        const { platform, accessToken: token, externalId } = channel.socialAccount;
        let externalPostId: string | null = null;
        let error: string | null = null;

        try {
          if (platform === "FACEBOOK") {
            if (!externalId) throw new Error("Página do Facebook não vinculada; reconecte a conta");
            externalPostId = await publishToFacebook(token, externalId, post.content, imageUrl);
          } else if (platform === "INSTAGRAM") {
            if (!externalId) throw new Error("Conta profissional do Instagram não vinculada; reconecte a conta");
            externalPostId = await publishToInstagram(token, externalId, post.content, imageUrl);
          } else if (platform === "LINKEDIN") {
            externalPostId = await publishToLinkedIn(token, externalId, post.content);
          } else if (platform === "THREADS") {
            externalPostId = await publishToThreads(token, externalId, post.content);
          }

          if (externalPostId) {
            published++;
            postPublished++;
          } else {
            failed++;
            error = "API returned null";
          }
        } catch (err) {
          failed++;
          error = err instanceof Error ? err.message : "Publication failed";
          console.error(`Error publishing to ${platform}:`, error);
        }

        const { error: updateError } = await supabase
          .from("post_channels")
          .update({
            status: externalPostId ? "PUBLISHED" : "FAILED",
            externalPostId: externalPostId,
            publishedAt: externalPostId ? now.toISOString() : null,
            errorMessage: error
          })
          .eq("id", channel.id);

        if (updateError) {
          console.error("Error updating channel:", updateError);
        }
      }

      if ((post.postChannels || []).length > 0) {
        const { error: postUpdateError } = await supabase
          .from("posts")
          .update({
            status: postPublished > 0 ? "PUBLISHED" : "FAILED"
          })
          .eq("id", post.id);

        if (postUpdateError) {
          console.error("Error updating post:", postUpdateError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: posts?.length || 0,
        published,
        failed
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Publish job error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Job failed"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
