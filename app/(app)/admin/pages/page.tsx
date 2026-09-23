import { PagesManager } from "@/components/admin/pages-manager";
import { listPages } from "@/lib/models/page";

export const metadata = { title: "頁面設定" };

export default async function AdminPagesPage() {
  const pages = await listPages();

  return <PagesManager pages={pages} />;
}
