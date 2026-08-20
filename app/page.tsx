import type { Metadata } from "next";
import BibleApp from "./BibleApp";

export const metadata: Metadata = {
  title: "微光讀經｜讓每一章，都成為生命裡的一點光",
  description: "記錄讀經進度、收藏金句、寫下亮光，並用趣味測驗建立聖經知識。",
};

export default function Home() {
  return <BibleApp />;
}
