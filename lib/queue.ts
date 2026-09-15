import { Queue, Worker, DelayedError } from "bullmq";
import { Redis } from "ioredis";

// Configurar Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

export const publishQueue = new Queue("publish-posts", { connection: redis });

export type PublishJobData = {
  postId: string;
  userId: string;
};

// Configurar worker
export const publishWorker = new Worker(
  "publish-posts",
  async (job) => {
    const { postId } = job.data as PublishJobData;

    try {
      // Chamar o endpoint de publicação
      const response = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/social/publish/${postId}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Publication failed: ${response.statusText}`);
      }

      return { success: true, postId };
    } catch (error) {
      console.error(`Job failed for post ${postId}:`, error);
      throw error;
    }
  },
  { connection: redis }
);

publishWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed: ${job.data.postId}`);
});

publishWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

export async function schedulePostPublish(postId: string, userId: string, scheduledFor: Date) {
  const delayMs = scheduledFor.getTime() - Date.now();

  if (delayMs <= 0) {
    // Se já passou, agendar imediatamente
    await publishQueue.add(
      "publish",
      { postId, userId },
      { priority: 10 }
    );
  } else {
    // Agendar para o horário específico
    await publishQueue.add(
      "publish",
      { postId, userId },
      { delay: delayMs }
    );
  }
}

export async function closeQueue() {
  await publishWorker.close();
  await publishQueue.close();
}
