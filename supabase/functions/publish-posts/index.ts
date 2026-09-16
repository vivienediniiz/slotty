import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";

const supabase = createClient(supabaseUrl, supabaseKey);

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

    if (data.error) {
      throw new Error(data.error.message || "Instagram API Error");
    }

    return data.id || null;
  } catch (err) {
    console.error("Instagram publish error:", err);
    throw err;
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

    if (data.error) {
      throw new Error(data.error.message || "LinkedIn API Error");
    }

    return data.id || null;
  } catch (err) {
    console.error("LinkedIn publish error:", err);
    throw err;
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

    if (data.error) {
      throw new Error(data.error.message || "Threads API Error");
    }

    return data.id || null;
  } catch (err) {
    console.error("Threads publish error:", err);
    throw err;
  }
}

Deno.serve(async (req) => {
  try {
    // Buscar posts agendados para agora ou passado
    const now = new Date();
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(
        `
        id,
        content,
        status,
        scheduledFor,
        postChannels:post_channels(
          id,
          status,
          socialAccountId,
          socialAccount:social_accounts(
            id,
            platform,
            accessToken
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
      let postPublished = 0;

      for (const channel of post.postChannels || []) {
        if (!channel.socialAccount) continue;

        const platform = channel.socialAccount.platform;
        const token = channel.socialAccount.accessToken;
        let externalPostId: string | null = null;
        let error: string | null = null;

        try {
          if (platform === "FACEBOOK") {
            externalPostId = await publishToFacebook(token, post.content);
          } else if (platform === "INSTAGRAM") {
            externalPostId = await publishToInstagram(token, post.content);
          } else if (platform === "LINKEDIN") {
            externalPostId = await publishToLinkedIn(token, post.content);
          } else if (platform === "THREADS") {
            externalPostId = await publishToThreads(token, post.content);
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

        // Atualizar status do canal
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

      // Atualizar status do post
      const allChannels = post.postChannels || [];
      const allProcessed = allChannels.length > 0;

      if (allProcessed) {
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
