import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Editar invitación — BirthdayInvitation',
};

async function getBirthdayPerson(username: string) {
  return prisma.birthdayPeople.findUnique({ where: { username } });
}

export default async function EditInvitationPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const username = (session.user as any).username as string;
  const birthdayPerson = await getBirthdayPerson(username);

  if (!birthdayPerson) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Editar invitación</h1>
          <p className="text-sm text-slate-400">Configura la información que verán tus invitados.</p>
        </div>

        <form
          action="/api/invitation"
          method="post"
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium">Fecha y hora de la fiesta</label>
            <input
              type="datetime-local"
              name="partyDate"
              defaultValue={birthdayPerson.partyDate ? new Date(birthdayPerson.partyDate).toISOString().slice(0, 16) : ''}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Link de Google Maps (ubicación)</label>
            <input
              type="url"
              name="ubication"
              defaultValue={birthdayPerson.ubication ?? ''}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Link de Pinterest (dress code)</label>
            <input
              type="url"
              name="dressCode"
              defaultValue={birthdayPerson.dressCode ?? ''}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Texto extra</label>
            <textarea
              name="extraInfo"
              defaultValue={birthdayPerson.extraInfo ?? ''}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Color primario</label>
              <input
                type="color"
                name="primaryColor"
                defaultValue={birthdayPerson.primaryColor ?? '#3b82f6'}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">Color secundario</label>
              <input
                type="color"
                name="secondaryColor"
                defaultValue={birthdayPerson.secondaryColor ?? '#6366f1'}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">Fondo tarjeta</label>
              <input
                type="color"
                name="backgroundColor"
                defaultValue={birthdayPerson.backgroundColor ?? '#020617'}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </main>
  );
}
