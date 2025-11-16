import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ error: 'Username must be URL-safe (letters, numbers, - and _ only)' }, { status: 400 });
  }

  const existing = await prisma.birthdayPeople.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.birthdayPeople.create({
    data: {
      username,
      password: hashed,
    },
  });

  return NextResponse.json({ ok: true });
}
