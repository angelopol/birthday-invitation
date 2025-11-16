import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = (session.user as any).username as string;

  const items = await prisma.partysGallery.findMany({
    where: { birthdayUsername: username },
  });

  await Promise.all(
    items.map((item) => deleteFromS3(item.s3Key).catch(() => undefined))
  );

  await prisma.partysGallery.deleteMany({
    where: { birthdayUsername: username },
  });

  return NextResponse.json({ ok: true, deleted: items.length });
}
