import { Command } from "commander";
import { writeClipboard } from "../utils/clipboard.js";
import { findSnippetByName } from "../utils/storage.js";
import { previewContent } from "../utils/text.js";

export function registerGetCommand(program: Command): void {
  program
    .command("get")
    .description("Copy a snippet to the clipboard")
    .argument("<name>", "snippet name")
    .action(async (name: string) => {
      try {
        const snippet = findSnippetByName(name);

        if (!snippet) {
          console.error(`Snippet "${name}" not found.`);
          process.exitCode = 1;
          return;
        }

        await writeClipboard(snippet.content);
        console.log(`Snippet "${name}" copied to clipboard.`);
        console.log(`Preview: ${previewContent(snippet.content)}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : "Could not copy snippet.");
        process.exitCode = 1;
      }
    });
}
