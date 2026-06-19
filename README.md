<div align="center">

# git-digest

**Turn your git log into a beautiful daily or weekly standup digest — in one command**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?labelColor=0B0A09)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?labelColor=0B0A09)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?labelColor=0B0A09)](package.json)

</div>

## Install

```bash
npx github:NickCirv/git-digest
```

## Usage

```bash
# Today's digest (current repo)
npx github:NickCirv/git-digest

# This week's digest, saved as markdown
npx github:NickCirv/git-digest --week --format markdown --output digest.md

# Filter by author, custom range, AI summary
npx github:NickCirv/git-digest --since "3 days ago" --author Nick --ai
```

| Flag | Description |
|------|-------------|
| `--week` | Weekly digest (Mon–Sun) |
| `--since "<range>"` | Custom time range (e.g. `"3 days ago"`) |
| `--author <name>` | Filter by author |
| `--format text\|markdown\|html` | Output format (default: `text`) |
| `--output <file>` | Save digest to file |
| `--repo <path>` | Analyze a different repo (default: cwd) |
| `--branch <name>` | Specific branch |
| `--all-branches` | Aggregate across all branches |
| `--ai` | Add AI summary (requires `ANTHROPIC_API_KEY`) |

## What it does

Runs `git log` against your repo and renders a structured digest: commit count, lines changed, hot files, contributors with bar charts, conventional-commit type breakdown, and the biggest single commit. Output formats are terminal text, Markdown, and a self-contained dark-theme HTML page. Pass `--ai` with an Anthropic API key for a one-paragraph prose summary of the period.

---
<sub>Zero dependencies · Node 18+ · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
