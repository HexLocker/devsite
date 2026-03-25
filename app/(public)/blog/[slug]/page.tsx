import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ReviewsSection from "@/components/shared/ReviewsSection";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, seoTitle: true, seoDescription: true, excerpt: true, featuredImage: true },
  });
  if (!post) return { title: "Articolo non trovato" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt ?? undefined,
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
      type: "article",
    },
  };
}

export async function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

export const revalidate = 3600; // ISR: rebuild at most every hour

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { author: { select: { name: true, avatar: true } } },
  });

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/blog" className="transition-colors hover:text-zinc-300">Blog</Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400 line-clamp-1">{post.title}</span>
      </nav>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      {/* Tags */}
      {(post.tags as string[]).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(post.tags as string[]).map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="mt-4 mb-8 flex flex-wrap items-center gap-4 border-b border-white/[0.07] pb-6 text-sm text-zinc-500">
        {post.author && (
          <div className="flex items-center gap-2">
            {post.author.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.name ?? "Autore"}
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-xs font-bold text-zinc-300">
                {(post.author.name ?? "A")[0].toUpperCase()}
              </div>
            )}
            <span className="text-zinc-400">{post.author.name ?? "Autore"}</span>
          </div>
        )}
        {post.publishedAt && (
          <time dateTime={post.publishedAt.toISOString()} className="text-zinc-500">
            {post.publishedAt.toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" })}
          </time>
        )}
      </div>

      {/* Content */}
      <div
        className="prose prose-invert prose-zinc max-w-none prose-headings:font-heading prose-a:text-indigo-400 prose-code:text-indigo-300 prose-pre:bg-white/[0.05] prose-pre:border prose-pre:border-white/10"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Back link */}
      <div className="mt-12 border-t border-white/[0.07] pt-6">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300">
          ← Torna al blog
        </Link>
      </div>

      {/* Reviews / Comments */}
      <ReviewsSection postId={post.id} />
    </article>
  );
}
