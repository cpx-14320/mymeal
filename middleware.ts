import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mymeal_session";
const PATHNAME_HEADER = "x-pathname";

/**
 * 後台安全性第一層：擋在所有 /admin/* 的請求最前面——不管是打開頁面，還是後台按鈕
 * 觸發的 server action（Next.js 的 action 本身就是送到同一個網址的 POST），都會先
 * 經過這裡。完全沒有登入 session 就直接導去登入頁，不會碰到任何後台程式碼或資料庫查詢
 * （這裡只讀 cookie，不查權限，查權限、依頁面判斷細項權限的邏輯在 admin/layout.tsx，
 * 那支需要查資料庫，屬於 Node.js runtime，不適合放在跑在 Edge 的 middleware 裡）。
 * 同時把目前路徑寫進一個自訂 header 往下傳，讓 admin/layout.tsx（Server Component，
 * 原生拿不到目前網址）可以用 headers() 讀到，藉此判斷這個頁面需要哪個權限鍵。
 */
export function middleware(request: NextRequest) {
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
