import ConfirmButton from './ConfirmButton';
import UploadMedia from './UploadMedia';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getPublicUrl } from '@/lib/s3';

interface InvitationPageProps {
  params: { username?: string };
  searchParams: Promise<{ invitation?: string }>;
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const { invitation: token } = await searchParams;
  const requestedUsername = params.username;

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

  const gallery = await prisma.partysGallery.findMany({
    where: { birthdayUsername: effectiveUsername },
    orderBy: { createdAt: 'desc' },
  });

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
          className="w-full max-w-2xl rounded-3xl border shadow-2xl p-6 sm:p-10 space-y-6"
          style={{
            borderColor: secondaryColor,
            backgroundColor: cardBackground,
            boxShadow: `0 25px 50px -12px ${secondaryColor}66`,
          }}
        >
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Estás invitad@s</p>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Cumple de <span style={{ color: primaryColor }}>{effectiveUsername}</span>
          </h1>
          <p className="text-sm text-slate-400">
            Guarda la fecha, revisa el dress code y confirma tu asistencia.
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
          <div className="pt-2 border-t border-slate-800 mt-2 space-y-4">
            <div className="flex justify-center">
              <ConfirmButton token={token} primaryColor={primaryColor} />
            </div>
            <UploadMedia token={token} />
          </div>
        )}

        {gallery.length > 0 && (
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">Galería de la fiesta</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {gallery.map(item => {
                const url = getPublicUrl(item.s3Key);
                if (item.fileType === 'video') {
                  return (
                    <video
                      key={item.id}
                      src={url}
                      className="w-full h-28 object-cover rounded-lg border border-slate-800 bg-black"
                      controls
                    />
                  );
                }
                return (
                  <img
                    key={item.id}
                    src={url}
                    alt={item.fileName}
                    className="w-full h-28 object-cover rounded-lg border border-slate-800"
                  />
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
