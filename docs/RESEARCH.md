# git-digest — research record

## Revision and scope

- Repository: [NickCirv/git-digest](https://github.com/NickCirv/git-digest)
- Commit: `5e92cd6cd1e7fa004b686dba70d25d2e0f79218a`
- Tree: `ec02fba3c7129e76e060d6837f69d757bbfb1361`
- Captured: 6 of 6 eligible text files (all eligible text files).
- Recursive tree truncated: `False`.
- Runtime verification: **unverified**; no repository code, installation or test command was executed.

The captured file inventory is broader than the semantic review. Authoring inspected package metadata, entrypoint/argument handling and implementation paths relevant to the claims below, plus test declarations. This is documentation research, not a line-by-line security audit. Generated/binary artifacts, lockfiles and file types outside the acquisition filter were not inspected.

## Claim and evidence

| Claim | Pinned evidence | Status |
| --- | --- | --- |
| Runtime requirement and executable mapping | [package.json](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/package.json) | verified in manifest; installation unverified |
| Create a readable summary of recent Git activity. | [implementation](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/index.js) | partially verified by static implementation review |
| Operational limits and side effects | [implementation](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/index.js) and source map in [reference](REFERENCE.md) | partially verified; runtime unverified |
| Test command definition | [package.json](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/package.json) | verified as a declaration only |

## Findings carried into the rewrite

The default report is local, but --ai sends activity data to Anthropic and requires ANTHROPIC_API_KEY. Generated narrative needs review; a digest cannot account for work absent from Git.

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

## Documentation inventory and disposition

| Existing document | Disposition |
| --- | --- |
| [README.md](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/README.md) | Rewritten overview; historical copy remains at this pinned URL. |

New supporting documents: `docs/REFERENCE.md` and `docs/RESEARCH.md`. No original source or protected legal/security file was changed.

## Protected-file evidence

- `LICENSE` SHA-256 `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d`.

## Remaining verification

Clean installation, useful-command execution, malformed input, side-effect boundaries, platform compatibility and end-to-end tests remain unverified. Package-registry availability and live API destinations were not checked. No performance, customer-adoption, compliance or production-readiness claim is made.

## Captured evidence index

- [LICENSE](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/LICENSE) · blob `05b804beeec7d1a6c933d087387ba4adf6463d93`.
- [README.md](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/README.md) · blob `fca4311d95ea9eaceab9eb2a6b53363dd95728ec`.
- [package.json](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/package.json) · blob `e96996f9e6f5e3ba1877149a9d924785a8dcf072`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/.github/workflows/ci.yml) · blob `44515034a394670de44454a7a1bd2c7ef0c9836e`.
- [index.js](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/index.js) · blob `3304b85b1cf967dee738f754446624c2511a1fc8`.
- [test/smoke.test.js](https://github.com/NickCirv/git-digest/blob/5e92cd6cd1e7fa004b686dba70d25d2e0f79218a/test/smoke.test.js) · blob `ebbccaaf2583b4850575f835313e4b0afd21bff7`.

## Tree files outside the captured text set

These paths were mapped but their contents were not acquired in this research pass:

- `banner.svg`
