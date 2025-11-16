"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data } = useSession();
  const pathname = usePathname();

  // No mostrar en login/registro
  if (pathname?.startsWith("/auth")) {
    return null;
  }

  const username = (data?.user as any)?.username as string | undefined;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-4 sm:px-8 py-3">
      <div className="flex items-center gap-2 text-sm text-slate-300 min-w-0">
        <div className="flex items-center gap-2">
          <Image
            src="/balloons-icon.svg"
            alt="Icono de globos de cumpleaños"
            width={20}
            height={20}
            className="hidden sm:block"
          />
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">BirthdayInvitation</span>
        </div>
        {username && (
          <>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="font-medium">{username}</span>
          </>
        )}
      </div>

      <nav className="flex flex-wrap items-center justify-end gap-2 text-xs sm:text-sm max-w-[60%] sm:max-w-none">
        {username && (
          <>
            <a
              href="/dashboard"
              className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/dashboard/edit-invitation"
              className="hidden sm:inline-flex rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Editar invitación
            </a>
            <a
              href="/dashboard/guests"
              className="hidden sm:inline-flex rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Invitados
            </a>
          </>
        )}
        {username && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="rounded-full border border-red-500/60 px-2.5 py-0.5 text-[10px] sm:text-xs sm:px-3 sm:py-1 text-red-300 hover:bg-red-500/10 transition-colors"
          >
            Cerrar sesión
          </button>
        )}
      </nav>
    </header>
  );
}
