import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import GalleryClient from '@/app/[username]/GalleryClient';
import DashboardMediaUploader from '../uploader';

export default async function DashboardGalleryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const username = (session.user as any).username as string;

  const galleryRaw = await prisma.partysGallery.findMany({
    where: { birthdayUsername: username },
    orderBy: { createdAt: 'desc' },
  });

  const gallery = galleryRaw.map(item => ({
    id: item.id,
    fileName: item.fileName,
    fileType: item.fileType,
    s3Key: item.s3Key,
    publicUrl: `/api/gallery/file/${item.id}`,
  }));

  async function resetGallery() {
    'use server';

    const currentSession = await getServerSession(authOptions);
    if (!currentSession || !currentSession.user) {
      redirect('/auth/login');
    }

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/gallery/reset`, {
      method: 'POST',
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Galería</h1>
          <p className="text-sm text-slate-400">
            Sube fotos o videos a tu galería, revisa lo que han compartido tus invitados y reinicia todo si lo necesitas.
          </p>
        </div>

        <DashboardMediaUploader />

        <form action={resetGallery} className="mt-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center rounded-lg border border-red-500/60 px-4 py-2 font-medium text-red-300 hover:bg-red-500/10 transition-colors text-xs"
          >
            Reiniciar galería (borra todas las fotos)
          </button>
        </form>

        <GalleryClient initialItems={gallery} />
      </div>
    </main>
  );
}
