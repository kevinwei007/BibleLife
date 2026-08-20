import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(projectRoot, "data", "source", "cuvt-usfm");
const sourceArchive = path.join(projectRoot, "data", "source", "cmn-cu89t_usfm.zip");
const outputDir = path.join(projectRoot, "public", "bible", "cuvt");
const reportPath = path.join(projectRoot, "data", "cuvt-import-report.json");

async function ensureSourceFiles() {
  try {
    await access(sourceDir);
    const files = await readdir(sourceDir);
    if (files.some((name) => name.endsWith(".usfm"))) return;
  } catch {
    // The extracted directory is generated from the retained source archive.
  }
  await mkdir(sourceDir, { recursive: true });
  execFileSync("tar", ["-xf", sourceArchive, "-C", sourceDir], { stdio: "inherit" });
}

const BOOKS = [
  ["GEN", "創世記", "創", "舊約"], ["EXO", "出埃及記", "出", "舊約"], ["LEV", "利未記", "利", "舊約"],
  ["NUM", "民數記", "民", "舊約"], ["DEU", "申命記", "申", "舊約"], ["JOS", "約書亞記", "書", "舊約"],
  ["JDG", "士師記", "士", "舊約"], ["RUT", "路得記", "得", "舊約"], ["1SA", "撒母耳記上", "撒上", "舊約"],
  ["2SA", "撒母耳記下", "撒下", "舊約"], ["1KI", "列王紀上", "王上", "舊約"], ["2KI", "列王紀下", "王下", "舊約"],
  ["1CH", "歷代志上", "代上", "舊約"], ["2CH", "歷代志下", "代下", "舊約"], ["EZR", "以斯拉記", "拉", "舊約"],
  ["NEH", "尼希米記", "尼", "舊約"], ["EST", "以斯帖記", "斯", "舊約"], ["JOB", "約伯記", "伯", "舊約"],
  ["PSA", "詩篇", "詩", "舊約"], ["PRO", "箴言", "箴", "舊約"], ["ECC", "傳道書", "傳", "舊約"],
  ["SNG", "雅歌", "歌", "舊約"], ["ISA", "以賽亞書", "賽", "舊約"], ["JER", "耶利米書", "耶", "舊約"],
  ["LAM", "耶利米哀歌", "哀", "舊約"], ["EZK", "以西結書", "結", "舊約"], ["DAN", "但以理書", "但", "舊約"],
  ["HOS", "何西阿書", "何", "舊約"], ["JOL", "約珥書", "珥", "舊約"], ["AMO", "阿摩司書", "摩", "舊約"],
  ["OBA", "俄巴底亞書", "俄", "舊約"], ["JON", "約拿書", "拿", "舊約"], ["MIC", "彌迦書", "彌", "舊約"],
  ["NAM", "那鴻書", "鴻", "舊約"], ["HAB", "哈巴谷書", "哈", "舊約"], ["ZEP", "西番雅書", "番", "舊約"],
  ["HAG", "哈該書", "該", "舊約"], ["ZEC", "撒迦利亞書", "亞", "舊約"], ["MAL", "瑪拉基書", "瑪", "舊約"],
  ["MAT", "馬太福音", "太", "新約"], ["MRK", "馬可福音", "可", "新約"], ["LUK", "路加福音", "路", "新約"],
  ["JHN", "約翰福音", "約", "新約"], ["ACT", "使徒行傳", "徒", "新約"], ["ROM", "羅馬書", "羅", "新約"],
  ["1CO", "哥林多前書", "林前", "新約"], ["2CO", "哥林多後書", "林後", "新約"], ["GAL", "加拉太書", "加", "新約"],
  ["EPH", "以弗所書", "弗", "新約"], ["PHP", "腓立比書", "腓", "新約"], ["COL", "歌羅西書", "西", "新約"],
  ["1TH", "帖撒羅尼迦前書", "帖前", "新約"], ["2TH", "帖撒羅尼迦後書", "帖後", "新約"], ["1TI", "提摩太前書", "提前", "新約"],
  ["2TI", "提摩太後書", "提後", "新約"], ["TIT", "提多書", "多", "新約"], ["PHM", "腓利門書", "門", "新約"],
  ["HEB", "希伯來書", "來", "新約"], ["JAS", "雅各書", "雅", "新約"], ["1PE", "彼得前書", "彼前", "新約"],
  ["2PE", "彼得後書", "彼後", "新約"], ["1JN", "約翰一書", "約一", "新約"], ["2JN", "約翰二書", "約二", "新約"],
  ["3JN", "約翰三書", "約三", "新約"], ["JUD", "猶大書", "猶", "新約"], ["REV", "啟示錄", "啟", "新約"],
].map(([code, name, short, testament], index) => ({ code, name, short, testament, order: index + 1 }));

