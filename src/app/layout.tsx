import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-noto-thai",
});

export const metadata: Metadata = {
  title: "ClassMe - ระบบจัดการชั้นเรียนและเช็คชื่ออัจฉริยะ",
  description: "ระบบเช็คชื่อนักเรียน วิเคราะห์สถิติ สแกนใบเช็คชื่อด้วย AI และแจ้งเตือนอัตโนมัติ",
};

import { AppProvider } from "@/context/AppContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} font-sans antialiased h-full`}>
      <body className="min-h-full bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
