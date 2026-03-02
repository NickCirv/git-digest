#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import * as https_module from 'node:https'
import * as path from 'node:path'

// ─── CLI arg parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2)

function getArg(flag) {
  const i = args.indexOf(flag)
  if (i === -1) return null
  return args[i + 1] ?? true
}

function hasFlag(flag) {
  return args.includes(flag)
}

if (hasFlag('--help') || hasFlag('-h')) {
  printHelp()
  process.exit(0)
}

const opt = {
  week: hasFlag('--week'),
  since: getArg('--since'),
  author: getArg('--author'),
  format: getArg('--format') || 'text',
  output: getArg('--output'),
  repo: getArg('--repo') || process.cwd(),
  branch: getArg('--branch') || null,
  allBranches: hasFlag('--all-branches'),
  ai: hasFlag('--ai'),
}

function printHelp() {
  console.log(`
git-digest — Beautiful daily/weekly git activity digests

USAGE
  npx git-digest [options]

OPTIONS
  --week                Weekly digest (Mon–Sun)
  --since "3 days ago"  Custom time range
  --author <name>       Filter by author
  --format text|markdown|html  Output format (default: text)
  --output <file>       Save digest to file
  --repo <path>         Analyze a different repo (default: cwd)
  --branch <name>       Specific branch (default: current)
  --all-branches        Aggregate across all branches
  --ai                  Add AI summary (requires ANTHROPIC_API_KEY env var)
  --help                Show this help

EXAMPLES
  npx git-digest
  npx git-digest --week
  npx git-digest --since "3 days ago" --author Nick
  npx git-digest --format markdown --output digest.md
  npx git-digest --week --ai
`)
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()          // 0=Sun
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((day + 6) % 7))
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  return { start: mon, end: sun }
}

function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// ─── Git helpers ──────────────────────────────────────────────────────────────

