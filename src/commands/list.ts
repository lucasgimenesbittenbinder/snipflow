import { Command } from "commander";
import { loadSnippets } from "../utils/storage.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all snippets")
    .action(() => {
      try {
        const snippets = loadSnippets();

        if (snippets.length === 0) {
          console.log("No snippets saved.");
          return;
        }

        snippets.forEach((snippet) => {
          console.log(`${snippet.name} (${snippet.createdAt})`);
        });
      } catch (error) {
        console.error(error instanceof Error ? error.message : "Could not list snippets.");
        process.exitCode = 1;
      }
    });
}
