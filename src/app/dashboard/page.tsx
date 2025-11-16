import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DashboardStatusClient from './status-client';

export const metadata = {
  title: 'Panel de tu fiesta — BirthdayInvitation',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const username = (session.user as any).username as string | undefined;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900/85 border border-slate-800 shadow-[0_24px_70px_rgba(15,23,42,0.95)] p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Panel de tu fiesta</h1>
          <p className="text-sm text-slate-100">
            Bienvenido, <span className="font-medium text-blue-400">{username}</span>
          </p>
          <p className="text-sm text-slate-400">
            Desde aquí controlas todo lo importante: invitación, invitados, galería y playlist.
          </p>
          <DashboardStatusClient />
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-1">
          <a
            href="/dashboard/edit-invitation"
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 hover:bg-slate-900 transition-colors"
          >
            <div>
              <p className="font-medium text-slate-100">Editar invitación</p>
              <p className="text-xs text-slate-400">Configura fecha, lugar, dress code y texto de la tarjeta.</p>
            </div>
            <span className="text-lg">✏️</span>
          </a>
          <a
            href="/dashboard/guests"
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 hover:bg-slate-900 transition-colors"
          >
            <div>
              <p className="font-medium text-slate-100">Gestionar invitados</p>
              <p className="text-xs text-slate-400">Crea enlaces, revisa confirmaciones y controla el aforo.</p>
            </div>
            <span className="text-lg">👥</span>
          </a>
          <a
            href="/dashboard/gallery"
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 hover:bg-slate-900 transition-colors"
          >
            <div>
              <p className="font-medium text-slate-100">Galería</p>
              <p className="text-xs text-slate-400">Sube fotos de referencia y revisa lo que comparte la gente.</p>
            </div>
            <span className="text-lg">🖼️</span>
          </a>
          <a
            href="/dashboard/playlist"
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 hover:bg-slate-900 transition-colors"
          >
            <div>
              <p className="font-medium text-slate-100">Playlist de la fiesta</p>
              <p className="text-xs text-slate-400">Revisa propuestas, sincroniza con Spotify y mira las más votadas.</p>
            </div>
            <span className="text-lg">🎵</span>
          </a>
          {username && (
            <a
              href={`/${username}`}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 hover:bg-slate-900 transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              <div>
                <p className="font-medium text-slate-100">Ver página pública</p>
                <p className="text-xs text-slate-400">Abre la invitación tal y como la verá cualquier invitad@.</p>
              </div>
              <span className="text-lg">🔗</span>
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
