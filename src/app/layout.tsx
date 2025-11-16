import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UIChrome from "@/components/UIChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BirthdayInvitation",
  description: "Organiza tu invitación de cumpleaños con galería, playlist y panel para el cumpleañero.",
  icons: {
    icon: "/balloons-icon.svg",
    shortcut: "/balloons-icon.svg",
    apple: "/balloons-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();
  return (
    <html lang="es" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-slate-100 antialiased`}
      >
        <UIChrome>{children}</UIChrome>
        <footer className="border-t border-slate-800 bg-slate-950/90 text-xs text-slate-400">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
            <p className="text-center sm:text-left">
              © {year} · Creado por <span className="font-medium text-slate-200">Angelo Polgrossi</span>
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/angelopol/birthday-invitation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-slate-700/60 bg-slate-900/70 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/angelopolgrossi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-slate-700/60 bg-slate-900/70 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
