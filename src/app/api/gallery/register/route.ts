import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const MAX_PER_GUEST = Number(process.env.GALLERY_MAX_PHOTOS_VIDEOS_USER || "10");

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    let birthdayUsername: string | null = null;

    if (token) {
      const guest = await prisma.guest.findUnique({ where: { token } });
      if (!guest) return NextResponse.json({ error: "Invitado no válido" }, { status: 401 });
      birthdayUsername = guest.birthdayUsername;
    } else {
      const session = await getServerSession(authOptions);
      const sessionUsername = (session?.user as any)?.username as string | undefined;
      if (!sessionUsername) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      const owner = await prisma.birthdayPeople.findUnique({ where: { username: sessionUsername } });
      if (!owner) return NextResponse.json({ error: "Usuario no válido" }, { status: 401 });
      birthdayUsername = owner.username;
    }

    if (!birthdayUsername) return NextResponse.json({ error: "No se pudo determinar dueño" }, { status: 400 });

    const body = await req.json();
    const uploads: Array<{ key: string; fileName: string; fileType: string }> = body.uploads || [];

    if (!uploads.length) return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });

    // enforce quota (count only for this guest or owner)
    const existingCount = token
      ? await prisma.partysGallery.count({ where: { guestToken: token } })
      : await prisma.partysGallery.count({ where: { birthdayUsername, guestToken: null } });

    const remaining = MAX_PER_GUEST - existingCount;
    if (remaining <= 0) {
      return NextResponse.json({ error: `Has alcanzado el máximo de ${MAX_PER_GUEST} archivos` }, { status: 400 });
    }

    const toCreate = uploads.slice(0, remaining);
    const created: any[] = [];

    for (const u of toCreate) {
      const entry = await prisma.partysGallery.create({
        data: {
          fileName: u.fileName,
          fileType: u.fileType.startsWith('image') ? 'image' : 'video',
          s3Key: u.key,
          birthdayUsername,
          guestToken: token ? token : null,
        },
      });
      created.push(entry);
    }

    if (!created.length) return NextResponse.json({ error: 'Ningún archivo registrado' }, { status: 400 });

    return NextResponse.json({ uploaded: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error registrando archivos' }, { status: 500 });
  }
}
