import {
  createPrompt,
  isDownKey,
  isEnterKey,
  isUpKey,
  useKeypress,
  useMemo,
  usePrefix,
  useRef,
  useState,
  type Status
} from "@inquirer/core";
import chalk from "chalk";
import Fuse from "fuse.js";
import { writeClipboard } from "../utils/clipboard.js";
import { loadSnippets, type Snippet } from "../utils/storage.js";
import { truncateSnippet } from "../utils/text.js";

type InteractiveConfig = {
  message: string;
  snippets: Snippet[];
};

const maxResults = 24;
const pageSize = 8;
const previewLineCount = 5;
const previewLineLength = 88;
const previewSeparatorLength = 24;

function createSnippetSearch(snippets: Snippet[]): Fuse<Snippet> {
  return new Fuse(snippets, {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.38,
    keys: [
      { name: "name", weight: 0.75 },
      { name: "content", weight: 0.25 }
    ]
  });
}

function searchSnippets(snippets: Snippet[], fuse: Fuse<Snippet>, term: string): Snippet[] {
  const normalizedTerm = term.trim();

  if (!normalizedTerm) {
    return snippets.slice(0, maxResults);
  }

  return fuse.search(normalizedTerm, { limit: maxResults }).map((result) => result.item);
}

function firstSelectableIndex(results: Snippet[]): number {
  return results.length > 0 ? 0 : -1;
}

function clampActiveIndex(active: number, results: Snippet[]): number {
  if (results.length === 0) {
    return -1;
  }

  if (active < 0) {
    return 0;
  }

  return Math.min(active, results.length - 1);
}

function visibleResults(results: Snippet[], active: number): Snippet[] {
  if (results.length <= pageSize) {
    return results;
  }

  const halfPage = Math.floor(pageSize / 2);
  const start = Math.min(
    Math.max(active - halfPage, 0),
    Math.max(results.length - pageSize, 0)
  );

  return results.slice(start, start + pageSize);
}

function renderPreview(snippet: Snippet | undefined): string {
  if (!snippet) {
    return "";
  }

  const preview = truncateSnippet(snippet.content, {
    maxLineLength: previewLineLength,
    maxLines: previewLineCount
  });
  const visibleLines = preview.lines.length > 0 ? preview.lines : [""];

  return [
    chalk.hex("#7DD3FC")("Preview:"),
    chalk.dim("-".repeat(previewSeparatorLength)),
    ...visibleLines.map((line) => chalk.hex("#A7B0BA")(`  ${line || " "}`)),
    preview.truncated ? chalk.dim("  ...") : ""
  ]
    .filter(Boolean)
    .join("\n");
}

const snippetPrompt = createPrompt<Snippet | undefined, InteractiveConfig>((config, done) => {
  const [status, setStatus] = useState<Status>("idle");
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const canceled = useRef(false);
  const fuse = useMemo(() => createSnippetSearch(config.snippets), [config.snippets]);
  const results = searchSnippets(config.snippets, fuse, term);
  const safeActive = clampActiveIndex(active, results);
  const selected = safeActive >= 0 ? results[safeActive] : undefined;
  const prefix = usePrefix({ status });

  useKeypress((key, readline) => {
    if (key.name === "escape") {
      canceled.current = true;
      setStatus("done");
      done(undefined);
      return;
    }

    if (isEnterKey(key)) {
      if (!selected) {
        return;
      }

      setStatus("done");
      done(selected);
      return;
    }

    if (isUpKey(key)) {
      readline.clearLine(0);
      setActive(safeActive <= 0 ? results.length - 1 : safeActive - 1);
      return;
    }

    if (isDownKey(key)) {
      readline.clearLine(0);
      setActive(safeActive >= results.length - 1 ? 0 : safeActive + 1);
      return;
    }

    setTerm(readline.line);
    setActive(firstSelectableIndex(searchSnippets(config.snippets, fuse, readline.line)));
  });

  const message = chalk.bold(config.message);
  const resultCount = results.length;
  const resultLabel = `${resultCount} ${resultCount === 1 ? "result" : "results"}`;
  const query = term
    ? chalk.cyan(`${term} ${chalk.dim(`(${resultLabel})`)}`)
    : chalk.gray(`Search snippets... (type to filter) — ${resultLabel}`);
  const header = [prefix, message, query].filter(Boolean).join(" ").trimEnd();

  if (status === "done") {
    if (canceled.current) {
      return chalk.gray("Canceled");
    }

    return [prefix, message, chalk.cyan(selected?.name ?? "")]
      .filter(Boolean)
      .join(" ")
      .trimEnd();
  }

  const list = results.length === 0
    ? chalk.yellow("⚠ No snippets found (0 results)")
    : visibleResults(results, safeActive)
      .map((item) => {
        const isActive = item === selected;
        const marker = isActive ? chalk.cyan("❯") : chalk.dim(" ");
        const name = isActive ? chalk.cyan.bold(item.name) : chalk.dim(item.name);

        return `${marker} ${name}`;
      })
      .join("\n");

  const body = [
    list,
    " ",
    " ",
    renderPreview(selected),
    " ",
    chalk.dim("↑↓ navigate • Enter copy • Esc cancel")
  ]
    .filter((line) => line !== "")
    .join("\n");

  return [header, body];
});

export async function runInteractiveCommand(): Promise<void> {
  try {
    const snippets = loadSnippets();

    if (snippets.length === 0) {
      console.log(chalk.yellow("No snippets available"));
      return;
    }

    const selected = await snippetPrompt({
      message: "Search snippets",
      snippets
    });

    if (!selected) {
      return;
    }

    try {
      await writeClipboard(selected.content);
      console.log(chalk.green(`✔ Copied "${selected.name}" to clipboard`));
    } catch {
      console.log(chalk.yellow("Could not copy snippet to clipboard."));
    }
  } catch (error) {
    const message = error instanceof Error && error.name === "ExitPromptError"
      ? "Canceled."
      : "Could not open interactive search.";

    console.log(chalk.yellow(message));
  }
}
