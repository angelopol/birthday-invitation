import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username = (session.user as any).username as string;

  const guests = await prisma.guest.findMany({
    where: { birthdayUsername: username },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ guests, username });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username = (session.user as any).username as string;
  const { name } = (await request.json()) as { name?: string };

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const trimmedName = name.trim().slice(0, 255);

  const token = generateToken();

  const guest = await prisma.guest.create({
    data: {
      token,
      name: trimmedName,
      birthdayUsername: username,
    },
  });

  const invitationUrl = `/${username}?invitation=${token}`;

  return NextResponse.json({ guest, invitationUrl, username }, { status: 201 });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username = (session.user as any).username as string;

  await prisma.guest.deleteMany({ where: { birthdayUsername: username } });

  return NextResponse.json({ ok: true });
}
