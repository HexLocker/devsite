import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";
import { z, ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateAddressSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  line1: z.string().min(1).max(200).optional(),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100).optional(),
  province: z.string().max(10).optional().nullable(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().length(2).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  const { id } = await params;
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== user.userId) return apiError("Indirizzo non trovato", 404);

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

  let input;
  try { input = updateAddressSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 422 });
    return apiError("Dati non validi", 422);
  }

  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.userId }, data: { isDefault: false } });
  }

  const updated = await prisma.address.update({ where: { id }, data: input });
  return NextResponse.json({ address: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  const { id } = await params;
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== user.userId) return apiError("Indirizzo non trovato", 404);

  await prisma.address.delete({ where: { id } });

  // If deleted address was default, promote oldest remaining
  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: user.userId }, orderBy: { createdAt: "asc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return NextResponse.json({ message: "Indirizzo eliminato" });
}
