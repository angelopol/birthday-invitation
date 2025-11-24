import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type Ordering = { id: number; order: number };

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const username = (session.user as any).username as string | undefined;
  if (!username) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.orderings)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  // Normalize and validate payload items
  const raw = body.orderings as unknown[];
  const orderings: Ordering[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      return NextResponse.json({ error: 'Payload inválido (items)' }, { status: 400 });
    }
    const maybeId = (item as any).id;
    const maybeOrder = (item as any).order;
    const id = Number(maybeId);
    const order = Number(maybeOrder);
    if (!Number.isFinite(id) || !Number.isFinite(order) || id <= 0 || order <= 0) {
      return NextResponse.json({ error: 'Payload inválido (id/order debe ser número positivo)' }, { status: 400 });
    }
    orderings.push({ id, order });
  }

  // Validate ownership: ensure all ids belong to this user
  const ids = orderings.map((o) => o.id);
  const screens = await prisma.invitationScreen.findMany({ where: { id: { in: ids }, birthdayUsername: username }, select: { id: true } });
  if (screens.length !== ids.length) {
    return NextResponse.json({ error: "Al menos una pantalla no pertenece al usuario" }, { status: 403 });
  }

  // Update orders in a transaction for consistency
  // To avoid unique constraint conflicts when swapping orders, perform a two-phase update:
  // 1) move affected rows to a far-away temporary offset (order + offset)
  // 2) set final desired orders
  try {
    // compute a safe offset (larger than any existing order)
    const maxRow = await prisma.invitationScreen.findFirst({ where: { birthdayUsername: username }, orderBy: { order: 'desc' }, select: { order: true } });
    const maxOrder = maxRow?.order ?? 0;
    const offset = maxOrder + orderings.length + 5;

    const phase1 = orderings.map((o) =>
      prisma.invitationScreen.updateMany({ where: { id: o.id, birthdayUsername: username }, data: { order: o.order + offset } })
    );
    const phase2 = orderings.map((o) =>
      prisma.invitationScreen.updateMany({ where: { id: o.id, birthdayUsername: username }, data: { order: o.order } })
    );

    await prisma.$transaction([...phase1, ...phase2]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error al guardar orden de pantallas', err);
    const message = (err instanceof Error && err.message) ? err.message : String(err);
    return NextResponse.json({ error: 'Error al guardar orden', details: message }, { status: 500 });
  }
}
