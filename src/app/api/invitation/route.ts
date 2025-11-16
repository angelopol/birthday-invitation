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

  const partyDateRaw = formData.get('partyDate') as string | null;
  const ubication = (formData.get('ubication') as string | null) ?? '';
  const dressCode = (formData.get('dressCode') as string | null) ?? '';
  const extraInfoRaw = (formData.get('extraInfo') as string | null) ?? '';
  const extraInfo = extraInfoRaw.slice(0, 2000);

  let partyDate: Date | null = null;
  if (partyDateRaw) {
    const d = new Date(partyDateRaw);
    if (!isNaN(d.getTime())) {
      partyDate = d;
    }
  }

  await prisma.birthdayPeople.update({
    where: { username },
    data: {
      partyDate: partyDate ?? undefined,
      ubication,
      dressCode,
      extraInfo,
    },
  });

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
