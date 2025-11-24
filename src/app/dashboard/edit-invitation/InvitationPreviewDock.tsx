"use client";

import { useEffect, useMemo, useState } from "react";
import InvitationRenderer, { type InvitationScreenData } from "@/components/InvitationRenderer";

interface InvitationPreviewDockProps {
  initialScreens: InvitationScreenData[];
}

type PreviewUpdateEventDetail = (InvitationScreenData & { screenId: number }) | null;

export default function InvitationPreviewDock({ initialScreens }: InvitationPreviewDockProps) {
  const [screens, setScreens] = useState<InvitationScreenData[]>(initialScreens);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [themeStyle, setThemeStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    setScreens(initialScreens);
  }, [initialScreens]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<PreviewUpdateEventDetail>;
      const detail = customEvent.detail;
      if (!detail) return;
      setScreens((prev) => {
        let found = false;
        const next = prev.map((screen) => {
          if (screen.id === detail.screenId) {
            found = true;
            return { ...screen, ...detail };
          }
          return screen;
        });
        return found ? next : prev;
      });
    };

    const themeHandler = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<{ backgroundType: string; backgroundColor?: string | null; backgroundImageUrl?: string | null }>>;
      const detail = customEvent.detail;
      if (!detail) return;
      const nextStyle: React.CSSProperties = {};
      if (detail.backgroundType === 'color' && detail.backgroundColor) {
        (nextStyle as any)['--theme-tertiary'] = detail.backgroundColor;
        nextStyle.backgroundImage = undefined;
      } else if (detail.backgroundType === 'gradient') {
        (nextStyle as any)['--theme-tertiary'] = 'linear-gradient(135deg, var(--theme-tertiary, #020617), var(--theme-primary, #38bdf8))';
        nextStyle.backgroundImage = undefined;
      } else if (detail.backgroundType === 'image' && detail.backgroundImageUrl) {
        nextStyle.backgroundImage = `url(${detail.backgroundImageUrl})`;
        nextStyle.backgroundSize = 'cover';
        nextStyle.backgroundPosition = 'center';
        (nextStyle as any)['--theme-tertiary'] = 'transparent';
      }
      setThemeStyle(nextStyle);
    };

    window.addEventListener("invitation-preview:update", handler as EventListener);
    window.addEventListener("invitation-preview:theme", themeHandler as EventListener);
    return () => {
      window.removeEventListener("invitation-preview:update", handler as EventListener);
      window.removeEventListener("invitation-preview:theme", themeHandler as EventListener);
    };
  }, []);

  const noop = () => {};
  const sortedScreens = useMemo(() => {
    return [...screens].sort((a, b) => a.order - b.order);
  }, [screens]);

  return (
    <aside className="rounded-[28px] border border-slate-800/70 bg-slate-950/70 p-5 shadow-2xl xl:sticky xl:top-10 xl:h-fit">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-100 uppercase tracking-[0.2em]">Vista previa</p>
          <p className="text-[11px] text-slate-400">
            Toda la página se actualiza aquí. Los botones especiales aparecen pero no tienen interacción.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="text-[11px] text-slate-400 underline-offset-2 hover:text-slate-100"
          >
            {isCollapsed ? "Mostrar" : "Ocultar"}
          </button>
          <div className="inline-flex rounded-md border border-slate-800">
            {(
              [
                { label: "Escritorio", value: "desktop" },
                { label: "Móvil", value: "mobile" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPreviewMode(option.value)}
                className={`px-2 py-1 text-[11px] font-medium transition ${
                  previewMode === option.value ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-100"
                }`}
                disabled={isCollapsed}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!isCollapsed ? (
        sortedScreens.length ? (
          <div
            className={`mt-4 ${previewMode === "mobile" ? "mx-auto w-full max-w-sm" : ""}`}
            data-preview-mode={previewMode}
            style={themeStyle ?? undefined}
          >
            <InvitationRenderer
              screens={sortedScreens}
              onOpenGallery={noop}
              onOpenPlaylist={noop}
              onOpenRsvp={noop}
            />
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-slate-500">No hay pantallas configuradas todavía.</p>
        )
      ) : (
        <p className="mt-3 text-[11px] text-slate-500">Vista previa oculta temporalmente.</p>
      )}
    </aside>
  );
}
