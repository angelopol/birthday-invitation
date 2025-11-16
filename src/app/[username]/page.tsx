import ConfirmButton from './ConfirmButton';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface InvitationPageProps {
  params: { username?: string };
  searchParams: { invitation?: string };
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const token = searchParams.invitation;
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-blue-900/40 p-6 sm:p-10 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Estás invitad@s</p>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Cumple de <span className="text-blue-400">{effectiveUsername}</span>
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
          <div className="pt-2 border-t border-slate-800 mt-2 flex justify-center">
            <ConfirmButton token={token} />
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
