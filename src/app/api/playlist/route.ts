import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { refreshSpotifyToken } from "@/lib/spotify";

const MAX_TRACKS_PER_GUEST = Number(process.env.MAX_TRACKS_PER_GUEST ?? "3");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Falta username" }, { status: 400 });
  }

  const tracks = await prisma.partyTrack.findMany({
    where: { birthdayUsername: username },
    include: {
      guest: {
        select: {
          nickname: true,
          name: true,
          avatarUrl: true,
        },
      },
      votes: true,
    },
  });

  // Ordenar por número de votos (desc) y luego por fecha de creación (asc)
  const sorted = tracks
    .map((t) => ({
      ...t,
      votesCount: t.votes.length,
    }))
    .sort((a, b) => {
      if (b.votesCount !== a.votesCount) return b.votesCount - a.votesCount;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  return NextResponse.json({ tracks: sorted });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invitation = searchParams.get("invitation");

  const session = await getServerSession(authOptions);

  let birthdayUsername: string | null = null;
  let guestToken: string | null = null;

  if (session?.user?.username) {
    birthdayUsername = session.user.username as string;
  } else if (invitation) {
    const guest = await prisma.guest.findUnique({
      where: { token: invitation },
      select: { token: true, birthdayUsername: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Invitación inválida" }, { status: 400 });
    }

    birthdayUsername = guest.birthdayUsername;
    guestToken = guest.token;
  } else {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { spotifyTrackId, title, artist, album, coverUrl, previewUrl, comment } = body ?? {};

  if (!spotifyTrackId || !title || !artist) {
    return NextResponse.json({ error: "Datos de canción incompletos" }, { status: 400 });
  }

  const existing = await prisma.partyTrack.findUnique({
    where: {
      birthdayUsername_spotifyTrackId: {
        birthdayUsername,
        spotifyTrackId,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Esta canción ya está en la playlist" }, { status: 409 });
  }

  if (guestToken) {
    const count = await prisma.partyTrack.count({
      where: { birthdayUsername, guestToken },
    });

    if (count >= MAX_TRACKS_PER_GUEST) {
      return NextResponse.json({ error: "Has alcanzado el límite de canciones" }, { status: 403 });
    }
  }

  const created = await prisma.partyTrack.create({
    data: {
      birthdayUsername: birthdayUsername!,
      guestToken,
      spotifyTrackId,
      title,
      artist,
      album,
      coverUrl,
      previewUrl,
      comment,
    },
  });

  try {
    const birthdayPerson = await prisma.birthdayPeople.findUnique({ where: { username: birthdayUsername! } });

    if (birthdayPerson?.spotifyAccessToken) {
      let accessToken = birthdayPerson.spotifyAccessToken;

      if (
        birthdayPerson.spotifyTokenExpiresAt &&
        birthdayPerson.spotifyTokenExpiresAt <= new Date(Date.now() + 60_000) &&
        birthdayPerson.spotifyRefreshToken
      ) {
        try {
          const tokenData = await refreshSpotifyToken(birthdayPerson.spotifyRefreshToken);
          accessToken = tokenData.access_token as string;
          const expiresIn = (tokenData.expires_in as number) ?? 3600;
          const expiresAt = new Date(Date.now() + expiresIn * 1000);

          await prisma.birthdayPeople.update({
            where: { username: birthdayUsername! },
            data: {
              spotifyAccessToken: accessToken,
              spotifyTokenExpiresAt: expiresAt,
            },
          });
        } catch (e) {
          console.error("No se pudo refrescar el token de Spotify al agregar canción", e);
        }
      }

      if (birthdayPerson.spotifyPlaylistId) {
        try {
          await fetch(`https://api.spotify.com/v1/playlists/${birthdayPerson.spotifyPlaylistId}/tracks`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [`spotify:track:${spotifyTrackId}`],
            }),
          });
        } catch (e) {
          console.error("No se pudo agregar la canción a la playlist de Spotify", e);
        }
      }
    }
  } catch (error) {
    console.error("Error al intentar sincronizar automáticamente con Spotify", error);
  }

  return NextResponse.json({ track: created }, { status: 201 });
}
