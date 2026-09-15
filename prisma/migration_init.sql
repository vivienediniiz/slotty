-- Slotty MVP - Initial Schema Migration
-- Execute this in Supabase SQL Editor: project slotty → SQL Editor → paste → Run

-- Create enums
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'THREADS');
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- Create users table (NextAuth compatible)
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMP,
  "passwordHash" TEXT,
  "image" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create auth_accounts table (NextAuth Prisma Adapter)
CREATE TABLE "auth_accounts" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  UNIQUE ("provider", "providerAccountId")
);

-- Create sessions table (NextAuth Prisma Adapter)
CREATE TABLE "sessions" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create verification_tokens table (NextAuth Prisma Adapter)
CREATE TABLE "verification_tokens" (
  "identifier" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  UNIQUE ("identifier", "token")
);

-- Create social_accounts table (Connected social media accounts)
CREATE TABLE "social_accounts" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "platform" "SocialPlatform" NOT NULL,
  "displayName" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "tokenExpires" TIMESTAMP,
  "isConnected" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  UNIQUE ("userId", "platform", "displayName")
);

-- Create posts table (Scheduled posts)
CREATE TABLE "posts" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledFor" TIMESTAMP,
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create post_media table (Images/Videos for posts)
CREATE TABLE "post_media" (
  "id" TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" "MediaType" NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE
);

-- Create post_channels table (Post distribution per channel)
CREATE TABLE "post_channels" (
  "id" TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "socialAccountId" TEXT NOT NULL,
  "status" "PostStatus" NOT NULL DEFAULT 'SCHEDULED',
  "publishedAt" TIMESTAMP,
  "externalPostId" TEXT,
  "errorMessage" TEXT,
  FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE,
  FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE,
  UNIQUE ("postId", "socialAccountId")
);

-- Create indexes for performance
CREATE INDEX "posts_userId_scheduledFor_idx" ON "posts"("userId", "scheduledFor");
