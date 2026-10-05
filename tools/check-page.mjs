/**
 * The page says what the corpus measures, and says it to a reader.
 *
 *   npm run check:page
 *
 * `check:corpus` proves the counts come out of the committed log. Nothing
 * connected those counts to what is actually on screen, and the gap between
 * those two is where every stale number in this workspace has lived: a page
 * reads a generated file at build time, and the file can be right while the
 * sentence built from it is wrong.
 *
 * Two rules this gate is built on, both of them paid for elsewhere:
 *
 * **Every claim is a phrase, never a bare integer.** `watch-it-think` held
 * `layers` as the string "6" and "6" occurs 19 times in its README, so the
 * assertion could not fail under any edit whatsoever. Four of its twenty four
 * claims were like that. Here the expectations are the numbers inside the words
 * the page puts around them.
 *
 * **It reads `innerText`, not `textContent`.** The question is what a visitor is
 * looking at, and a figure inside a hidden element is not a claim to anybody.
 *
 * The drawing is checked too, not only the prose. This page's argument is a grid
 * of marks, and a grid with the wrong number of filled marks is a false picture
 * however correct the sentence above it is.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const c = JSON.parse(readFileSync(resolve(root, 'src/generated/corpus.json'), 'utf8'))

let failed = 0
const fail = (what, detail) => {
  failed++
  console.error(`FAIL  ${what}`)
  if (detail) console.error(`      ${detail}`)
}

const n = c.entries.length
const t = c.totals

/** What the page has to say, in the page's own words, derived from the corpus. */
const CLAIMS = [
  /* Records, not entries: AME-F1. The sentence is about how many times the
     agent wrote a failure down, and 6 of the 25 entries carry two. */
  ['the headline count', `six failures ${t.records} times in ${n} entries`],
  ['the corpus size and span', `${n} entries across ${t.ticks} ticks, to tick ${t.highestTick}`],
  ['the dates', `between ${t.firstDate} and ${t.lastDate}`],
  ['the mode count in the standfirst', `each one of the ${t.modes} modes`.replace('each one', 'Every one')],
  ['the stability figure', `only from entry ${t.allModesFrom}`],
  ['the status line', `${t.entriesTouchingAnyMode} of ${n} entries record at least one of ${t.modes} failure modes`],
]

/*
 * Every mode's own two numbers, read from its own card.
 *
 * Not from the page's flattened text, and the control is why. Incrementing every
 * card's entry count by one caught five of the six: `masked-exit` went from
 * "9 entries, 7 with a run" to "10 entries, 7 with a run", which is exactly what
 * `corrupted-escape`'s card is supposed to say, so searching the whole page for
 * that string found it on the wrong card and called it present.
 *
 * Six cards with two small integers each will collide sooner or later. Scoping
 * each expectation to the element that has to carry it is the only version of
 * this that means anything.
 */
const CARDS = c.modes.map((m) => [m.id, `${m.entries} entries, ${m.replayable} with a run`])

const { serve, useShared } = await import('./serve.mjs')
const server = process.env.AGENTSCOPE_URL ? await useShared(process.env.AGENTSCOPE_URL) : await serve()

