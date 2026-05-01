import { Command } from "commander";
import chalk from "chalk";
import { runSnippetPicker } from "./interactive.js";
import { loadRecentHistory } from "../utils/storage.js";
import { formatRelativeTime } from "../utils/text.js";

export function registerLastCommand(program: Command): void {
  program
    .command("last")
    .description("Open recently used snippets")
    .action(async () => {
      try {
        const recentSnippets = loadRecentHistory();

        await runSnippetPicker(recentSnippets, {
          emptyMessage: [
            chalk.yellow("No recent snippets yet"),
            chalk.dim("💡 Use a snippet to see it here")
          ].join("\n"),
          message: "Recent snippets",
          placeholder: "Type to filter recent snippets",
          showCountInMessage: true,
          showMessageInPlaceholder: false,
          renderItemSuffix: (snippet) => `(${formatRelativeTime(snippet.usedAt)})`
        });
      } catch {
        console.log("Could not open recent snippets.");
        process.exitCode = 1;
      }
    });
}