function git(repoPath, gitArgs) {
  try {
    return execFileSync('git', ['-C', repoPath, ...gitArgs], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch (e) {
    return ''
  }
}

function currentBranch(repoPath) {
  return git(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']) || 'HEAD'
}

function buildLogArgs({ since, until, author, branch, allBranches }) {
  const a = []
  if (allBranches) {
    a.push('--all')
  } else if (branch) {
    a.push(branch)
  }
  if (since) a.push(`--since=${since}`)
  if (until) a.push(`--until=${until}`)
  if (author) a.push(`--author=${author}`)
  return a
}

// Returns array of { hash, authorName, authorEmail, subject, date }
function getCommits(repoPath, opts) {
  const fmt = '%H|%an|%ae|%s|%cd'
  const logArgs = [
    'log',
    `--format=${fmt}`,
    '--date=short',
    '--no-merges',
    ...buildLogArgs(opts),
  ]
  const raw = git(repoPath, logArgs)
  if (!raw) return []
  return raw.split('\n').filter(Boolean).map(line => {
    const [hash, authorName, authorEmail, subject, date] = line.split('|')
    return { hash, authorName, authorEmail, subject, date }
  })
}

// Returns { insertions, deletions, filesChanged, files: Map<file, {adds, dels}> }
function getDiffStats(repoPath, opts) {
  const logArgs = [
    'log',
    '--numstat',
    '--no-merges',
    '--format=COMMIT:%H',
    '--date=short',
    ...buildLogArgs(opts),
  ]
  const raw = git(repoPath, logArgs)
  const files = new Map()
  let totalIns = 0
  let totalDel = 0

  for (const line of raw.split('\n')) {
    if (!line || line.startsWith('COMMIT:') || line.startsWith('commit ')) continue
    const parts = line.split('\t')
    if (parts.length < 3) continue
    const adds = parseInt(parts[0], 10) || 0
    const dels = parseInt(parts[1], 10) || 0
    const file = parts[2]
    totalIns += adds
    totalDel += dels
    const prev = files.get(file) ?? { adds: 0, dels: 0 }
    files.set(file, { adds: prev.adds + adds, dels: prev.dels + dels })
  }

  return {
    insertions: totalIns,
    deletions: totalDel,
    filesChanged: files.size,
    files,
  }
}

// Returns { hash, subject, insertions, deletions } for the biggest single commit
function getBiggestCommit(repoPath, commits) {
  if (!commits.length) return null
  let best = null
  for (const c of commits) {
    const stat = git(repoPath, ['show', '--numstat', '--format=', c.hash])
    let ins = 0
    let del = 0
    for (const line of stat.split('\n')) {
      const p = line.split('\t')
      if (p.length < 2) continue
      ins += parseInt(p[0], 10) || 0
      del += parseInt(p[1], 10) || 0
    }
    if (!best || ins + del > best.insertions + best.deletions) {
      best = { hash: c.hash.slice(0, 7), subject: c.subject, insertions: ins, deletions: del }
    }
  }
  return best
}

// ─── Conventional commit type parsing ────────────────────────────────────────

const TYPE_META = {
  feat:     { label: '✨ feat',     emoji: '✨' },
  fix:      { label: '🐛 fix',      emoji: '🐛' },
  chore:    { label: '🔧 chore',    emoji: '🔧' },
  docs:     { label: '📝 docs',     emoji: '📝' },
  refactor: { label: '♻️  refactor', emoji: '♻️' },
  test:     { label: '🧪 test',     emoji: '🧪' },
  perf:     { label: '⚡ perf',     emoji: '⚡' },
  style:    { label: '💅 style',    emoji: '💅' },
  ci:       { label: '🤖 ci',       emoji: '🤖' },
  build:    { label: '📦 build',    emoji: '📦' },
  revert:   { label: '⏪ revert',   emoji: '⏪' },
  other:    { label: '📌 other',    emoji: '📌' },
}

function parseType(subject) {
  const m = subject.match(/^([a-z]+)(\([^)]*\))?[!:]/)
  if (m) {
    const t = m[1]
    return TYPE_META[t] ? t : 'other'
  }
  return 'other'
}

function groupByType(commits) {
  const groups = {}
  for (const c of commits) {
    const t = parseType(c.subject)
    if (!groups[t]) groups[t] = []
    groups[t].push(c)
  }
  return groups
}

// ─── Contributors ─────────────────────────────────────────────────────────────

function getContributors(commits) {
  const map = new Map()
  for (const c of commits) {
    const key = c.authorName
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
}

// ─── Hot files ────────────────────────────────────────────────────────────────

function getHotFiles(diffStats, topN = 8) {
  return [...diffStats.files.entries()]
    .map(([file, { adds, dels }]) => ({ file, total: adds + dels, adds, dels }))
    .sort((a, b) => b.total - a.total)
    .slice(0, topN)
}

// ─── Bar chart helper ─────────────────────────────────────────────────────────

function barChart(value, max, width = 20) {
  const filled = Math.round((value / max) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

// ─── AI summary ───────────────────────────────────────────────────────────────

async function getAiSummary(digestData) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const prompt = [
    'You are a technical writing assistant. Write a single concise paragraph (2-4 sentences)',
    'summarizing what the development team accomplished in this git digest. Be specific,',
    'highlight the most impactful changes, and sound like a human engineer, not a bot.',
    '',
    'Git digest data:',
    JSON.stringify(digestData, null, 2),
  ].join('\n')

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const reqOpts = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    }

    const req = https_module.request(reqOpts, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          const text = parsed?.content?.[0]?.text ?? null
          resolve(text)
        } catch {
          resolve(null)
        }
      })
    })

    req.on('error', () => resolve(null))
    req.setTimeout(15000, () => { req.destroy(); resolve(null) })
    req.write(body)
    req.end()
  })
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderText(data) {
  const { title, summary, contributors, hotFiles, groups, biggest, aiSummary, dateRange } = data
  const SEP = '━'.repeat(42)
  const lines = []

  lines.push(SEP)
  lines.push(`  git-digest · ${title}`)
  lines.push(SEP)
  lines.push('')

  // Summary
  lines.push('📦 Summary')
  lines.push(`  ${summary.commits} commits · ${summary.filesChanged} files changed · +${summary.insertions} / -${summary.deletions} lines`)
  lines.push('')

  // Contributors
  if (contributors.length > 1) {
    lines.push('🏆 Contributors')
    const max = contributors[0].count
    for (const c of contributors) {
      const pct = Math.round((c.count / summary.commits) * 100)
      const bar = barChart(c.count, max, 16)
      lines.push(`  ${c.name} (${c.count} commits) ${bar} ${pct}%`)
    }
    lines.push('')
  }

  // Hot files
  if (hotFiles.length) {
    lines.push('🔥 Hot Files')
    const maxChars = Math.max(...hotFiles.map(f => f.file.length))
    for (const f of hotFiles) {
      lines.push(`  ${f.file.padEnd(maxChars + 2)} ${f.total} changes`)
    }
    lines.push('')
  }

  // Commits by type
  if (Object.keys(groups).length) {
    lines.push('📋 Commits')
    const typeSummary = Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([t, cs]) => `${TYPE_META[t]?.label ?? t} (${cs.length})`)
      .join('  ')
    lines.push(`  ${typeSummary}`)
    lines.push('')
    for (const [type, cs] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
      const emoji = TYPE_META[type]?.emoji ?? '📌'
      for (const c of cs.slice(0, 10)) {
        lines.push(`  ${emoji} ${c.subject}`)
      }
      if (cs.length > 10) lines.push(`  ... and ${cs.length - 10} more`)
    }
    lines.push('')
  }

  // Biggest commit
  if (biggest) {
    lines.push(`🎯 Biggest commit: ${biggest.hash} (+${biggest.insertions}/-${biggest.deletions}) "${biggest.subject}"`)
    lines.push('')
  }

  // AI summary
  if (aiSummary) {
    lines.push('🤖 AI Summary')
    lines.push(`  "${aiSummary.trim()}"`)
    lines.push('')
  }

  lines.push(SEP)
  return lines.join('\n')
}

