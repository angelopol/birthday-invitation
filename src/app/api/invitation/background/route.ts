import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface Payload {
  backgroundType: "color" | "image" | "gradient";
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const username = (session.user as any).username as string | undefined;
  if (!username) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Payload | null;
  if (!payload || !["color", "image", "gradient"].includes(payload.backgroundType)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const data: Record<string, any> = {};
  if (payload.backgroundType === "color") {
    if (!payload.backgroundColor || typeof payload.backgroundColor !== "string") {
      return NextResponse.json({ error: "Se requiere un color" }, { status: 400 });
    }
    data.backgroundColor = payload.backgroundColor;
    data.globalBackgroundMode = "color";
    data.globalBackgroundImageUrl = null;
  } else if (payload.backgroundType === "gradient") {
    data.globalBackgroundMode = "gradient";
    data.globalBackgroundImageUrl = null;
    // leave backgroundColor as null so UI shows gradient
    data.backgroundColor = null;
  } else if (payload.backgroundType === "image") {
    if (!payload.backgroundImageUrl || typeof payload.backgroundImageUrl !== "string") {
      return NextResponse.json({ error: "Se requiere la URL de la imagen" }, { status: 400 });
    }
    data.globalBackgroundMode = "image";
    data.globalBackgroundImageUrl = payload.backgroundImageUrl;
    data.backgroundColor = null;
  }

  await prisma.birthdayPeople.update({
    where: { username },
    data,
  });

  return NextResponse.json({ ok: true });
}
