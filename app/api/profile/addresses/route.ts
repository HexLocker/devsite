import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";
import { z, ZodError } from "zod";

const addressSchema = z.object({
  label: z.string().min(1).max(50).default("Casa"),
  firstName: z.string().min(1, "Nome obbligatorio").max(100),
  lastName: z.string().min(1, "Cognome obbligatorio").max(100),
  line1: z.string().min(1, "Indirizzo obbligatorio").max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1, "Città obbligatoria").max(100),
  province: z.string().max(10).optional().nullable(),
  postalCode: z.string().min(1, "CAP obbligatorio").max(20),
  country: z.string().length(2).default("IT"),
  isDefault: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  const addresses = await prisma.address.findMany({
    where: { userId: user.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autenticato", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

  let input;
  try { input = addressSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 422 });
    return apiError("Dati non validi", 422);
  }

  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.userId }, data: { isDefault: false } });
  }

  const count = await prisma.address.count({ where: { userId: user.userId } });
  const isDefault = input.isDefault || count === 0;

  const address = await prisma.address.create({
    data: { ...input, isDefault, userId: user.userId },
  });

  return NextResponse.json({ address }, { status: 201 });
}
