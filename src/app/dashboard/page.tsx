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
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-xl space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-700">
          Bienvenido, <span className="font-medium">{username}</span>
        </p>
        <p className="text-sm text-gray-600">
          Aquí podrás configurar tu invitación y gestionar tus invitados.
        </p>
      </div>
    </main>
  );
}
