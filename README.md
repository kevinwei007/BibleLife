# 微光讀經

「微光讀經」是一個結合讀經進度、聖經知識測驗與角色養成概念的繁體中文網站。

目前版本：`v0.2.0`

## 初版內容

- 66 卷書卷與章節進度介面
- eBible CUVt 新標點和合本完整 66 卷、1,189 章經文
- 可選書卷／章、前後章導覽及字體調整的經文閱讀器
- 經文來源、Public Domain 聲明及資料完整性報告
- 完成章節獎勵
- 金句、劃記與「我的亮光」互動
- 單卷、綜合與主題測驗介面
- 角色等級、經驗值及代幣摘要
- Google／Email 帳號入口預留與持久化資料模型基礎

完整產品與階段規劃請見 `聖經知識網站開發規劃.md`，版本變更請見 `CHANGELOG.md`。

## 本機開發

需求：Node.js 22.13 或更新版本。

```bash
npm install
npm run dev
```

開啟 `http://localhost:3000`。

## 驗證

```bash
npm run build
npm run lint
```

## 資料與授權

經文採用 eBible.org 的繁體中文新標點和合本 CUVt（`cmn-cu89t`），來源頁標示為 Public Domain。原始 USFM 快照、下載日期、SHA-256 與匯入說明保存在 `data/source/`，完整性報告位於 `data/cuvt-import-report.json`。
