import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  getValidSpotifyAccessToken,
  ensureSpotifyPlaylist,
  syncAllTracksToSpotify,
} from "@/app/api/spotify/sync-playlist/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const username = (session.user as any).username as string | undefined;

  if (!username) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  let id: number | null = null;

  if (contentType.includes("application/json")) {
    const body = await req.json();
    id = Number(body.id);
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    id = Number(params.get("id"));
  }

  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const track = await prisma.partyTrack.findUnique({ where: { id } });

  if (!track || track.birthdayUsername !== username) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // borrar primero votos asociados para no violar la FK
  await prisma.partyTrackVote.deleteMany({ where: { trackId: id } });
  await prisma.partyTrack.delete({ where: { id } });

  try {
    const accessToken = await getValidSpotifyAccessToken(username);
    const playlistId = await ensureSpotifyPlaylist(username, accessToken);
    await syncAllTracksToSpotify(username, accessToken, playlistId);
  } catch (error) {
    console.error("No se pudo sincronizar con Spotify tras eliminar canción", error);
  }

  return NextResponse.redirect(new URL("/dashboard/playlist", req.url));
}
