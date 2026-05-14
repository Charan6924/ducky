# Ducky Test Suite Reference

**Last Updated:** 2026-05-14

This document describes every test case in the project. Tests are grouped by file. Each test entry covers the scenario being tested, what mocks are set up (if any), and what assertions verify.

---

## tests/trackers/processes.test.ts -- ProcessWatcher (4 tests)

### Mock setup
- `child_process.execSync` is mocked globally (module-level `vi.mock`).
- `vi.useFakeTimers()` runs in `beforeEach` so that `vi.advanceTimersByTime` controls the polling interval.
- `execSync` is pre-configured to return `''` in `beforeEach` so tests override it only where needed.
- Polling interval is 2500ms (2 samples per 5000ms of fake time).

### "detects AI tools from ps output"
- **Scenario:** A developer has `claude` and `copilot` processes running.
- **Mocks:** `execSync` returns a string formatted like `ps` output containing both "claude" and "copilot" process lines.
- **Assertions:** `totalSamples === 2` (two polling ticks at 5000ms); `detected` array includes both `"claude"` and `"copilot"`.

### "ignores non-AI processes"
- **Scenario:** No AI tools are running; only unrelated processes exist.
- **Mocks:** `execSync` returns empty string (default from `beforeEach`).
- **Assertions:** `detected` is an empty array; `totalSamples === 2`.

### "deduplicates detected tools across samples"
- **Scenario:** The same AI tools appear across multiple polling samples.
- **Mocks:** `execSync` returns both `"copilot"` and `"claude"` lines.
- **Assertions:** After 10000ms (4 polling ticks), `detected` contains `["copilot", "claude"]` with no duplicates. Verifies deduplication logic across samples.

### "stops polling after stop()"
- **Scenario:** The watcher is started and immediately stopped before any polling cycles complete.
- **Mocks:** None beyond the default.
- **Assertions:** After advancing 10000ms of fake time, `totalSamples === 1` (the initial/startup sample only). Verifies the interval is properly cleared.

---

## tests/trackers/filesystem.test.ts -- FilesystemWatcher (5 tests)

### Mock setup
- `fs.watch` is mocked at the module level. The mock implementation captures the callback parameter (last argument to `watch()`) so tests can simulate file events by calling `watchCallback(eventType, filename)`.
- A real `EventEmitter` is used as the return value of `watch()`, enabling the `close` spy pattern.

### "tracks file change events"
- **Scenario:** Two file system events fire -- a `change` on `src/index.ts` and a `rename` on `src/newfile.ts`.
- **Mocks:** `fs.watch` callback captured and invoked manually.
- **Assertions:** `totalEvents === 2`; `changesByType === { change: 1, rename: 1 }`; `changesByExt === { '.ts': 2 }`. Verifies all three derived counters are populated correctly.

### "tracks changes by extension"
- **Scenario:** Multiple events fire against files with different extensions.
- **Mocks:** Three callback invocations: `file.ts` (twice), `file.css` (once).
- **Assertions:** `changesByExt === { '.ts': 2, '.css': 1 }`. Verifies extension counting is correct and accumulated properly.

### "ignores own session/report files"
- **Scenario:** Ducky's own internal files (`ducky.session.json`, `ducky-report.json`, `.ducky.pid`) are modified and should be filtered out.
- **Mocks:** Four callback invocations: three ducky-internal files plus one real source file.
- **Assertions:** `totalEvents === 1` (only the non-ducky file `src/index.ts` is counted). Verifies the ignore/filter list works.

### "handles null filename"
- **Scenario:** A `fs.watch` event fires with a `null` filename (which can happen on some platforms for certain events).
- **Mocks:** Callback invoked with `('change', null)`.
- **Assertions:** `totalEvents === 0`. Verifies the watcher does not crash on null filenames and correctly skips them.

### "closes watcher on stop()"
- **Scenario:** The watcher is stopped and the underlying native `fs.watch` handle should be released.
- **Mocks:** A `closeSpy` (vi.fn()) is attached to the mock emitter's `.close` property.
- **Assertions:** After `stop()`, `closeSpy` was called. Verifies the watcher calls `.close()` on the `fs.FSWatcher` instance to avoid file descriptor leaks.

---

## tests/trackers/file-patterns.test.ts -- FilePatternWatcher (2 tests)

### Mock setup
- `fs.readdirSync` and `fs.statSync` are mocked at the module level.
- No timers or intervals -- this watcher performs a one-shot directory scan on `getData()`.

### "returns empty data for empty directory"
- **Scenario:** The project directory is empty.
- **Mocks:** `readdirSync` returns `[]`.
- **Assertions:** `totalFiles === 0`; `aiNamedFiles === 0`; `burstsDetected === 0`. Verifies all metrics default to zero on empty input.

### "detects AI-named files"
- **Scenario:** The project contains files with names that suggest AI generation (`generated-config.ts`, `ai-helper.ts`) alongside a normal file (`index.ts`).
- **Mocks:** `readdirSync` returns three directory entries (with `isDirectory` returning `false`). `statSync` returns a mock stat object with a current `birthtime`.
- **Assertions:** `aiNamedFiles === 2`. Verifies the pattern-matching logic correctly identifies AI-suggestive filenames while ignoring normal ones like `index.ts`.

