import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SiteNavbar from "@/components/shared/SiteNavbar";
import Footer from "@/components/shared/Footer";
import PixelBlastClient from "@/components/shared/PixelBlastClient";
import FeatureCardsGrid from "@/components/shared/FeatureCardsGrid";
import ReviewsMarquee from "@/components/shared/ReviewsMarquee";
import BlogCard from "@/components/shared/BlogCard";
import ProductCard from "@/components/shared/ProductCard";
import type { NavItem, LogoShape } from "@/lib/nav/types";

async function getSiteSettings() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["site_name", "logo", "nav_items", "logo_shape"] } },
    });
    const map: Record<string, unknown> = {};
    for (const r of rows) map[r.key] = r.value;
    const siteName = (typeof map.site_name === "string" ? map.site_name : "").replace(/^"|"$/g, "") || "DevSite";
    const logoUrl = (typeof map.logo === "string" ? map.logo : "").replace(/^"|"$/g, "");
    const logoShape = ((typeof map.logo_shape === "string" ? map.logo_shape : "square").replace(/^"|"$/g, "")) as LogoShape;
    const navItems: NavItem[] = Array.isArray(map.nav_items) ? (map.nav_items as NavItem[]) : [];
    return { siteName, logoUrl, logoShape, navItems };
  } catch {
    return { siteName: "DevSite", logoUrl: "", logoShape: "square" as LogoShape, navItems: [] as NavItem[] };
  }
}

export const metadata: Metadata = {
  title: "Home",
  description: "Portfolio, blog e negozio online — qualità e creatività italiana.",
};

export default async function HomePage() {
  const t = await getTranslations("home");

  const [siteSettings, latestPosts, featuredProducts, featureCards, approvedReviews, blogPage, shopPage, homePage] = await Promise.all([
    getSiteSettings(),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        id: true, slug: true, title: true, excerpt: true,
        featuredImage: true, publishedAt: true, tags: true,
      },
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED", stock: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true, slug: true, name: true, price: true,
        images: true, stock: true, category: { select: { name: true } },
      },
    }),
    prisma.featureCard.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, rating: true, content: true, authorName: true, createdAt: true },
    }),
    prisma.page.findFirst({ where: { type: "BLOG", status: "PUBLISHED" }, select: { slug: true } }),
    prisma.page.findFirst({ where: { type: "SHOP", status: "PUBLISHED" }, select: { slug: true } }),
    prisma.page.findFirst({ where: { slug: "home" }, select: { content: true } }),
  ]);

  const { siteName, logoUrl, logoShape, navItems } = siteSettings;
  const blogSlug = blogPage?.slug ?? null;
  const shopSlug = shopPage?.slug ?? null;
  const homeContent = homePage?.content?.trim() ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar siteName={siteName} logoUrl={logoUrl} logoShape={logoShape} navItems={navItems} />

      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ backgroundColor: "#09090B" }}>
        {/* CSS grid background */}
        <div className="absolute inset-0 bg-grid-dark" />
        {/* Gradient orbs */}
        <div className="pointer-events-none orb-drift absolute -top-40 -left-32 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="pointer-events-none orb-drift-slow absolute -bottom-48 right-0 h-80 w-80 rounded-full bg-violet-600/10 blur-[100px]" />
        {/* PixelBlast interactive pixel layer — above orbs, behind content */}
        <div className="absolute inset-0" style={{ zIndex: 5 }}>
          <PixelBlastClient
            color="#2A2A7A"
            variant="circle"
            pixelSize={3}
            patternDensity={0.7}
            liquid={true}
            liquidStrength={0.09}
            liquidRadius={1.5}
            enableRipples={true}
            rippleIntensityScale={1.4}
            rippleSpeed={0.3}
            speed={0.28}
            transparent={true}
            edgeFade={0}
            patternScale={2.5}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-32 sm:py-44" style={{ zIndex: 10 }}>
          {/* Eyebrow */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Portfolio · Blog · Negozio
          </div>

          <h1 className="font-heading text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl leading-[1.06]">
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-400 leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {shopSlug && (
              <Link
                href={`/${shopSlug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#09090B] transition-all hover:bg-zinc-100 hover:gap-3 active:scale-[0.98]"
              >
                {t("hero.cta")}
                <ArrowRight size={15} strokeWidth={2.2} />
              </Link>
            )}
            {blogSlug && (
              <Link
                href={`/${blogSlug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98]"
              >
                Leggi il blog
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Home page custom content (editable from admin → Pages → Home) */}
      {homeContent && (
        <section className="py-16" style={{ backgroundColor: "#09090B" }}>
          <div className="mx-auto max-w-4xl px-6">
            <div
              className="prose prose-invert prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: homeContent }}
            />
          </div>
        </section>
      )}

      {/* Feature Cards — powered by DB */}
      <section className="relative overflow-hidden py-16 sm:py-20" style={{ backgroundColor: "#07070F" }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500/70">
              Funzionalità
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Tutto quello di cui hai bisogno
            </h2>
          </div>
          {featureCards.length > 0 ? (
            <FeatureCardsGrid cards={featureCards} enableSpotlight />
          ) : (
            <p className="text-center text-sm text-zinc-600">Nessuna funzionalità configurata.</p>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </section>

      {/* Reviews Marquee */}
      {approvedReviews.length >= 2 && (
        <ReviewsMarquee
          reviews={approvedReviews.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      )}

      {/* Latest Posts */}
      {latestPosts.length > 0 && blogSlug && (
        <section className="py-20" style={{ backgroundColor: "#09090B" }}>
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-500/70">Aggiornamenti recenti</p>
                <h2 className="font-heading text-3xl font-bold text-white">Dal blog</h2>
              </div>
              <Link
                href={`/${blogSlug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Tutti gli articoli
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <BlogCard
                  key={post.id}
                  slug={post.slug}
                  pageSlug={blogSlug}
                  title={post.title}
                  excerpt={post.excerpt}
                  featuredImage={post.featuredImage}
                  publishedAt={post.publishedAt?.toISOString() ?? null}
                  tags={post.tags as string[]}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && shopSlug && (
        <section className="py-20 border-t border-white/[0.06]" style={{ backgroundColor: "#09090B" }}>
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-500/70">In primo piano</p>
                <h2 className="font-heading text-3xl font-bold text-white">Prodotti in evidenza</h2>
              </div>
              <Link
                href={`/${shopSlug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Vai al negozio
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    pageSlug={shopSlug ?? "shop"}
                    name={p.name}
                    price={Number(p.price)}
                    images={p.images as string[]}
                    stock={p.stock}
                    category={p.category?.name}
                  />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
