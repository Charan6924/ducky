#!/usr/bin/env node

/// <reference types="node" />

import { start } from './commands/start.js';
import { stop } from './commands/stop.js';

function printHelp(): void {
    console.log(`
Usage: ducky <command>

Commands:
  start   Begin tracking AI usage in the current directory
  stop    Stop tracking and save ducky-report.json

Options:
  --help  Show this message
`);
}

function main(): void {
    const command = process.argv[2];

    switch (command) {
        case 'start':
            start();
            break;
        case 'stop':
            stop();
            break;
        case '--help':
        case undefined:
            printHelp();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            printHelp();
            process.exit(1); 
    }
}

main();
