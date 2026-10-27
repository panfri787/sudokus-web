// Falla si el JavaScript del build supera el presupuesto (plan: < 150 KB gzip).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET = 150 * 1024
const dir = new URL('../dist/assets/', import.meta.url).pathname
const files = readdirSync(dir).filter((f) => f.endsWith('.js'))
let total = 0
for (const f of files) {
  const size = gzipSync(readFileSync(join(dir, f))).length
  total += size
  console.log(`${f.padEnd(40)} ${(size / 1024).toFixed(1)} KB gzip`)
}
console.log(`Total: ${(total / 1024).toFixed(1)} KB gzip (límite ${BUDGET / 1024} KB)`)
if (total > BUDGET) process.exit(1)
