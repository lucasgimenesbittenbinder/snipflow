#!/usr/bin/env node

import { Command } from "commander";
import { registerGetCommand } from "./commands/get.js";
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

program.parse();
