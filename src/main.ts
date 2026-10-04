import './style.css'
import corpus from './generated/corpus.json'

/**
 * A development log, drawn as the thing it is: a sequence of attempts, most of
 * which went fine, and six failures that keep coming back.
 *
 * Every figure here comes from `generated/corpus.json`, which `npm run
 * build:corpus` computes from `data/devlog.md`, a frozen and hashed copy of the
 * log. `npm run check:corpus` refuses the three to disagree. Nothing on this
 * page is typed.
 *
 * Two decisions were made by measuring rather than by taste, and both changed
 * the drawing:
 *
 * **Six rows, not one.** The first design was one mark per entry, coloured by
 * its mode. 6 of the 25 entries that carry a mode carry two or more, so 24% of
 * the coloured marks would have been showing one of several answers and no
 * reader could have known which. A row per mode says the true thing and makes
 * the recurrence clusters, which are the entire argument, legible at a glance.
 *
 * **The x axis is entry order, not tick number.** The log has 107 tick numbers
 * across 105 distinct values and one entry with no tick at all, because ticks
 * were renumbered once and one entry is an administrative note. An axis that
 * silently collapsed two entries onto one column would be a picture with two
 * days missing from it.
 */

type Mode = (typeof corpus.modes)[number]

const el = {
  headline: document.querySelector<HTMLElement>('[data-headline]')!,
  standfirst: document.querySelector<HTMLElement>('[data-standfirst]')!,
  modes: document.querySelector<HTMLElement>('[data-modes]')!,
  status: document.querySelector<HTMLElement>('[data-status]')!,
  grid: document.querySelector<HTMLElement>('[data-grid]')!,
  picks: document.querySelector<HTMLElement>('[data-picks]')!,
  caption: document.querySelector<HTMLElement>('[data-caption]')!,
  entry: document.querySelector<HTMLElement>('[data-entry]')!,
  footer: document.querySelector<HTMLElement>('[data-footer]')!,
}

const entries = corpus.entries
const modes = corpus.modes as Mode[]
const totals = corpus.totals

/**
 * How many entries carry more than one mode, computed rather than typed.
 *
 * This is the number that decided the whole drawing, so it is the last number on
 * the page that should be a literal. The first version of this caption said
 * "because 7 entries record more than one" as a typed 7, in a repository whose
 * contract opens with the rule that every number on a page is produced by a
 * command.
 */
const perEntry = new Array(entries.length).fill(0)
for (const m of corpus.modes) for (const i of m.at) perEntry[i]++
const overlapping = perEntry.filter((n) => n >= 2).length
const records = corpus.modes.reduce((n, m) => n + m.entries, 0)

/** Which mode is selected, or null for all of them. */
let selected: string | null = null

/**
 * The entry text, fetched the first time somebody opens one.
 *
 * 316 KB of markdown against a grid that needs none of it. A reader who never
 * opens an entry never downloads the log, and one who opens a second waits for
 * nothing.
 */
let bodies: string[] | null = null
async function bodyFor(i: number): Promise<string> {
  if (!bodies) {
    el.entry.textContent = 'fetching the log'
    bodies = (await import('./generated/entries.json')).default as string[]
  }
  return bodies[i] ?? ''
}

function drawModes(): void {
  el.modes.replaceChildren(
    ...modes.map((m) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'mode'
      b.dataset.mode = m.id
      b.setAttribute('aria-pressed', String(selected === m.id))
      b.innerHTML = ''
      const name = document.createElement('span')
      name.className = 'mode__name'
      name.textContent = m.name
      const count = document.createElement('span')
      count.className = 'mode__count'
      // Both numbers, because the second is the one that makes it a pattern
      // rather than a story, and a reader should not have to take it on trust.
      count.textContent = `${m.entries} entries, ${m.replayable} with a run`
      b.append(name, count)
      b.addEventListener('click', () => {
        selected = selected === m.id ? null : m.id
        markSelected()
      })
      return b
    }),
  )
}

