import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface BackgroundPayload {
  backgroundType: "image" | "color" | "gradient";
  backgroundImageUrl?: string | null;
  backgroundColor?: string | null;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const screenId = Number(id);

  if (!screenId) {
    return NextResponse.json({ error: "ID de pantalla inválido" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const username = (session.user as any).username as string | undefined;
  if (!username) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  const screen = await prisma.invitationScreen.findUnique({ where: { id: screenId } });
  if (!screen || screen.birthdayUsername !== username) {
    return NextResponse.json({ error: "Pantalla no encontrada" }, { status: 404 });
  }


  const payload = (await request.json().catch(() => null)) as BackgroundPayload | null;
  if (!payload || !["image", "color", "gradient"].includes(payload.backgroundType)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (payload.backgroundType === "image") {
    if (!payload.backgroundImageUrl || typeof payload.backgroundImageUrl !== "string") {
      return NextResponse.json({ error: "Se requiere la URL de la imagen" }, { status: 400 });
    }
  } else if (payload.backgroundType === "color") {
    if (!payload.backgroundColor || typeof payload.backgroundColor !== "string") {
      return NextResponse.json({ error: "Se requiere un color hexadecimal" }, { status: 400 });
    }
  }
  // No validation needed for gradient

  await prisma.invitationScreen.update({
    where: { id: screenId },
    data: {
      backgroundType: payload.backgroundType,
      backgroundImageUrl: payload.backgroundType === "image" ? payload.backgroundImageUrl : null,
      backgroundColor:
        payload.backgroundType === "color"
          ? payload.backgroundColor
          : payload.backgroundType === "gradient"
            ? null
            : screen.backgroundColor,
    },
  });

  return NextResponse.json({ ok: true });
}
