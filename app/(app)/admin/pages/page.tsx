import { PagesManager } from "@/components/admin/pages-manager";
import { listPages } from "@/lib/models/page";

export const metadata = { title: "頁面設定" };

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const [pages, params] = await Promise.all([
    listPages({ withCreatorLabels: true }),
    searchParams,
  ]);

  return <PagesManager pages={pages} justCreated={params.created === "1"} />;
}
