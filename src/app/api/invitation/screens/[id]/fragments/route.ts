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
  if (!body || !Array.isArray(body.fragments)) {
    return NextResponse.json({ error: "Invalid fragments payload" }, { status: 400 });
  }

  type NormalizedFragment = {
    position: "left" | "right";
    content: unknown[];
    title: string | null;
    description: string | null;
    backgroundMode?: "inherit" | "color" | "image";
    backgroundColor?: string | null;
    backgroundImageUrl?: string | null;
  };

  const normalizedFragments: NormalizedFragment[] = [];

  for (const fragment of body.fragments) {
    if (!fragment || typeof fragment !== "object") {
      return NextResponse.json({ error: "Invalid fragment shape" }, { status: 400 });
    }

    const position = fragment.position === "right" ? "right" : "left";
    if (!Array.isArray(fragment.content)) {
      return NextResponse.json({ error: "Fragment content must be an array" }, { status: 400 });
    }

    let description: string | null = null;
    if (typeof fragment.description === "string") {
      const trimmed = fragment.description.trim();
      description = trimmed.length > 0 ? trimmed : null;
    } else if (fragment.description === null) {
      description = null;
    }

    let title: string | null = null;
    if (typeof fragment.title === "string") {
      const trimmed = fragment.title.trim();
      title = trimmed.length > 0 ? trimmed : null;
    } else if (fragment.title === null) {
      title = null;
    }

    const rawMode = fragment.backgroundMode;
    const backgroundMode: "inherit" | "color" | "image" =
      rawMode === "color" || rawMode === "image" ? rawMode : "inherit";

    let backgroundColor: string | null = null;
    let backgroundImageUrl: string | null = null;

    if (backgroundMode === "color") {
      if (typeof fragment.backgroundColor !== "string" || fragment.backgroundColor.trim().length === 0) {
        return NextResponse.json({ error: "El color de fondo es obligatorio" }, { status: 400 });
      }
      backgroundColor = fragment.backgroundColor;
    }

    if (backgroundMode === "image") {
      if (typeof fragment.backgroundImageUrl !== "string" || fragment.backgroundImageUrl.trim().length === 0) {
        return NextResponse.json({ error: "La imagen de fondo es obligatoria" }, { status: 400 });
      }
      backgroundImageUrl = fragment.backgroundImageUrl;
    }

    normalizedFragments.push({
      position,
      content: fragment.content,
      title,
      description,
      backgroundMode,
      backgroundColor,
      backgroundImageUrl,
    });
  }

  const username = (session.user as any).username as string;

  const screen = await prisma.invitationScreen.findUnique({ where: { id: screenId } });
  if (!screen || screen.birthdayUsername !== username) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }

  await prisma.invitationScreen.update({
    where: { id: screenId },
    data: {
      fragments: normalizedFragments as any,
      layoutType: "split",
      content: null as any,
    },
  });

  return NextResponse.json({ ok: true });
}
