"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

interface ScreenBackgroundControlsProps {
  screenId: number;
  backgroundType: "image" | "color" | "gradient";
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
}

const DEFAULT_COLOR = "#0f172a";
const DEFAULT_GRADIENT = "linear-gradient(135deg, var(--theme-tertiary, #020617), var(--theme-primary, #38bdf8))";

export default function ScreenBackgroundControls({
  screenId,
  backgroundType,
  backgroundColor,
  backgroundImageUrl,
}: ScreenBackgroundControlsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<"image" | "color" | "gradient">(backgroundType);
  const [colorValue, setColorValue] = useState(backgroundColor ?? DEFAULT_COLOR);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setMode(backgroundType ?? "color");
  }, [backgroundType]);

  useEffect(() => {
    if (backgroundColor) {
      setColorValue(backgroundColor);
    }
  }, [backgroundColor]);

  const currentBackgroundLabel = useMemo(() => {
    if (mode === "image" && backgroundImageUrl) return "Imagen subida";
    if (mode === "image") return "Sin imagen";
    if (mode === "gradient") return "Gradiente predeterminado";
    return `Color actual: ${colorValue}`;
  }, [mode, backgroundImageUrl, colorValue]);

  const triggerPreviewEvent = (payload: Partial<{ backgroundType: "image" | "color" | "gradient"; backgroundColor?: string | null; backgroundImageUrl?: string | null }>) => {
    if (typeof window === "undefined") return;
    const detail = {
      screenId,
      ...payload,
    } as any;
    window.dispatchEvent(
      new CustomEvent("invitation-preview:update", {
        detail,
      }),
    );
  };

  const updateBackground = async (payload: { backgroundType: "image" | "color" | "gradient"; backgroundColor?: string; backgroundImageUrl?: string | null }) => {
    setStatus(null);
    try {
      const res = await fetch(`/api/invitation/screens/${screenId}/background`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Error al guardar" }));
        throw new Error(error.error || "No se pudo guardar el fondo");
      }

      triggerPreviewEvent(payload);
      router.refresh();
      setStatus("Fondo actualizado ✔");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error inesperado");
    }
  };

  const handleColorSave = async () => {
    setIsUploading(true);
    try {
      await updateBackground({ backgroundType: "color", backgroundColor: colorValue });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGradientSave = async () => {
    setIsUploading(true);
    try {
      await updateBackground({ backgroundType: "gradient" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("Subiendo imagen…");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads/background", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Error al subir" }));
        throw new Error(error.error || "No se pudo subir la imagen");
      }

      const { url } = await res.json();
      await updateBackground({ backgroundType: "image", backgroundImageUrl: url });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-200">Fondo de la pantalla</p>
          <p className="text-[11px] text-slate-500">Sube una imagen, usa un color sólido o el gradiente predeterminado.</p>
        </div>
        <div className="flex items-center gap-1">
          {([
            { value: "color", label: "Color" },
            { value: "image", label: "Imagen" },
            { value: "gradient", label: "Gradiente" },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              className={`rounded-full px-2 py-1 text-[11px] font-medium transition ${
                mode === option.value
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "color" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Color</span>
            <input
              type="color"
              value={colorValue}
              onChange={(event) => setColorValue(event.target.value)}
              className="h-8 w-16 rounded border border-slate-700 bg-transparent"
              disabled={isUploading}
            />
          </label>
          <button
            type="button"
            onClick={handleColorSave}
            disabled={isUploading}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-900 disabled:opacity-40"
          >
            Guardar color
          </button>
        </div>
      ) : mode === "image" ? (
        <div className="space-y-2">
          {backgroundImageUrl ? (
            <div className="overflow-hidden rounded-lg border border-slate-800">
              <img src={backgroundImageUrl} alt="Preview del fondo" className="h-32 w-full object-cover" />
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">Aún no hay imagen. Sube una para ver la invitación con foto.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="text-[11px]"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-100"
              disabled={isUploading}
            >
              Elegir archivo
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Formatos: JPG, PNG, WEBP. Máx 5MB.</p>
        </div>

      ) : mode === "gradient" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-500 h-16 w-full" />
          <button
            type="button"
            onClick={handleGradientSave}
            disabled={isUploading}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            Usar gradiente
          </button>
        </div>
      ) : null}

      <p className="text-[11px] text-slate-400">{currentBackgroundLabel}</p>
      {status && <p className="text-[11px] text-emerald-300">{status}</p>}
    </div>
  );
}