function renderMarkdown(data) {
  const { title, summary, contributors, hotFiles, groups, biggest, aiSummary } = data
  const lines = []

  lines.push(`# git-digest · ${title}`)
  lines.push('')

  lines.push('## 📦 Summary')
  lines.push('')
  lines.push(`| Metric | Value |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Commits | ${summary.commits} |`)
  lines.push(`| Files changed | ${summary.filesChanged} |`)
  lines.push(`| Lines added | +${summary.insertions} |`)
  lines.push(`| Lines removed | -${summary.deletions} |`)
  lines.push('')

  if (contributors.length > 1) {
    lines.push('## 🏆 Contributors')
    lines.push('')
    lines.push('| Author | Commits | Share |')
    lines.push('|--------|---------|-------|')
    for (const c of contributors) {
      const pct = Math.round((c.count / summary.commits) * 100)
      lines.push(`| ${c.name} | ${c.count} | ${pct}% |`)
    }
    lines.push('')
  }

  if (hotFiles.length) {
    lines.push('## 🔥 Hot Files')
    lines.push('')
    lines.push('| File | Changes | +Added | -Removed |')
    lines.push('|------|---------|--------|----------|')
    for (const f of hotFiles) {
      lines.push(`| \`${f.file}\` | ${f.total} | +${f.adds} | -${f.dels} |`)
    }
    lines.push('')
  }

  if (Object.keys(groups).length) {
    lines.push('## 📋 Commits')
    lines.push('')
    for (const [type, cs] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
      const meta = TYPE_META[type] ?? TYPE_META.other
      lines.push(`### ${meta.label} (${cs.length})`)
      lines.push('')
      for (const c of cs.slice(0, 15)) {
        lines.push(`- ${c.subject} \`${c.hash.slice(0, 7)}\` — ${c.date} by ${c.authorName}`)
      }
      if (cs.length > 15) lines.push(`- _...and ${cs.length - 15} more_`)
      lines.push('')
    }
  }

  if (biggest) {
    lines.push('## 🎯 Biggest Commit')
    lines.push('')
    lines.push(`**\`${biggest.hash}\`** — ${biggest.subject}`)
    lines.push(`> +${biggest.insertions} / -${biggest.deletions} lines`)
    lines.push('')
  }

  if (aiSummary) {
    lines.push('## 🤖 AI Summary')
    lines.push('')
    lines.push(`> ${aiSummary.trim()}`)
    lines.push('')
  }

  lines.push('---')
  lines.push('_Generated by [git-digest](https://github.com/NickCirv/git-digest)_')
  return lines.join('\n')
}

