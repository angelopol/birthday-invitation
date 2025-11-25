"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function DashboardMediaUploader() {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const files = formData.getAll("files");

    if (!files.length) {
      toast.error("Selecciona al menos un archivo");
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "No se pudo subir");
        return;
      }

      toast.success("Archivo(s) subido(s) correctamente");
      const uploaded = data.uploaded || [];
      // Notify any gallery viewers on the page to update
      try {
        window.dispatchEvent(new CustomEvent('gallery:uploaded', { detail: uploaded }));
      } catch (e) {
        // ignore if dispatching fails (e.g., during SSR)
      }
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      toast.error("Error al subir archivos");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-slate-700 p-3 bg-slate-900/60 space-y-2">
      <p className="text-xs font-semibold text-slate-200">Subir fotos o videos a la galería</p>
      <p className="text-[11px] text-slate-400">
        Como cumpleañero puedes subir tus propios recuerdos. Se aplican los mismos límites de cantidad que para los invitados.
      </p>
      <form onSubmit={handleUpload} className="space-y-2">
        <input
          type="file"
          name="files"
          multiple
          accept="image/*,video/*"
          className="block w-full text-xs text-slate-200 file:mr-2 file:rounded-md file:border-0 file:bg-slate-700 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-600"
        />
        <button
          type="submit"
          disabled={isUploading}
          className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? "Subiendo..." : "Subir a mi galería"}
        </button>
      </form>
    </div>
  );
}
