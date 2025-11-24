import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username = (session.user as any).username as string;

  const formData = await request.formData();

  const primaryColor = (formData.get('primaryColor') as string | null) ?? null;
  const secondaryColor = (formData.get('secondaryColor') as string | null) ?? null;
  const tertiaryColor = (formData.get('tertiaryColor') as string | null) ?? null;
  const typographyFamily = (formData.get('typographyFamily') as string | null) ?? null;
  const typographySizeRaw = (formData.get('typographySize') as string | null) ?? null;

  const typographySize = typographySizeRaw ? Number(typographySizeRaw) : null;
  const safeTypographySize = !typographySize || Number.isNaN(typographySize)
    ? null
    : Math.max(12, Math.min(24, Math.round(typographySize)));

  await prisma.birthdayPeople.update({
    where: { username },
    data: {
      primaryColor: primaryColor || undefined,
      secondaryColor: secondaryColor || undefined,
      backgroundColor: tertiaryColor || undefined,
      typographyFamily: typographyFamily || undefined,
      typographySize: safeTypographySize ?? undefined,
    },
  });

  return NextResponse.redirect(new URL('/dashboard/edit-invitation', request.url));
}
