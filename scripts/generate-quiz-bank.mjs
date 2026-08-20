import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bibleDirectory = path.join(root, "public", "bible", "cuvt");
const topicPath = path.join(root, "測驗卷主題.txt");
const outputPath = path.join(root, "data", "quiz-bank.json");
const reportPath = path.join(root, "data", "quiz-bank-report.json");
const seedPath = path.join(root, "data", "quiz-seed.sql");

const sectionNames = {
  pentateuch: "摩西五經",
  history: "歷史書",
  poetry: "詩歌智慧書",
  major_prophets: "大先知書",
  minor_prophets: "小先知書",
  gospels: "四福音書",
  acts: "使徒行傳",
  pauline: "保羅書信",
  general_epistles: "普通書信",
  prophecy: "啟示文學",
};

const sectionByCode = new Map();
for (const code of ["GEN", "EXO", "LEV", "NUM", "DEU"]) sectionByCode.set(code, "pentateuch");
for (const code of ["JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST"]) sectionByCode.set(code, "history");
for (const code of ["JOB", "PSA", "PRO", "ECC", "SNG"]) sectionByCode.set(code, "poetry");
for (const code of ["ISA", "JER", "LAM", "EZK", "DAN"]) sectionByCode.set(code, "major_prophets");
for (const code of ["HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"]) sectionByCode.set(code, "minor_prophets");
for (const code of ["MAT", "MRK", "LUK", "JHN"]) sectionByCode.set(code, "gospels");
sectionByCode.set("ACT", "acts");
for (const code of ["ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM"]) sectionByCode.set(code, "pauline");
for (const code of ["HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD"]) sectionByCode.set(code, "general_epistles");
sectionByCode.set("REV", "prophecy");

const books = fs.readdirSync(bibleDirectory)
  .filter((file) => file.endsWith(".json") && file !== "index.json")
  .map((file) => JSON.parse(fs.readFileSync(path.join(bibleDirectory, file), "utf8")))
  .sort((a, b) => a.order - b.order);
const booksByCode = new Map(books.map((book) => [book.code, book]));
const booksByName = [...books].sort((a, b) => b.name.length - a.name.length);

function normalizeText(text, maxLength = 76) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= maxLength ? clean : `${clean.slice(0, maxLength - 1)}…`;
}

function quoteExcerpt(text) {
  return normalizeText(text, 52).replace(/^「/, "").replace(/」$/, "");
}

function usefulVerses(book, chapterStart = 1, chapterEnd = book.chapterCount) {
  return book.chapters
    .filter((chapter) => chapter.number >= chapterStart && chapter.number <= chapterEnd)
    .flatMap((chapter) => chapter.verses.map((verse) => ({
      book,
      chapter: chapter.number,
      verse: verse.number,
      text: normalizeText(verse.text),
      reference: `${book.name} ${chapter.number}:${verse.number}`,
    })))
    .filter((item) => item.text.length >= 14 && item.text.length <= 77);
}

const versePools = new Map(books.map((book) => [book.code, usefulVerses(book)]));
const allVerses = books.flatMap((book) => versePools.get(book.code));

function parseTopic(line) {
  const match = line.match(/^(\d+(?:-\d+)?)\s+(.+?)\s*(?:綜合)?測驗卷$/);
  if (!match) throw new Error(`無法解析題庫主題：${line}`);
  const [, code, title] = match;
  let topicBooks;
  if (title.includes("約翰二書&約翰三書")) {
    topicBooks = [booksByCode.get("2JN"), booksByCode.get("3JN")];
  } else {
    const aliases = new Map([["腓利比書", "PHP"], ["何西亞書", "HOS"]]);
    const alias = [...aliases.entries()].find(([name]) => title.includes(name));
    const found = alias ? booksByCode.get(alias[1]) : booksByName.find((book) => title.includes(book.name));
    if (!found) throw new Error(`找不到主題書卷：${line}`);
    topicBooks = [found];
  }
  const range = title.match(/(\d+)\s*~\s*(\d+)/);
  const inferredProverbsSecondHalf = title.includes("箴言(二)");
  const chapterStart = range ? Number(range[1]) : inferredProverbsSecondHalf ? 13 : 1;
  const chapterEnd = range ? Number(range[2]) : Math.max(...topicBooks.map((book) => book.chapterCount));
  const primary = topicBooks[0];
  return {
    code,
    title,
    books: topicBooks,
    bookCodes: topicBooks.map((book) => book.code).join(","),
    bookName: topicBooks.map((book) => book.name).join("、"),
    testament: primary.testament,
    section: sectionByCode.get(primary.code),
    chapterStart,
    chapterEnd,
  };
}

