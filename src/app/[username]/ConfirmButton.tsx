"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ConfirmButtonProps {
  token: string;
  primaryColor?: string;
}

export default function ConfirmButton({ token, primaryColor = '#3b82f6' }: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    try {
      const res = await fetch(`/api/guests/${token}/confirm`, {
        method: 'POST',
      });
      if (res.ok) {
        setConfirmed(true);
        toast.success('¡Asistencia confirmada!');
      } else {
        toast.error('No se pudo confirmar tu asistencia');
      }
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="pt-4 border-t mt-4 flex flex-col items-center gap-2">
      {confirmed ? (
        <p className="text-green-400 font-medium">¡Asistencia confirmada! 🎉</p>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 10px 25px -8px ${primaryColor}88`,
          }}
        >
          {confirming ? 'Confirmando...' : 'Confirmar asistencia'}
        </button>
      )}
      <p className="text-xs text-slate-400">Tu asistencia quedará registrada con este enlace.</p>
    </div>
  );
}
