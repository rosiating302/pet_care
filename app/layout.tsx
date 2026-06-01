import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "暖爪宠物洗护 | 温和、透明、可预约的宠物洗护店",
  description:
    "暖爪宠物洗护提供猫犬洗澡、修剪、皮毛护理、洁牙和上门接送服务。透明价格，温和护理，可在线预约。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
