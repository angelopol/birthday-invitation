import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { s3, getPublicUrl } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
    const files: Array<{ fileName: string; contentType: string }> = body.files || [];

    if (!files.length) return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });

    // enforce remaining slots
    const existingCount = token
      ? await prisma.partysGallery.count({ where: { guestToken: token } })
      : await prisma.partysGallery.count({ where: { birthdayUsername, guestToken: null } });

    const remaining = MAX_PER_GUEST - existingCount;
    if (remaining <= 0) {
      return NextResponse.json({ error: `Has alcanzado el máximo de ${MAX_PER_GUEST} archivos` }, { status: 400 });
    }

    const filesToSign = files.slice(0, remaining);

    const signed: any[] = [];

    for (const f of filesToSign) {
      const randomId = Math.random().toString(36).slice(2, 10);
      const ext = f.fileName.split('.').pop() || 'bin';
      const safeName = `${birthdayUsername}-${randomId}.${ext}`;
      const key = `${birthdayUsername}/${safeName}`;

      const command = new PutObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: key, ContentType: f.contentType });
      const urlSigned = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

      signed.push({ url: urlSigned, key, fileName: safeName, contentType: f.contentType, publicUrl: getPublicUrl(key) });
    }

    return NextResponse.json({ signed });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error generando URLs' }, { status: 500 });
  }
}
