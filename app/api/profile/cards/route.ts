import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";
import { z, ZodError } from "zod";

const addCardSchema = z.object({
  brand: z.enum(["Visa", "Mastercard", "Amex", "Other"]),
  last4: z.string().length(4).regex(/^\d{4}$/),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 20),
  holderName: z.string().min(1, "Nome intestatario obbligatorio").max(100),
  isDefault: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  const cards = await prisma.savedCard.findMany({
    where: { userId: user.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: { id: true, brand: true, last4: true, expiryMonth: true, expiryYear: true, holderName: true, isDefault: true },
  });

  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  const count = await prisma.savedCard.count({ where: { userId: user.userId } });
  if (count >= 5) return apiError("Puoi salvare al massimo 5 carte", 400);

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

  let input;
  try { input = addCardSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 422 });
    return apiError("Dati non validi", 422);
  }

  if (input.isDefault) {
    await prisma.savedCard.updateMany({ where: { userId: user.userId }, data: { isDefault: false } });
  }

  const isDefault = input.isDefault || count === 0;

  const card = await prisma.savedCard.create({
    data: { ...input, isDefault, userId: user.userId },
    select: { id: true, brand: true, last4: true, expiryMonth: true, expiryYear: true, holderName: true, isDefault: true },
  });

  return NextResponse.json({ card }, { status: 201 });
}
