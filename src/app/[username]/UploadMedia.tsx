"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface UploadMediaProps {
  token: string;
}

export default function UploadMedia({ token }: UploadMediaProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) {
      toast.error("Selecciona al menos un archivo");
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append("files", file);
    });

    setUploading(true);
    try {
      const res = await fetch(`/api/gallery/upload?token=${encodeURIComponent(token)}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudieron subir los archivos");
        return;
      }

      toast.success("Archivos subidos correctamente");
      setFiles(null);
      // Recargar para ver la galería actualizada
      window.location.reload();
    } catch {
      toast.error("Error de red al subir archivos");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-2">
      <label className="block text-xs font-medium text-slate-300">
        Sube tus fotos o videos de la fiesta
      </label>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={e => setFiles(e.target.files)}
        className="block w-full text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-100 hover:file:bg-slate-700"
      />
      <p className="text-[11px] text-slate-500">
        El número máximo de archivos está limitado por el anfitrión. Respeta el contenido de la fiesta.
      </p>
      <button
        type="submit"
        disabled={uploading}
        className="mt-1 inline-flex items-center justify-center rounded-full bg-slate-100/10 px-4 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-100/20 disabled:opacity-60"
      >
        {uploading ? "Subiendo..." : "Subir archivos"}
      </button>
    </form>
  );
}
