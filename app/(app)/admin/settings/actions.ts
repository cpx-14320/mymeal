"use server";

import { revalidatePath } from "next/cache";
import { updateSettings } from "@/lib/models/settings";

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

export async function updateSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const orderDeadlineDefault = String(formData.get("orderDeadlineDefault") ?? "");
  const underMinPolicy = String(formData.get("underMinPolicy") ?? "");
  const emailWhitelist = String(formData.get("emailWhitelist") ?? "").trim();
  const activationMethod = String(formData.get("activationMethod") ?? "");
  const pickupLocations = String(formData.get("pickupLocations") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const announcement = String(formData.get("announcement") ?? "").trim();

  try {
    await updateSettings({
      orderDeadlineDefault,
      underMinPolicy,
      emailWhitelist,
      activationMethod,
      pickupLocations,
      announcement,
    });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { success: true };
}
