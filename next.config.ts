import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 品項圖片存在 Vercel Blob（mymeal/items_images/...），讓 next/image 可以讀取並最佳化。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
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
