#!/usr/bin/env node
/**
 * THE LIST THE CLIENT MUST FILL — FROM A COMMAND, NOT FROM MEMORY.
 * Every row printed here is a visibly marked placeholder on the live pages.
 * Same function the /admin/content screen calls, so the two can never differ.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { openFactsIn } from "../lib/facts.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(path.join(ROOT, "config/site.json"), "utf8"));
const open = openFactsIn(cfg);
console.log(`BELLA FRIENDS — ${open.length} facts still needed from the school\n`);
open.forEach((o, i) => console.log(`${String(i + 1).padStart(2)}. ${o.path}\n    ${o.ask}\n`));
console.log(`TOTAL: ${open.length}. Nothing on the site invents any of these.`);