function deterministicShuffle(values, seed) {
  const output = [...values];
  let state = [...seed].reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0, 2166136261);
  for (let index = output.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function pickDistinct(pool, count, seed, excluded = new Set()) {
  const unique = [];
  const seenText = new Set(excluded);
  for (const item of deterministicShuffle(pool, seed)) {
    if (seenText.has(item.text)) continue;
    seenText.add(item.text);
    unique.push(item);
    if (unique.length === count) break;
  }
  if (unique.length < count) throw new Error(`題目選項不足：${seed}`);
  return unique;
}

function topicVersePool(topic) {
  return topic.books.flatMap((book) => usefulVerses(
    book,
    topic.books.length > 1 ? 1 : topic.chapterStart,
    topic.books.length > 1 ? book.chapterCount : Math.min(topic.chapterEnd, book.chapterCount),
  ));
}

function makeQuestion(topic, questionIndex) {
  const targetPool = topicVersePool(topic);
  if (targetPool.length < 5) throw new Error(`${topic.code} ${topic.title} 可用經節不足`);
  const target = targetPool[Math.floor(((questionIndex + 0.5) / 5) * targetPool.length)];
  const seed = `${topic.code}-${questionIndex + 1}`;
  let question;
  let questionType;
  let options;
  let correctValue;

  if (questionIndex % 2 === 0) {
    questionType = "經文辨識";
    question = `根據《${topic.title}》的內容，以下哪一句經文出自這個範圍？`;
    const outsideTopic = allVerses.filter((item) => !targetPool.some((candidate) => candidate.reference === item.reference));
    const preferred = outsideTopic.filter((item) => sectionByCode.get(item.book.code) === topic.section);
    const distractors = pickDistinct(preferred.length >= 3 ? preferred : outsideTopic, 3, `${seed}-passages`, new Set([target.text]));
    correctValue = target.text;
    options = [correctValue, ...distractors.map((item) => item.text)];
  } else {
    questionType = "出處辨識";
    question = `「${quoteExcerpt(target.text)}」的經文出處是哪裡？`;
    const references = pickDistinct(targetPool, 3, `${seed}-references`, new Set([target.text, target.reference]));
    correctValue = target.reference;
    options = [correctValue, ...references.map((item) => item.reference)];
  }

  const shuffledOptions = deterministicShuffle(options, seed);
  return {
    id: `seed-${topic.code.replace(/-/g, "_")}-${questionIndex + 1}`,
    topicCode: topic.code,
    topicTitle: topic.title,
    bookCodes: topic.bookCodes,
    bookName: topic.bookName,
    testament: topic.testament,
    section: topic.section,
    sectionName: sectionNames[topic.section],
    chapterStart: topic.chapterStart,
    chapterEnd: topic.chapterEnd,
    questionType,
    question,
    options: shuffledOptions,
    correctIndex: shuffledOptions.indexOf(correctValue),
    explanation: `正確內容記載於 ${target.reference}。`,
    reference: target.reference,
    difficulty: questionType === "經文辨識" ? "medium" : "easy",
    status: "active",
  };
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

const topicLines = fs.readFileSync(topicPath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const topics = topicLines.map(parseTopic);
const questions = topics.flatMap((topic) => Array.from({ length: 5 }, (_, index) => makeQuestion(topic, index)));
const publicTopics = topics.map((topic) => ({
  code: topic.code,
  title: topic.title,
  bookCodes: topic.bookCodes,
  bookName: topic.bookName,
  testament: topic.testament,
  section: topic.section,
  chapterStart: topic.chapterStart,
  chapterEnd: topic.chapterEnd,
}));

const duplicateIds = questions.filter((question, index) => questions.findIndex((candidate) => candidate.id === question.id) !== index);
if (duplicateIds.length) throw new Error(`題目 ID 重複：${duplicateIds.map((item) => item.id).join(", ")}`);
for (const question of questions) {
  if (question.options.length !== 4 || new Set(question.options).size !== 4) throw new Error(`${question.id} 選項不是四個相異值`);
  if (question.correctIndex < 0 || question.correctIndex > 3) throw new Error(`${question.id} 正確答案索引錯誤`);
  if (!allVerses.some((verse) => verse.reference === question.reference)) throw new Error(`${question.id} 經文出處不存在`);
}

fs.writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), topics: publicTopics, questions }, null, 2)}\n`);
fs.writeFileSync(reportPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "eBible CUVt + 測驗卷主題.txt",
  topicCount: topics.length,
  questionCount: questions.length,
  questionTypes: Object.fromEntries(Object.entries(Object.groupBy(questions, (question) => question.questionType)).map(([key, value]) => [key, value.length])),
  sections: Object.fromEntries(Object.entries(Object.groupBy(questions, (question) => question.sectionName)).map(([key, value]) => [key, value.length])),
  validation: { fourDistinctOptions: true, correctIndexInRange: true, referencesExistInCuvt: true },
}, null, 2)}\n`);

const columns = [
  "id", "topic_code", "topic_title", "book_codes", "book_name", "testament", "section", "chapter_start", "chapter_end",
  "question_type", "question", "option_a", "option_b", "option_c", "option_d", "correct_index", "explanation", "reference", "difficulty", "status",
];
const statements = questions.map((question) => {
  const values = [
    question.id, question.topicCode, question.topicTitle, question.bookCodes, question.bookName, question.testament, question.section,
    question.chapterStart, question.chapterEnd, question.questionType, question.question, ...question.options, question.correctIndex,
    question.explanation, question.reference, question.difficulty, question.status,
  ];
  return `INSERT INTO quiz_questions (${columns.join(", ")}) VALUES (${values.map(sqlValue).join(", ")}) ON CONFLICT(id) DO NOTHING;`;
});
fs.writeFileSync(seedPath, `${statements.join("\n--> statement-breakpoint\n")}\n`);

const migrationArgument = process.argv.find((argument) => argument.startsWith("--migration="));
if (migrationArgument) {
  const migrationPath = path.resolve(root, migrationArgument.slice("--migration=".length));
  const marker = "-- BibleLife generated quiz bank seed";
  const currentMigration = fs.readFileSync(migrationPath, "utf8")
    .split(marker)[0]
    .replace(/(?:\s*--> statement-breakpoint\s*)+$/g, "")
    .trimEnd();
  fs.writeFileSync(migrationPath, `${currentMigration}\n--> statement-breakpoint\n${marker}\n${statements.join("\n--> statement-breakpoint\n")}\n--> statement-breakpoint\nPRAGMA optimize;\n`);
}

console.log(`Generated ${questions.length} questions across ${topics.length} topics.`);
