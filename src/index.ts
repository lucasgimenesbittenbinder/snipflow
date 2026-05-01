#!/usr/bin/env node

import { Command } from "commander";
import { registerDeleteCommand } from "./commands/delete.js";
import { registerGetCommand } from "./commands/get.js";
import { runInteractiveCommand } from "./commands/interactive.js";
import { registerListCommand } from "./commands/list.js";
import { registerSaveCommand } from "./commands/save.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerShowCommand } from "./commands/show.js";

const program = new Command();

program
  .name("snip")
  .description("A simple and fast code snippet manager.")
  .version("1.0.0");

registerSaveCommand(program);
registerGetCommand(program);
registerShowCommand(program);
registerSearchCommand(program);
registerListCommand(program);
registerDeleteCommand(program);

if (process.argv.length <= 2) {
  await runInteractiveCommand();
} else {
  program.parse();
}
