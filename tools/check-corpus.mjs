/**
 * Every number here is recomputed from the committed log, and the committed log
 * is the one it was measured from.
 *
 *   npm run check:corpus
 *
 * Two questions, and the second is the one that gets skipped everywhere.
 *
 * 1. **Does the committed JSON match the committed source?** Re-run the
 *    extraction and compare. A generated file that nobody regenerates is a
 *    cache, and a cache nobody invalidates is a lie with a timestamp on it.
 * 2. **Is the committed source the one that was measured?** Hash it. Without
 *    this, `data/devlog.md` could be edited by hand and the JSON rebuilt from
 *    the edit, and every count would stay internally consistent and be about a
 *    document nobody else has.
 *
 * The second is why this project freezes the log at all. The measurement that
 * produced this file:
 *
 *   committed 2026-09-24 17:50   107 entries, 106 ticks, to tick 103
 *   the same live file at 18:09  108 entries, 107 ticks, to tick 104
 *
 * Nineteen minutes, one entry, and nothing anywhere failed, because the gate
 * that existed held prose to a JSON and the JSON to nothing. `chunkline` was
 * bitten by the identical shape through Wikipedia and its README carries the
 * sentence this is built on: both measurements were honest, they were
 * measurements of different documents.
 *
 * Deliberately not checked: whether `data/devlog.md` still matches the live
 * `../../DEVLOG.md`. It does not, by design, and it never will again after the
 * next tick. Requiring it would be requiring the published numbers to change
 * every thirty minutes, which is the defect rather than the fix.
 */

import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extract } from './corpus-lib.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const frozen = resolve(root, 'data/devlog.md')
const generated = resolve(root, 'src/generated/corpus.json')

let failed = 0
const fail = (what, detail) => {
  failed++
  console.error(`FAIL  ${what}`)
  if (detail) console.error(`      ${detail}`)
}

for (const [path, name] of [
  [frozen, 'data/devlog.md'],
  [generated, 'src/generated/corpus.json'],
]) {
  if (!existsSync(path)) {
    console.error(`FAIL  ${name} is missing. Run npm run build:corpus`)
    process.exit(1)
  }
}

const committed = JSON.parse(readFileSync(generated, 'utf8'))
const bytes = readFileSync(frozen)
const sha256 = createHash('sha256').update(bytes).digest('hex')

// 2, first, because if the source moved then every count below is answering a
// question about a file that is not there any more.
if (!committed.source?.sha256) {
  fail('src/generated/corpus.json records no sha256 for its source', 'It was built before this gate read one. Run npm run build:corpus')
} else if (committed.source.sha256 !== sha256) {
  fail(
    'data/devlog.md is not the file the corpus was measured from',
    `recorded ${committed.source.sha256.slice(0, 16)}..., on disk ${sha256.slice(0, 16)}...\n` +
      `      Recorded ${committed.source.bytes} bytes, on disk ${bytes.length}.\n` +
      '      Either restore the file or run npm run build:corpus and update every number that moved.',
  )
} else {
  console.log(`  ok      data/devlog.md is the ${(bytes.length / 1024).toFixed(0)} KB frozen on ${committed.source.frozen}, sha256 ${sha256.slice(0, 16)}...`)
}

// 1. The same extraction, run again, against the same source.
const fresh = extract(readFileSync(frozen, 'utf8'))

const drift = []
const cmp = (path, a, b) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) drift.push(`${path}: committed ${JSON.stringify(a)}, recomputed ${JSON.stringify(b)}`)
}

cmp('entries.length', committed.entries.length, fresh.entries.length)
for (const k of Object.keys(fresh.totals)) cmp(`totals.${k}`, committed.totals?.[k], fresh.totals[k])

cmp('modes.length', committed.modes.length, fresh.modes.length)
for (const [i, m] of fresh.modes.entries()) {
  const c = committed.modes[i]
  if (!c) {
    drift.push(`modes[${i}] is missing from the committed corpus`)
    continue
  }
  for (const k of ['id', 'entries', 'replayable', 'firstSeen']) cmp(`modes[${i}].${k}`, c[k], m[k])
}

if (drift.length > 0) {
  fail(
    `the committed corpus disagrees with the log it was built from in ${drift.length} place${drift.length === 1 ? '' : 's'}`,
    drift.join('\n      '),
  )
} else {
  console.log(`  ok      ${fresh.entries.length} entries and ${fresh.modes.length} modes recompute to exactly what is committed`)
}

/*
 * And the rule the taxonomy stands on. A mode with one run is an anecdote, and
 * this project's whole claim is recurrence, so the page must not be able to draw
 * one as a pattern.
 */
const thin = fresh.modes.filter((m) => m.replayable < 2)
if (thin.length > 0) {
  fail(
    `${thin.length} mode${thin.length === 1 ? ' has' : 's have'} fewer than two replayable runs`,
    thin.map((m) => `${m.id}: ${m.replayable}`).join('; ') + '\n      Either the mode goes, or the claim of recurrence does.',
  )
} else {
  console.log(`  ok      all ${fresh.modes.length} modes have two or more replayable runs`)
}

if (failed > 0) {
  console.error('\nA number measured from a moving file is a number about a document that no longer exists.')
  process.exit(1)
}

console.log('corpus: every count comes out of the committed log, and the log is the one measured')
