import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const MAX_PER_GUEST = Number(process.env.GALLERY_MAX_PHOTOS_VIDEOS_USER || "10");

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Content-Type inválido" }, { status: 400 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  let birthdayUsername: string | null = null;
  let uploadOwnerKey: string | null = null; // se usará como "guestToken" lógico para límite

  if (token) {
    const guest = await prisma.guest.findUnique({ where: { token } });

    if (!guest) {
      return NextResponse.json({ error: "Invitado no válido" }, { status: 401 });
    }

    birthdayUsername = guest.birthdayUsername;
    uploadOwnerKey = token;
  } else {
    // Intento de subida del cumpleañero autenticado
    const session = await getServerSession(authOptions);
    const sessionUsername = (session?.user as any)?.username as string | undefined;

    if (!sessionUsername) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificamos que el usuario exista como BirthdayPeople
    const owner = await prisma.birthdayPeople.findUnique({ where: { username: sessionUsername } });
    if (!owner) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 401 });
    }

    birthdayUsername = owner.username;
    uploadOwnerKey = `OWNER-${owner.username}`;
  }

  if (!birthdayUsername || !uploadOwnerKey) {
    return NextResponse.json({ error: "No se pudo determinar el dueño de la subida" }, { status: 400 });
  }

  const existingCount = await prisma.partysGallery.count({
    where: { guestToken: uploadOwnerKey },
  });

  if (existingCount >= MAX_PER_GUEST) {
    return NextResponse.json({
      error: `Has alcanzado el máximo de ${MAX_PER_GUEST} archivos permitidos`,
    }, { status: 400 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files");

  if (!files.length) {
    return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });
  }

  const remainingSlots = MAX_PER_GUEST - existingCount;
  const filesToProcess = files.slice(0, remainingSlots);

  const saved: any[] = [];

  for (const file of filesToProcess) {
    if (!(file instanceof File)) continue;

    const mime = file.type || "";
    const mainType = mime.split("/")[0];
    if (mainType !== "image" && mainType !== "video") {
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "bin";
    const randomId = Math.random().toString(36).slice(2, 10);
    const baseName = `${birthdayUsername}-${randomId}`;
    const fileName = `${baseName}.${ext}`;
    const key = `${birthdayUsername}/${fileName}`;

    await uploadToS3({
      key,
      contentType: mime,
      body: buffer,
    });

    const entry = await prisma.partysGallery.create({
      data: {
        fileName,
        fileType: mainType,
        s3Key: key,
        birthdayUsername,
        guestToken: uploadOwnerKey,
      },
    });

    saved.push(entry);
  }

  if (!saved.length) {
    return NextResponse.json({ error: "Ningún archivo válido para subir" }, { status: 400 });
  }

  return NextResponse.json({ uploaded: saved });
}
