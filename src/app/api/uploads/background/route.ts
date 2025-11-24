import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { uploadToS3 } from "@/lib/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = Number(process.env.S3_MAX_BACKGROUND_MB || "5") * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Se requiere multipart/form-data" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no enviado" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `El archivo supera ${MAX_SIZE_BYTES / (1024 * 1024)}MB` }, { status: 400 });
  }

  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato de imagen no soportado" }, { status: 400 });
  }

  const username = (session.user as any).username as string | undefined;
  if (!username) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const randomId = Math.random().toString(36).slice(2, 10);
  const key = `screen-backgrounds/${username}/${Date.now()}-${randomId}.${ext}`;

  await uploadToS3({
    key,
    body: buffer,
    contentType: file.type || "application/octet-stream",
  });

  const proxyUrl = `/api/backgrounds/file?key=${encodeURIComponent(key)}`;

  return NextResponse.json({ url: proxyUrl, key });
}
