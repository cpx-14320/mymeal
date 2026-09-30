"use server";

import { revalidatePath } from "next/cache";
import { setPagesActive, deletePages, listPages } from "@/lib/models/page";
import { createAuditLog } from "@/lib/models/audit-log";
import { getCurrentActorName } from "@/lib/session";
import { requireAdminPermission } from "@/lib/admin-guard";

export async function setPagesActiveAction(ids: string[], active: boolean) {
  await requireAdminPermission("pages");
  await setPagesActive(ids, active);
  revalidatePath("/admin/pages");
}

export async function deletePagesAction(ids: string[]) {
  await requireAdminPermission("pages");
  const actor = await getCurrentActorName();
  const pages = await listPages();
  const names = pages.filter((p) => ids.includes(p.id)).map((p) => p.name);

  await deletePages(ids);
  await createAuditLog({
    actor,
    action: "刪除頁面",
    target: names.length <= 3 ? names.join("、") : `${names.slice(0, 3).join("、")} 等 ${names.length} 個`,
    category: "catalog",
    risk: true,
  });

  revalidatePath("/admin/pages");
  // deletePages 會把指到這些頁面的品項／模板 pageId 清掉，這兩個列表也要重新整理才看得到「頁面：—」。
  revalidatePath("/admin/items");
  revalidatePath("/admin/templates");
  revalidatePath("/admin/audit");
}
