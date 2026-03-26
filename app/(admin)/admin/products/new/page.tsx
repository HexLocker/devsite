import ProductEditor from "@/components/admin/editor/ProductEditor";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Nuovo prodotto — Admin" };

export default async function NewProductPage() {
  const shopPage = await prisma.page.findFirst({
    where: { type: "SHOP", status: "PUBLISHED" },
    select: { id: true },
  });

  if (!shopPage) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Aggiungi nuovo prodotto</h1>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">Nessuna pagina Negozio trovata</p>
          <p className="text-sm text-amber-700">
            Per aggiungere prodotti devi prima creare una pagina di tipo <strong>Negozio</strong>.
            Una volta creata e pubblicata, potrai gestire il catalogo.
          </p>
          <Link
            href="/admin/pages/new?type=SHOP"
            className="mt-3 inline-block rounded bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
          >
            Crea pagina Negozio →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Aggiungi nuovo prodotto</h1>
      <ProductEditor />
    </div>
  );
}
