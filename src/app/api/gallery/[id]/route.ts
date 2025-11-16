import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token de invitado requerido" }, { status: 400 });
  }

  const id = Number(params.id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const entry = await prisma.partysGallery.findUnique({ where: { id } });

  if (!entry) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  if (entry.guestToken !== token) {
    return NextResponse.json({ error: "No puedes eliminar este archivo" }, { status: 403 });
  }

  await deleteFromS3(entry.s3Key);
  await prisma.partysGallery.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