try {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } })
  await page.goto(server.url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelectorAll('[data-mark]').length > 0, null, { timeout: 60_000 })

  const seen = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ')

  const missing = CLAIMS.filter(([, v]) => !seen.includes(v.replace(/\s+/g, ' ')))
  if (missing.length > 0) {
    fail(
      `${missing.length} of ${CLAIMS.length} figures the page should state are not on it`,
      missing.map(([what, v]) => `${what}: expected ${JSON.stringify(v)}`).join('; '),
    )
  } else {
    console.log(`  ok      ${CLAIMS.length} figures on the page are what the corpus measures`)
  }

  /*
   * And the drawing. One row per mode, one column per entry, and the filled
   * marks counted per row against the corpus.
   *
   * This is the half a prose check cannot see. The caption could be perfect
   * while the grid drew a mode's marks in the wrong row, or drew 54 filled marks
   * where the corpus has 53, and the picture is the thing this project is.
   */
  const drawn = await page.evaluate(() =>
    [...document.querySelectorAll('[data-row]')].map((r) => ({
      mode: r.dataset.mode,
      cols: r.querySelectorAll('[data-mark]').length,
      on: r.querySelectorAll('[data-mark][data-on]').length,
      run: r.querySelectorAll('[data-mark][data-run]').length,
    })),
  )

  const gridProblems = []
  if (drawn.length !== c.modes.length) {
    gridProblems.push(`${drawn.length} rows drawn, the corpus has ${c.modes.length} modes`)
  }
  for (const [i, m] of c.modes.entries()) {
    const d = drawn[i]
    if (!d) continue
    if (d.mode !== m.id) gridProblems.push(`row ${i} is ${d.mode}, the corpus has ${m.id} there`)
    if (d.cols !== n) gridProblems.push(`${m.id}: ${d.cols} columns drawn, the corpus has ${n} entries`)
    if (d.on + d.run !== m.entries) {
      gridProblems.push(`${m.id}: ${d.on + d.run} marks filled, the corpus says ${m.entries} entries`)
    }
    if (d.run !== m.replayable) {
      gridProblems.push(`${m.id}: ${d.run} marks drawn as followable, the corpus says ${m.replayable}`)
    }
  }

  if (gridProblems.length > 0) {
    fail(`the grid disagrees with the corpus in ${gridProblems.length} place${gridProblems.length === 1 ? '' : 's'}`, gridProblems.join('\n      '))
  } else {
    const filled = drawn.reduce((s, d) => s + d.on + d.run, 0)
    console.log(`  ok      ${drawn.length} rows of ${n} marks, ${filled} filled, every count the corpus's own`)
  }

  const cardText = await page.evaluate(() =>
    Object.fromEntries([...document.querySelectorAll('[data-mode-button]')].map((b) => [b.dataset.mode, b.innerText.replace(/\s+/g, ' ')])),
  )
  const badCards = CARDS.filter(([id, want]) => !(cardText[id] ?? '').includes(want))
  if (badCards.length > 0) {
    fail(
      `${badCards.length} of ${CARDS.length} mode cards do not state their own counts`,
      badCards.map(([id, want]) => `${id}: expected ${JSON.stringify(want)}, card says ${JSON.stringify(cardText[id] ?? '(no card)')}`).join(String.fromCharCode(10) + '      '),
    )
  } else {
    console.log(`  ok      ${CARDS.length} mode cards each state their own two counts`)
  }

  // The headline is the claim, not a description. If it stops naming the corpus
  // it is about, the page has an argument nobody can check.
  const headline = (await page.textContent('[data-headline]')) ?? ''
  if (!headline.includes(`${n} entries`)) {
    fail(`the headline no longer names the corpus it is about: ${JSON.stringify(headline)}`)
  } else {
    console.log(`  ok      the headline names its corpus: ${JSON.stringify(headline)}`)
  }

  /*
   * And picking a mode changes what it has to change and nothing else.
   *
   * Swept out of watch-it-think's WP-F3 at tick 173. Picking a mode called
   * `render`, which rebuilds the page: measured before the fix, one click
   * replaced 648 marks, 6 rows and 654 buttons, every node here, to change
   * three attributes and one sentence. Node identity is the assertion rather
   * than a timing, because a faster rebuild is still a rebuild: this page draws
   * one mark per entry per mode, and rebuilding all of them under a pointer is
   * how a click lands on a different mark than the one it was aimed at.
   */
  const reuse = await page.evaluate(async () => {
    for (const sel of ['.mark', '.row', '.mode']) {
      document.querySelectorAll(sel).forEach((n, i) => {
        n.__mark = i
      })
    }
    const mode = document.querySelector('[data-mode-button]')
    mode.click()
    await new Promise((r) => requestAnimationFrame(r))
    const kept = (sel) => [...document.querySelectorAll(sel)].filter((n) => n.__mark !== undefined).length
    return {
      marks: { kept: kept('.mark'), of: document.querySelectorAll('[data-mark]').length },
      rows: { kept: kept('.row'), of: document.querySelectorAll('[data-row]').length },
      modes: { kept: kept('.mode'), of: document.querySelectorAll('[data-mode-button]').length },
      pressed: document.querySelectorAll('[data-mode-button][aria-pressed="true"]').length,
      dimmed: document.querySelectorAll('[data-row][data-dim]').length,
      picked: document.querySelector('[data-mode-button]')?.getAttribute('aria-pressed'),
    }
  })

  const rebuilt = ['marks', 'rows', 'modes'].filter((k) => reuse[k].kept < reuse[k].of)
  if (rebuilt.length > 0) {
    fail(
      `picking a mode replaced ${rebuilt.map((k) => `${reuse[k].of - reuse[k].kept} of ${reuse[k].of} ${k}`).join(', ')}`,
      'nothing about the corpus changed, so nothing about those elements had to',
    )
  } else {
    console.log(`  ok      picking a mode keeps all ${reuse.marks.of} marks, ${reuse.rows.of} rows and ${reuse.modes.of} cards`)
  }

  if (reuse.pressed !== 1 || reuse.picked !== 'true' || reuse.dimmed !== reuse.rows.of - 1) {
    fail(
      `after picking the first mode: ${reuse.pressed} pressed, first card aria-pressed=${reuse.picked}, ${reuse.dimmed} of ${reuse.rows.of} rows dimmed`,
      'one card pressed and every other row dimmed is the whole of what picking a mode means here',
    )
  } else {
    console.log(`  ok      one card pressed and ${reuse.dimmed} of ${reuse.rows.of} rows dimmed, which is what picking one means`)
  }

  await browser.close()
} finally {
  server.stop()
}

if (failed > 0) {
  console.error('\nA page can read the right file and still show the wrong sentence, or draw the wrong picture.')
  process.exit(1)
}

console.log('page: every figure a visitor can see, and every mark, is one the corpus produces')
