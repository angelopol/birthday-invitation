import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const username = (session.user as any).username as string | undefined;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-100">
            Bienvenido, <span className="font-medium text-blue-400">{username}</span>
          </p>
          <p className="text-sm text-slate-400">
            Desde aquí puedes editar tu invitación, gestionar invitados y ver tu página pública.
          </p>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-1">
          <a
            href="/dashboard/edit-invitation"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Editar invitación
          </a>
          <a
            href="/dashboard/guests"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Gestionar invitados
          </a>
          {username && (
            <a
              href={`/${username}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-100 hover:bg-slate-800 transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Ver mi página pública
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
