"use client";

import { useMemo, useState } from "react";

type Tab = "home" | "progress" | "read" | "quiz" | "collection";

type Book = {
  name: string;
  short: string;
  chapters: number;
  testament: "舊約" | "新約";
  color: "moss" | "clay" | "gold" | "blue";
};

const oldTestament: Array<[string, string, number]> = [
  ["創世記", "創", 50], ["出埃及記", "出", 40], ["利未記", "利", 27], ["民數記", "民", 36],
  ["申命記", "申", 34], ["約書亞記", "書", 24], ["士師記", "士", 21], ["路得記", "得", 4],
  ["撒母耳記上", "撒上", 31], ["撒母耳記下", "撒下", 24], ["列王紀上", "王上", 22], ["列王紀下", "王下", 25],
  ["歷代志上", "代上", 29], ["歷代志下", "代下", 36], ["以斯拉記", "拉", 10], ["尼希米記", "尼", 13],
  ["以斯帖記", "斯", 10], ["約伯記", "伯", 42], ["詩篇", "詩", 150], ["箴言", "箴", 31],
  ["傳道書", "傳", 12], ["雅歌", "歌", 8], ["以賽亞書", "賽", 66], ["耶利米書", "耶", 52],
  ["耶利米哀歌", "哀", 5], ["以西結書", "結", 48], ["但以理書", "但", 12], ["何西阿書", "何", 14],
  ["約珥書", "珥", 3], ["阿摩司書", "摩", 9], ["俄巴底亞書", "俄", 1], ["約拿書", "拿", 4],
  ["彌迦書", "彌", 7], ["那鴻書", "鴻", 3], ["哈巴谷書", "哈", 3], ["西番雅書", "番", 3],
  ["哈該書", "該", 2], ["撒迦利亞書", "亞", 14], ["瑪拉基書", "瑪", 4],
];

const newTestament: Array<[string, string, number]> = [
  ["馬太福音", "太", 28], ["馬可福音", "可", 16], ["路加福音", "路", 24], ["約翰福音", "約", 21],
  ["使徒行傳", "徒", 28], ["羅馬書", "羅", 16], ["哥林多前書", "林前", 16], ["哥林多後書", "林後", 13],
  ["加拉太書", "加", 6], ["以弗所書", "弗", 6], ["腓立比書", "腓", 4], ["歌羅西書", "西", 4],
  ["帖撒羅尼迦前書", "帖前", 5], ["帖撒羅尼迦後書", "帖後", 3], ["提摩太前書", "提前", 6], ["提摩太後書", "提後", 4],
  ["提多書", "多", 3], ["腓利門書", "門", 1], ["希伯來書", "來", 13], ["雅各書", "雅", 5],
  ["彼得前書", "彼前", 5], ["彼得後書", "彼後", 3], ["約翰一書", "約一", 5], ["約翰二書", "約二", 1],
  ["約翰三書", "約三", 1], ["猶大書", "猶", 1], ["啟示錄", "啟", 22],
];

const colors: Book["color"][] = ["moss", "clay", "gold", "blue"];
const books: Book[] = [...oldTestament.map((book) => ({ ...toBook(book, "舊約"), color: colors[oldTestament.indexOf(book) % 4] })),
  ...newTestament.map((book) => ({ ...toBook(book, "新約"), color: colors[(newTestament.indexOf(book) + 1) % 4] }))];

function toBook([name, short, chapters]: [string, string, number], testament: Book["testament"]) {
  return { name, short, chapters, testament };
}

const demoVerses = [
  [1, "起初，神創造天地。"],
  [2, "地是空虛混沌，淵面黑暗；神的靈運行在水面上。"],
  [3, "神說：要有光，就有了光。"],
  [4, "神看光是好的，就把光暗分開了。"],
  [5, "神稱光為晝，稱暗為夜。有晚上，有早晨，這是頭一日。"],
  [6, "神說：諸水之間要有空氣，將水分為上下。"],
  [7, "神就造出空氣，將空氣以下的水、空氣以上的水分開了。事就這樣成了。"],
  [8, "神稱空氣為天。有晚上，有早晨，是第二日。"],
] as const;

const navItems: Array<{ id: Tab; label: string; mark: string }> = [
  { id: "home", label: "今日", mark: "日" },
  { id: "progress", label: "進度", mark: "冊" },
  { id: "read", label: "讀經", mark: "讀" },
  { id: "quiz", label: "測驗", mark: "問" },
  { id: "collection", label: "收藏", mark: "藏" },
];

const quizOptions = ["挪亞", "亞伯拉罕", "摩西", "大衛"];

