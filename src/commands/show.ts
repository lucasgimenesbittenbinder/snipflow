import { Command } from "commander";
import { findSnippetByName } from "../utils/storage.js";

export function registerShowCommand(program: Command): void {
  program
    .command("show")
    .description("Print a snippet without changing the clipboard")
    .argument("<name>", "snippet name")
    .action((name: string) => {
      try {
        const snippet = findSnippetByName(name);

        if (!snippet) {
          console.error(`Snippet "${name}" not found.`);
          process.exitCode = 1;
          return;
        }

        console.log(snippet.content);
      } catch (error) {
        console.error(error instanceof Error ? error.message : "Could not show snippet.");
        process.exitCode = 1;
      }
    });
}
