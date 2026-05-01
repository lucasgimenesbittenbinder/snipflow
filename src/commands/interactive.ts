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
import { loadSnippets, recordSnippetUsage, type Snippet } from "../utils/storage.js";
import { formatRelativeTime, truncateSnippet } from "../utils/text.js";

type InteractiveConfig<T extends Snippet> = {
  message: string;
  placeholder?: string;
  showCountInMessage?: boolean;
  showMessageInPlaceholder?: boolean;
  renderItemSuffix?: (snippet: T) => string | undefined;
  snippets: T[];
};

type RunSnippetPickerOptions<T extends Snippet> = {
  emptyMessage: string;
  message?: string;
  placeholder?: string;
  showCountInMessage?: boolean;
  showMessageInPlaceholder?: boolean;
  renderItemSuffix?: (snippet: T) => string | undefined;
};

const maxResults = 24;
const pageSize = 8;
const previewLineCount = 5;
const previewLineLength = 88;
const previewSeparatorLength = 24;

function createSnippetSearch<T extends Snippet>(snippets: T[]): Fuse<T> {
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

function searchSnippets<T extends Snippet>(snippets: T[], fuse: Fuse<T>, term: string): T[] {
  const normalizedTerm = term.trim();

  if (!normalizedTerm) {
    return snippets.slice(0, maxResults);
  }

  return fuse.search(normalizedTerm, { limit: maxResults }).map((result) => result.item);
}

function firstSelectableIndex<T>(results: T[]): number {
  return results.length > 0 ? 0 : -1;
}

function clampActiveIndex<T>(active: number, results: T[]): number {
  if (results.length === 0) {
    return -1;
  }

  if (active < 0) {
    return 0;
  }

  return Math.min(active, results.length - 1);
}

function visibleResults<T>(results: T[], active: number): T[] {
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

function renderSnippetLabel(snippet: Snippet, isActive: boolean, suffix?: string): string {
  const marker = isActive ? chalk.cyan("❯") : chalk.dim(" ");
  const name = isActive ? chalk.cyan.bold(snippet.name) : chalk.dim(snippet.name);
  const extra = suffix ? ` ${chalk.dim(suffix)}` : "";

  return `${marker} ${name}${extra}`;
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

function createSnippetPrompt<T extends Snippet>() {
  return createPrompt<T | undefined, InteractiveConfig<T>>((config, done) => {
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

    const resultCount = results.length;
    const resultLabel = `${resultCount} ${resultCount === 1 ? "result" : "results"}`;
    const message = chalk.bold(
      config.showCountInMessage === true
        ? `${config.message} (${resultLabel})`
        : config.message
    );
    const defaultPlaceholder = config.showMessageInPlaceholder === false
      ? config.placeholder ?? "Type to filter"
      : `${config.placeholder ?? "Search snippets... (type to filter)"} — ${resultLabel}`;
    const query = term
      ? chalk.cyan(`${term} ${chalk.dim(`(${resultLabel})`)}`)
      : chalk.gray(defaultPlaceholder);
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
          const suffix = config.renderItemSuffix?.(item);
          return renderSnippetLabel(item, isActive, suffix);
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
}

export async function runSnippetPicker<T extends Snippet>(
  snippets: T[],
  options: RunSnippetPickerOptions<T>
): Promise<void> {
  try {
    if (snippets.length === 0) {
      console.log(chalk.yellow(options.emptyMessage));
      return;
    }

    const selected = await createSnippetPrompt<T>()({
      message: options.message ?? "Search snippets",
      placeholder: options.placeholder,
      showCountInMessage: options.showCountInMessage,
      showMessageInPlaceholder: options.showMessageInPlaceholder,
      renderItemSuffix: options.renderItemSuffix,
      snippets
    });

    if (!selected) {
      return;
    }

    try {
      await writeClipboard(selected.content);
      recordSnippetUsage(selected.name);
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

export async function runInteractiveCommand(): Promise<void> {
  await runSnippetPicker(loadSnippets(), {
    emptyMessage: "No snippets available"
  });
}
