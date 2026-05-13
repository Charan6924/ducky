# ducky

A CLI tool that passively monitors a developer's local environment to capture signals about AI coding assistant usage during a session.

## Install

```bash
npm link
```

## Usage

```bash
ducky start       # begin tracking AI usage in the current directory
ducky stop        # stop tracking and save ducky-report.json
```

## What it tracks

ducky monitors traces that AI tools leave on a developer's machine — processes, filesystem events, editor state, clipboard, network activity, and version control patterns. All data stays local; nothing is sent externally.

## How it works

`ducky start` spawns a background watcher that passively collects signals until `ducky stop` is called. The stop command generates a structured JSON report summarizing the session.
