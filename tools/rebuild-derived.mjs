/**
 * Rebuild the derived JSON from the already frozen log.
 *
 * `build:corpus` refreezes: it copies the live workspace devlog over
 * `data/devlog.md` and remeasures, which is a new dataset and a new date. This
 * does the second half only, so a change to how the corpus is counted can be
 * applied to the corpus that is already committed. AME-F1 needed exactly that:
 * the labels changed what counts, and the log must not move underneath them.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { entriesOf, extract } from './corpus-lib.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const text = readFileSync(resolve(root, 'data/devlog.md'), 'utf8')
const labels = JSON.parse(readFileSync(resolve(root, 'data/labels.json'), 'utf8'))
const old = JSON.parse(readFileSync(resolve(root, 'src/generated/corpus.json'), 'utf8'))

const corpus = extract(text, labels)
corpus.source = old.source

writeFileSync(resolve(root, 'src/generated/entries.json'), JSON.stringify(entriesOf(text).map((e) => e.body)) + '\n')
writeFileSync(resolve(root, 'src/generated/corpus.json'), JSON.stringify(corpus, null, 2) + '\n')

console.log(`${corpus.entries.length} entries, ${corpus.totals.entriesTouchingAnyMode} touching a mode, all six from entry ${corpus.totals.allModesFrom}`)
for (const m of corpus.modes) {
  console.log(`  ${String(m.entries).padStart(2)} records, ${m.replayable} with a run, ${m.candidates} candidates   ${m.name}`)
}
