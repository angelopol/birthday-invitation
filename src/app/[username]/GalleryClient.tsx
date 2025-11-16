"use client";

import { useEffect, useState } from "react";
import UploadMedia from "./UploadMedia";

type GalleryItem = {
  id: number;
  fileName: string;
  fileType: string;
  s3Key: string;
  publicUrl: string;
};

interface GalleryClientProps {
  initialItems: GalleryItem[];
  token?: string;
}

export default function GalleryClient({ initialItems, token }: GalleryClientProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [canRenderGrid, setCanRenderGrid] = useState(false);

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {items.map(item => {
              const isLoading = loadingIds.has(item.id);

              if (item.fileType === "video") {
                return (
                  <div
                    key={item.id}
                    className="relative w-full h-28 rounded-lg border border-slate-800 bg-slate-900 overflow-hidden"
                  >
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                        <div className="w-6 h-6 border-2 border-slate-500 border-t-slate-100 rounded-full animate-spin" />
                      </div>
                    )}
                    <video
                      src={item.publicUrl}
                      className="w-full h-full object-cover"
                      controls
                      onLoadStart={() => handleLoadStart(item.id)}
                      onLoadedData={() => handleLoaded(item.id)}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="relative w-full h-28 rounded-lg border border-slate-800 bg-slate-900 overflow-hidden"
                >
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                      <div className="w-6 h-6 border-2 border-slate-500 border-t-slate-100 rounded-full animate-spin" />
                    </div>
                  )}
                  <img
                    src={item.publicUrl}
                    alt={item.fileName}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onLoad={() => handleLoaded(item.id)}
                    onLoadStart={() => handleLoadStart(item.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
