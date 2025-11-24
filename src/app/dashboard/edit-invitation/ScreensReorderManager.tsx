"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import type { InvitationScreenData } from "@/components/InvitationRenderer";
import ScreenBlocksEditor from "./ScreenBlocksEditor";
import SplitFragmentsEditor from "./SplitFragmentsEditor";
import ScreenBackgroundControls from "./ScreenBackgroundControls";
import DuplicateScreenButton from "@/components/DuplicateScreenButton";
import DeleteScreenButton from "@/components/DeleteScreenButton";
// Using native HTML5 drag-and-drop to avoid external dependency

type Props = {
  initialScreens: InvitationScreenData[];
};

export default function ScreensReorderManager({ initialScreens }: Props) {
  const [ordered, setOrdered] = useState<InvitationScreenData[]>(
    [...initialScreens].sort((a, b) => a.order - b.order)
  );
  

  const move = (index: number, direction: -1 | 1) => {
    setOrdered((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      // update order numbers locally for display
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const saveOrder = async (payload: Array<{ id: number; order: number }>) => {
    try {
      const res = await fetch('/api/invitation/screens/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderings: payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error' }));
        throw new Error(err.error || 'No se pudo guardar el orden');
      }
      toast.success('Secuencia guardada');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Error inesperado');
    }
  };

  

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <p className="text-xs font-semibold text-slate-200">Secuencia de pantallas</p>
        <p className="text-[11px] text-slate-400">Usa las flechas para cambiar el orden. Presiona "Guardar secuencia" para persistir los cambios.</p>
        <ol className="mt-3 space-y-2">
          {ordered.map((s, idx) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-md p-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] text-slate-300">{s.order}</span>
                <div className="text-sm">
                  <div className="text-slate-100">Pantalla #{s.order}</div>
                  <div className="text-[11px] text-slate-400">{s.layoutType === 'split' ? 'Dividida' : 'Una columna'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded px-2 py-1 text-[11px] bg-slate-800 text-slate-200">↑</button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === ordered.length - 1} className="rounded px-2 py-1 text-[11px] bg-slate-800 text-slate-200">↓</button>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-end">
          {/* keep manual save as fallback in case autosave fails or user prefers it */}
          <button
            type="button"
            onClick={() => {
              const payload = ordered.map((s, i) => ({ id: s.id, order: i + 1 }));
              saveOrder(payload);
            }}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400"
          >
            Guardar secuencia
          </button>
        </div>
        {ordered.map((screen) => {
          const isSplit = (screen.layoutType ?? 'single') === 'split';
          return (
            <div key={screen.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-100">Pantalla #{screen.order}</p>
                  <p className="text-xs text-slate-500">Fondo: {screen.backgroundType === 'image' ? 'imagen' : 'color plano'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <DuplicateScreenButton formId={`duplicate-screen-form-${screen.id}`} className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400 transition" />
                  <DeleteScreenButton formId={`delete-screen-form-${screen.id}`} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 transition" />
                </div>
              </div>

              {!isSplit ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-300">Constructor de bloques</p>
                  <ScreenBlocksEditor screenId={screen.id} initialBlocks={(screen.content as any) ?? []} />
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
    </div>
  );
}
