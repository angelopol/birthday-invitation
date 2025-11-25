"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface UploadMediaProps {
  token: string;
  onUploaded?: (items: any[]) => void;
}

export default function UploadMedia({ token, onUploaded }: UploadMediaProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) {
      toast.error("Selecciona al menos un archivo");
      return;
    }
    const fileList: Array<{ fileName: string; contentType: string; file: File }> = [];
    Array.from(files).forEach(file => {
      fileList.push({ fileName: file.name, contentType: file.type || 'application/octet-stream', file });
    });

    setUploading(true);
    try {
      const presignRes = await fetch(`/api/gallery/presign?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ files: fileList.map(f => ({ fileName: f.fileName, contentType: f.contentType })) }),
      });

      const presignJson = await presignRes.json();
      if (!presignRes.ok) {
        toast.error(presignJson.error || 'No se pudieron obtener URLs de subida');
        return;
      }

      const signed = presignJson.signed || [];
      const uploadedInfos: Array<{ key: string; fileName: string; fileType: string }> = [];

      for (let i = 0; i < signed.length; i++) {
        const s = signed[i];
        const f = fileList[i];
        try {
          const putRes = await fetch(s.url, {
            method: 'PUT',
            headers: { 'content-type': s.contentType },
            body: f.file,
          });

          if (!putRes.ok) {
            console.error('S3 PUT failed', await putRes.text());
            throw new Error('Error subiendo a S3');
          }

          uploadedInfos.push({ key: s.key, fileName: s.fileName, fileType: s.contentType });
        } catch (err) {
          console.error('Upload failed', err);
          toast.error('Error subiendo a S3');
        }
      }

      if (!uploadedInfos.length) {
        toast.error('No se pudieron subir archivos');
        return;
      }

      const registerRes = await fetch(`/api/gallery/register?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uploads: uploadedInfos }),
      });

      const registerJson = await registerRes.json();
      if (!registerRes.ok) {
        toast.error(registerJson.error || 'No se pudieron registrar los archivos');
        return;
      }

      toast.success('Archivos subidos correctamente');
      setFiles(null);
      if (onUploaded) {
        onUploaded(registerJson.uploaded || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de red al subir archivos');
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
