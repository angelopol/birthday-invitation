"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface SpotifyControlsProps {
  hasAccessToken: boolean;
  playlistId?: string | null;
  onChanged?: () => void;
}

export default function SpotifyControls({ hasAccessToken, playlistId, onChanged }: SpotifyControlsProps) {
  const [syncLoading, setSyncLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConnect = () => {
    window.location.href = "/api/spotify/login";
  };

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch("/api/spotify/sync-playlist", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al sincronizar con Spotify");
        return;
      }

      toast.success("Playlist sincronizada en Spotify");
      onChanged?.();
    } catch (error) {
      console.error(error);
      toast.error("Error al sincronizar con Spotify");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleImport = async () => {
    setImportLoading(true);
    try {
      const res = await fetch("/api/spotify/import-playlist", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al importar desde Spotify");
        return;
      }

      if (data.imported > 0) {
        toast.success(`Importadas ${data.imported} canciones nuevas desde Spotify`);
        onChanged?.();
      } else {
        toast("No había canciones nuevas que importar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al importar desde Spotify");
    } finally {
      setImportLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlistId) {
      toast.error("No hay playlist en Spotify para borrar");
      return;
    }

    if (!confirm("¿Seguro que quieres borrar la playlist de Spotify?")) return;

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/spotify/delete-playlist", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al borrar la playlist de Spotify");
        return;
      }

      toast.success("Playlist de Spotify borrada");
      onChanged?.();
    } catch (error) {
      console.error(error);
      toast.error("Error al borrar la playlist de Spotify");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleConnect}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
        >
          {hasAccessToken ? "Reconectar Spotify" : "Conectar con Spotify"}
        </button>

        {hasAccessToken && playlistId && (
          <a
            href={`https://open.spotify.com/playlist/${playlistId}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-sky-300 underline-offset-2 hover:underline"
          >
            Ver playlist en Spotify
          </a>
        )}
      </div>

      {hasAccessToken && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncLoading}
            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {syncLoading ? "Sincronizando..." : "Sincronizar ahora con Spotify"}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importLoading}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {importLoading ? "Importando..." : "Importar desde Spotify"}
          </button>
          {playlistId && (
            <button
              type="button"
              onClick={handleDeletePlaylist}
              disabled={deleteLoading}
              className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
            >
              {deleteLoading ? "Borrando..." : "Borrar playlist en Spotify"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
