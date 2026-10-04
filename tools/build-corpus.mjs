/**
 * Freeze the devlog into a corpus this repository can be held to.
 *
 *   npm run build:corpus     # re-reads the live log. Changes the numbers. Not run by the build.
 *   npm run check:corpus     # recomputes everything from the frozen copy. Run by every build.
 *
 * The dataset behind this project is one agent's development log, written while
 * the failures were happening. That log is a live file in the workspace above
 * this repository and it grows every thirty minutes, which makes it the worst
 * possible thing to point a published page at.
 *
 * This is not a guess. The spec's own measuring tool read the live file and
 * wrote its counts to disk, and the counts were stale one tick later:
 *
 *   committed 2026-09-24 17:50   107 entries, 106 ticks, to tick 103, 42 touching a mode
 *   the same file at 18:09       108 entries, 107 ticks, to tick 104, 43 touching a mode
 *
 * Nothing failed in between. The gate held the spec's prose to the committed
 * JSON and the JSON to nothing at all, so the one number that had moved was the
 * one number nobody was checking. That is the first mode in this project's own
 * taxonomy, "the record that outlived what it described", occurring in the
 * tooling built to count it.
 *
 * `chunkline` learned the identical lesson from Wikipedia and wrote it down:
 * its first version fetched articles, recorded their revision ids and saved no
 * text, two of them were edited within a day, and re-running the same processing
 * gave a different answer. Both measurements were honest. They were measurements
 * of different documents.
 *
 * So the log is copied into `data/devlog.md` and committed, with its sha256, its
 * size and the date it was taken. Everything the page shows is computed from
 * that copy. The live log moving on is expected and is no longer this
 * repository's problem: a reader who clones this gets the numbers the page
 * states, forever, because the thing they were measured from is in the clone.
 */

import { createHash } from 'node:crypto'
import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MODES, extract, entriesOf } from './corpus-lib.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LIVE = resolve(root, '../../DEVLOG.md')
const FROZEN = resolve(root, 'data/devlog.md')

mkdirSync(resolve(root, 'data'), { recursive: true })
mkdirSync(resolve(root, 'src/generated'), { recursive: true })

copyFileSync(LIVE, FROZEN)

const text = readFileSync(FROZEN, 'utf8')
/*
 * The hash of the text, not of the bytes on this disk. Git stores text with LF
 * and checks it out with CRLF wherever `core.autocrlf` is on, which is the
 * default on Windows, so the same committed file has two sha256 values
 * depending on who cloned it. This project's own input hashed one way here and
 * another in a fresh clone, and the gate below would have failed on every
 * machine except the one that wrote it, CI included. Normalising first makes
 * the value a property of the document rather than of the checkout.
 */
const normalise = (buf) => buf.toString('utf8').replace(/\r\n/g, '\n')
const textSha = (buf) => createHash('sha256').update(normalise(buf), 'utf8').digest('hex')
/* The size of the document too, for the same reason: 334,255 bytes on this
 * disk against 327,443 in a clone is the same file, and the README quotes it. */
const textBytes = (buf) => Buffer.byteLength(normalise(buf), 'utf8')
const sha256 = textSha(readFileSync(FROZEN))

const labels = JSON.parse(readFileSync(resolve(root, 'data/labels.json'), 'utf8'))
const corpus = extract(text, labels)
corpus.source = {
  what: 'The development log of the workspace that built this project and its siblings.',
  file: 'data/devlog.md',
  frozen: new Date().toISOString().slice(0, 10),
  sha256,
  bytes: textBytes(readFileSync(FROZEN)),
  why: 'The live log grows every tick. A number measured from a moving file is a number about a document that no longer exists.',
}

/*
 * The bodies go in their own file, fetched when a reader opens an entry.
 *
 * Measured before deciding: 316 KB of entry text, median 2.7 KB, largest 7.0 KB.
 * Inlining all of it would put a third of a megabyte into the first paint of a
 * page whose first paint is a grid of marks, and a reader who never opened one
 * would have downloaded the entire development log to look at a picture.
 *
 * So `corpus.json` carries what the grid needs and `entries.json` carries what a
 * click needs. Both are committed and both are checked, so this is a split
 * rather than a shortcut.
 */
const bodies = entriesOf(text).map((e) => e.body)
writeFileSync(resolve(root, 'src/generated/entries.json'), JSON.stringify(bodies) + String.fromCharCode(10))

writeFileSync(resolve(root, 'src/generated/corpus.json'), JSON.stringify(corpus, null, 2) + '\n')

console.log(`data/devlog.md            ${(corpus.source.bytes / 1024).toFixed(0)} KB, sha256 ${sha256.slice(0, 16)}...`)
console.log(`src/generated/corpus.json ${corpus.entries.length} entries, ${corpus.modes.length} modes`)
console.log(`src/generated/entries.json ${(JSON.stringify(bodies).length / 1024).toFixed(0)} KB of entry text, fetched on a click`)
for (const m of corpus.modes) {
  console.log(`  ${String(m.entries).padStart(3)} entries, ${String(m.replayable).padStart(3)} with a run   ${m.id}`)
}
console.log(`${corpus.totals.entriesTouchingAnyMode} of ${corpus.entries.length} entries touch at least one mode`)
console.log()
console.log('Numbers changed? Then README.md and the page have to change with them, and')
console.log('check:corpus is what refuses to let them disagree.')
void MODES