function drawGrid(): void {
  const rows = modes.map((m) => {
    const row = document.createElement('div')
    row.className = 'row'
    row.dataset.mode = m.id

    const label = document.createElement('div')
    label.className = 'row__label'
    label.textContent = m.name
    row.append(label)

    const track = document.createElement('div')
    track.className = 'track'
    // The column count is the corpus size, set here rather than typed in the CSS,
    // so a rebuilt corpus cannot leave the grid drawing the wrong number of slots.
    track.style.setProperty('--n', String(entries.length))
    const carries = new Set(m.at)
    const hasRun = new Set(m.runsAt)

    for (let i = 0; i < entries.length; i++) {
      const mark = document.createElement('button')
      mark.type = 'button'
      mark.className = 'mark'
      /*
       * Out of the tab order, and the list below is the way in.
       *
       * AHS-F4. 654 tab stops on this page, 648 of them marks. Measured at tick
       * 193: thirteen Tab presses reach the first flame mark, Enter opens its
       * entry, and **642 more** reach anything inside it, so a keyboard reader
       * could open an entry and not read it. A pointer can still click a mark,
       * which is what it is good at; choosing one by keyboard is what the list
       * is for, at most ten stops instead of 648.
       */
      mark.tabIndex = -1
      if (carries.has(i)) mark.classList.add(hasRun.has(i) ? 'mark--run' : 'mark--on')
      const e = entries[i]
      mark.title = `${e.tick === null ? 'no tick' : `tick ${e.tick}`}: ${e.heading}`
      mark.setAttribute(
        'aria-label',
        carries.has(i)
          ? `${m.name}, ${e.heading}${hasRun.has(i) ? ', with a run' : ''}`
          : `no ${m.name}, ${e.heading}`,
      )
      mark.addEventListener('click', () => void open(i))
      track.append(mark)
    }
    row.append(track)
    return row
  })
  el.grid.replaceChildren(...rows)
}

async function open(i: number): Promise<void> {
  const e = entries[i]
  el.entry.hidden = false
  el.entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

  const text = await bodyFor(i)
  const carried = modes.filter((m) => m.at.includes(i))

  const head = document.createElement('h2')
  head.textContent = e.heading
  /*
   * And the focus goes with it.
   *
   * AHS-F4. Opening an entry left focus where it was, so a keyboard reader
   * pressed Enter and then had to walk to what they had opened: 642 Tab presses
   * when the marks were in the tab order, and still 18 once the list replaced
   * them, because the other nine entries sit between the chosen one and the
   * panel. `tabIndex = -1` makes the heading focusable without adding a stop,
   * which is what it is for.
   */
  head.tabIndex = -1

  const meta = document.createElement('p')
  meta.className = 'entry__meta'
  meta.textContent =
    `${e.tick === null ? 'no tick number' : `tick ${e.tick}`}, ${e.date ?? 'undated'}, ` +
    `${(e.bytes / 1024).toFixed(1)} KB` +
    (e.commits.length > 0 ? `, commits ${e.commits.join(', ')}` : ', no commit named') +
    (carried.length > 0 ? `. Carries: ${carried.map((m) => m.name).join('; ')}.` : '. Carries no mode.')

  const pre = document.createElement('pre')
  pre.className = 'entry__text'
  // textContent, never innerHTML. The corpus is markdown written by an agent and
  // it contains angle brackets, backticks and half-written HTML in its own
  // examples. It is shown, not interpreted.
  pre.textContent = text

  el.entry.replaceChildren(head, meta, pre)
  head.focus()
}

/**
 * Which mode is picked, written onto the elements that already exist.
 *
 * Swept out of watch-it-think's WP-F3. Choosing a mode called `render`, which
 * rebuilds everything: measured at tick 173, one click replaced **648 marks, 6
 * rows and 654 buttons**, every node on the page, to change three attributes
 * and one sentence. 2.2 ms, so it was never slow; it was the whole corpus
 * being rebuilt under the pointer that was pointing at it, which is also how a
 * click lands on a different mark than the one it was aimed at.
 *
 * Selection is three things and this is where all three live, including on the
 * first draw, so the two paths cannot disagree.
 */
