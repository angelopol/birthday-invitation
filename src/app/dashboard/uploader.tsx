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
      // Prepare file descriptors
      const fileList: Array<{ fileName: string; contentType: string; file: File }> = [];
      for (const f of files) {
        if (f instanceof File) fileList.push({ fileName: f.name, contentType: f.type || 'application/octet-stream', file: f });
      }

      if (!fileList.length) {
        toast.error('No hay archivos válidos');
        return;
      }

      // Request presigned URLs
      const presignRes = await fetch('/api/gallery/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ files: fileList.map(f => ({ fileName: f.fileName, contentType: f.contentType })) }),
      });

      const presignJson = await presignRes.json();
      if (!presignRes.ok) {
        toast.error(presignJson.error || 'No se pudieron obtener URLs de subida');
        return;
      }

      const signed: Array<any> = presignJson.signed || [];
      // Upload each file directly to S3
      const uploadedInfos: Array<{ key: string; fileName: string; fileType: string }> = [];

      for (let i = 0; i < signed.length; i++) {
        const s = signed[i];
        const corresponding = fileList[i];
        try {
          const putRes = await fetch(s.url, {
            method: 'PUT',
            headers: { 'content-type': s.contentType },
            body: corresponding.file,
          });

          if (!putRes.ok) {
            console.error('S3 PUT failed', await putRes.text());
            throw new Error('Error subiendo a S3');
          }

          uploadedInfos.push({ key: s.key, fileName: s.fileName, fileType: s.contentType });
        } catch (e) {
          console.error('Upload failed for', s, e);
          toast.error('Error subiendo archivos a S3');
        }
      }

      if (!uploadedInfos.length) {
        toast.error('No se pudieron subir archivos');
        return;
      }

      // Register uploaded files in our database
      const registerRes = await fetch('/api/gallery/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uploads: uploadedInfos }),
      });

      const registerJson = await registerRes.json();
      if (!registerRes.ok) {
        toast.error(registerJson.error || 'No se pudieron registrar los archivos');
        return;
      }

      toast.success('Archivo(s) subido(s) correctamente');
      const uploaded = (registerJson.uploaded || []).map((item: any) => ({
        ...item,
        publicUrl: item?.s3Key ? `https://${process.env.NEXT_PUBLIC_AWS_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_DEFAULT_REGION}.amazonaws.com/${item.s3Key}` : item.publicUrl,
      }));
      try {
        window.dispatchEvent(new CustomEvent('gallery:uploaded', { detail: uploaded }));
      } catch (e) {
        // ignore
      }
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      toast.error('Error al subir archivos');
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