function cleanInline(text) {
  return text
    .replace(/\\f\s[\s\S]*?\\f\*/g, "")
    .replace(/\\\+?(?:add|pn|qs)\*?/g, "")
    .replace(/\\(?:fr|ft|fv)\b/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

function parseVerseLabel(label) {
  const [startText, endText] = label.split("-");
  const start = Number.parseInt(startText, 10);
  const end = Number.parseInt(endText ?? startText, 10);
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) {
    throw new Error(`Invalid verse label: ${label}`);
  }
  return { start, end, display: start === end ? String(start) : `${start}–${end}` };
}

function parseUsfm(raw, meta) {
  const withoutFootnotes = raw.replace(/\\f\s[\s\S]*?\\f\*/g, "");
  const lines = withoutFootnotes.replace(/^\uFEFF/, "").split(/\r?\n/);
  const chapters = [];
  let currentChapter = null;
  let currentVerse = null;
  let pendingHeading = null;
  let sourceTitle = meta.name;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const markerMatch = line.match(/^\\([^\s]+)\s*(.*)$/);
    if (!markerMatch) {
      if (currentVerse) currentVerse.text = cleanInline(`${currentVerse.text} ${line}`);
      continue;
    }

    const [, marker, contentRaw] = markerMatch;
    const content = cleanInline(contentRaw);
    if (marker === "toc1" || marker === "h") {
      if (content) sourceTitle = content;
      continue;
    }
    if (marker === "c") {
      const chapterNumber = Number.parseInt(content, 10);
      currentChapter = { number: chapterNumber, verses: [] };
      chapters.push(currentChapter);
      currentVerse = null;
      pendingHeading = null;
      continue;
    }
    if (["s1", "s2", "ms1", "d", "sp"].includes(marker)) {
      if (content) pendingHeading = content;
      continue;
    }
    if (marker === "v") {
      if (!currentChapter) throw new Error(`${meta.code}: verse before chapter`);
      const verseMatch = contentRaw.match(/^(\d+(?:-\d+)?)\s*(.*)$/);
      if (!verseMatch) throw new Error(`${meta.code}: malformed verse ${contentRaw}`);
      const parsedLabel = parseVerseLabel(verseMatch[1]);
      currentVerse = {
        number: parsedLabel.display,
        startVerse: parsedLabel.start,
        endVerse: parsedLabel.end,
        text: cleanInline(verseMatch[2]),
        ...(pendingHeading ? { heading: pendingHeading } : {}),
      };
      pendingHeading = null;
      currentChapter.verses.push(currentVerse);
      continue;
    }
    if (["q1", "m"].includes(marker) && content && currentVerse) {
      const separator = marker === "q1" ? "\n" : " ";
      currentVerse.text = cleanInline(`${currentVerse.text}${separator}${content}`);
    }
  }

  return { ...meta, sourceTitle, chapterCount: chapters.length, chapters };
}

await ensureSourceFiles();
await mkdir(outputDir, { recursive: true });
const sourceFiles = (await readdir(sourceDir)).filter((name) => name.endsWith(".usfm"));
const archiveHash = createHash("sha256").update(await readFile(sourceArchive)).digest("hex");
const importedBooks = [];
let verseRecordCount = 0;
let verseSlotCount = 0;
let combinedCharacterCount = 0;
let bridgedVerseRecordCount = 0;
const verseNumberGaps = [];

for (const meta of BOOKS) {
  const filename = sourceFiles.find((name) => name.includes(`-${meta.code}cmn-cu89t.usfm`));
  if (!filename) throw new Error(`Missing USFM source for ${meta.code}`);
  const raw = await readFile(path.join(sourceDir, filename), "utf8");
  const book = parseUsfm(raw, meta);
  for (const [chapterIndex, chapter] of book.chapters.entries()) {
    if (chapter.number !== chapterIndex + 1) throw new Error(`${meta.code}: non-contiguous chapters`);
    let expectedVerse = 1;
    for (const verse of chapter.verses) {
      if (verse.startVerse > expectedVerse) {
        verseNumberGaps.push(`${meta.code} ${chapter.number}:${expectedVerse}–${verse.startVerse - 1}`);
      }
      verseRecordCount += 1;
      verseSlotCount += verse.endVerse - verse.startVerse + 1;
      if (verse.endVerse > verse.startVerse) bridgedVerseRecordCount += 1;
      combinedCharacterCount += verse.text.replace(/\s/g, "").length;
      expectedVerse = verse.endVerse + 1;
    }
  }
  importedBooks.push(book);
  await writeFile(path.join(outputDir, `${meta.code}.json`), `${JSON.stringify(book)}\n`, "utf8");
}

const chapterCount = importedBooks.reduce((sum, book) => sum + book.chapterCount, 0);
if (importedBooks.length !== 66) throw new Error(`Expected 66 books, got ${importedBooks.length}`);
if (chapterCount !== 1189) throw new Error(`Expected 1,189 chapters, got ${chapterCount}`);

const generatedAt = new Date().toISOString();
const index = {
  version: {
    id: "cmn-cu89t",
    abbreviation: "CUVt",
    name: "新標點和合本",
    englishName: "Chinese Union Version (traditional)",
    language: "zh-Hant",
    license: "Public Domain",
    sourceUrl: "https://ebible.org/bible/details.php?all=1&id=cmn-cu89t",
    downloadUrl: "https://ebible.org/Scriptures/cmn-cu89t_usfm.zip",
    sourceArchiveSha256: archiveHash,
    sourceFilesDate: "2025-12-12",
    generatedAt,
  },
  totals: {
    books: importedBooks.length,
    chapters: chapterCount,
    verseRecords: verseRecordCount,
    verseSlots: verseSlotCount,
    bridgedVerseRecords: bridgedVerseRecordCount,
    verseNumberGaps: verseNumberGaps.length,
    chineseCharactersApprox: combinedCharacterCount,
  },
  validation: {
    expectedBooks: 66,
    expectedChapters: 1189,
    verseNumberGaps,
    note: "Verse bridges are preserved as supplied by the eBible USFM source; omitted verse numbers are reported rather than invented.",
  },
  books: importedBooks.map(({ code, name, short, testament, order, chapterCount }) => ({
    code, name, short, testament, order, chapterCount, dataUrl: `/bible/cuvt/${code}.json`,
  })),
};

await writeFile(path.join(outputDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
await writeFile(reportPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(JSON.stringify(index.totals, null, 2));
console.log(`SHA-256 ${archiveHash}`);
