# git-digest
> Beautiful daily/weekly git activity digests. Auto-generated standup summaries.

```bash
npx git-digest
npx git-digest --week
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  git-digest · March 3, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Summary
  12 commits · 34 files changed · +892 / -241 lines

🏆 Contributors
  Nick (9 commits) ████████████████ 75%
  Sarah (3 commits) ████████         25%

🔥 Hot Files
  src/index.js          18 changes
  package.json          6 changes
  README.md             4 changes

📋 Commits
  ✨ feat (5)  fix (3)  📝 docs (2)  🔧 chore (2)

  ✨ add interactive mode for package selection
  ✨ implement async diff engine
  🐛 fix array comparison with nested objects
  🐛 resolve auth header env var parsing
  ...

🎯 Biggest commit: abc1234 (+204/-87) "feat: full rewrite of diff engine"

🤖 AI Summary (optional, needs ANTHROPIC_API_KEY)
  "The team shipped a major upgrade to the diff engine this week, adding
   interactive mode and fixing several edge cases in the auth flow..."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Commands
| Command | Description |
|---------|-------------|
| `git-digest` | Today's digest |
| `--week` | Weekly digest (Mon-Sun) |
| `--since "3 days ago"` | Custom time range |
| `--author <name>` | Filter by author |
| `--format markdown\|html\|text` | Output format |
| `--output <file>` | Save to file |
| `--repo <path>` | Analyze a different repo |
| `--branch <name>` | Specific branch |
| `--all-branches` | Aggregate all branches |
| `--ai` | AI summary (needs ANTHROPIC_API_KEY) |

## Install
```bash
npx git-digest
npm install -g git-digest
```

---
**Zero dependencies** · **Node 18+** · Made by [NickCirv](https://github.com/NickCirv) · MIT
