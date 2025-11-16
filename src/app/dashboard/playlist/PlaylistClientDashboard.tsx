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
   comment?: string | null;
   votesCount?: number;
   guest?: {
     nickname?: string | null;
     name: string;
     avatarUrl?: string | null;
   } | null;
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
  const [stats, setStats] = useState<{
    songsByGuest: { guestName: string; count: number }[];
    topArtists: { artist: string; count: number }[];
    topTracks: { id: number; title: string; artist: string; votesCount: number }[];
  } | null>(null);

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

  const loadStats = async () => {
    try {
      const res = await fetch("/api/playlist/stats");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error al cargar estadísticas de playlist", error);
    }
  };

  useEffect(() => {
    loadTracks();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-100">Playlist de tu fiesta</h1>
            <p className="text-sm text-slate-400">
              Aquí puedes ver todas las canciones que tú y tus invitad@s han propuesto.
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Total canciones</p>
            <p className="text-slate-100 font-medium">{tracks.length}</p>
          </div>
        </div>

        {stats && (
          <div className="mt-3 grid gap-4 sm:grid-cols-3 text-xs text-slate-200">
            <div className="space-y-1">
              <p className="font-semibold text-slate-100">Canciones por invitad@</p>
              {stats.songsByGuest.length === 0 ? (
                <p className="text-slate-500">Aún no hay aportes.</p>
              ) : (
                <ul className="space-y-0.5 max-h-28 overflow-y-auto pr-1">
                  {stats.songsByGuest.map((g) => (
                    <li key={g.guestName} className="flex justify-between gap-2">
                      <span className="truncate">{g.guestName}</span>
                      <span className="text-slate-400">{g.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-100">Top artistas</p>
              {stats.topArtists.length === 0 ? (
                <p className="text-slate-500">Sin datos aún.</p>
              ) : (
                <ul className="space-y-0.5 max-h-28 overflow-y-auto pr-1">
                  {stats.topArtists.map((a) => (
                    <li key={a.artist} className="flex justify-between gap-2">
                      <span className="truncate">{a.artist}</span>
                      <span className="text-slate-400">{a.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-100">Más votadas</p>
              {stats.topTracks.length === 0 ? (
                <p className="text-slate-500">Aún no hay votos.</p>
              ) : (
                <ul className="space-y-0.5 max-h-28 overflow-y-auto pr-1">
                  {stats.topTracks.map((t) => (
                    <li key={t.id} className="flex justify-between gap-2">
                      <span className="truncate">{t.title}</span>
                      <span className="text-slate-400">{t.votesCount}❤</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <SpotifyControls
          hasAccessToken={hasAccessToken}
          playlistId={playlistId}
          onChanged={() => {
            loadTracks();
            loadStats();
          }}
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
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3"
            >
              {track.coverUrl && (
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="h-10 w-10 rounded-md object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-100 truncate">{track.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                    {track.album && (
                      <p className="text-[10px] text-slate-500 truncate">{track.album}</p>
                    )}
                  </div>
                  <div className="text-right text-[10px] text-slate-400 flex-shrink-0">
                    <p>Likes</p>
                    <p className="text-slate-100 font-medium">{track.votesCount ?? 0}</p>
                  </div>
                </div>
                {track.comment && (
                  <p className="mt-0.5 text-[10px] text-sky-300 line-clamp-2">
                    “{track.comment}”
                  </p>
                )}
                {track.guest && (
                  <div className="mt-1 flex items-center gap-1">
                    {track.guest.avatarUrl && (
                      <img
                        src={track.guest.avatarUrl}
                        alt={track.guest.nickname ?? track.guest.name}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    )}
                    <span className="text-[10px] text-slate-500 truncate">
                      Propuesta por {track.guest.nickname ?? track.guest.name}
                    </span>
                  </div>
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
