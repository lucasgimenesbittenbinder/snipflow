import { Command } from "commander";
import { searchSnippets } from "../utils/storage.js";

export function registerSearchCommand(program: Command): void {
  program
    .command("search")
    .description("Search snippets by name")
    .argument("<term>", "search term")
    .action((term: string) => {
      try {
        const snippets = searchSnippets(term);

        if (snippets.length === 0) {
          console.log("No snippets found.");
          return;
        }

        snippets.forEach((snippet) => {
          console.log(`${snippet.name} (${snippet.createdAt})`);
        });
      } catch (error) {
        console.error(error instanceof Error ? error.message : "Could not search snippets.");
        process.exitCode = 1;
      }
    });
}
