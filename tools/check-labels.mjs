/**
 * Every record this project counts is a sentence somebody can read.
 *
 *   npm run check:labels
 *
 * AME-F1. The counts came from a phrase match: a mode was recorded whenever one
 * of its words appeared anywhere in an entry, and the page said an agent "wrote
 * down six failures 43 times". Read by hand over all 108 entries, measured at
 * tick 191:
 *
 *     matcher   54 records across 43 entries
 *     by hand   32 records across 25 entries
 *     25 of the matcher's hits rejected, 3 real records it never found
 *
 * The rejected ones are the word in another sense: tick 50's "escape" is the
 * Escape key unpinning a token, tick 31's "invisible character" is a byte order
 * mark in pasted input, tick 85's "stale" is "this time it was not stale". A
 * visitor who opens the mark for one of those finds an entry about something
 * else, which is the worst thing a page of this kind can do, because the whole
 * offer is that every mark opens its evidence.
 *
 * So `data/labels.json` is the count and the phrases find candidates. This gate
 * is what stops that file drifting from the log it describes.
 *
 * ## What it holds
 *
 *   1. Every labelled record names an entry that exists, with the tick that
 *      entry carries, and the sentence the label quotes is still in it. A label
 *      whose sentence has gone is a label about a document that changed.
 *   2. Every candidate the phrases find is either labelled or rejected, by name.
 *      Nothing is silently dropped, and adding a phrase to `MODES` without
 *      reading its new hits fails here.
 *   3. The totals in `corpus.json` are the totals in the labels. The page reads
 *      the first and a reader checks the second.
 *   4. Each rejection carries the phrase it matched and the sentence it matched
 *      in, so the judgement can be disagreed with rather than taken on trust.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MODES, entriesOf } from './corpus-lib.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const text = readFileSync(resolve(root, 'data/devlog.md'), 'utf8')
const labels = JSON.parse(readFileSync(resolve(root, 'data/labels.json'), 'utf8'))
const corpus = JSON.parse(readFileSync(resolve(root, 'src/generated/corpus.json'), 'utf8'))

const entries = entriesOf(text)
const flat = (s) => s.replace(/\s+/g, ' ')

let failed = 0
const fail = (what, detail) => {
  failed++
  console.error(`FAIL  ${what}`)
  if (detail) console.error(`      ${detail}`)
}

/* 1. Every label points at a sentence that is still there. */
const missing = []
const wrongTick = []
for (const r of labels.records) {
  const e = entries[r.entry - 1]
  if (!e) {
    missing.push(`entry ${r.entry} does not exist`)
    continue
  }
  if (e.tick !== r.tick) wrongTick.push(`entry ${r.entry} is tick ${e.tick} and the label says ${r.tick}`)
  if (!flat(e.body).includes(r.shows)) missing.push(`entry ${r.entry}, ${r.mode}: ${JSON.stringify(r.shows.slice(0, 70))}`)
}
if (missing.length > 0) {
  fail(`${missing.length} of ${labels.records.length} labels quote a sentence the log no longer contains`, missing.slice(0, 4).join('\n      '))
} else if (wrongTick.length > 0) {
  fail(`${wrongTick.length} labels name the wrong tick`, wrongTick.slice(0, 4).join('\n      '))
} else {
  console.log(`  ok      all ${labels.records.length} labels quote a sentence that is still in the entry they name`)
}

/* 2. Every candidate the phrases find is accounted for, one way or the other. */
const lower = entries.map((e) => e.body.toLowerCase())
const unaccounted = []
let candidates = 0
for (const mode of MODES) {
  for (let i = 0; i < entries.length; i++) {
    if (!mode.any.some((p) => lower[i].includes(p.toLowerCase()))) continue
    candidates++
    const n = i + 1
    const kept = labels.records.some((r) => r.entry === n && r.mode === mode.id)
    const thrown = labels.rejected.some((r) => r.entry === n && r.mode === mode.id)
    if (!kept && !thrown) unaccounted.push(`entry ${n}, ${mode.id}`)
  }
}
if (unaccounted.length > 0) {
  fail(
    `${unaccounted.length} candidates are neither labelled nor rejected`,
    unaccounted.slice(0, 5).join('; ') +
      '\n      A phrase added to MODES finds entries nobody has read. Read them and put each one in data/labels.json.',
  )
} else {
  console.log(`  ok      all ${candidates} candidates are accounted for: ${labels.records.length} kept, ${labels.rejected.length} rejected`)
}

/* 3. And the file the page reads says what the labels say. */
const byMode = Object.fromEntries(MODES.map((m) => [m.id, labels.records.filter((r) => r.mode === m.id).length]))
const wrong = corpus.modes.filter((m) => m.entries !== byMode[m.id])
const touching = new Set(labels.records.map((r) => r.entry)).size
if (wrong.length > 0) {
  fail(
    `${wrong.length} modes in corpus.json do not match the labels`,
    wrong.map((m) => `${m.id}: corpus ${m.entries}, labels ${byMode[m.id]}`).join('; ') +
      '\n      Run node tools/rebuild-derived.mjs, which rebuilds from the frozen log rather than refreezing it.',
  )
} else if (corpus.totals.entriesTouchingAnyMode !== touching) {
  fail(`corpus.json says ${corpus.totals.entriesTouchingAnyMode} entries touch a mode and the labels say ${touching}`)
} else {
  console.log(`  ok      corpus.json carries the labels' own totals: ${labels.records.length} records across ${touching} entries`)
}

/* 4. Every rejection shows its work. */
const bare = labels.rejected.filter((r) => !r.matched || !r.inSentence)
if (bare.length > 0) {
  fail(
    `${bare.length} rejections do not say what they matched or where`,
    'A judgement nobody can see is a judgement nobody can disagree with.',
  )
} else {
  const gone = labels.rejected.filter((r) => !flat(entries[r.entry - 1]?.body ?? '').includes(r.inSentence))
  if (gone.length > 0) {
    fail(`${gone.length} rejections quote a sentence the log no longer contains`, gone.slice(0, 3).map((r) => `entry ${r.entry}`).join('; '))
  } else {
    console.log(`  ok      all ${labels.rejected.length} rejections carry the phrase they matched and the sentence it was in`)
  }
}

if (failed > 0) {
  console.error('\nA count produced by matching words is a count of words. This project counts failures.')
  process.exit(1)
}

console.log(`labels: ${labels.records.length} records across ${touching} entries, every one a sentence a reader can open`)
