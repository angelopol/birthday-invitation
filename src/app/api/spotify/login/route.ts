import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? new URL("/api/spotify/callback", req.url).toString();
  const scopes = process.env.SPOTIFY_SCOPES ?? "playlist-modify-public playlist-modify-private";

  if (!clientId) {
    return NextResponse.json({ error: "Falta SPOTIFY_CLIENT_ID" }, { status: 500 });
  }

  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("response_type", "code");
  params.set("redirect_uri", redirectUri);
  params.set("scope", scopes);
  params.set("state", "dashboard");

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
