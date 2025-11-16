import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invitation = searchParams.get("invitation");

  if (!invitation) {
    return NextResponse.json({ error: "Falta invitación" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { token: invitation } });
  if (!guest) {
    return NextResponse.json({ error: "Invitación inválida" }, { status: 400 });
  }

  const body = await req.json();
  const { trackId, like } = body ?? {};

  if (!trackId || typeof like !== "boolean") {
    return NextResponse.json({ error: "Datos de voto inválidos" }, { status: 400 });
  }

  const track = await prisma.partyTrack.findUnique({ where: { id: trackId } });
  if (!track || track.birthdayUsername !== guest.birthdayUsername) {
    return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
  }

  if (like) {
    try {
      await prisma.partyTrackVote.create({
        data: {
          trackId,
          guestToken: guest.token,
        },
      });
    } catch {
      //Puede existir ya el voto; lo ignoramos
    }
  } else {
    await prisma.partyTrackVote.deleteMany({
      where: { trackId, guestToken: guest.token },
    });
  }

  const votesCount = await prisma.partyTrackVote.count({ where: { trackId } });

  return NextResponse.json({ ok: true, votesCount });
}
