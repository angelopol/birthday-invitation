"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
    <header className="global-navbar border-b backdrop-blur flex items-center justify-between px-4 sm:px-8 py-3">
      <div className="flex items-center gap-2 text-sm min-w-0 text-theme-base">
        <div className="flex items-center gap-2">
          <Image
            src="/balloons-icon.svg"
            alt="Icono de globos de cumpleaños"
            width={20}
            height={20}
            className="hidden sm:block"
          />
          <span
            className="text-xs uppercase tracking-[0.25em] text-theme-muted"
          >
            BirthdayInvitation
          </span>
        </div>
        {username && (
          <>
            <span className="h-1 w-1 rounded-full bg-theme-muted" />
            <span className="font-medium">{username}</span>
          </>
        )}
      </div>

      <nav className="flex flex-wrap items-center justify-end gap-2 text-xs sm:text-sm max-w-[60%] sm:max-w-none">
        {username && (
          <>
            <Link
              href="/dashboard"
              className="nav-link"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/edit-invitation"
              className="nav-link hidden sm:inline-flex"
            >
              Editar invitación
            </Link>
            <Link
              href="/dashboard/guests"
              className="nav-link hidden sm:inline-flex"
            >
              Invitados
            </Link>
          </>
        )}
        {username && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="signout-button"
          >
            Cerrar sesión
          </button>
        )}
        {!username && (
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition"
            style={{
              background: 'var(--theme-primary, #38bdf8)',
              color: 'var(--theme-button-text, #0f172a)',
            }}
          >
            Crear invitación
          </Link>
        )}
      </nav>
    </header>
  );
}
