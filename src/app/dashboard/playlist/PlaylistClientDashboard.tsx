"use client";

import { useEffect, useState } from "react";
import SpotifyControls from "./SpotifyControls";

interface Track {
  id: number;
  spotifyTrackId: string;
  title: string;
  artist: string;
  album?: string | null;
  coverUrl?: string | null;
  previewUrl?: string | null;
}

interface PlaylistClientDashboardProps {
  username: string;
  hasAccessToken: boolean;
  playlistId?: string | null;
}

export default function PlaylistClientDashboard({
  username,
  hasAccessToken,
  playlistId,
}: PlaylistClientDashboardProps) {
  const [tracks, setTracks] = useState<Track[]>([]);

  const loadTracks = async () => {
    try {
      const res = await fetch(`/api/playlist?username=${encodeURIComponent(username)}`);
      if (!res.ok) return;
      const data = await res.json();
      setTracks(data.tracks ?? []);
    } catch (error) {
      console.error("Error al cargar playlist del dashboard", error);
    }
  };

  useEffect(() => {
    loadTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-100">Playlist de tu fiesta</h1>
        <p className="text-sm text-slate-400">
          Aquí puedes ver todas las canciones que tú y tus invitad@s han propuesto.
        </p>

        <SpotifyControls
          hasAccessToken={hasAccessToken}
          playlistId={playlistId}
          onChanged={loadTracks}
        />
      </div>

      {tracks.length === 0 ? (
        <p className="text-sm text-slate-500">
          Todavía no hay canciones en la playlist. Pide a tus invitad@s que usen su enlace para proponer temas.
        </p>
      ) : (
        <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {tracks.map((track) => (
            <li
              key={track.id}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"
            >
              {track.coverUrl && (
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="h-10 w-10 rounded-md object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-100 truncate">{track.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                {track.album && (
                  <p className="text-[10px] text-slate-500 truncate">{track.album}</p>
                )}
              </div>
              {track.previewUrl && (
                <audio
                  controls
                  className="h-8 w-28 sm:w-36"
                  src={track.previewUrl}
                />
              )}
              <form
                action="/api/playlist/delete"
                method="post"
                className="ml-2"
              >
                <input type="hidden" name="id" value={track.id} />
                <button
                  type="submit"
                  className="text-[11px] text-red-400 hover:text-red-300 underline-offset-2 hover:underline"
                >
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
