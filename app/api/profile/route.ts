import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";
import { z, ZodError } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-().]{6,20}$/, "Numero di telefono non valido")
    .optional()
    .nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  const profile = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, email: true, name: true, avatar: true, phone: true, role: true, createdAt: true },
  });
  if (!profile) return apiError("Utente non trovato", 404);

  return NextResponse.json({ user: profile });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

  let input;
  try { input = updateProfileSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 422 });
    return apiError("Dati non validi", 422);
  }

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: { name: input.name, phone: input.phone },
    select: { id: true, email: true, name: true, avatar: true, phone: true, role: true },
  });

  return NextResponse.json({ user: updated });
}
