import { NextResponse } from "next/server";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const src = url.searchParams.get("src") || "";

  // Hard safety: only allow https URLs
  if (!src || !src.startsWith("https://")) {
    return NextResponse.json({ error: "src inválido" }, { status: 400 });
  }

  const safeSrc = escapeHtml(src);

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Video</title>
  <style>
    html, body { height: 100%; margin: 0; background: #000; }
    .wrap { height: 100%; display: flex; align-items: center; justify-content: center; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; }
  </style>
</head>
<body>
  <div class="wrap">
    <video controls playsinline webkit-playsinline preload="metadata">
      <source src="${safeSrc}" />
    </video>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
