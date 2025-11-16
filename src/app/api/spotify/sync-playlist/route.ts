import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { refreshSpotifyToken } from "@/lib/spotify";

export async function getValidSpotifyAccessToken(username: string) {
  const user = await prisma.birthdayPeople.findUnique({ where: { username } });

  if (!user || !user.spotifyAccessToken) {
    throw new Error("Cuenta de Spotify no conectada");
  }

  if (user.spotifyTokenExpiresAt && user.spotifyTokenExpiresAt > new Date(Date.now() + 60_000)) {
    return user.spotifyAccessToken;
  }

  if (!user.spotifyRefreshToken) {
    return user.spotifyAccessToken;
  }

  const tokenData = await refreshSpotifyToken(user.spotifyRefreshToken);
  const newAccessToken = tokenData.access_token as string;
  const expiresIn = (tokenData.expires_in as number) ?? 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await prisma.birthdayPeople.update({
    where: { username },
    data: {
      spotifyAccessToken: newAccessToken,
      spotifyTokenExpiresAt: expiresAt,
    },
  });

  return newAccessToken;
}

export async function ensureSpotifyPlaylist(username: string, accessToken: string) {
  const user = await prisma.birthdayPeople.findUnique({ where: { username } });

  if (!user) {
    throw new Error("Cumpleañero no encontrado");
  }

  if (user.spotifyPlaylistId) {
    return user.spotifyPlaylistId;
  }

  const res = await fetch("https://api.spotify.com/v1/me/playlists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `Cumple de ${username}`,
      description: "Playlist generada desde Birthday Invitation",
      public: false,
    }),
  });

  if (!res.ok) {
    throw new Error("No se pudo crear la playlist en Spotify");
  }

  const data = await res.json();

  await prisma.birthdayPeople.update({
    where: { username },
    data: {
      spotifyPlaylistId: data.id,
    },
  });

  return data.id as string;
}

export async function syncAllTracksToSpotify(username: string, accessToken: string, playlistId: string) {
  const tracks = await prisma.partyTrack.findMany({
    where: { birthdayUsername: username },
    orderBy: { createdAt: "asc" },
  });

  const uris = tracks.map((t) => `spotify:track:${t.spotifyTrackId}`);

  const replaceUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

  const res = await fetch(replaceUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Error al sincronizar playlist con Spotify", text);
    throw new Error("No se pudo sincronizar la playlist en Spotify");
  }
}

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
    await syncAllTracksToSpotify(username, accessToken, playlistId);

    return NextResponse.json({ ok: true, playlistId });
  } catch (error: any) {
    console.error("Error en sync-playlist", error);
    return NextResponse.json({ error: error.message ?? "Error al sincronizar" }, { status: 500 });
  }
}
