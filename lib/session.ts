import { cookies } from "next/headers";

const SESSION_COOKIE = "mymeal_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

/** 登入成功後呼叫：把會員 id 存進 httpOnly cookie 當作簡易 session。 */
export async function createSession(memberId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, memberId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSessionMemberId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** 目前登入者的顯示名稱，供稽核紀錄等「操作者」欄位使用；沒有 session（預覽模式）就回傳預設值。 */
export async function getCurrentActorName(): Promise<string> {
  const memberId = await getSessionMemberId();
  if (!memberId) return "管理員";
  const { findMemberById } = await import("@/lib/models/member");
  const member = await findMemberById(memberId);
  return member?.name ?? "管理員";
}
