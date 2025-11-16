import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import PlaylistClientDashboard from "./PlaylistClientDashboard";

export const metadata = {
  title: "Playlist de la fiesta — BirthdayInvitation",
};

export default async function PlaylistDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const username = (session.user as any).username as string | undefined;

  if (!username) {
    redirect("/auth/login");
  }

  const birthdayPerson = await prisma.birthdayPeople.findUnique({ where: { username } });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <PlaylistClientDashboard
          username={username}
          hasAccessToken={!!birthdayPerson?.spotifyAccessToken}
          playlistId={birthdayPerson?.spotifyPlaylistId ?? undefined}
        />
      </div>
    </main>
  );
}
