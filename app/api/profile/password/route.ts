import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";
import { z, ZodError } from "zod";
import bcrypt from "bcryptjs";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password attuale obbligatoria"),
  newPassword: z
    .string()
    .min(8, "La password deve contenere almeno 8 caratteri")
    .regex(/[A-Z]/, "La password deve contenere almeno una lettera maiuscola")
    .regex(/[a-z]/, "La password deve contenere almeno una lettera minuscola")
    .regex(/\d/, "La password deve contenere almeno un numero")
    .regex(/[^A-Za-z0-9]/, "La password deve contenere almeno un carattere speciale"),
});

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return apiError("Non autenticato", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

  let input;
  try { input = changePasswordSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 422 });
    return apiError("Dati non validi", 422);
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
  if (!user) return apiError("Utente non trovato", 404);

  const passwordOk = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordOk) return apiError("Password attuale non corretta", 403);

  const newHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  return NextResponse.json({ message: "Password aggiornata con successo" });
}
