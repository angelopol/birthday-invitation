"use client";

import { useEffect, useState } from "react";
import UploadMedia from "./UploadMedia";

type GalleryItem = {
  id: number;
  fileName: string;
  fileType: string;
  s3Key: string;
  publicUrl: string;
  guestName?: string | null;
};

interface GalleryClientProps {
  initialItems: GalleryItem[];
  token?: string;
}

export default function GalleryClient({ initialItems, token }: GalleryClientProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [canRenderGrid, setCanRenderGrid] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setCanRenderGrid(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  const handleUploaded = (uploaded: GalleryItem[]) => {
    if (!uploaded || !uploaded.length) return;
    const normalized = uploaded.map(item => ({
      ...item,
      publicUrl: `/api/gallery/file/${item.id}`,
    }));

    setItems(prev => [...normalized, ...prev]);
  };

  const handleLoadStart = (id: number) => {
    setLoadingIds(prev => new Set(prev).add(id));
  };

  const handleLoaded = (id: number) => {
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleOpenLightbox = (item: GalleryItem) => {
    setLightboxItem(item);
  };

  const handleCloseLightbox = () => {
    setLightboxItem(null);
  };

  const handleDownload = (item: GalleryItem) => {
    const link = document.createElement("a");
    link.href = item.publicUrl;
    link.download = item.fileName || "foto-galeria";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Eliminación deshabilitada de momento: la API de borrado sigue existiendo,
  // pero la acción desde el lightbox se ha retirado para evitar errores.

  return (
    <div className="pt-6 border-t border-slate-800 space-y-3">
      {token && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">Sube tus recuerdos</h2>
          <UploadMedia token={token} onUploaded={handleUploaded} />
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-200">Galería de la fiesta</h2>
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aún no hay fotos ni videos en la galería. ¡Sé el primero en subir tus recuerdos de la fiesta!
          </p>
        ) : !canRenderGrid ? (
          <p className="text-xs text-slate-500">Cargando galería...</p>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-2 [column-fill:_balance]">
            {items.map(item => {
              const isLoading = loadingIds.has(item.id);

              if (item.fileType === "video") {
                return (
                  <div
                    key={item.id}
                    className="mb-2 break-inside-avoid rounded-lg border border-slate-800 bg-slate-900 overflow-hidden"
                  >
                    <div className="relative w-full">
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10">
                          <div className="w-6 h-6 border-2 border-slate-500 border-top-slate-100 rounded-full animate-spin" />
                        </div>
                      )}
                      <video
                        src={item.publicUrl}
                        className="w-full h-auto object-cover"
                        controls
                        onLoadStart={() => handleLoadStart(item.id)}
                        onLoadedData={() => handleLoaded(item.id)}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="mb-2 break-inside-avoid rounded-lg border border-slate-800 bg-slate-900 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenLightbox(item)}
                    className="relative block w-full cursor-zoom-in focus:outline-none"
                  >
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10">
                        <div className="w-6 h-6 border-2 border-slate-500 border-t-slate-100 rounded-full animate-spin" />
                      </div>
                    )}
                    <img
                      src={item.publicUrl}
                      alt={item.fileName}
                      loading="lazy"
                      className="block w-full h-full object-cover"
                      onLoad={() => handleLoaded(item.id)}
                      onLoadStart={() => handleLoadStart(item.id)}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {lightboxItem && lightboxItem.fileType !== "video" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={handleCloseLightbox}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl" 
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-black/70 px-3 py-1 text-[11px] text-slate-100 border border-slate-600 hover:bg-black/90"
                onClick={() => handleDownload(lightboxItem)}
              >
                Descargar
              </button>
              <button
                type="button"
                className="rounded-full bg-black/70 px-3 py-1 text-[11px] text-slate-100 border border-slate-600 hover:bg-black/90"
                onClick={handleCloseLightbox}
              >
                Cerrar
              </button>
            </div>
            <img
              src={lightboxItem.publicUrl}
              alt={lightboxItem.fileName}
              className="max-h-[80vh] w-auto rounded-lg shadow-2xl border border-slate-700"
            />
            {lightboxItem.guestName && (
              <p className="mt-2 text-xs text-slate-300 text-right">
                Subida por <span className="font-medium text-slate-100">{lightboxItem.guestName}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
