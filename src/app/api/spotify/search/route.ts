import { NextRequest, NextResponse } from "next/server";
import { searchTracks } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  try {
    const tracks = await searchTracks(q);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Error en /api/spotify/search", error);
    return NextResponse.json({ tracks: [], error: "Error al buscar en Spotify" }, { status: 500 });
  }
}
