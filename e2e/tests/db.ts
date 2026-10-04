import { execFileSync } from 'node:child_process'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '../..')

/**
 * テストの中から DB の状態を確認するためのヘルパー（読み取り専用）。
 * scripts/db-query.sh を経由するので、接続先は E2E_DB_URL に従う。
 */
export function queryRows(sql: string): Record<string, string>[] {
  const csv = execFileSync(path.join(ROOT, 'scripts/db-query.sh'), ['--csv', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
  const [header, ...lines] = csv.split('\n')
  const keys = header.split(',')
  return lines.map((line) => Object.fromEntries(line.split(',').map((v, i) => [keys[i], v])))
}

export function queryValue(sql: string): string {
  const [row] = queryRows(sql)
  return row ? Object.values(row)[0] : ''
}
