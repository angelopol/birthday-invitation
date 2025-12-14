import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getPublicUrl } from '@/lib/s3';
import GalleryClient from '@/app/[username]/GalleryClient';
import DashboardMediaUploader from '../uploader';

type GalleryDbRow = {
  id: number;
  fileName: string;
  fileType: string;
  s3Key: string;
};

export const metadata = {
  title: 'Galería de tu fiesta — BirthdayInvitation',
};

export default async function DashboardGalleryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const username = (session.user as any).username as string;

  const galleryRaw: GalleryDbRow[] = await prisma.partysGallery.findMany({
    where: { birthdayUsername: username },
    orderBy: { createdAt: 'desc' },
  });

  const gallery = galleryRaw.map((item) => ({
    id: item.id,
    fileName: item.fileName,
    fileType: item.fileType,
    s3Key: item.s3Key,
    publicUrl: getPublicUrl(item.s3Key),
  }));

  const getKind = (fileType: string) => {
    const t = (fileType || '').toLowerCase();
    if (t === 'video' || t.startsWith('video/')) return 'video';
    if (t === 'image' || t.startsWith('image/')) return 'image';
    return 'other';
  };

  const photoCount = gallery.filter((item) => getKind(item.fileType) === 'image').length;
  const videoCount = gallery.filter((item) => getKind(item.fileType) === 'video').length;

  async function resetGallery(formData: FormData) {
    'use server';

    const currentSession = await getServerSession(authOptions);
    if (!currentSession || !currentSession.user) {
        redirect('/auth/login');
    }

    const username = (currentSession.user as any).username as string;

    // Borrar en S3 y en la base de datos directamente
    const items = await prisma.partysGallery.findMany({
        where: { birthdayUsername: username },
    });

    // Opcional: si quieres seguir borrando de S3 aquí, hay que importar deleteFromS3
    // desde "@/lib/s3" en este archivo.
    // Si no quieres tocar S3 desde aquí, al menos haz el deleteMany para limpiar la galería.
    await prisma.partysGallery.deleteMany({
        where: { birthdayUsername: username },
    });

    redirect('/dashboard/gallery');
    }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900/85 border border-slate-800 shadow-[0_24px_70px_rgba(15,23,42,0.95)] p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Galería de tu fiesta</h1>
          <p className="text-sm text-slate-400">
            Sube fotos o vídeos a tu galería, revisa lo que han compartido tus invitad@s y reinicia todo si lo necesitas.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-xl shadow-black/40 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-slate-100">Sube y organiza tus recuerdos</h2>
              <p className="text-xs text-slate-400">
                Tus invitad@s podrán subir fotos desde su enlace personalizado. Aquí puedes ver todo lo que se comparte y limpiar lo que no quieras conservar.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2 py-1">
                  <span className="text-xs">📸</span>
                  <span>
                    {photoCount === 0
                      ? 'Aún no hay fotos'
                      : `${photoCount} foto${photoCount === 1 ? '' : 's'}`}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2 py-1">
                  <span className="text-xs">🎬</span>
                  <span>
                    {videoCount === 0
                      ? 'Aún no hay vídeos'
                      : `${videoCount} vídeo${videoCount === 1 ? '' : 's'}`}
                  </span>
                </span>
              </div>
            </div>
            <form action={resetGallery} className="md:self-start">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg border border-red-500/60 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-200 shadow-sm transition hover:bg-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <span className="mr-1.5 text-xs">🧹</span>
                Reiniciar galería
              </button>
            </form>
          </div>

          <div>
            <DashboardMediaUploader />
          </div>

          <div className="pt-2 border-t border-slate-800">
            <GalleryClient initialItems={gallery} allowDelete />
          </div>
        </div>
      </div>
    </main>
  );
}
