"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

interface GlobalBackgroundControlsProps {
  initialColor?: string | null;
}

const DEFAULT_COLOR = "#0f172a";

export default function GlobalBackgroundControls({ initialColor }: GlobalBackgroundControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<"color" | "gradient" | "image">("color");
  const [colorValue, setColorValue] = useState(initialColor ?? DEFAULT_COLOR);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialColor) setColorValue(initialColor);
  }, [initialColor]);

  const triggerThemeEvent = (payload: Partial<{ backgroundType: "color" | "gradient" | "image"; backgroundColor?: string | null; backgroundImageUrl?: string | null }>) => {
    if (typeof window === "undefined") return;
    const detail = { ...payload } as any;
    window.dispatchEvent(
      new CustomEvent("invitation-preview:theme", {
        detail,
      }),
    );
  };

  const applyToDocument = (type: "color" | "gradient" | "image", color?: string | null, imageUrl?: string | null) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (type === "color") {
      root.style.setProperty('--theme-tertiary', color ?? DEFAULT_COLOR);
    } else if (type === "gradient") {
      root.style.setProperty('--theme-tertiary', 'linear-gradient(135deg, var(--theme-tertiary, #020617), var(--theme-primary, #38bdf8))');
    } else if (type === "image") {
      // for global image we set a CSS var to an empty color fallback and set body bg-image
      root.style.setProperty('--theme-tertiary', 'transparent');
      document.body.style.backgroundImage = imageUrl ? `url(${imageUrl})` : '';
      document.body.style.backgroundSize = imageUrl ? 'cover' : '';
      document.body.style.backgroundPosition = imageUrl ? 'center' : '';
    }
  };

  // Color apply handled via "Guardar y aplicar" — we remove the separate "Aplicar color" action.

  const handleGradientSave = async () => {
    setIsUploading(true);
    setStatus(null);
    try {
      applyToDocument('gradient');
      triggerThemeEvent({ backgroundType: 'gradient' });
      setStatus('Gradiente aplicado ✔');
    } catch (err) {
      setStatus('Error aplicando gradiente');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setStatus('Subiendo imagen...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/uploads/background', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Error al subir');
      const data = await res.json();
      const url = data.url as string;
      setLastImageUrl(url);
      applyToDocument('image', null, url);
      triggerThemeEvent({ backgroundType: 'image', backgroundImageUrl: url });
      setStatus('Imagen global aplicada ✔');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentLabel = useMemo(() => {
    if (mode === 'image') return 'Imagen global';
    if (mode === 'gradient') return 'Gradiente global';
    return `Color actual: ${colorValue}`;
  }, [mode, colorValue]);

  const handleSaveToServer = async () => {
    setIsUploading(true);
    setStatus(null);
    try {
      const payload: any = { backgroundType: mode };
      if (mode === 'color') payload.backgroundColor = colorValue;
      if (mode === 'image') payload.backgroundImageUrl = lastImageUrl ?? null;
      // First apply locally so the preview updates immediately
      if (mode === 'color') {
        applyToDocument('color', colorValue, null);
        triggerThemeEvent({ backgroundType: 'color', backgroundColor: colorValue });
      } else if (mode === 'gradient') {
        applyToDocument('gradient');
        triggerThemeEvent({ backgroundType: 'gradient' });
      } else if (mode === 'image') {
        applyToDocument('image', null, lastImageUrl ?? null);
        triggerThemeEvent({ backgroundType: 'image', backgroundImageUrl: lastImageUrl });
      }

      const res = await fetch('/api/invitation/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error' }));
        throw new Error(err.error || 'No se pudo guardar');
      }

      // Friendly, local-focused status messages
      if (mode === 'color') setStatus('Color guardado ✔');
      else if (mode === 'gradient') setStatus('Gradiente guardado ✔');
      else if (mode === 'image') setStatus('Imagen guardada ✔');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
      {/* Hidden input so the main form can persist the tertiary/background color on submit */}
      {mode === 'color' && (
        <input type="hidden" name="tertiaryColor" value={colorValue} />
      )}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-200">Fondo global de la invitación</p>
          <p className="text-[11px] text-slate-500">Controla el fondo que usan los fragmentos con "Automático" y la invitación en general.</p>
        </div>
        <div className="flex items-center gap-1">
          {([
            { value: 'color', label: 'Color' },
            { value: 'gradient', label: 'Gradiente' },
            { value: 'image', label: 'Imagen' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={`rounded-full px-2 py-1 text-[11px] font-medium transition ${mode === opt.value ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-100'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'color' ? (
        <div className="flex items-center gap-3">
          <input type="color" value={colorValue} onChange={(e) => setColorValue(e.target.value)} className="h-8 w-16 rounded border border-slate-700 bg-transparent" disabled={isUploading} />
          <button type="button" onClick={handleSaveToServer} disabled={isUploading} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-100 disabled:opacity-40">Guardar y aplicar</button>
        </div>
      ) : mode === 'gradient' ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg overflow-hidden h-16 w-full border border-slate-800" style={{ background: 'linear-gradient(135deg, var(--theme-tertiary, #020617), var(--theme-primary, #38bdf8))' }} />
          <div className="flex gap-2">
            <button type="button" onClick={handleGradientSave} disabled={isUploading} className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Aplicar gradiente</button>
            <button type="button" onClick={handleSaveToServer} disabled={isUploading} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-100 disabled:opacity-40">Guardar y aplicar</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/** image upload */}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="text-[11px]" disabled={isUploading} />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-100" disabled={isUploading}>Elegir archivo</button>
            <button type="button" onClick={handleSaveToServer} disabled={isUploading || !lastImageUrl} className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-100 disabled:opacity-40">Guardar y aplicar</button>
          </div>
          <p className="text-[10px] text-slate-500">Formatos: JPG, PNG, WEBP. Máx 5MB.</p>
        </div>
      )}

      <p className="text-[11px] text-slate-400">{currentLabel}</p>
      {status && <p className="text-[11px] text-emerald-300">{status}</p>}
    </div>
  );
}
