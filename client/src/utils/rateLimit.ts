// utils/rateLimit.ts
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { Redis } from "ioredis";
import { NextRequest, NextResponse } from "next/server";

let rateLimiter: RateLimiterMemory | RateLimiterRedis;

const pointsPerCheck = 5;
const checkWindowSeconds = 1;
const blockDurationSeconds = 60 * 15;

if (process.env.NODE_ENV === "production" && process.env.REDIS_CONNECTION_STRING) {
  const redisClient = new Redis(process.env.REDIS_CONNECTION_STRING);
  rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: pointsPerCheck,
    duration: checkWindowSeconds,
    blockDuration: blockDurationSeconds,
  });
  console.log("Rate limiting: Using Redis for production.");
} else {
  rateLimiter = new RateLimiterMemory({
    points: pointsPerCheck,
    duration: checkWindowSeconds,
    blockDuration: blockDurationSeconds,
  });
  console.log("Rate limiting: Using in-memory for development/testing.");
}

export default async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  try {
    const xForwardedFor = request.headers.get("x-forwarded-for");

    let ip: string;
    if (Array.isArray(xForwardedFor)) {
      ip = xForwardedFor[0].trim();
    } else if (typeof xForwardedFor === "string") {
      ip = xForwardedFor.split(",")[0].trim();
    } else {
      ip = "127.0.0.1";
    }

    await rateLimiter.consume(ip);
    return null;
  } catch (rejRes: unknown) {
    const retryAfterSeconds = (rejRes as { msBeforeNext: number }).msBeforeNext / 1000;

    return new NextResponse(JSON.stringify({ message: "Too Many Requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfterSeconds.toString(),
      },
    });
  }
}
