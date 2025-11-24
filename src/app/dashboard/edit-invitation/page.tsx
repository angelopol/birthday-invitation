import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { CSSProperties } from 'react';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { normalizeBackgroundImageUrl } from '@/lib/backgrounds';
import ScreenBlocksEditor from './ScreenBlocksEditor';
import SplitFragmentsEditor from './SplitFragmentsEditor';
import ScreenBackgroundControls from './ScreenBackgroundControls';
import ScreensReorderManager from './ScreensReorderManager';
import GlobalBackgroundControls from './GlobalBackgroundControls';
import PreviewModal from './PreviewModal';
import type { InvitationScreenData } from '@/components/InvitationRenderer';
import DuplicateScreenButton from '@/components/DuplicateScreenButton';
import DeleteScreenButton from '@/components/DeleteScreenButton';

const THEME_FONT_OPTIONS = [
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Lato', value: "'Lato', sans-serif" },
  { label: 'Great Vibes', value: "'Great Vibes', cursive" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Sistema (predeterminado)', value: 'inherit' },
];

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

  const screensRaw = await prisma.invitationScreen.findMany({
    where: { birthdayUsername: username },
    orderBy: { order: 'asc' },
  });

  const screens = screensRaw.map((screen) => {
    const fragments = Array.isArray(screen.fragments)
      ? (screen.fragments as any[]).map((fragment) => ({
          ...fragment,
          backgroundImageUrl: normalizeBackgroundImageUrl(fragment?.backgroundImageUrl),
        }))
      : screen.fragments;

    return {
      ...screen,
      backgroundImageUrl: normalizeBackgroundImageUrl(screen.backgroundImageUrl),
      fragments,
    } as typeof screen;
  });
  const previewScreens: InvitationScreenData[] = screens.map((screen) => ({
    id: screen.id,
    order: screen.order,
    backgroundType:
      screen.backgroundType === 'image'
        ? 'image'
        : screen.backgroundType === 'gradient'
        ? 'gradient'
        : 'color',
    backgroundImageUrl: screen.backgroundImageUrl,
    backgroundColor: screen.backgroundColor,
    layoutType: (screen.layoutType ?? 'single') as 'single' | 'split',
    content: (screen.content as any) ?? null,
    fragments: (screen.fragments as any) ?? null,
  }));

  async function createScreen(formData: FormData) {
    'use server';
    const currentSession = await getServerSession(authOptions);
    if (!currentSession || !currentSession.user) {
      redirect('/auth/login');
    }
    const currentUsername = (currentSession.user as any).username as string;

    const maxOrderRow = await prisma.invitationScreen.findFirst({
      where: { birthdayUsername: currentUsername },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (maxOrderRow?.order ?? 0) + 1;

    await prisma.invitationScreen.create({
      data: {
        birthdayUsername: currentUsername,
        order: nextOrder,
        layoutType: 'single',
        backgroundType: 'color',
      },
    });

    redirect('/dashboard/edit-invitation');
  }

  async function duplicateScreen(formData: FormData) {
    'use server';
    const currentSession = await getServerSession(authOptions);
    if (!currentSession || !currentSession.user) {
      redirect('/auth/login');
    }
    const currentUsername = (currentSession.user as any).username as string;

    const id = Number(formData.get('screenId'));
    if (!id) {
      redirect('/dashboard/edit-invitation');
    }

    const existing = await prisma.invitationScreen.findFirst({
      where: { id, birthdayUsername: currentUsername },
      select: {
        id: true,
        order: true,
        backgroundType: true,
        backgroundImageUrl: true,
        backgroundColor: true,
        layoutType: true,
        content: true,
        fragments: true,
      },
    });

    if (!existing) {
      redirect('/dashboard/edit-invitation');
    }

    // Shift subsequent screens order +1
    const toShift = await prisma.invitationScreen.findMany({
      where: { birthdayUsername: currentUsername, order: { gte: existing.order } },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });

    for (let i = 0; i < toShift.length; i++) {
      const item = toShift[i];
      const desired = item.order + 1;
      if (item.order !== desired) {
        // eslint-disable-next-line no-await-in-loop
        await prisma.invitationScreen.updateMany({
          where: { id: item.id, birthdayUsername: currentUsername },
          data: { order: desired },
        });
      }
    }

    // Create duplicated screen right after the original
    await prisma.invitationScreen.create({
      data: {
        birthdayUsername: currentUsername,
        order: existing.order + 1,
        backgroundType: existing.backgroundType,
        backgroundImageUrl: existing.backgroundImageUrl,
        backgroundColor: existing.backgroundColor,
        layoutType: existing.layoutType ?? 'single',
        content: existing.content ?? undefined,
        fragments: existing.fragments ?? undefined,
      },
    });

    redirect('/dashboard/edit-invitation');
  }

  async function updateScreenContent(formData: FormData) {
    'use server';

    const currentSession = await getServerSession(authOptions);
    if (!currentSession || !currentSession.user) {
      redirect('/auth/login');
    }
    const currentUsername = (currentSession.user as any).username as string;

    const id = Number(formData.get('screenId'));
    const layoutType = (formData.get('layoutType') as string) === 'split' ? 'split' : 'single';
    const rawFragments = formData.get('fragmentsJson') as string | null;

    if (!id) {
      redirect('/dashboard/edit-invitation');
    }

    let parsedFragments: unknown | undefined;
    if (rawFragments && rawFragments.trim().length > 0) {
      try {
        parsedFragments = JSON.parse(rawFragments);
      } catch {
        redirect('/dashboard/edit-invitation');
      }
    }

    const existingScreen = await prisma.invitationScreen.findFirst({
      where: {
        id,
        birthdayUsername: currentUsername,
      },
      select: {
        content: true,
        fragments: true,
      },
    });

    if (!existingScreen) {
      redirect('/dashboard/edit-invitation');
    }

    const updateData: Record<string, unknown> = {
      layoutType,
    };

    if (layoutType === 'single') {
      updateData.fragments = null;
      const hasContent = Array.isArray(existingScreen.content) && existingScreen.content.length > 0;
      if (!hasContent) {
        const flattenedFragments = Array.isArray(existingScreen.fragments)
          ? existingScreen.fragments.flatMap((fragment: any) =>
              Array.isArray(fragment?.content) ? fragment.content : []
            )
          : [];
        if (flattenedFragments.length > 0) {
          updateData.content = flattenedFragments;
        }
      }
    } else {
      if (parsedFragments !== undefined) {
        updateData.fragments = parsedFragments;
        updateData.content = null;
      }
    }

    await prisma.invitationScreen.updateMany({
      where: {
        id,
        birthdayUsername: currentUsername,
      },
      data: updateData,
    });

    redirect('/dashboard/edit-invitation');
  }

  async function deleteScreen(formData: FormData) {
    'use server';

    const currentSession = await getServerSession(authOptions);
    if (!currentSession || !currentSession.user) {
      redirect('/auth/login');
    }
    const currentUsername = (currentSession.user as any).username as string;

    const id = Number(formData.get('screenId'));
    if (!id) {
      redirect('/dashboard/edit-invitation');
    }

    await prisma.invitationScreen.deleteMany({
      where: {
        id,
        birthdayUsername: currentUsername,
      },
    });

    // Re-order remaining screens so `order` is contiguous starting at 1
    const remaining = await prisma.invitationScreen.findMany({
      where: { birthdayUsername: currentUsername },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });

    // Update orders to be 1..n
    for (let i = 0; i < remaining.length; i++) {
      const screenItem = remaining[i];
      const desired = i + 1;
      if (screenItem.order !== desired) {
        // use updateMany to ensure username constraint
        // (should match single row)
        // eslint-disable-next-line no-await-in-loop
        await prisma.invitationScreen.updateMany({
          where: { id: screenItem.id, birthdayUsername: currentUsername },
          data: { order: desired },
        });
      }
    }

    redirect('/dashboard/edit-invitation');
  }

  // Inline preview theme variables to style the preview dock according to saved theme
  const previewThemeVars: CSSProperties = {};
  if (birthdayPerson.primaryColor) (previewThemeVars as any)['--theme-primary'] = birthdayPerson.primaryColor;
  if (birthdayPerson.secondaryColor) (previewThemeVars as any)['--theme-secondary'] = birthdayPerson.secondaryColor;
  if (birthdayPerson.backgroundColor) (previewThemeVars as any)['--theme-tertiary'] = birthdayPerson.backgroundColor;
  if (birthdayPerson.typographyFamily) (previewThemeVars as any)['--theme-font-family'] = birthdayPerson.typographyFamily;
  if (birthdayPerson.typographySize) (previewThemeVars as any)['--theme-font-size'] = `${birthdayPerson.typographySize}px`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 px-4 py-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="space-y-6 2xl:space-y-8">
          <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/85 p-6 shadow-2xl sm:p-8 lg:p-10 space-y-10">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Editar invitación</h1>
              <p className="text-sm text-slate-400">
                Configura los colores y la tipografía que se aplican a toda la experiencia.
              </p>
              <p className="text-xs text-slate-400">
                Escribe <span className="font-mono text-slate-200">@invitado</span> en cualquier título, párrafo o botón: al compartir la invitación se sustituirá automáticamente por el nombre real de cada persona (o "invitad@" si no lo registraste). Si escribes <span className="font-mono text-slate-200">@INVITADO</span>, el nombre aparecerá en mayúsculas; en minúsculas se respetará tal cual.
              </p>
            </div>

            <form action="/api/invitation" method="post" className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Color primario</label>
                  <input
                    type="color"
                    name="primaryColor"
                    defaultValue={birthdayPerson.primaryColor ?? '#3b82f6'}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60"
                  />
                  <p className="text-[11px] text-slate-500">
                    Resalta títulos, botones principales, enlaces y el texto destacado en toda la app.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Color secundario</label>
                  <input
                    type="color"
                    name="secondaryColor"
                    defaultValue={birthdayPerson.secondaryColor ?? '#6366f1'}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60"
                  />
                  <p className="text-[11px] text-slate-500">
                    Se usa para bordes, sombras y estados de énfasis en tarjetas, modales y botones secundarios.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Color terciario</label>
                  <input
                    type="color"
                    name="tertiaryColor"
                    defaultValue={birthdayPerson.backgroundColor ?? '#020617'}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60"
                  />
                  <p className="text-[11px] text-slate-500">
                    Define los fondos principales: tarjeta de invitación, barra de navegación, footer y modales.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <GlobalBackgroundControls initialColor={birthdayPerson.backgroundColor} />
              </div>

              <p className="text-[11px] text-slate-500">
                Estos tonos se aplican en la invitación pública, la barra de navegación, el footer y los modales del panel.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Tipografía principal</label>
                  <select
                    name="typographyFamily"
                    defaultValue={birthdayPerson.typographyFamily ?? ''}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Mantener tipografía base</option>
                    {THEME_FONT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Tamaño de fuente (px)</label>
                  <input
                    type="number"
                    min={12}
                    max={24}
                    name="typographySize"
                    defaultValue={birthdayPerson.typographySize ?? 14}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition"
                >
                  Guardar cambios
                </button>
              </div>
            </form>

            <section className="pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Pantallas de la invitación</h2>
                <form action={createScreen}>
                  <button
                    type="submit"
                    className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400 transition"
                  >
                    + Añadir pantalla
                  </button>
                </form>
              </div>

              <div className="mt-3">
                {/* Client reorder manager */}
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore Server component can render client component */}
                <ScreensReorderManager initialScreens={screens as any} />
              </div>

              {screens.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Aún no tienes pantallas configuradas. Crea una para empezar.
                </p>
              ) : (
                <div className="space-y-4">
                  {screens.map((screen) => {
                    const isSplit = (screen.layoutType ?? 'single') === 'split';
                    return (
                      <div
                        key={screen.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-100">Pantalla #{screen.order}</p>
                            <p className="text-xs text-slate-500">
                              Fondo: {screen.backgroundType === 'image' ? 'imagen' : 'color plano'}
                            </p>
                          </div>
                        </div>

                        <form action={updateScreenContent} className="space-y-2">
                          <input type="hidden" name="screenId" value={screen.id} />
                          <label className="block text-xs font-medium text-slate-300">Diseño de pantalla</label>
                          <select
                            name="layoutType"
                            defaultValue={screen.layoutType ?? 'single'}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="single">Una sola columna</option>
                            <option value="split">Pantalla dividida</option>
                          </select>
                          {isSplit && <input type="hidden" name="fragmentsJson" value="" readOnly />}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="submit"
                              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 transition"
                            >
                              Guardar diseño
                            </button>
                          </div>
                        </form>

                        <form id={`duplicate-screen-form-${screen.id}`} action={duplicateScreen}>
                          <input type="hidden" name="screenId" value={screen.id} />
                        </form>
                        <form id={`delete-screen-form-${screen.id}`} action={deleteScreen}>
                          <input type="hidden" name="screenId" value={screen.id} />
                        </form>
                        {/* client-side buttons: duplicate then delete (both submit hidden server forms) */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                          {/* @ts-ignore Server component can render client component */}
                          <DuplicateScreenButton
                            formId={`duplicate-screen-form-${screen.id}`}
                            className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400 transition"
                          />
                          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                          {/* @ts-ignore Server component can render client component */}
                          <DeleteScreenButton
                            formId={`delete-screen-form-${screen.id}`}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 transition"
                          />
                        </div>

                        {!isSplit ? (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                            <p className="text-xs font-medium text-slate-300">Constructor de bloques</p>
                            <ScreenBlocksEditor
                              screenId={screen.id}
                              initialBlocks={(screen.content as any) ?? []}
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                            <p className="text-xs font-medium text-slate-300">Constructor de fragmentos</p>
                            <SplitFragmentsEditor
                              screenId={screen.id}
                              screenOrder={screen.order}
                              initialFragments={(screen.fragments as any) ?? null}
                              fallbackContent={(screen.content as any) ?? null}
                              backgroundType={screen.backgroundType as 'image' | 'color'}
                              backgroundImageUrl={screen.backgroundImageUrl}
                              backgroundColor={screen.backgroundColor}
                            />
                          </div>
                        )}

                        <ScreenBackgroundControls
                          screenId={screen.id}
                          backgroundType={screen.backgroundType as 'image' | 'color' | 'gradient'}
                          backgroundColor={screen.backgroundColor}
                          backgroundImageUrl={screen.backgroundImageUrl}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <PreviewModal initialScreens={previewScreens} themeStyle={previewThemeVars} />
    </main>
  );
}
