import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  const { id } = await params;
  const card = await prisma.savedCard.findUnique({ where: { id } });
  if (!card || card.userId !== user.userId) return apiError("Carta non trovata", 404);

  await prisma.savedCard.delete({ where: { id } });

  if (card.isDefault) {
    const next = await prisma.savedCard.findFirst({ where: { userId: user.userId }, orderBy: { createdAt: "asc" } });
    if (next) await prisma.savedCard.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return NextResponse.json({ message: "Carta rimossa" });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  const { id } = await params;
  const card = await prisma.savedCard.findUnique({ where: { id } });
  if (!card || card.userId !== user.userId) return apiError("Carta non trovata", 404);

  await prisma.savedCard.updateMany({ where: { userId: user.userId }, data: { isDefault: false } });
  await prisma.savedCard.update({ where: { id }, data: { isDefault: true } });

  return NextResponse.json({ message: "Carta predefinita aggiornata" });
}
