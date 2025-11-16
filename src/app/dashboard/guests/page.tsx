"use client";

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

interface Guest {
  token: string;
  name: string;
  confirmated: boolean;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  async function loadGuests() {
    setLoading(true);
    const res = await fetch('/api/guests');
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Error al cargar invitados');
      setLoading(false);
      return;
    }
    setGuests(data.guests ?? []);
    setUsername(data.username ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadGuests();
  }, []);

  async function handleCreateGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      toast.error(data.error || 'Error al crear invitado');
      return;
    }

    setName('');
    setGuests(prev => [...prev, data.guest]);
    if (data.username) {
      setUsername(data.username);
    }
    toast.success('Invitado creado correctamente');
  }

  async function handleReset() {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se eliminarán todos los invitados y sus confirmaciones.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#1f2937',
      background: '#020617',
      color: '#e5e7eb',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;
    setResetting(true);

    const res = await fetch('/api/guests', {
      method: 'DELETE',
    });

    const data = await res.json();
    setResetting(false);

    if (!res.ok) {
      toast.error(data.error || 'Error al resetear invitados');
      return;
    }

    setGuests([]);
    toast.success('Todos los invitados han sido eliminados');
  }

  async function handleCopyLink(token: string) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${username}?invitation=${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  }

  async function handleShareLink(token: string) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${username}?invitation=${token}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Invitación a la fiesta',
          text: 'Te comparto tu enlace de invitación:',
          url,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado al portapapeles');
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Invitados</h1>
          <p className="text-sm text-slate-400">
            Crea invitados, copia su enlace de invitación y ve quién ha confirmado.
          </p>
        </div>

        <form onSubmit={handleCreateGuest} className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre del invitado"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-60"
          >
            {creating ? 'Creando...' : 'Agregar'}
          </button>
        </form>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-sm text-red-400 underline disabled:opacity-60"
        >
          {resetting ? 'Reseteando...' : 'Resetear todos los invitados'}
        </button>

        {loading ? (
          <p className="text-sm text-slate-400">Cargando invitados...</p>
        ) : guests.length === 0 ? (
          <p className="text-sm text-slate-400">Aún no hay invitados.</p>
        ) : (
          <table className="w-full text-sm border-t border-slate-800 mt-2">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Nombre</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {guests.map(guest => (
                <tr key={guest.token} className="border-t border-slate-800">
                  <td className="py-2">{guest.name}</td>
                  <td className="py-2">
                    {guest.confirmated ? (
                      <span className="text-green-400 font-medium">Confirmado</span>
                    ) : (
                      <span className="text-yellow-400">Pendiente</span>
                    )}
                  </td>
                  <td className="py-2 space-x-2">
                    <button
                      onClick={() => handleCopyLink(guest.token)}
                      className="text-blue-400 hover:text-blue-300 underline text-xs"
                    >
                      Copiar enlace
                    </button>
                    <button
                      onClick={() => handleShareLink(guest.token)}
                      className="text-emerald-400 hover:text-emerald-300 underline text-xs"
                    >
                      Compartir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && guests.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">
            Confirmados: {guests.filter(g => g.confirmated).length} / {guests.length}
          </p>
        )}
      </div>
    </main>
  );
}
