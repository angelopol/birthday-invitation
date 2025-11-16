import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  if (!token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { token } });

  if (!guest) {
    return NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ guest });
}
