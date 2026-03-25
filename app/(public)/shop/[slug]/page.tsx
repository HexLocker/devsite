import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Truck, ShieldCheck, RefreshCw, ChevronRight } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import ReviewsSection from "@/components/shared/ReviewsSection";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { name: true, seoTitle: true, seoDescription: true, images: true },
  });
  if (!product) return { title: "Prodotto non trovato" };
  const images = product.images as string[];
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? undefined,
    openGraph: {
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? undefined,
      images: images[0] ? [{ url: images[0] }] : [],
      type: "website",
    },
  };
}

export async function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

export const revalidate = 3600;

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { category: true },
  });

  if (!product) notFound();

  const images = product.images as string[];
  const inStock = product.stock > 0;
  const price = Number(product.price);

  // Related products
  const related = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: product.categoryId,
      NOT: { id: product.id },
    },
    take: 4,
    select: { id: true, slug: true, name: true, price: true, images: true, stock: true },
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-xs text-zinc-500">
          <Link href="/shop" className="hover:text-zinc-300 transition-colors">Negozio</Link>
          {product.category && (
            <>
              <ChevronRight size={12} strokeWidth={2} />
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-zinc-300 transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} strokeWidth={2} />
          <span className="text-zinc-300 font-medium">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {images[0] ? (
                <Image
                  src={images[0]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-700">
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(1).map((img, i) => (
                  <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/30 cursor-pointer transition-colors">
                    <Image src={img} alt={`${product.name} ${i + 2}`} fill sizes="80px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            {/* Category + title */}
            <div>
              {product.category && (
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="font-heading text-3xl font-extrabold leading-tight text-white lg:text-4xl">
                {product.name}
              </h1>
            </div>

            {/* Price + availability */}
            <div className="flex items-center gap-4">
              <span className="font-heading text-3xl font-black tracking-tight text-white">
                {price.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
              </span>
              {inStock ? (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Disponibile · {product.stock} rimasti
                </span>
              ) : (
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                  Esaurito
                </span>
              )}
            </div>

            {/* CTA */}
            <AddToCartButton
              productId={product.id}
              slug={product.slug}
              name={product.name}
              price={price}
              image={images[0]}
              inStock={inStock}
            />

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { Icon: Truck, label: "Spedizione gratuita", sub: "Ordini sopra 50 €" },
                { Icon: ShieldCheck, label: "Pagamento sicuro", sub: "SSL 256-bit" },
                { Icon: RefreshCw, label: "Reso facile", sub: "Entro 30 giorni" },
              ].map(({ Icon, label, sub }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5 text-center">
                  <Icon size={18} strokeWidth={1.6} className="mx-auto mb-1.5 text-zinc-400" />
                  <p className="text-[11px] font-semibold text-white leading-tight">{label}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">{sub}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-white/[0.07] pt-6">
                <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-zinc-500">Descrizione</h2>
                <div
                  className="prose prose-sm prose-invert max-w-none text-zinc-400 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection productId={product.id} />

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-white/[0.07] pt-12">
            <h2 className="mb-8 font-heading text-xl font-bold text-white">Prodotti correlati</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/shop/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07] transition-all duration-200"
                >
                  <div className="relative aspect-square bg-white/[0.03]">
                    {(p.images as string[])[0] ? (
                      <Image
                        src={(p.images as string[])[0]}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-700">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">{p.name}</p>
                    <p className="mt-2 font-heading font-bold text-white">
                      {Number(p.price).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );

}
