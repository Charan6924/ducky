# Components

Architecture overview of the `ducky` CLI application.

---

## Project Structure

```
ducky/
├── package.json              # bin field, deps, scripts
├── tsconfig.json             # TypeScript config
├── CLAUDE.MD                 # Project instructions for AI tools
├── docs/
│   ├── components.md         # This file — component architecture
│   ├── README.md             # Project readme
│   └── trackers.md           # Tracker specifications
├── src/
│   ├── index.ts              # CLI entry point (command routing)
│   ├── commands/
│   │   ├── start.ts          # ducky start logic
│   │   └── stop.ts           # ducky stop logic
│   ├── daemon.ts             # Background process lifecycle (fork, PID file, signals)
│   ├── storage.ts            # Session data read/write (JSON files)
│   ├── reporter.ts           # Aggregates tracker data → ducky-report.json
│   ├── trackers/
│   │   ├── base.ts           # Abstract tracker interface
│   │   ├── processes.ts      # Process scanning
│   │   ├── filesystem.ts     # Filesystem watching
│   │   ├── shell-history.ts  # Shell history parsing
│   │   ├── windows.ts        # Active window polling
│   │   ├── git-log.ts        # Git log analysis
│   │   └── file-patterns.ts  # File creation burst detection
│   └── types.ts              # Shared types/interfaces
└── ducky.session.json        # Runtime session file (gitignored)
```

---

## Components

| Component | Responsibility |
|---|---|
| **CLI Entry** (`src/index.ts`) | Parse `start`/`stop` args, route to command handler. Uses raw `process.argv` (no framework needed for 2 commands) |
| **`commands/start.ts`** | Check no duplicate session, write PID file, spawn daemon, print confirmation |
| **`commands/stop.ts`** | Read PID file, kill daemon, call reporter, print summary, clean up PID file |
| **Daemon** (`src/daemon.ts`) | Long-running child process. Initializes all trackers, manages polling intervals, handles `SIGTERM` for graceful shutdown |
| **Storage** (`src/storage.ts`) | Reads/writes `ducky.session.json` (intermediate data while tracking) and triggers report generation |
| **Reporter** (`src/reporter.ts`) | Aggregates data from all trackers into `ducky-report.json` with metadata + tracking sections |
| **Base Tracker** (`src/trackers/base.ts`) | Interface that every tracker implements: `start()`, `stop()`, `getData()` |
| **6 Trackers** (`src/trackers/*.ts`) | Each implements the base interface with its own polling/watching logic |

---

## Data Flow

```
ducky start
  → check PID file (fail if exists)
  → fork() daemon as child process
  → daemon initializes all 6 trackers
  → trackers poll/watch in parallel (setInterval, fs.watch)
  → data written to ducky.session.json periodically

ducky stop
  → read PID file
  → SIGTERM daemon
  → daemon stops all trackers, writes final session data
  → reporter reads session data → ducky-report.json
  → clean up PID file
  → print summary to terminal
```

---

## Architecture Decisions

- **Background process**: Uses `child_process.fork()` — shares module code cleanly and handles signals reliably. PID file at `.ducky.pid` in project root.
- **IPC**: Signals (`SIGTERM`/`SIGINT`) for lifecycle. JSON file for data handoff between daemon and CLI.
- **Tracker parallelism**: All trackers run in the same daemon process, each with its own `setInterval` or `fs.watch`. No multi-processing needed — they're lightweight polling loops.
- **PID file safety**: Lockfile pattern — write PID on start, check existence, delete on stop. Prevents duplicates and orphans.
- **Dependencies**: None beyond Node.js stdlib (`fs`, `child_process`, `os`, `path`). Optionally `execa` for cleaner shell command execution.
