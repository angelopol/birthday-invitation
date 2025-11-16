import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { token: string };
}

export async function POST(_request: Request, { params }: Params) {
  const { token } = params;

  const guest = await prisma.guest.findUnique({ where: { token } });

  if (!guest) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  await prisma.guest.update({
    where: { token },
    data: { confirmated: true },
  });

  return NextResponse.json({ ok: true });
}
