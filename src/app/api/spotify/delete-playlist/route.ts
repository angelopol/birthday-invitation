import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getValidSpotifyAccessToken } from "@/app/api/spotify/sync-playlist/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const username = (session.user as any).username as string | undefined;

  if (!username) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.birthdayPeople.findUnique({ where: { username } });

  if (!user || !user.spotifyPlaylistId) {
    return NextResponse.json({ error: "No hay playlist asociada" }, { status: 400 });
  }

  try {
    const accessToken = await getValidSpotifyAccessToken(username);

    await fetch(`https://api.spotify.com/v1/playlists/${user.spotifyPlaylistId}/followers`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.error("Error al intentar eliminar playlist de Spotify", error);
  }

  await prisma.birthdayPeople.update({
    where: { username },
    data: { spotifyPlaylistId: null },
  });

  return NextResponse.json({ ok: true });
}
