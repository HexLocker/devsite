"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PublishBox from "@/components/admin/editor/PublishBox";
import SlugEditor, { titleToSlug } from "@/components/admin/editor/SlugEditor";
import TagInput from "@/components/admin/editor/TagInput";
import FeaturedImage from "@/components/admin/editor/FeaturedImage";
import ExcerptBox from "@/components/admin/editor/ExcerptBox";
import SeoBox from "@/components/admin/editor/SeoBox";
import CategoryPicker from "@/components/admin/editor/CategoryPicker";

interface PostEditorData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featuredImage: string | null;
  featuredImageKey: string | null;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  categoryIds: string[];
  publishedAt: string | null;
}

interface PostEditorProps {
  initialData?: Partial<PostEditorData>;
  postId?: string;
}

export default function PostEditor({ initialData, postId }: PostEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [status, setStatus] = useState<PostEditorData["status"]>(initialData?.status ?? "DRAFT");
  const [featuredImage, setFeaturedImage] = useState<string | null>(initialData?.featuredImage ?? null);
  const [featuredImageKey, setFeaturedImageKey] = useState<string | null>(initialData?.featuredImageKey ?? null);
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription ?? "");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [categoryIds, setCategoryIds] = useState<string[]>(initialData?.categoryIds ?? []);
  const [publishedAt] = useState<string | null>(initialData?.publishedAt ?? null);

  // Auto-generate slug from title on new posts
  useEffect(() => {
    if (!postId && title && !slug) {
      setSlug(titleToSlug(title));
    }
  }, [title, postId, slug]);

  async function handleSave(newStatus?: PostEditorData["status"]) {
    setSaving(true);
    setError(null);

    if (!title.trim()) {
      setError("Il titolo è obbligatorio");
      setSaving(false);
      return;
    }
    if (!content.trim()) {
      setError("Il contenuto è obbligatorio");
      setSaving(false);
      return;
    }
    const effectiveSlug = slug.trim() || titleToSlug(title.trim());
    if (effectiveSlug !== slug) setSlug(effectiveSlug);

    const body = {
      title: title.trim(),
      slug: effectiveSlug,
      content,
      excerpt,
      status: newStatus ?? status,
      featuredImage,
      featuredImageKey,
      seoTitle,
      seoDescription,
      tags,
      categoryIds,
      publishedAt: newStatus === "PUBLISHED" && !publishedAt ? new Date().toISOString() : publishedAt,
    };

    try {
      const res = postId
        ? await fetch(`/api/posts/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore" }));
        setError(err.error ?? "Errore nel salvataggio");
        return;
      }

      const data = await res.json();
      if (!postId) {
        router.push(`/admin/posts/${data.post.id}/edit`);
      } else {
        if (newStatus) setStatus(newStatus);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Title */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titolo post"
          className="w-full text-2xl font-semibold border-none border-b border-gray-200 pb-2 focus:outline-none focus:border-[#2271b1] bg-transparent"
        />
      </div>

      {/* Permalink */}
      <div className="mb-4">
        <SlugEditor slug={slug} onChange={setSlug} baseUrl="/blog" />
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-5">
        {/* Main editor */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 font-semibold text-sm text-gray-700">
              Contenuto
            </div>
            <div className="p-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={24}
                placeholder="Scrivi il contenuto del post..."
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 resize-y font-mono focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-3">
          <PublishBox
            status={status === "ARCHIVED" ? "DRAFT" : status}
            publishedAt={publishedAt}
            onSaveDraft={() => handleSave("DRAFT")}
            onPublish={() => handleSave("PUBLISHED")}
            loading={saving}
            isNew={!postId}
          />
          <FeaturedImage
            imageUrl={featuredImage}
            storageKey={featuredImageKey}
            onSelect={(key, url) => { setFeaturedImageKey(key); setFeaturedImage(url); }}
            onRemove={() => { setFeaturedImageKey(null); setFeaturedImage(null); }}
          />
          <CategoryPicker selected={categoryIds} onChange={setCategoryIds} />
          <TagInput tags={tags} onChange={setTags} />
          <ExcerptBox excerpt={excerpt} onChange={setExcerpt} />
          <SeoBox
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            onTitleChange={setSeoTitle}
            onDescriptionChange={setSeoDescription}
            fallbackTitle={title}
            fallbackDescription={excerpt}
          />
        </div>
      </div>
    </div>
  );
}
