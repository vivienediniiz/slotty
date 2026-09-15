import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { socialAccountId } = await request.json();

  if (!socialAccountId) {
    return NextResponse.json({ error: "Missing socialAccountId" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verifica que a conta social pertence ao usuário
  const account = await prisma.socialAccount.findFirst({
    where: { id: socialAccountId, userId: user.id }
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Deleta a conexão
  await prisma.socialAccount.delete({
    where: { id: socialAccountId }
  });

  return NextResponse.json({ success: true });
}
