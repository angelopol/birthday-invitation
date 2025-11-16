import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const MAX_TRACKS_PER_GUEST = 3;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Falta username" }, { status: 400 });
  }

  const tracks = await prisma.partyTrack.findMany({
    where: { birthdayUsername: username },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ tracks });
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
  const { spotifyTrackId, title, artist, album, coverUrl, previewUrl } = body ?? {};

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
    },
  });

  return NextResponse.json({ track: created }, { status: 201 });
}
