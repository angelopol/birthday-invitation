import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Editar invitación</h1>
        <p className="text-sm text-gray-600">Configura la información que verán tus invitados.</p>

        <form
          action="/api/invitation"
          method="post"
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Fecha y hora de la fiesta</label>
            <input
              type="datetime-local"
              name="partyDate"
              defaultValue={birthdayPerson.partyDate ? new Date(birthdayPerson.partyDate).toISOString().slice(0, 16) : ''}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Link de Google Maps (ubicación)</label>
            <input
              type="url"
              name="ubication"
              defaultValue={birthdayPerson.ubication ?? ''}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Link de Pinterest (dress code)</label>
            <input
              type="url"
              name="dressCode"
              defaultValue={birthdayPerson.dressCode ?? ''}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Texto extra</label>
            <textarea
              name="extraInfo"
              defaultValue={birthdayPerson.extraInfo ?? ''}
              className="w-full border rounded px-3 py-2 text-sm min-h-[120px]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </main>
  );
}
