"use server";

import { listEnabledInterstitials } from "@/lib/models/interstitial";

/** 前台蓋台廣告用：只回傳「開啟」的候選，排程時間窗留給前端依使用者本機時間判斷。 */
export async function getEnabledInterstitialsAction() {
  return listEnabledInterstitials();
}
