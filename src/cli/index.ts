#!/usr/bin/env node

/**
 * arch-angel CLI entry point
 * Persistent architectural memory for engineering teams.
 */

import { scanDirectory } from "../scanner/index.js";
import { Command } from "commander";
import { formatTree } from "./formatTree.js";

const archAngel = new Command(); 

archAngel.name("arch-angel").command("scan <path>")
  .version("0.1.0")
  .description("Scan a repository and output its structure") 
  .option("-o, --output <file>", "Write output to file") 
  .option("-j, --json", "Output in raw JSON format") 
  .option("-v, --verbose", "Show detailed progress information") 
  .option("-q, --quiet", "Suppress all output except errors") 
  .option("-d, --depth <number>", "Set the maximum depth of the directory tree to scan") 
  .option("-n, --no-write", "Do not create .arch-angel/ director")
  .action((path, options) => {
    if (options.verbose && options.quiet) {
      console.error("Error: Cannot use verbose and quiet together");
      process.exit(1);
    }
    if (options.depth && isNaN(Number(options.depth))) {
      console.error("Error: Depth must be a number");
      process.exit(1);
    }
    if (options.json && options.verbose) {
      console.error("Error: Cannot use json and verbose together");
      process.exit(1);
    }
    const scanResult = scanDirectory(path);
    const output = {
    version: "1", 
    timestamp: new Date().toISOString(), 
    ...scanResult, 
  }
    console.log(formatTree(output.tree));
  });
  

archAngel.parse(process.argv);
