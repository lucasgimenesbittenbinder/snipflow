import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export type Snippet = {
  name: string;
  content: string;
  createdAt: string;
};

export type SnippetHistoryItem = {
  name: string;
  usedAt: string;
};

const STORAGE_DIR = path.join(os.homedir(), ".snipflow");
const STORAGE_FILE = path.join(STORAGE_DIR, "snippets.json");
const HISTORY_FILE = path.join(STORAGE_DIR, "history.json");
const HISTORY_LIMIT = 20;

function ensureStorage(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify([], null, 2), "utf8");
  }

  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

export function loadSnippets(): Snippet[] {
  ensureStorage();

  try {
    const data = fs.readFileSync(STORAGE_FILE, "utf8");
    return JSON.parse(data) as Snippet[];
  } catch {
    throw new Error(`Could not read snippets from ${STORAGE_FILE}`);
  }
}

export function saveSnippets(snippets: Snippet[]): void {
  ensureStorage();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(snippets, null, 2), "utf8");
}

export function loadHistory(): SnippetHistoryItem[] {
  ensureStorage();

  try {
    const data = fs.readFileSync(HISTORY_FILE, "utf8");
    return JSON.parse(data) as SnippetHistoryItem[];
  } catch {
    throw new Error(`Could not read history from ${HISTORY_FILE}`);
  }
}

export function saveHistory(history: SnippetHistoryItem[]): void {
  ensureStorage();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
}

export function recordSnippetUsage(name: string): void {
  const nextItem = {
    name,
    usedAt: new Date().toISOString()
  };
  const history = loadHistory().filter((item) => item.name !== name);

  saveHistory([nextItem, ...history].slice(0, HISTORY_LIMIT));
}

export function removeSnippetFromHistory(name: string): void {
  saveHistory(loadHistory().filter((item) => item.name !== name));
}

export function loadRecentSnippets(): Snippet[] {
  const snippets = loadSnippets();
  const snippetsByName = new Map(snippets.map((snippet) => [snippet.name, snippet]));

  return loadHistory()
    .map((item) => snippetsByName.get(item.name))
    .filter((snippet): snippet is Snippet => snippet !== undefined);
}

export function loadRecentHistory(): Array<Snippet & { usedAt: string }> {
  const snippets = loadSnippets();
  const snippetsByName = new Map(snippets.map((snippet) => [snippet.name, snippet]));

  return loadHistory()
    .map((item) => {
      const snippet = snippetsByName.get(item.name);

      if (!snippet) {
        return undefined;
      }

      return {
        ...snippet,
        usedAt: item.usedAt
      };
    })
    .filter((snippet): snippet is Snippet & { usedAt: string } => snippet !== undefined);
}

export function findSnippetByName(name: string): Snippet | undefined {
  return loadSnippets().find((snippet) => snippet.name === name);
}

export function addSnippet(snippet: Snippet): void {
  const snippets = loadSnippets();
  const alreadyExists = snippets.some((item) => item.name === snippet.name);

  if (alreadyExists) {
    throw new Error(`Snippet "${snippet.name}" already exists.`);
  }

  saveSnippets([...snippets, snippet]);
}

export function upsertSnippet(snippet: Snippet): void {
  const snippets = loadSnippets();
  const nextSnippets = snippets.map((item) =>
    item.name === snippet.name ? snippet : item
  );
  const exists = nextSnippets.some((item) => item.name === snippet.name);

  saveSnippets(exists ? nextSnippets : [...snippets, snippet]);
}

export function searchSnippets(term: string): Snippet[] {
  const normalizedTerm = term.toLowerCase();

  return loadSnippets().filter((snippet) =>
    snippet.name.toLowerCase().includes(normalizedTerm)
  );
}
