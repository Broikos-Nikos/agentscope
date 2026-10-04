/**
 * The extraction, in one place, so the builder and the gate cannot disagree.
 *
 * `build-corpus.mjs` runs this over the live log and freezes the result.
 * `check-corpus.mjs` runs the same function over the frozen copy and requires
 * the committed JSON to match it exactly. Two implementations of the same
 * arithmetic would eventually agree about a mistake, which is a failure this
 * workspace has now written down four times in three repositories.
 */

/**
 * What a mode has to be, and the three tests it has to pass.
 *
 * 1. A **mechanism**, not a symptom. "The build broke" is a symptom. "The kill
 *    was scheduled in an exit handler, which runs after the event loop has
 *    drained, so it never started" is a mechanism, and a mechanism is something
 *    a reader can look for in their own work tonight.
 * 2. **Two independent occurrences.** One is an anecdote, and recurrence is the
 *    entire claim of this project.
 * 3. **A run behind it**: an entry carrying pasted failure output or a commit,
 *    so the mode can be followed rather than believed.
 *
 * The phrases are the log's own words, not words invented to describe it. That
 * is why several read oddly: "a control that passes against the broken code" is
 * a sentence the log wrote about itself repeatedly before anyone noticed it was
 * a category.
 */
export const MODES = [
  {
    id: 'stale-record',
    name: 'The record that outlived what it described',
    mechanism:
      'A written down fact stays true in the file after it stops being true in the world: a number in prose, a picture of a page, a queue entry naming a defect that is fixed.',
    any: ['stale', 'went stale', 'no longer reproduces', 'drifted'],
  },
  {
    id: 'corrupted-escape',
    name: 'The escape that arrived as a byte',
    mechanism:
      'Source is written through a heredoc or a nested quote and an escape is interpreted one layer too early, so a regex is compiled against an invisible character it can never match.',
    any: ['heredoc', 'invisible character', 'literal backspace', 'escape'],
  },
  {
    id: 'masked-exit',
    name: 'The exit code the shell threw away',
    mechanism:
      'A command fails and the caller never learns, because the status reported belongs to a pipe, a redirect, a grep that matched nothing, or the second half of an ||.',
    any: ['exit code', 'PIPESTATUS', 'masked', 'hiding their exit code', 'grep -c'],
  },
  {
    id: 'green-control',
    name: 'The control that passes against the broken code',
    mechanism:
      'A check written to prove a fix works is run against the defect and reports success, because it measures a proxy, or its condition cannot occur, or the artefact it tested was never rebuilt, or the claim is a bare number the document says elsewhere anyway.',
    any: [
      'control that passes against the broken',
      'passes against the broken code',
      'green against the broken code',
      'control was worthless',
      'controls reported green',
      'controls were wrong first',
      'control reported green',
      'the gate was wrong',
      'gate was wrong first',
      'page gate was wrong',
      'measured a proxy',
      'passed its own first control',
      'passed against a broken',
    ],
  },
  {
    id: 'orphaned-process',
    name: 'The cleanup that could not run',
    mechanism:
      'A process is started and its kill is scheduled somewhere that cannot execute it, so it survives every run and accumulates until the machine refuses to start more.',
    any: ['leaked', 'servers leaked', 'exit handler', 'taskkill', 'orphan', 'survived its own cleanup'],
  },
  {
    id: 'unproved-server',
    name: 'Measuring whatever answered',
    mechanism:
      'A check talks to a port rather than to something it started and proved, so an older server, a cached build or a different process answers and the measurement is of something nobody chose.',
    any: [
      'hardcoded port',
      'stale server',
      'a page it had never started',
      'a page it had never looked at',
      'ERR_CONNECTION_REFUSED',
      'measured whatever answered',
    ],
  },
]

