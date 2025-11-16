import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface InvitationPageProps {
  params: { username: string };
  searchParams: { invitation?: string };
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const { username } = params;
  const token = searchParams.invitation;

  const birthdayPerson = await prisma.birthdayPeople.findUnique({
    where: { username },
  });

  if (!birthdayPerson) {
    notFound();
  }

  // De momento solo mostramos la invitación; luego añadiremos validación por token/sesión

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-3xl font-bold text-center">
          Invitación de cumpleaños de {username}
        </h1>

        {birthdayPerson.partyDate && (
          <p className="text-center">
            <span className="font-semibold">Fecha:</span>{' '}
            {birthdayPerson.partyDate.toLocaleString()}
          </p>
        )}

        {birthdayPerson.ubication && (
          <p className="text-center">
            <span className="font-semibold">Ubicación:</span>{' '}
            <a
              href={birthdayPerson.ubication}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              Ver en Google Maps
            </a>
          </p>
        )}

        {birthdayPerson.dressCode && (
          <p className="text-center">
            <span className="font-semibold">Dress code:</span>{' '}
            <a
              href={birthdayPerson.dressCode}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              Ver tablero en Pinterest
            </a>
          </p>
        )}

        {birthdayPerson.extraInfo && (
          <p className="text-sm text-gray-700 whitespace-pre-line">{birthdayPerson.extraInfo}</p>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Token invitado (debug): {token ?? 'ninguno'}
        </p>
      </div>
    </main>
  );
}
