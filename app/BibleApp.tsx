"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "home" | "progress" | "read" | "quiz" | "collection";

type Book = {
  code: string;
  name: string;
  short: string;
  chapters: number;
  testament: "舊約" | "新約";
  color: "moss" | "clay" | "gold" | "blue";
};

type VerseData = {
  number: string;
  startVerse: number;
  endVerse: number;
  text: string;
  heading?: string;
};

type BookData = Omit<Book, "chapters"> & {
  order: number;
  sourceTitle: string;
  chapterCount: number;
  chapters: Array<{ number: number; verses: VerseData[] }>;
};

type SavedVerse = {
  key: string;
  bookName: string;
  chapter: number;
  number: string;
  text: string;
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

const bookCodes = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL",
  "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
];
const colors: Book["color"][] = ["moss", "clay", "gold", "blue"];
const books: Book[] = [...oldTestament.map((book) => toBook(book, "舊約")), ...newTestament.map((book) => toBook(book, "新約"))]
  .map((book, index) => ({ ...book, code: bookCodes[index], color: colors[index % 4] }));

function toBook([name, short, chapters]: [string, string, number], testament: Book["testament"]) {
  return { name, short, chapters, testament };
}

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
  const [rewardedChapters, setRewardedChapters] = useState(() => new Set(completed));
  const [openBook, setOpenBook] = useState("創世記");
  const [testamentFilter, setTestamentFilter] = useState<"全部" | "舊約" | "新約">("全部");
  const [readerBookCode, setReaderBookCode] = useState("GEN");
  const [readerChapter, setReaderChapter] = useState(1);
  const [readerBookData, setReaderBookData] = useState<BookData | null>(null);
  const [readerLoading, setReaderLoading] = useState(true);
  const [readerError, setReaderError] = useState("");
  const [readerFontSize, setReaderFontSize] = useState(21);
  const [favorites, setFavorites] = useState<Record<string, SavedVerse>>(() => ({
    "GEN-1-3": { key: "GEN-1-3", bookName: "創世記", chapter: 1, number: "3", text: "上帝說：「要有光」，就有了光。" },
  }));
  const [highlighted, setHighlighted] = useState(() => new Set<string>(["GEN-1-4"]));
  const [activeVerse, setActiveVerse] = useState<string | null>(null);
  const [insightVerseKey, setInsightVerseKey] = useState<string | null>(null);
  const [insightReference, setInsightReference] = useState("創世記 1:3–4");
  const [note, setNote] = useState("神的話語在混亂裡帶來秩序，也提醒我今天先停下來，看見光。\n");
  const [savedNote, setSavedNote] = useState(true);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [coins, setCoins] = useState(120);
  const [xp, setXp] = useState(68);
  const [toast, setToast] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const totalChapters = 1189;
  const progress = Math.round((completed.size / totalChapters) * 100);
  const favoriteCount = Object.keys(favorites).length;
  const readerBook = books.find((book) => book.code === readerBookCode) ?? books[0];
  const currentChapter = readerBookData?.chapters.find((chapter) => chapter.number === readerChapter);
  const filteredBooks = testamentFilter === "全部" ? books : books.filter((book) => book.testament === testamentFilter);

  const today = useMemo(() => new Intl.DateTimeFormat("zh-TW", {
    month: "long", day: "numeric", weekday: "long",
  }).format(new Date()), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch(`/bible/cuvt/${readerBookCode}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<BookData>;
      })
      .then((data) => { if (active) setReaderBookData(data); })
      .catch((error: Error) => {
        if (active && error.name !== "AbortError") setReaderError("經文載入失敗，請稍後再試。");
      })
      .finally(() => { if (active) setReaderLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [readerBookCode]);

  useEffect(() => {
    if (insightVerseKey) document.getElementById("insight-editor")?.focus();
  }, [insightVerseKey]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function completeChapter(book = readerBook.name, chapter = readerChapter) {
    const key = `${book}-${chapter}`;
    if (completed.has(key)) {
      const next = new Set(completed);
      next.delete(key);
      setCompleted(next);
      notify(`已取消${book}第 ${chapter} 章的已讀標記`);
      return;
    }
    const next = new Set(completed);
    next.add(key);
    setCompleted(next);
    if (!rewardedChapters.has(key)) {
      setRewardedChapters((current) => new Set(current).add(key));
      setXp((value) => value + 20);
      setCoins((value) => value + 5);
      notify("完成一章 · +20 經驗值 · +5 代幣");
    } else {
      notify(`已恢復${book}第 ${chapter} 章的已讀標記`);
    }
  }

  function toggleHighlight(key: string) {
    const removing = highlighted.has(key);
    const message = removing ? "已移除劃記" : "已加上劃記";
    const setter: React.Dispatch<React.SetStateAction<Set<string>>> = setHighlighted;
    setter((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setActiveVerse(null);
    notify(message);
  }

  function toggleFavorite(verse: VerseData) {
    const key = `${readerBook.code}-${readerChapter}-${verse.number}`;
    const removing = Boolean(favorites[key]);
    setFavorites((current) => {
      const next = { ...current };
      if (next[key]) delete next[key];
      else next[key] = { key, bookName: readerBook.name, chapter: readerChapter, number: verse.number, text: verse.text };
      return next;
    });
    setActiveVerse(null);
    notify(removing ? "已移除金句" : "已加入我的金句");
  }

  function selectBook(name: string) {
    setOpenBook(openBook === name ? "" : name);
  }

  function changeReaderLocation(bookCode: string, chapter: number) {
    if (bookCode !== readerBookCode) {
      setReaderLoading(true);
      setReaderError("");
      setReaderBookCode(bookCode);
    }
    setReaderChapter(chapter);
    setActiveVerse(null);
    setInsightVerseKey(null);
  }

  function openReader(book: Book, chapter: number) {
    changeReaderLocation(book.code, chapter);
    setTab("read");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function moveChapter(direction: -1 | 1) {
    const bookIndex = books.findIndex((book) => book.code === readerBook.code);
    if (direction === -1 && readerChapter > 1) setReaderChapter(readerChapter - 1);
    else if (direction === 1 && readerChapter < readerBook.chapters) setReaderChapter(readerChapter + 1);
    else if (direction === -1 && bookIndex > 0) {
      const previousBook = books[bookIndex - 1];
      changeReaderLocation(previousBook.code, previousBook.chapters);
    } else if (direction === 1 && bookIndex < books.length - 1) {
      changeReaderLocation(books[bookIndex + 1].code, 1);
    }
    setActiveVerse(null);
    setInsightVerseKey(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                <span className="book-tab">上次讀到</span><p className="eyebrow">創世記</p><h2>第 1 章</h2><p>起初，上帝創造天地。</p><button className="round-button" onClick={() => openReader(books[0], 1)} aria-label="繼續閱讀創世記第一章">→</button>
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
            <div className="testament-switch">
              <button className={testamentFilter === "全部" ? "active" : ""} onClick={() => setTestamentFilter("全部")}>全部 66 卷</button>
              <button className={testamentFilter === "舊約" ? "active" : ""} onClick={() => setTestamentFilter("舊約")}>舊約 39 卷</button>
              <button className={testamentFilter === "新約" ? "active" : ""} onClick={() => setTestamentFilter("新約")}>新約 27 卷</button>
            </div>
            <div className="books-list">
              {filteredBooks.map((book) => {
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
                    return <div className="chapter-cell" key={chapter}>
                      <button className={`chapter-open ${done ? "done" : ""}`} onClick={() => openReader(book, chapter)} aria-label={`閱讀${book.name}第 ${chapter} 章${done ? "，已完成" : ""}`}>{done ? "✓" : chapter}</button>
                      {done && <button className="chapter-unmark" onClick={() => completeChapter(book.name, chapter)} aria-label={`取消${book.name}第 ${chapter} 章的已讀標記`} title="取消已讀標記">×</button>}
                    </div>;
                  })}</div>}
                </article>;
              })}
            </div>
          </div>
        )}

        {tab === "read" && (
          <div className="reader-layout">
            <aside className="reader-aside">
              <p className="eyebrow">正在閱讀 · CUVt</p>
              <label className="reader-select-label">書卷
                <select value={readerBookCode} onChange={(event) => changeReaderLocation(event.target.value, 1)}>
                  {books.map((book) => <option value={book.code} key={book.code}>{book.name}</option>)}
                </select>
              </label>
              <h1>{readerBook.name}</h1>
              <div className="chapter-selector">
                <button onClick={() => moveChapter(-1)} disabled={readerBook.code === "GEN" && readerChapter === 1} aria-label="上一章">‹</button>
                <select aria-label="選擇章節" value={readerChapter} onChange={(event) => { setReaderChapter(Number(event.target.value)); setActiveVerse(null); setInsightVerseKey(null); }}>
                  {Array.from({ length: readerBook.chapters }, (_, index) => index + 1).map((chapter) => <option value={chapter} key={chapter}>第 {chapter} 章</option>)}
                </select>
                <button onClick={() => moveChapter(1)} disabled={readerBook.code === "REV" && readerChapter === 22} aria-label="下一章">›</button>
              </div>
              <div className="reader-progress"><span>本卷進度</span><strong>{Array.from(completed).filter((key) => key.startsWith(`${readerBook.name}-`)).length} / {readerBook.chapters}</strong><div><i style={{ width: `${(Array.from(completed).filter((key) => key.startsWith(`${readerBook.name}-`)).length / readerBook.chapters) * 100}%` }} /></div></div>
              <p className="reader-hint">提示：桌面可在經節上按右鍵；手機可長按或使用每節旁的選單。</p>
            </aside>
            <article className="scripture-page">
              <header><div><p className="eyebrow">{readerBook.name}</p><h1>{readerChapter}</h1></div><div className="reader-tools"><button onClick={() => setReaderFontSize((size) => Math.max(17, size - 1))} aria-label="縮小字體">A−</button><button onClick={() => setReaderFontSize((size) => Math.min(29, size + 1))} aria-label="放大字體">A＋</button></div></header>
              <div className="license-note">新標點和合本 CUVt · Public Domain · <button onClick={() => setShowSource(true)}>經文來源與資料說明</button></div>
              <div className="verses">
                {readerLoading && <p className="reader-status">正在載入經文…</p>}
                {readerError && <p className="reader-status error">{readerError}</p>}
                {!readerLoading && !readerError && currentChapter?.verses.map((verse) => {
                  const verseKey = `${readerBook.code}-${readerChapter}-${verse.number}`;
                  return <section className="verse-block" key={verseKey}>
                    {verse.heading && <h2 className="section-title">{verse.heading}</h2>}
                    <div className={`verse ${highlighted.has(verseKey) ? "marked" : ""}`} role="button" tabIndex={0} aria-label={`${readerBook.name}第 ${readerChapter} 章第 ${verse.number} 節`} onKeyDown={(event) => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) setActiveVerse(verseKey); }} onContextMenu={(event) => { event.preventDefault(); setActiveVerse(verseKey); }}>
                      <button className="verse-number" onClick={() => setActiveVerse(activeVerse === verseKey ? null : verseKey)} aria-label={`開啟第 ${verse.number} 節操作`}>{verse.number}</button>
                      <p style={{ fontSize: `${readerFontSize}px` }}>{verse.text}</p>
                      {favorites[verseKey] && <span className="favorite-mark" title="已加入金句">◆</span>}
                      {activeVerse === verseKey && <div className="verse-menu">
                        <button onClick={() => toggleFavorite(verse)}>◆ {favorites[verseKey] ? "移除金句" : "加入我的金句"}</button>
                        <button onClick={() => toggleHighlight(verseKey)}>▰ {highlighted.has(verseKey) ? "移除劃記" : "劃記這一節"}</button>
                        <button onClick={() => { setInsightReference(`${readerBook.name} ${readerChapter}:${verse.number}`); setInsightVerseKey(verseKey); setActiveVerse(null); }}>✦ 我的亮光</button>
                      </div>}
                    </div>
                    {insightVerseKey === verseKey && <div className="insight-editor inline">
                      <div><span className="insight-icon">✦</span><div><p className="eyebrow">我的亮光</p><strong>{insightReference}</strong></div><span className={savedNote ? "save-state saved" : "save-state"}>{savedNote ? "已儲存" : "尚未儲存"}</span><button className="insight-close" onClick={() => setInsightVerseKey(null)} aria-label="關閉亮光編輯框">×</button></div>
                      <textarea id="insight-editor" value={note} onChange={(event) => { setNote(event.target.value); setSavedNote(false); }} aria-label="我的亮光筆記" />
                      <button onClick={() => { setSavedNote(true); notify("亮光筆記已儲存"); }}>儲存亮光</button>
                    </div>}
                  </section>;
                })}
              </div>
              <div className="reader-complete"><div><span>{completed.has(`${readerBook.name}-${readerChapter}`) ? "這一章已標記完成" : "讀完這一章了嗎？"}</span><p>{completed.has(`${readerBook.name}-${readerChapter}`) ? "如需重讀，可取消已讀標記" : "完成後會記錄進度並獲得獎勵"}</p></div><button className={completed.has(`${readerBook.name}-${readerChapter}`) ? "completed" : ""} onClick={() => completeChapter()}>{completed.has(`${readerBook.name}-${readerChapter}`) ? "取消已讀" : "讀完了！"}</button></div>
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
              {Object.values(favorites).map((verse) => <article className="collection-card" key={verse.key}><div className="collection-meta"><span>◆ 我的金句</span><button onClick={() => { setFavorites((current) => { const next = { ...current }; delete next[verse.key]; return next; }); notify("已移除金句"); }}>移除</button></div><blockquote>{verse.text}</blockquote><p>{verse.bookName} {verse.chapter}:{verse.number}</p></article>)}
              <article className="collection-card insight"><div className="collection-meta"><span>✦ 我的亮光</span><small>今天</small></div><p className="note-text">{note}</p><footer>創世記 1:3–4</footer></article>
            </div>
          </div>
        )}
      </main>

      <nav className="mobile-nav" aria-label="行動版導覽">{navItems.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.mark}</span>{item.label}</button>)}</nav>

      {showSource && <div className="modal-backdrop"><section className="source-modal" role="dialog" aria-modal="true" aria-labelledby="source-title"><button className="modal-close" onClick={() => setShowSource(false)} aria-label="關閉">×</button><p className="eyebrow">SCRIPTURE SOURCE</p><h2 id="source-title">經文版本與資料來源</h2><dl><div><dt>版本</dt><dd>新標點和合本（CUVt）</dd></div><div><dt>資料識別</dt><dd>cmn-cu89t</dd></div><div><dt>授權</dt><dd>Public Domain</dd></div><div><dt>來源</dt><dd><a href="https://ebible.org/bible/details.php?all=1&id=cmn-cu89t" target="_blank" rel="noreferrer">eBible.org 版本說明</a></dd></div><div><dt>完整性</dt><dd>66 卷 · 1,189 章；保留來源中的合併節號與缺節編排，不自行補寫經文。</dd></div></dl><p className="source-note">本網站以 USFM 原始資料產生逐卷經文檔，並保存來源檔案的 SHA-256 校驗值。</p></section></div>}

      {showLogin && <div className="modal-backdrop"><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="modal-close" onClick={() => setShowLogin(false)} aria-label="關閉">×</button><span className="brand-seal large">光</span><p className="eyebrow">保存你的讀經旅程</p><h2 id="login-title">帳號功能準備中</h2><p className="modal-copy">目前可以直接體驗網站，不需要登入。正式帳號將提供 Google 與 Email 兩種方式，並用來同步閱讀進度與私人筆記。</p><button className="login-option disabled" disabled><span>G</span> Google 登入 · 即將推出</button><button className="login-option disabled" disabled><span>@</span> Email 登入 · 即將推出</button></section></div>}

      {toast && <div className="toast" role="status">{toast}</div>}
      <span className="version-badge">v0.2.1</span>
    </div>
  );
}
