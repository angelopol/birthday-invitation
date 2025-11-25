import ConfirmButton from './ConfirmButton';
import InvitationRendererWrapper from '@/components/InvitationRendererWrapper';
import ThemeController from '@/components/ThemeController';
import InvitationThemeActivator from '@/components/InvitationThemeActivator';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { normalizeBackgroundImageUrl } from '@/lib/backgrounds';

export const metadata = {
  title: 'Invitación de cumpleaños — BirthdayInvitation',
};

interface InvitationPageProps {
  params: Promise<{ username?: string }>;
  searchParams: Promise<{ invitation?: string }>;
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const { username: requestedUsername } = await params;
  const { invitation: token } = await searchParams;

  const session = await getServerSession(authOptions);
  const sessionUsername = session?.user ? (session.user as any).username as string : undefined;

  const effectiveUsername = requestedUsername ?? sessionUsername;

  if (!effectiveUsername) {
    notFound();
  }

  // Solo permitimos acceso si es el dueño autenticado o hay token de invitado
  if (!sessionUsername && !token) {
    notFound();
  }

  const birthdayPerson = await prisma.birthdayPeople.findUnique({
    where: { username: effectiveUsername },
  });

  if (!birthdayPerson) {
    notFound();
  }

  const primaryColor = birthdayPerson.primaryColor || '#38bdf8';
  const secondaryColor = birthdayPerson.secondaryColor || '#6366f1';
  const tertiaryColor = birthdayPerson.backgroundColor || '#020617';

  let guestName: string | null = null;
  if (token) {
    const guest = await prisma.guest.findUnique({ where: { token } });
    guestName = guest?.name ?? null;
  }

  const galleryRaw = await prisma.partysGallery.findMany({
    where: { birthdayUsername: effectiveUsername },
    orderBy: { createdAt: 'desc' },
    include: {
      guest: true,
    },
  });

  const gallery = galleryRaw.map(item => ({
    id: item.id,
    fileName: item.fileName,
    fileType: item.fileType,
    s3Key: item.s3Key,
    publicUrl: `/api/gallery/file/${item.id}`,
    guestName: item.guest?.nickname || item.guest?.name || null,
  }));

  const screensRaw = await prisma.invitationScreen.findMany({
    where: { birthdayUsername: effectiveUsername },
    orderBy: { order: 'asc' },
  });

  const screens = screensRaw.map(screen => {
    const fragments = Array.isArray(screen.fragments)
      ? (screen.fragments as any[]).map(fragment => ({
          ...fragment,
          backgroundImageUrl: normalizeBackgroundImageUrl(fragment?.backgroundImageUrl),
        }))
      : screen.fragments;

    return {
      id: screen.id,
      order: screen.order,
      backgroundType: screen.backgroundType as 'image' | 'color',
      backgroundImageUrl: normalizeBackgroundImageUrl(screen.backgroundImageUrl),
      backgroundColor: screen.backgroundColor,
      layoutType: (screen.layoutType as 'single' | 'split') ?? 'single',
      content: (screen.content as any) ?? [],
      fragments: (fragments as any) ?? null,
    };
  });

  const typographyFamily = birthdayPerson.typographyFamily ?? undefined;
  const typographySize = birthdayPerson.typographySize ?? undefined;

  return (
    <>
      <ThemeController
        initialTheme={{
          primaryColor,
          secondaryColor,
          tertiaryColor,
          typographyFamily,
          typographySize,
        }}
        priority={10}
        autoFetch={false}
      />
      <InvitationThemeActivator />
    <main
      className="min-h-screen flex"
      style={{
        backgroundImage:
          `radial-gradient(circle at top, ${primaryColor}22, transparent 55%), ` +
          `radial-gradient(circle at bottom, ${primaryColor}22, ${tertiaryColor} 60%)`,
        backgroundColor: tertiaryColor,
      }}
    >
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-10 gap-8 invitation-theme">
        {screens.length > 0 ? (
          <InvitationRendererWrapper
            screens={screens}
            galleryItems={gallery}
            guestToken={token}
            guestName={guestName}
            username={effectiveUsername}
            spotifyPlaylistId={birthdayPerson.spotifyPlaylistId}
            primaryColor={primaryColor}
          />
        ) : (
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center space-y-3">
            <p className="text-sm text-slate-200 font-medium">El anfitrión aún no ha publicado el diseño de la invitación.</p>
            {token ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-slate-500">Aprovecha para confirmar tu asistencia mientras tanto.</p>
                <ConfirmButton token={token} primaryColor={primaryColor} className="border-0 mt-0 pt-0" />
              </div>
            ) : (
              <p className="text-xs text-slate-500">Vuelve pronto para descubrir la experiencia completa.</p>
            )}
          </div>
        )}
      </div>
    </main>
    </>
  );
}
