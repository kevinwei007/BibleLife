"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "home" | "progress" | "read" | "quiz" | "collection" | "admin";

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

type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  isAdmin: boolean;
};

type AdminUser = AuthUser & {
  createdAt: string;
  lastLoginAt: string | null;
};

type QuizQuestion = {
  id: string;
  topicCode: string;
  topicTitle: string;
  bookName: string;
  testament: string;
  section: string;
  questionType: "經文辨識" | "出處辨識" | "內容理解";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reference: string;
  difficulty: "easy" | "medium" | "hard";
};

type QuizTopic = { code: string; title: string; bookName: string; testament: string; questionCount: number };
type QuizTheme = { code: string; label: string; questionCount: number };
type QuizMode = "topic" | "mixed" | "theme";

type AdminQuestion = QuizQuestion & {
  bookCodes: string;
  chapterStart: number;
  chapterEnd: number;
  status: "active" | "draft" | "disabled";
  createdAt?: string;
  updatedAt?: string;
};

type PersistedState = {
  completed: string[];
  favorites: Record<string, SavedVerse>;
  highlighted: string[];
  note: string;
  insightReference: string;
  coins: number;
  xp: number;
};

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: { client_id: string; callback(response: GoogleCredentialResponse): void }): void;
          renderButton(element: HTMLElement, options: Record<string, string | number>): void;
        };
      };
    };
  }
}

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

