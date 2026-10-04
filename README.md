# agentscope

### An AI coding agent wrote down six failures 32 times in 108 entries, and kept making them.

For five days and 108 entries an AI coding agent built the other projects on
this profile and kept a development log while it worked. Six kinds of failure
recur in it. Every
one was written up as a lesson, in bold, with a prescription, and every one
happened again afterwards.

![Six rows of marks, one per failure mode, 108 entries left to right. Choosing "the control that passes against the broken code" dims the other five rows and leaves four bright marks spread across the log, one near the start and three near the end. Clicking the last one opens the real entry, with its commit](docs/agentscope.gif)

That is the real page in a real browser, recorded by `npm run capture`. The mark
it opens at the end is tick 104, in which a gate written to catch a control that
passes against broken code was itself passed by a control against a broken spec.

---

## The number, and the condition it comes with

| mode | entries | with a run | first seen |
|---|---|---|---|
| The record that outlived what it described | 10 | 7 | 2026-09-21 |
| The control that passes against the broken code | 7 | 4 | 2026-09-21 |
| The escape that arrived as a byte | 5 | 4 | 2026-09-21 |
| The exit code the shell threw away | 4 | 3 | 2026-09-21 |
| The cleanup that could not run | 3 | 2 | 2026-09-22 |
| Measuring whatever answered | 3 | 2 | 2026-09-21 |

**Counted by reading, not by matching.** 25 of the 108 entries record at least
one mode, and they carry 32 mode records between them, because 6 record two or more.
That is why the page draws six rows rather than one mark per entry: a single
mark would have been showing one of several answers on 24% of the marks it
filled.

**Where those numbers come from, and why they are smaller than they were.**
`data/labels.json` holds every record, by entry, with the sentence that shows
it. Until 4 October this README said 43 entries and 54 records, which is what a
phrase match produces: a mode was recorded whenever one of its words appeared
anywhere in an entry. Read by hand over all 108, 22 of those 54 are the word
used in another sense, the Escape key, a byte order mark in pasted input, "this
time it was not stale", a hypothetical, a quotation of the taxonomy itself. The
phrases now find candidates and `data/labels.json` says which are real: 54
candidates, 29 kept, 25 rejected, and 3 the phrases never found at all. Every
rejection is in that file with the sentence it matched in, so the judgement can
be checked rather than taken.

**"With a run" is the column that matters.** It counts entries carrying pasted
failure output or a commit hash, so the mode can be followed rather than
believed. A mode with one run is an anecdote, and `check:corpus` fails if any
mode drops below two.

## What this does not claim

**Not that these are the six ways agents fail.** One agent, one workspace, five
days, six projects. It is a census of one log, and the page says so where a
reader looks rather than in a footnote.

**Not that the counts are exact.** Entries are assigned to modes by the language
the entries themselves use, which is a keyword match over prose, and prose is
not a schema. The counts are **reproducible**, which is a different and weaker
claim than correct.

**Not that the taxonomy is stable.** It is a property of this log at this length.
Rebuilding from the first N entries only:

| frozen at | modes clearing two runs |
|---|---|
| 30 entries | 1 |
| 50 entries | 3 |
| 70 entries | 4 |
| 90 entries | 6 |

All six clear the bar only from **entry 106**, so the claim at the top of this
README would have been false at every earlier freeze. That is the more useful
finding anyway: it says roughly how much of its own log an agent has to keep
before its recurrences become visible at all.

## The corpus

`data/devlog.md`, 319 KB, committed, with its sha256 and the date it was frozen.

It is committed because it has to be. The first measuring tool for this project
read the live log, and its committed counts were stale nineteen minutes later
when the next tick appended an entry:

```
committed 17:50   107 entries, 106 ticks, to tick 103, 42 touching a mode
the same file at 18:09   108 entries, 107 ticks, to tick 104, 43 touching a mode
```

Nothing failed in between. Both measurements were honest. They were measurements
of different documents.

```bash
npm run build:corpus    # re-read the live log. Changes the numbers. Not run by the build.
npm run check:corpus    # recompute everything from the frozen copy. Run by every build.
```

## Run it

```bash
npm install
npm run dev         # then open the address it prints
npm run build       # typecheck, three file gates, then the bundle
npm run verify      # the browser gates against one shared server
```

The page costs **8 KB** to look at. The 319 KB of entry text is a separate
chunk, fetched the first time you open an entry, so a reader who only looks at
the picture never downloads the log.

## The gates

| gate | what it stops |
|---|---|
| `check:corpus` | a count drifting from the log, or the log being edited under the counts |
| `check:page` | the page stating a figure, or drawing a mark, the corpus does not produce |
| `check:capture` | the picture above becoming a photograph of a page that no longer exists |
| `check:source` | an invisible character in source, which once made a regex that could never match |

`check:corpus` asks two independent questions: does the committed JSON match the
committed source, and is the committed source the one that was measured. The
second is the one that gets skipped everywhere. Its control edits the log and
rebuilds the JSON from the edit, so every count agrees with itself, and the hash
still catches it.

Every gate here was written with its failure reproduced first.

## Licence

MIT for the code. The corpus is this workspace's own development log.
