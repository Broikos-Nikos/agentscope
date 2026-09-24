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
import { extract, entriesOf } from './corpus-lib.mjs'

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
/*
 * The size a clone sees, not the size this checkout has, and floored rather
 * than rounded because `check:claims` floors it and the README carries the
 * result. Two roundings of one number is how `evalkit` shipped a headline of
 * 177 over a library that said 178, with nine assertions green.
 */
const normalisedBytes = Buffer.byteLength(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8')
/*
 * The hash of the text, not of the bytes on this disk. Git stores text with LF
 * and checks it out with CRLF wherever `core.autocrlf` is on, which is the
 * default on Windows, so the same committed file has two sha256 values
 * depending on who cloned it. This project's own input hashed one way here and
 * another in a fresh clone, and the gate below would have failed on every
 * machine except the one that wrote it, CI included. Normalising first makes
 * the value a property of the document rather than of the checkout.
 */
const textSha = (buf) => createHash('sha256').update(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8').digest('hex')
const sha256 = textSha(bytes)

// 2, first, because if the source moved then every count below is answering a
// question about a file that is not there any more.
if (!committed.source?.sha256) {
  fail('src/generated/corpus.json records no sha256 for its source', 'It was built before this gate read one. Run npm run build:corpus')
} else if (committed.source.sha256 !== sha256) {
  fail(
    'data/devlog.md is not the file the corpus was measured from',
    `recorded ${committed.source.sha256.slice(0, 16)}..., on disk ${sha256.slice(0, 16)}...\n` +
      `      Recorded ${committed.source.bytes} bytes, on disk ${normalisedBytes}.\n` +
      '      Either restore the file or run npm run build:corpus and update every number that moved.',
  )
} else {
  console.log(`  ok      data/devlog.md is the ${Math.floor(normalisedBytes / 1024)} KB frozen on ${committed.source.frozen}, sha256 ${sha256.slice(0, 16)}...`)
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
 * And the entry text, which is a second generated file from the same source.
 *
 * It exists because the bodies are 316 KB and the grid does not need them, so
 * they are fetched on a click instead of inlined. A split like that is a second
 * thing that can go stale, and it did, within ten minutes of being written: the
 * corpus was restored to the committed freeze and `entries.json` was left
 * holding the bodies of a longer one. Nothing would have said so. The page would
 * have opened entry 108 and shown the text of an entry the grid does not have.
 */
const committedBodies = JSON.parse(readFileSync(resolve(root, 'src/generated/entries.json'), 'utf8'))
const freshBodies = entriesOf(readFileSync(frozen, 'utf8')).map((e) => e.body)

if (committedBodies.length !== freshBodies.length) {
  fail(
    `src/generated/entries.json holds ${committedBodies.length} entries and the log has ${freshBodies.length}`,
    'Run npm run build:corpus. The grid and the text a click opens come from one file.',
  )
} else {
  const differ = freshBodies.filter((b, i) => b !== committedBodies[i]).length
  if (differ > 0) {
    fail(
      `${differ} of ${freshBodies.length} entry bodies differ from the committed log`,
      'The count matched and the text did not, which is the worse half of this failure.',
    )
  } else {
    console.log(`  ok      ${committedBodies.length} entry bodies are the text of the committed log`)
  }
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