const emptyAdminQuestion: AdminQuestion = {
  id: "",
  topicCode: "custom",
  topicTitle: "自訂測驗",
  bookCodes: "GEN",
  bookName: "創世記",
  testament: "舊約",
  section: "pentateuch",
  chapterStart: 1,
  chapterEnd: 1,
  questionType: "內容理解",
  question: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
  reference: "",
  difficulty: "medium",
  status: "draft",
};

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
  const [quizMode, setQuizMode] = useState<QuizMode>("topic");
  const [quizTopics, setQuizTopics] = useState<QuizTopic[]>([]);
  const [quizThemes, setQuizThemes] = useState<QuizTheme[]>([]);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizTopic, setQuizTopic] = useState("01-1");
  const [quizScope, setQuizScope] = useState("ALL");
  const [quizTheme, setQuizTheme] = useState("gospels");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizFinished, setQuizFinished] = useState(false);
  const [coins, setCoins] = useState(120);
  const [xp, setXp] = useState(68);
  const [toast, setToast] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [userStateReady, setUserStateReady] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSection, setAdminSection] = useState<"users" | "questions">("users");
  const [adminQuestions, setAdminQuestions] = useState<AdminQuestion[]>([]);
  const [adminQuestionLoading, setAdminQuestionLoading] = useState(false);
  const [adminQuestionSearch, setAdminQuestionSearch] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [adminSaving, setAdminSaving] = useState(false);

  const totalChapters = 1189;
  const progress = Math.round((completed.size / totalChapters) * 100);
  const favoriteCount = Object.keys(favorites).length;
  const readerBook = books.find((book) => book.code === readerBookCode) ?? books[0];
  const currentChapter = readerBookData?.chapters.find((chapter) => chapter.number === readerChapter);
  const filteredBooks = testamentFilter === "全部" ? books : books.filter((book) => book.testament === testamentFilter);
  const currentQuizQuestion = quizQuestions[quizIndex];
  const filteredAdminQuestions = useMemo(() => {
    const query = adminQuestionSearch.trim().toLowerCase();
    if (!query) return adminQuestions;
    return adminQuestions.filter((question) => [question.topicCode, question.topicTitle, question.bookName, question.question, question.reference]
      .some((value) => value.toLowerCase().includes(query)));
  }, [adminQuestionSearch, adminQuestions]);

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

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ user: AuthUser | null }>)
      .then(({ user }) => { if (active) setAuthUser(user); })
      .catch(() => { if (active) setAuthMessage("暫時無法確認登入狀態"); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authUser) return;
    let active = true;
    fetch("/api/user-data", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { state: PersistedState | null; error?: string };
        if (!response.ok) throw new Error(result.error ?? "讀取同步資料失敗");
        return result.state;
      })
      .then((state) => {
        if (!active || !state) return;
        if (Array.isArray(state.completed)) {
          setCompleted(new Set(state.completed));
          setRewardedChapters(new Set(state.completed));
        }
        if (state.favorites && typeof state.favorites === "object") setFavorites(state.favorites);
        if (Array.isArray(state.highlighted)) setHighlighted(new Set(state.highlighted));
        if (typeof state.note === "string") setNote(state.note);
        if (typeof state.insightReference === "string") setInsightReference(state.insightReference);
        if (Number.isFinite(state.coins)) setCoins(Math.max(0, Math.round(state.coins)));
        if (Number.isFinite(state.xp)) setXp(Math.max(0, Math.round(state.xp)));
      })
      .catch((error: Error) => { if (active) notify(error.message); })
      .finally(() => { if (active) { setUserStateReady(true); setSyncState("saved"); } });
    return () => { active = false; };
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !userStateReady) return;
    const timeout = window.setTimeout(() => {
      setSyncState("saving");
      const state: PersistedState = {
        completed: Array.from(completed),
        favorites,
        highlighted: Array.from(highlighted),
        note,
        insightReference,
        coins,
        xp,
      };
      fetch("/api/user-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      }).then((response) => {
        if (!response.ok) throw new Error("同步失敗");
        setSyncState("saved");
      }).catch(() => setSyncState("error"));
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [authUser, coins, completed, favorites, highlighted, insightReference, note, userStateReady, xp]);

  useEffect(() => {
    if (!showLogin || authUser) return;
    let active = true;

    async function renderGoogleButton() {
      setAuthMessage("");
      const configResponse = await fetch("/api/auth/config", { cache: "no-store" });
      const config = await configResponse.json() as { configured: boolean; clientId: string };
      if (!active) return;
      setGoogleConfigured(config.configured);
      if (!config.configured) return;

      const draw = () => {
        const target = document.getElementById("google-signin-button");
        if (!active || !target || !window.google) return;
        target.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: async ({ credential }) => {
            setAuthMessage("正在驗證 Google 帳號…");
            const response = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-BibleLife-Auth": "google" },
              body: JSON.stringify({ credential }),
            });
            const result = await response.json() as { user?: AuthUser; error?: string };
            if (!response.ok || !result.user) {
              setAuthMessage(result.error ?? "Google 登入失敗");
              return;
            }
            setUserStateReady(false);
            setAuthUser(result.user);
            setShowLogin(false);
            setAuthMessage("");
            notify(`歡迎回來，${result.user.displayName ?? result.user.email}`);
          },
        });
        window.google.accounts.id.renderButton(target, {
          theme: "outline", size: "large", shape: "rectangular", text: "signin_with", locale: "zh_TW", width: 300,
        });
      };

      if (window.google) {
        draw();
        return;
      }
      let script = document.querySelector<HTMLScriptElement>('script[data-biblelife-google="true"]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client?hl=zh_TW";
        script.async = true;
        script.dataset.biblelifeGoogle = "true";
        document.head.append(script);
      }
      script.addEventListener("load", draw, { once: true });
    }

    renderGoogleButton().catch(() => { if (active) setAuthMessage("Google 登入載入失敗，請稍後再試"); });
    return () => { active = false; };
  }, [authUser, showLogin]);

  useEffect(() => {
    if (tab !== "quiz" || quizTopics.length) return;
    let active = true;
    fetch("/api/quiz/catalog", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { topics?: QuizTopic[]; themes?: QuizTheme[]; totalQuestions?: number; error?: string };
        if (!response.ok) throw new Error(result.error ?? "讀取題庫失敗");
        return result;
      })
      .then((result) => {
        if (!active) return;
        setQuizTopics(result.topics ?? []);
        setQuizThemes(result.themes ?? []);
        setQuizTotal(result.totalQuestions ?? 0);
        if (result.topics?.length && !result.topics.some((topic) => topic.code === quizTopic)) setQuizTopic(result.topics[0].code);
        if (result.themes?.length && !result.themes.some((theme) => theme.code === quizTheme)) setQuizTheme(result.themes[0].code);
      })
      .catch((error: Error) => { if (active) setQuizError(error.message); });
    return () => { active = false; };
  }, [quizTheme, quizTopic, quizTopics.length, tab]);

  useEffect(() => {
    if (tab !== "admin" || adminSection !== "users" || !authUser?.isAdmin) return;
    let active = true;
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { users?: AdminUser[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "讀取帳號失敗");
        return result.users ?? [];
      })
      .then((users) => { if (active) setAdminUsers(users); })
      .catch((error: Error) => { if (active) notify(error.message); })
      .finally(() => { if (active) setAdminLoading(false); });
    return () => { active = false; };
  }, [adminSection, authUser, tab]);

  useEffect(() => {
    if (tab !== "admin" || adminSection !== "questions" || !authUser?.isAdmin || adminQuestions.length) return;
    let active = true;
    fetch("/api/admin/questions", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { questions?: AdminQuestion[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "讀取題庫失敗");
        return result.questions ?? [];
      })
      .then((questions) => { if (active) setAdminQuestions(questions); })
      .catch((error: Error) => { if (active) notify(error.message); })
      .finally(() => { if (active) setAdminQuestionLoading(false); });
    return () => { active = false; };
  }, [adminQuestions.length, adminSection, authUser, tab]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function signOut() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      notify("登出失敗，請稍後再試");
      return;
    }
    window.location.reload();
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(`確定要刪除 ${user.displayName ?? user.email} 的帳號與全部保存資料嗎？此操作無法復原。`)) return;
    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      notify(result.error ?? "刪除帳號失敗");
      return;
    }
    setAdminUsers((current) => current.filter((item) => item.id !== user.id));
    notify("使用者帳號與保存資料已刪除");
  }

  function resetQuiz() {
    setQuizQuestions([]);
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizError("");
  }

  function changeQuizMode(mode: QuizMode) {
    setQuizMode(mode);
    resetQuiz();
  }

  async function startQuiz() {
    setQuizLoading(true);
    setQuizError("");
    const parameters = new URLSearchParams({ mode: quizMode, limit: "5" });
    if (quizMode === "topic") parameters.set("topicCode", quizTopic);
    if (quizMode === "mixed") parameters.set("scope", quizScope);
    if (quizMode === "theme") parameters.set("section", quizTheme);
    try {
      const response = await fetch(`/api/quiz/questions?${parameters}`, { cache: "no-store" });
      const result = await response.json() as { questions?: QuizQuestion[]; error?: string };
      if (!response.ok || !result.questions?.length) throw new Error(result.error ?? "這個範圍目前沒有題目");
      setQuizQuestions(result.questions);
      setQuizIndex(0);
      setQuizAnswer(null);
      setQuizScore(0);
      setQuizFinished(false);
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "無法開始測驗");
    } finally {
      setQuizLoading(false);
    }
  }

  function chooseQuizAnswer(index: number) {
    if (quizAnswer !== null || !currentQuizQuestion) return;
    setQuizAnswer(index);
    if (index === currentQuizQuestion.correctIndex) setQuizScore((score) => score + 1);
  }

  async function nextQuizQuestion() {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((index) => index + 1);
      setQuizAnswer(null);
      return;
    }
    setQuizFinished(true);
    if (!authUser) return;
    const templateCode = quizMode === "topic" ? `topic:${quizTopic}` : quizMode === "theme" ? `theme:${quizTheme}` : `mixed:${quizScope}`;
    fetch("/api/quiz/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateCode, score: quizScore, totalQuestions: quizQuestions.length }),
    }).catch(() => undefined);
  }

  async function saveAdminQuestion(question: AdminQuestion) {
    setAdminSaving(true);
    try {
      const isExisting = Boolean(question.id);
      const response = await fetch("/api/admin/questions", {
        method: isExisting ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question),
      });
      const result = await response.json() as { question?: AdminQuestion; error?: string };
      if (!response.ok || !result.question) throw new Error(result.error ?? "儲存題目失敗");
      setAdminQuestions((questions) => isExisting
        ? questions.map((item) => item.id === result.question?.id ? result.question : item)
        : [result.question!, ...questions]);
      setEditingQuestion(null);
      setQuizTopics([]);
      notify(isExisting ? "題目已更新" : "題目已新增");
    } catch (error) {
      notify(error instanceof Error ? error.message : "儲存題目失敗");
    } finally {
      setAdminSaving(false);
    }
  }

  async function deleteAdminQuestion(question: AdminQuestion) {
    if (!window.confirm(`確定要刪除「${question.question}」嗎？此操作無法復原。`)) return;
    const response = await fetch("/api/admin/questions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: question.id }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      notify(result.error ?? "刪除題目失敗");
      return;
    }
    setAdminQuestions((questions) => questions.filter((item) => item.id !== question.id));
    setQuizTopics([]);
    notify("題目已刪除");
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
          {authUser && <span className={`sync-state ${syncState}`}>{syncState === "saving" ? "同步中" : syncState === "error" ? "同步失敗" : "已同步"}</span>}
          <div className="currency"><span>✦</span><b>{coins}</b></div>
          <button className="avatar" onClick={() => setShowLogin(true)} aria-label="開啟帳號選單">
            {authLoading ? "…" : (authUser?.displayName ?? authUser?.email ?? "旅").slice(0, 1).toUpperCase()}
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
                    {insightVerseKey === verseKey && <div className="insight-editor verse-insight-editor">
                      <div><span className="insight-icon">✦</span><div><p className="eyebrow">我的亮光</p><strong>{insightReference}</strong></div><span className={savedNote ? "save-state saved" : "save-state"}>{savedNote ? "已儲存" : "尚未儲存"}</span><button className="insight-close" onClick={() => setInsightVerseKey(null)} aria-label="關閉亮光編輯框">×</button></div>
                      <textarea id="insight-editor" value={note} onChange={(event) => { setNote(event.target.value); setSavedNote(false); }} aria-label="我的亮光筆記" />
                      <div className="insight-actions"><button className="insight-save" onClick={() => { setSavedNote(true); notify("亮光筆記已儲存"); }}>儲存亮光</button></div>
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
            <section className="page-title"><div><p className="eyebrow">BIBLE QUIZ</p><h1>聖經知識測驗</h1><p>每一題都附上和合本經文依據，答完即可核對與複習。</p></div><div className="quiz-score-badge"><strong>{quizTotal || "—"}</strong><span>已發布題目</span></div></section>
            <div className="quiz-layout">
              <section className="quiz-main-card">
                {!quizQuestions.length && !quizFinished && <div className="quiz-setup">
                  <p className="question-kicker">建立測驗</p><h2>{quizMode === "topic" ? "選擇一份分卷測驗" : quizMode === "mixed" ? "設定綜合測驗範圍" : "選擇聖經主題分類"}</h2>
                  {quizMode === "topic" && <label><span>測驗卷範圍</span><select value={quizTopic} onChange={(event) => setQuizTopic(event.target.value)}>{quizTopics.map((topic) => <option key={topic.code} value={topic.code}>{topic.code} · {topic.title}（{topic.questionCount} 題）</option>)}</select></label>}
                  {quizMode === "mixed" && <label><span>隨機範圍</span><select value={quizScope} onChange={(event) => setQuizScope(event.target.value)}><option value="ALL">全聖經</option><option value="OT">舊約</option><option value="NT">新約</option></select></label>}
                  {quizMode === "theme" && <label><span>主題分類</span><select value={quizTheme} onChange={(event) => setQuizTheme(event.target.value)}>{quizThemes.map((theme) => <option key={theme.code} value={theme.code}>{theme.label}（{theme.questionCount} 題）</option>)}</select></label>}
                  <div className="quiz-setup-meta"><span>5 題</span><span>四選一</span><span>附經文解說</span></div>
                  {quizError && <p className="quiz-error">{quizError}</p>}
                  <button className="quiz-start" onClick={startQuiz} disabled={quizLoading || !quizTopics.length}>{quizLoading ? "正在出題…" : "開始測驗"}</button>
                </div>}
                {quizFinished && <div className="quiz-result">
                  <span className="result-seal">{quizScore === quizQuestions.length ? "滿" : "成"}</span>
                  <p className="question-kicker">測驗完成</p><h2>{quizScore} / {quizQuestions.length} 題答對</h2>
                  <p>{quizScore === quizQuestions.length ? "全部答對了！願所讀的話語繼續留在心中。" : "每次回頭查考經文，都是更深認識聖經的一步。"}</p>
                  <button className="quiz-start" onClick={resetQuiz}>再選一份測驗</button>
                </div>}
                {currentQuizQuestion && !quizFinished && <>
                  <div className="quiz-topline"><span>{currentQuizQuestion.topicTitle}</span><span>第 {quizIndex + 1} / {quizQuestions.length} 題</span></div><div className="quiz-line"><i style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} /></div>
                  <p className="question-kicker">{currentQuizQuestion.questionType} · {currentQuizQuestion.difficulty === "easy" ? "入門" : currentQuizQuestion.difficulty === "hard" ? "進階" : "標準"}</p><h2>{currentQuizQuestion.question}</h2>
                  <div className="options">{currentQuizQuestion.options.map((option, index) => {
                    const answered = quizAnswer !== null;
                    const correct = index === currentQuizQuestion.correctIndex;
                    const selected = quizAnswer === index;
                    return <button key={`${currentQuizQuestion.id}-${index}`} className={`${selected ? "selected" : ""} ${answered && correct ? "correct" : ""} ${answered && selected && !correct ? "wrong" : ""}`} onClick={() => chooseQuizAnswer(index)} disabled={answered}><span>{String.fromCharCode(65 + index)}</span>{option}{answered && correct && <b>✓</b>}</button>;
                  })}</div>
                  {quizAnswer !== null && <div className={`answer-note ${quizAnswer === currentQuizQuestion.correctIndex ? "right" : "try"}`}><strong>{quizAnswer === currentQuizQuestion.correctIndex ? "答對了！" : "再複習一次"}</strong><p>{currentQuizQuestion.explanation} 經文依據：{currentQuizQuestion.reference}。</p><button onClick={nextQuizQuestion}>{quizIndex === quizQuestions.length - 1 ? "查看成績 →" : "下一題 →"}</button></div>}
                </>}
              </section>
              <aside className="quiz-types"><p className="eyebrow">選擇測驗</p><button className={quizMode === "topic" ? "active" : ""} onClick={() => changeQuizMode("topic")}><span>冊</span><div><strong>單卷／分卷</strong><small>依預定章節範圍挑戰</small></div></button><button className={quizMode === "mixed" ? "active" : ""} onClick={() => changeQuizMode("mixed")}><span>綜</span><div><strong>綜合測驗</strong><small>全書、舊約或新約隨機出題</small></div></button><button className={quizMode === "theme" ? "active" : ""} onClick={() => changeQuizMode("theme")}><span>題</span><div><strong>主題測驗</strong><small>福音書、書信、先知書等</small></div></button><div className="coming-note"><strong>{quizTotal || 490} 題首批題庫</strong><p>涵蓋「測驗卷主題」全部 98 個範圍，每題均可回查和合本經文。</p></div></aside>
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

        {tab === "admin" && (
          <div className="page content-page admin-page">
            <section className="page-title"><div><p className="eyebrow">ADMIN CONSOLE</p><h1>管理員後台</h1><p>管理使用者帳號與聖經測驗題庫。</p></div><div className="compact-stat"><strong>{adminSection === "users" ? adminUsers.length : adminQuestions.length || 490}</strong><span>{adminSection === "users" ? "使用者" : "題目"}</span></div></section>
            {!authUser?.isAdmin ? <section className="admin-empty"><h2>無法開啟管理後台</h2><p>此頁面僅限管理員使用。</p></section> : (
              <>
                <div className="admin-tabs"><button className={adminSection === "users" ? "active" : ""} onClick={() => { setAdminSection("users"); setAdminLoading(true); }}>使用者帳號</button><button className={adminSection === "questions" ? "active" : ""} onClick={() => { setAdminSection("questions"); setAdminQuestionLoading(true); }}>題庫管理</button></div>
                {adminSection === "users" && <section className="admin-panel">
                  <div className="admin-panel-head"><div><h2>使用者帳號</h2><p>刪除帳號會一併刪除該使用者的登入工作階段與永久保存資料。</p></div><button onClick={() => setTab("home")}>返回網站</button></div>
                  {adminLoading ? <p className="admin-status">正在讀取帳號…</p> : adminUsers.length === 0 ? <p className="admin-status">目前沒有使用者資料。</p> : <div className="admin-users">
                    {adminUsers.map((user) => <article className="admin-user" key={user.id}>
                      <span className="admin-avatar">{(user.displayName ?? user.email).slice(0, 1).toUpperCase()}</span>
                      <div><strong>{user.displayName ?? "未設定名稱"}</strong><span>{user.email}</span><small>加入：{new Date(user.createdAt).toLocaleDateString("zh-TW")} · {user.lastLoginAt ? `最近登入：${new Date(user.lastLoginAt).toLocaleDateString("zh-TW")}` : "尚無登入紀錄"}</small></div>
                      <span className={`role-badge ${user.role}`}>{user.role === "admin" ? "管理員" : "使用者"}</span>
                      <button className="danger-button" disabled={user.id === authUser.id || user.role === "admin"} onClick={() => deleteUser(user)}>{user.id === authUser.id ? "目前帳號" : user.role === "admin" ? "受保護" : "刪除帳號"}</button>
                    </article>)}
                  </div>}
                </section>}
                {adminSection === "questions" && <section className="admin-panel question-admin-panel">
                  <div className="admin-panel-head"><div><h2>聖經題庫</h2><p>可搜尋、修改、停用、建立或刪除題目；只有「已發布」題目會出現在測驗中。</p></div><button className="primary-admin-action" onClick={() => setEditingQuestion({ ...emptyAdminQuestion, options: [...emptyAdminQuestion.options] })}>＋ 新增題目</button></div>
                  <div className="question-admin-tools"><input type="search" value={adminQuestionSearch} onChange={(event) => setAdminQuestionSearch(event.target.value)} placeholder="搜尋題目、書卷、出處或測驗卷代碼" aria-label="搜尋題庫" /><span>{filteredAdminQuestions.length} 題</span></div>
                  {adminQuestionLoading ? <p className="admin-status">正在讀取題庫…</p> : filteredAdminQuestions.length === 0 ? <p className="admin-status">找不到符合條件的題目。</p> : <div className="admin-questions">
                    {filteredAdminQuestions.slice(0, 100).map((question) => <article className="admin-question" key={question.id}>
                      <div className="admin-question-meta"><span>{question.topicCode} · {question.topicTitle}</span><span className={`question-status ${question.status}`}>{question.status === "active" ? "已發布" : question.status === "draft" ? "草稿" : "已停用"}</span></div>
                      <h3>{question.question}</h3><p>{question.reference} · {question.questionType}</p>
                      <div className="admin-question-actions"><button onClick={() => setEditingQuestion({ ...question, options: [...question.options] })}>修改</button><button className="danger-link" onClick={() => deleteAdminQuestion(question)}>刪除</button></div>
                    </article>)}
                    {filteredAdminQuestions.length > 100 && <p className="admin-list-note">目前顯示前 100 題，請使用搜尋縮小範圍。</p>}
                  </div>}
                </section>}
                {editingQuestion && <AdminQuestionEditor question={editingQuestion} saving={adminSaving} onCancel={() => setEditingQuestion(null)} onSave={saveAdminQuestion} />}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="site-footer"><p>如有違反版權，請來信告知，會盡速處理。</p><a href="mailto:kevin770726@gmail.com">kevin770726@gmail.com</a></footer>

      <nav className="mobile-nav" aria-label="行動版導覽">{navItems.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.mark}</span>{item.label}</button>)}</nav>

      {showSource && <div className="modal-backdrop"><section className="source-modal" role="dialog" aria-modal="true" aria-labelledby="source-title"><button className="modal-close" onClick={() => setShowSource(false)} aria-label="關閉">×</button><p className="eyebrow">SCRIPTURE SOURCE</p><h2 id="source-title">經文版本與資料來源</h2><dl><div><dt>版本</dt><dd>新標點和合本（CUVt）</dd></div><div><dt>資料識別</dt><dd>cmn-cu89t</dd></div><div><dt>授權</dt><dd>Public Domain</dd></div><div><dt>來源</dt><dd><a href="https://ebible.org/bible/details.php?all=1&id=cmn-cu89t" target="_blank" rel="noreferrer">eBible.org 版本說明</a></dd></div><div><dt>完整性</dt><dd>66 卷 · 1,189 章；保留來源中的合併節號與缺節編排，不自行補寫經文。</dd></div></dl><p className="source-note">本網站以 USFM 原始資料產生逐卷經文檔，並保存來源檔案的 SHA-256 校驗值。</p></section></div>}

      {showLogin && <div className="modal-backdrop"><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="modal-close" onClick={() => setShowLogin(false)} aria-label="關閉">×</button><span className="brand-seal large">光</span><p className="eyebrow">保存你的讀經旅程</p>{authUser ? <>
        <h2 id="login-title">{authUser.displayName ?? "歡迎回來"}</h2><p className="account-email">{authUser.email}</p><p className="modal-copy">讀經進度、金句、劃記與亮光會自動保存。{syncState === "error" ? "目前同步失敗，請稍後再試。" : "目前資料已連結至此帳號。"}</p>
        {authUser.isAdmin && <button className="login-option admin-entry" onClick={() => { setAdminLoading(true); setTab("admin"); setShowLogin(false); }}>管理員後台</button>}
        <button className="login-option muted" onClick={signOut}>登出</button>
      </> : <>
        <h2 id="login-title">使用 Google 帳號登入</h2><p className="modal-copy">網站可直接閱讀；登入後會跨裝置永久保存你的進度、收藏、劃記與亮光。</p>
        <div id="google-signin-button" className="google-signin-slot" aria-live="polite" />
        {googleConfigured === false && <p className="auth-warning">Google 登入尚待管理員完成 Client ID 設定。</p>}
        {googleConfigured === null && <p className="auth-status">正在載入登入服務…</p>}
        {authMessage && <p className="auth-warning">{authMessage}</p>}
      </>}</section></div>}

      {toast && <div className="toast" role="status">{toast}</div>}
      <span className="version-badge">v0.4.0</span>
    </div>
  );
}

function AdminQuestionEditor({ question, saving, onCancel, onSave }: {
  question: AdminQuestion;
  saving: boolean;
  onCancel(): void;
  onSave(question: AdminQuestion): void;
}) {
  const [draft, setDraft] = useState<AdminQuestion>(question);
  const update = <K extends keyof AdminQuestion>(key: K, value: AdminQuestion[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateOption = (index: number, value: string) => setDraft((current) => ({
    ...current,
    options: current.options.map((option, optionIndex) => optionIndex === index ? value : option),
  }));

  return <div className="modal-backdrop question-editor-backdrop"><form className="question-editor" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
    <div className="question-editor-head"><div><p className="eyebrow">QUESTION EDITOR</p><h2>{draft.id ? "修改題目" : "新增題目"}</h2></div><button type="button" className="modal-close" onClick={onCancel} aria-label="關閉">×</button></div>
    <div className="question-editor-grid">
      <label><span>測驗卷代碼</span><input value={draft.topicCode} onChange={(event) => update("topicCode", event.target.value)} required /></label>
      <label className="wide"><span>測驗卷名稱</span><input value={draft.topicTitle} onChange={(event) => update("topicTitle", event.target.value)} required /></label>
      <label><span>書卷代碼</span><input value={draft.bookCodes} onChange={(event) => update("bookCodes", event.target.value.toUpperCase())} required /></label>
      <label><span>書卷名稱</span><input value={draft.bookName} onChange={(event) => update("bookName", event.target.value)} required /></label>
      <label><span>約別</span><select value={draft.testament} onChange={(event) => update("testament", event.target.value)}><option>舊約</option><option>新約</option></select></label>
      <label><span>主題分類</span><select value={draft.section} onChange={(event) => update("section", event.target.value)}><option value="pentateuch">摩西五經</option><option value="history">歷史書</option><option value="poetry">詩歌智慧書</option><option value="major_prophets">大先知書</option><option value="minor_prophets">小先知書</option><option value="gospels">四福音書</option><option value="acts">使徒行傳</option><option value="pauline">保羅書信</option><option value="general_epistles">普通書信</option><option value="prophecy">啟示文學</option></select></label>
      <label><span>起始章</span><input type="number" min="1" max="150" value={draft.chapterStart} onChange={(event) => update("chapterStart", Number(event.target.value))} required /></label>
      <label><span>結束章</span><input type="number" min="1" max="150" value={draft.chapterEnd} onChange={(event) => update("chapterEnd", Number(event.target.value))} required /></label>
      <label><span>題型</span><select value={draft.questionType} onChange={(event) => update("questionType", event.target.value as AdminQuestion["questionType"])}><option>內容理解</option><option>經文辨識</option><option>出處辨識</option></select></label>
      <label><span>難度</span><select value={draft.difficulty} onChange={(event) => update("difficulty", event.target.value as AdminQuestion["difficulty"])}><option value="easy">入門</option><option value="medium">標準</option><option value="hard">進階</option></select></label>
      <label className="full"><span>題目</span><textarea value={draft.question} onChange={(event) => update("question", event.target.value)} required /></label>
      {draft.options.map((option, index) => <label className="option-field" key={index}><span>選項 {String.fromCharCode(65 + index)} {draft.correctIndex === index && "（正確答案）"}</span><div><input type="radio" name="correct-answer" checked={draft.correctIndex === index} onChange={() => update("correctIndex", index)} aria-label={`將選項 ${String.fromCharCode(65 + index)} 設為正確答案`} /><textarea value={option} onChange={(event) => updateOption(index, event.target.value)} required /></div></label>)}
      <label className="full"><span>答案解說</span><textarea value={draft.explanation} onChange={(event) => update("explanation", event.target.value)} required /></label>
      <label className="wide"><span>經文依據</span><input value={draft.reference} onChange={(event) => update("reference", event.target.value)} placeholder="例如：創世記 1:1" required /></label>
      <label><span>發布狀態</span><select value={draft.status} onChange={(event) => update("status", event.target.value as AdminQuestion["status"])}><option value="active">已發布</option><option value="draft">草稿</option><option value="disabled">已停用</option></select></label>
    </div>
    <div className="question-editor-actions"><button type="button" onClick={onCancel}>取消</button><button type="submit" className="save-question" disabled={saving}>{saving ? "儲存中…" : "儲存題目"}</button></div>
  </form></div>;
}