---

## tests/trackers/git-log.test.ts -- GitLogWatcher (4 tests)

### Mock setup
- `child_process.execSync` is mocked at the module level.
- Git log output is simulated in a null-byte-separated format (hash, date, subject, body, null separator).

### "parses git log output"
- **Scenario:** Two recent commits exist, neither with AI attribution.
- **Mocks:** `execSync` returns two commit records separated by `\0`. Bodies are empty (no `Co-Authored-By` line).
- **Assertions:** `totalCommits === 2`; `aiAttributed === 0`. Verifies basic git log parsing.

### "detects Co-Authored-By commits"
- **Scenario:** One of two commits has a `Co-Authored-By: Claude` trailer.
- **Mocks:** Second commit body includes `Co-Authored-By: Claude`.
- **Assertions:** `totalCommits === 2`; `aiAttributed === 1`. Verifies the attribution detection logic.

### "detects commit bursts"
- **Scenario:** Three commits are made within 20 seconds of each other, forming a burst.
- **Mocks:** Three commits at timestamps +0s, +10s, +20s from an arbitrary base (all within the burst threshold).
- **Assertions:** `burstsDetected === 1`. Verifies burst detection groups closely-timed commits.

### "handles non-git directory gracefully"
- **Scenario:** The project is not a git repository.
- **Mocks:** `execSync` throws an error with message `"not a git repository"`.
- **Assertions:** `totalCommits === 0`. Verifies the watcher catches the error and returns clean empty data rather than crashing.

---

## tests/trackers/network.test.ts -- NetworkWatcher (4 tests)

### Mock setup
- `child_process.execSync` is mocked at the module level.
- `vi.useFakeTimers()` in `beforeEach`. Polling interval is 5000ms.
- Watcher calls `execSync` to run `lsof` for detecting network connections.

### "detects connections to AI endpoints"
- **Scenario:** A process has an active connection to `api.anthropic.com:443` (Claude API endpoint).
- **Mocks:** `execSync` returns a string resembling `lsof` output showing a connection from a node process to `api.anthropic.com:443`.
- **Assertions:** `totalSamples === 2` (two ticks at 10000ms); `aiConnections > 0`; `endpoints` contains `"api.anthropic.com"`. Verifies endpoint matching logic.

### "reports no connections when none found"
- **Scenario:** Network connections exist but none target known AI API endpoints.
- **Mocks:** `execSync` returns a connection to `google.com:443` from a Chrome process.
- **Assertions:** `aiConnections === 0`; `endpoints` is empty array. Verifies non-AI connections are ignored.

### "stops polling after stop()"
- **Scenario:** The watcher is started and immediately stopped.
- **Mocks:** `execSync` returns empty string.
- **Assertions:** After 20000ms of fake time, `totalSamples === 1` (only the initial sample). Verifies the polling interval is properly cancelled.

### "handles lsof failure gracefully"
- **Scenario:** The `lsof` command is not available on the system.
- **Mocks:** `execSync` throws `"lsof not found"`.
- **Assertions:** `totalSamples === 2` (polling continues despite errors); `aiConnections === 0`. Verifies the watcher does not crash when the underlying command fails.

---

## tests/trackers/shell-history.test.ts -- ShellHistoryWatcher (1 test)

### "returns empty data (stub)"
- **Scenario:** The shell history tracker is not yet implemented; this is a placeholder.
- **Mocks:** None.
- **Assertions:** `watcher.name === "shell history"`; `watcher.getData()` returns `{}`. Verifies the stub conforms to the tracker interface without crashing.

---

## tests/trackers/windows.test.ts -- WindowWatcher (1 test)

### "returns empty data (stub)"
- **Scenario:** The window tracker is not yet implemented; this is a placeholder.
- **Mocks:** None.
- **Assertions:** `watcher.name === "open windows"`; `watcher.getData()` returns `{}`. Verifies the stub conforms to the tracker interface without crashing.

---

## tests/storage.test.ts -- Storage (4 tests)

### Mock setup
- `fs.writeFileSync` is mocked at the module level. Calls are captured via `vi.mocked(writeFileSync).mock.calls`.
- `beforeEach` clears mock call history so each test starts fresh.

### "stores start time and project dir"
- **Scenario:** A session is initialized and then written with one tracker.
- **Mocks:** `writeFileSync` used to capture the session JSON.
- **Assertions:** Parsed JSON has `metadata.projectDir === "/test/project"`; `metadata.startTime` is truthy; `metadata.endTime === ""`. Verifies `initSession` stores the project path and that `writeSession` serializes it correctly with endTime as empty (not yet finalized).

### "sets endTime when isFinal is true"
- **Scenario:** A session is finalized (e.g., on stop).
- **Mocks:** `writeSession([], true)` is called with `isFinal = true`.
- **Assertions:** `metadata.endTime` is truthy. Verifies the `isFinal` flag populates endTime.

