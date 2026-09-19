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
