import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const username = (session.user as any).username as string;

  const [guestTotal, guestConfirmed, photosCount, tracksCount] = await Promise.all([
    prisma.guest.count({ where: { birthdayUsername: username } }),
    prisma.guest.count({ where: { birthdayUsername: username, confirmated: true } }),
    prisma.partysGallery.count({ where: { birthdayUsername: username } }),
    prisma.partyTrack.count({ where: { birthdayUsername: username } }),
  ]);

  const confirmedPercentage = guestTotal === 0 ? 0 : Math.round((guestConfirmed / guestTotal) * 100);

  return NextResponse.json({
    guests: {
      total: guestTotal,
      confirmed: guestConfirmed,
      confirmedPercentage,
    },
    photosCount,
    tracksCount,
  });
}