### "includes tracker data"
- **Scenario:** A tracker returns non-empty data that should appear in the session file.
- **Mocks:** Tracker `getData()` returns `{ files: 5 }`.
- **Assertions:** `tracking.tracker1` equals `{ files: 5 }`. Verifies tracker output is serialized under the tracker's name key.

### "writes to ducky.session.json"
- **Scenario:** Session data is persisted to disk.
- **Mocks:** None beyond the default.
- **Assertions:** First argument to `writeFileSync` is `"ducky.session.json"`. Verifies the correct filename is used.

---

## tests/reporter.test.ts -- Reporter (2 tests)

### Mock setup
- `fs.readFileSync` and `fs.writeFileSync` are mocked at the module level.
- `console.log` is spied on and silenced in `beforeEach`.

### "generates a report from session data"
- **Scenario:** A session file with 30 minutes of data (including `processes` tracking) is read and a report is produced.
- **Mocks:** `readFileSync` returns a session JSON with `startTime`, `endTime` (30 min apart), and `tracking.processes` data.
- **Assertions:** `writeFileSync` first arg is `"ducky-report.json"`; report JSON contains `metadata.durationsMs === 1800000` (computed from start/end); `tracking.processes` is passed through unchanged. Verifies duration calculation and report structure.

### "prints summary with duration and tracker count"
- **Scenario:** A session with 5 minutes of data and 2 trackers is summarized to the console.
- **Mocks:** Session JSON with 5-minute duration and two tracker entries (`a` and `b`).
- **Assertions:** `console.log` was called with `"\nducky session complete"` and `"duration: 300s"`. Verifies the terminal summary output format.

---

## tests/commands/start.test.ts -- Start Command (3 tests)

### Mock setup
- `fs` (existsSync, readFileSync, writeFileSync, unlinkSync) and `child_process.fork` are mocked at the module level.
- `console.log`, `process.exit`, and `process.kill` are spied on and silenced in `beforeEach`.
- `fork` returns a mock child process with `pid: 99999` and a no-op `unref`.
- Tests use dynamic `import()` inside the test body so the module is freshly evaluated with the current mock state.

### "forks daemon and writes PID file"
- **Scenario:** No existing session exists (`start` proceeds to launch a new daemon).
- **Mocks:** `existsSync` returns `false` (no `.ducky.pid` file present).
- **Assertions:** `fork` was called (daemon spawned); `writeFileSync` was called with `".ducky.pid"` and the mock PID `"99999"`; `console.log` printed `"ducky started (pid 99999)"`. Verifies the happy path start flow.

### "reuses existing session if PID is still running"
- **Scenario:** A `.ducky.pid` file exists and the process it references is still alive.
- **Mocks:** `existsSync` returns `true`; `readFileSync` returns `"12345"`; `process.kill` succeeds (no error thrown), indicating the PID is valid.
- **Assertions:** `fork` was NOT called (no new daemon); `console.log` printed `"ducky is already tracking (pid 12345)"`. Verifies idempotent start behavior.

### "cleans stale PID file and starts fresh"
- **Scenario:** A `.ducky.pid` file exists but the referenced process is dead.
- **Mocks:** `existsSync` returns `true`; `readFileSync` returns `"12345"`; `process.kill` throws `"not found"`, indicating a stale PID.
- **Assertions:** `unlinkSync` was called with `".ducky.pid"` (stale file removed); `fork` was called (new daemon spawned). Verifies the recovery flow for orphaned PID files.

---

## tests/commands/stop.test.ts -- Stop Command (3 tests)

### Mock setup
- `fs` (existsSync, readFileSync, unlinkSync) and `reporter.generateReport` are mocked at the module level.
- `console.log`, `console.error`, and `process.kill` are spied on and silenced in `beforeEach`.
- Tests use dynamic `import()` for fresh module evaluation.

### "prints message when no active session"
- **Scenario:** User runs `ducky stop` when no `.ducky.pid` file exists.
- **Mocks:** `existsSync` returns `false`.
- **Assertions:** `console.log` was called with `"no active ducky session"`. Verifies graceful handling when there is nothing to stop.

### "handles invalid PID file"
- **Scenario:** The `.ducky.pid` file exists but contains non-numeric content.
- **Mocks:** `existsSync` returns `true`; `readFileSync` returns `"not-a-number"`.
- **Assertions:** `console.log` was called with `"invalid PID file, removing..."`; `unlinkSync` was called with `".ducky.pid"`. Verifies cleanup of corrupted PID files.

### "kills daemon and generates report on stop"
- **Scenario:** Normal stop flow -- daemon is running and session data exists.
- **Mocks:** `existsSync` returns `true` for both `".ducky.pid"` and `"ducky.session.json"`; `readFileSync` returns `"12345"`.
- **Assertions:** `process.kill` was called with `(12345, "SIGTERM")` (daemon terminated); `reporter.generateReport` was called (report generated). Verifies the full stop flow: kill daemon then produce final report.
