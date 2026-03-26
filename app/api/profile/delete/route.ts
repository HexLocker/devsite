import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";
import { z, ZodError } from "zod";
import bcrypt from "bcryptjs";
import { clearAuthCookies } from "@/lib/auth";

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Password obbligatoria"),
});

export async function DELETE(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return apiError("Non autenticato", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

  let input;
  try { input = deleteAccountSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 422 });
    return apiError("Dati non validi", 422);
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
  if (!user) return apiError("Utente non trovato", 404);

  const passwordOk = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordOk) return apiError("Password non corretta", 403);

  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) return apiError("Non puoi eliminare l'unico account amministratore", 400);
  }

  await prisma.user.delete({ where: { id: user.id } });

  await clearAuthCookies();

  return NextResponse.json({ message: "Account eliminato" });
}
