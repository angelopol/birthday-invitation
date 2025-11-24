import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getValidSpotifyAccessToken, ensureSpotifyPlaylist } from "@/app/api/spotify/sync-playlist/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const username = (session.user as any).username as string | undefined;

  if (!username) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const accessToken = await getValidSpotifyAccessToken(username);
    const playlistId = await ensureSpotifyPlaylist(username, accessToken);

    const tracks: any[] = [];
    let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    while (nextUrl) {
      const res: any = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error al leer playlist de Spotify", text);
        return NextResponse.json({ error: "No se pudo leer la playlist de Spotify" }, { status: 500 });
      }

      const data = await res.json();
      tracks.push(...(data.items ?? []));
      nextUrl = data.next ?? null;
    }

    const spotifyTrackIds = new Set<string>();

    for (const item of tracks) {
      const track = item.track;
      if (!track || !track.id) continue;
      spotifyTrackIds.add(track.id as string);
    }

    const existing = await prisma.partyTrack.findMany({
      where: {
        birthdayUsername: username,
        spotifyTrackId: { in: Array.from(spotifyTrackIds) },
      },
      select: { spotifyTrackId: true },
    });

    const existingIds = new Set(existing.map((t) => t.spotifyTrackId));

    const toCreate = tracks
      .map((item) => item.track)
      .filter((track: any) => track && track.id && !existingIds.has(track.id)) as any[];

    const createData = toCreate.map((track) => ({
      birthdayUsername: username,
      guestToken: null,
      spotifyTrackId: track.id as string,
      title: track.name as string,
      artist: (track.artists ?? []).map((a: any) => a.name).join(", "),
      album: track.album?.name ?? null,
      coverUrl: track.album?.images?.[0]?.url ?? null,
      previewUrl: track.preview_url ?? null,
    }));

    if (createData.length > 0) {
      await prisma.partyTrack.createMany({ data: createData, skipDuplicates: true });
    }

    return NextResponse.json({ ok: true, imported: createData.length });
  } catch (error: any) {
    console.error("Error en import-playlist", error);
    return NextResponse.json({ error: error.message ?? "Error al importar" }, { status: 500 });
  }
}
