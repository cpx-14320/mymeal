import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-noto-tc",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "MyMeal 公司訂餐",
    template: "%s · MyMeal",
  },
  description: "公司內部每週訂餐系統：開團、點餐、錢包扣款一次搞定。",
};

// 在畫面繪製前套用使用者存的主題，避免閃一下顏色（FOUC）
const themeInit = `(function(){try{var t=localStorage.getItem('mymeal-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      suppressHydrationWarning
      className={`${notoSansTC.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
