import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { exchangeSpotifyAuthCode } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const username = (session.user as any).username as string | undefined;

  if (!username) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/playlist?error=spotify_no_code", req.url));
  }

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? new URL("/api/spotify/callback", req.url).toString();

  try {
    const tokenData = await exchangeSpotifyAuthCode(code, redirectUri);

    const accessToken = tokenData.access_token as string;
    const refreshToken = tokenData.refresh_token as string | undefined;
    const expiresIn = tokenData.expires_in as number;

    const meRes = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meRes.ok) {
      throw new Error("No se pudo obtener el usuario de Spotify");
    }

    const me = await meRes.json();

    const previous = await prisma.birthdayPeople.findUnique({ where: { username } });

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const changingAccount = previous?.spotifyUserId && previous.spotifyUserId !== me.id;

    await prisma.birthdayPeople.update({
      where: { username },
      data: {
        spotifyUserId: me.id,
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
        spotifyTokenExpiresAt: expiresAt,
        // si cambia de cuenta, olvidamos siempre la playlist anterior
        spotifyPlaylistId: changingAccount ? null : previous?.spotifyPlaylistId ?? null,
      },
    });

    return NextResponse.redirect(new URL("/dashboard/playlist?spotify=connected", req.url));
  } catch (error) {
    console.error("Error en callback de Spotify", error);
    return NextResponse.redirect(new URL("/dashboard/playlist?error=spotify_callback", req.url));
  }
}
