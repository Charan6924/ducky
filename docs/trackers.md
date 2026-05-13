# Trackers

List of signals that `ducky` monitors to detect AI coding assistant usage.

---

## 1. Process Scanning

Scans the running process table for known AI assistant processes.

**What it detects:**
- `copilot` — GitHub Copilot (runs as node child processes via VS Code extension)
- `claude` / `claude-code` — Claude Code CLI
- `cursor` — Cursor IDE
- `codeium` / `windsurf` — Codeium/Windsurf
- `tabnine` — Tabnine
- `continue` — Continue.dev

**Implementation:** Periodic polling of `ps` output. Frequency: every 5 seconds. Stored as a list of detected processes with timestamps.

**Why it matters:** The most direct signal. If these processes are running, the developer is actively using an AI tool.

---

## 2. Filesystem Watching

Watches directories and files that AI tools write configuration, cache, and session data to.

**What it watches:**
- `~/.claude/` — Claude Code config, sessions, MCP configs, command history
- `~/.copilot/` — GitHub Copilot tokens and auth state
- `~/.config/cursor/` — Cursor IDE settings
- `~/.codeium/` — Codeium config
- `.vscode/settings.json` — Copilot enable/disable settings
- `.github/copilot-instructions.md` — Copilot custom instructions
- `CLAUDE.md` — Claude Code project-level instructions
- `.cursor/` — Cursor project-level settings

**Implementation:** `fs.watch` on known AI config directories. Records file creation and modification events with timestamps. No content reading — metadata only.

**Why it matters:** These files are created/modified during setup and use of AI tools. Presence alone tells us what tools have been configured. Modification timestamps reveal active sessions.

---

## 3. Shell History Parsing

Reads the shell history to find invocations of AI tools.

**What it detects:**
- Commands like `claude`, `cursor`, `copilot` direct invocations
- API key exports (`export ANTHROPIC_API_KEY=...`)
- Pipes involving AI tools
- `!` commands used to invoke Claude Code from terminal prompts

**Implementation:** Reads `~/.zsh_history` (or `~/.bash_history`) and filters for relevant command patterns. Captures timestamps and frequency.

**Why it matters:** Shell history captures explicit AI tool usage that process scanning might miss (e.g., a quick `claude` command that already exited). It also reveals how the developer interacts with the tool.

---

## 4. Active Window Polling

Polls the active window/title on macOS to detect AI tool usage.

**What it detects:**
- Window titles containing "Claude Code", "Cursor", "ChatGPT", "Copilot"
- Editor windows with AI chat panels open
- Browser tabs titled with AI chat URLs

**Implementation:** Uses `osascript` to query the frontmost application and its window title. Polls every 2 seconds. Records duration of AI-tool-related windows being in focus.

**Why it matters:** Window focus reveals what the developer is actually looking at. A developer with "Cursor" in the foreground is actively using AI, even if background process scans show nothing. This is a high-signal, low-friction indicator.

---

## 5. Git Log Analysis

Analyzes git history for patterns indicative of AI-generated code.

**What it detects:**
- Commit messages containing "Co-Authored-By: Claude" or similar AI co-author lines
- Very large diffs committed in single shots (files appearing fully-formed)
- Unnatural commit velocity (many substantial commits in short time)
- Consistency/style homogeneity across large changes
- AI-typical commit message structure (e.g., overly formatted conventional commits)

**Implementation:** Runs `git log` and `git diff` analysis on the repo. Runs automatically at session end (stop) and optionally as periodic sampling during long sessions. Stores summary statistics, not full diffs.

**Why it matters:** Version control patterns are one of the most revealing signals. AI-generated code has a distinctive "digital footprint" — it arrives fully-formed, is consistently styled, and often includes AI attribution in commit messages. This signal is passive (we read existing history) and doesn't interfere with workflow.

---

## 6. File Creation Pattern Analysis

Monitors filesystem events to detect bursty file creation patterns characteristic of AI-generated code.

**What it detects:**
- Burst creation events: 5+ files created in under 1 second (impossible for a human typist)
- Files appearing fully-formed (creation vs. incremental modification)
- Creation of boilerplate structures (entire directory trees in milliseconds)
- Pause-burst cycles (long idle → sudden flurry of new files)

**Implementation:** Uses `fsevents` / `fs.watch` on the project directory. Maintains a rolling window of file creation events. Flags bursts exceeding human typing speed thresholds.

**Why it matters:** Humans create files incrementally — type a bit, save, type more. AI tools generate entire files at once. The timing distribution of file creation events is a powerful behavioral signal that's hard to fake. A burst of 10+ new `.ts` files in under 2 seconds is nearly impossible without AI assistance.
