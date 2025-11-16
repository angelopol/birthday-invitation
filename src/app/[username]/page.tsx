import ConfirmButton from './ConfirmButton';
import GalleryClient from './GalleryClient';
import PlaylistClient from './PlaylistClient';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getPublicUrl } from '@/lib/s3';

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

  const formattedDate = birthdayPerson.partyDate
    ? birthdayPerson.partyDate.toLocaleString('es-ES', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : null;

  const primaryColor = birthdayPerson.primaryColor || '#38bdf8';
  const secondaryColor = birthdayPerson.secondaryColor || '#6366f1';
  const cardBackground = birthdayPerson.backgroundColor || '#020617';

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

  return (
    <main
      className="min-h-screen flex"
      style={{
        backgroundImage:
          `radial-gradient(circle at top, ${primaryColor}22, transparent 55%), ` +
          `radial-gradient(circle at bottom, ${secondaryColor}22, #020617 60%)`,
        backgroundColor: '#020617',
      }}
    >
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-2xl rounded-3xl border shadow-[0_24px_70px_rgba(15,23,42,0.95)] p-6 sm:p-10 space-y-8"
          style={{
            borderColor: secondaryColor,
            backgroundColor: cardBackground,
            boxShadow: `0 25px 50px -12px ${secondaryColor}66`,
          }}
        >
        <div className="space-y-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
            {guestName ? `${guestName}, estás invitad@` : 'Estás invitad@s'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold">
            Celebración de <span style={{ color: primaryColor }}>{effectiveUsername}</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Guarda la fecha, revisa los detalles y confirma tu asistencia para que podamos contar contigo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha y hora</p>
            {formattedDate ? (
              <p className="text-sm text-slate-100">{formattedDate}</p>
            ) : (
              <p className="text-xs text-slate-500">
                El cumpleañero aún no ha configurado la fecha.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ubicación</p>
            {birthdayPerson.ubication ? (
              <a
                href={birthdayPerson.ubication}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
              >
                Ver en Google Maps
              </a>
            ) : (
              <p className="text-xs text-slate-500">
                El cumpleañero aún no ha configurado la ubicación.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dress code</p>
            {birthdayPerson.dressCode ? (
              <a
                href={birthdayPerson.dressCode}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
              >
                Ver tablero en Pinterest
              </a>
            ) : (
              <p className="text-xs text-slate-500">
                El cumpleañero aún no ha configurado el dress code.
              </p>
            )}
          </div>
        </div>

        {birthdayPerson.extraInfo && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Detalles adicionales</p>
            <p className="text-sm text-slate-100 whitespace-pre-line">{birthdayPerson.extraInfo}</p>
          </div>
        )}

        {token && (
          <div className="pt-4 border-t border-slate-800 mt-4 space-y-4">
            <div className="flex justify-center">
              <ConfirmButton token={token} primaryColor={primaryColor} />
            </div>
            <p className="text-[11px] text-slate-500 text-center max-w-sm mx-auto">
              Este enlace es solo para ti. Si cambias de opinión más adelante, puedes volver aquí y actualizar tu respuesta.
            </p>
          </div>
        )}

        <GalleryClient
          initialItems={gallery}
          token={token}
        />

        <PlaylistClient
          username={effectiveUsername}
          invitation={token}
          spotifyPlaylistId={birthdayPerson.spotifyPlaylistId}
        />
        </div>
      </div>
    </main>
  );
}
