# ducky

A CLI tool that passively monitors a developer's local environment to capture signals about AI coding assistant usage during a session.

## Installation

```bash
npm install -g @charan6924/ducky
```

Or to run without installing:

```bash
npx @charan6924/ducky start
```

## Usage

```
ducky start   — begin tracking AI usage in the current directory
ducky stop    — stop tracking and generate ducky-report.json
```

Tracking runs as a detached background process. The session file is written to `ducky.session.json` every 5 seconds. When stopped, a `ducky-report.json` is generated in the project root.

## How It Works

Ducky runs 7 watchers concurrently as a background daemon:

| Tracker | Signal Captured | Method |
|---|---|---|
| **Process Watcher** | AI-related processes running on the system | Polls `ps aux` every 5s, matches against known AI tool names |
| **Window Watcher** | Active window title and app name | Polls `osascript` every 5s, checks if the frontmost window matches AI tool patterns |
| **Filesystem Watcher** | File changes in the project directory | Uses `fs.watch` recursively, logs all file change events |
| **File Pattern Watcher** | AI-specific file artifacts (.aider, .copilot, CLAUDE.md, etc.) | Scans the project tree every 60s for known AI tool marker files |
| **Shell History Watcher** | AI commands in shell history | Reads `~/.zsh_history` on start, scans for AI-related commands |
| **Git Log Watcher** | Git commits with AI-generated messages | Runs `git log`, flags commits containing AI-typical patterns |
| **Network Watcher** | Network connections to known AI API endpoints | Runs `lsof -i` every 10s, matches against known AI API domains |

All tracking is **passive** — it only reads system state and never interferes with the developer's workflow. All data stays **local** — nothing is sent to any external service.

## Report Format

`ducky-report.json` contains:

- **metadata**: Session start/end time, duration in ms, project directory
- **tracking**: Per-tracker data with all captured signals

---

## Writeup

### 1. Tracking Approach

Ducky focuses on breadth of signal. The seven trackers cover seven distinct attack surfaces:

- **Process snapshots** reveal which AI tools are actively running (e.g., Claude Code as a terminal process, Cursor as an Electron app).
- **Window titles** capture the *context* of AI use — what file is the developer editing when they invoke an AI assistant?
- **Filesystem changes** log *what* the AI is writing — new files, modified files, deletion patterns.
- **File pattern scanning** detects AI tool presence even when tools aren't actively running (a `.copilot` config, a `CLAUDE.md` instruction file, a `.aider` file).
- **Shell history** captures the developer's *interaction style* — do they craft detailed prompts? Do they chain AI calls? Do they use AI to write git commits?
- **Git log analysis** flags commits that have AI-generated messages — a strong signal of AI-assisted development.
- **Network connections** reveal which AI *services* are being used (Anthropic API, OpenAI, GitHub Copilot), distinguishing between local and cloud AI tools.

The design philosophy is defense-in-depth for signal: any single tracker can be evaded, but seven independent sensors make it very difficult to use AI tools without leaving a trace.

### 2. Why AI Usage Tracking Matters

Tracking AI usage evaluates a developer's ability beyond what traditional assessments capture:

- **Tool fluency** — Top AI users aren't prompting blindly; they know when to use AI and when to write code themselves. Usage patterns reveal judgment.
- **Workflow integration** — Does the developer use AI as a crutch (always-on chat, accepting all suggestions) or as a force multiplier (targeted prompts, reviewing outputs critically)?
- **Burst patterns** — Rapid-fire AI interactions suggest exploration/learning. Long, deliberate prompts suggest experienced orchestration. The ratio between AI interaction and human review is telling.
- **Attribution awareness** — Developers who mark AI-generated commits vs. those who don't reveals intellectual honesty and understanding of code ownership.

Traditional assessments (resumes, interviews, whiteboard coding) don't capture how someone *actually* builds software day-to-day. AI usage signals are a window into genuine engineering habits.

### 3. Limitations & Extensions

**Current Limitations:**

- **macOS-only** — Several trackers (osascript for windows, lsof for network) are macOS-specific. Linux/Windows support would require platform-specific alternatives.
- **No editor plugin** — Tracking happens at the OS level, not inside the editor. An IDE extension could capture inline completions (Copilot, TabNine) that leave no process or window trace.
- **Shell history only on start** — Currently snapshots `.zsh_history` once at startup. A continuous tail would capture commands issued during the session.
- **False positives** — Substring matching on process names and window titles can trigger on non-AI tools. A deny-list or confidence scoring would improve accuracy.

**Desired Extensions (no constraints):**

1. **Editor plugin (VS Code, JetBrains)** — Track inline completion acceptance/rejection rates, prompt lengths, file-level attribution. This is the richest signal and what I'd prioritize first.
2. **Clipboard monitoring** — AI tools frequently copy-paste code into editors. Tracking clipboard origin and destination would catch AI use invisible to process/window watchers.
3. **Browser extension** — Capture ChatGPT/Claude.ai web interactions, prompt content, code snippet copy events. This would catch web-based AI usage that leaves no local process trace.
4. **Keystroke dynamics** — Measure paste vs. type ratios. AI-generated code is pasted, not typed. High paste-to-type ratio is a strong heuristic.
5. **Prompt caching analysis** — Monitor terminal scrollback and editor temporary files to reconstruct prompt context. This would reveal *how* the developer structures prompts, not just *that* they used AI.
6. **AI-powered classification** — Use an LLM to classify code as AI-generated vs. human-written based on style, comment patterns, naming conventions. This would catch AI use even when no known tool name appears.
