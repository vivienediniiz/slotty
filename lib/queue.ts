import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";

export type PublishJobData = {
  postId: string;
  userId: string;
};

let publishQueue: Queue | null = null;
let publishWorker: Worker | null = null;

function getRedisConnection() {
  return new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: true
  });
}

async function initializeQueue() {
  if (publishQueue) return publishQueue;

  const connection = getRedisConnection();

  publishQueue = new Queue("publish-posts", { connection });

  // Inicializar worker apenas se não estamos em build time
  if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    initializeWorker(connection);
  }

  return publishQueue;
}

function initializeWorker(connection: Redis) {
  if (publishWorker) return;

  publishWorker = new Worker(
    "publish-posts",
    async (job) => {
      const { postId } = job.data as PublishJobData;

      try {
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
    { connection }
  );

  publishWorker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed: ${job.data.postId}`);
  });

  publishWorker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });
}

export async function schedulePostPublish(postId: string, userId: string, scheduledFor: Date) {
  const queue = await initializeQueue();
  const delayMs = scheduledFor.getTime() - Date.now();

  if (delayMs <= 0) {
    await queue.add("publish", { postId, userId }, { priority: 10 });
  } else {
    await queue.add("publish", { postId, userId }, { delay: delayMs });
  }
}

export async function closeQueue() {
  if (publishWorker) {
    await publishWorker.close();
  }
  if (publishQueue) {
    await publishQueue.close();
  }
}
