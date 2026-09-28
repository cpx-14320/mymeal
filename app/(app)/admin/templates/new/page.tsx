import { redirect } from "next/navigation";
import { createTemplate } from "@/lib/models/template";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

export const metadata = { title: "新增模板" };

/** 進頁面就直接建立一個空模板（名稱先給預設值，分類留空），馬上導去編輯頁繼續設定區塊與品項——
 *  不再另外用一個表單頁讓管理者「先填名稱/分類才能建立」，編輯頁本身就能改名稱／分類。
 *  不用 revalidatePath：那支只能在 Server Action／Route Handler 呼叫，渲染期間呼叫會直接噴錯；
 *  redirect 到列表頁時，列表頁本身就會重新查一次資料，不會看到舊的快取內容。 */
export default async function NewTemplatePage() {
  const memberId = await getSessionMemberId();
  const member = memberId ? await findMemberById(memberId) : null;

  const { id } = await createTemplate({ name: "新模板" }, member?.name, memberId ?? undefined);

  redirect(`/admin/templates/${id}?created=1`);
}
