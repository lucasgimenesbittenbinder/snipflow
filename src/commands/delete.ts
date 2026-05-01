import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { emitKeypressEvents } from "node:readline";
import { Command } from "commander";
import chalk from "chalk";
import { loadSnippets, saveSnippets, type Snippet } from "../utils/storage.js";

type DeleteOptions = {
  force?: boolean;
};

function isConfirmed(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "y" || normalized === "yes";
}

async function confirmDelete(name: string): Promise<boolean> {
  if (input.isTTY) {
    return confirmDeleteWithKeypress(name);
  }

  const rl = readline.createInterface({ input, output });

  try {
    const answer = await rl.question(`Are you sure you want to delete '${name}'? (y/N) `);
    return isConfirmed(answer);
  } finally {
    rl.close();
  }
}

async function confirmDeleteWithKeypress(name: string): Promise<boolean> {
  output.write(`Are you sure you want to delete '${name}'? (y/N) `);
  emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();

  return new Promise((resolve) => {
    const cleanup = (): void => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("keypress", onKeypress);
    };

    const finish = (confirmed: boolean, answer: string): void => {
      output.write(`${answer}\n`);
      cleanup();
      resolve(confirmed);
    };

    const onKeypress = (value: string, key: { name?: string; ctrl?: boolean }): void => {
      if (key.ctrl && key.name === "c") {
        finish(false, "N");
        return;
      }

      if (key.name === "escape" || !isConfirmed(value)) {
        finish(false, "N");
        return;
      }

      if (isConfirmed(value)) {
        finish(true, "y");
      }
    };

    input.on("keypress", onKeypress);
  });
}

function deleteSnippet(snippets: Snippet[], name: string): Snippet[] {
  return snippets.filter((snippet) => snippet.name !== name);
}

export function registerDeleteCommand(program: Command): void {
  program
    .command("delete")
    .description("Delete a snippet")
    .argument("<name>", "snippet name")
    .option("-f, --force", "delete without confirmation")
    .action(async (name: string, options: DeleteOptions) => {
      try {
        const snippets = loadSnippets();
        const exists = snippets.some((snippet) => snippet.name === name);

        if (!exists) {
          console.log(chalk.yellow(`⚠ Snippet '${name}' not found`));
          console.log(chalk.dim("💡 Try: snip list"));
          return;
        }

        const confirmed = options.force === true || await confirmDelete(name);

        if (!confirmed) {
          console.log(chalk.red("✖ Deletion cancelled"));
          return;
        }

        saveSnippets(deleteSnippet(snippets, name));
        console.log(chalk.green(`✔ Deleted '${name}'`));
        console.log();
      } catch {
        console.log(chalk.yellow("Could not delete snippet."));
        process.exitCode = 1;
      }
    });
}
