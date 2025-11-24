import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ theme: null });
  }

  const username = (session.user as any)?.username as string | undefined;
  if (!username) {
    return NextResponse.json({ theme: null });
  }

  const person = await prisma.birthdayPeople.findUnique({
    where: { username },
    select: {
      primaryColor: true,
      secondaryColor: true,
      backgroundColor: true,
      typographyFamily: true,
      typographySize: true,
    },
  });

  if (!person) {
    return NextResponse.json({ theme: null });
  }

  return NextResponse.json({
    theme: {
      primaryColor: person.primaryColor,
      secondaryColor: person.secondaryColor,
      tertiaryColor: person.backgroundColor,
      typographyFamily: person.typographyFamily,
      typographySize: person.typographySize,
    },
  });
}
