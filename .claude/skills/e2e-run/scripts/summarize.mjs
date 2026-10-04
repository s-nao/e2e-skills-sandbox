#!/usr/bin/env node
// Playwright の JSON レポーターの出力を Markdown のレポートにする。
//   node summarize.mjs e2e/test-results/results.json > report.md
import { readFileSync } from 'node:fs'

const results = JSON.parse(readFileSync(process.argv[2], 'utf8'))

const rows = []
function walk(suite, file) {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      const r = t.results.at(-1) ?? {}
      const attach = (name) => {
        const a = (r.attachments ?? []).find((x) => x.name === name)
        return a?.body ? JSON.parse(Buffer.from(a.body, 'base64').toString('utf8')) : null
      }
      rows.push({
        file: spec.file ?? file,
        title: spec.title,
        status: r.status ?? 'skipped',
        duration: r.duration ?? 0,
        error: r.error?.message?.split('\n').slice(0, 6).join('\n') ?? '',
        screenshots: (r.attachments ?? []).filter((a) => a.name === 'screenshot' && a.path).map((a) => a.path),
        api: attach('api-timings') ?? [],
        nav: attach('nav-timings'),
        consoleErrors: attach('console-errors') ?? [],
      })
    }
  }
  for (const child of suite.suites ?? []) walk(child, suite.file ?? file)
}
for (const s of results.suites) walk(s, s.file)

const icon = { passed: '✅', failed: '❌', timedOut: '⏱️', skipped: '⏭️', interrupted: '⛔' }
const count = (st) => rows.filter((r) => r.status === st).length
const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

const out = []
out.push(`# E2E 実行結果`, '')
out.push(`- 日時: ${now}`)
out.push(`- 結果: ✅ ${count('passed')} / ❌ ${count('failed') + count('timedOut')} / ⏭️ ${count('skipped')}（全 ${rows.length} 件）`, '')

out.push('## シナリオ', '', '| 結果 | シナリオ | 所要 | API 呼び出し | API 最大 | load |', '|---|---|---:|---:|---:|---:|')
for (const r of rows) {
  const apiMax = r.api.length ? Math.max(...r.api.map((a) => a.ms)) : 0
  out.push(
    `| ${icon[r.status] ?? r.status} | ${r.title} | ${(r.duration / 1000).toFixed(1)}s | ${r.api.length} | ${apiMax}ms | ${r.nav ? r.nav.load + 'ms' : '-'} |`,
  )
}

// API エンドポイントごとの集計（クエリ文字列は除く）
const byEndpoint = new Map()
for (const r of rows)
  for (const a of r.api) {
    const key = `${a.method} ${a.url.split('?')[0].replace(/\/\d+(?=\/|$)/g, '/:id')}`
    byEndpoint.set(key, [...(byEndpoint.get(key) ?? []), a.ms])
  }
const pct = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
}
out.push('', '## API 応答時間', '', '| エンドポイント | 回数 | p50 | p95 | 最大 |', '|---|---:|---:|---:|---:|')
for (const [k, xs] of [...byEndpoint].sort()) {
  out.push(`| \`${k}\` | ${xs.length} | ${pct(xs, 50)}ms | ${pct(xs, 95)}ms | ${Math.max(...xs)}ms |`)
}
const slow = rows.flatMap((r) => r.api.filter((a) => a.ms > 500).map((a) => ({ ...a, title: r.title })))
if (slow.length) {
  out.push('', '### 500ms を超えたリクエスト', '')
  for (const s of slow) out.push(`- ${s.title}: \`${s.method} ${s.url}\` ${s.ms}ms (${s.status})`)
}

const failed = rows.filter((r) => r.status !== 'passed' && r.status !== 'skipped')
if (failed.length) {
  out.push('', '## 失敗の詳細', '')
  for (const r of failed) {
    out.push(`### ${r.title}`, '', '```', r.error.replace(/\x1b\[[0-9;]*m/g, ''), '```')
    for (const p of r.screenshots) out.push(`- screenshot: \`${p}\``)
    out.push('')
  }
}

const withConsole = rows.filter((r) => r.consoleErrors.length)
if (withConsole.length) {
  out.push('', '## console.error', '')
  for (const r of withConsole) for (const m of r.consoleErrors) out.push(`- ${r.title}: ${m}`)
}

console.log(out.join('\n'))
