"use client";

import { useEffect, useState } from "react";
import UploadMedia from "./UploadMedia";

export type GalleryItem = {
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
  className?: string;
  onItemsAdded?: (items: GalleryItem[]) => void;
  allowDelete?: boolean;
}

export default function GalleryClient({ initialItems, token, className, onItemsAdded, allowDelete }: GalleryClientProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [canRenderGrid, setCanRenderGrid] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const id = window.setTimeout(() => setCanRenderGrid(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    // iOS Safari and iOS WebViews
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
  }, []);

  // Listen for global uploads (from dashboard uploader) and prepend them
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail as GalleryItem[] | undefined;
        if (!detail || !detail.length) return;
        const normalized = detail;
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const fresh = normalized.filter(i => !existingIds.has(i.id));
          return [...fresh, ...prev];
        });
      } catch {
        // ignore malformed events
      }
    };

    window.addEventListener('gallery:uploaded', handler as EventListener);
    return () => window.removeEventListener('gallery:uploaded', handler as EventListener);
  }, []);

  const handleUploaded = (uploaded: GalleryItem[]) => {
    if (!uploaded || !uploaded.length) return;
    const normalized = uploaded;

    setItems(prev => [...normalized, ...prev]);
    onItemsAdded?.(normalized);
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
    link.download = item.fileName || (item.fileType === 'video' ? 'video-galeria' : 'foto-galeria');
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadWithFallback = (item: GalleryItem) => {
    try {
      handleDownload(item);
    } catch {
      // iOS Safari a veces ignora `download`; fallback a abrir en nueva pestaña.
      window.open(item.publicUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!allowDelete) return;

    const ok = window.confirm("¿Eliminar esta foto de la galería? Esta acción no se puede deshacer.");
    if (!ok) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/gallery/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data?.error || 'No se pudo eliminar');
      }

      setItems(prev => prev.filter(i => i.id !== item.id));
      setLightboxItem(null);
    } catch (e: any) {
      alert(e?.message || 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const containerClass = `space-y-3 ${className ?? "pt-6 border-t border-slate-800"}`;

  return (
    <div className={containerClass}>
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
                      {isIOS ? (
                        <iframe
                          title={item.fileName}
                          className="w-full"
                          style={{ aspectRatio: '9 / 16', border: 0 }}
                          // Video.js HTTP stream fallback via native <video> in iframe is isolated from parent CSS quirks.
                          src={`/api/gallery/player?src=${encodeURIComponent(item.publicUrl)}`}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          onLoad={() => handleLoaded(item.id)}
                        />
                      ) : (
                        <video
                          className="w-full h-auto object-cover"
                          controls
                          playsInline
                          preload="metadata"
                          controlsList="nodownload"
                          onLoadStart={() => handleLoadStart(item.id)}
                          onLoadedData={() => handleLoaded(item.id)}
                        >
                          <source src={item.publicUrl} />
                        </video>
                      )}
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
              {allowDelete && (
                <button
                  type="button"
                  aria-label="Eliminar imagen"
                  disabled={deleting}
                  className="rounded-full px-3 py-1 text-[11px] font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
                  style={{
                    background: 'rgba(239, 68, 68, 0.16)',
                    color: '#fecaca',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    ['--tw-ring-color' as any]: 'rgba(239, 68, 68, 0.9)',
                  }}
                  onClick={() => lightboxItem && handleDelete(lightboxItem)}
                >
                  {deleting ? 'Eliminando…' : 'Eliminar'}
                </button>
              )}
              <button
                type="button"
                aria-label="Descargar imagen"
                className="rounded-full px-3 py-1 text-[11px] font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  background: 'var(--theme-primary, #38bdf8)',
                  color: 'var(--theme-button-text, #ffffff)',
                  border: '1px solid var(--theme-border, rgba(100,100,100,0.25))',
                  // ensure focus ring uses theme primary when available
                  ['--tw-ring-color' as any]: 'var(--theme-primary, #38bdf8)',
                }}
                onClick={() => handleDownload(lightboxItem)}
              >
                Descargar
              </button>
              <button
                type="button"
                aria-label="Cerrar vista previa"
                className="rounded-full px-3 py-1 text-[11px] font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  // Use elevated surface + theme text so the button contrasts with modal background
                  background: 'var(--theme-surface-elevated, rgba(255,255,255,0.04))',
                  color: 'var(--theme-text, #ffffff)',
                  border: '1px solid var(--theme-border, rgba(100,100,100,0.25))',
                  ['--tw-ring-color' as any]: 'var(--theme-primary, #38bdf8)',
                }}
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
              <div className="mt-2 flex justify-end">
                <span
                  className="inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-medium"
                  style={{
                    background: 'var(--theme-surface-elevated, rgba(0,0,0,0.65))',
                    border: '1px solid var(--theme-border, rgba(255,255,255,0.18))',
                    color: 'var(--theme-text, #ffffff)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.55)',
                  }}
                >
                  <span className="text-[11px] opacity-90">Subida por</span>
                  <span
                    className="font-semibold text-sm"
                    style={{
                      color: 'var(--theme-primary, #38bdf8)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.65)',
                    }}
                  >
                    {lightboxItem.guestName}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
