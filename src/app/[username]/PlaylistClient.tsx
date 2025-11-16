"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface PlaylistClientProps {
  username: string;
  invitation?: string;
  spotifyPlaylistId?: string | null;
}

interface ApiTrack {
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

interface SpotifyTrackResult {
  spotifyTrackId: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  previewUrl?: string;
  comment?: string;
}

export default function PlaylistClient({ username, invitation, spotifyPlaylistId }: PlaylistClientProps) {
  const [tracks, setTracks] = useState<ApiTrack[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrackResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [commentByTrack, setCommentByTrack] = useState<Record<string, string>>({});
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch(`/api/playlist?username=${encodeURIComponent(username)}`);
        if (!res.ok) return;
        const data = await res.json();
        setTracks(data.tracks ?? []);
      } catch (error) {
        console.error("Error al cargar playlist", error);
      }
    };

    fetchTracks();
  }, [username]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoadingSearch(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        toast.error("No se pudo buscar en Spotify");
        return;
      }
      const data = await res.json();
      setSearchResults(data.tracks ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Error al buscar canciones");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAddTrack = async (track: SpotifyTrackResult) => {
    if (!invitation) {
      toast.error("Usa tu enlace personal de invitado para agregar canciones.");
      return;
    }

    setAddingId(track.spotifyTrackId);
    try {
      const res = await fetch(`/api/playlist?invitation=${encodeURIComponent(invitation)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...track,
          comment: commentByTrack[track.spotifyTrackId]?.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "No se pudo agregar la canción");
        return;
      }

      setTracks((prev) => [...prev, data.track]);
      toast.success("Canción agregada a la playlist");
    } catch (error) {
      console.error(error);
      toast.error("Error al agregar la canción");
    } finally {
      setAddingId(null);
      setCommentByTrack((prev) => {
        const copy = { ...prev };
        delete copy[track.spotifyTrackId];
        return copy;
      });
    }
  };

  const handleDeleteTrack = async (trackId: number) => {
    if (!invitation) {
      toast.error("Usa tu enlace personal de invitado para gestionar tus canciones.");
      return;
    }

    try {
      const res = await fetch(`/api/playlist/delete-guest?invitation=${encodeURIComponent(invitation)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trackId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "No se pudo eliminar la canción");
        return;
      }

      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      toast.success("Canción eliminada de la playlist");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar la canción");
    }
  };

  const toggleLike = async (track: ApiTrack) => {
    if (!invitation) {
      toast.error("Usa tu enlace personal de invitado para votar canciones.");
      return;
    }

    const isLiked = likedIds.has(track.id);
    try {
      const res = await fetch(`/api/playlist/vote?invitation=${encodeURIComponent(invitation)}` ,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, like: !isLiked }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo registrar el voto");
        return;
      }

      setTracks((prev) =>
        prev.map((t) =>
          t.id === track.id ? { ...t, votesCount: data.votesCount } : t
        )
      );

      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.delete(track.id);
        } else {
          next.add(track.id);
        }
        return next;
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al votar la canción");
    }
  };

  return (
    <section className="mt-6 space-y-4">
      {tracks.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-200">Lo que se viene</p>
            <p className="text-[10px] text-slate-500">Top canciones más votadas</p>
          </div>
          <ol className="space-y-1 text-[11px] text-slate-200">
            {tracks.slice(0, 5).map((track, index) => (
              <li key={track.id} className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[9px] text-slate-300">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    {track.title} <span className="text-slate-400">· {track.artist}</span>
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {(track.votesCount ?? 0)} ❤
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold text-slate-100">Playlist de la fiesta</h2>
          <p className="text-[11px] text-slate-400">
            Busca canciones en Spotify y proponlas para que suenen en la fiesta.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-[11px] text-slate-500">
            Cada invitad@ puede proponer hasta 3 canciones.
          </p>
          {spotifyPlaylistId && (
            <a
              href={`https://open.spotify.com/playlist/${spotifyPlaylistId}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-green-400 underline-offset-2 hover:underline"
            >
              Ver en Spotify
            </a>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca una canción en Spotify"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={loadingSearch}
          className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          {loadingSearch ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Resultados</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {searchResults.map((track) => (
              <div
                key={track.spotifyTrackId}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
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
                  <input
                    type="text"
                    value={commentByTrack[track.spotifyTrackId] ?? ""}
                    onChange={(e) =>
                      setCommentByTrack((prev) => ({
                        ...prev,
                        [track.spotifyTrackId]: e.target.value,
                      }))
                    }
                    placeholder="Dedicatoria (opcional)"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-[10px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    maxLength={280}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTrack(track)}
                  disabled={addingId === track.spotifyTrackId}
                  className="rounded-full border border-sky-500 px-3 py-1 text-[11px] font-medium text-sky-300 hover:bg-sky-500/10 disabled:opacity-60"
                >
                  {addingId === track.spotifyTrackId ? "Agregando..." : "Agregar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-slate-400">Playlist actual</p>
        {tracks.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aún no hay canciones en la playlist. ¡Sé de l@s primer@s en proponer!
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {tracks.map((track) => (
              <li
                key={track.id}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
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
                <div className="flex flex-col items-end gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => toggleLike(track)}
                    className={`text-[11px] px-2 py-1 rounded-full border ${
                      likedIds.has(track.id)
                        ? "border-pink-400 text-pink-300 bg-pink-500/10"
                        : "border-slate-600 text-slate-300 hover:border-pink-400 hover:text-pink-300"
                    }`}
                  >
                    {likedIds.has(track.id) ? "♥ Me gusta" : "♡ Me gusta"}
                  </button>
                  <span className="text-[10px] text-slate-500">
                    {(track.votesCount ?? 0) === 1
                      ? "1 voto"
                      : `${track.votesCount ?? 0} votos`}
                  </span>
                </div>
                {invitation && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTrack(track.id)}
                    className="ml-2 text-[11px] text-red-400 hover:text-red-300 underline-offset-2 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
