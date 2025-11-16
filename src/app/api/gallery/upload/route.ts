import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";

const MAX_PER_GUEST = Number(process.env.GALLERY_MAX_PHOTOS_VIDEOS_USER || "10");

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Content-Type inválido" }, { status: 400 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token de invitado requerido" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { token } });

  if (!guest) {
    return NextResponse.json({ error: "Invitado no válido" }, { status: 401 });
  }

  const existingCount = await prisma.partysGallery.count({
    where: { guestToken: token },
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
    const baseName = `${guest.birthdayUsername}-${randomId}`;
    const fileName = `${baseName}.${ext}`;
    const key = `${guest.birthdayUsername}/${fileName}`;

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
        birthdayUsername: guest.birthdayUsername,
        guestToken: token,
      },
    });

    saved.push(entry);
  }

  if (!saved.length) {
    return NextResponse.json({ error: "Ningún archivo válido para subir" }, { status: 400 });
  }

  return NextResponse.json({ uploaded: saved });
}
