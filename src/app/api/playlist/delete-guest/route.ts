import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getValidSpotifyAccessToken,
  ensureSpotifyPlaylist,
  syncAllTracksToSpotify,
} from "@/app/api/spotify/sync-playlist/route";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invitation = searchParams.get("invitation");

  if (!invitation) {
    return NextResponse.json({ error: "Invitación requerida" }, { status: 400 });
  }

  const body = await req.json();
  const id = Number(body?.id);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { token: invitation },
    select: { token: true, birthdayUsername: true },
  });

  if (!guest) {
    return NextResponse.json({ error: "Invitación inválida" }, { status: 400 });
  }

  const track = await prisma.partyTrack.findUnique({ where: { id } });

  if (!track || track.birthdayUsername !== guest.birthdayUsername || track.guestToken !== guest.token) {
    return NextResponse.json({ error: "No tienes permiso para eliminar esta canción" }, { status: 403 });
  }

  await prisma.partyTrack.delete({ where: { id } });

  try {
    const accessToken = await getValidSpotifyAccessToken(guest.birthdayUsername);
    const playlistId = await ensureSpotifyPlaylist(guest.birthdayUsername, accessToken);
    await syncAllTracksToSpotify(guest.birthdayUsername, accessToken, playlistId);
  } catch (error) {
    console.error("No se pudo sincronizar con Spotify tras eliminar canción desde invitación", error);
  }

  return NextResponse.json({ ok: true });
}
