import { Command } from "commander";
import { readClipboard } from "../utils/clipboard.js";
import { addSnippet, upsertSnippet } from "../utils/storage.js";
import { previewContent, readStdin } from "../utils/text.js";

type SaveOptions = {
  force?: boolean;
  stdin?: boolean;
};

async function resolveContent(contentArgument: string | undefined, options: SaveOptions): Promise<string> {
  if (options.stdin) {
    return readStdin();
  }

  if (contentArgument !== undefined) {
    return contentArgument;
  }

  return readClipboard();
}

export function registerSaveCommand(program: Command): void {
  program
    .command("save")
    .description("Save a snippet from an argument, stdin, or the clipboard")
    .argument("<name>", "snippet name")
    .argument("[content...]", "snippet content")
    .option("--stdin", "read snippet content from stdin")
    .option("-f, --force", "overwrite an existing snippet")
    .action(async (name: string, contentParts: string[] | undefined, options: SaveOptions) => {
      try {
        const contentArgument = contentParts && contentParts.length > 0
          ? contentParts.join(" ")
          : undefined;
        const content = await resolveContent(contentArgument, options);

        if (!content.trim()) {
          console.error("Snippet content is empty.");
          process.exitCode = 1;
          return;
        }

        const snippet = {
          name,
          content,
          createdAt: new Date().toISOString()
        };

        if (options.force) {
          upsertSnippet(snippet);
        } else {
          addSnippet(snippet);
        }

        console.log(`Snippet "${name}" saved.`);
        console.log(`Preview: ${previewContent(content)}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : "Could not save snippet.");
        process.exitCode = 1;
      }
    });
}
