import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const username = (session.user as any).username as string;

  const tracks = await prisma.partyTrack.findMany({
    where: { birthdayUsername: username },
    include: {
      guest: {
        select: { nickname: true, name: true },
      },
      votes: true,
    },
  });

  // canciones por invitado
  const songsByGuestMap = new Map<string, { guestName: string; count: number }>();

  for (const track of tracks) {
    if (!track.guestToken || !track.guest) continue;
    const key = track.guestToken;
    const displayName = track.guest.nickname || track.guest.name;
    const current = songsByGuestMap.get(key) ?? { guestName: displayName, count: 0 };
    current.count += 1;
    songsByGuestMap.set(key, current);
  }

  const songsByGuest = Array.from(songsByGuestMap.values()).sort((a, b) => b.count - a.count);

  // top artistas (cuenta de canciones por artista)
  const artistCount = new Map<string, number>();
  for (const track of tracks) {
    const artist = track.artist;
    artistCount.set(artist, (artistCount.get(artist) ?? 0) + 1);
  }

  const topArtists = Array.from(artistCount.entries())
    .map(([artist, count]) => ({ artist, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // canciones más votadas
  const topTracks = tracks
    .map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      votesCount: t.votes.length,
    }))
    .sort((a, b) => {
      if (b.votesCount !== a.votesCount) return b.votesCount - a.votesCount;
      return a.id - b.id;
    })
    .slice(0, 10);

  return NextResponse.json({
    songsByGuest,
    topArtists,
    topTracks,
  });
}
