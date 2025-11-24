import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const screenId = Number(id);
  if (!screenId) {
    return NextResponse.json({ error: "Invalid screen id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.content)) {
    return NextResponse.json({ error: "Invalid content payload" }, { status: 400 });
  }

  const username = (session.user as any).username as string;

  const screen = await prisma.invitationScreen.findUnique({ where: { id: screenId } });
  if (!screen || screen.birthdayUsername !== username) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }

  await prisma.invitationScreen.update({
    where: { id: screenId },
    data: {
      content: body.content,
      layoutType: "single",
      fragments: null,
    },
  });

  return NextResponse.json({ ok: true });
}
