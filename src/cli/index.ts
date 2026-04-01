#!/usr/bin/env node

/**
 * arch-angel CLI entry point
 * Persistent architectural memory for engineering teams.
 */

import { scanDirectory } from "../scanner/index.js";
import { Command } from "commander";
import { formatTree } from "./formatTree.js";
import fs from "fs"; 
import nodePath from "node:path";

const archAngel = new Command(); 

archAngel.name("arch-angel").command("scan <path>")
  .version("0.1.0")
  .description("Scan a repository and output its structure") 
  .option("-o, --output <file>", "Write output to file") 
  .option("-j, --json", "Output in raw JSON format") 
  .option("-v, --verbose", "Show detailed progress information") 
  .option("-q, --quiet", "Suppress all output except errors") 
  .option("-d, --depth <number>", "Set the maximum depth of the directory tree to scan") 
  .option("-n, --no-write", "Do not create .arch-angel/ directory")
  .action((path, options) => {
    // Flag conflicts: catch contradictions before scanning. Exit 1 = user error.
    if (options.verbose && options.quiet) {
      console.error(`Error: Cannot use verbose and quiet together`);
      console.error(`Reason: verbose and quiet are mutually exclusive.`);
      console.error(`Fix: Remove one of the flags and try again.`);
      process.exit(1);
    }
    if (options.depth && isNaN(Number(options.depth))) {
      console.error(`Error: Invalid --depth value "${options.depth}". Depth must be a number.`);
      console.error(`Reason: Depth must be a number.`);
      console.error(`Fix: Provide a valid number for the depth.`);
      process.exit(1);
    }
    if (options.json && options.verbose) {
      console.error("Error: Cannot use json and verbose together");
      console.error(`Reason: json and verbose are mutually exclusive.`);
      console.error(`Fix: Remove one of the flags and try again.`);
      process.exit(1);
    }
    const startTime = Date.now();
    if (!fs.existsSync(path)) {
      console.error(`Error: Cannot scan ${path}`); 
      console.error(`Reason: ${path} does not exist. Please provide a valid directory path.`);
      console.error(`Fix: Check the path and try again.`);
      process.exit(1);
    }

    if (!fs.statSync(path).isDirectory()) {
      console.error(`Error: Cannot scan ${path}`);
      console.error(`Reason: ${path} is a file not a directory. arch-angel only scans directories.`);
      console.error(`Fix: Provide the path to the directory containing this file.`);
      process.exit(1);
    }

    const scanResult = scanDirectory(path);
    const endTime = Date.now() - startTime;
    if(scanResult.stats.totalFiles > 10000) {
      if(!options.quiet) {
        console.error("Warning: Repository contains over 10,000 files. Some operations may be slow.");
      }
    }

    // Scanner returns data; CLI wraps it with envelope metadata (version, timestamp).
    const output = {
    version: "1", 
    timestamp: new Date().toISOString(), 
    ...scanResult, 
    }
    // Output routing: stdout = data (JSON or tree), stderr = diagnostics (confirmations, timing).
    if (options.output) {
      try {
        fs.writeFileSync(options.output, JSON.stringify(output, null, 2), "utf-8");
      } catch (error) {
        console.error(`Error writing output to ${options.output}: ${error}`);
        console.error(`Reason: Failed to write output to ${options.output}.`);
        console.error(`Fix: Check the path and try again.`);
        process.exit(2);
      }
      if (!options.quiet) {console.error(`Output written to ${options.output}`)};
    } else if (options.json) {
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log(formatTree(output.tree));
    }
    if (options.verbose) {
      console.error(`Scan completed in ${endTime}ms`);
    }

    const archAngelDir = nodePath.join(path, ".arch-angel", "scans");
    if (options.write) {
      const dotArchAngelDir = nodePath.join(path, ".arch-angel"); 
      if(fs.existsSync(dotArchAngelDir) && fs.lstatSync(dotArchAngelDir).isSymbolicLink()) {
        console.error("Warning: .arch-angel directory is a symbolic link. Skipping write.");
        return;
      }
      try {
        fs.mkdirSync(archAngelDir, { recursive: true });
        fs.writeFileSync(nodePath.join(archAngelDir, "latest.json"), JSON.stringify(output, null, 2), "utf-8");
      } catch (error) {
        console.error(`Error creating .arch-angel directory: ${error}`);
        console.error(`Reason: Failed to create .arch-angel directory.`);
        console.error(`Fix: Try running the command again with the -n flag to disable writing.`);
        process.exit(2);
      }
      
    }
  });
  

archAngel.parse(process.argv);
