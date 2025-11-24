import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";

const bucket = process.env.AWS_BUCKET!;
const ALLOWED_PREFIX = "screen-backgrounds/";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Falta el parámetro key" }, { status: 400 });
  }

  if (!key.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: "Key inválida" }, { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const data = await s3.send(command);

    if (!data.Body) {
      return NextResponse.json({ error: "Objeto sin contenido" }, { status: 404 });
    }

    const headers = new Headers();
    if (data.ContentType) {
      headers.set("Content-Type", data.ContentType);
    } else {
      headers.set("Content-Type", "image/*");
    }
    if (data.ContentLength != null) {
      headers.set("Content-Length", String(data.ContentLength));
    }
    headers.set("Cache-Control", "public, max-age=86400, immutable");

    return new Response(data.Body as ReadableStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error al recuperar el fondo", error);
    return NextResponse.json({ error: "No se pudo obtener la imagen" }, { status: 500 });
  }
}
