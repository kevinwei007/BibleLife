# 微光讀經

「微光讀經」是一個結合讀經進度、聖經知識測驗與角色養成概念的繁體中文網站。

目前版本：`v0.3.0`

## 初版內容

- 66 卷書卷與章節進度介面
- eBible CUVt 新標點和合本完整 66 卷、1,189 章經文
- 可選書卷／章、前後章導覽及字體調整的經文閱讀器
- 經文來源、Public Domain 聲明及資料完整性報告
- 完成章節獎勵
- 金句、劃記與「我的亮光」互動
- 單卷、綜合與主題測驗介面
- 角色等級、經驗值及代幣摘要
- Google 帳號登入與跨裝置永久資料同步
- 管理員帳號後台與使用者刪除功能

完整產品與階段規劃請見 `聖經知識網站開發規劃.md`，版本變更請見 `CHANGELOG.md`。

## 本機開發

需求：Node.js 22.13 或更新版本。

```bash
npm install
npm run dev
```

開啟 `http://localhost:3000`。

Google 登入需要在執行環境設定：

- `GOOGLE_CLIENT_ID`：Google Cloud OAuth 2.0 網頁應用程式 Client ID
- `ADMIN_EMAILS`：管理員 Email，若有多個請以逗號分隔

可複製 `.env.example` 作為本機設定起點。正式網站的環境變數由 Sites 管理，不提交至 Git。

## 驗證

```bash
npm run build
npm run lint
```

## 資料與授權

經文採用 eBible.org 的繁體中文新標點和合本 CUVt（`cmn-cu89t`），來源頁標示為 Public Domain。原始 USFM 快照、下載日期、SHA-256 與匯入說明保存在 `data/source/`，完整性報告位於 `data/cuvt-import-report.json`。
