![git-digest — Nicholas Ashkar repository collection](assets/nicholas-ashkar/banner.png)

# git-digest

Create a readable summary of recent Git activity.


<a id="usage"></a>

## What it does

Groups non-merge commits, contributors and changed files into text, Markdown or HTML. Can filter author/branch and write an output file. --ai requests an additional Anthropic summary. See the pinned [implementation](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/index.js).


<a id="install"></a>

## Quickstart

Node requirement from the inspected manifest: **`>=20`**. Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

The following example is **source-inspected, not executed**. It uses a pinned checkout; npm package publication is not assumed. Replace project paths or provide the stated input fixtures before running it.

```bash
git clone https://github.com/NickCirv/git-digest.git
cd git-digest
git checkout 5e92cd6cd1e7fa004b686dba70d25d2e0f79218a
npm install --ignore-scripts
node index.js --since "7 days ago" --format markdown
```

Dependencies are installed with lifecycle scripts disabled in this recipe. Read the package scripts before enabling any lifecycle step required by your environment.

## Usage and reference

`git-digest` | `gd` are the executable names declared by the package. [Command reference](docs/REFERENCE.md) covers source-backed options and entry points.

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--since DATE` | Choose a history range |
| `--format markdown` | Render a Markdown digest |
| `--output PATH` | Save the digest |
| `--ai` | Send activity data to Anthropic for a summary |

## Limits and operational notes

The default report is local, but --ai sends activity data to Anthropic and requires ANTHROPIC_API_KEY. Generated narrative needs review; a digest cannot account for work absent from Git.

## Development

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

| Script | Declared command |
| --- | --- |
| `test` | `node --test` |

Work from the pinned source, keep changes focused, and reproduce the affected behavior with a small fixture before proposing a change. Existing contribution and security policies remain authoritative where present.

## Research and status

[Research record](docs/RESEARCH.md) identifies the inspected revision, source evidence, documentation disposition and verification gaps. Static inspection supports the descriptions here; runtime behavior, dependency installation and current hosted services remain unverified.

## License and author

[License](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/LICENSE)

[Nicholas Ashkar](https://nicholashkar.com) · Applied AI, systems and consulting.
