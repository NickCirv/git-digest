# git-digest — command reference

[Overview](../README.md) · [Research record](RESEARCH.md)

Describes revision `5e92cd6cd1e7fa004b686dba70d25d2e0f79218a`. Commands are source-inspected; no execution results are asserted.

## Workflow

Groups non-merge commits, contributors and changed files into text, Markdown or HTML. Can filter author/branch and write an output file. --ai requests an additional Anthropic summary.

Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

```bash
node index.js --since "7 days ago" --format markdown
```

## Commands and controls

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--since DATE` | Choose a history range |
| `--format markdown` | Render a Markdown digest |
| `--output PATH` | Save the digest |
| `--ai` | Send activity data to Anthropic for a summary |

## Interpretation and side effects

The default report is local, but --ai sends activity data to Anthropic and requires ANTHROPIC_API_KEY. Generated narrative needs review; a digest cannot account for work absent from Git.

## Implementation reference

- [package.json](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/package.json)
- [index.js](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/index.js)
- [test/smoke.test.js](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/test/smoke.test.js)
