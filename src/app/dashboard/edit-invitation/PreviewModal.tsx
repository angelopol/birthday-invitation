"use client";

import React, { useEffect, useState } from "react";
import InvitationRenderer, { type InvitationScreenData } from "@/components/InvitationRenderer";

interface PreviewModalProps {
  initialScreens: InvitationScreenData[];
  themeStyle?: React.CSSProperties | null;
}

export default function PreviewModal({ initialScreens, themeStyle }: PreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [screens, setScreens] = useState<InvitationScreenData[]>(initialScreens);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    setScreens(initialScreens);
  }, [initialScreens]);

  const sortedScreens = [...screens].sort((a, b) => a.order - b.order);

  return (
    <>
      <button
        type="button"
        aria-label="Ver vista previa"
        title="Ver vista previa"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 p-3 text-white shadow-lg hover:bg-sky-500 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-6xl max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-100">Vista previa</h3>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md border border-slate-800">
                  {([
                    { label: "Escritorio", value: "desktop" },
                    { label: "Móvil", value: "mobile" },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPreviewMode(option.value)}
                      className={`px-2 py-1 text-[11px] font-medium transition ${
                        previewMode === option.value ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Cerrar vista previa"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-1 text-sm text-slate-300 hover:text-white"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div
              className={`max-h-[80vh] overflow-auto rounded-2xl bg-slate-900/95 p-6 shadow-2xl ${
                previewMode === "mobile" ? "mx-auto w-full max-w-sm" : "w-full"
              }`}
              style={themeStyle ?? undefined}
            >
              <InvitationRenderer
                screens={sortedScreens}
                onOpenGallery={() => {}}
                onOpenPlaylist={() => {}}
                onOpenRsvp={() => {}}
                previewMode={previewMode}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
