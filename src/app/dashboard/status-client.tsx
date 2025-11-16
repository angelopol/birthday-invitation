"use client";

import { useEffect, useState } from "react";

interface StatusData {
  guests: {
    total: number;
    confirmed: number;
    confirmedPercentage: number;
  };
  photosCount: number;
  tracksCount: number;
}

export default function DashboardStatusClient() {
  const [data, setData] = useState<StatusData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/dashboard/status");
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Error al cargar estado de dashboard", e);
      }
    };

    load();
  }, []);

  if (!data) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-200 mt-4">
      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 space-y-1">
        <p className="font-semibold text-slate-100">Invitados</p>
        <p className="text-slate-300">
          Confirmados: {data.guests.confirmed}/{data.guests.total}
        </p>
        <p className="text-slate-400">
          {data.guests.confirmedPercentage}% confirmados
        </p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 space-y-1">
        <p className="font-semibold text-slate-100">Galería</p>
        <p className="text-slate-300">Fotos/Videos: {data.photosCount}</p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 space-y-1">
        <p className="font-semibold text-slate-100">Playlist</p>
        <p className="text-slate-300">Canciones: {data.tracksCount}</p>
      </div>
    </div>
  );
}
