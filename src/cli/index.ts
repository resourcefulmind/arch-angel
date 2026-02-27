#!/usr/bin/env node

/**
 * arch-angel CLI entry point
 * Persistent architectural memory for engineering teams.
 */

import { scanDirectory } from "../scanner/index.js";

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log("arch-angel - Persistent architectural memory for engineering teams\n");
  console.log("Commands:");
  console.log("  scan <path>    Scan a repository and output its structure");
  console.log("  --help         Show this help message");
  process.exit(0);
}

if (command === "scan") {
  const targetPath = args[1];
  if (!targetPath) {
    console.error("Error: Please provide a path to scan.");
    console.error("Usage: arch-angel scan <path>");
    process.exit(1);
  }
  console.log(`Scanning: ${targetPath}`);
  console.log(scanDirectory(targetPath));
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
