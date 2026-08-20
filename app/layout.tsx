import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: { default: "微光讀經", template: "%s｜微光讀經" },
    description: "結合讀經進度、聖經測驗與角色養成的知識網站。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "微光讀經",
      description: "讓每一章，都成為生命裡的一點光。",
      images: [{ url: `${origin}/og.png`, width: 1536, height: 1024, alt: "微光讀經" }],
      locale: "zh_TW",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "微光讀經",
      description: "讓每一章，都成為生命裡的一點光。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
