import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  const id = Number(params.id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const entry = await prisma.partysGallery.findUnique({ where: { id } });

  if (!entry) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
  
  // Permisos:
  // - Invitado dueño del token puede eliminar sus propios archivos.
  // - El cumpleañero autenticado (session.user.username === birthdayUsername) puede eliminar cualquier archivo de su galería.

  let isAllowed = false;

  if (token && entry.guestToken === token) {
    isAllowed = true;
  } else {
    const session = await getServerSession(authOptions);
    const sessionUsername = (session?.user as any)?.username as string | undefined;

    if (sessionUsername && sessionUsername === entry.birthdayUsername) {
      isAllowed = true;
    }
  }

  if (!isAllowed) {
    return NextResponse.json({ error: "No puedes eliminar este archivo" }, { status: 403 });
  }

  await deleteFromS3(entry.s3Key);
  await prisma.partysGallery.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
