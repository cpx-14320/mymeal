"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createGroupOrder, findExistingGroupOrderNames } from "@/lib/models/group-order";

export interface OpenGroupOrderState {
  error?: string;
  /** 跟送出時每一列（單位＋團名）一一對應；undefined 代表這列沒問題。 */
  rowErrors?: (string | undefined)[];
}

/** 一次開多團（同一天、同模板/區塊，各自不同單位＋團名）。
 *  送出前先整批檢查團名（自己批次內重複＋跟資料庫現有的撞名），全部沒問題才真的建立，
 *  避免建到一半才發現某一列撞名，變成一部分開好了、一部分沒開，使用者搞不清楚狀況。 */
export async function openGroupOrdersAction(
  hostId: string,
  _prevState: OpenGroupOrderState,
  formData: FormData,
): Promise<OpenGroupOrderState> {
  const templateId = String(formData.get("templateId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim().replaceAll("-", "/");
  const deadline = String(formData.get("deadline") ?? "").trim().replace("T", " ");

  const unitIds = formData.getAll("unitId").map(String);
  const names = formData.getAll("name").map((n) => String(n).trim());

  if (unitIds.length === 0) {
    return { error: "請至少開一個單位的團。" };
  }

  const rowErrors: (string | undefined)[] = names.map(() => undefined);
  const nameFirstSeenAt = new Map<string, number>();
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (!name) {
      rowErrors[i] = "請填寫團名。";
      continue;
    }
    const firstIndex = nameFirstSeenAt.get(name);
    if (firstIndex !== undefined) {
      rowErrors[i] = `跟第 ${firstIndex + 1} 列的團名重複，請改一個名稱。`;
      continue;
    }
    nameFirstSeenAt.set(name, i);
  }

  if (!rowErrors.some(Boolean)) {
    const existingNames = await findExistingGroupOrderNames(date, names);
    for (let i = 0; i < names.length; i++) {
      if (existingNames.has(names[i])) {
        rowErrors[i] = `${date} 已經有一團叫「${names[i]}」了，請改一個名稱。`;
      }
    }
  }

  if (rowErrors.some(Boolean)) {
    return { rowErrors };
  }

  try {
    for (let i = 0; i < unitIds.length; i++) {
      await createGroupOrder({
        name: names[i],
        templateId,
        sectionId,
        unitId: unitIds[i],
        hostId,
        date,
        deadline,
      });
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/group-orders");
  redirect("/group-orders");
}
