import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const bucket = process.env.AWS_BUCKET!;

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!numericId || Number.isNaN(numericId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const entry = await prisma.partysGallery.findUnique({ where: { id: numericId } });

  if (!entry) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: entry.s3Key,
    });

    const data = await s3.send(command);

    if (!data.Body) {
      return NextResponse.json({ error: "Archivo vacío" }, { status: 500 });
    }

    // @ts-ignore - Body puede ser ReadableStream en runtime
    const body = data.Body as ReadableStream;

    const headers = new Headers();
    headers.set("Content-Type", entry.fileType === "video" ? "video/*" : "image/*");
    if (data.ContentLength != null) {
      headers.set("Content-Length", String(data.ContentLength));
    }

    return new Response(body, { status: 200, headers });
  } catch (error) {
    console.error("Error al leer de S3", error);
    return NextResponse.json({ error: "No se pudo obtener el archivo" }, { status: 500 });
  }
}