/** Does this entry carry a run, rather than only a mention? */
export function replayable(body) {
  return /```/.test(body) || /\bFAIL {2}/.test(body) || /\b[0-9a-f]{7}\b/.test(body)
}

/**
 * Split the log into entries.
 *
 * Two heading shapes, because the log changed its own format on 21 September and
 * nothing rewrote the earlier half: `## Tick 42, ...` and `## 2026-09-21 14:30,
 * tick 42: ...`. Both are entries. `## Loop` and `## Paused` are the two
 * administrative notes in the file and are not, and counting them would put the
 * corpus two above what a reader counts by hand.
 */
export function entriesOf(text) {
  const out = []
  for (const part of text.replace(/\r\n/g, '\n').split(/\n(?=## )/)) {
    if (!part.startsWith('## ')) continue
    const nl = part.indexOf('\n')
    const heading = part.slice(3, nl === -1 ? undefined : nl).trim()
    if (/^(Loop|Paused)/.test(heading)) continue
    const tick = heading.match(/tick (\d+)/i)
    const date = heading.match(/(20\d\d-\d\d-\d\d)/)
    out.push({
      heading,
      tick: tick ? Number(tick[1]) : null,
      date: date ? date[1] : null,
      body: part,
    })
  }
  return out
}

/**
 * Everything the page and the README are allowed to say, computed once.
 *
 * ## The count comes from the labels, not from the phrases
 *
 * `AME-F1`. Until tick 191 a mode was recorded whenever one of its phrases
 * appeared anywhere in an entry, and the page said an agent "wrote down six
 * failures 43 times". Read by hand over all 108 entries, 22 of those 54 records
 * are the word used in another sense: the Escape key, a byte order mark in
 * pasted input, "this time it was not stale", a hypothetical, a quotation of
 * the taxonomy itself. Measured at tick 191:
 *
 *     matcher   54 records across 43 entries
 *     by hand   32 records across 25 entries
 *     25 of the matcher's hits rejected, 3 of the real ones it never found
 *
 * So `data/labels.json` is the count and this is the candidate finder. The
 * phrases still do the searching, which is what they are good at, and a human
 * decision about each candidate is what gets published. The gate
 * `check:labels` holds every label's sentence to its entry, so the file cannot
 * drift from the log it describes, and holds every candidate to being either
 * labelled or rejected, so nothing is quietly dropped.
 */
export function extract(text, labels) {
  const all = entriesOf(text)
  const lower = all.map((e) => e.body.toLowerCase())
  if (!labels) throw new Error('extract needs data/labels.json: the count is the hand labels, not the phrase hits')

  const modes = MODES.map((mode) => {
    const idx = labels.records.filter((r) => r.mode === mode.id).map((r) => r.entry - 1)
    const runs = idx.filter((i) => replayable(all[i].body))
    return {
      id: mode.id,
      name: mode.name,
      mechanism: mode.mechanism,
      entries: idx.length,
      replayable: runs.length,
      firstSeen: idx.map((i) => all[i].date).filter(Boolean).sort()[0] ?? null,
      // Indices into `entries`, so the page can open the real text rather than a
      // summary of it. This is what "replayable" has to mean here.
      at: idx,
      runsAt: runs,
      /* What the phrases found and the reading threw out, so the page can say
         how much of the search was noise rather than only its own total. */
      candidates: (() => {
        const hits = []
        for (let i = 0; i < all.length; i++) {
          if (mode.any.some((p) => lower[i].includes(p.toLowerCase()))) hits.push(i)
        }
        return hits.length
      })(),
    }
  }).sort((a, b) => b.entries - a.entries)

  const touching = new Set(modes.flatMap((m) => m.at)).size

  /*
   * How much log you need before the taxonomy holds.
   *
   * This exists because the obvious hypothesis was tested and failed: that six
   * modes each with two runs is a property of the dataset rather than of the day
   * it was frozen. Rebuilding from the first N entries only:
   *
   *   30 entries   1 mode clears two runs
   *   50 entries   3 modes
   *   70 entries   4 modes
   *   90 entries   6 modes
   *
   * So the claim on the front of this project would have been false at every
   * earlier freeze, and saying "six modes, each twice" without saying that is
   * claiming a stable fact about agents from a snapshot of one log. The number
   * below is the smallest prefix at which all of them clear, and the page states
   * it beside the claim rather than underneath it.
   *
   * It is also the more interesting finding. It says roughly how much of an
   * agent's own log you have to keep before its recurrences become visible at
   * all, which is a thing somebody starting one today can act on.
   */
  const bar = (n) =>
    MODES.filter(
      (mode) =>
        labels.records.filter((r) => r.mode === mode.id && r.entry <= n && replayable(all[r.entry - 1].body))
          .length >= 2,
    ).length
  let allModesFrom = null
  for (let n = 1; n <= all.length; n++) {
    if (bar(n) === MODES.length) {
      allModesFrom = n
      break
    }
  }

  return {
    entries: all.map((e) => ({
      heading: e.heading,
      tick: e.tick,
      date: e.date,
      bytes: e.body.length,
      hasRun: replayable(e.body),
      commits: [...new Set(e.body.match(/\b[0-9a-f]{7}\b/g) ?? [])],
    })),
    modes,
    totals: {
      modes: modes.length,
      ticks: all.filter((e) => e.tick !== null).length,
      highestTick: Math.max(0, ...all.map((e) => e.tick ?? 0)),
      firstDate: all.map((e) => e.date).filter(Boolean).sort()[0] ?? null,
      lastDate: all.map((e) => e.date).filter(Boolean).sort().at(-1) ?? null,
      entriesTouchingAnyMode: touching,
      /* The headline counts records: "wrote down six failures N times" is about
         how many times it wrote one down, and 6 of the 25 entries carry two. */
      records: labels.records.length,
      modesWithTwoOrMoreRuns: modes.filter((m) => m.replayable >= 2).length,
      // The smallest number of entries at which every mode clears two runs.
      // Null would mean the taxonomy does not hold even on the whole corpus.
      allModesFrom,
      stability: [30, 50, 70, 90, all.length].filter((n) => n <= all.length).map((n) => ({ entries: n, modes: bar(n) })),
    },
  }
}
