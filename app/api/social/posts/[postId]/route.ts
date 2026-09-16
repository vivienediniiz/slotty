import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
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

  const postId = params.postId;

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  // Verify post belongs to user
  const post = await prisma.post.findUnique({
    where: { id: postId }
  });

  if (!post || post.userId !== user.id) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Delete post (cascade will handle related records)
  await prisma.post.delete({
    where: { id: postId }
  });

  return NextResponse.json({ success: true });
}