export default function BibleApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [completed, setCompleted] = useState(() => new Set(["創世記-1", "創世記-2", "創世記-3", "創世記-4", "馬太福音-1", "詩篇-1"]));
  const [openBook, setOpenBook] = useState("創世記");
  const [favorites, setFavorites] = useState(() => new Set<number>([3]));
  const [highlighted, setHighlighted] = useState(() => new Set<number>([4]));
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [note, setNote] = useState("神的話語在混亂裡帶來秩序，也提醒我今天先停下來，看見光。\n");
  const [savedNote, setSavedNote] = useState(true);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [coins, setCoins] = useState(120);
  const [xp, setXp] = useState(68);
  const [toast, setToast] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const totalChapters = 1189;
  const progress = Math.round((completed.size / totalChapters) * 100);
  const favoriteCount = favorites.size;

  const today = useMemo(() => new Intl.DateTimeFormat("zh-TW", {
    month: "long", day: "numeric", weekday: "long",
  }).format(new Date()), []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function completeChapter(book = "創世記", chapter = 1) {
    const key = `${book}-${chapter}`;
    if (completed.has(key)) {
      notify("這一章已經完成囉");
      return;
    }
    const next = new Set(completed);
    next.add(key);
    setCompleted(next);
    setXp((value) => value + 20);
    setCoins((value) => value + 5);
    notify("完成一章 · +20 經驗值 · +5 代幣");
  }

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<number>>>, verse: number, added: string) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(verse)) next.delete(verse); else next.add(verse);
      return next;
    });
    setActiveVerse(null);
    notify(added);
  }

  function selectBook(name: string) {
    setOpenBook(openBook === name ? "" : name);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setTab("home")} aria-label="回到首頁">
          <span className="brand-seal">光</span>
          <span><strong>微光讀經</strong><small>LIGHT IN THE WORD</small></span>
        </button>
        <nav className="desktop-nav" aria-label="主要導覽">
          {navItems.map((item) => (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>
          ))}
        </nav>
        <div className="account-actions">
          <div className="currency"><span>✦</span><b>{coins}</b></div>
          <button className="avatar" onClick={() => setShowLogin(true)} aria-label="開啟帳號選單">
            旅
          </button>
        </div>
      </header>

      <main>
        {tab === "home" && (
          <div className="page home-page">
            <section className="welcome-grid">
              <div className="welcome-copy">
                <p className="eyebrow">{today}</p>
                <h1>在話語裡，遇見今日的光</h1>
                <p className="lead">一次讀一章，一點一點累積。讓讀經不只是進度，而是能回頭看見的生命足跡。</p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => setTab("read")}>繼續讀經 <span>→</span></button>
                  <button className="secondary" onClick={() => setTab("quiz")}>今日小測驗</button>
                </div>
              </div>
              <div className="verse-card">
                <div className="sun-motif" aria-hidden="true"><span /></div>
                <p>「你的話是我腳前的燈，是我路上的光。」</p>
                <span>詩篇 119:105</span>
              </div>
            </section>

            <section className="dashboard-grid">
              <article className="card journey-card">
                <div className="card-heading"><div><p className="eyebrow">第一輪讀經</p><h2>你的讀經旅程</h2></div><button className="text-button" onClick={() => setTab("progress")}>查看全部</button></div>
                <div className="journey-body">
                  <div className="progress-ring" style={{ "--progress": `${Math.max(progress, 1)}%` } as React.CSSProperties}><div><strong>{completed.size}</strong><span>/ 1,189 章</span></div></div>
                  <div className="journey-stats">
                    <div><span>本週閱讀</span><strong>4 章</strong></div>
                    <div><span>連續天數</span><strong>3 天</strong></div>
                    <div><span>全書進度</span><strong>{progress}%</strong></div>
                  </div>
                </div>
              </article>

              <article className="card character-card">
                <div className="level-pill">Lv. 3 · 旅人</div>
                <div className="character-portrait"><div className="halo" /><div className="head" /><div className="body-shape" /><span className="tiny-book">十</span></div>
                <div className="character-copy"><h2>向著光前行</h2><p>再獲得 32 經驗值即可升級</p><div className="xp-track"><span style={{ width: `${xp}%` }} /></div><small>{xp} / 100 XP</small></div>
              </article>

              <article className="card continue-card">
                <span className="book-tab">上次讀到</span><p className="eyebrow">創世記</p><h2>第 1 章</h2><p>起初，神創造天地。</p><button className="round-button" onClick={() => setTab("read")} aria-label="繼續閱讀創世記第一章">→</button>
              </article>

              <article className="card quiz-card">
                <span className="quiz-mark">?</span><div><p className="eyebrow">今日挑戰</p><h2>創世記小測驗</h2><p>5 題 · 約 2 分鐘</p></div><button onClick={() => setTab("quiz")}>開始</button>
              </article>
            </section>

            <section className="section-heading"><div><p className="eyebrow">最近收藏</p><h2>帶著走的話語</h2></div><button className="text-button" onClick={() => setTab("collection")}>我的收藏 →</button></section>
            <div className="saved-strip">
              <blockquote><span>創世記 1:3</span><p>神說：要有光，就有了光。</p></blockquote>
              <div className="note-preview"><span>我的亮光 · 創世記 1:4</span><p>{note}</p></div>
            </div>
          </div>
        )}

        {tab === "progress" && (
          <div className="page content-page">
            <section className="page-title"><div><p className="eyebrow">READING JOURNEY</p><h1>讀經進度</h1><p>點開書卷，標記你已走過的每一章。</p></div><div className="compact-stat"><strong>{completed.size}</strong><span>已讀章節</span></div></section>
            <div className="testament-switch"><button className="active">全部 66 卷</button><button>舊約 39 卷</button><button>新約 27 卷</button></div>
            <div className="books-list">
              {books.map((book) => {
                const count = Array.from(completed).filter((key) => key.startsWith(`${book.name}-`)).length;
                const isOpen = openBook === book.name;
                return <article className={`book-row ${isOpen ? "open" : ""}`} key={book.name}>
                  <button className="book-summary" onClick={() => selectBook(book.name)} aria-expanded={isOpen}>
                    <span className={`book-spine ${book.color}`}>{book.short}</span>
                    <span className="book-name"><strong>{book.name}</strong><small>{book.testament} · {book.chapters} 章</small></span>
                    <span className="book-progress"><span><i style={{ width: `${(count / book.chapters) * 100}%` }} /></span><small>{count} / {book.chapters}</small></span>
                    <span className="chevron">⌄</span>
                  </button>
                  {isOpen && <div className="chapters-grid">{Array.from({ length: book.chapters }, (_, index) => index + 1).map((chapter) => {
                    const done = completed.has(`${book.name}-${chapter}`);
                    return <button key={chapter} className={done ? "done" : ""} onClick={() => completeChapter(book.name, chapter)} aria-label={`${book.name}第 ${chapter} 章${done ? "，已完成" : ""}`}>{done ? "✓" : chapter}</button>;
                  })}</div>}
                </article>;
              })}
            </div>
          </div>
        )}

        {tab === "read" && (
          <div className="reader-layout">
            <aside className="reader-aside">
              <p className="eyebrow">正在閱讀</p><h1>創世記</h1><div className="chapter-selector"><button>‹</button><strong>第 1 章</strong><button>›</button></div>
              <div className="reader-progress"><span>本卷進度</span><strong>4 / 50</strong><div><i style={{ width: "8%" }} /></div></div>
              <p className="reader-hint">提示：桌面可在經節上按右鍵；手機可長按或使用每節旁的選單。</p>
            </aside>
            <article className="scripture-page">
              <header><div><p className="eyebrow">創世記</p><h1>1</h1></div><div className="reader-tools"><button aria-label="縮小字體">A−</button><button aria-label="放大字體">A＋</button></div></header>
              <div className="license-note">示範經文節錄 · 正式版全文待確認和合本電子文本授權後匯入</div>
              <div className="verses">
                {demoVerses.map(([number, text]) => <div key={number} className={`verse ${highlighted.has(number) ? "marked" : ""}`} role="button" tabIndex={0} aria-label={`創世記第一章第 ${number} 節`} onKeyDown={(event) => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) setActiveVerse(number); }} onContextMenu={(event) => { event.preventDefault(); setActiveVerse(number); }}>
                  <button className="verse-number" onClick={() => setActiveVerse(activeVerse === number ? null : number)} aria-label={`開啟第 ${number} 節操作`}>{number}</button>
                  <p>{text}</p>
                  {favorites.has(number) && <span className="favorite-mark" title="已加入金句">◆</span>}
                  {activeVerse === number && <div className="verse-menu">
                    <button onClick={() => toggleSet(setFavorites, number, favorites.has(number) ? "已移除金句" : "已加入我的金句")}>◆ {favorites.has(number) ? "移除金句" : "加入我的金句"}</button>
                    <button onClick={() => toggleSet(setHighlighted, number, highlighted.has(number) ? "已移除劃記" : "已加上劃記")}>▰ {highlighted.has(number) ? "移除劃記" : "劃記這一節"}</button>
                    <button onClick={() => { setActiveVerse(null); document.getElementById("insight-editor")?.focus(); }}>✦ 我的亮光</button>
                  </div>}
                </div>)}
              </div>
              <div className="reader-complete"><div><span>讀完這一章了嗎？</span><p>完成後會記錄進度並獲得獎勵</p></div><button className={completed.has("創世記-1") ? "completed" : ""} onClick={() => completeChapter()}>{completed.has("創世記-1") ? "✓ 已讀完" : "讀完了！"}</button></div>
              <div className="insight-editor"><div><span className="insight-icon">✦</span><div><p className="eyebrow">我的亮光</p><strong>創世記 1:3–4</strong></div><span className={savedNote ? "save-state saved" : "save-state"}>{savedNote ? "已儲存" : "尚未儲存"}</span></div><textarea id="insight-editor" value={note} onChange={(event) => { setNote(event.target.value); setSavedNote(false); }} aria-label="我的亮光筆記" /><button onClick={() => { setSavedNote(true); notify("亮光筆記已儲存"); }}>儲存亮光</button></div>
            </article>
          </div>
        )}

        {tab === "quiz" && (
          <div className="page content-page quiz-page-main">
            <section className="page-title"><div><p className="eyebrow">BIBLE QUIZ</p><h1>聖經知識測驗</h1><p>每一次回想，都讓讀過的話語更深地留下來。</p></div><div className="quiz-score-badge"><strong>82</strong><span>歷史平均</span></div></section>
            <div className="quiz-layout">
              <section className="quiz-main-card">
                <div className="quiz-topline"><span>創世記（一）· 1–25 章</span><span>第 1 / 5 題</span></div><div className="quiz-line"><i /></div>
                <p className="question-kicker">單選題</p><h2>神呼召誰離開本地、本族、父家，往祂所要指示的地去？</h2>
                <div className="options">{quizOptions.map((option, index) => {
                  const answered = quizAnswer !== null;
                  const correct = option === "亞伯拉罕";
                  const selected = quizAnswer === option;
                  return <button key={option} className={`${selected ? "selected" : ""} ${answered && correct ? "correct" : ""} ${answered && selected && !correct ? "wrong" : ""}`} onClick={() => setQuizAnswer(option)} disabled={answered}><span>{String.fromCharCode(65 + index)}</span>{option}{answered && correct && <b>✓</b>}</button>;
                })}</div>
                {quizAnswer && <div className={`answer-note ${quizAnswer === "亞伯拉罕" ? "right" : "try"}`}><strong>{quizAnswer === "亞伯拉罕" ? "答對了！" : "再複習一次"}</strong><p>神呼召亞伯蘭離開本地，並應許使他成為大國。經文依據：創世記 12:1–2。</p><button onClick={() => setQuizAnswer(null)}>下一題 →</button></div>}
              </section>
              <aside className="quiz-types"><p className="eyebrow">選擇測驗</p><button className="active"><span>冊</span><div><strong>單一書卷</strong><small>依指定章節挑戰</small></div></button><button><span>綜</span><div><strong>綜合測驗</strong><small>自選範圍隨機出題</small></div></button><button><span>題</span><div><strong>主題測驗</strong><small>四福音、書信、先知書…</small></div></button><div className="coming-note"><strong>首批題庫建置中</strong><p>所有題目都會標示經文依據，並經人工核對後才發布。</p></div></aside>
            </div>
          </div>
        )}

        {tab === "collection" && (
          <div className="page content-page">
            <section className="page-title"><div><p className="eyebrow">MY TREASURES</p><h1>我的收藏</h1><p>把曾經觸動你的話語與領受，珍藏在這裡。</p></div><div className="compact-stat"><strong>{favoriteCount + 1}</strong><span>收藏內容</span></div></section>
            <div className="collection-tabs"><button className="active">金句 {favoriteCount}</button><button>劃記 {highlighted.size}</button><button>我的亮光 1</button></div>
            <div className="collection-grid">
              {Array.from(favorites).map((verse) => <article className="collection-card" key={verse}><div className="collection-meta"><span>◆ 我的金句</span><button onClick={() => toggleSet(setFavorites, verse, "已移除金句")}>移除</button></div><blockquote>{demoVerses.find(([number]) => number === verse)?.[1]}</blockquote><p>創世記 1:{verse}</p></article>)}
              <article className="collection-card insight"><div className="collection-meta"><span>✦ 我的亮光</span><small>今天</small></div><p className="note-text">{note}</p><footer>創世記 1:3–4</footer></article>
            </div>
          </div>
        )}
      </main>

      <nav className="mobile-nav" aria-label="行動版導覽">{navItems.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.mark}</span>{item.label}</button>)}</nav>

      {showLogin && <div className="modal-backdrop"><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="modal-close" onClick={() => setShowLogin(false)} aria-label="關閉">×</button><span className="brand-seal large">光</span><p className="eyebrow">保存你的讀經旅程</p><h2 id="login-title">帳號功能準備中</h2><p className="modal-copy">目前可以直接體驗網站，不需要登入。正式帳號將提供 Google 與 Email 兩種方式，並用來同步閱讀進度與私人筆記。</p><button className="login-option disabled" disabled><span>G</span> Google 登入 · 即將推出</button><button className="login-option disabled" disabled><span>@</span> Email 登入 · 即將推出</button></section></div>}

      {toast && <div className="toast" role="status">{toast}</div>}
      <span className="version-badge">v0.1.2</span>
    </div>
  );
}