/**
 * The entries of the chosen mode, as a list that is actually a control.
 *
 * AHS-F1. A mark is 2.31 pixels wide at 390 and 2.03 at 360, against the 24 by
 * 24 of WCAG 2.5.8, and on both phone widths the grid starts below the fold. A
 * fingertip covers ten marks, and the flame ones sit among grey. So the grid
 * stops being the way in and becomes what it always was, a picture of where in
 * 108 entries a failure recurs, and this is the way in: full width rows, a 44
 * pixel minimum, tick and heading, at most ten of them because the largest mode
 * has ten records.
 *
 * It is the same fix for three readers. A thumb gets a target it can hit, a
 * keyboard gets ten stops instead of 648, and a screen reader gets a list of
 * named entries instead of 648 buttons called "no record that outlived what it
 * described, Tick 42, ...".
 */
function drawPicks(): void {
  const mode = modes.find((m) => m.id === selected)
  if (!mode) {
    el.picks.hidden = true
    el.picks.replaceChildren()
    return
  }
  el.picks.hidden = false
  const runs = new Set(mode.runsAt)
  el.picks.replaceChildren(
    ...mode.at.map((i) => {
      const e = entries[i]
      const b = document.createElement('button')
      b.type = 'button'
      b.className = runs.has(i) ? 'pick pick--run' : 'pick'
      /* `data-pick`, not `data-entry`: the panel is `[data-entry]`, and the
         first version of this put the same attribute on every button in the
         list, so `document.querySelector('[data-entry]')` returned a button and
         anything selecting the panel got the wrong element. Caught by a
         measurement that said focus was outside the panel while sitting on its
         own heading. */
      b.dataset.pick = String(i)

      const tick = document.createElement('span')
      tick.className = 'pick__tick'
      tick.textContent = e.tick === null ? 'no tick' : `tick ${e.tick}`

      const head = document.createElement('span')
      head.className = 'pick__head'
      head.textContent = e.heading

      b.append(tick, head)
      b.setAttribute(
        'aria-label',
        `${e.tick === null ? 'no tick' : `tick ${e.tick}`}, ${e.heading}${runs.has(i) ? ', with a run' : ''}`,
      )
      b.addEventListener('click', () => void open(i))
      return b
    }),
  )
}

function markSelected(): void {
  for (const b of el.modes.querySelectorAll<HTMLElement>('.mode')) {
    b.setAttribute('aria-pressed', String(b.dataset.mode === selected))
  }
  for (const row of el.grid.querySelectorAll<HTMLElement>('.row')) {
    row.classList.toggle('row--dim', Boolean(selected) && row.dataset.mode !== selected)
  }
  drawPicks()
  el.status.textContent = selected
    ? `${modes.find((m) => m.id === selected)!.name}: ` +
      `${modes.find((m) => m.id === selected)!.entries} of ${entries.length} entries, ` +
      `${modes.find((m) => m.id === selected)!.replayable} with a run behind them.`
    : `${totals.entriesTouchingAnyMode} of ${entries.length} entries record at least one of ${totals.modes} failure modes. ` +
      `Pick one, or pick a mark.`
}

function render(): void {
  drawModes()
  drawGrid()
  markSelected()
}

function boot(): void {
  el.headline.textContent =
    `An agent wrote down six failures ${totals.records} times in ${entries.length} entries, and kept making them.`

  el.standfirst.textContent =
    `${entries.length} entries across ${totals.ticks} ticks, to tick ${totals.highestTick}, ` +
    `written between ${totals.firstDate} and ${totals.lastDate} by the agent the failures were ` +
    `happening to, while they were happening. Every one of the ${totals.modes} modes has two or more ` +
    `entries carrying a run behind it, and all six clear that bar only from entry ${totals.allModesFrom}: ` +
    `this claim would have been false at every earlier freeze.`

  el.caption.textContent =
    `Each row is one mode and each column is one entry, oldest on the left. A filled mark means the ` +
    `entry records that mode; a bright one means it carries pasted failure output or a commit, so it can ` +
    `be followed rather than believed. ` +
    `${entries.length} entries carry ${records} mode records between them, because ${overlapping} of them ` +
    `record more than one, which is why there are ${totals.modes} rows and not one.`

  el.footer.textContent =
    `Measured from data/devlog.md, ${(corpus.source.bytes / 1024).toFixed(0)} KB frozen on ` +
    `${corpus.source.frozen}, sha256 ${corpus.source.sha256.slice(0, 16)}. The log it was copied from ` +
    `has grown since, which is why this one is committed: npm run check:corpus recomputes every number ` +
    `here from the copy and refuses them to disagree.`

  render()
}

boot()
