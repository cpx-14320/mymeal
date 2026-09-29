import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 品項圖片、廣告圖片、頁面圖示…這些欄位（見 components/admin/image-field.tsx）除了能上傳到
    // Vercel Blob，管理者也可以直接貼外部網址——只允許 Blob 網域的話，貼外部圖片網址時
    // next/image 的最佳化服務會直接擋掉，前台讀不到圖。這些欄位都是後台管理者專用（需要登入
    // 才能寫入），不是任意訪客可控的輸入，允許任意 https 網域的風險可接受。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Server Action 預設請求大小上限是 1MB，手機拍的照片隨便就超過——
      // 品項圖片上傳（單筆／批次）都是走 Server Action，這裡調大一點才不會莫名其妙上傳失敗。
      // 實際檔案大小上限另外在 lib/upload-limits.ts 用常數管控，跟這裡的設定互相對應。
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
