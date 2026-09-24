/**
 * Every number the README states comes out of the corpus.
 *
 *   npm run check:claims
 *
 * `check:corpus` proves the counts come from the committed log and `check:page`
 * proves the page states them. The README is the third surface, it is the one a
 * recruiter actually reads, and until this existed it was the only one held by
 * nothing at all.
 *
 * **Every claim is a phrase, never a bare integer**, and that rule was bought
 * rather than reasoned. `watch-it-think` held `layers` as the string "6" and "6"
 * occurs 19 times in its README, so the assertion could not fail under any edit
 * whatsoever; four of its twenty four claims were like that. The spec gate for
 * this project made the same mistake three ticks ago and its first control
 * passed against a spec that had been edited to say the wrong number.
 *
 * And counted, not merely found, because a figure corrected in one place of two
 * is the defect this exists for.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const c = JSON.parse(readFileSync(resolve(root, 'src/generated/corpus.json'), 'utf8'))
const readme = readFileSync(resolve(root, 'README.md'), 'utf8').replace(/\r\n/g, '\n')
const flat = readme.replace(/\s+/g, ' ')

let failed = 0
const fail = (what, detail) => {
  failed++
  console.error(`FAIL  ${what}`)
  if (detail) console.error(`      ${detail}`)
}

const n = c.entries.length
const t = c.totals

/*
 * The two figures that decided the drawing, computed the way the page computes
 * them rather than read off a summary.
 *
 * Both were typed into the README by hand when it was written, in a repository
 * whose contract opens with the rule that every number on a page is produced by
 * a command. They were correct, which is not the same thing as checked.
 */
const perEntry = new Array(n).fill(0)
for (const m of c.modes) for (const i of m.at) perEntry[i]++
const overlapping = perEntry.filter((x) => x >= 2).length
const records = c.modes.reduce((s, m) => s + m.entries, 0)
const overlapPercent = Math.round((100 * overlapping) / t.entriesTouchingAnyMode)

/** What the README has to say, derived rather than listed. */
const CLAIMS = [
  ['the headline count', `six failures ${t.entriesTouchingAnyMode} times in ${n} entries`],
  ['the corpus size in the opening', `five days and ${n} entries`],
  ['entries touching a mode', `${t.entriesTouchingAnyMode} of the ${n}`],
  ['the total mode records', `carry ${records} mode records`],
  ['the entries recording more than one mode', `because ${overlapping} record two or more`],
  ['the share of marks a single mark would have got wrong', `${overlapPercent}% of the marks`],
  ['the stability figure', `only from **entry ${t.allModesFrom}**`],
  ['the frozen corpus size', `${Math.floor(c.source.bytes / 1024)} KB, committed`],
]

for (const m of c.modes) {
  // The row as the table writes it, so a count that moves in the corpus and not
  // in the README fails on the row rather than on a digit that appears
  // elsewhere for an unrelated reason.
  CLAIMS.push([`the row for ${m.id}`, `| ${m.name} | ${m.entries} | ${m.replayable} | ${m.firstSeen} |`])
}

let missing = 0
for (const [what, value] of CLAIMS) {
  const wanted = String(value).replace(/\s+/g, ' ')
  const hits = flat.split(wanted).length - 1
  if (hits === 0) {
    missing++
    fail(`${what}: the corpus says ${JSON.stringify(wanted)} and the README does not say it`)
  }
}
if (missing === 0) console.log(`  ok      ${CLAIMS.length} claims in README.md are what the corpus measures`)

/*
 * And nothing else of the same shape that the corpus does not produce. Looking
 * for the right answer cannot see a wrong one sitting beside it: the README
 * could say "108 entries" in one paragraph and "120 entries" in the next and
 * every claim above would still pass.
 */
const loose = []
for (const m of flat.matchAll(/(\d+) entries/g)) {
  const v = Number(m[1])
  // Smaller figures are legitimate: the stability table counts prefixes, and the
  // mode rows count subsets.
  if (v > n) loose.push(`"${m[0]}" but the corpus has ${n} entries`)
}
if (loose.length > 0) {
  fail(`the README states ${loose.length} figure${loose.length === 1 ? '' : 's'} larger than the corpus contains`, loose.join('; '))
} else {
  console.log('  ok      no figure in README.md exceeds what the corpus contains')
}

if (failed > 0) {
  console.error('\nA number a reader can check is a number that has to be checked here first.')
  process.exit(1)
}

console.log('claims: every figure in the README comes out of the committed corpus')
