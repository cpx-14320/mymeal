"use server";

import { revalidatePath } from "next/cache";
import { setPagesActive, deletePages } from "@/lib/models/page";

export async function setPagesActiveAction(ids: string[], active: boolean) {
  await setPagesActive(ids, active);
  revalidatePath("/admin/pages");
}

export async function deletePagesAction(ids: string[]) {
  await deletePages(ids);
  revalidatePath("/admin/pages");
  // deletePages 會把指到這些頁面的品項／模板 pageId 清掉，這兩個列表也要重新整理才看得到「頁面：—」。
  revalidatePath("/admin/items");
  revalidatePath("/admin/templates");
}
