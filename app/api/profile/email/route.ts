import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";
import { z, ZodError } from "zod";
import bcrypt from "bcryptjs";

const changeEmailSchema = z.object({
  newEmail: z.string().email("Email non valida").max(254).transform((e) => e.toLowerCase().trim()),
  currentPassword: z.string().min(1, "Password obbligatoria"),
});

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return apiError("Non autenticato", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

  let input;
  try { input = changeEmailSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 422 });
    return apiError("Dati non validi", 422);
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
  if (!user) return apiError("Utente non trovato", 404);

  const passwordOk = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordOk) return apiError("Password attuale non corretta", 403);

  const existing = await prisma.user.findUnique({ where: { email: input.newEmail } });
  if (existing) return apiError("Email già in uso", 409);

  await prisma.user.update({ where: { id: user.id }, data: { email: input.newEmail } });

  return NextResponse.json({ message: "Email aggiornata con successo" });
}