function renderHtml(data) {
  const { title, summary, contributors, hotFiles, groups, biggest, aiSummary } = data

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>git-digest · ${esc(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d1117; color: #e6edf3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; padding: 24px; }
  .container { max-width: 720px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1f2d3d, #0d1117); border: 1px solid #30363d; border-radius: 12px; padding: 28px 32px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 700; color: #58a6ff; letter-spacing: -0.5px; }
  .header .subtitle { color: #8b949e; font-size: 13px; margin-top: 4px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 20px 24px; margin-bottom: 16px; }
  .card h2 { font-size: 15px; font-weight: 600; margin-bottom: 14px; color: #e6edf3; }
  .stat-grid { display: flex; gap: 24px; flex-wrap: wrap; }
  .stat { text-align: center; }
  .stat .val { font-size: 28px; font-weight: 700; color: #58a6ff; }
  .stat .lbl { font-size: 12px; color: #8b949e; margin-top: 2px; }
  .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 13px; }
  .bar-track { flex: 1; background: #21262d; border-radius: 4px; height: 8px; overflow: hidden; }
  .bar-fill { background: linear-gradient(90deg, #58a6ff, #3fb950); height: 100%; border-radius: 4px; }
  .author-name { min-width: 130px; color: #e6edf3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pct { min-width: 36px; text-align: right; color: #8b949e; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: #8b949e; font-weight: 500; padding: 6px 8px; border-bottom: 1px solid #30363d; }
  td { padding: 6px 8px; border-bottom: 1px solid #21262d; color: #e6edf3; }
  td code { background: #21262d; padding: 2px 5px; border-radius: 4px; font-size: 12px; color: #79c0ff; }
  .type-section { margin-bottom: 14px; }
  .type-label { font-size: 13px; font-weight: 600; color: #58a6ff; margin-bottom: 6px; }
  .commit-item { font-size: 13px; color: #c9d1d9; padding: 4px 0; border-bottom: 1px solid #21262d; }
  .commit-hash { color: #8b949e; font-size: 11px; margin-left: 6px; }
  .biggest { background: #1c2128; border-left: 3px solid #f78166; border-radius: 0 8px 8px 0; padding: 14px 16px; font-size: 13px; }
  .biggest .hash { color: #f78166; font-weight: 700; }
  .biggest .subj { color: #e6edf3; margin-top: 4px; }
  .biggest .lines { color: #3fb950; margin-top: 4px; font-size: 12px; }
  .ai-box { background: #1c2128; border: 1px dashed #30363d; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #c9d1d9; font-style: italic; }
  .footer { text-align: center; color: #8b949e; font-size: 12px; margin-top: 24px; }
  .footer a { color: #58a6ff; }
  .ins { color: #3fb950; } .del { color: #f78166; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>git-digest</h1>
    <div class="subtitle">${esc(title)}</div>
  </div>

  <div class="card">
    <h2>📦 Summary</h2>
    <div class="stat-grid">
      <div class="stat"><div class="val">${summary.commits}</div><div class="lbl">commits</div></div>
      <div class="stat"><div class="val">${summary.filesChanged}</div><div class="lbl">files changed</div></div>
      <div class="stat"><div class="val ins">+${summary.insertions}</div><div class="lbl">lines added</div></div>
      <div class="stat"><div class="val del">-${summary.deletions}</div><div class="lbl">lines removed</div></div>
    </div>
  </div>
`

  if (contributors.length > 1) {
    html += `  <div class="card">
    <h2>🏆 Contributors</h2>
`
    const max = contributors[0].count
    for (const c of contributors) {
      const pct = Math.round((c.count / summary.commits) * 100)
      html += `    <div class="bar-row">
      <div class="author-name">${esc(c.name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="pct">${c.count} (${pct}%)</div>
    </div>
`
    }
    html += `  </div>\n`
  }

  if (hotFiles.length) {
    html += `  <div class="card">
    <h2>🔥 Hot Files</h2>
    <table>
      <thead><tr><th>File</th><th>Changes</th><th>Added</th><th>Removed</th></tr></thead>
      <tbody>
`
    for (const f of hotFiles) {
      html += `        <tr><td><code>${esc(f.file)}</code></td><td>${f.total}</td><td class="ins">+${f.adds}</td><td class="del">-${f.dels}</td></tr>\n`
    }
    html += `      </tbody>
    </table>
  </div>
`
  }

  if (Object.keys(groups).length) {
    html += `  <div class="card">
    <h2>📋 Commits</h2>
`
    for (const [type, cs] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
      const meta = TYPE_META[type] ?? TYPE_META.other
      html += `    <div class="type-section">
      <div class="type-label">${esc(meta.label)} (${cs.length})</div>
`
      for (const c of cs.slice(0, 12)) {
        html += `      <div class="commit-item">${meta.emoji} ${esc(c.subject)}<span class="commit-hash">${c.hash.slice(0, 7)}</span></div>\n`
      }
      if (cs.length > 12) html += `      <div class="commit-item" style="color:#8b949e">... and ${cs.length - 12} more</div>\n`
      html += `    </div>\n`
    }
    html += `  </div>\n`
  }

  if (biggest) {
    html += `  <div class="card">
    <h2>🎯 Biggest Commit</h2>
    <div class="biggest">
      <div class="hash">${esc(biggest.hash)}</div>
      <div class="subj">${esc(biggest.subject)}</div>
      <div class="lines">+${biggest.insertions} / -${biggest.deletions} lines</div>
    </div>
  </div>
`
  }

  if (aiSummary) {
    html += `  <div class="card">
    <h2>🤖 AI Summary</h2>
    <div class="ai-box">${esc(aiSummary.trim())}</div>
  </div>
`
  }

  html += `  <div class="footer">Generated by <a href="https://github.com/NickCirv/git-digest">git-digest</a> · MIT</div>
</div>
</body>
</html>`

  return html
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const repoPath = path.resolve(opt.repo)

  // Determine time range
  let since, until, title

  if (opt.since) {
    since = opt.since
    until = null
    title = `Since "${opt.since}"`
  } else if (opt.week) {
    const { start, end } = getWeekRange()
    since = isoDate(start)
    until = isoDate(end)
    title = `Week of ${formatDate(start)}`
  } else {
    const { start } = getTodayRange()
    since = isoDate(start)
    until = null
    title = `${formatDate(new Date())}`
  }

  if (opt.author) title += ` · @${opt.author}`

  const branch = opt.branch ?? (!opt.allBranches ? currentBranch(repoPath) : null)
  const gitOpts = { since, until, author: opt.author, branch, allBranches: opt.allBranches }

  // Collect data
  const commits = getCommits(repoPath, gitOpts)

  if (!commits.length) {
    console.log(`No commits found for the specified range.`)
    console.log(`  repo: ${repoPath}`)
    console.log(`  since: ${since}`)
    if (until) console.log(`  until: ${until}`)
    if (opt.author) console.log(`  author: ${opt.author}`)
    process.exit(0)
  }

  const diffStats = getDiffStats(repoPath, gitOpts)
  const contributors = getContributors(commits)
  const hotFiles = getHotFiles(diffStats)
  const groups = groupByType(commits)
  const biggest = getBiggestCommit(repoPath, commits)

  // AI summary data payload (no secrets, just aggregate metrics)
  const aiPayload = {
    period: title,
    commits: commits.length,
    filesChanged: diffStats.filesChanged,
    insertions: diffStats.insertions,
    deletions: diffStats.deletions,
    contributors: contributors.map(c => ({ name: c.name, commits: c.count })),
    commitTypes: Object.fromEntries(Object.entries(groups).map(([t, cs]) => [t, cs.length])),
    topSubjects: commits.slice(0, 8).map(c => c.subject),
    hotFiles: hotFiles.slice(0, 5).map(f => f.file),
  }

  const aiSummary = opt.ai ? await getAiSummary(aiPayload) : null

  const data = {
    title,
    summary: {
      commits: commits.length,
      filesChanged: diffStats.filesChanged,
      insertions: diffStats.insertions,
      deletions: diffStats.deletions,
    },
    contributors,
    hotFiles,
    groups,
    biggest,
    aiSummary,
  }

  let output
  switch (opt.format) {
    case 'markdown': output = renderMarkdown(data); break
    case 'html':     output = renderHtml(data); break
    default:         output = renderText(data); break
  }

  if (opt.output) {
    writeFileSync(opt.output, output, 'utf8')
    console.log(`Digest saved to ${opt.output}`)
  } else {
    console.log(output)
  }
}

main().catch(err => {
  console.error('git-digest error:', err.message)
  process.exit(1)
})
