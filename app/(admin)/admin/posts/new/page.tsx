import PostEditor from "@/components/admin/editor/PostEditor";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "Nuovo post — Admin" };

export default async function NewPostPage() {
  const blogPage = await prisma.page.findFirst({
    where: { type: "BLOG", status: "PUBLISHED" },
    select: { id: true },
  });

  if (!blogPage) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Aggiungi nuovo post</h1>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">Nessuna pagina Blog trovata</p>
          <p className="text-sm text-amber-700">
            Per pubblicare articoli devi prima creare una pagina di tipo <strong>Blog</strong>.
            Una volta creata e pubblicata, potrai aggiungere i post.
          </p>
          <Link
            href="/admin/pages/new?type=BLOG"
            className="mt-3 inline-block rounded bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
          >
            Crea pagina Blog →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Aggiungi nuovo post</h1>
      <PostEditor />
    </div>
  );
}
