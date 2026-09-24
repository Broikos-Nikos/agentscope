# Devlog

Append only. One entry per tick. Newest at the bottom.

---

## 2026-09-20 23:41 | tick 0 | workspace | Scaffolding

**What changed**

- Created the control plane: `state/state.json`, `LOOP-PROMPT.md`,
  `DECISIONS.md`, `DEVLOG.md`, `audits/AUDIT-BRIEF.md`, `ORCHESTRATION.md`.
- Surveyed the ground truth: `PROJECT-IDEAS.md` is the brief, `bslm` lives at
  `C:/xampp/htdocs/playground/bslm` and is a real repository with a benchmark.
- Four projects queued: `tokenlab` (active), `watch-it-think` (blocked),
  `evalkit`, `promptcost`.

**Findings that changed the plan**

- The 72M gguf is not on disk. `bslm/models/` holds `val_sample.txt` only.
  `checkpoints/bslm.pt` (20 MB, the 5M router) is present, torch 2.14 is in the
  bslm venv, `llama_cpp` is not. So S2 is blocked and S1 is first. See D1.

**Proof**

```
$ ls bslm/models/        -> val_sample.txt
$ ls bslm/checkpoints/   -> bslm.pt (20370911 bytes), tokenizer.json, train.log
$ .venv/Scripts/python.exe -c "import llama_cpp" -> ModuleNotFoundError
$ .venv/Scripts/python.exe -c "import torch" -> torch 2.14.0+cu126
$ npm view gpt-tokenizer version -> 4.0.0
```

**Next tick:** tokenlab T1, scaffold the Vite TypeScript project and verify the
build.

---

## 2026-09-20 23:58 | tick 1 | tokenlab | Built it, measured it, looked at it

**What changed**

- `projects/tokenlab` exists and is a git repository with one commit, 24 files.
- The measurement runs: `npm run measure` tokenizes forty hand written aligned
  sentence pairs across five registers with four tiktoken encodings, and writes
  `src/generated/findings.json`. Ratios are totals over totals with a paired
  bootstrap interval, 10,000 resamples, fixed seed, so the number is the same on
  any machine.
- The page runs: live tokenization, four encodings each lazily imported, a
  language toggle over the same sentence pair, an animated token count, cost per
  thousand requests at real prices, and the measured table underneath.
- The visual finding is real and it is the thing that makes the project worth
  looking at: on `cl100k` every Greek letter becomes its own token while the
  English word `build` sitting in the same sentence stays one token. Characters
  that cost more than one token render as broken chips carrying their cost.
- Typography chosen through the font gate, not by taste: Manrope and Roboto
  Mono, both checked against real Greek copy including final sigma, accented
  capitals, the euro sign and the ano teleia, then subset to Latin and Greek as
  variable woff2 at 31 KB and 48 KB.

**The measurement**

```
$ npm run measure
corpus: 40 pairs, 5 registers
o200k   Greek costs 2.09x English  (95% 1.97 to 2.2)   1160 vs 556 tokens
cl100k  Greek costs 5.14x English  (95% 4.81 to 5.47)  2864 vs 557 tokens
p50k    Greek costs 6.48x English  (95% 6.07 to 6.87)  3633 vs 561 tokens
r50k    Greek costs 6.48x English  (95% 6.07 to 6.87)  3633 vs 561 tokens
```

`PROJECT-IDEAS.md` estimated 2.1 and about 6. The o200k figure lands almost
exactly. The cl100k figure is 5.14, not 6. The 6.48 belongs to the two older
encodings. The README states the measured numbers, not the estimate.

**Proof**

```
$ npm run build   -> tsc clean, vite built in 285ms, dist/index.html 4.40 kB
$ bh open http://localhost:5178/  -> 200, no console errors, 16 requests all ok
$ bh shot .stage  -> docs/shatter-o200k.png, docs/shatter-cl100k.png
$ git log --oneline -> 4d10e4b tokenlab: the measurement, the page, the shatter
```

Seen in a real browser at two encodings before being called done.

**Fixed inside the tick after looking at it**

- The headline ratio was hardcoded to cl100k while the page opened on o200k, so
  the big number contradicted the selected encoding. It now tracks the
  selection.
- `cl100k` had hue 28, which collided with the alarm red used for fractured
  tokens and made the finding invisible. Hues are now 168, 250, 315, 85, with
  red reserved for fracture alone.
- The fracture note claimed "characters with no token of their own" while the
  chips can cover two or three characters. Reworded to what is actually true.
- A claim about register variation went into the README before it was checked
  against the data. Checked, it was wrong in emphasis, replaced with the real
  spread: 1.58x conversational to 2.33x technical on o200k.

**Audits launched**

Four subagents, four perspectives, one browser between them: hostile stranger,
measurement auditor, performance and access, design eye. Findings will be folded
into `state/state.json` as `open_findings` and become tick+1 work.

**Queued for the owner**

Publishing the repository and turning on Pages is outward facing, so the loop
will not do it. It sits in `awaiting_owner` in the state file, ready.

**Next tick:** fold in the audit findings, highest severity first.

---

## 2026-09-20 23:58 | tick 2 | watch-it-think | The weights question, answered

**Task:** T0, resolve the blocker. Chosen because four audits hold the browser
and `projects/tokenlab`, and this task touches neither.

**What changed**

- `watch-it-think` is no longer blocked. It has a stack, an artifact number and
  eleven tasks.
- `DECISIONS.md` gained D5 with the evidence for all three options.

**What was actually found**

The 72M model is gone. Not misplaced, gone. The `bslm` repository has one
release containing one file, a screenshot. There is no 72M checkpoint anywhere
on this disk. What survives is `checkpoints/bslm.pt`: the 5M router, 5,086,061
parameters, 6 layers, 4 heads, 44 intents, 65 slot tags, and its tokenizer.

So S2 as written in `PROJECT-IDEAS.md` cannot be built. The nearest true thing
is better anyway: five million parameters at a 64 token context is about 5 MB as
int8 ONNX, which means the page runs the real weights in the visitor's browser
with no backend at all. A link, not a clone. And six layers of attention
resolving into one of 44 intents has more visible mechanism than a probability
distribution over a vocabulary.

The tool loop, the retry and the self judging belonged to the 72M model. The
page will not claim them, and T10 makes that an explicit line in the README.

**Proof**

```
$ curl api.github.com/repos/Broikos-Nikos/bslm/releases
  releases: 1, tag assets, assets: bslm-working.png 0.9MB   (no gguf)
$ find bslm -name "*.pt" -o -name "*.bin" -o -name "*.safetensors"
  ./checkpoints/bslm.pt
$ torch.load('checkpoints/bslm.pt')
  83 tensors, 5,086,061 params
  cfg {vocab 4000, n_intents 44, n_slot_tags 65, d_model 256,
       n_layers 6, n_heads 4, d_ff 768, max_len 64}
```

**Next tick:** fold in the four tokenlab audits if they have landed, otherwise
watch-it-think T1, the ONNX export with attention as a named output and a parity
gate against the torch forward pass.

---

## 2026-09-21 00:03 | tick 3 | watch-it-think | The router is out of PyTorch and into a graph

**Task:** T1, export to ONNX with attention as a named output, gated for parity.

**Why not the active project.** Ladder step 1 first: `tokenlab` builds clean
(`tsc` silent, vite 247 ms), so nothing is broken. Step 2, no audit findings have
landed yet. Step 3 points at tokenlab T8, whose only remaining piece is a capture
and the browser is held by the hostile stranger audit. Four agents are reading
`projects/tokenlab` right now and editing under them would make their findings
describe a file that no longer exists. So the tick took the next real task that
touches neither the browser nor the audited tree.

**What changed**

- `projects/watch-it-think/tools/export_onnx.py` exists and works.
- `public/model/router.onnx` (20.4 MB fp32), `meta.json`, `tokenizer.json`.

**The problem it solves.** The original forward pass computes attention and
throws it away. The page has to draw it, so it has to be an output of the graph.
That means re-declaring the architecture, and a re-declaration that has silently
drifted is worse than no export at all. So it is gated three ways and nothing is
written unless all three pass.

**Proof**

```
$ python tools/export_onnx.py --checkpoint .../bslm.pt --bslm-repo .../bslm
checkpoint: 5,086,061 parameters
state dict loaded strictly into the re-declared copy, 83 tensors
gate 1, copy against original:    max abs diff 0.000e+00
exported router.onnx, 20.4 MB
gate 2, graph against original:   max abs diff 6.914e-06
gate 3, attention rows sum to one: worst deviation 2.384e-07
all gates passed
```

Bit exact against the original module on 20 real sentences in both languages.
The ONNX round trip costs seven millionths, which is float arithmetic order, not
drift.

Then the graph was run on its own to check it predicts something real:

```
light.control    95.9%  att (6,1,4,6,6)  <- turn off the kitchen lights
alarm.set        48.1%  att (6,1,4,9,9)  <- set an alarm for seven thirty tomorrow
light.control    95.6%  att (6,1,4,6,6)  <- σβήσε τα φώτα στην κουζίνα
weather.query    95.9%  att (6,1,4,7,7)  <- τι καιρό κάνει αύριο στη Θεσσαλονίκη
```

Six layers, four heads, dynamic token axis, and the Greek works. `alarm.set` at
48 percent on a nine token sentence is the kind of thing the page should show
rather than hide: the model is not always confident and the race to the answer
is the interesting part.

**Noted, not fixed**

`torch.onnx.export` warns that the TorchScript path is legacy as of torch 2.9.
The graph it produced is correct and gated, so this is not urgent, but it is now
T12.

**Next tick:** the audits if they have landed, otherwise T2, int8 quantisation
with the parity gate re-run and the accuracy cost recorded rather than assumed.

---

## 2026-09-21 00:22 | tick 4 | tokenlab | Every high finding closed

**Task:** T11, fold in the four audits and fix the high severity findings.
Seventeen of them, fourteen distinct roots once the overlaps collapsed.

**The one that mattered**

The measurement was measuring two things and handing the credit to one of them.
Greek is **2.015x the UTF-8 bytes** of English before any tokenizer is involved,
because Greek is two bytes a letter and English is one. So the 2.09x headline on
`o200k` was the script multiplied by the vocabulary, and the vocabulary's share
of it is **3.6 percent**. The real result, now that it is separated:

```
$ npm run measure
Greek is 2.015x the UTF-8 bytes of English before any tokenizer runs.

encoding  raw ratio   95% interval    vocabulary cost beyond the script
o200k     2.09        1.97 to 2.2      1.036x  (+3.6%)
cl100k    5.14        4.81 to 5.47     2.552x  (+155.2%)
p50k      6.48        6.07 to 6.87     3.214x  (+221.4%)
r50k      6.48        6.07 to 6.87     3.214x  (+221.4%)

p50k and r50k tokenize this corpus identically. One result, not two.
```

That is a better finding than the one it replaces. `o200k` has effectively
closed the Greek vocabulary gap and almost nobody knows it, while `cl100k`, which
is still under every GPT-4 era cost model in production, really does charge two
and a half times per byte.

**The one that was embarrassing**

Both token counts in the README's only picture were typed by hand and both were
wrong: 37 and 82, not 26 and 70. They sat one screen above a line claiming that
no number in the repository is typed by hand. They are generated now.

**The rest, by root**

- The price was computed from whatever encoding was selected, while
  `pricing.json` already records which encoding each model uses. Three of the
  four buttons printed a false bill under a real model name, up to 165 percent
  high. It refuses now instead of guessing.
- The per register claim overstated by three to four times. Tokens per Greek
  word is flat at 2.46 across four of five registers; the spread was the author
  writing the conversational Greek 20 percent shorter than its English partner.
- A replacement character in the input made `isReadable` swallow the rest of the
  document into one chip, because it could not tell a decoder failure from a
  character that was genuinely there. It re-encodes to tell them apart.
- `setEncoding` had no generation guard. A slow vocabulary asked for first
  overwrote a fast one asked for second, leaving the wrong encoder behind a
  pressed button.
- The textarea was seeded after the await, so anything typed during the 2 MB
  download was silently discarded.
- The entrance stagger restarted on every keystroke, so the chip you just typed
  was the slowest thing on screen and every chip past the sixtieth never became
  visible while typing.
- `textarea:focus { outline: none }` outranked the `:where()` focus ring on
  specificity, so the primary control had no visible keyboard focus.
- `--text-faint` measured 3.22:1 on `--ink-lift` and failed AA in ten places,
  including the interval column. Three text levels collapsed to two.
- Nothing the page computed was ever announced. There is a live region now, and
  the chip list stays silent on purpose because read aloud it is a wall of
  single letters.

**The design audit's one thing, taken**

The page opens on `cl100k`, the red wall, and heals to `o200k` after 1.8
seconds, cancelled by any interaction and skipped under reduced motion. The
shatter is now on screen at second zero instead of waiting for a click, and
because `setEncoding` is the only function that writes the headline ratio, the
missing number in the hero sentence fills itself in on the way past.

**Proof**

```
$ node segment test with the exact reported input
plain   tokens 23  segments 23  multi 0  roundtrip OK     (was 6 segments, last swallowing 18)
emoji   tokens 13  segments  7  multi 3  roundtrip OK
$ npm run build    -> tsc clean, built in 292ms
$ bh reload, shot .stage  -> opens on cl100k red wall, heals to o200k
$ bh shot .meter on cl100k with GPT-5.6 Sol selected
   -> "n/a", "GPT-5.6 Sol runs on o200k, not cl100k, so this count is not its bill."
$ git log -> a8631e1 Close every high finding from the four audits
```

**Where it stands**

67 findings, 22 closed, 45 open, and **no high severity findings remain**. What
is left is 27 medium and 18 low, which is a normal backlog rather than a
correction list.

**Next tick:** the mediums, starting with the ones the audits agreed on: the
chip list rebuilding every frame, no loading state on a 2 MB chunk, the findings
table unreachable on a phone, and the corpus file still describing itself
wrongly about the two UDHR pairs.

---

## 2026-09-21 00:23 | contract | LOOP-PROMPT.md v2

Not a tick. The schedule was verified live (`076ecaba`, every 30 minutes,
recurring, session scoped) and the contract was rewritten from what ticks 0 to 4
actually cost. v1 is archived at `docs/LOOP-PROMPT.v1.md`.

**What v1 got wrong**

- **It deadlocked on its own rule 5.** "Do not start the next project until the
  last is visible" plus "publishing is owner gated" meant no project could ever
  become visible and the loop could never advance. Section 7 now defines visible
  in terms the loop can actually reach.
- **The ladder had no answer for a frozen project.** Tick 3 hit it and had to
  improvise. Now it is a clause.
- **It ranked a broken build above a false claim, and had no rank for a false
  claim at all.** Tick 4 found two hand typed numbers in a README sitting one
  screen above a line claiming no number there was typed by hand. Unreproducible
  claims are now ladder item 2, above every severity.
- **It said "run the measurement" but not "interrogate it".** The headline was
  two effects multiplied together. Gate 4 now asks what else could produce a
  number before it is quoted.
- **It never said where the time comes from.** Two entries were stamped wrong.
- **It assumed one agent, one browser, implicitly.** Now explicit, because four
  concurrent auditors made it a real constraint.
- **It said nothing about a session restart.** The cron job dies with the
  session, so section 1 now re-arms it first.

**Added**

- Section 9, a table of what each early tick got wrong and which rule it bought,
  so the loop does not relearn them.
- Audit perspective rotation recorded per project in `state/state.json`.
  tokenlab has used 4 of the 9.
- A rule for folding an audit flood: collapse to roots, fix roots, close every
  finding a root closes.

**Proof**

```
$ CronList -> 076ecaba, every 30 minutes, recurring, session-only
$ state.contract_version -> 2
$ tokenlab audit_perspectives_used -> 4 of 9
```

---

## 2026-09-21 00:30 | tick 5 | tokenlab | The claim checker

**Task:** ladder item 2, a claim the repository cannot reproduce. Item 1 checked
first: `tokenlab` builds clean, `watch-it-think` has no build yet.

**What changed**

`tools/check-claims.ts` rebuilds all 29 numeric claims in `README.md` from
`src/generated/findings.json` and fails by name if any of them has drifted. It
runs inside `npm run build`, so the README cannot go stale without the build
going red.

**Why this and not the next feature.** The measurement audit found two hand
typed numbers in the README that were wrong, one screen above a line claiming no
number in the repository is typed by hand. Tick 4 corrected those two. That fixes
the instance and leaves the class, and the class will come back the next time a
number is quoted in prose. So the rule stopped being a promise.

**It found a third one immediately**

```
$ npm run check
FAIL  p50k_base bytes per Greek token in the table
      README.md must contain: "| 1.61 |"
FAIL  r50k_base bytes per Greek token in the table
      README.md must contain: "| 1.61 |"
```

1.63 was typed by hand in tick 4, an hour after the audit that was about exactly
this. The measurement says 1.61.

**Proof**

```
$ npm run check   -> 29 claims in README.md check out against findings.json
$ negative control: sed "| 5.05 |" -> "| 5.55 |"
  -> FAIL o200k_base bytes per Greek token in the table
  -> 1 of 29 claims do not match          (so the gate actually bites)
$ restore, npm run build -> 29 claims check out, tsc clean, built in 248ms
$ git log -> e984572 Make the no-hand-typed-numbers rule mechanical
```

**Also corrected**

A sentence claiming this README table reads `findings.json`. It does not, it is
prose. The README now says so and says what holds the two together. That closes
ME-F14 and ME-F15.

**Next tick:** tick 6, the mediums the audits agreed on. First is the chip list
rebuilding every frame on every keystroke, which is the same root as the missing
loading state on a 2 MB chunk.

---

## 2026-09-21 01:06 | tick 6 | tokenlab | The recording

**Task:** ladder item 4, finish T8, which had been `in_progress` since tick 1
with one piece left: the capture at the top of the README. Items 1 to 3 checked
first: build clean, 29 claims passing, no high findings.

**What changed**

`npm run capture` drives the real page in a real browser and encodes
`docs/shatter.gif`. The page opens on `cl100k` where every Greek letter is its
own token, heals to `o200k` where they collapse into word pieces, then goes back,
so the loop reads as a comparison rather than as an animation. 2.5 MB, 12 fps,
880px, ffmpeg with a generated palette because the default one bands a dark page
into stripes. The webm is kept alongside and gitignored.

Playwright is not a dependency. Installing a browser engine to run a page that
needs no backend would be a strange tax on anyone cloning this, so the script
resolves it from wherever it already exists and says how to get one if it does
not.

**The capture had to be made deterministic first**

The first three recordings were of whatever sentence the shuffle picked, which
put numbers in the README caption that nothing could check. That is the exact
defect the measurement audit found in the alt text. So `?pair=N` now pins the
sentence, the capture pins pair 17, which is the same sentence as the two stills
and the one `measure.ts` emits as `figureSentence`, and `check-claims` asserts
the caption like every other number: 82 tokens on `cl100k`, 37 on `o200k`.

`?pair=N` is also just a good thing for a page to have. A link to it can now
point at a particular example instead of at a shuffle.

**The gate bit, and the tick became the gate**

Watching the recording showed the page contradicting itself. An encoding button
flipped to pressed the moment it was clicked, while its megabyte of vocabulary
was still downloading, so for the length of that download the page was
recoloured for one encoding, the headline said its ratio, and the price note
said "GPT-5.6 Sol runs on o200k, not cl100k" underneath a lit o200k button.

Tick 4 fixed the encoder race and left the button race. A pressed button is an
assertion about which encoding is producing the tokens on screen, so now nothing
moves until the vocabulary lands and the button says `loading` in the meantime,
dashed border, pulsing label. That closes PA-F9 as well, which was the missing
loading state on a 2 MB chunk.

**Proof**

```
$ npm run build   -> 30 claims in README.md check out, tsc clean, built in 252ms
$ npm run capture -> docs/shatter.gif 2.51 MB at 12 fps, 880px wide
$ frame 40 of the gif: cl100k lit, 82 tokens, 4.82x, price n/a with the right
  reason, and the English word `build` sitting as one token in a wall of
  single Greek letters
$ git log -> 7a0cdb8 A recording at the top, pinned so its numbers can be checked
```

**Section 7, visible**

All five conditions now hold for `tokenlab`: build passes, seen in a browser,
every number measured from a committed corpus, capture at the top of the README,
no open high findings, publish queued under `awaiting_owner`. Three tasks remain
(T7 polish, T9 precomputed ids, T13 the corpus method correction), so it is not
`done` by the ladder, but it is no longer the thing standing between the loop and
the next project.

**Next tick:** T13 first, because `data/pairs.json` still describes itself in a
way the README already admits is untrue, and a corpus that lies about its own
provenance is a claim the repository cannot reproduce.

---

## 2026-09-21 01:30 | tick 7 | tokenlab | The corpus stops lying about itself

**Task:** ladder item 2, a claim the repository cannot reproduce. `data/pairs.json`
said every pair was written by hand in both languages and not machine translated,
and three of the forty were adapted from the Universal Declaration of Human
Rights.

**Replaced, not disclosed**

Disclosing it was the smaller fix and tick 6 had already put a line about it in
the README. It is the wrong fix. The stated method exists so the comparison
measures writing systems rather than translationese, and an official translation
is translationese by construction, so those three pairs were not merely
undescribed, they were measuring the thing the method was designed to exclude.
They are replaced with three formal register pairs written natively in both
languages.

Every pair now carries a `provenance` field, `written` is the only value the
corpus accepts, and `npm run check` fails if any pair says otherwise. The file
cannot drift from its own description again.

**The finding did not depend on them**

```
              before      after
headline      2.09x       2.06x
byte ratio    2.015       2.004
o200k penalty +3.6%       +2.9%
cl100k        +155.2%     +155.7%
p50k / r50k   +221.4%     +220.3%
```

Removing three of forty pairs moved the headline by 0.03 and the o200k
vocabulary penalty down by 0.7 points. The conclusion that `o200k` has closed
the Greek vocabulary gap is stronger after the correction than before it.

**The checker earned its keep a second time**

Twenty README claims moved with the corpus, and `npm run check` named every one
of them, including the ones buried in prose two screens down. Doing that by eye
is the job nobody does correctly.

It also surfaced two of its own defects while doing it: it was emitting `5.1`
next to `1.62` because `round` drops a trailing zero, and it was writing "an 10
percent difference". Both fixed, bytes per token is two decimals everywhere and
the article agrees with the number.

**Proof**

```
$ npm run measure
Greek is 2.004x the UTF-8 bytes of English before any tokenizer runs.
o200k   2.06   1.94 to 2.18   1.029x  (+2.9%)
cl100k  5.12   4.79 to 5.45   2.557x  (+155.7%)
p50k    6.42   6.00 to 6.82   3.203x  (+220.3%)
r50k    6.42   6.00 to 6.82   3.203x  (+220.3%)
$ npm run check -> 20 FAIL, each named, then after the edits:
                   30 claims in README.md check out against findings.json
$ npm run build -> tsc clean, built in 248ms
$ git log -> b8e8f24 Remove the three translated pairs the corpus claimed it did not have
```

The recording did not need redoing: it is pinned to pair 17, which is technical
register and untouched, so 82 and 37 still hold and the caption claim still
passes.

**Next tick:** tick 8 is an audit tick. Perspective must be one of the five not
yet used on `tokenlab`: recruiter, hiring engineer, deep reviewer, maintainer in
six months, supply chain.

---

## 2026-09-21 01:45 | tick 8 | watch-it-think | int8, and what it cost

**Audit tick.** 8 % 4 == 0, so a subagent went out first, against `tokenlab`,
on the deep reviewer perspective, the fifth of nine and the first to read the
logic as code rather than as comments. `tokenlab` is marked `frozen` in
`state/state.json` while it reads.

With the active project frozen, the ladder falls through to the next `todo` in a
project that is not: `watch-it-think` T2.

**What changed**

`tools/quantize.py` quantises the router to int8, evaluates both graphs on the
held out set, and writes the result into `meta.json`. Weights only: the
attention field is a probability distribution the page draws directly, and
quantising the activations around it would show up as banding in something a
visitor is looking at.

```
$ python tools/quantize.py --test .../data/test.jsonl
quantising router.onnx (20.4 MB) -> router.int8.onnx (5.3 MB)
held out set: 10578 sentences

fp32  intent  74.58%   tags  97.28%   both  69.97%   0.96 ms/sentence
int8  intent  74.53%   tags  97.28%   both  69.86%   0.75 ms/sentence

int8 costs +0.05 points of intent accuracy and is 3.86x smaller
budget is 1.0 point, so shipping int8
```

The budget was written down before the run, per rule 1 of the brief. It cost
0.05 points, so int8 ships: 5.28 MB over the wire and faster than the fp32 it
replaces.

**The number is 74.58 and it needed checking before it was believed**

74.58 percent intent accuracy is lower than a router of this kind sounds like it
should be, so the harness was the first suspect rather than the model. It was
validated against `bslm.infer.Parser`, the reference implementation, on the same
800 rows:

```
reference Parser, threshold 0.50 (the deployed behaviour): 72.00%, abstains on 114 of 800
reference Parser, threshold 0.00 (argmax, what this graph reports): 74.38%
this ONNX harness on the same 800 rows:                             74.38%
```

Exact agreement. Two things follow. The harness is right, and the number is
real. And `data/test.jsonl` is the set `benchmark.py` calls
`run_adversarial`, so 74.58 percent is an adversarial figure, not a headline
figure, which is worth saying plainly wherever it is quoted.

The gap between 72.00 and 74.38 is the abstain threshold: the shipped assistant
refuses below 0.50 rather than guessing. That is a different question from what
the model predicts, and this page draws what the model predicts. Both numbers
are in `meta.json` so neither can be quoted without the other.

**Proof**

```
$ full run, 10578 sentences, both graphs           (above)
$ cross check against the reference implementation (above)
$ meta.json -> quantisation.ships = "int8", bytesInt8 5,283,000
```

**Next tick:** fold in the deep reviewer findings when they land. Otherwise
`watch-it-think` T3, the tokenizer port to TypeScript, gated on producing
identical ids to the Python tokenizer on 200 sentences.

---

## 2026-09-21 02:20 | tick 9 | tokenlab | Draw the text that was typed

**Task:** ladder item 2 and 3 at once, DR-F1. The page asserts "this is your
text, tokenized" and was drawing something else, which is a claim the repository
cannot reproduce as much as any number is.

**What was actually wrong**

`segment()` grew a run of ids and called `decode()` on it after every token,
treating `decode` as a pure function of its argument. It is not one.
`gpt-tokenizer` 4.0.0, `BytePairEncodingCore.js:6`, creates one module level
`TextDecoder`, feeds it `{ stream: true }` and never flushes. Decoding a prefix
that ends mid character leaves those bytes inside the decoder, and the next
`decode` call anywhere on the page receives them prepended to its own output.
`segment()` was the one function that called decode on deliberately incomplete
prefixes, so it poisoned itself on every token.

The `MAX_RUN` cap of 4 then made it worse rather than better: it cut a run in
the middle of a character, emitted it as finished, flagged it `splitIntoBytes`,
put a cost badge on it and counted it in the fracture note. Every one of those
badges was the cap, not a measurement.

**What it looked like**

```
typed:  Ἄνδρα μοι ἔννεπε, Μοῦσα, πολύτροπον
drawn:  Ἄνδρα μοι ??ννεπε, Μοῦσα, πολύτροπον     (two replacement characters)
        first chip "Ἄν", cost badge 4
```

Polytonic Greek broke on `cl100k`, `p50k` and `r50k`. Coptic, Linear B and the
surfer emoji broke on all four. Korean broke on the two oldest. The 40 pair
corpus is clean in both NFC and NFD, so no published number moved: this was the
page only.

**The fix**

Bytes, not strings. `Encoder` gains `tokenBytes(id)`, which reads the per token
bytes `gpt-tokenizer` already computes, and `segment()` assembles UTF-8 with a
strict `TextDecoder` this project owns, using a failed decode as the test for
"this run is not finished". No shared state, no cap to guess at, and a run that
genuinely never completes is marked `incomplete` rather than charged for. If the
library ever stops exposing per token bytes, loading an encoder throws by name
instead of quietly drawing nonsense.

**The gate that was missing**

`tools/check-segments.ts`, wired into `npm run check`. 92 cases across four
encodings: polytonic, NFD, Coptic, Linear B, Korean, four kinds of emoji,
control characters, a replacement character genuinely in the input, and every
prefix of a polytonic line as it is typed one character at a time.

**Proof**

```
$ npm run check:segments -> 92 segmentation cases round trip exactly, across 4 encodings
$ negative control: git show HEAD:src/lib/segment.ts restored, same gate
  FAIL  o200k_base  Coptic          typed "Καλημέρα Ⲁ κόσμε"  drawn "Καλημέρα ?? κόσμε"
  FAIL  o200k_base  Linear B        typed "𐀀𐀁𐀂 and som"      drawn "?𐀀?𐀁?𐀂 and "
  FAIL  o200k_base  emoji, surfer   typed "a 🏄 b"             drawn "a ?? b"
  FAIL  cl100k_base polytonic Greek typed "Ἄνδρα μοι ἔννεπε"   drawn "Ἄνδρα μοι ??ννεπε"
$ npm run build -> both gates pass, tsc clean, built in 251ms
$ bh: typed the Odyssey line into the live page on cl100k
  -> draws correctly, red chips cover one character each,
     badges now 3, 3, 2, 3, 2 which are real costs
$ git log -> 58414ff Draw the text that was typed
```

**Next tick:** DR-F4, the checker that can pass a claim off a different row. It
is the same class of problem as this one: the thing built to catch mistakes was
not actually looking.

---

## 2026-09-21 03:00 | tick 10 | tokenlab | Make the checker actually look

**Task:** ladder item 2, DR-F4 and DR-F5. They are one root: the thing built to
catch mistakes was not checking what it claimed to check, so every number it
said it was guarding was in fact unguarded.

**DR-F4, a claim could pass off a different row**

Claims were `haystack.includes(want)` against the whole README flattened to one
line. `p50k` and `r50k` measure identically on this corpus, so their claim
strings were character for character the same: `| 6.42x |`, `| 6.00 to 6.82 |`,
`| 1.62 |`. The audit deleted the entire `r50k` row and all thirty claims still
passed.

Two changes. Every claim now states how many times it must appear and fails on
too few or too many. And each table row is asserted whole, keyed by its
encoding, rather than cell by cell, which also means the `used by` column cannot
be mislabelled.

**DR-F5, the corpus size was hand typed at both ends**

`add('the corpus size', 'Forty sentence pairs')` is a literal on one side and a
word on the other, with `f.corpus.pairs` read by neither. Three pairs were
removed in tick 7 and nothing here would have noticed if the word had stayed
wrong. It is spelled from the measurement now and asserted in all three places
the README says it, plus the method sentence inside `data/pairs.json`.

**One more, unasked**

The sentence "on `p50k` and `r50k` it adds 220 percent" is one number standing
for two encodings, which is only true while they agree. The checker verifies
that premise before it verifies the sentence and says to split it if they ever
diverge. That closes DR-F7.

**Proof**

```
$ npm run check:claims -> 25 claims in README.md check out against findings.json
  (30 became 25 because twelve cell claims became four row claims)

$ control 1, the audit's exact test: delete the whole r50k row
  FAIL  the whole r50k_base row of the table
        expected 1 occurrence(s) in README.md, found 0

$ control 2: change Forty to Fifty where the table is introduced
  FAIL  the corpus size where the table is introduced
        expected 1 occurrence(s) in README.md, found 0

$ npm run build -> both gates pass, tsc clean, built in 234ms
$ git log -> 3fac693 Make the checker actually look
```

**Noticed, not fixed**

`findings.json` reports `measured 2026-09-20` while the corpus says
`revised 2026-09-21`, because the measurement date is UTC and the revision date
is local. It reads as a measurement that predates the corpus it measured. That
is DR-F13 and it gets its own tick.

**Next tick:** DR-F2, a vocabulary that fails to load leaves the page
permanently dead with no message and no way back, and DR-F3, a click during that
load is silently undone 1.8 seconds later by the heal timer. Same surface, one
task.

---

## 2026-09-21 03:30 | tick 11 | tokenlab | The network misbehaving

**Task:** ladder item 3, DR-F2 and DR-F3. One surface, one task: everything that
happens between asking for a vocabulary and getting it.

**DR-F2, a failed fetch killed the page silently**

`loadEncoder` put the promise in the cache before it settled, which is what
makes concurrent callers share one download, and never took it out again on
rejection. So one failed fetch was cached for the life of the page and every
retry replayed the same rejection without touching the network. `setEncoding`
had no error path at all: the code clearing `is-loading` sat after the `await`,
so the button stayed busy forever, `encoder` stayed null, `render()` returned at
its first line, and the page was a styled empty box that never said anything was
wrong. The page boots on `cl100k`, so this was the default path for every
visitor on a flaky connection.

**The retry reloads, and that is the interesting part**

The obvious fix is a retry button that imports again. It would not work. A
browser caches the result of a module load against its URL, failures included,
so importing the same specifier a second time never reaches the network. The
first attempt at this tick built exactly that button and the gate caught it:

```
FAIL  clicking again is a real retry, not a replay of the cached rejection
      requests before 2, after 2
```

So the retry reloads instead, carrying the typed text, the sentence and the
failed encoding through `sessionStorage`. It is a second attempt rather than a
restart, and a resumed page does not play the opening animation over the top of
where the visitor was.

**DR-F3, the visitor being undone 1.8 seconds later**

`boot` awaited its first `setEncoding` and then armed the heal timer. A click
during that await superseded the request, which made `setEncoding` return early
and resolve normally, so `boot` armed the heal anyway. `cancelHeal` in the click
handler could not help: at that moment there was no timer to clear, and one was
armed a second later. `setEncoding` now reports whether it was the call that
applied, and the heal is armed only if it was and only if the visitor has not
acted.

**The gate**

`tools/check-loading.mjs`, a real browser with the requests intercepted, because
neither failure is reachable without controlling the network. Eleven checks over
a 503 and over a 2.5 second delay.

**Proof**

```
$ npm run check:loading
a vocabulary that never arrives
  ok  the page says the vocabulary did not arrive
  ok  the button it was asked for is no longer marked busy
  ok  nothing was thrown out of the page
  ok  the retry reaches the network again rather than replaying the rejection
  ok  the page recovers and draws tokens
  ok  the error message is gone once it works
  ok  the text survives the retry
  ok  it comes back on the encoding that had failed
choosing an encoding while the first one is still loading
  ok  the encoding the visitor chose is still the one selected
  ok  exactly one encoding is marked selected
  ok  the headline is not the literal placeholder

$ control, cache eviction reverted        -> 3 of the failure checks fail
$ control, both heal guards reverted      -> FAIL the encoding the visitor
                                             chose is still the one selected
$ npm run build -> both gates pass, tsc clean, built in 246ms
$ git log -> 823a78f Say when a vocabulary does not arrive, and stop undoing the visitor
```

The first race control was worthless and had to be redone: only the outer guard
had been reverted, the inner one still held, and the test passed. A negative
control that does not fail is not evidence, it is a second way to be wrong.

**Where it stands**

80 findings, 31 closed, 49 open, no highs anywhere in the workspace.

**Next tick:** the mediums. DR-F6 first, the page still telling the raw ratio
story the README now says is the wrong one, which is the largest gap between
what this project knows and what it shows.

---

## 2026-09-21 04:00 | tick 12 | watch-it-think | The tokenizer port, held to id for id

**Audit tick.** 12 % 4 == 0, so a subagent went out first, against `tokenlab`,
on the recruiter perspective: ten seconds, not technical, the stage one reader
the whole project is aimed at and the only one of the three in
`PROJECT-IDEAS.md` that had never looked. Sixth of nine. `tokenlab` is frozen
while it reads, so the ladder falls to `watch-it-think` T3.

**What changed**

`src/lib/tokenizer.ts`, the router's BPE tokenizer in TypeScript, and
`tools/check-tokenizer.ts`, which holds it to the Python one id for id over 230
sentences: 200 sampled from the held out set and 30 chosen because they are
where a port goes wrong. Upper case Greek, the three apostrophes the
pre-tokenizer accepts, underscores and digits, single characters, polytonic,
emoji, and a word of eighty letters.

The bar is equality, not similarity. The model was trained on ids from
`bslm/tokenizer.py`. A port that is merely close feeds it ids it has never seen,
and the page then shows a worse model than the one that was actually trained,
with nothing on screen to say so.

**It caught a defect on its first run, and the defect had a comment defending it**

```
FAIL  token ids differ
      input: "ΟΔΟΣ"
      python: [2,1727,63]
      ts:     [2,1727,64]
```

63 is `##ς`, 64 is `##σ`. The first version lowercased each code point
separately, on the stated theory that Python does not apply the Greek final
sigma rule and JavaScript does. Python applies it:

```
$ python -c "print([hex(ord(c)) for c in 'ΟΔΟΣ'.lower()])"
['0x3bf', '0x3b4', '0x3bf', '0x3c2']      0x3c2 is the final sigma
$ node -e "console.log('ΟΔΟΣ'.toLowerCase())"
οδος                                       the same
```

So the plain `toLowerCase()` was correct all along and the clever version was
the bug. What makes it worth writing down is that I had put a comment above it
asserting the difference, written before anything was measured. A defect with an
explanation attached to it is harder to find than a bare one, and only the gate
told the truth.

**Proof**

```
$ python tools/dump_python_tokenizer.py --bslm-repo .../bslm
  wrote tokenizer-expected.json: 230 sentences, 30 of them edge cases
$ npm run check:tokenizer
  before the fix: 2 disagreements over 230 sentences
  after:  230 sentences, 2104 tokens, identical to bslm/tokenizer.py
$ npm run typecheck -> clean
$ git log -> 22c9d44 The router tokenizer, in TypeScript, identical to the Python one
```

The failing run is the negative control: the gate was written first and it
failed on real code before it passed.

**Next tick:** fold in the recruiter findings if they have landed. Otherwise
`watch-it-think` T4, the Vite scaffold and the first live inference in a browser
through onnxruntime-web.

---

## 2026-09-21 04:10 | tick 12b | tokenlab | Recruiter audit folded, and one regression repaired

Not a new tick. The recruiter audit landed after tick 12 closed, and one of its
findings was a regression introduced in tick 11 that made the page look broken
on every load. Folding thirteen findings and leaving that one in place until the
next scheduled tick would have been discipline for its own sake.

**The regression**

`index.html` puts the `hidden` attribute on the error paragraph. The browser
hides `[hidden]` with a `display: none` that loses to any author rule setting
display. Tick 11 added `display: flex` to lay out the retry button, which
silently unhid it.

```
$ bh eval on the live page
{"hidden": true, "display": "flex", "box": "678.7x56.1", "text": "Try again"}
```

A 679 by 56 red bar, in the middle of the page, on every load, in the healthy
state, containing nothing but the words Try again. Painted in the same alarm red
the project uses to mean a character cost more than it should.

`[hidden] { display: none !important }` now makes the attribute mean what it
says whatever gets added later.

**The more useful half: why nothing caught it**

`tools/check-loading.mjs` has eleven checks and every one of them looked at a
broken page. A 503, a slow response, a recovery. Not one looked at a normal
load, which is the state every visitor is actually in. There is a healthy
section now: no error bar on screen when nothing has failed, and every element
marked `hidden` takes no space.

```
$ control, guard removed
  FAIL  [data-load-error] marked hidden actually takes no space
        {"x":67.2,"y":641.8,"width":678.7,"height":56.1}
$ restored -> 15 checks, all ok
```

And the process failure underneath it: the CSS changed after the last gate run
and was committed without re-running it, because the gate needs a dev server and
cannot live inside `npm run build`. `npm run verify` runs both now.

**What the recruiter found beyond that**

Thirteen findings, four high, and the one thing is blunt: there is nowhere to
click. The entire pitch is "open the page and watch it happen", and the only URL
anywhere in the README is `localhost:5173`, two thirds of the way down, inside a
code block. Everything else it found is downstream of that. The repository also
has no description and no topics, so on a profile listing it is one word, and
the first two sentences assume the reader already knows what a tokenizer is.

Deploying is outward facing, so it stays in `awaiting_owner`. The README line,
the description text and the plain English opening do not, and they are the next
tick.

**Where it stands**

93 findings, 33 closed, 60 open, three high, all three from this audit.

---

## 2026-09-21 04:30 | tick 13 | tokenlab | The first screen, for a stranger

**Task:** ladder item 3, RC-F3 and RC-F4, the two high findings that can be
fixed without a URL. RC-F1 needs a push, which is the owner's.

**What changed**

The README used to open with "Greek costs 2.06 times the tokens of English on
the newest OpenAI vocabulary" and "Almost none of that is the tokenizer": five
numbers and four monospace codes in one paragraph, with nothing anywhere before
them saying what a token is or why it costs money. The recruiter audit read it
and could not use it, which means the strongest position on the page was spent
on a sentence that only lands for people who were going to be impressed anyway.

It now opens with what a token is and what the page does, then the recording,
then the figure under its own heading for the reader who came for it. The
paragraph about how the first version of this README was wrong is gone from the
second position: that was the README talking about itself where a stranger
needed the subject.

The two still pictures were captioned in different units, 14 Greek words against
94 characters, which is not a comparison anyone makes in the two seconds they
give it. Both are in words now, the character count moved into the sentence
underneath, and `check-claims` asserts all three.

**Publishing is now a paste**

`package.json` carries a description written for a profile listing rather than
for npm, deliberately with no numbers in it, because a GitHub About box is
somewhere `npm run check` cannot reach and anything numeric there would go stale
unnoticed. `docs/PUBLISH.md` has that string, the topics, the Pages steps and
the exact README link line. `.github/workflows/pages.yml` builds and publishes
`dist/` on push, and since it runs `npm run build` it runs both gates, so a push
that breaks a number in the README or draws text nobody typed fails instead of
publishing.

**Proof**

```
$ npm run build -> 92 segmentation cases round trip, 24 claims check out,
                   tsc clean, built in 252ms
$ npm run check:loading -> 15 checks, all ok   (the step tick 12b added, run
                                                before committing this time)
$ git log -> 2903e64 Write the top of the README for someone who does not know
             what a token is
```

**Where it stands**

93 findings, 37 closed, 56 open, one high left: RC-F1, there is nowhere to click.
It is the only finding in the workspace that the loop cannot close by itself.
`awaiting_owner` now says so explicitly and names what it blocks.

**Next tick:** the mediums. DR-F6 first, the page still telling the raw ratio
story that this README now says is the wrong one, which is the largest remaining
gap between what the project knows and what it shows.

---

## 2026-09-21 05:00 | tick 14 | tokenlab | The page and the README stop disagreeing

**Task:** DR-F6. Read strictly, ladder item 2 does not fire: the page said "one
of them costs 2.06x more", which is reproducible and true. It fires on the
reading that matters, though. The README opens by disowning the raw ratio as an
attribution, the page showed nothing else, and the footer claimed every number
on the page comes from `npm run measure`. A claim the repository contradicts
elsewhere is worse than one it merely cannot reproduce, so it was taken ahead of
the remaining `todo` items. That ordering is a judgement call and this is it
being written down.

**What was wrong**

`measure.ts` has emitted `headline.scriptCost`, `headline.vocabularyCost` and a
`lengthControlled` block per encoding since tick 4. `main.ts` read none of them.
Grepping the whole of `src/` for `scriptCost`, `vocabularyCost`,
`lengthControlled`, `bytesPerToken` and `byteRatio` returned nothing. The
correction that is the project's actual finding existed only in the README, and
a visitor who never opens a README is most visitors.

**What changed**

The standfirst keeps its hook and gains its correction one line under it, live
per encoding: "Most of that is the alphabet. Greek is 2.004x the bytes of
English before any tokenizer runs, and o200k adds 2.9% on top."

The table swaps `tokens per Greek word` for `bytes per token, Greek` and `what
the vocabulary adds`, which is the column that actually separates the four
encodings, and the lede says which column to read. The four rows now run +2.9%,
+155.7%, +220.3%, +220.3% down the page, which is the finding as a shape rather
than as a sentence.

**Proof**

```
$ npm run build -> 92 segmentation cases, 24 claims, tsc clean, built in 246ms
$ npm run check:loading -> 15 checks, all ok
$ bh, full page capture: headline 2.06x, correction line underneath it,
  table showing 5.10 / 2.05 / 1.62 / 1.62 and +2.9% / +155.7% / +220.3% / +220.3%
$ git log -> 01b11e3 Put the correction on the page, not only in the README
```

**Also closed**

RC-F7, the recruiter seeing five ratios in twenty seconds with no way to tell
which was the claim: there is now one column labelled as the part that is the
vocabulary. RC-F12, the table columns being in terms a non technical reader
cannot use.

**Where it stands**

93 findings, 40 closed, 53 open. One high, RC-F1, and it needs a URL.

**Next tick:** DR-F13, the page reporting a measurement date that predates the
corpus it measured, because the date is UTC and the corpus revision is local.
Small, and it is the kind of inconsistency a careful reader notices first.

---

## 2026-09-21 05:30 | tick 15 | tokenlab | The measurement stops depending on the clock

**Task:** ladder item 2, DR-F13. The page said "Measured 2026-09-20" under a
method describing a corpus revised 2026-09-21. Not a rendering artefact: the
file really had been written the day before, because the date came from
`new Date()` in UTC while the corpus dates itself locally.

**One root, two findings**

The same wall clock meant `npm run measure` produced a diff every day on an
unchanged corpus, which is ME-F19, and which trains a reader to ignore diffs in
the one file that must never drift unnoticed.

The measurement is a pure function of its inputs, so it is dated by its inputs
now. `findings.json` carries `corpusDated`, taken from the corpus, and
`inputsHash` over the pairs, the encoding list, the bootstrap count and the
seed. A date taken from the corpus cannot precede the corpus.

**The hash turned out to be worth more than the date**

`tools/inputs-hash.ts` is shared between the script that writes `findings.json`
and the script that checks it, so `npm run check` now recomputes it. Editing
`data/pairs.json` and forgetting to re-run the measurement was silent before,
and every claim in the README would then have been checked against a file
describing a different corpus. That is the failure mode the claim checker exists
to prevent and it had a hole straight through it.

**Proof**

```
$ npm run measure; cp findings.json f1; npm run measure; diff
  DETERMINISTIC: two runs, byte identical

$ control: change "ten minutes" to "nine minutes" in one pair, do not re-measure
  FAIL  src/generated/findings.json was measured from a different corpus.
        findings.json says 46be3d04c521dded, data/pairs.json hashes to 46bdb573ed73e012.
        Run "npm run measure".

$ npm run build   -> 92 segmentation cases, 24 claims, tsc clean, 241ms
$ npm run check:loading -> 15 checks, all ok
$ git log -> 392326b Date the measurement by its inputs, not by the clock
```

**Where it stands**

93 findings, 42 closed, 51 open. One high, RC-F1, still waiting on a URL.

**Next tick:** RC-F8, the one box a non technical reader can read instantly says
`n/a` on arrival, because the page opens on `cl100k` and the default model is
priced for `o200k`. The price guard is correct and the default pairing is not.

---

## 2026-09-21 06:00 | tick 16 | watch-it-think | The exporter question, answered by running it

**Audit tick.** 16 % 4 == 0. A subagent went out against `tokenlab` on the
hiring engineer perspective, the seventh of nine and stage two of the three
readers in `PROJECT-IDEAS.md`. It has the browser, so `tokenlab` is frozen and
so is `watch-it-think` T4, which needs a browser to verify. The ladder falls to
T12, which does not.

**What changed**

`torch.onnx.export` warns that the TorchScript path is legacy as of torch 2.9.
The obvious move is to switch, so the switch was tried rather than reasoned
about.

`--exporter dynamo` works, and in some ways better. It passed every gate in the
file: the graph matches the original module to 7.391e-06 on twenty real
sentences in both languages, and the attention rows still sum to one to
2.384e-07. It writes a 0.3 MB graph with the weights beside it in
`router.onnx.data` instead of one 20.4 MB file.

Then it cannot be quantised.

```
$ python tools/quantize.py ...
onnx.onnx_cpp2py_export.shape_inference.InferenceError:
  [ShapeInferenceError] Inferred shape and existing shape differ in
  dimension 0: (256) vs (44)
```

`onnxruntime.quantization` runs shape inference before it quantises, and the
`torch.export` graph does not survive it. int8 is the thing the page actually
loads, 5.28 MB against 20.4 MB, so an export that cannot be quantised is not an
export of anything this project uses.

**Call:** stay, pin, and leave the door open. `tools/requirements.txt` pins torch
2.14.0, onnx 1.23.0, onnxruntime 1.30.0. `--exporter dynamo` stays so the next
person re-tests in one command rather than rediscovering this. D6 has the
evidence and the reversal condition, which is that the dynamo export followed by
the quantiser ever runs clean.

**Found on the way**

`export_onnx.py` rewrites `meta.json` and silently dropped the `quantisation`
block that `quantize.py` writes. For the length of this tick the file described
one graph while carrying accuracy numbers measured on a different one. It was
noticed only because the file went from 4177 bytes to 3155. The export now
announces the drop and says to re-run the quantiser.

**Proof**

```
$ --exporter dynamo   -> all gates passed, 0.3 MB + 20.3 MB sidecar
$ quantize on it      -> InferenceError, (256) vs (44)
$ --exporter torchscript (restored default)
  gate 1, copy against original:     0.000e+00
  gate 2, graph against original:    6.914e-06
  gate 3, attention rows sum to one: 2.384e-07
$ quantize, full held out set
  fp32  intent 74.58%  tags 97.28%  both 69.97%
  int8  intent 74.53%  tags 97.28%  both 69.86%   3.86x smaller
$ npm run check:tokenizer -> 230 sentences, 2104 tokens, identical
$ git log -> fc4c011 Keep the TorchScript exporter, pin the toolchain, say why
```

**Next tick:** the hiring engineer findings if they have landed, otherwise T4,
the Vite scaffold and the first live inference in a browser, which needs the
browser back.

---

## 2026-09-21 06:30 | tick 17 | tokenlab | An interval on the number this project leads with

**Task:** ladder item 2 and 3 together, HE-F1. The README states a rule, "the
ratio is never quoted without it", and then broke it on the one figure it calls
the most important.

**What was wrong**

`measure.ts` argues at length that the raw token ratio measures two things at
once and that tokens per byte is the number worth publishing. The README agrees:
the split matters more than the headline. That number was published as `+2.9%`,
`+155.7%`, `+220.3%` with no uncertainty anywhere, one column to the right of a
`95% interval` column that does not cover it.

Bootstrapped with the same paired resampling, the same seed and the same 10,000
draws, resampling each pair's four quantities together because a pair is the
observation:

```
o200k     +2.9%    -2.0 to  +7.6    includes zero
cl100k  +155.7%  +143.8 to +167.6
p50k    +220.3%  +205.6 to +235.2
r50k    +220.3%  +205.6 to +235.2
```

On forty pairs, `o200k`'s penalty on Greek cannot be told apart from no penalty
at all, and it was being printed to a tenth of a point against five points of
sampling uncertainty.

**The claim changes, and improves**

Not "o200k charges Greek 2.9 percent" but "whatever `o200k` charges Greek beyond
the alphabet, forty sentence pairs cannot see it". That is a cleaner result than
the one it replaces and it is the one the data supports. The README says it, the
page headline says it, both tables carry the interval and both say when it
crosses zero, and `check-claims` asserts all of it.

**Reproduced before believed**

The audit reported -2.0 to +7.6, +143.8 to +167.6 and +205.6 to +235.2. Running
the project's own sampler independently produced the same figures to the decimal
in all four rows. A finding this damaging to a headline gets checked before it
gets acted on, and it survived the check.

**Proof**

```
$ npm run measure
o200k     2.06   1.94 to 2.18   +2.9%  (-2% to 7.6%)  <- includes zero
cl100k    5.12   4.79 to 5.45   +155.7%  (143.8% to 167.6%)
$ measure twice, diff  -> still deterministic, byte identical
$ npm run build         -> 92 segmentation cases, 26 claims, tsc clean, 242ms
$ npm run check:loading -> 15 checks, all ok
$ bh, the page headline now reads: "o200k adds +2.9% on top, which forty
  sentence pairs cannot tell apart from nothing (-2.0 to +7.6, includes zero)"
$ git log -> 4968760 Put an interval on the figure this project leads with
```

**Where it stands**

102 findings, 46 closed, 56 open. Two high: HE-F2, the loading gate that nothing
runs automatically, and RC-F1, which still needs the push.

**Next tick:** HE-F2. It is the same shape as the regression it describes, and
it is the one gate that has already failed to fire once.

---

## 2026-09-21 07:00 | tick 18 | tokenlab | The fourth gate runs now

**Task:** ladder item 3, HE-F2. The audit put it better than I would have: the
three gates that run are good, which is what makes the fourth one worse, because
the project had correctly diagnosed the one defect class that actually reaches
readers and then left exactly that class on the honour system.

**What was wrong**

Commit 822df43 shipped an empty red error bar into the middle of the page on
every healthy load, and its own message named the remedy: run `npm run verify`
before committing. That remedy was a script the README never mentioned, CI never
invoked, and that failed from a clean clone with "Playwright not found", because
`playwright` was not in `devDependencies`. So the `healthy` section written
specifically to stop that regression recurring was reachable by nobody who
cloned the repository, and the same CSS change would have published the same bar
under a green build.

**What changed**

`playwright` 1.61.1 and `wait-on` 9.0.1 are pinned dev dependencies, so the gate
runs from the project itself with no environment variable.

CI gained a second job. It downloads the built `dist`, serves it with
`vite preview`, and runs the loading gate against it. Against the built page
rather than the dev server, because the built page is what a visitor gets.
`deploy` needs both jobs, so a page that looks broken while every number on it is
correct cannot publish. CI also runs on pull requests now, which was HE-F9: the
gates fire before `main` moves rather than after.

**Proof, from a genuinely clean clone**

The first attempt at this proof was wrong and worth recording. `git clone .`
clones committed HEAD, and the changes were still uncommitted, so the clone was
the old state and the test failed for the wrong reason. The second attempt
failed for another wrong reason: Node on Windows cannot resolve a Git Bash
`/tmp/...` path, so `createRequire` reported a missing module that was sitting
in `node_modules`. Twice the test said "broken" and twice the test was the
broken thing.

Committed first, then cloned, then resolved through the real Windows path:

```
$ git clone . <tmp>; cd <tmp>; npm ci
  playwright resolves from the clean clone: true
  wait-on resolves: true
$ npm run build
  92 segmentation cases round trip exactly, across 4 encodings
  26 claims in README.md check out against findings.json
  built in 251ms
$ npx vite preview --port 4174 & npx wait-on ...
$ TOKENLAB_URL=http://localhost:4174/ npm run check:loading
  15 checks, all ok
```

That is the CI job, rehearsed end to end on a clone that has never seen this
machine's tooling.

**Also closed**

HE-F3, `npm run capture` not running from a clean clone: same root, and the
README now says it needs `npx playwright install chromium` and ffmpeg.

**Where it stands**

102 findings, 49 closed, 53 open. One high: RC-F1, there is nowhere to click,
and it needs the push.

**Next tick:** HE-F7, the commit log citing `DECISIONS.md`, `DEVLOG.md` and a
finding ID scheme that live in the parent workspace and are not in the
repository anyone would clone. The best thing in the project points at documents
that are not there.

---

## 2026-09-21 07:30 | tick 19 | tokenlab | The log resolves, and verify runs itself

**Task:** ladder item 2, HE-F7. About half the commit messages in this history
cite audit identifiers, `DR-F2`, `RC-F4`, `HE-F1`, and none of them resolved to
anything a reader could open. The findings lived in the workspace around the
repository rather than in it. The audit's framing is the reason this outranked a
feature: `git log` is where a hiring engineer goes to decide whether someone
ships, this log is the strongest evidence in the project, and it was pointing at
evidence the reader is not given.

**What changed**

`scripts/gen-audits-doc.mjs` writes `projects/tokenlab/docs/AUDITS.md` from
`state/state.json`: all 102 findings across the seven perspectives that have
run, with severity, status and the tick that closed each. Generated rather than
written, so it cannot drift, and dated because it is a snapshot of something
still running.

```
$ git log --format=%B | grep -oE "(HS|ME|PA|DE|DR|RC|HE)-F[0-9]+" | sort -u
  3 identifiers cited
$ each one checked against docs/AUDITS.md
  all cited identifiers resolve
```

The README gains a short section naming the four gates and what each one
stopped, and the three findings worth admitting to in public: a shared
`TextDecoder` in a dependency corrupting polytonic Greek, a headline figure
published without the interval that would have shown it straddling zero, and an
empty red error bar that shipped to every visitor. Rule 2 of the brief is
publish a failure, and that section is where this project does it.

**Deliberately not done:** `a8631e1`, the batch commit that says what was typed
rather than what was wrong, stays. Rewriting it would be tidying the evidence
after the fact, and the audit that named it is in the table.

**The tick embarrassed itself, usefully**

`npm run check:loading` failed on the way to committing, and the reason was
`net::ERR_CONNECTION_REFUSED at http://localhost:5173/`. The command the README
names as the one to run before committing assumed a dev server was already up on
the default port. It failed on the commit where the subject was that nothing
runs that gate, and it passed a minute later only because I remembered which
port mine was on.

That is the same class of problem as the finding being fixed, so it was fixed in
the same tick: `npm run verify` now builds, picks a free port, serves `dist`,
waits for it to answer, runs the gate against it and takes the server down. Same
sequence as the CI job, against the built output.

Two Windows specifics, both commented where they live: Node 20 refuses to spawn
a `.cmd` without a shell and `npm` and `npx` are `.cmd` files, and through a
shell `kill()` reaches the shell rather than vite, so the tree goes down by pid.

**Proof**

```
$ npm run verify
  92 segmentation cases round trip exactly, across 4 encodings
  26 claims in README.md check out against findings.json
  built in 237ms
  serving dist on http://localhost:<free>/
  15 checks, all ok
  exit=0
$ git log -> 1502de1 Make the commit log resolve, then verify runs itself
```

**Where it stands**

102 findings, 50 closed, 52 open. One high, RC-F1, and it needs the push.

**Next tick:** `watch-it-think` T4. The browser is free, `tokenlab` has no high
findings the loop can close, and that project has an exported model, a gated
tokenizer and no page at all.

---

## 2026-09-21 08:00 | tick 20 | watch-it-think | It runs in a browser

**Audit tick.** 20 % 4 == 0. A subagent went out against `tokenlab` on the
maintainer in six months perspective, the eighth of nine, and was told not to
use the browser so this task could have it. `tokenlab` is frozen while it reads.

**What changed**

`watch-it-think` has a page. Vite, `onnxruntime-web`, the int8 graph, and the
TypeScript tokenizer that tick 12 proved identical to the Python one. A model
the author trained from random init runs in the visitor's browser: 5.28 MB over
the wire, 168 ms to load, 2.5 ms a sentence on CPU.

It shows the working rather than the answer, which is the whole reason the
project exists. The intent is one of 44 and the six most likely are drawn as
bars, so a model that is unsure looks unsure instead of looking decisive. The
slot tagger's output is drawn over the words: `turn off the kitchen lights`
comes back with `kitchen` tagged `B-ROOM`. Greek and English both.

**Two defects found by looking at what shipped**

Given a directory, `onnxruntime` picks a runtime filename itself and asks for
the jsep build, the WebGPU one this page has no use for. It falls back and
works, so the page looks correct while every single load takes a 404 on the way.
Both files are named explicitly now.

And `dist` was 52 MB. A hand copy of the runtime in `public/` did not stop the
bundler emitting its own copy of the same 14 MB file, and the 20 MB fp32 graph
was sitting in `public/` being copied into `dist` although the page only ever
loads the int8 one. The runtime is imported with `?url` so exactly one hashed
copy is emitted, and the fp32 graph moved to `build-model/`, outside the served
tree. `dist` is 19 MB, of which 14 is the runtime and 3.7 gzipped.

Neither was visible in the source. Both were visible in the output.

**Proof**

```
$ npm run build -> 230 sentences identical to bslm/tokenizer.py, built in 228ms
$ dist 19M, one wasm, no fp32 graph
$ vite preview on 4180, then the browser against the built page
  {"status":"6 tokens, 6 layers, 4 heads, 3.4 ms",
   "intent":"light.control","conf":"95.8%"}
  no failed requests
$ git log -> 6f7d9a1 The page, and the first inference in a browser
```

Verified against the built output rather than the dev server, which is the
lesson `tokenlab` paid for twice.

**Where it stands**

`watch-it-think` has six tasks left, all of them the visual work: the attention
field, the intent race as the layers resolve, the BIO tags lifting out, the
bilingual pass, the footer numbers and the README.

**Next tick:** the maintainer findings if they have landed, otherwise T5, the
attention field, which is the picture the whole project is named after.

---

## 2026-09-21 08:30 | tick 21 | tokenlab | The gates were all pointed at one file

**Task:** ladder item 2, MA-F2 and MA-F4. One root, and the maintainer audit
named it exactly: every gate here read `src/generated/findings.json` and trusted
it, and nothing read the page at all.

**What that meant**

The inputs hash added in tick 15 catches an edited corpus. Nothing caught an
edited `tools/measure.ts`. Break the bootstrap, change the seed, miscount the
bytes, and the committed file does not move, so all 26 claims go on passing
against numbers the code no longer produces. The measurement was the one thing
in the project nothing measured.

And the page carried three numbers typed into its own source, under a footer
saying every number on it comes from `npm run measure`: the corpus size in the
headline correction, the bootstrap count in the method line, and the encoding
count in the meta description. `check-claims` reads `README.md` and nothing
else, so no gate had ever looked at `src/main.ts` or `index.html`.

**What changed**

`tools/check-measurement.ts`. It re-runs the real script into a scratch copy of
the tree and compares byte for byte, which is exact because the measurement is
deterministic. And it reads the page for numbers that the measurement already
carries.

The first two page numbers now come from `findings.json`, which gained a
`method` block holding the bootstrap count and the seed. The third is gone from
the static markup, because a `<meta>` description cannot be generated at
runtime without hiding it from the readers who need it most.

**It found a fourth on its first run**

```
FAIL  src/main.ts spells out a number the measurement already carries
      found: "forty pairs"
```

In a comment. Comments are checked on purpose: one that says "forty pairs" goes
stale exactly like a sentence that says it, and it is read by the person most
likely to act on it.

**Proof, both controls**

```
$ control: change SEED without re-measuring
  FAIL  src/generated/findings.json is not what tools/measure.ts produces.
        committed: "inputsHash": "46be3d04c521dded"
        produced:  "inputsHash": "f62d5d11aa75447c"
        committed: "seed": 20260920
        produced:  "seed": 20260921

$ control: type "forty sentence pairs" into src/main.ts
  FAIL  src/main.ts spells out a number the measurement already carries

$ npm run verify
  92 segmentation cases round trip exactly, across 4 encodings
  26 claims in README.md check out against findings.json
  findings.json reproduces from tools/measure.ts, and the page spells out none of its numbers
  built in 240ms
  loading behaviour holds under a failed fetch and under a slow one
  exit=0
$ git log -> fc30b75 Check the numbers against the code, and check the page too
```

The first attempt at the second control was vacuous: the `sed` pattern was from
the other project and matched nothing, so the gate "passed" because there was
nothing to catch. Caught it by counting the match before running the gate.

**Where it stands**

117 findings, 52 closed, 65 open. Three high: MA-F1 the four encoding
registries, MA-F3 nothing asserts a fractured chip is ever drawn, and RC-F1 the
push.

**Next tick:** MA-F3. The red chips are the entire visual argument of the
project and no test would notice if they stopped appearing.

---

## 2026-09-21 09:00 | tick 22 | tokenlab | Four lists become one, and a comment becomes a gate

**Task:** ladder item 3, MA-F1. The maintainer audit traced adding a fifth
encoding and found eleven places to touch, four of them copies of the same list.
It proved the point by adding `o200k_harmony` to two of the four: the build
stayed green and the page would have measured something other than what it drew.

**What changed**

`src/lib/encodings.ts` is the list. The id union, the labels, the model strings,
the hues, all in one array, and the bare id array in `inputs-hash`, the third
list in `measure.ts` and the `USED_BY` map in `check-claims` all derive from it.

The loaders map still repeats the ids, because a dynamic import has to be a
literal for the bundler to split the chunk. It is typed `Record<EncodingId, ...>`
against the registry, which makes it the copy the compiler keeps honest rather
than the one it ignores.

```
$ control: add a fifth entry to the registry and nothing else
  src/lib/tokenizers.ts(55,7): error TS2741: Property 'o200k_harmony' is
  missing in type ... but required in type 'Record<"o200k_base" |
  "cl100k_base" | "p50k_base" | "r50k_base" | "o200k_harmony", ...>'
```

Two more hardcodings went with it. The p50k against r50k comparison is now a
search for any group of encodings that tokenize the corpus identically, so a
fifth that matched one would be named and a corpus that separated those two
would stop the page saying they agree. And `headline.vocabularyCost` is built
from the registry.

**The comment that was wrong**

The hue field carried a note: every encoding is at least 100 degrees from the
alarm hue of 32, because an encoding tinted near the alarm hides the fractured
chips. The design audit set that rule in tick 1 and I wrote the note and then
picked hues that broke it.

```
FAIL  p50k_base is hue 315, 77 degrees from the alarm hue 32
FAIL  r50k_base is hue 85, 53 degrees from the alarm hue 32
```

`r50k` is the encoding with the most red on screen, so the worst violation was
on the encoding where the finding matters most, and it had been shipping since
tick 1 behind a comment saying it could not happen. The rule is in
`check:measurement` now. The four hues run as a ramp inside the band the alarm
leaves free, 145, 195, 245, 290, newest green through to oldest violet.

Every accent on the page changed, so it was looked at: `r50k` on the technical
sentence, 21 fractured chips reading clearly against a violet accent instead of
competing with an olive one.

**Proof**

```
$ npm run verify
  92 segmentation cases round trip exactly, across 4 encodings
  27 claims in README.md check out against findings.json
  findings.json reproduces from tools/measure.ts, the page spells out none of
    its numbers, and 4 encodings each have a hue clear of the alarm
  built in 244ms
  loading behaviour holds under a failed fetch and under a slow one
$ git log -> 3c708a7 One encoding registry, and a rule about hues that is enforced
```

**Where it stands**

117 findings, 55 closed, 62 open. Two high: MA-F3, nothing asserts a fractured
chip is ever drawn, and RC-F1, the push.

**Next tick:** MA-F3, properly this time. Today's hue fix protects the chips
from being hidden by a colour; nothing yet protects them from not being there.

---

## 2026-09-21 09:30 | tick 23 | tokenlab | The red chips are asserted now

**Task:** ladder item 3, MA-F3, the last high finding the loop can close by
itself.

**What the audit did**

It changed `splitIntoBytes: pending.length > 1` to `splitIntoBytes: false` and
ran the build. Every red chip vanished, the cost badges with them, the note
under them stayed hidden forever, and all four gates were green: 92 segmentation
cases round tripped, 26 claims checked out, tsc clean. The text still came back
exactly as typed and the ids still added up. The entire argument of the project
had been deleted and nothing in it noticed.

**Two assertions, and they fail independently**

`check:segments` gains twelve exact fracture counts, three sentences across four
encodings. Exact rather than "at least one", because the counts are the finding:
`o200k` fractures none of the modern Greek line, `cl100k` fractures two pieces
of the same line, the two oldest fracture nineteen.

`check:loading` gains the DOM half. A correct segmentation proves nothing about
what is on screen: the class could stop being applied, the badge could stop
rendering, a CSS rule could hide them. It types a polytonic line on `cl100k` and
asserts the chips are present, have a non zero box, carry a badge of at least
two and that the note is showing, then switches to `o200k` on modern Greek and
asserts there are none.

**Both controls**

```
$ splitIntoBytes: false
  FAIL  o200k_base  polytonic Greek   0 pieces marked as split into bytes, expected 3
  FAIL  cl100k_base modern Greek      0 pieces marked as split into bytes, expected 2
  (check:loading not reached)

$ classList.add('tok--fractured') removed, segmentation untouched
  92 segmentation cases round trip exactly ... 12 fracture counts are what they should be
  FAIL  red chips are on the page for text that fractures
        found 0
```

Each control fails exactly one gate, which is the point of having two.

**Something the gate taught me**

Polytonic Greek fractures on all four encodings, `o200k` included: three pieces
of the Odyssey line, against zero pieces of the modern Greek line. The
vocabulary that closed the gap on the Greek people write did not close it on the
Greek they read at school. That is now written down in `check-segments.ts` where
the counts are.

**Proof**

```
$ npm run verify
  92 segmentation cases round trip exactly across 4 encodings, and 12 fracture
    counts are what they should be
  27 claims in README.md check out against findings.json
  findings.json reproduces from tools/measure.ts, the page spells out none of
    its numbers, and 4 encodings each have a hue clear of the alarm
  built in 241ms
  ok  red chips are on the page for text that fractures
  ok  a red chip is actually visible, not just present
  ok  the chip carries a cost badge of at least two
  ok  the note under them is showing
  ok  no red chips on modern Greek with the newest vocabulary
  loading behaviour holds under a failed fetch and under a slow one
$ git log -> 2d754f9 Assert that the red chips exist, in the data and on the page
```

**Where it stands**

117 findings, 57 closed, 60 open. One high left in the whole workspace: RC-F1,
there is nowhere to click, and it needs the push. Everything the loop can close
by itself at high severity is closed.

**Next tick:** the mediums, or `watch-it-think` T5. The attention field is the
picture that project is named after and it does not exist yet, while `tokenlab`
is down to polish.

---

## 2026-09-21 10:00 | tick 24 | watch-it-think | The attention field

**Audit tick.** 24 % 4 == 0. The ninth and last unused perspective went out
against `tokenlab`: supply chain, run now because the owner is about to make
that repository public, which is exactly when dependencies, licences and
anything committed by accident stop being hypothetical. `tokenlab` is frozen and
the browser was withheld from the auditor so this task could have it.

Also queued: `watch-it-think` T13, its first audit. Nine perspectives exist and
zero have looked at it, while it now carries an ONNX export that re-declares an
architecture and a tokenizer port the model depends on being exact.

**What changed**

Six layers by four heads is twenty four fields for one sentence, and the
interesting thing is almost never one of them alone, it is how they differ. All
twenty four are drawn as real thumbnails rather than icons, one is large, and
picking the head that has learned something is the activity.

On "turn off the kitchen lights":

```
layer 1, head 1   concentration 43%   strongest link 74%    diffuse
layer 6, head 2   concentration 69%   strongest link 95%    readable
```

Layer 6 head 2 has structure a person can read. Every token attends back to the
sentence vector, and the sentence vector attends to `kitchen`, which is the room
slot that decides `light.control`. That is the model's working, on screen,
without anyone having to take it on trust.

**Three decisions worth the words**

Canvas, because sixty four tokens is 98,304 cells across the grid: nothing for a
canvas and a great deal of layout for a browser.

Scaling to the field maximum rather than the row sum. Every row already sums to
one, so a field where one token takes everything and a field where attention is
spread evenly would otherwise look identical, and that difference is the one
worth seeing.

One hue ramped from the page background, because a single quantity drawn in a
rainbow reads as several.

**And one that is about use rather than drawing**

The selected layer and head survive a new sentence. Finding the head that
watches the verb and then running three sentences through it is what this page
is for, and resetting to layer one on every keystroke would make that
impossible.

**Proof**

```
$ npm run build -> 230 sentences identical to bslm/tokenizer.py, built in 227ms
$ dist 19M, unchanged
$ bh: no console errors, 24 thumbnails, hover on a token focuses its row and
  column and marks it on the axis
$ bh: selecting layer 6 head 2 -> "layer 6 of 6, head 2 of 4 ...
  Concentration 69 percent, strongest single link 95 percent."
$ git log -> e88cfc9 The attention field, which is what the project is named after
```

**Where it stands**

`watch-it-think` has five tasks left: the intent race as the layers resolve, the
BIO tags lifting out, the bilingual pass, the footer numbers, the README, and
its first audit.

**Next tick:** the supply chain findings if they have landed, otherwise T6.

---

## 2026-09-21 10:30 | tick 25 | tokenlab | The fonts are under two different licences

**Task:** ladder item 2, SC-F1. The README said both fonts were SIL Open Font
License. The file shipped beside Roboto Mono was bare Apache 2.0 with the
template still reading `Copyright [yyyy] [name of copyright owner]`: no font
named, no holder, no year. Both statements could not be true, and neither
licence was satisfied either way, because no OFL text was bundled and no
attribution notice existed anywhere in the repository.

**Checked at the source rather than from memory**

Google Fonts distributes Roboto Mono under Apache 2.0, and its binary says
`Copyright 2015 The Roboto Mono Project Authors`. Manrope is OFL 1.1, with a
real copyright line and no Reserved Font Name declared, so the subset may keep
the name. The README had restated a third party licence from memory and been
wrong about half of it.

**Three things were wrong**

The prose. The README states the two licences separately now, because the
difference is not cosmetic, and `public/fonts/README.md` names the holder for
each with a link to the full text.

The provenance. Nothing recorded that these are subsets or how they were made.
`tools/subset-fonts.sh` does, with the exact unicode ranges, so the subset is
reproducible rather than something that happened once on this machine.

The binaries. `pyftsubset` drops the name table unless told to keep it, so both
subsets had been shipping with their own copyright and licence records stripped
out. The only statement of licence anywhere was the text file that was wrong.
They carry their attribution again:

```
robotomono-var.woff2 | Copyright 2015 The Roboto Mono Project Authors
   licence: Licensed under the Apache License, Version 2.0
manrope-var.woff2    | Copyright 2019 The Manrope Project Authors
   licence: This Font Software is licensed under the SIL Open Font License
```

**The gate**

`check:licences` reads name IDs 0 and 13 out of each binary and requires the
licence file, the fonts README and the project README all to agree with them.
The binary is the authority; the prose is what gets checked against it. A font
served with no expectation written for it also fails, because a font nobody
wrote an expectation for is a font nobody checked the licence of.

```
$ control: restore the original "both SIL Open Font License" claim
  FAIL  the project README does not state Apache License 2.0
$ control: re-subset without --name-IDs, as before
  FAIL  robotomono-var.woff2 says its licence is not what this repository expects
$ npm run verify
  92 segmentation cases, 12 fracture counts, 27 claims, findings reproduces,
  2 fonts each naming its own licence and copyright, built in 338ms,
  loading behaviour holds
$ git log -> 42bf3b7 The fonts are under two different licences, and now the
             repository says so
```

**Where it stands**

127 findings, 59 closed, 68 open. Two high: SC-F2, the workflow handing
deployment credentials to jobs that run pull request code, and RC-F1, the push.
SC-F2 is the other thing that should not be published as it stands.

**Next tick:** SC-F2. It is the last thing between this repository and being
safe to make public.

---

## 2026-09-21 11:00 | tick 26 | tokenlab | Only the job that deploys can deploy

**Task:** ladder item 3, SC-F2, the last publication blocker the loop can close.

**What was wrong**

The `permissions` block sat at workflow level, so all three jobs held
`pages: write` and `id-token: write`, the pair that creates a Pages deployment.
Only `deploy` consumes them. What `build` and `loading` did with them instead
was run `npm ci`, which executes dependency postinstall hooks, and
`playwright install --with-deps`, which installs system packages as root.
Neither checkout passed `persist-credentials: false`, so the job token sat in
`.git/config` where any of that code could read it.

The header of that same file promises nothing deploys unless the gates pass.
That promise rested on one `if:` and was contradicted by the grant four lines
above it.

**What changed**

Workflow level is `contents: read`. The deploy pair is granted on the `deploy`
job alone. Both checkouts drop their credentials. And all eight actions are
pinned to commit SHAs rather than mutable major tags, which was SC-F3: a tag is
a pointer somebody else controls, and the SHAs were resolved from the API for
the major versions already in use rather than silently upgrading.

**The gate**

`check:workflow`, because the alternative is trusting a comment. It asserts that
no job but `deploy` holds either deployment permission, that `deploy` holds
both, that every `uses:` is a forty character hex ref, and that any job doing a
checkout passes `persist-credentials: false`.

No YAML parser, deliberately. The file is short, the rules are structural, and
adding a dependency in order to check a dependency risk would be funny in the
wrong way.

```
$ control: restore the workflow level grant
  FAIL  "pages: write" is granted at workflow level, so every job gets it
  FAIL  "id-token: write" is granted at workflow level, so every job gets it
$ control: unpin one action
  FAIL  actions/setup-node@v4 is not pinned to a commit
$ control: remove one persist-credentials line
  FAIL  job "build" checks out without persist-credentials: false

$ npm run verify
  92 segmentation cases, 12 fracture counts
  27 claims in README.md check out against findings.json
  findings.json reproduces from tools/measure.ts
  2 fonts, each naming its own licence and copyright
  the workflow grants deployment permissions to deploy alone, and all 8
    actions are pinned to commits
  built in 253ms
  loading behaviour holds under a failed fetch and under a slow one
$ git log -> d7f4dfa Only the job that deploys can deploy
```

**Where it stands**

127 findings, 61 closed, 66 open, and **no high severity findings remain that
the loop can close**. The only one left is RC-F1: there is nowhere to click, and
that needs the push. Six gates now, all of them in CI.

`tokenlab` meets every condition in section 7 again, including the one that
lapsed when the recruiter audit landed.

**Next tick:** `watch-it-think` T6, the intent race, or its first audit. That
project has a page and a model and nobody outside has read a line of it.

---

## 2026-09-21 11:30 | tick 27 | tokenlab | The opening stops waiting for the vocabulary

**Task:** ladder item 5, T9. Items 1 to 4 clear: build green, no unreproducible
claim, the only high finding left needs the push, nothing in progress.

**What was wrong**

The page opens on `cl100k` and heals to `o200k`, which is the whole argument made
in two seconds, and both need a vocabulary: 439 kB and 1,025 kB gzipped. Until
the first one landed the stage was empty, so the argument did not start until the
download finished.

**What changed**

Every sentence the page can open with is known at build time, and so is every
encoding it can open in. `npm run prerender` computes those 160 openings, 4,918
segments, **11 kB gzipped**. The vocabulary still downloads the whole time and is
needed the moment the visitor types something of their own.

```
$ with the vocabulary artificially delayed four seconds, same URL
  before  first chip at 4,533 ms
  after   first chip at   126 ms
  76 chips and 6 red ones in both cases
```

The "before" number was measured, not assumed: `git checkout src/main.ts`, run
the same probe, restore.

**Why it is safe**

The precompute calls the same `segment()` over the same `Encoder` shape the page
calls. That sharing is the whole reason this is allowed: a precompute that drifts
from the runtime draws something the tokenizer never produced, which is a defect
this project has already shipped once, when a shared `TextDecoder` corrupted
polytonic Greek.

So `check:prerender` re-derives all 160 openings from the real encoders and fails
on a single differing character. It also fails if the page can reach an opening
the precompute does not cover, which would be an empty stage.

```
$ control: edit one word of one corpus pair, do not re-run prerender
  FAIL  0:en:cl100k_base segment 5 differs
        committed {"t":" ten","n":1}, produced {"t":" nine","n":1}
$ control: tamper with one segment
  FAIL  0:el:cl100k_base segment 2 differs
        committed {"t":"WRONG","n":1}, produced {"t":" ε","n":1}
$ npm run verify -> seven gates, all pass, built in 259ms
$ git log -> 7ab305c The opening does not wait for a megabyte of vocabulary
```

**Also this tick, not as the task**

D7 records what the research sweep means for the queue. The globally top ranked
finding, tokenizer inequality and what it does to retrieval, is not a new project
but `tokenlab`'s second half, and it goes into that queue rather than the project
list. The two rankings are in `research/`.

**Where it stands**

`tokenlab` has one task left, T7, the polish pass. Seven gates. One open high
finding in the workspace and it needs the push.

**Next tick:** T7, or promote `watch-it-think`, which has six tasks and no audit.

---

## 2026-09-21 12:00 | tick 28 | tokenlab | The polish pass, and the last task

**Audit tick.** 28 % 4 == 0. `tokenlab` has used all nine perspectives, and
section 6 forbids repeating one, so the rule itself sent the audit to
`watch-it-think`, which has never had one. Deep reviewer, on the surface that
carries the most risk: an ONNX export that re-declares an architecture, a
tokenizer port the model depends on being exact, and attention offset
arithmetic. The browser was withheld from it so this task could have it.

**Task:** ladder item 5, T7, the last open task on `tokenlab`.

**Worked against the audit, not against taste**

Six findings, in the order the design eye gave them.

Spacing and radii were collections rather than systems: nineteen distinct
padding, gap and margin values and seven radii, including 9px against 10px on
two adjacent controls. A 2px difference is below the threshold at which a viewer
reads it as a decision, so it reads as drift, and drift across every container
is what a dark template looks like from six feet away. One scale now, six steps
at roughly 1.6, three radii, everything snapped.

The small type was ten sizes crammed between 10.9px and 16.8px, which is the
signature of sizing each component by eye. Four steps.

The right rail was three identical cards. That is the most recognisable
dashboard shape there is and it flattened the card carrying the argument to the
rank of a dropdown. Three ranks, three treatments, one fewer rectangle.

Motion was seven durations and two near identical easings, so a single encoding
switch ran four unrelated clocks and read as four things happening rather than
one thing changing. Two durations, one easing.

**Two regressions from this very pass, caught by looking**

The larger encoding label stranded `r50k` on a row of its own, and a 26vh token
box left a visibly empty area under a short sentence. Fixed in the same tick: the
four encodings are a grid that stays even at every width, and the box is 17vh.

That is the second time in this project that a change made for a good reason
introduced a visible defect, and both times the only thing that caught it was
opening the page.

**Also, while in the area**

HS-F9. The findings table scrolls inside its wrapper on a phone, and that wrapper
was not focusable, so a keyboard visitor could not reach the half that is off
screen. It is a labelled region with a focus ring now. Checked at 360, 414 and
768: `scrollWidth` equals `clientWidth` at all three, so nothing overflows the
page itself.

**Proof**

```
$ npm run verify -> seven gates, all pass, built in 250ms
$ 360px: scrollWidth 360 vs 360, no page overflow
$ git log -> 4f46dbb The polish pass, against the design audit rather than against taste
```

**Where it stands**

**`tokenlab` has no open tasks.** Seven gates, 127 findings with 73 closed, and
one open high finding in the whole workspace which is the push. By section 7 it
is visible and by the ladder it is done.

**Next tick:** ladder item 6 fires for the first time. `tokenlab` gets marked
done, `watch-it-think` is promoted, and its audit findings will be waiting.

---

## 2026-09-21 12:30 | tick 29 | watch-it-think | The export could not be run

**Task:** ladder item 1, a broken build. WDR-F1, from this project's first audit.

**What was wrong, and it was mine twice**

`tools/export_onnx.py` did not parse. A heredoc patch at tick 20 collapsed an
escaped newline into a real one and left an unterminated string inside an
`add_argument` call.

Then I ran it, in that same tick, and piped the output through a grep for the
lines I expected to see. The traceback went to a pattern that did not match, the
exit code was never checked, and the tick reported success. The export in this
repository could not be run for eight ticks and nothing said so.

A command whose output you filter is a command whose failure you have agreed not
to see. That is the more useful half of this finding.

**The artifacts were never wrong**

```
$ md5 of the committed router.int8.onnx   ef4427e02d28102363fbd7ec4db5a120
$ export from the fixed file, then quantise, both unfiltered, both exit 0
  gate 1, copy against original:     0.000e+00
  gate 2, graph against original:    6.914e-06
  gate 3, attention rows sum to one: 2.384e-07
  fp32  intent 74.58%   int8  intent 74.53%   n=10578
$ md5 of the rebuilt router.int8.onnx     ef4427e02d28102363fbd7ec4db5a120
```

Byte identical. The audit's verdict was exactly right in both halves: every
number this repository publishes reproduces, and the one file that produces them
could not be run.

**The gate**

`check:tools` probes every python tool with `--help`, not with an import.
`--help` builds the whole argument parser, which is where the defect lived and
where an import notices nothing at all.

Missing dependencies are skipped and named, because not everyone cloning this
has torch, and a syntax error is never skipped. That is the line between not
having installed the pipeline and the pipeline being broken.

```
$ npm run check:tools                     (system python)
  ok      dump_python_tokenizer.py
  skip    export_onnx.py, needs torch. Set PYTHON to an interpreter that has it.
  ok      quantize.py
  exit 0
$ PYTHON=<the venv> npm run check:tools
  3 tools parse, 3 build their argument parser
$ control: reintroduce the exact heredoc defect
  FAIL  export_onnx.py does not parse
        SyntaxError: unterminated string literal (detected at line 169)
$ git log -> 9bc2bb4 Fix the export, and check that a tool can start
```

**One more thing this tick got wrong**

The commit failed the first time because the message contained double quotes
inside a double quoted shell string, so git read half of it as a pathspec. Same
family as the defect being fixed: a quoting mistake inside a generated command.
Redone through a message file, which is what should have been used from the
start.

**Where it stands**

`watch-it-think`: 15 findings, 1 closed, two high left. WDR-F2, the attention
tensor that no gate compares, is the one that matters: reversing the layer order
or rolling the head axis passes everything.

**Next tick:** WDR-F2.

---

## 2026-09-21 13:00 | tick 30 | watch-it-think | The attention gets a witness

**Task:** WDR-F2. Ladder item 2 and item 3 at once: the page labels a field
"layer 6 of 6, head 2 of 4", which is a claim, and nothing in the repository
could verify it.

**The hole the audit found**

The export re-declares the architecture for exactly one reason, that
`bslm/model.py` computes attention and throws it away. That tensor was the one
output nothing compared against anything. Gates 1 and 2 compare the logits and
cannot do more, because the original has no attention to compare to. Gate 3
checks the rows sum to one, which is true of any softmax output including a
completely wrong one.

The audit proved it by mutating the copy: **reversing the layer order and
rolling the head axis both passed gate 1 at 0.000e+00 and gate 3 cleanly.** The
page would have drawn the wrong layer under a green build.

**Gate 4**

One attention field recomputed from the raw weights in numpy, following the
architecture by hand and importing nothing from the model. Every layer, every
head, four sentences in both languages.

```
gate 4, attention against an independent numpy witness: 8.067e-07 over 96 fields

$ control, layers reversed
  gate 1 0.000e+00   gate 3 pass   gate 4 9.787e-01   FAIL
$ control, head axis rolled by one
  gate 1 0.000e+00   gate 3 pass   gate 4 9.897e-01   FAIL
```

**The gate failed first, and the export was not the problem**

First run: 1.172e-03, above tolerance. Rather than assume the export was broken,
the divergence was printed per layer:

```
layer 0: 3.874e-07      layer 3: 2.100e-04
layer 1: 2.181e-04      layer 4: 1.788e-04
layer 2: 5.027e-05      layer 5: 2.379e-04
```

Zero at layer 0 and present from layer 1 is the signature of a feed forward
mismatch, because layer 0 attention is computed before any feed forward runs.
`nn.GELU()` defaults to the exact erf form and the witness used the tanh
approximation: max difference 4.1e-04, measured. The witness was wrong.

That is the second time this week a check disagreed with the code and the check
turned out to be the broken one, so the per layer breakdown is worth keeping.

**Artifacts unchanged**

`router.int8.onnx` has the same md5 as before, and the held out numbers are the
same 74.58 against 74.53 on 10,578 sentences. The gate added confidence, not
churn.

**Where it stands**

`watch-it-think`: 15 findings, 2 closed, one high left, WDR-F3, where the
tokenizer port disagrees with Python on five whitespace code points including
the byte order mark.

**Next tick:** WDR-F3.

---

## Tick 31, 2026-09-21 13:38

**Task:** WDR-F3. Ladder item 2 outranking item 3: the gate printed `identical
to bslm/tokenizer.py` and the port was not identical, so the repository was
asserting something it could not reproduce. That the finding was also high
severity decided nothing, item 2 comes first.

**What was wrong**

`normalize()` collapsed runs with `/\s+/g` and stripped with `.trim()`. Both
are JavaScript's whitespace class, and the corpus was built with Python's.
Enumerated from the two runtimes rather than recalled: Python matches 29 code
points, JavaScript 25, and the difference runs both ways. Python has U+001C to
U+001F and U+0085. JavaScript has U+FEFF, and `.trim()` strips it where
`str.strip()` leaves it.

The byte order mark is the one that will actually reach a visitor. It is the
likeliest invisible character in text that has been through a file, and on
`<BOM>turn off the kitchen lights` Python emits `<unk>` first and the port
emitted nothing at all, shifting every id after it. The model was trained on
the Python behaviour, so the page was quietly running a sentence the model had
never seen and calling the result a routing decision.

`WORD_RE` had to move with it. `[^\w\s]` carries the same asymmetry, and once a
BOM is no longer whitespace it has to fall through to the punctuation class,
which is what Python does. It is now built from the same `PY_SPACE` constant,
so the two cannot drift apart.

**The gate, which is the actual finding**

The port was wrong and the gate said it was right, over 230 sentences, because
not one of those sentences contained any of the five characters. Twelve added
to `EDGE_CASES`, regenerated against the bslm venv: 242 sentences, 2,149
tokens, identical. The header of `tokenizer.ts` claimed three defects all found
by the gate; it now names four and says plainly which one the gate missed and
why.

**The negative control, and the control that was itself vacuous**

Replacing `PY_SPACE` with JavaScript's 25 code points fails on exactly the
seven new whitespace cases and nothing else.

The first attempt at that control did not test what it said. It rewrote the
class to `[^${W}\s]`, but the backslash reached the file singly, so inside a
template literal it read as `s` and the class became `[^...s]`. It failed 228
of 242, which looks like a control biting hard, and it was measuring nothing of
the kind. The only reason it was caught is that 228 was too many for the change
being made, and the cases that failed were ordinary Greek sentences rather than
the whitespace ones. This is the second vacuous control in this workspace, and
both were found the same way: by reading which cases failed, never by the pass
or fail line.

**Bookkeeping, corrected in the same tick**

Counting open findings I filtered on severity and forgot `status`, read 34 open
high findings in `tokenlab`, and briefly believed the state file was lying.
It was not, the query was. Then, closing F1 to F3, I deleted them from
`open_findings` instead of marking them `fixed`, which is how `tokenlab`
records its 127. The ledger is append-only for the same reason this file is.
All three are back with `status: fixed` and their real fixed ticks; F3's title
was reconstructed from line 2257 above and is flagged as reconstructed.

**Where it stands**

`watch-it-think`: 15 findings, 3 fixed, 12 open, none high. `tokenlab`: one
high open, RC-F1, which is the push and not a code change.

**Next tick:** WDR-F4, `concentration()` computing a different quantity from
the one its docstring describes.

---

## Tick 32, 2026-09-21 14:18

**Task:** an audit tick. `32 % 4 == 0`, so section 6 ran before the ladder.
Target `watch-it-think`, the project changed last tick. Perspective
**measurement**, which it had never had; `deep-reviewer` was its only previous
one. Browser withheld, and the agent worked without it. Findings folded in and
nothing else fixed, per section 6.

`audits/watch-it-think-2026-09-21-measurement.md`, 15 findings, 4 high, 8
medium, 3 low.

**State corrected first.** T13, "first audit of this project", was still `todo`
while `audit_log` and `audits/watch-it-think-2026-09-21-deep-reviewer.md` both
record it completed at tick 28. The repository is the truth, so T13 is now
`done` with a note saying it was corrected here.

**What the audit found**

It re-ran the whole pipeline rather than reading it. `router.int8.onnx` rebuilt
to md5 `ef4427e02d28102363fbd7ec4db5a120`, identical to the committed file, and
every field of a fresh `meta.json` matched the shipped one except the two
timings. Every accuracy figure came back to the digit. So the numbers are
right, and all four high findings are about how they are described:

- **WM-F1.** Gate 4, the piece of work this project is proudest of, iterates
  `samples[:4]`. All four are English and they are 9, 6, 14 and 8 tokens. The
  comment above the loop says "a short and a long sentence in both languages"
  and the commit message says "four sentences in both languages". The Greek
  sentences are indices 14 to 19 and the witness has never reached them. Its
  longest field is 196 cells against the 4,096 the page's own worst case
  states. I wrote that comment and that commit message at tick 30.
- **WM-F2.** Not one published number can be reproduced by anyone holding only
  this clone. The checkpoint and the test set are arguments, and `meta.json`
  records no path, size, hash or commit for either. The auditor could reproduce
  everything only by finding the sibling `bslm` directory itself.
- **WM-F3.** Five latency numbers for the same quantity, from 0.71 ms to 3.4
  ms. The one shipped in `meta.json` was measured on native `onnxruntime`; the
  page runs `onnxruntime-web` in wasm at single thread, which the author's own
  browser figures put at three to five times that. Measured today the fp32
  figure is 0.80, not the 1.03 shipped, so the stated 1.45x speedup is really
  1.13x. And `router.ts:18` defends dropping the WebGPU build with "a
  millisecond of CPU at a 64 token context" when the measurement is 1.71 ms,
  on the faster of the two runtimes.
- **WM-F4.** Tick 8 wrote that both accuracy figures are in `meta.json` "so
  neither can be quoted without the other". `meta.json` contains neither the
  72.00 abstain figure, nor the 0.50 threshold, nor any mention of the parser.
  The page then quotes 74.53 alone, which is exactly what that sentence
  promised could not happen.

**The one I would have argued with, and lost**

WM-F5. Four parity numbers ship under one `tolerance: 0.0001`. Three
tolerances were actually applied, and `attentionRowSumDeviation` cannot fail:
it measures how far a softmax output sums from 1. `export_onnx.py:48` says so
in the source, in the words "which is true of any softmax output including a
completely wrong one". That candour is in a Python file nobody downloads, and
the JSON the browser fetches presents four small numbers as four equal pieces
of evidence, one of which is none. The auditor then did the work to show the
other three are real: over the 9,048 values gate 4 compares, the mean is 0.0981
and the tolerance is 0.10 percent of it.

**What it credits, having checked rather than assumed**

The whitespace claim from tick 31 holds: it enumerated both runtimes and found
Python's 29 code points against JavaScript's 25, and `PY_SPACE` is exactly
those 29. The parameter count 5,086,061 reconstructs by hand from the config.
And it split the held out accuracy by language, which no tool here does: 74.88
percent on 5,590 Greek rows against 74.14 on 4,988 English, so the pooled
figure is not hiding a gap between the two.

**Folded in**

15 findings recorded, 12 collapsed to 4 roots: the parity block describing its
own gates (F1, F5), provenance of inputs (F2, F7, F10, F11), latency (F3, F14),
and the safeguards the devlog claims exist (F4, F12). Seven tasks T14 to T20
written against the roots, not the ids. Project unfrozen.

**Next tick:** T14, WM-F1. The witness runs on Greek and on the longest
sentence, and the parity block states each gate's own sample and tolerance.
It is the smallest of the four and it repairs the claim I made myself.

**Correction, same tick.** The heading first read 14:03, which I typed from
the clock I took at the start of the tick rather than from the shell at the
moment of writing. Corrected to 14:18, which is what `date` said. Rule 1 of
section 1 exists because this went wrong twice at tick 3, and it just went
wrong a third time while I was writing an entry about mislabelled
measurements.

---

## Tick 33, 2026-09-21 14:36

**Task:** WM-F1, ladder item 2. The repository asserted the attention witness
ran on both languages and on a long sentence, and it ran on `samples[:4]`,
which is four English sentences of 6 to 14 tokens. T14, which also carried
WM-F5.

**What was actually covered**

Gate 4 is the piece of work this project is proudest of, and it was checking a
quarter of what it said. Its largest field was 196 cells against the 4,096
`attention.ts:15` names as the page's own worst case, and it had never seen a
Greek sentence, which is half the point of a bilingual router. I wrote both the
comment and the commit message at tick 30.

**The fix, and the reason it is not a bigger slice**

The audit's suggestion was `samples[:4] + samples[14:16]`. That would have made
the sentence true today and wrong again the next time the list is edited, which
is the same defect with a later expiry date. The sample is now derived: the
shortest and longest sentence of each language, chosen by token count from the
list itself, four sentences as before so the gate costs what it cost. Two long
sentences were added to the list, 63 and 62 tokens, which is as close to the 64
token context as a sentence gets without being truncated.

Measured, not estimated:

```
gate 4, attention against an independent numpy witness: max abs diff
        1.006e-06 over 96 fields, 188,280 values, mean value 0.0170
        sample: 4 sentences, ['el', 'en'], 4 to 63 tokens,
        up to 3,969 cells a field
```

9,048 values to 188,280. English only to both languages. 196 cells to 3,969.

**The gate on the gate**

The sample is now chosen by a function, and the claim made about it downstream
is that it covers both languages and the longest sentence. Nothing checked
that, which is how this ran for nine ticks under a comment that said otherwise.
The export now fails if it is not true. A comment cannot fail, so it was never
the mechanism, only the description of one.

**WM-F5, which came with it**

Four parity numbers shipped under one `tolerance: 0.0001` and one
`sentences: 20`, and both were wrong for two of the four: gate 3 is gated at
1e-5, and the witness saw four sentences, not twenty. Each entry now carries
its own value, tolerance, sample and note. `attentionRowSumDeviation` now says
in the JSON what `export_onnx.py` already said in Python, that it is a sanity
check on a softmax and a cube with its layers reversed passes it at exactly
zero. The witness entry carries its value scale, mean 0.0170, so a reader can
judge the tolerance without recomputing anything.

**Proof**

```
int8 md5 ef4427e02d28102363fbd7ec4db5a120, unchanged
fp32  intent 74.58%  tags 97.28%  both 69.97%  n=10578
int8  intent 74.53%  tags 97.28%  both 69.86%  n=10578
```

Identical to what was there. This tick moved what is measured and what is said
about it, and nothing the model does.

Negative controls, both bite:

```
witness = list(range(4))   FAIL: the witness sample is ['en'] and excludes
                           the longest sentence.            exit 2
head axis rolled by one    gate 4 at 9.628e-01              exit 2
clean                      gate 4 at 1.006e-06, all gates passed
```

Page seen in the browser at 1280x800, 13 requests all ok, no console errors,
"turn off the kitchen lights" to `light.control` at 95.8 percent. The parity
block is carried by the page but not displayed, so the reshape could only have
broken boot, and it did not.

**Noted, not fixed**

`msPerSentence` was 1.03 in the committed file, 1.07 on the first run today and
0.90 on the second, same command, same machine, one afternoon. The page's own
live figure on the screenshot is 2.9 ms. That is WM-F3 demonstrating itself
while I was working on something else, and it has its own task. Recorded so the
number now in `meta.json` is not read as a stable one.

**Next tick:** WM-F2, T15. Not one published number can be reproduced by
someone holding only this clone, because the checkpoint and the test set are
arguments and `meta.json` records no path, size or hash for either. It is the
root behind F7, F10 and F11 as well.

---

## Tick 34, 2026-09-21 15:07

**Task:** WM-F2, ladder item 2 and the root behind F7, F10 and F11. Not one
published number could be reproduced by anyone holding only this clone. T22.

**State corrected first.** Three duplicate task ids, T14, T15 and T19, created
at tick 32 when I appended seven tasks without checking the existing list. Tick
33 then wrote its notes onto the wrong T14, the tick 29 one about `check:tools`.
The tick 32 block is renumbered T21 to T27, T21 carries the tick 33 notes where
they belong, and the old T14 says what happened to its own, which are not
recoverable because `state/` is not versioned.

**What was missing**

`meta.json` held `measuredAt` and the results. The checkpoint and the test set
are command line arguments, and nothing anywhere recorded which ones were
passed. `tools/provenance.py` now makes each tool write down what it read: the
path relative to the repository holding it, the size, the sha256, and whether a
reader can obtain it, plus that repository's remote, commit and dirty flag.

The uncomfortable part is the last field, and it is the reason the tick was
worth spending:

```
checkpoints/bslm.pt         20,370,911  obtainable: false
data/test.jsonl              2,526,137  obtainable: false
bslm/model.py                    3,841  obtainable: true
checkpoints/tokenizer.json     161,501  obtainable: true
```

`bslm` has a public remote and the two files that carry every number in this
project are not committed to it. I checked with `git ls-files --error-unmatch`
rather than assuming. Naming the inputs without saying that would have been a
worse claim than the silence it replaced, so the record says it.

**Three things that came with the same root**

`quantize.py` described 10,578 as a property of the tool when it is a property
of one invocation, and printed `held out set: N` from the rows read while
recording `heldOutSentences` from the rows evaluated. They are equal today and
nothing in the arithmetic keeps them equal, so both are recorded, with the two
skip counts. The unseen intents note was printed after `meta.json` was written
and now runs before it.

The page's sentence "That set is the adversarial one" was a string literal and
would have printed after an evaluation on the training set. It is now derived
from the recorded run, and the recording is checked against
`bslm/benchmark.py:244`, `run_adversarial`, which is where the claim comes from.

`tokenizer.ts` pointed at `tools/check-tokenizer.py`, which does not exist, and
said the gate runs both tokenizers. It does not, it compares against a fixture.
The fixture now carries the bslm commit, the sha256 of `tokenizer.py` and the
date, and the gate prints them, because otherwise "identical to
bslm/tokenizer.py" keeps printing after that file changes.

**Proof**

```
test set: data/test.jsonl, 10578 rows read, split adversarial, sha256 e3828414e3dc
fp32  intent  74.58%   tags  97.28%   both  69.97%   n=10578
int8  intent  74.53%   tags  97.28%   both  69.86%   n=10578
int8 md5 ef4427e02d28102363fbd7ec4db5a120, unchanged
242 sentences, 2149 tokens, identical to the fixture dumped from bslm/tokenizer.py
  fixture: bslm 50aafae (dirty), bslm/tokenizer.py sha256 6ed2fbce0591, dumped 2026-09-21
4 tools parse, 4 build their argument parser
```

Negative controls, both bite:

```
fixture with source removed     FAIL, exit 1, printed before the pass line
quantise on a non adversarial   split recorded unknown, and the footer read
file                            from the live page drops the claim entirely
```

The second one is the one worth having. The footer read, in the browser,
with 400 rows of a renamed file: "Intent accuracy 73.75% on 400 held out
sentences, against 73.75% before quantisation." The adversarial sentence is
simply absent. After restoring the real run it is back.

**Caught by a gate I added five ticks ago**

`check:tools` failed on `quantize.py` mid tick: a heredoc collapsed `\n` into a
real newline inside an f-string, exactly the class of defect that gate exists
for, and it was named within seconds instead of eight ticks. Two further
replacements in the same heredoc had silently not matched for the same reason,
which the gate did not catch and reading the file did. Shell heredocs are now
the second most expensive tool in this workspace.

**Queued for the owner**

Whether to publish `bslm.pt` and `data/test.jsonl`, or commit the test set into
this repository. It is 2.5 MB, 10,578 rows, synthetic, and no personal content
in any of its five fields. Committing it alone would make the int8 accuracy
figures reproducible from the clone, because `router.int8.onnx` is already
committed. `D8` records why the provenance format is repo relative rather than
absolute, and what would reverse it.

**Next tick:** WM-F3, T23. Five latency numbers for the same quantity, none of
which reproduces, and the one in `meta.json` measured on a runtime the page
does not use. It moved again three times today while I was working on something
else: 0.84, 0.92, 0.64.

---

## Tick 35, 2026-09-21 15:34

**Task:** WM-F3, ladder item 2, with WM-F14 under the same root. T23. Five
numbers in this repository for the same quantity, 0.71, 0.75, 1.0, 2.5 and 3.4
milliseconds, none of them reproducible and not one stating a machine, a
runtime, a thread count or a spread.

**What the old number was**

A stopwatch around the whole evaluation loop, divided by the row count. That
mean swallowed tokenization, swallowed the session's cold first run, and
reported a single figure for sentences ranging from 2 to 64 tokens on a model
whose cost is quadratic in that. It was not a wrong measurement of the right
thing. It was a measurement of a different thing.

**What replaces it**

One timing per `session.run`, pinned to one thread. Not because one thread is
faster, it is not, but because a figure that depends on how many cores happened
to be idle cannot be reproduced by anyone, and because the page runs wasm at one
thread, so this is at least the comparable shape. Median, p05, p95, the first
run kept separately rather than averaged in, and the run count. Then a length
sweep, 200 reps each after a warmup, because one number for "a sentence" hides
the only variable that matters.

```
int8, onnxruntime 1.30.0 CPUExecutionProvider, 1 thread:
  median 0.724 ms over 10,578 runs, p05 0.475, p95 1.101, first run 0.98
  T=6 0.571    T=14 0.936    T=32 1.796    T=64 3.657
fp32 median 1.48, so int8 is 2.06x faster, not the 1.45x the two old means implied.
```

**The claim it falsified**

`router.ts` justified not shipping the WebGPU build with "five million
parameters at a 64 token context are a millisecond of CPU". Never measured, and
wrong by 3.7x on the faster of the two runtimes. The comment now carries the
four measured numbers and reaches the same conclusion honestly: wasm is several
times slower again, so 15 to 20 ms at a full context, and 20 ms on the worst
input a visitor can type is still instant against a second multi megabyte
download on every load. It is a weaker argument than the one that was there. It
is the one the measurement supports.

**The page**

It printed one unwarmed sample to a tenth of a millisecond, and `boot()` ends
by running one, so the first figure a visitor ever saw was the worst the page
will ever produce, at a precision implying stability. Watched in the browser
across four sentences: `3.0 ms, first run`, then `3.3 ms, median of 2`, `3.0 ms,
median of 3`, `2.6 ms, median of 5`. It also said "6 tokens" for a five word
sentence, counting the `<cls>` vector. It says positions.

**The gate that would have caught all of it**

`tools/check-meta.mjs`, wired into `npm run check`. Every gate in this project
checked the model and not one of them read the file the browser downloads,
which is why `meta.json` was the least careful file here while being the only
one a reader can open without running anything. It asserts one property: a
measurement arrives with its method. It also guards last tick's work, so the
parity block cannot collapse back to one shared tolerance.

```
meta.json: 4 parity entries each with their own tolerance, 4 inputs named and hashed
  int8 0.724 ms median over 10578 runs (p05 0.475, p95 1.101), 1 thread
  by length: T=6 0.571ms  T=14 0.936ms  T=32 1.796ms  T=64 3.657ms
```

Three negative controls, one per class of defect, all bite:

```
bare msPerSentence restored        FAIL  a bare mean with no spread and no method
parity collapsed to one tolerance  FAIL  on all four entries
witness languages back to ["en"]   FAIL  ran on ["en"], not both languages
```

**Where it stands**

`watch-it-think`: 19 open, one high left, WM-F4. `tokenlab`: one high, RC-F1,
which is the push. Every accuracy figure unchanged again: 74.58 and 74.53
intent, 97.28 tags, 69.97 and 69.86 exact match on 10,578 rows.

**Next tick:** WM-F4, T24. Tick 8 wrote that both accuracy figures are in
`meta.json` so neither can be quoted without the other, and `meta.json` contains
neither the 72.00 abstain figure nor the 0.50 threshold. The page then quotes
74.53 alone. It is the last high finding in the project and the last one that is
a claim the repository cannot reproduce.

---

## Tick 36, 2026-09-21 16:29

**Task:** an audit tick. `36 % 4 == 0`, so section 6 ran before the ladder.
Target `watch-it-think`, changed last tick. Perspective **hostile stranger**,
which it had never had, and it took the browser because nothing else held it.
Findings folded in, nothing else fixed, per section 6.

`audits/watch-it-think-2026-09-21-hostile-stranger.md`, 16 findings, 3 high, 9
medium, 4 low.

**The one that matters**

A paste of ordinary text with the spaces taken out freezes the tab. Measured,
not suspected: 8,000 characters 1,464 ms, 16,000 characters 5,936 ms, 32,000
characters **21,574 ms**, and a screenshot request issued during that one timed
out at 15,000 ms because the renderer could not answer at all. The curve is
clean and quadratic, so 64 KB is about 85 seconds.

Size is not the cause and the auditor proved it rather than assuming: 1 MB of
ordinary spaced text, 125,000 distinct words, went through in 483 ms. It is the
absence of spaces, because `encodeWord` rescans every adjacent pair on every
merge. Two things make it worse than the arithmetic. `encode` breaks its inner
loop at 64 tokens and never its outer one, so every word past the cap is
tokenised in full and thrown away. And there is no thinking state anywhere, so
for the whole twenty one seconds the page keeps the previous sentence's answer
at 95.8 percent, its tag row and its attention grid, looking finished.

**The one I did to myself**

WH-F7. `tokenizer.ts` spends twenty lines explaining that a leading byte order
mark is the likeliest invisible character in pasted text, that Python turns it
into a token, and that `PY_SPACE` was built to match. All true, and
`check:tokenizer` proves it on 242 sentences. Then `main.ts:225` calls
`String.prototype.trim`, which strips U+FEFF before the tokenizer ever sees it.
Measured on the page: `"\ufeffhello"` gives 2 positions, byte for byte identical
to `"hello"`, where Python gives 3.

Tick 31 fixed the library and the page undoes it. The gate is not wrong and it
never looked at the caller, which is the same shape as the defect it was built
to catch: a gate is a statement about its inputs.

**The rest of the highs**

`boot()` ends with `el.input.value = SAMPLES[0]` unconditionally. With the
download throttled the auditor typed a sentence, waited out the 61 seconds, and
watched the box be overwritten and a different sentence answered. And one long
word tears the layout open: a pasted sha256 gives `scrollWidth` 631 inside a 390
pixel phone, 285,214 on desktop.

**What it could not break, which is worth as much**

No XSS: `<img src=x onerror=...>` and `<svg onload>` come apart into one chip per
character, because the word regex cannot put a `<` and a `>` into the same
string, so no element was created and no global set. No racing predictions, over
thirty input events at 4 ms, 120 at 25 ms, and twenty alternations between a
long sentence and empty. Right to left text survives intact, including one
sentence mixing Latin, Greek, Arabic and Hebrew, and an injected U+202E does not
flip anything. The token highlight is honest at the truncation cap. Not one
uncaught exception across the whole audit.

**Folded in**

16 findings recorded as WH-F1 to WH-F16, collapsed to 8 roots. Tasks T28 to T35
written against the roots. Project unfrozen. `watch-it-think` now has 35 open
findings and four highs, which is the cost of an audit that actually looked.

**Next tick:** WM-F4, ladder item 2, which outranks the three new highs because
they are item 3. It is the last claim in this project that the repository cannot
reproduce: the devlog says both accuracy figures are in `meta.json` so neither
can be quoted alone, `meta.json` has neither the 72.00 abstain figure nor the
0.50 threshold, and the page quotes 74.53 by itself. Then WH-F1 and WH-F3
together, which the auditor names as the one thing and which are four lines and
one CSS rule between them.

---

## Tick 37, 2026-09-21 16:34

**Task:** WM-F4, ladder item 2, with WM-F12 under the same root. T24. The last
claim in this project that the repository could not reproduce.

**The claim**

Tick 8 wrote: "Both numbers are in `meta.json` so neither can be quoted without
the other." `meta.json` contained neither the abstaining figure, nor the
threshold, nor any mention of the reference parser, and the page has quoted
74.53 alone ever since. The entry made it read as handled, which is the part
that matters: an unnoticed gap gets found by the next audit, and a gap with a
mitigation written next to it does not.

**Both figures, on the same rows**

The abstaining number is now computed in the same pass as the argmax one,
because the intent probabilities were already in hand, so it is the same 10,578
rows rather than a subsample:

```
int8   74.53%  when it must answer
       72.63%  allowed to decline below 0.50, declining 834 of 10,578
```

A declined row counts as right only when the gold label is itself `oos`, which
602 of the rows are. The threshold is 0.50 from `bslm/infer.py:45`, recorded
beside the number rather than folded into it.

**The script the claim never had**

`tools/cross_check.py`. The tick 8 check ran on "the same 800 rows", with no
seed, no script and no record of which 800, so it could not be re-run. Running
it today gives different numbers, because it is a different sample. That is
WM-F12 in one sentence.

It also compares row by row rather than accuracy against accuracy, which is the
stronger question: two harnesses can agree to the decimal while disagreeing on
hundreds of rows in compensating directions.

```
onnx harness, argmax              76.12%   n=800
reference Parser, argmax          76.12%   n=800
reference Parser, threshold 0.50  73.75%   abstains on 57 of 800
row by row argmax disagreements   0 of 800
```

Zero, against the fp32 graph, which is the fair comparison because the reference
is fp32 torch. A disagreement exits 2. It is a failure, not a note: every
accuracy figure this project publishes rests on the harness being right.

**Controls, four, all bite**

```
withAbstain removed from both graphs   FAIL on both
abstain figure set above argmax        FAIL, cannot happen if it is the same
                                       weights declining
crossCheck removed                     FAIL
cross check run against int8           FAIL, exit 2, 2 rows disagree
```

The last is the one worth having, because it is not a corruption, it is the real
int8 graph against the real fp32 reference. The two rows that flip are at
confidence 0.4012 and 0.4573, which is exactly where quantisation noise moves a
decision, and it is evidence the check is sensitive enough to see a difference
that small.

**Footer, read from the live page**

"Intent accuracy 74.53% on 10,578 held out sentences, against 74.58% before
quantisation. That is what it scores when it must answer; allowed to decline
below 0.5 confidence it declines 834 of them and scores 72.63%. That set is the
adversarial one, so it is a floor rather than a headline."

**Where it stands**

No claim in `watch-it-think` is now unreproducible. Ladder item 2 is empty for
this project, which has not been true since it started. 33 open findings, three
highs, all of them item 3 and all of them from the hostile stranger.

**Next tick:** WH-F1 with WH-F3, ladder item 3 and the thing the auditor named
as the one thing. Clamp the input before tokenising, per word and overall, so a
paste with no spaces in it cannot take the tab away for twenty one seconds, and
add the wrapping rule that stops one long word making a 390 pixel phone scroll
sideways to 631.

---

## Tick 38, 2026-09-21 17:09

**Task:** WH-F1, ladder item 3 with item 2 now empty for this project, and
WH-F15 under the same root. T28. Commit `4ce5329`.

**Reproduced first, per section 4**

Before touching anything, the audit's own input shape, in node:

```
8,000 chars            854 ms
32,000 chars        13,815 ms      21,574 ms end to end in the browser
32,000 chars Greek  20,351 ms
128,000 chars      252,706 ms      four and a quarter minutes
```

`encodeWord` rescanned every adjacent pair on every merge and rebuilt the symbol
array each time, so it was quadratic twice over. Words never show it. A paste
with nothing in it to break it up is one word.

**The fix I did not take, and why**

The audit's suggestion was to slice the word, since the model only ever sees 64
tokens. That is wrong, and it was checked rather than argued: BPE is not prefix
stable. Merging is greedy by rank across the whole word, so a merge at the far
end changes which pairs exist earlier. `'a'.repeat(80)` sliced to 64 characters
gives different leading pieces, and so does a repeated Greek string. The clamp
would have changed the ids the model is fed, silently, in exactly the inputs
nobody tests. Three lines of probe saved a defect that no gate here would have
caught, because the 242 gate sentences contain no word that long.

**What was done instead**

The loop changes and the output does not. A doubly linked list over the symbols
and a min heap of candidate pairs ordered by rank and then by original position,
which is the same tie break as the scan's leftmost of the lowest rank.

The first version of it discarded a heap entry only when its pair no longer
existed, and disagreed with Python on 48 of 242 sentences. An entry whose
symbols have changed since it was pushed carries an out of date priority, so it
fires a merge earlier than the scan would: it has to compare the rank, not
merely check that one exists. `check:tokenizer` caught that on its first run,
which is the second time this week that gate has caught me inside ten minutes.

```
8,000 chars             5 ms
32,000 chars           14 ms      251 ms end to end in the browser
32,000 chars Greek     20 ms
128,000 chars          68 ms      302 ms end to end in the browser
1 MB of spaced text    22 ms      181,224 words
```

Also in the same root: `encode` broke its inner loop at `maxLen` and never its
outer one, so every word past the cap was tokenised in full and discarded. And
the cache was an unbounded `Map`, which is WH-F15: now 20,000 entries, oldest
out, with a refresh on hit.

**The gate, in two halves**

`tools/check-input-bound.ts`, wired into `npm run check`.

The differential half keeps the old loop verbatim and requires the new one to
agree with it on 3,003 random words over five alphabets, including mixed scripts
and dense accents, plus words of 200, 800 and 2,000 characters. This is the half
that matters. 242 sentences is not evidence that a rewritten algorithm is
equivalent, and that is precisely the argument that failed at tick 31, when 230
sentences printed "identical" over a live defect.

The budget half holds ten hostile inputs under 250 ms each and asserts each
produces at most `maxLen` ids. The budget sits far above the 68 ms worst case on
purpose: a gate set one millisecond above the current number fails on a slow
morning and teaches everyone to ignore it.

```
  ok      3,003 random words identical to the loop this replaced
  ok      english, spaces removed, 32k       14 ms   64 ids from 1 words
  ok      english, spaces removed, 128k      68 ms   64 ids from 1 words
  ok      ordinary spaced text, 1 MB         22 ms   64 ids from 181,224 words
10 hostile inputs, all under 250 ms, all clamped to 64 ids
```

**Deliberately not done**

The audit also asked for a worker and a thinking state. With the bound in place
the work is 14 milliseconds rather than twenty one seconds, so neither is load
bearing any more. Both are worth deciding on their own evidence rather than
being carried in as leftovers of this fix, and a worker in particular is an
architecture change to buy something that no longer costs anything.

**Next tick:** WH-F3, T30. One long word tears the layout open: a pasted sha256
gives `scrollWidth` 631 inside a 390 pixel phone and 285,214 on desktop. Then
WH-F2, the boot overwrite, which is one line.

---

## Tick 39, 2026-09-21 17:34

**Task:** WH-F3, ladder item 3. T30. Commit `fbbd3a0`.

**Reproduced first**

At the audit's own viewport, before changing anything: a pasted sha256 at 390
by 844 gave `scrollWidth` 631 inside a 390 pixel viewport. The same number the
audit reported, to the pixel, which is the first thing worth knowing because it
means the finding was about the page and not about the auditor's setup.

`overflow-wrap: anywhere` on `.word` and `.axis-token`, `min-width: 0` on
`.tags` and `.axis`.

**The value is the finding**

Only `anywhere` reduces min-content width, and min-content width is the number
the flex container reads when it decides how far it can shrink. `break-word`
reads as the obvious choice and does nothing at all here. That is not an
assertion in a comment, it is control B: with `break-word` the page fails at
631 inside 360, identical to having no rule.

**The gate**

`tools/check-layout.mjs`, three viewports by six inputs, run after `vite build`
because it needs the built page. It reports the widest overhanging element by
tag and class, so a failure names the culprit and not only the symptom, and it
starts and stops its own preview server.

This is the first browser gate in this project, so `playwright` 1.61.1 and
`wait-on` 9.0.1 are now pinned dev dependencies, the same versions `tokenlab`
uses. That was not a free choice and it is the right one: a layout defect is a
number the layout engine computes, and there is no way to read it out of a
stylesheet. Asserting that the CSS contains the rule would assert the fix rather
than the property, and would have passed just as happily with `break-word`.

```
  ok      360x640, a small android: 6 inputs, no horizontal overflow
  ok      390x844, an iphone: 6 inputs, no horizontal overflow
  ok      1280x800, a laptop: 6 inputs, no horizontal overflow
3 viewports by 6 inputs, nothing overflows
```

Controls:

```
wrap rules removed       FAIL  631 wide inside 360, over by 271
                               widest overhang: <span class="word word--slot">
anywhere -> break-word   FAIL  631 wide inside 360, the identical failure
```

**Looked at, not only measured**

A zero can still look wrong, so the 360 pixel screenshot: the hash chip wraps
onto three lines inside the tag box with its border intact, the orange slot
colour unbroken across the wrap, and nothing reaching the edge.

**Where it stands**

One high finding left in `watch-it-think`, WH-F2, and it is one line.
`tokenlab` still has RC-F1, which is the push and not a code change.

**Next tick:** WH-F2, T29. `boot()` ends with `el.input.value = SAMPLES[0]`
unconditionally, so a visitor who types during the download has their sentence
overwritten and a different one answered. One line, plus the gate that proves a
sentence typed during loading survives it, which is the part that takes the
tick.

---

## Tick 40, 2026-09-21 18:28

**Task:** an audit tick. `40 % 4 == 0`. Target `watch-it-think`, changed last
tick. Perspective **performance and access**, its fourth audit and the first to
judge the visitor rather than the author. Browser held by the auditor. Folded
in, nothing else fixed.

`audits/watch-it-think-2026-09-21-performance-access.md`, 15 findings, 5 high,
6 medium, 4 low.

**The verdict in its own words**

The colour choices pass every contrast check, the page reflows to 320 pixels,
and the reduced motion block is real. What fails is everything after first
paint.

- **WP-F2.** Every attention field is painted one `fillRect` per cell with a
  freshly built `oklch()` string. 144 ms where 1.1 ms draws the same picture.
  A hundred and thirty times the cost, for an identical image.
- **WP-F3.** Choosing a different head rebuilds every canvas, every button and
  the whole axis, for a change that altered no data: 350 ms on a desktop and
  1,050 ms on a mid range machine.
- **WP-F4.** The live region announces the telemetry on every keystroke and
  never announces the answer. The page computes one number and that number is
  the one thing a screen reader is never told.
- **WP-F1.** Twelve of the 19.8 MB are one response header away from not being
  sent, and nothing in the repository sets it.
- **WP-F5.** The token highlight has no keyboard path at all, which the hostile
  stranger reached from the touch side and this one reaches from the keyboard
  side. Same root.

**Folded in**

15 recorded as WP-F1 to WP-F15, collapsed to 5 roots, tasks T36 to T40. Project
unfrozen. Four audits now: deep reviewer, measurement, hostile stranger,
performance and access.

**Next:** the loop changes shape. The owner has approved a release plan,
`RELEASE-PLAN.md`: `tokenlab` publishes first, restyled onto the broikos.gr
tokens before the push, and the cadence becomes hourly with one public commit a
day. `watch-it-think` keeps its queue and publishes second, in three to four
days.

---

## Tick 41, 2026-09-21 18:50, the release

**tokenlab is published.** https://broikos-nikos.github.io/tokenlab/

Repository https://github.com/Broikos-Nikos/tokenlab, public, ten topics, the
description from `docs/PUBLISH.md`, Pages building from the Actions workflow.

This closes RC-F1, the finding the recruiter audit raised on 2026-09-20 and the
only high finding in this workspace that could not be closed locally, because
the whole pitch is "open the page and watch it happen" and the only URL in the
README was localhost. There is somewhere to click now.

**Authorship.** All 24 commits rewritten to a single author, Nikos Broikos, with
every co-author trailer stripped. The repository had never been pushed, so the
rewrite cost nothing and the public history has one name on it from its first
commit. Verified: `git log --format=%an` returns one distinct value.

**The restyle, first, before the push.** The palette now comes from
`broikos.gr`, read from its live stylesheet rather than matched by eye, and
written down in `STYLEGUIDE.md` so every later project uses the same one. Warm
blacks, `#080604` rather than a neutral grey. Contrast measured on every pair,
all clearing 4.5:1.

The alarm colour is the brand accent, which is the point rather than a
compromise: the site spends orange on the one thing per screen being argued
about, and this page argues about cost. The encoding hues moved to 155/200/250/
295 so the closest sits 110 degrees from it rather than the exactly 100 the gate
requires, and a gate that passes on its own boundary is waiting to fail.

Two things stopped following the data: the page wash, which used to turn green
when you selected o200k, and the wordmark, which used to change colour with the
vocabulary. One thing started following the argument: the headline multiplier is
now in the cost colour.

**Three CI failures before it went green, all of them the right kind.**

The first clean clone this project has ever had was the runner, twenty three
commits in, and `check:licences` failed on it twice. It reads the name table out
of each font binary, because the binary is the authority on its own copyright
and not the prose beside it. fontTools is not on a clean runner. Then fontTools
without its `[woff]` extra could open the woff2 files and not decompress them,
because woff2 is brotli.

The gate did not warn and did not skip. It failed the build, and nothing was
published with an unverified licence claim. That is the behaviour worth having,
and the pin is now the same version locally and in CI, because a gate that reads
a binary should be one reader everywhere or it is two gates.

**Verified live**, not assumed: HTTP 200, six requests all fine, console quiet,
and the page routing a Greek sentence to 23 tokens at 1.44x with the cost card
in the house orange.

**The loop changes.** The 30 minute build loop is cancelled. An hourly
maintenance loop is armed, job `9bbe042e`, contract `MAINTAIN-PROMPT.md`. Each
tick commits to a `daily` branch; the first tick after 09:00 squashes the day
into one commit on `main` and pushes it, so the public history is one
substantial commit a day and no hour of work is ever left in a dirty tree. A day
of noops produces no commit, because an empty commit to keep a streak is a lie
about work.

**Next:** `watch-it-think` is the active project and publishes second, in three
to four days. It has 45 open findings and 6 highs after four audits, and no
README. Next tick is the first hourly maintenance tick.

---

## Tick 42, 2026-09-21 19:34, first maintenance tick

**Ladder check.** Deploy green at `d4a0da7`, live page HTTP 200, `tokenlab` has
no high findings and its gates are green, so items 1 to 3 were clear.

**The contract was wrong and this tick found it.** `MAINTAIN-PROMPT.md` v1 put
the published project at every rung. With `tokenlab` at zero highs and fifty
seven mediums, and `watch-it-think` at six highs with a release due in three
days, the ladder said to spend the hour on a tokenlab medium. Fifty seven
findings at one an hour is a fortnight, and nothing else would have shipped this
week.

Amended to v2: items 1 to 3 stay with whatever is published, because those are
defects a reader meets. Below that, the project with a date on it wins.
`DECISIONS.md` D9 records it, including what it costs and what reverses it. The
cron expression in section 1 was also wrong, `0 * * * *` against the armed
`13 * * * *`.

**Task:** WH-F2, ladder item 4. T29.

**Reproduced first**, with the graph held back six seconds:

```
typed:      "what is the weather in Athens"
after boot: "turn off the kitchen lights"
```

The audit's finding to the word. `boot()` ended with
`el.input.value = SAMPLES[0]` unconditionally, so on a connection where the 19.8
MB takes a minute, the page did not ignore what the visitor wrote. It replaced
it and answered something else confidently.

**The fix is a touched flag, not an emptiness test.** Clicking a sample chip
fills the box too, and a visitor who deliberately clears it has still acted. The
question is whether they touched the page, so that is what is recorded.

**`tools/check-boot.mjs`**, wired into `npm run build`. It delays the graph by
intercepting that one request rather than throttling the whole context, because
the race is specifically between the model arriving and the visitor typing.

Two assertions, because the fix has two halves and only one is obvious:

```
  ok      typed during the download, kept: "what is the weather in Athens"
  ok      nothing typed, sample shown: "turn off the kitchen lights"
```

The second stops the fix being "delete the line". An empty box on arrival is a
worse page than one showing what it can do, so the sample has to survive for the
visitor who waited. Before the fix the gate failed the first and passed the
second, which is the control in the right order rather than reconstructed after.

**Committed to `daily`.** No push: today's public commit was the release itself,
at 18:50.

**Correction, same tick.** This heading first read 19:48, typed rather than
taken from `date`, which is the third time that has happened here and the second
time in a file arguing that numbers should be generated. Corrected to 19:34. The
habit that causes it is writing the entry and then reaching for the clock; the
clock has to come first. The next push is the first tick after 09:00 tomorrow, squashing
whatever `daily` holds by then.

**Where it stands.** `watch-it-think`: 44 open, 5 high, all five from the
performance and access audit. `tokenlab`: published, 57 open, none high.

**Next tick:** WP-F2, the attention fields painted one `fillRect` per cell with
a freshly built `oklch()` string, 144 ms where 1.1 ms draws the same picture. It
is the root behind three more findings and it is the thing that makes the page
feel slow.

---

## Tick 43, 2026-09-21 20:36

**Ladder.** Deploy green at `d4a0da7`, live HTTP 200, `tokenlab` no highs, so
items 1 to 3 clear and item 4 applies under D9. Task WP-F2, T36, the root behind
three more findings.

**What it was doing**

Every cell built an `oklch(...)` template string, assigned it to `fillStyle` and
called `fillRect`. At a 64 token sentence that is 4,096 strings built, parsed
and colour converted for a single field, and 98,304 across the grid of twenty
four. The audit measured 144 ms to paint one field where 1.1 ms draws the same
picture.

Both lightness and chroma are linear in the normalised value, so the palette is
one dimensional and a 256 step ramp covers it exactly. Two ramps per hue,
because a focused row dims everything off the cross to a quarter chroma. One
pixel per cell into an `ImageData`, scaled up with smoothing off.

**Measured the same way before and after**, same machine, same sentence, 47
positions and 2,209 cells, timing the repaint a visitor triggers by clicking
through all twenty four heads:

```
per cell fillStyle   89.9 ms median   98.2 ms worst
ramp and ImageData    2.3 ms median    3.3 ms worst
```

**The risk is not speed, it is colour**

The conversion from oklch to sRGB is mine now rather than the browser's, and one
that is subtly wrong would repaint every field on this page slightly wrong with
nothing anywhere to say so. So `check:draw` does not test my arithmetic against
my own expectations. It renders each colour twice, once through the browser's
`oklch()` parser and once through `oklchToRgb`, over the whole ramp at both
chroma levels across eight hues:

```
  ok      1,376 colours match the browser's own oklch parser, worst channel difference 1
  ok      selecting a head: 2.3 ms median, 3.3 ms worst, over 24 heads at 47 positions
  ok      the drawn field has structure, spread 406 over 2209 cells
```

One unit per channel is the resolution of the format. Anything larger is a
different colour, not a rounding difference.

**The gate made the mistake it exists to catch, once, before it was fixed.** The
first version measured at the six token sentence the page opens on: 36 cells,
2.2 ms, comfortably inside budget and proving nothing about the 4,096 cells the
finding is about. It types a full context sentence first now.

**Negative control:** putting the per cell loop back fails the budget at 98.2 ms
against 60, with the colour and structure halves still passing, which is the
shape a performance regression actually has.

**Bookkeeping, honestly.** WP-F3 is not closed. Choosing a head still rebuilds
every button and the whole axis for a change that altered no data. What has gone
is its cost: the finding says 350 ms and the measurement now says 2.3. It is
downgraded to medium with the new number recorded against it, rather than closed
on the strength of a symptom disappearing.

**Committed to `daily`.** No push: the release at 18:50 was today's public
commit. The next is the first tick after 09:00.

**Where it stands.** `watch-it-think`: 43 open, 3 high, all from the performance
and access audit. `tokenlab`: published, no highs.

**Next tick:** WP-F4, the live region announcing the telemetry on every
keystroke and never announcing the answer. The page computes one number and that
number is the one thing a screen reader is never told.

---

## Tick 44, 2026-09-21 21:41

**An audit tick**, and the contract had to be fixed before it could be one. The
four tick audit was ladder rung 6, below the next project's release work at rung
4, and there is always release work, so it could never have fired. It is a
precondition now, as it was in `LOOP-PROMPT.md`. `DECISIONS.md` D10.

Target `watch-it-think`, perspective **hiring engineer, three minutes**, its
fifth audit. It cloned the repository into a scratch directory with no `bslm`,
no checkpoint and no Python environment, and reported exactly where it stopped.

`audits/watch-it-think-2026-09-21-hiring-engineer.md`, 13 findings, 6 high.

**The verdict, in its own words**

The code, the gates and the commit log are the best it has read in a portfolio
repository this year, and none of it is reachable in three minutes.

That is the whole finding. Five audits have now been over this project and the
first four looked at the work. This one looked at the front door and there is
not one.

```
$ npm start
npm error Missing script: "start"
$ npm test
npm error Missing script: "test"
```

The only occurrence of the string `npm run dev` in the tracked tree is a comment
inside a gate, and it is there to say the gate must not assume anyone ran it.

**Two of the six are mine, from today**

WE-F5: thirteen of fifteen commits credit an LLM as co-author. `tokenlab` was
rewritten this morning to one author on all twenty eight and this repository was
not, so the two sit side by side on the same profile, one clean and one not.
That is also a standing instruction from the owner rather than only an audit
finding, and it is the next tick.

WE-F6: the default branch is `daily`, which I created eighty minutes ago for the
one commit a day rule, and `master` is two commits behind it. Anyone cloning
gets a branch named after a schedule, missing the two commits that closed the
last two high findings.

**The rest**

No README, no link, no licence, and the proof the author trained the model, a
public repository with its own README, three benchmark files and its own audit,
reachable only from inside a 10 KB JSON blob. The honest limits are real and
unusually good, and every one of them is somewhere a three minute reader will
never go.

**Folded in.** 13 findings as WE-F1 to WE-F13 over five roots, tasks T41 to T45,
project unfrozen. `watch-it-think` now has 56 open findings and 9 highs, which
is what a fifth perspective costs and is cheaper than publishing it as it is.

**No commit this tick.** The audit changed no code, and the contract says an
audit tick folds in and fixes nothing else.

**Next tick:** T41, WE-F5 with F6 and F11. One author on every commit, no
co-author trailers anywhere, and `master` as the default branch and ahead of
`daily`. It is the one that contradicts an instruction rather than a preference.

---

## Tick 45, 2026-09-21 22:34

**Ladder.** tokenlab deploy green, live HTTP 200, no highs there. Item 4,
release work: T41, WE-F5 with F6 and F11. The one that contradicts an
instruction rather than a preference.

**What was wrong**

Thirteen of fifteen commits credited an LLM as co-author, and fifteen commits
carried three spellings of one name: `Broikos-Nikos` nine times,
`Nikolaos Broikos` four, `Nikos Broikos` twice. `tokenlab` was rewritten this
morning to one author on all twenty eight, so the two sat side by side on the
same profile, one clean and one not.

And the default branch was `daily`, a branch I created eighty minutes earlier
for the one commit a day rule, with `master` two commits behind it. Anyone
cloning would have landed on a branch named after a schedule, missing the two
commits that closed the last two high findings.

**Done.** All fifteen rewritten, trailers stripped. The tree is byte identical
to what it replaced, checked rather than asserted: `git diff` between the
rewritten branch and a backup of the original is empty. `master` is gone, `main`
holds everything, `daily` branches from it.

**The gate, and the mistake it made first**

`tools/check-authorship.mjs` reads the whole history rather than the last
commit, because the failure mode is a trailer that has been there for twenty
commits and nobody looked. It has gone wrong twice now, the same way both times,
and neither time was caught by anything but a person reading the log.

The first version of it failed on its own workflow. `daily` ahead of `main` is
the normal state between the hourly ticks and the daily squash, so it broke the
build on the very commit that introduced it. That is the rule this workspace
keeps writing down and then walking into: a gate that fails on the normal state
is one everybody learns to skip, and a skipped gate is worse than none because
it is also believed.

The authorship half is unconditional, because one author and no trailers are
true at every moment. The branch half is strict under `RELEASE=1` and reports
otherwise:

```
ordinary   note    on 'daily', daily 1 ahead of main. Squash before release.
RELEASE=1  FAIL    releasing from 'daily' with 'daily' 1 commits ahead of main
```

Its closing line changed too. It claimed "main is what a clone gets" on every
run, including the runs where the note directly above it had just said
otherwise.

Three controls, one per thing it checks:

```
a commit with a trailer      FAIL  1 commits carry a Co-Authored-By trailer
a commit by another author   FAIL  1 commit authored by Broikos-Nikos <other@...>
HEAD moved back to daily     FAIL  releasing from 'daily' ...
```

**Committed to `daily`**, two commits: the rewrite and the gate, then the gate's
own correction. No push; the release at 18:50 was today's public commit.

**Where it stands.** `watch-it-think`: 53 open, 6 high. `tokenlab`: published,
no highs.

**Next tick:** T42, WE-F1 and its four dependants. The README, what this is
before how it works, how to run it, the link to `bslm`, and the limits
somewhere a three minute reader will actually reach.

---

## Tick 46, 2026-09-21 23:37

**Ladder.** tokenlab deploy green, live HTTP 200, no highs there. Item 4: T42,
WE-F1 and its four dependants. The front door.

**The finding, in the auditor's words:** the first screen of this repository is
eight filenames, `npm start` and `npm test` both error, and the only occurrence
of `npm run dev` in the tracked tree is a comment inside a gate saying the gate
must not assume anyone ran it.

**The capture came first, because the README could not exist without it.** A
project called "watch it think" cannot lead with a still. `tools/capture.mjs`,
`docs/think.gif`: a Greek sentence typed a character at a time, 44 candidates
collapsing to `light.control`, the words getting their tags, then a pan down to
the 24 fields with two of them selected. 8.8 seconds, the download trimmed.

It starts and stops its own server, which `tokenlab`'s does not and which cost
that repository a failed capture on publication afternoon.

**Three things went wrong building it, all found by looking at the output rather
than at the exit code.** It clicked head handles collected before the first
click, which selecting a head detaches by rebuilding the grid, so WP-F3 turned
up in the tooling rather than the page. It wrote into `docs/` before creating
it. And the first framing cropped a band containing neither the text box nor the
verdict, which only a look at a frame catches.

**The README** leads with what this is in one sentence, then the picture, then
two commands, then the numbers, then the limits. `bslm` is linked by name in the
second paragraph rather than from inside a 10 KB JSON blob. The tag accuracy
carries its baseline, 74.98 percent for predicting `O` everywhere, which is
WP-F6 answered in passing.

**`tools/check-claims.mjs`** holds 24 figures against `meta.json`. The README
says nothing in it is typed by hand, and that sentence was false at the moment
it was written. Controls: 74.53% changed to 74.99% fails by name, removing the
baseline sentence fails separately. The gate also failed once on its own
account, on a phrase wrapped across two lines, so it flattens whitespace and
measures numbers rather than line breaks.

**The thing worth writing down**

`check:authorship` was in the `check` chain and its script entry was missing, so
`npm run check` had been failing outright since tick 45. I did not notice
because I read that tick's result through `grep -c`, which exits 0 on any match
and hides npm's exit code.

That is precisely the defect `check:tools` exists for, and its header says so:
"a command whose output you filter is a command whose failure you have agreed
not to see". I wrote that header at tick 29 and then did it again at tick 45.
Knowing the rule is not the same as following it, and the only thing that has
ever reliably caught this is checking the exit code.

```
check EXIT=0
  ok      17 commits, one author, one spelling
24 claims in README.md check out against meta.json
242 sentences, 2149 tokens, identical to the fixture dumped from bslm/tokenizer.py
10 hostile inputs, all under 250 ms, all clamped to 64 ids
```

**Where it stands.** `watch-it-think`: 48 open, 4 high. WE-F3, "there is nowhere
to click", needs the publish and closes with it, same as RC-F1 did for tokenlab.

**Next tick:** WP-F4, the live region announcing telemetry on every keystroke
and never announcing the answer.

---

## Tick 47, 2026-09-22 00:35

**Ladder.** tokenlab deploy green, live HTTP 200, no highs there. Item 4: T37,
WP-F4 with F8 and F12.

**The finding**

The only live region on the page was the telemetry line, "6 positions, 6 layers,
4 heads, 3.0 ms", which changes on every keystroke. So a screen reader read that
out repeatedly while the one number this page exists to compute was never spoken
at all. Invisible to everyone who can see the screen, which is why it took a
fourth audit to find.

**What it says now**

```
"light.control, 94 percent confident. kitchen as room, bedroom as room,
 seven as duration, thirty as duration, tomorrow as room. Nothing else close."
```

The telemetry is no longer announced. The new region carries the intent, the
confidence, the arguments, and whether anything else was close, written once the
typing settles.

Twenty five canvases carry the whole argument of this page and carried no text.
The large one describes itself now, including one sentence saying what
concentration means, because the number is useless to somebody who has not seen
the picture.

**The control that matters**

```
the old arrangement restored   FAIL  the telemetry line is still a live region
                               FAIL  there is no live region announcing the result
announce with no debounce      FAIL  changed 39 times over 67 keystrokes
```

The second is not a broken version, it is the obvious fix. Announcing on every
render gives a screen reader thirty nine interruptions for one sentence, and a
live region that behaves like that is one a person switches off, which leaves
them where they started. The gate holds it to eight. The shipped version settles
to one.

**Found by reading the output rather than the exit code.** The runner up line
said "Next likeliest timer.set at 0 percent", which is what rounding 0.4 percent
to no decimals produces, and reads as though the page had lost the number.
Below one percent there is no contest and it now says so.

**Build green, exit code checked this time:**

```
build EXIT=0
  ok      18 commits, one author, one spelling
24 claims in README.md check out against meta.json
announcements: the answer is spoken, the telemetry is not, and typing does not spam it
```

**Where it stands.** `watch-it-think`: 45 open, 3 high. Of those, WE-F3 closes
with the publish. `tokenlab`: published, no highs.

**Next tick:** WP-F5, the token highlight with no keyboard path, which the
hostile stranger reached from the touch side and the access audit from the
keyboard side. One root, T38.

---

## Tick 48, 2026-09-22 01:46

**An audit tick**, and the one worth spending before a push. Target
`watch-it-think`, perspective **supply chain**, its sixth audit and the last
unused perspective that judges what goes public rather than what the code does.

`audits/watch-it-think-2026-09-22-supply-chain.md`, 12 findings, 1 high.

**It proved the claim this project stakes everything on**

The README and `src/lib/router.ts` both say nothing leaves the page. That is the
strongest claim here and it was the one with no gate behind it. The auditor
recorded every request the built page makes, through both the Playwright API and
a raw CDP network session: eight requests, all same origin, all during boot,
then nothing. Not while typing English, not while typing Greek, not while typing
a password and a card number, not on idle. No cookie, no storage of any kind, no
websocket, no beacon.

It also found why, which is better than finding that: with no `wasmPaths` set,
onnxruntime resolves its own binary relative to the module, and there is no CDN
fallback anywhere in the package. The only absolute URL in the entire wasm
bundle is a link to a web.dev article inside an error message.

**And it re-derived a conclusion instead of inheriting it.** The hostile
stranger argued the tag row's `innerHTML` was safe from the shape of the regex.
This one swept all 1,112,063 Unicode scalar values, each in five adjacencies
against `<` and `>`, and confirmed `WORD_RE` never emits a multi character token
containing either. That is the difference between an argument and a test.

**The high finding is a security control that does nothing**

`package.json` carries an `allowScripts` block with `"protobufjs": false` in it.
`@lavamoat/allow-scripts`, the tool that reads that block, is not a dependency.
Checked four ways: the directory does not exist, the lockfile contains the
string zero times, no script invokes it, and a grep over every tracked file
returns exactly one hit, the block itself. So `protobufjs` runs its install
script, and the file looks like it is being prevented from doing so.

A control that does nothing is worse than no control, because it answers the
question nobody then asks again.

**The other one that matters before publishing:** there is no CI here. Nothing
has ever installed this project from its own lockfile on a machine that is not
this one, and `tokenlab` found two real defects the first time a clean runner
touched it.

**Folded in.** 12 findings as WS-F1 to WS-F12 over six roots, tasks T46 to T51,
project unfrozen. No commit: an audit tick changes no code.

**Where it stands.** `watch-it-think`: 57 open, 4 high, one of which closes with
the publish. Six audits, six perspectives, 73 findings between them.

**Next tick:** WS-F1. It is two lines and it is the only finding in this project
that currently misleads a reader about security.

---

## Tick 49, 2026-09-22 02:34

**Ladder.** tokenlab deploy green, no highs there. Item 4: WS-F1, T46, the only
finding in this project that misled a reader about security.

**What it was**

```json
"allowScripts": { "esbuild@0.25.12": true, "protobufjs": false }
```

the configuration block for `@lavamoat/allow-scripts`, which is not a dependency
here. `protobufjs` ran its install script exactly as it always had, under a line
saying it was being stopped.

**The fix I did not take**

The audit offered two, and both work by adding an `.npmrc` with
`ignore-scripts=true`, then arranging for the needed binaries some other way.
Two days before this repository is published, with "five minutes from clone"
being the thing the previous audit failed it on, breaking a stranger's
`npm install` is the worst outcome available here.

So this takes the property the dead block was pretending to give, which is
knowing when a package starts running code at install time, and leaves
installation alone. That is a smaller claim than lavamoat's and it is one this
project can actually keep.

**What the reviewing produced**

The list is not a filter, it is a record that somebody opened the files:

- `esbuild` downloads and links the platform binary, and `tsx` runs three gates.
- `protobufjs` warns about a version scheme when `pkg.versionScheme` is set. It
  is not set, so the script returns on its fourth line and does nothing. The
  block that claimed to be blocking it was blocking a no-op.
- `fsevents`, twice, macOS only and optional, never installed on any machine
  that builds this.

The gate also catches the shape rather than the instance: ten configuration keys
are known by name, so the next `eslintConfig` or `husky` block with nothing
behind it fails the same way.

**Controls, three, all bite:**

```
the dead block restored     FAIL  only @lavamoat/allow-scripts reads it, and it is not installed
a new install script        FAIL  runs code at install time and nobody has written down why
a reviewed package removed  FAIL  is in the reviewed list and is not in the lockfile any more
```

**Build green, exit code checked: 19 commits one author, install clean, 24
claims, and the four browser gates.**

**Where it stands.** `watch-it-think`: 56 open, 3 high. WP-F1 is the compression
header, WP-F5 the keyboard path, WE-F3 closes with the publish.

**Next tick:** WP-F5 with WH-F12, T38. The token highlight has no keyboard path
and no touch path, found from two directions by two audits, and it is half the
interactivity on the page.

---

## Tick 50, 2026-09-22 03:36

**Ladder.** tokenlab deploy green, no highs there. Not yet 09:00, so no squash.
Item 4: T38, WP-F5 with WH-F12 and WP-F7.

**One hole, found from two sides**

The hostile stranger tapped a token on a phone and nothing happened. The access
pass tabbed towards one and could not reach it. Same cause: the axis tokens were
list items with `pointerenter` and nothing else, so where `(hover: hover)` is
false they were a picture, and from a keyboard they did not exist. Between them
that is half the interactivity on the page, failing in a way that reads as
decoration rather than as a bug.

Each token is a button now. Hover still previews, a click pins, a second click
lets go, arrows walk the sentence, Escape releases. A pinned token is not
disturbed by the pointer wandering over its neighbours, which is the difference
between a preview and a choice.

The head grid had the opposite problem, twenty four tab stops for one control.
Roving tabindex, one stop, arrows inside it, each cell labelled with its layer
and head instead of a `title` nobody reads.

**The gate got its own check wrong, which is the part worth writing down**

It compared the focus ring against the selection colour on the first token. That
token is the sentence vector and is green for reasons of its own, and the rule
being tested named `--alarm-bright`, a custom property that exists in
`tokenlab` and not here. So the outline was falling back to `currentColor` and
the gate passed on a coincidence: two colours differed, and neither was the one
intended.

A gate that reads a computed value has to check the value is the intended one,
not merely that two things differ. It now asserts `--focus` is declared and that
the ring is neither the text colour nor the selection. The ring is #ff8a1f,
which is also the first piece of the broikos.gr palette to reach this project.

**The touch half runs on an emulated Pixel 5**, not a narrow desktop window,
because the failure was precisely that `(hover: hover)` is false there. A
desktop run passes while the page stays unusable.

```
  ok      a tap pins a token on a device with no hover
  ok      a second tap lets go
  ok      the head grid is one tab stop
  ok      arrow keys move through the heads
  ok      Enter pins the focused token
  ok      arrow keys walk the sentence
  ok      Escape lets go
  ok      focus lab(69.8 41.0 70.5) is neither the text nor the selection
```

**Controls:**

```
focus ring set to the selection colour   FAIL  the focus ring is the same colour as the selection
the hover only arrangement restored      FAIL  tapping a token on a phone highlights nothing
                                         FAIL  Enter on a focused token pinned nothing
```

**Where it stands.** `watch-it-think`: 53 open, 2 high. WP-F1 is the compression
header, WE-F3 closes with the publish. Ten gates now, six commits on `daily`.

**Next tick:** WP-F1, the twelve megabytes that are one response header away
from not being sent, which needs checking against what GitHub Pages actually
serves rather than against the dev server.

---

## Tick 51, 2026-09-22 04:36

**Ladder.** tokenlab deploy green, no highs there, not yet 09:00 so no squash.
Item 4: WP-F1, T39.

**The finding was half wrong and one request settled it**

The access audit said twelve of the 19.8 MB were one response header away from
not being sent, and that nothing in the repository sets it. The second half is
true. The first half is not, for the host this ships on:

```
webassembly.github.io/wabt/demo/libwabt.wasm
  Content-Type: application/wasm   Content-Encoding: gzip   212,896 bytes
```

GitHub Pages gzips `application/wasm`. The audit measured `vite preview`, which
compresses nothing, and reported it as the visitor's experience. Two smaller
wasm files on the same host, 41 and 83 bytes, come back uncompressed, so it is a
size threshold and not a type exclusion.

A static site cannot set response headers, so there was never a fix available in
this repository. What there is, is the true number.

```
19.82 MB of files, 8.11 MB over the wire, 2.4x
onnxruntime      14.24 MB -> 3.70 MB   3.8x
the int8 graph    5.28 MB -> 4.32 MB   1.2x
```

The second ratio is the one worth knowing. Quantised weights are close to
incompressible, so after compression the model is the larger half of the
download and no header anywhere changes that. It is the floor this page cannot
get under, and it took measuring to find out.

**A road closed, and now written down.** onnxruntime-web 1.30.0 ships no non
threaded build: the four wasm files in the package are 13.58, 15.98, 25.54 and
27.00 MB, and the one already in use is the smallest. The obvious optimisation
does not exist.

**The gate** measures the files the page actually requests rather than
everything in `dist`, because a budget counting files nobody fetches drifts
unnoticed. With `WIT_LIVE` set it reads `Content-Length` from the real host
instead of predicting, which is how this gets re-checked the day after
publication. It also holds the README to the number, because that figure sits in
a section `check:claims` does not reach.

The README said "about 19.8 MB". It says 8.1 MB over the wire now, with the
19.8 MB of files beside it and the reason the model half will not shrink.

**Controls:**

```
README figure changed to 3.2 MB   FAIL  says 3.2 MB and this measures 8.11 MB
the jsep runtime swapped in       FAIL  11.15 MB over the wire, over the 10 MB budget
                                  FAIL  loading the jsep build, not the plain simd build
```

**Where it stands.** `watch-it-think`: 52 open, 1 high, and that one is WE-F3,
"there is nowhere to click", which closes with the publish. Eleven gates. Seven
commits on `daily`.

**Next tick:** the remaining release work from the hiring engineer and supply
chain audits, starting with T43 and T49, the licence, which is one file and the
package metadata agreeing with it.

---

## Tick 52, 2026-09-22 05:49

**An audit tick.** Target `watch-it-think`, perspective **design eye**, its
seventh audit and the last one that judges what the visitor sees. Given
`STYLEGUIDE.md` and tokenlab's live page as the standard, and asked what the
house style would get **wrong** here as well as right.

`audits/watch-it-think-2026-09-22-design-eye.md`, 18 findings, 4 high.

**The verdict, which is about the project's own name**

A page named for motion has exactly one declared transition and it has never
once fired, while the race inside its own data changes leader eight times as you
type a single sentence and every frame of that is thrown away.

That is the finding. The page has the thing it is named after, in its data,
several times a second, and renders each change as a blink.

**The rest of the high findings**

The quantitative encoding and the brand accent are the same green, so the
hottest cell of a 98,304 cell heat map is louder than the answer. And the house
style has not reached this project: it is a cool default dark with the hue
turned green, against a sibling published yesterday in warm near black with
orange spent on exactly one thing. The one house token that has arrived is spent
on a focus ring.

**The part I asked for and would not have thought of**

It named four things the house style would get wrong on an instrument, and they
are now in `STYLEGUIDE.md` as a section of their own, because they hold for
every project here that draws data rather than prose:

- No flame on a data surface. An accent pointing at 98,304 cells points at
  nothing.
- No Teko on machine identifiers. `light.control` and `B-ROOM` are compared
  character by character and belong in the mono face.
- No `--space` inside an instrument. Section rhythm separates parts of an
  argument; inside a control panel it separates parts of one thing.
- No house face without its Greek cut, because half the samples here are Greek.

A style applied everywhere without asking is a template, which is the thing this
whole exercise is trying not to be.

**Folded in.** 18 findings as WD-F1 to WD-F18 over five roots, tasks T52 to T56,
project unfrozen. Seven audits, seven perspectives, 91 findings between them.

**Where it stands.** `watch-it-think`: 70 open, 5 high. Four of those are this
audit and the fifth closes with the publish. That is the honest cost of the last
perspective arriving late.

**Next tick:** T52. Give the page the motion its name promises: rows keyed by
intent so they survive a render, FLIP on reorder, a bar that travels rather than
jumps, and a layout that holds still while the content moves.

---

## Tick 53, 2026-09-22 06:37

**Ladder.** tokenlab green, not yet 09:00, no squash. Item 4: T52, WD-F1 with
F2 and F13. The finding that is about the project's own name.

**The transition that never ran**

`.race .bar` has carried `transition: width 260ms` since the day it was written.
The render called `replaceChildren`, so every row was a new element every time,
and a new element starts at its final width: there is nothing to transition
from. The audit found it by asking the browser for its running animations and
being told there were none.

The data was never short of drama. Typing one sentence moves the leader through
six intents:

```
assistant.cancel  volume.set  oos  timer.set  alarm.cancel  alarm.set
```

and all of it was thrown away and redrawn as a blink, several times a second, on
a page called watch it think.

Rows are keyed by intent and survive a render now. FLIP on reorder, measured in
two passes so the first write does not invalidate the reads. The leader is a
class rather than `:first-child`, because rows are ordered with `order` and the
first child is whichever intent was created first.

**And the counterpart:** the one thing that did move was the layout. The canvas
backing store is sized to the token count and its element size followed it, so
the page slid up and down under a picture that sat still. The backing store
still follows the tokens, because each cell wants whole pixels. The element is
now its column's width and does not move.

```
  ok      380 running animations observed while typing 38 characters
  ok      every race row for a given intent is the same element across renders
  ok      the leader changed 6 times
  ok      the attention field held one width, 690 px, throughout
  ok      reduced motion cuts the transition to 0.001s
```

**The third check is the one that matters.** The first two can pass on a page
that is still a blink, if the sentence never changed the model's mind. So the
gate requires the run to have produced something worth animating, or it reports
that the run proved nothing.

**Controls:**

```
replaceChildren restored   FAIL  nothing animated at any point while a sentence was typed
                           FAIL  a race row was replaced 173 times rather than updated
canvas sized by content    FAIL  the field took 3 different widths while typing
```

The first is the audit's measurement reproduced exactly: zero running animations.

**Two of the gate's own checks were wrong first.** It counted an intent dropping
out of the top six and returning as a replaced row, and failed 31 times against
a page that was behaving correctly. And it matched the reduced motion duration as
a string, reading the computed `0.001s` as a failure when that is the 1ms the
stylesheet sets: it was testing the spelling rather than the duration.

**Where it stands.** `watch-it-think`: 67 open, 2 high. T52 stays in progress:
WD-F12, the state between loading and answered, is still open under it.

**Next tick:** T53, the palette. Split the encoding hue from the accent, then
move the surface onto the house warm blacks, keeping the four exceptions the
audit named and `STYLEGUIDE.md` now records.

---

## Tick 54, 2026-09-22 07:41

**Ladder.** tokenlab green, not yet 09:00. Item 4: T53, WD-F3 with F4, F15 and
F17. The palette.

**What the audit said and what was true**

This page was the house style's opposite on every axis that mattered: a cool
default dark with the hue turned green, beside a sibling published the day
before in warm near black with orange spent on one thing. The only house token
that had arrived was spent on a focus ring.

It is the house palette now, read out of `STYLEGUIDE.md` rather than matched by
eye. Manrope and Roboto Mono self hosted, taken from tokenlab's already licence
checked subsets, and both run through `ff.py check-file` against the copy this
page actually sets, Greek and machine identifiers in one string, before being
used. That is the fourth of the styleguide's four exceptions: a house face
without its Greek cut is worse than a face nobody recognises, and half the
samples here are Greek.

**The part that is not a repaint**

The heat map and the brand were the same green, so the hottest cell of a 98,304
cell field was louder than the answer. An accent that points at 98,304 things
points at nothing. The scale is hue 235 now: cool, reading as a measurement
rather than an opinion, 170 degrees from flame so the two cannot be confused.

Flame is spent on the answer, the leading row and the focus ring. Nowhere else.

**The gate** reads the token values out of `STYLEGUIDE.md` rather than repeating
them, so the guide stays the one place the palette is written down. It checks
the scale hue against the accent for distance rather than presence. And it
checks that hue in both files that set it, because CSS cannot share a value with
canvas drawing code and the two drift in silence.

```
  ok      9 tokens match STYLEGUIDE.md exactly
  ok      the scale is hue 235, 170 degrees from flame, and CSS and canvas agree
  ok      flame appears only on the answer, the leader and the focus ring
  ok      Manrope is declared and self hosted
```

**Controls, four:**

```
a cool black instead of the warm one   FAIL  --ink is #0b0d12 and the house --ink-1 is #080604
heat map moved onto the accent hue     FAIL  --scale-hue is 235 and HEAT_HUE in main.ts is 45
canvas hue drifting from the CSS one   FAIL  the same, at 200
flame spent on a paragraph of prose    FAIL  flame is used on 1 selectors it is not reserved for
```

**A mistake in the mechanics, fixed.** I nested a python heredoc inside a git
commit heredoc, so the script text became the commit message and git sat waiting
until the call timed out. Amended with `-F` from a file, which is the way every
other commit here has been written and the way this one should have been.

**Where it stands.** `watch-it-think`: 63 open, 1 high, and that one is WE-F3,
"there is nowhere to click", which closes with the publish. Thirteen gates. Nine
commits on `daily`, which squash and push at the first tick after 09:00.

**Next tick:** T54, the attention section as information design: the tokens as a
real axis on two edges of the field, and the thumbnails labelled with their
layer, head and concentration so "find the head that watches the verb" becomes
something a reader can do.

---

## Tick 55, 2026-09-22 08:35

**Ladder.** tokenlab green, live 200. 08:31, so still not the first tick after
09:00: the squash and push is next tick, with ten commits waiting on `daily`.
Item 4: T54, WD-F8.

**The finding, and the part of it that is the real defect**

Twenty four thumbnails with no label, no order and no score, under a note
inviting the reader to find the head that watches the verb. Finding it meant
opening twenty four identical squares one at a time and remembering which was
which.

The coordinates did exist. They were in a `title` attribute, which is a tooltip,
which is information nobody has: it needs a mouse, a pause, and a guess that
there is something there worth waiting for. The missing text was not the
problem; the place it was kept was.

Each cell reads its layer and head and its concentration now, and the score
brightens with its own value so the grid sorts itself by eye. On one Greek
sentence they run 2 to 69. L6H2 at 75 and L4H3 at 3 are the same picture to a
glance and completely different heads, which is exactly what the page has been
asking people to notice with no way to do it.

The number is read from the same function the large field's caption uses, not
computed a second way, because a label computed twice is a label that can
disagree with the picture it sits on. The grid went from 44px cells to 66px to
carry the text, and that is the whole cost.

```
  ok      all 24 thumbnails carry their layer and head
  ok      concentration runs 2 to 69, so the sharp heads stand out
  ok      no coordinate lives only in a tooltip
  ok      the spoken label and the printed one agree on every cell
```

**Controls:**

```
labels back in a title attribute   FAIL  24 of 24 do not say which layer and head they are
                                   FAIL  24 keep their coordinates in a title attribute
every cell scored the same         FAIL  every thumbnail scores within 0 of every other
```

The second stops this being satisfied by printing a number. A score every cell
shares sorts nothing, and a grid of small multiples with no labels is a texture
rather than a chart.

**Where it stands.** `watch-it-think`: 62 open, 1 high, which closes with the
publish. Fourteen gates. T54 stays in progress: WD-F6 and WD-F7, the field
filling its column and the tokens as a real axis on two edges, are still open
under it.

**Next tick:** the first after 09:00, so section 4 fires. Squash the ten commits
on `daily` into one on `main` with the day's story, and there is no push because
this project has no remote yet: the squash is the release hygiene that
`check:authorship` under `RELEASE=1` demands.

---

## Tick 56, 2026-09-22 09:32

**Section 4 fired.** First tick after 09:00, so the day's work squashed onto
`main`: ten commits into one, with the day's story rather than a list of
subjects. No push, because this project has no remote yet.

Verified rather than assumed: `git diff main daily` is empty, so the squashed
tree is byte for byte what the ten commits produced. And `check:authorship` now
passes under `RELEASE=1`, which is the mode that refuses to release from a
branch with anything left behind it:

```
  ok      16 commits, one author, one spelling
  ok      no co-author trailers in the history
  ok      HEAD is on 'main' and nothing is left on daily
```

**What the day did.** Three audits landed in fourteen hours, a hiring engineer, a
supply chain pass and a design eye, and between them they found that this was
good work nobody could reach: no README, no picture, no licence position, a
default branch named after a schedule, thirteen commits crediting somebody who
did not write them, a security control that read nothing, and a page named for
motion whose one declared transition had never fired. All of that is closed.
Nine new gates, fourteen in all, and four of them caught their own mistakes
first.

**And an audit tick**, `56 % 4 == 0`. Target `watch-it-think`, perspective
**recruiter, ten seconds, not technical**, the eighth audit and the last view
nobody has taken: whether any of this lands on somebody who will not run a
command and does not know what a tokenizer is.

It is the right one to spend the last audit on. Seven passes have made the work
correct, reproducible, accessible, fast and consistent. None of them asked
whether a stranger would keep scrolling, and the project publishes tomorrow.

It has the browser, the phone viewport, and tokenlab's live page to compare
against, and it has been asked outright which of the two is the stronger first
impression.

**Next:** fold its findings in, then the remaining release work: the licence,
the publish document, and WD-F6 and WD-F7, the field and the token axis.

**The recruiter landed, and the answer was no**

`audits/watch-it-think-2026-09-22-recruiter.md`, 12 findings, 3 high.

> No, I would not keep scrolling, and it is not because the work is weak: in the
> ten seconds I give this, the screen is a file list, an empty grey box where
> the one sentence about it should be, and no way in, and the one picture that
> would have stopped me is a picture of a page that no longer exists.

**The one that is mine, from two ticks ago.** `docs/think.gif` was recorded at
tick 46, the palette was replaced at tick 54, and the README still says "That is
the real page in a real browser" over a recording that is green while the page
is now flame and blue. That is a claim the repository cannot reproduce, which is
ladder item 2, and it is the next tick.

I restyled the page and did not re-record the one picture of it. The capture
tool exists, takes ninety seconds, and it did not occur to me because nothing
fails when a GIF goes stale.

**The other two highs are about what is missing rather than wrong.** The About
box is empty, so the ten second screen has no sentence and no link. And nothing
near the top says he trained the model himself, which is the single most
impressive fact about the project and is currently reachable only by following a
link in the second paragraph.

**The comparison it was asked to make**

It would open `tokenlab` first and this second, and said it is not close: a plain
English sentence in the About panel, a clickable link, topic chips, and a
headline that means something before you finish reading it, against an empty
About box, no link in the document, and a headline that gives a parameter count
instead of a reason.

Then: "The irony is that watch-it-think is the better project. It is losing
purely on the first ten seconds, and every reason is fixable today by copying
what tokenlab already does."

That is the most useful sentence any audit has produced here. Seven passes made
this correct, reproducible, accessible, fast and consistent, and the eighth says
none of that is visible in the only ten seconds most people will give it.

**Folded in.** 12 findings as WR-F1 to WR-F12 over five roots, tasks T57 to T61,
project unfrozen. WR-F12, the profile pinning two archived batch file Caesar
ciphers instead of either repository worth reading, is queued under
`awaiting_owner`: a profile setting is outward facing and is the owner's call.

**Next tick:** WR-F2. Re-record the capture against the page that exists.

---

## Tick 57, 2026-09-22 10:36

**Ladder item 2**, a claim the repository cannot reproduce: WR-F2. The README
says "That is the real page, recorded by `npm run capture` from a real browser"
over a recording made at tick 46, under a palette replaced at tick 54.

Nothing failed, and nothing could. A GIF cannot go stale loudly, and every other
gate here reads code or numbers. It took the recruiter ten seconds.

**Re-recorded, and reframed.** Captured at 1000 wide rather than 1240 and scaled
to the same 880, so everything in shot is about a quarter larger. That audit
looked at it on a phone, where GitHub renders this image at 356 pixels, and
called it a smear. The frame is the only lever: the output width is what GitHub
renders into, and the type size is set by how much page is in shot. At 356 the
headline, the typed Greek and the flame answer now read.

3.10 MB, down from 3.85. Ten frames a second instead of twelve, sixty four
colours instead of two hundred and fifty six, two head selections instead of
three. The audit was right that a better encoder is not the fix.

**The gate.** `capture.mjs` now writes `docs/capture.json` recording the tokens
the page had when it was filmed, and `check:capture` compares them against the
page that exists.

It deliberately does not compare pixels. A screenshot diff would fail on every
sentence the model routes differently, which is most of them, and a gate that
cries wolf is a gate that gets skipped. It compares the things that make a
recording look like a different product, and it asserts the README still makes
the claim, because a gate guarding a sentence nobody is making guards nothing.

```
control: --flame changed after filming
  FAIL  --flame: filmed "#ff6a00", page is "#22c55e"
```

**Its own README check was wrong first.** It matched "real page in a real
browser", which is not the sentence in the file. It was testing my memory of the
wording rather than the wording, which is the third time a gate here has checked
a spelling instead of a fact.

**Where it stands.** `watch-it-think`: 71 open, 3 high. WR-F1 is the About box
and WE-F3 the missing link, both of which close at the push; WR-F3, that nothing
near the top says he trained the model, is the one real one left.

**Next tick:** WR-F3 with F4 and F8. The most impressive fact about this project
is that the model was trained from nothing by the author, and it is currently
reachable only by following a link in the second paragraph.

---

## Tick 58, 2026-09-22 11:35

**Ladder.** tokenlab green. Item 4: WR-F3, T58.

**The finding, in the auditor's words**

> Thirty eight of my forty candidates wrapped somebody else's model in an API
> call. I cannot tell this one apart from them in ten seconds.

The fact that the model was trained from nothing by the author sat on line 39,
in the passive voice, in a section called "What it is", after a paragraph about
quantisation. It is the single most unusual thing about this project and it was
below everything.

The README opens with it now, in the first person, and the `bslm` link is above
the picture so the claim is one click from its evidence. The page headline said
"Five million parameters, running on your machine", which is a specification
rather than a reason; it says "I trained this model. Watch it think." The
numbers moved into the standfirst underneath, still read from `meta.json`.

**A different kind of gate**

`tools/check-first-screen.mjs`. Every other gate here checks whether something
is true. This one checks whether it is **reachable**, which is a different
question and the one seven audits never asked. Being true is not the same as
being reachable, and this repository has spent fifty ticks proving the first.

It is deliberately crude. It cannot tell good writing from bad and does not try.
It asserts the claim is above the picture, in the first person, linked to its
proof; that the page says it too; that the headline fits a phone screen without
scrolling; and that the first thing under the picture is prose rather than a
shell command.

**It caught its own author immediately.** I had put the `bslm` link below the
picture, which is the finding it was written for, one paragraph further down.

```
  ok      the claim is above the picture: "### I trained this model. Here it is thinking, in your browser."
  ok      the training repository is linked above the picture
  ok      the first thing under the picture is prose
  ok      the page headline says it too: "I trained this model. Watch it think."
  ok      the headline is fully on screen at phone size
```

**Controls:**

```
claim back in the passive, below the fold   FAIL  nothing above the picture says the model was trained
headline back to a parameter count         FAIL  the page headline does not say the model was trained
```

**Where it stands.** `watch-it-think`: 68 open, 2 high, and both close at the
push: WE-F3, there is nowhere to click, and WR-F1, the empty About box. Every
finding in this project that can be fixed without publishing it is fixed.
Seventeen gates.

**Next tick:** T43 and T49, the licence, and T59, the publish document. Those
are the last things standing between this and the push.

---

## Tick 59, 2026-09-22 12:35

**Ladder.** tokenlab green. Item 4: the licence, T43 and T49, WE-F9 and WS-F9.
One of the last things standing between this and the push.

**Three gaps, and the third is the real one**

`package.json` had no `license` field, so every tool that reads it reported the
project unlicensed while the README said "Code MIT". There was no `LICENSE`
file, so GitHub's detection, which reads the file and not the prose, would have
shown nothing in the sidebar.

Then the one that matters. The supply chain audit grepped all three shipped
artefacts, the bundle, the runtime's loader and the 14.2 MB wasm binary, for
Microsoft's copyright: zero hits in all three. MIT requires its notice to travel
with substantial portions, and a third of a gigabyte of somebody else's work was
travelling without it.

**Done.** `LICENSE`, MIT, and it says the weights are excluded, because the one
thing in this project the licence does not cover is the thing a reader would
assume it does. `public/THIRD-PARTY-NOTICES.md`, served alongside the page,
because a static site has nowhere to put a notice except a file it serves.

Sixteen packages reach the browser: onnxruntime-web and onnxruntime-common under
MIT, flatbuffers and long under Apache 2.0, protobufjs and its nine modules
under BSD 3 Clause, plus guid-typescript and platform. Both fonts too, and they
differ: Manrope is OFL and Roboto Mono as Google distributes it is Apache 2.0.
Getting those two backwards is a mistake this workspace has already made once.

`private: true` stays. It stops an accidental npm publish and does not
contradict MIT: one is about a registry and the other is about terms.

**The gate derives the list from the lockfile** rather than repeating it,
because a hand written list of dependencies is a list that was true once.

```
  ok      LICENSE is MIT, names the holder, and excludes the weights
  ok      package.json, LICENSE and the README all say MIT
  ok      all 16 shipped packages are named in the notices
  ok      the runtime's copyright travels with the page
  ok      both fonts are recorded under the right licence
```

**Controls:**

```
license field removed again          FAIL  package.json says license undefined and the README says MIT
runtime's copyright taken back out   FAIL  the notice is not in the file that ships with it
one shipped package dropped          FAIL  1 shipped packages are not in the notices: platform
```

**Where it stands.** `watch-it-think`: 66 open, 2 high, both of which close at
the push. Eighteen gates. Six commits on `daily` since this morning's squash.

**Next tick:** T59, the publish document: the About description, the topics and
the homepage field, written before the push rather than after it. That is the
last piece, and then this is ready to go out.

---

## Tick 60, 2026-09-22 13:50

**An audit tick, and the ninth and last perspective.** `maintainer in six
months`, run against a project that grew 27 tools and 19 `check:` scripts in
about thirty six hours.

`audits/watch-it-think-2026-09-22-maintainer.md`, 16 findings, 5 high.

> The code I would have to change is clear and well explained; the machinery
> around it is nineteen gates, eighty seven seconds and ten browser boots, it
> cannot run in a clean clone, and I proved one of its gates reporting green
> against a page it never looked at.

**It did not take that on trust.** It cloned into a scratch directory, made a
real change, timed `npm run build` three times at 84.0, 87.3 and 89.7 seconds,
timed every gate individually, and found ten preview servers leaked on this
machine, which it then killed.

**The five highs, and every one of them is mine from the last two days**

- **The build cannot run in a clean clone.** `check:palette` reads
  `../../STYLEGUIDE.md`, which is in this workspace and not in the repository. I
  wrote that at tick 54 and was pleased with it: the guide stays the one place
  the palette is written down. It also means a stranger's `npm run build` dies
  on the second gate. This publishes tomorrow.
- **Ten gates, ten hardcoded ports, and not one checks it is talking to the
  server it started.** It demonstrated one reporting green against a page it had
  never looked at. Every one of those gates I wrote believing the server it
  spawned was the server it measured.
- **`check:install` fails the build on npm's own fix.** `npm approve-scripts`
  writes exactly the `allowScripts` block my tick 49 gate rejects. The gate
  encodes a fact about npm that npm has since made false.
- **The README describes an eight gate build.** There are nineteen and ten need
  a browser.

**And the timing answer, which is the useful one**

Eighty seven seconds, twenty npm spawns, the ten browser gates accounting for
74.6 of it, `check:layout` and `check:boot` alone 40 percent. Its answer to
whether a person keeps running that before every commit is no, and the reason is
exact: past the point where you run it because it is free, you run it because
you remember to, and the `DEP0190` warning printed ten times through the output
is already evidence nobody reads it.

The fix it names is the split this same author wrote two days earlier in
`tokenlab`: `build` is typecheck plus the file reading gates plus the bundle,
and a separate opt in `verify` starts **one** server for the whole browser pass.
Roughly 14 seconds per commit and 30 before a push.

**What it would delete**, and it was asked directly: the `allowScripts` entry in
the OWNERS map, the browser halves of `check:capture` and `check:first-screen`
which spend two Chromium boots reading seven CSS properties and one `<h1>`, nine
of the ten spawn blocks, six stale latency numbers in two comments that point at
`meta.json` as the authority while contradicting it, and one hardcoded `24`.

Then: "Nothing else. Sixteen of the nineteen gates check something real that
nothing else checks; the problem is the delivery mechanism, not the coverage."

That is the sentence worth keeping. This is the audit that was supposed to
protect the author from his own enthusiasm, and what it protected against was
not the gates but the way they are run.

**Folded in.** 16 findings as WM2-F1 to WM2-F16 over six roots, tasks T62 to
T67, project unfrozen. Nine audits, nine perspectives, 107 findings.

**Next tick:** WM2-F2. The build has to run in a clean clone, and that is the
one finding here that would embarrass this repository on the day it goes public.

---

## Tick 61, 2026-09-22 14:35

**Ladder.** tokenlab green. Item 4, and the one finding that would have
embarrassed this repository on the day it goes public: WM2-F2, T62.

**`npm run build` could not run in a clean clone.** `check:palette` read
`../../STYLEGUIDE.md`, which is in the workspace above and tracked nowhere, so
the build died on its third step with an ENOENT on every machine except this
one. I wrote that two days ago and was pleased with it, because the guide stayed
the one place the palette is written down. It also meant the build only worked
where it was written.

`house-tokens.json` is generated by `npm run vendor:tokens` and committed. The
guide remains the source of truth: when it is reachable the gate re-verifies the
vendored copy and fails on drift, naming which values moved; when it is not, it
runs on the vendored values and says so.

**Then I did what the auditor did, and it found another.** Cloning and running
`npm run check` inside the clone failed on a different gate:

```
FAIL  there is no 'main' branch
```

`git clone` checks out one branch and leaves the rest as `remotes/origin/*`, so
`check:authorship` asking for a local `main` fails everywhere except this
working directory. Same defect, second gate, and it only appeared because the
fix was tested the way the finding was found rather than by reading the diff.

Branch names now come from `git branch -a` with the remote prefix stripped, and
a missing `main` fails only under `RELEASE=1`.

```
npm run check in a clean clone EXIT=0
  note    no 'main' branch here, which is normal in a single branch clone
  note    STYLEGUIDE.md is not here, so the vendored tokens are the authority
  all nine file reading gates pass
```

**Two mistakes of my own in the mechanics, both worth recording.** My first
attempt to test the clone ran each gate as `a || b` and reported `$?`, which is
`b`'s exit code: nine gates reported `exit 0` and at least one had failed. And
the cleanup at the end of this tick was chained after an `rm` that failed on a
busy directory, so the devlog and the state file were never written and I
reported a tick that had not been recorded. Both are the same shape: a result
read through something that can swallow it.

**Where it stands.** `watch-it-think`: 80 open, 5 high. Three are the rest of
the maintainer audit; two close at the push.

**Next tick:** WM2-F4, which fails the build on the exact `package.json` block
`npm approve-scripts` writes.

---

## Tick 62, 2026-09-22 15:34

**Ladder.** tokenlab green. Item 4: WM2-F4, T63. A gate that rejects the
official fix is worse than no gate.

**It turned out to be a correction of my own work, twice over.**

The maintainer audit said `check:install` would fail the build on whatever
`npm approve-scripts` writes, because npm 11 reads `allowScripts` natively and
my gate declared that key readable only by `@lavamoat/allow-scripts`.

Checking that meant checking the premise underneath it, and the premise was
wrong. Tested in a scratch clone on npm 11.16.0 rather than argued:

```
with the block removed:
  npm warn allow-scripts 2 packages have install scripts not yet covered
    protobufjs@7.6.6 (postinstall: node scripts/postinstall)
    esbuild@0.25.12 (postinstall: node install.js)

with it restored:
  nothing, and esbuild's binary is still linked
```

So `"protobufjs": false` was genuinely stopping that script. The block was a
working control. The supply chain audit called it a security control that does
nothing, I agreed at tick 49 and deleted it, and what I actually did was remove
protection and replace it with a gate that would reject the correct
configuration.

**The lesson is not new and I keep relearning it.** That finding said "checked
four ways", and every one of those ways was a search for the string `lavamoat`.
None of them was running npm. A fact about a tool is best obtained from the
tool.

**Restored**, with `fsevents` covered as well. It is optional and never
installed on Windows, which is why npm does not warn about it here, but its
install script builds the native file watcher and blocking it on a Mac would
quietly drop vite back to polling. Allowed, with the reason written down.

`check:install` keeps the reviewed list, which was always its own idea, loses
`allowScripts` from the keys-nothing-reads map, and gains the job npm will not
do for itself: npm **warns** about uncovered install scripts, and a warning is a
thing people scroll past, so here it fails the build.

**Controls:**

```
what npm approve-scripts writes    FAIL  3 packages not covered
the block deleted, as at tick 49   FAIL  4 packages not covered
```

The second is the state I created three hours ago. The gate now catches the
mistake it was born from.

`DECISIONS.md` D11 records it, including what it cost: three hours of a
repository that publishes tomorrow having no install script policy at all.

**Where it stands.** `watch-it-think`: 79 open, 4 high. Two are the rest of the
maintainer audit, two close at the push.

**Next tick:** WM2-F1, the ten gates on ten fixed ports, none of which checks it
is talking to the server it started. One of them was proved reporting green
against a page it never looked at.

---

## Tick 63, 2026-09-22 16:39

**Ladder.** tokenlab green. Item 4: WM2-F1, T64, with F5, F6 and F9 in the same
root.

**What was wrong.** Eleven tools each started their own `vite preview` on a
hardcoded port, waited for it, and measured whatever answered. The maintainer
audit found both halves: ten servers leaked on this machine from earlier runs,
and one gate demonstrably reporting green against a page it had never started,
because something was already listening on the number it picked. `waitOn`
cannot tell those apart. It asks whether the port answers, and a stale server
from an hour ago answers beautifully.

**`tools/serve.mjs`.** The port comes from the operating system, so nobody else
can be holding it. The server must prove it is ours: the page it serves has to
be byte for byte the `dist/index.html` on disk. Cleanup works off Windows, which
`taskkill` does not, so on a Mac or in CI the servers were simply left running.

**And the split**, which is the one `tokenlab` has had since the day it was
published:

```
npm run build    typecheck, nine file gates, the bundle    87s -> 11s
npm run verify   ten browser gates, one shared server      69s
```

The audit's reasoning is the point rather than the seconds: past 87 seconds you
run a check because you remember to rather than because it is free, and a suite
people skip is worse than none because it is also believed.

**The first version had the hole in a new shape.** A gate handed `WIT_URL` used
it without checking, so the shared path trusted exactly what the fixed port path
trusted. `proveItIsOurs` is exported and runs on a handed-in URL too now. The
one exception is `WIT_LIVE`, which deliberately points at a real host.

**And the control was wrong before it was right.** Modifying `dist/index.html`
while a preview was running changed both sides of the comparison, because vite
preview reads from disk per request, so it passed and proved nothing. Serving
genuinely different bytes:

```
Error: something is answering on http://localhost:5235/ but it is not this build.
      Served 78 bytes, dist/index.html is 3749.
      This is the failure that used to pass: a server nobody checked.
```

That is twice in one tick that the first attempt at a check confirmed what I
already believed instead of testing it.

**Where it stands.** `watch-it-think`: 75 open, 2 high, and both close at the
push. Twenty gates, split into eleven cheap ones and ten that drive a browser.

**Next tick:** T65, the rest of the maintainer audit's documentation findings:
`RELEASE`, `PYTHON` and `WIT_LIVE` are documented only inside the files that
read them.

---

## Tick 64, 2026-09-22 17:58

**An audit tick with no perspective left.** All nine were used, so `D12` sets
the rule: repeat the one whose subject has changed most, scoped to what is new.
Since the first deep review at `8488859` the source has moved 898 lines in
`src/` and 5,935 across the tree, and the three rewrites at the centre of that
had never been read for correctness by anybody.

`audits/watch-it-think-2026-09-22-deep-reviewer-2.md`, 13 findings, 3 high, and
**all three highs are in work from the last two days.**

> The tokenizer rewrite is correct and I proved it over 14,474 words the gate
> never generates; the attention rewrite quietly stopped drawing half of every
> thumbnail past 44 tokens, the boot fix still loses the sentence you typed if
> you typed it before the script ran, and the new entry animation has never once
> played, for exactly the reason the commit that added it says it fixed.

**That last clause is the one to sit with.** At tick 53 I replaced
`replaceChildren` because a brand new element starts at its final state and has
nothing to animate from. Then I added an entry animation by putting a class on a
brand new element and taking it off in the same task. Same defect, same tick,
introduced by the fix for it.

**The other two.** My ImageData rewrite draws the field at one pixel per cell
and scales it into a 44 pixel thumbnail, which is a **downscale** past 44
tokens: at 61 tokens it drops 48 percent of the cells, and ten of the twenty
four thumbnails no longer contain their own strongest link. The grid whose whole
purpose is picking the interesting head is showing a different picture from the
one it is labelled with. And `touched` is set by `wire()`, so anything typed
before the script runs is still overwritten, a 1,356 ms window on a slow
connection: the tick 42 fix closed the minute and left the second.

**And the half that is not a defect, which is why a repeat pass was worth it.**
The tokenizer rewrite is correct: zero mismatches against the old scan over
14,474 words including 12,000 character ones, astral, RTL, CJK, combining marks
and tie saturated words, and eight deliberate mutations were all caught by the
project's own 3,003 word gate. The FLIP arithmetic is sound and `raceRows` is
properly bounded. The identity check in `serve.mjs` is genuinely sound, and for
a better reason than I knew: Vite hashes asset names into `index.html`, so
comparing `/` proves the whole build rather than one file.

**Folded in.** 13 findings as WD2-F1 to WD2-F13 over six roots, tasks T68 to
T73, project unfrozen. Ten audits now, and `D12` says its own reversal
condition was that a repeat pass would find nothing. It found three highs.

**Next tick:** WD2-F1. The thumbnails have been drawing the wrong picture since
tick 43, and the gate I wrote for them at tick 55 reads their labels rather than
their pixels, so it says they are fine.

---

## Tick 65, 2026-09-22 18:35

**Ladder.** tokenlab green. Item 4: WD2-F1, T68.

**The thumbnails have been showing a different picture from their label since
tick 43.** `drawField` writes one pixel per cell and scales it into the canvas.
The canvas was 44 pixels, so past 44 tokens that is a downscale with smoothing
off, which discards cells rather than blending them. At 61 tokens it dropped 48
percent of the field and ten of the twenty four thumbnails no longer contained
their own strongest link.

The grid exists so a reader can pick the interesting head out of twenty four,
and every one of those twenty four carried a concentration score computed from
the real field while showing a picture that had lost half of it.

**And the gate I wrote for that grid at tick 55 said it was fine, because it
read the labels.** That is the auditor's point and it is the more useful half of
this finding: a gate can be thorough about the wrong layer.

128 now, two whole pixels per cell at the 64 token maximum, with the CSS scaling
that down to the 58 the grid shows. The thumbnails also lose
`image-rendering: pixelated`, because on a downscale that picks one source pixel
and discards the rest, which is the same defect in a second place. The large
field keeps it: that one is an upscale.

**`check:attention` gained the half it was missing.** It types a sentence longer
than the canvas, reads the pixels, and requires a thumbnail whose score says it
is concentrated to actually contain a bright pixel.

The invariant is now stated as an invariant, the canvas is never smaller than
the field, and the first version of that check asserted the opposite: I wrote it
while the canvas was still 44, so the condition looked like a situation rather
than a rule.

```
control: the 44 pixel canvas restored
  FAIL  the thumbnail canvas is 44 pixels for a 47 cell field
```

**Looked at, not only measured.** At 47 tokens the thumbnails now show real
structure: L1H1 and L1H3 have visible diagonals, L2H3 vertical bands, L5H4 at 42
plainly different from its neighbours. Before this they were half dropped noise
that happened to be labelled correctly.

**Where it stands.** `watch-it-think`: 86 open, 4 high. T68 stays in progress
for WD2-F10, the ramp truncation.

**Next tick:** WD2-F3, the entry animation that has never run, which I
introduced in the same commit that fixed the transition that had never run.

---

## Tick 66, 2026-09-22 19:36

**Ladder.** tokenlab green. Item 4: WD2-F3, T70, with F7 and F12.

**The one I introduced while fixing its twin.** At tick 53 I replaced
`replaceChildren` because a brand new element starts at its final state and has
nothing to animate from. In the same commit I added an arrival animation by
putting a class on a brand new element and taking it off in the same task, so
the browser never saw it. Same defect, same commit, introduced by the fix for
it, and it had never run once.

Arrival is a scripted animation now, beside the travel it belongs with. A row
cancels its own animation before starting another, which stops the four
overlapping transforms the review found. And `prefers-reduced-motion` is
honoured in script as well as in the stylesheet: a person who asked for
stillness was getting one transition stopped and every scripted animation
carrying on.

**Both halves of the gate were agreeing with me.**

`check:motion` counted animations without telling the kinds apart, so "something
animated" stayed true for two days while arrivals never happened. An entry is a
`translateX` and a travel is a `translateY`, so it now requires both:

```
  ok      78 arrivals and 127 travels observed, both kinds move
```

Its reduced motion check was worse than useless. It waited 900 ms and then
counted running animations, which is long after a 320 ms animation ends, so it
reported zero whether the guard existed or not. I proved that by deleting the
guard: the gate passed. It samples every frame for thirty frames now and takes
the maximum.

```
entry back to a class added and removed in one task
  FAIL  no row was ever seen arriving
reduced motion ignored by the script
  FAIL  with reduced motion 6 script driven animations are still running
```

Neither control bit before this tick. That is the pattern the second deep review
keeps exposing: the gates were written at the same moment as the code, by the
same person, checking the thing he had just been thinking about rather than the
property he needed.

**Where it stands.** `watch-it-think`: 83 open, 3 high. WD2-F2 is the last real
one; WE-F3 and WR-F1 close at the push.

**Next tick:** WD2-F2, the sentence typed before the script runs, which the tick
42 fix left a 1,356 ms window for.

---

## Tick 67, 2026-09-22 20:42

**Ladder.** tokenlab green. Item 4: WD2-F2, T69. The last real high on this
project; the two remaining close at the push.

**The window the last fix left open.** Tick 42 stopped a sentence typed during
the 19.8 MB download being overwritten. `touched` is set by listeners
`main.ts` attaches, and cannot be set before `main.ts` runs, while the textarea
is in `index.html` and typeable from first paint. 1,356 ms on a slow
connection, measured and reproduced in both arms by the second deep review.

Asking whether the box already has something in it needs no listener, so it has
no window. One line.

**I wrote two fixes and shipped one.** The other was an inline script setting a
flag from first paint. The gate proved either alone closes the case, so shipping
both meant a non module script tag and a window global for something a condition
already covers. What the listener caught and the condition does not is typing
then clearing the box before load, and an empty box should get the sample
anyway. Deleting it was the finding of the maintainer audit applied to my own
work an hour later.

**Two things had to change to make the test possible**, and both are the kind of
detail that decides whether a test tests anything. Holding one script was not
enough: the bundle is several files and the app booted through the gap. And the
navigation had to wait on `commit` rather than `domcontentloaded`, because
DOMContentLoaded waits for module scripts and this test works by not letting
them arrive. Waiting for it hung for thirty seconds against a page that was
rendered and typeable throughout, which is exactly the state under test.

```
control: the condition removed, the state since tick 42
  FAIL  typed: "typed before the script existed"
        after boot: "turn off the kitchen lights"
```

**Where it stands.** `watch-it-think`: 82 open, 2 high, and both are WE-F3 and
WR-F1, which close the moment this is pushed. Every high finding across ten
audits that can be closed without publishing is closed.

**Next tick:** the remaining medium work from the second deep review, starting
with WD2-F5, the median that prints the first run's number, which is the one
figure that rewrite existed to stop showing.

---

## Tick 68, 2026-09-22 21:40

**The audits are mine now.** The owner's instruction: stop using agents, do the
work myself. The running subagent was stopped mid pass, and both contracts are
amended: `MAINTAIN-PROMPT.md` section 2 and `LOOP-PROMPT.md` section 6 now say
the four tick audit is a pass done by hand, one named perspective, written into
`audits/` in the brief's format.

Worth recording plainly: the owner's standing rule already said passes are done
by hand unless he asks for subagents. His first message on this workspace asked
for agents to audit, which is what authorised ticks 28 to 68. That authorisation
is withdrawn, and the general rule takes over again.

**So this tick's audit is mine.** Perspective: **recruiter, ten seconds, not
technical**, a second pass against my own previous verdict of "no", per D12.

`audits/watch-it-think-2026-09-22-recruiter-2.md`, 3 findings, 1 high.

**The answer changed.** Yes, I would keep scrolling now, and the reason is the
first two lines: "I trained this model. Here it is thinking, in your browser."
That is the thing the previous pass could not find anywhere near the top.

**And then the picture under it contradicts it.** `docs/think.gif` shows the
page reading "Five million parameters, running on your machine", which is the
headline replaced at tick 58. Checked in the log rather than assumed:
`81b4d42` re-recorded the capture and `f8fdd8e`, the very next commit, changed
the headline. The picture has been one commit stale since it was made.

It is the same finding as the last pass's F2, a picture of a page that no longer
exists. And `check:capture`, the gate written in response to exactly that,
passes it: it records `--ink`, `--lift`, `--text`, `--flame`, `--flame-bright`,
`--scale-hue`, `--focus` and the body font. Eight colours and a typeface. The
headline is not among them.

The gate checks the paint and not the words, and the words were the entire
reason the finding existed.

**The other two.** There is half a screen of prose before the picture, 760
characters against `tokenlab`'s 555, and two of the four paragraphs are about
where the evidence lives rather than what the thing does. And one sentence, "so
the claim above is one click from its evidence", is the author explaining his
own structure to the reader.

**Verified rather than assumed:** the alt text says light.control at 95.6
percent and the recording shows exactly that. At the 356 pixels GitHub gives a
phone, the headline, the Greek sentence and the answer all read, so the tick 57
reframing did land.

**On the comparison:** closer than last time, and `tokenlab` still wins for one
reason that is not about writing at all. It has a link I can click. That is
WR-F1 and it closes at the push.

**Next tick:** WR2-F1. Re-record, and make the capture gate compare the headline
and the standfirst, not just the colours.

## Tick 69, 2026-09-22 22:36

**WR2-F1 closed: the picture shows the page again, and the gate now looks at the
words.** Ladder item 2, a claim the repository cannot reproduce. The README says
"That is the real page, recorded by `npm run capture` from a real browser" over
a recording of a headline the page threw away one commit later.

**The order was the point.** The gate was strengthened first and the recording
fixed second, so the failure is real rather than staged. `tools/capture.mjs` now
writes the `h1` and the standfirst into `docs/capture.json` alongside the eight
colours, and `check:capture` treats a record without those keys as no record at
all: it was made by the tool that only knew about paint, and comparing the six
keys it does have and printing "ok" is exactly the behaviour that let this
through. Run against the stale file it exited 1 with "docs/capture.json records
no headline and standfirst". That failure is the negative control. Nothing had
to be broken to produce it: the defect produced it.

Then `npm run capture`, and it passes, saying "I trained this model. Watch it
think."

**Checked rather than assumed, twice.** A gate that compares words the picture
does not contain would be claiming more than it shows, so I pulled frame 0 and
frame 32 out of the GIF and looked at them. The headline and the standfirst are
both in frame, at the top, legible. And frame 32 shows `light.control 95.6%`,
which is what the README alt text says, so that line is still true of the new
recording as it was of the old.

**The standfirst is written from `meta.json` during boot,** so the gate waits
for it to be non empty before reading it. Without that the first run after a
cold start would report drift that was only impatience, which is the class of
flake `check:motion` had when it sampled a reduced motion animation 900 ms after
it had finished.

**Gates:** `npm run build` clean, `npm run verify` 10 of 10 in 84.8s, exit 0.
`check:first-screen` independently confirms the page headline and the README
claim still agree.

**Next tick:** WR2-F2 and F3. Reorder the README to claim, picture, provenance,
and delete "so the claim above is one click from its evidence".

## Tick 70, 2026-09-22 23:31

**WR2-F2 and F3 closed: the picture is the third thing on the page again.**
Ladder item 4, the next project's release work, due inside four days.
`tokenlab` is green: last Pages run `completed success` on `d4a0da7b`, live page
200, zero open tasks, so items 1 to 3 are clear.

**The measurement.** 760 characters and eighteen lines before the recording, the
number the audit gave, confirmed by reading the file rather than by trusting it.
Now 319 and eight. `tokenlab`, the repository the recruiter said they would open
first, opens in 555.

**The order is now claim, picture, provenance.** The two paragraphs about where
the evidence lives moved under the recording, and "so the claim above is one
click from its evidence" is deleted. It was the author explaining his own
structure to the reader, which is the whole of F3.

**The fork, D13.** `check:first-screen` asserted the `bslm` link was above the
picture, a rule I wrote after the first recruiter pass, so the finding and the
gate contradicted each other. What that rule bought was position, and position
above the picture costs every reader the picture. The link is now required in
the opening section, defined as everything before the first horizontal rule,
and a new rule caps the prose above the picture at 500 characters.

**The negative control is the old file itself.** `git show HEAD:README.md`
restored, gate run: one FAIL, "there are 760 characters before the picture, over
the 500 budget", exit 1, with every other assertion in that gate still green.
Nothing had to be staged and nothing else moved.

**Caught while verifying.** The gate counted characters straight off disk and
read 327 here, where the checkout is CRLF, against 319 in CI. A budget that
moves with the checkout fails on one machine and passes on the other. Line
endings are normalised before the count, and it now reads 319 on both.

**Looked at, not assumed.** The README was rendered through GitHub's own
markdown API and screenshotted at 1280 and at 390. At desktop width the
recording starts 265 pixels down. On the phone the whole picture sits inside the
first screen with the headline in it legible. That is the first time the
opening has been seen as a reader sees it rather than counted.

**Gates:** `npm run build` clean, `npm run verify` 10 of 10 in 70.5s, exit 0.
`check:claims` unchanged, since nothing was deleted, only moved.

**Next tick:** T66, the six stale latency numbers in two comments that
contradict `meta.json`. Tick 72 is an audit.

## Tick 71, 2026-09-23 00:25 to 01:05, a build day

**The cadence changed and `watch-it-think` published the same day.** The owner
set one publication every two days: day one builds and publishes, day two
refines with one to three pushes, and left the order to me. D14 and D15 record
both.

**What the cadence actually forces, written into the contract rather than left
as an intention:** nothing enters the queue that cannot be built and published
in one day. So the three Instagram cards in `KNOWLEDGE-PLAN.md`, one to two
weeks each, are not queued as three projects. They are decomposed into stages
that each stand alone as a publication, with their own claim, picture, number
and gates. A stage that is a down payment on the next stage is half a project
wearing a release as a disguise, and it goes back to be scoped.

**The order I chose inverts my own plan on purpose.** That plan put the gateway
first because the other two call providers through it. Under a two day cadence
that reasoning flips: the gateway is the only one of the three needing a
measurement run before anything can be built, and the two needing no run at all
reuse code already shipped here. `chunkline` is `tokenlab`'s tokenizer engine
pointed at chunk boundaries. `agentscope` stage one needs no run whatsoever
because its dataset is this workspace's own 70 ticks. So those go second and
third, and the gateway goes fifth with four refinement days to run its drill.

**Published.** `github.com/Broikos-Nikos/watch-it-think`, public, 29 commits,
every one authored Nikos Broikos with no trailer anywhere. Live at
`broikos-nikos.github.io/watch-it-think/`.

**The About box was populated at creation, not after.** That is WR-F1, found on
`tokenlab` when it was already public: a repository with no description is one
word on a profile listing and the listing is read first. `docs/PUBLISH.md` was
written before the push with the description, the ten topics and the link line,
and the description deliberately carries no number, because a description lives
where `npm run build` cannot reach it and would go stale with nothing failing.

**The deploy workflow is the one thing this project never had.** Nineteen gates
before anything deploys: nine in `npm run build`, ten in `npm run verify`. The
two jobs that run `npm ci` and `playwright install`, which execute other
people's postinstall hooks and install system packages as root, hold
`contents: read` and nothing else. Granting deployment credentials to those and
then promising in the header that nothing deploys unless the gates pass is a
guarantee contradicted by the lines above it, which is why `tokenlab`'s workflow
was written that way and why this one copies it.

**It passed on the first attempt**, which `tokenlab` did not: that one failed
twice, on fontTools and then on fontTools without the `[woff]` extra. Build and
verify both green on a clean runner, ten browser gates driving ONNX in headless
chromium against a server proved byte for byte against `dist/index.html`.

**Verified on the live page, not on localhost.** 200, the model answers in 2.5
seconds at 1280 and 1.0 at 390, `σβήσε τα φώτα στην κουζίνα` resolves to
`light.control` at 95.6 percent, which is what the alt text and the recording
both say, and no page or console errors at either width.

**WE-F3 closed, and it could not have been closed any other way.** The finding
was "there is nowhere to click", open since the first audit, and the recruiter
ranked `tokenlab` above this project twice for that reason and for nothing to do
with either README. The link sits directly under the claim, so "I trained this
model" is still the first sentence and the link is the next thing the eye lands
on. 412 characters above the picture, under the 500 budget set yesterday.

**The gate that keeps it there** asserts the live link is above the picture, and
checks its shape rather than fetching it. A gate that requests its own Pages URL
cannot pass on the first push, because the deploy that would serve it is waiting
on that gate, and a gate that cannot pass the first time it runs gets deleted
rather than fixed. Against the README as published forty minutes earlier it
fails with the finding in its own words.

**The contract gained a line while being followed.** Section 4 said a build day
is one push. The live URL does not exist until the first push has deployed, so
the line carrying it cannot be written before then. The build day is now two
pushes and never a third, and the second carries the link and nothing else.

**Open:** `license: NOASSERTION` on the repository, so GitHub has not recognised
the MIT file yet. Detection runs asynchronously after a push, so this may
resolve on its own; if it has not by the refinement day it is a finding. Also
noted, not touched: `tokenlab`'s LICENSE says Nikolaos Broikos and this one says
Nikos Broikos. Two public repositories disagreeing about the author's name is
the owner's call, not a bug to fix quietly.

**Next:** 24 September is a refinement day. First audit on the published page,
one to three pushes, and the offline groundwork for `chunkline` on the 25th.

**Tick 71, addendum, 01:20.** The licence, found by checking rather than by
waiting.

I recorded "license: NOASSERTION, detection runs asynchronously, may resolve on
its own" as an open item. It would not have. `tokenlab` showed `MIT` on the same
API call, and the diff between the two files was three lines appended to the
bottom of this one: the weights exclusion, added in good faith. GitHub's
classifier reads the whole file and will not name a licence it does not
recognise, so the sidebar of a repository whose two most borrowable pieces are a
tokenizer port and an attention witness read as unlicensed.

The sentence was also false as written. "The model weights are not distributed
under this licence and are not in this repository", with
`public/model/router.int8.onnx` five megabytes away in the same tree. The README
already drew the distinction: the checkpoint and the held out set are not here,
the int8 graph is.

**`check:licences` caused it.** It required that sentence to be present. Third
time a gate here has checked spelling rather than the fact underneath it, and
the first time one has actively required the defect. It now compares against the
canonical MIT text and fails on anything appended, naming the characters: "there
are 124 characters appended after the MIT text", exit 1 against the file as
published.

**A control that proved nothing, worth recording because it nearly shipped.** I
ran the new gate by stashing, which reverted the gate along with the licence, so
the old gate ran against the old file and printed ok. I read "ok" as the control
passing when it was the experiment not having been performed. A control moves
one thing. Restoring only `LICENSE` from `HEAD` gave the real failure.

**Not pushed.** The build day's ceiling is two and both are spent. It sits on
`daily` as `350e630` and goes out as the refinement day's first push, which is
the ceiling working rather than the ceiling being inconvenient: the page is up,
the licence file is still the MIT text, and nothing a visitor touches is wrong.

## Tick 72, 2026-09-23 01:25, the audit, by hand, against the live host

**Perspective: performance and access, repeated.** Ninth perspective rather than
a tenth, per D12, and the strongest case for a repeat this workspace has had:
the subject changed completely five hours ago. Every previous performance pass
measured `vite preview` on localhost. `WIT_LIVE` has existed in
`check-weight.mjs` since it was written and had never been pointed at anything.

`audits/watch-it-think-2026-09-23-performance-access-2.md`. Four findings, two
high.

**F1, closed the same tick.** The footer said "5.28 MB over the wire" on every
visit. 5.28 is `meta.json`'s record of the int8 graph on disk. The host sends
that file as 4.33 MB gzipped, and a first visit is 8.23 MB across ten requests,
so the sentence overstated the file by 22 percent and understated the visit by
35. The README's version of the identical claim was right the whole time because
`check:weight` holds it to a measurement, and the page's version was never
gated. The measurement existed and the gate existed and nobody pointed one at
the other.

Fixed by summing `encodedBodySize` over the resource timings, so the figure is
what that visitor received on that connection, honest for the same reason the
load time beside it has always been honest. The gate asserts the page against
its own browser rather than against the gate's total, because under
`vite preview` nothing is compressed and the browser really does receive 18.74
MB. "Print what you downloaded" is true on every host and needs no tolerance.
Control against the published page: "the page says 5.28 MB over the wire and its
own browser received 18.74 MB", exit 1.

**F2, open, and it is the product.** 41.2 seconds to first answer at 1.6 Mbit
and 150 ms, which is a phone on a train. First paint is 0.6 seconds, so the page
looks finished and the box is typeable, and then nothing happens for forty
seconds with no progress shown anywhere: `src/main.ts` has no loading state at
all besides the error string. A page called `watch it think` spends its first
forty one seconds looking broken, and every audit before this one measured 0.9
seconds and called the weight fine, because every audit before this one measured
localhost.

**F3, open.** The deployed bundle cannot be reproduced here. Live ships
`index-DpXcPSpC.js`, a clean build here produces `index-B7YaV7cs.js`, because
there is no `.gitattributes`, `core.autocrlf` is true, and `src/main.ts` carries
660 CRLF endings in this checkout and none on the runner. `attention.ts` has
none, so the repository is already inconsistent with itself. It also means
`serve.mjs`'s byte for byte identity check makes `WIT_URL` unusable against the
live host, so the nineteen gates cannot be run against production from this
machine, which is exactly what this audit wanted to do.

**F4, low.** `Cache-Control: max-age=600`, which the host sets and a static site
cannot change. Measured rather than assumed: inside the window a repeat visit
costs zero network and answers in 0.4 seconds; outside it, ten conditional
requests returning 304 with 0 bytes. The interesting fix is a service worker,
because a page claiming the model runs on your machine could then prove it by
working in aeroplane mode.

**What the live host settled, and this is knowledge rather than a finding.** The
gzip premise was an argument from another site's headers and it held: wasm 14.24
to 3.72, onnx 5.28 to 4.33 under `application/octet-stream`, woff2 sent
uncompressed because it already is. Predicted 8.1 MB, measured 8.23. And access
is clean on the real page: 56 tab stops in 60 presses with every one visibly
marked, zero animations under `prefers-reduced-motion`, 25 of 25 canvases
labelled, and `scrollWidth` equal to `clientWidth` at 390.

**Not pushed.** Build day, both pushes spent. `350e630` and this sit on `daily`
for tomorrow's first push.

**Next:** F2. Progress during the download, which closes the oldest open theme
in this project and is the only finding here that a visitor can feel.

## Tick 73, 2026-09-23 01:40, build day, ladder item 3

**Build day, and the build shipped at 01:05.** D15 puts `watch-it-think` on
today. Both pushes are spent, so this and everything after it today lands on
`daily`. Both published pages 200, both last deploys `completed success`, so
items 1 and 2 are clear and this is item 3: an open high on a published project.

**WPA2-F2, the 41 seconds. But first, the finding was wrong and I corrected it
before building on it.** It said "there is no progress indicator anywhere in
`src/main.ts`. The only state the page can enter besides answered is the error
string", and that the visitor sees a placeholder reading "type something". Both
false. `index.html:39` ships `<p class="status" data-status>loading the
model</p>`, so the page says it is loading from first paint, and "type
something" replaces it afterwards. I read `src/main.ts` for a loading state,
found none, and never looked at the markup that renders before any script runs,
which is the same error as measuring localhost and calling it the visit. The
audit file and its verdict line are corrected in place and say so.

What survives is narrower and still high: 41 seconds of three static words, no
size, no progress, no way to tell a slow download from a stalled one.

**The fix.** The graph is fetched in `Router.load` rather than by onnxruntime,
because `InferenceSession.create(url)` fetches internally and reports nothing.
The reader counts bytes and the line says "downloading the model, 2.0 of 5.3
MB", four times a second, with `role=progressbar` and `aria-valuenow`.

**The total comes from `meta.json` and not from `Content-Length`,** which is the
part worth writing down. The host sends this file gzipped, so `Content-Length`
is 4,331,506 while the stream delivers 5,284,077 decompressed. Dividing one by
the other runs the bar to 122 percent and then stops.

**`check:palette` caught me spending the accent on furniture.** The bar was
flame and the gate named the selector: the accent is reserved for the answer,
the leader, focus and selection, "the question is not how much orange there is,
it is what the orange is pointing at". It is neutral now. The gate was right and
I was not.

**Two assertions in the new gate were wrong before they were right, and both in
the same way:** they measured the page being built rather than the bar arriving.
First a 393 pixel shift that was the verdict rendering, then a 319 pixel one
that was `wire()` appending the sample chips. The resting position is now taken
after the page has assembled. An assertion that cannot tell the page growing
from the bar shoving gets muted rather than fixed, so it is worth the two
attempts.

**`check:counts`, new and small.** The workflow header said "Nineteen gates" and
`docs/PUBLISH.md` agreed, and registering `check:progress` made both wrong with
nothing anywhere to say so. A number in prose that no command produces is the
oldest recurring defect here. The counts are derived from `package.json` and
`verify.mjs`, in either word order, so adding a gate fails until the prose
catches up. Twenty one now: ten in build, eleven in verify.

**Gates:** `npm run build` clean, `npm run verify` 11 of 11 in 85.1s. Controls:
"the line showed 0 progress states during the download" against the page as
published, exit 1; "twenty one, the total; ten near npm run build; eleven near
npm run verify" against the stale header, exit 1 read without a pipe in the way.
Looked at in a browser mid download at 1280 and 390.

**Next:** tomorrow is a refinement day. First push is `350e630`, the licence,
then `e0c9f0a` and this. Then WPA2-F3, the `.gitattributes` that makes the
deployed bundle reproducible, and the offline groundwork for `chunkline`.

## Tick 74, 2026-09-23 02:40, build day, ladder item 3

**Still the build day**, D15 puts `watch-it-think` on the 23rd, it published at
01:05 and both pushes are spent, so everything lands on `daily`. Both live pages
200, both last deploys green, so items 1 and 2 clear again and this is item 3:
WD2-F1, the last open high on a published project.

**Half of it was already fixed and I checked rather than assuming.** The finding
is that thumbnails past 44 tokens drop half their cells to point sampling. The
canvas had already been raised from 44 to 128, which at the 64 token ceiling
gives every cell two whole pixels and removes the downscale entirely. So the
visible defect was closed. What was not closed is that it was closed **by a
number in a caller**, and `drawField` is exported with two of them.

**So the fix went into the function.** When the destination really is smaller
than the field, it max pools instead of point sampling. Max rather than mean on
purpose: averaging keeps every cell but divides a lone strong link by the size
of its block, and a grid of 24 thumbnails exists to be scanned for exactly that
kind of link. Pooling the maximum drops nothing, dims nothing, and makes the
assertion an equality rather than a tolerance.

**`check:draw` gains the half the review asked for and nothing had.** At a full
64 position context, every thumbnail's brightest pixel is as bright as the same
head on the large canvas. Three measurements rather than an argument:

```
point sampling, 44 pixel canvas    9 of 24 dimmer, exit 1
max pooling,    44 pixel canvas    24 of 24 pass, exit 0
max pooling,   128 pixel canvas    24 of 24 pass, exit 0
```

The first reproduces the audit's 10 of 24 at 61 tokens, at 64. The second is the
whole point: the canvas size is no longer load bearing.

**The new half was wrong twice before it was right, and both times it would have
passed while testing nothing.** It first ran on half two's 44 position sentence,
where a 128 pixel canvas cannot downscale. Then it counted `.word` elements as
positions, which undercounts because the tokenizer splits words, so it reported
57 for a field that was 64 and refused to run. It counts `.axis-token` now, the
way half two always did. A gate that passes because it never reached the
condition is the defect this repository has written down three times.

**Gates:** build clean, verify 11 of 11 in 86.7s.

**Next:** four commits wait on `daily` for tomorrow's first push. Then WPA2-F3,
the `.gitattributes`, and `chunkline`'s groundwork for the 25th.

## Tick 75, 2026-09-23 03:40, build day, ladder item 4

**No open highs left on either published project**, so the ladder falls to item
4: the next project's release work, due inside four days. `chunkline` is the
25th. Both live pages 200, both deploys green.

**The premise was measured rather than assumed, which is the whole point of
doing this two days early.** D14 says nothing enters the queue that cannot be
built and published in one day, and a one day build only works if the thing it
argues is already known to be true. `specs/chunkline-premise.mjs`, against
`tokenlab`'s forty hand written English and Greek pairs, chunked at 512 tokens
with the `gpt-4o` tokenizer:

```
en  2,943 chars  552 tokens  5.33 chars/token  2 chunks  0 of 1 boundaries mid sentence
el  3,194 chars  1,143 tokens  2.79 chars/token  3 chunks  2 of 2 boundaries mid sentence
```

Greek needs **2.07 times the tokens** for the same content. At the same budget a
Greek chunk carries **1,065 characters against English's 1,472**, so Greek gets
72 percent of the context for the same spend. The English boundary lands after a
full stop. The first Greek one lands inside the word `ημερομηνίας`, splitting it
into `ημερομην` and `ίας`, which is a retriever embedding half a word as a unit
of meaning. That is the picture the page draws and it now exists as a fact.

**The honest limit, found by looking at the n rather than at the result.** Three
boundaries in total cannot carry a claim about how often Greek cuts mid
sentence. So the headline number is the character ratio, computed from totals
and stable at this corpus size, and the boundary rate gets a second, larger,
non parallel sample on the build day or it is not claimed at all. The ratio
needs alignment and cannot use a large sample; the rate needs volume and cannot
use an aligned one. Two corpora, both stated, is the design rather than a
compromise.

**`specs/chunkline.md`** holds all of it: the claim, the measured premise, the
corpus decision, what moves on the page, the number written before the code, the
six things that carry over from `tokenlab` and `watch-it-think`, the two gates
this project needs, and the three risks with what each one costs.
`PROJECT-IDEAS.md` now carries the queue as it actually runs.

**Fixed while writing it:** the probe imported `gpt-tokenizer` by bare name and
read the corpus by relative path, so it ran only with `projects/tokenlab` as the
working directory. That is the same defect as a gate assuming somebody already
started a server, and it would have surfaced on the build day at the worst
moment. It resolves both from its own location now and runs from anywhere.

**Next:** four commits still wait on `daily` for tomorrow's first push. Then
WPA2-F3, the `.gitattributes`.

## Tick 76, 2026-09-23 04:40, the audit, by hand, against the live page

**Perspective: the hostile stranger, repeated.** Ninth repeated rather than a
tenth, per D12, and the subject changed: every previous hostile pass ran against
`vite preview` on localhost on a project nobody could open. There is a live URL
now. Two of the seven cases were run against the build sitting on `daily` as
well, because shipping a hand written download path unattacked is this
perspective's whole job missed.

`audits/watch-it-think-2026-09-23-hostile-stranger-2.md`. Four findings, one
high, and the high is code I wrote three hours ago.

**F1, high, and it is mine.** Go offline mid download on tomorrow's build and
the catch writes "The model did not load" into a line still carrying
`role="progressbar"` and `aria-valuenow="5284077"`. A screen reader is told a
completed progress bar while the text inside it says the thing failed. The
cleanup sits after the `await` inside the `try`, so a throw skips it. It belongs
in a `finally`, and `check:progress` needs a fifth assertion whose control is
this run.

**F2, medium.** No `<noscript>` anywhere in `index.html`, so a visitor with
javascript off reads `loading the model` and will read it forever. That string
was chosen to reassure somebody who is waiting, and this is the one case where
it is a lie, told to the people most likely to have javascript off deliberately.

**F3, medium.** Three ways of breaking the download, three messages: "Failed to
fetch", which is fine; "Can't create a session. ERROR_CODE: 7, ERROR_MESSAGE:
Failed to load model because protobuf parsing failed", which is what a truncated
download looks like from inside onnxruntime; and "no available backend found.
ERR: [wasm] TypeError: Failed to fetch dynamically imported module". All three
are the same connection problem and only the lucky one says so.

**F4, low.** "Reloading is worth a try" with nothing to click.

**What held, and it is most of it.** Seventy thousand repetitions pasted in one
event: 3.5 seconds, still answering, bound holding at 64 positions, zero console
errors. Arabic, a zero width space, an LRM, a NUL, an ANSI escape, the Greek
flag, a four person family emoji, U+FFFD and two hundred stacked combining
acutes: answered, console empty, horizontal overflow exactly zero. A killed
model request is reported honestly in the first person with a remedy.

**Nothing fixed this tick**, per section 2: an audit tick folds findings in and
fixes nothing. F1 is the next tick and it is due before tomorrow's push.

## Tick 77, 2026-09-23 05:40, build day, ladder item 3

**WHS2-F1, closed before it could ship.** The high from the audit an hour ago,
and the only one of its four findings that would have published a regression
rather than an existing gap. Both live pages 200, both deploys green.

**The fix.** The cleanup that takes the progress attributes off the status line
sat after the `await` inside the `try`, so a throw skipped it and the catch wrote
"The model did not load" into an element still carrying `role="progressbar"` and
`aria-valuenow="5284077"`. It is a `finally` now. It also removes
`aria-valuemin` and `aria-valuemax`, which the original missed **on the success
path as well**: the audit found two leaked attributes and there were four.

**The gate's first version was green against the broken code, and that is the
part worth recording.** I wrote the fifth assertion to abort
`router.int8.onnx`, ran it against the defect, and it passed. Aborting the graph
throws inside `fetch` before `onProgress` has ever been called, so no attributes
were ever set and there was nothing left behind to find. The assertion was not
wrong about what it asserted; the condition simply never happened. That is the
fourth time this repository has written that defect down, and the first time I
caught it by running the control rather than by an audit finding it later.

It kills the wasm runtime instead, which reproduces what the hostile pass
actually saw: the graph arrives, the bar reaches 5,284,077, and then
`InferenceSession.create` throws. Against the cleanup in its old place: "the
failed download left role, aria-valuemin, aria-valuemax, aria-valuenow,
--progress on the status line", exit 1.

**Gates:** build clean, verify 11 of 11 in 86.3s.

**Next:** five commits on `daily` for tomorrow's first push. Then WHS2-F2, the
`<noscript>`, and WPA2-F3, the `.gitattributes`.

## Tick 78, 2026-09-23 06:40, build day, ladder item 4

**The second corpus, built two days early, and it overturned the claim the
build was going to make.** No open highs on either published project, both live
and green, so the ladder falls to item 4: `chunkline`, due the 25th. Its spec
listed the larger corpus as risk 2, the thing most likely to eat the build day.

**What it is.** `specs/chunkline-corpus.mjs`: four Wikipedia articles per
language on the same four topics, written independently in each language rather
than translated, CC BY-SA, each recorded with its revision id and fetch date,
because a live article is a moving target and a measurement against "the
Thessaloniki article" is one nobody can repeat. Prose only, because
`explaintext` leaves section headings as bare lines and counting a heading as a
boundary that failed to land on punctuation would inflate the exact number the
corpus exists to measure.

```
en  256,424 chars  53,935 tokens  4.75 chars/token  105 boundaries   99 mid sentence 94.3%   90 mid word 85.7%
el  221,703 chars  84,017 tokens  2.64 chars/token  164 boundaries  164 mid sentence 100%   156 mid word 95.1%
```

**And the spec I wrote three ticks ago is wrong.** It said the English
boundaries settle between sentences and the Greek ones do not. That was true of
the three boundaries the small corpus had. On 269 of them, both languages cut
mid sentence almost always: 94.3 percent against 100. A hard token count has no
reason to land on punctuation in any language, and the one clean English
boundary was one boundary that got lucky.

**What survives is better than what it replaces, and both corpora agree on it.**
The ratio holds: 5.33 against 2.79 characters per token on the aligned pairs,
4.75 against 2.64 here, so Greek gets 52 to 56 percent of the text per token
whichever is asked. And the real difference in boundary quality is mid word
rather than mid sentence: **85.7 percent of English boundaries land inside a
word against 95.1 percent of Greek ones**, on 269 boundaries. Greek tokens are
shorter, so a cut is likelier to fall inside a word.

**So the page changes shape before it is built.** It is about how much less text
fits, not about where the cut lands. The boundary quality difference becomes a
footnote with a number on it, and the context loss is the thing a reader can act
on. `specs/chunkline.md` carries the correction as section 2b with the withdrawn
framing named rather than quietly edited out, and `PROJECT-IDEAS.md` matches.

**The lesson is the general one and it is why premises are measured before build
days at all:** a number from n=3 is a story, not a finding. Had this been
measured on the build day, the page would have been half built around it.

**Next:** five commits on `daily` for tomorrow's first push. Then WHS2-F2, the
`<noscript>`.

## Tick 79, 2026-09-23 07:40, build day, ladder item 4

**The passage `chunkline` will draw, chosen by a rule and frozen, and the first
length was wrong.** No open highs, both published pages live and green, so item
4 again: the 25th is two days away.

**The rule before the run, because whoever picks the passage picks how dramatic
the page looks.** Of the four topics in the corpus, take the one whose
characters per token ratio is nearest the ratio of the whole corpus, so the page
shows a typical case rather than the widest gap. It chose `history`, the
Byzantine Empire articles, at 1.779 against the corpus 1.799. The three it
rejected are in `chunkline-passage.json` with their distances: science 0.123,
technology 0.145, city 0.162. Both passages are pinned to a revision id,
`1376133687` and `11844525`, because a live article is a moving target.

**The length was measured and the first answer failed at the only budget the
page quotes.** At 2,400 characters the passage reads nicely and draws three
English rules at 128 tokens, one at 256 and **none at all at 512**: the headline
picture was a single Greek mark against an empty English column. At 12,000 the
whole slider works, 5 English rules against 8 Greek at the 512 default, 20
against 35 at 128. That is the difference between a page that makes its point
and a page that does not, and it cost twenty minutes here instead of a morning
on the build day.

**One thing the rule surfaced that eye picking would have hidden:** the Greek
`Photosynthesis` article has only 4,112 characters of prose against the English
11,925, so `science` would have put two columns of very different length side by
side. The rule rejected it for an unrelated reason and the check came free.

**A correction to the spec's own wording.** It said "the same passage in English
and in Greek". They are not the same passage and cannot be: they are two
articles on one subject written by speakers of each language, which is what
makes the comparison about writing systems rather than about a translator. The
page says so in the caption rather than in a footnote, and the parallel corpus
stays where it belongs, on the ratio, because at 2,943 characters it cannot draw
a column.

**Risk 1 is now the largest**, since the passage grew fivefold: setting two
scrolling columns is a typography job. Mitigation recorded: the rules are
positioned against character offsets `chunkline-passage.json` already holds for
every budget, so nothing is computed on the build day that is not computed now.

**Next:** five commits on `daily` for the first push after 09:00. Then WHS2-F2,
the `<noscript>`.

## Tick 80, 2026-09-23 08:40, the audit, by hand, against chunkline's numbers

**Perspective: the measurement auditor.** First audit on `chunkline`, so no
perspective had been used on it. Measurement because every figure in
`specs/chunkline.md` was produced in the last three ticks by scripts written in
the same hour as the claims they support, and the page is two days out. Both
published projects live and green, no open highs.

`audits/chunkline-2026-09-23-measurement.md`. Three high, one low, and the low
is a null result worth keeping.

**F1, and it is a factor of nine.** The mid word test asked whether a chunk
**ends** with a letter. That is not a cut inside a word: the next chunk can
begin with a space, in which case the boundary fell cleanly between two words.
Testing both sides:

```
en  105 boundaries  ends with a letter 88 (83.8%)  actually inside a word 10 (9.5%)
el  164 boundaries  ends with a letter 155 (94.5%) actually inside a word 92 (56.1%)
```

The spec was about to publish 85.7 against 95.1, a nine point difference that
reads as noise. The real figures are 9.5 against 56.1, a factor of six, **and it
has a mechanism**: these tokenizers attach the leading space to the following
word, so an English boundary usually lands where a word starts, while Greek
tokens are sub-word fragments without that space and the cut lands inside a word
more than half the time. The wrong number was burying the project's own finding.

**F2.** "Greek needs 2.07 times the tokens" bundles two effects. The Greek side
of the aligned corpus is 3,194 characters against 2,943, so it is 8.5 percent
more text before any tokenizer touches it. The tokenization effect alone is 1.91,
the characters per token ratio. Both numbers are in the spec and nothing
distinguishes them, so the more impressive one takes credit for the writing as
well as the tokenizer.

**F3.** The headline ratio is a property of one tokenizer and the spec does not
say so. Same corpus: `gpt-4o` 1.802, `gpt-4` and `gpt-3.5-turbo` 4.091. On
`cl100k` Greek gets **24 percent** of the text per token, not 55. The spec's own
gate list already contains `check:conditions` to catch exactly this in the
README, and its own prose fails it. It also turns the tokenizer picker from a
nice control into the second half of the argument: the newer vocabulary closes
more than half the gap.

**F4, a null result kept on purpose.** The 80 character line filter could have
been carrying the whole result. It is not: English loses 4.0 percent of its
characters to it, Greek 4.5, half a point apart.

**Nothing fixed this tick**, per section 2. F1, F2 and F3 are the next tick and
all three are corrections to a spec rather than to a published page, which is
what auditing two days early buys.

## Tick 81, 2026-09-23 09:40, build day, ladder items 2 and 4

**The three measurement findings closed, all of them in a spec rather than on a
page.** Ladder item 2 and item 4 landed on the same task: `chunkline`'s spec
carried numbers its own audit had just disproved, and it publishes in two days.
Both published projects live and green. Five commits still on `daily`, because
the build day's two pushes are spent and the first refinement push is tomorrow.

**CM-F1, the factor of nine.** The mid word test asked whether a chunk ends with
a letter. It now asks whether the chunk ends with a letter **and the next one
begins with one**, which is what a cut inside a word actually is. The corrected
figures, and they are the strongest thing this project has measured:

```
o200k    en 105 boundaries   9.5% mid word   |  el 164 boundaries  56.1% mid word
cl100k   en 108 boundaries  17.6% mid word   |  el 383 boundaries  73.6% mid word
```

A factor of six, with a mechanism: these tokenizers attach the leading space to
the following word, so an English boundary usually lands where a word starts,
while Greek tokens are sub-word fragments carrying no leading space. The wrong
test had reported 85.7 against 95.1, which reads as noise and was burying the
finding.

**CM-F3, the condition that moves everything.** The corpus script now runs every
claim through both vocabularies and records them side by side. Same text: on
`o200k` Greek gets 55.6 percent of the text per token, on `cl100k` 24.5. The
Greek side is 84,017 tokens on one and 196,219 on the other. Every sentence in
the spec names its tokenizer now, which is what `check:conditions` was already
listed to enforce in the README and what the spec's own prose was failing.

That promotes the tokenizer picker from a control to the second half of the
argument: moving to a current vocabulary closes the gap from 4.09 to 1.80, which
is the one thing on this page a reader can act on the same afternoon.

**CM-F2, two effects in one number.** "Greek needs 2.07 times the tokens" is
true of the aligned pairs and is partly how the Greek sentences were written:
that side is 3,194 characters against 2,943, 8.5 percent more text before any
tokenizer touches it. The tokenization effect alone is 1.91. Both are stated
now, separately, with the difference named.

**Fixed while there:** the passage script read `corpus.rates.en.charsPerToken`,
which stopped existing when the corpus grew a tokenizer dimension. It names
`o200k` explicitly now and records it in the output, so the passage and the
headline are conditioned on the same vocabulary. Selection unchanged: `history`,
1.779 against the corpus 1.799.

**Next:** tomorrow is a refinement day. First push carries the five commits, then
WHS2-F2, the `<noscript>`.

## Tick 82, 2026-09-23 10:40, build day, ladder item 2

**A number that had been in the README since the caveat was written, that
nothing could check.** The ladder sent me to item 5, the oldest open medium,
which was WM-F6: report the majority baseline beside the 97.28 percent tag
accuracy. It was already reported and had been for days, so T25 was stale like
T68 was. What the finding actually left behind was worse and outranks it: the
baseline, **74.98 percent**, is a number no command in this repository produces,
which is ladder item 2 and a direct breach of section 6 of the contract.

**It cannot be made reproducible here and I checked rather than assumed.**
`meta.json` records accuracy but not the tag distribution. Putting it there
means re-running `tools/quantize.py`, which needs the checkpoint and the test
set, and `meta.json` itself records both as `obtainable: false`.

**So the decision was between deleting it and pinning it, and deleting it is the
wrong trade.** 74.98 is what makes 97.28 readable rather than impressive.
Removing it to satisfy a rule about reproducibility would take the caveat off
the page and leave the flattering figure standing alone. The rule exists so
numbers cannot drift silently, and pinning gets that without losing the number.

`docs/upstream.json` holds it with the file it was measured against, that file's
sha256, the method, the audit that found it, and the condition under which the
entry gets deleted. The README says plainly that this is the one number on the
page no command here reproduces.

**`check:upstream` closes the hole rather than the instance.** Three
assertions, and the third is the one that matters: every percentage in the
README is either a `meta.json` figure or pinned upstream. The covered set is
rebuilt from `meta.json` rather than listed by hand, so it cannot drift out of
step with `check:claims`. Control, against `docs/upstream.json` emptied, which is
the state this repository was actually in: "1 percentage in the README comes from
nowhere: 74.98%", exit 1.

**Gates:** build clean, verify 11 of 11 in 119.8s. Twenty two now, eleven in
build, and `check:counts` caught the two prose counts the moment the gate was
registered, which is what it is for.

**Next:** six commits on `daily`. Tomorrow is a refinement day and the first
push after 09:00 carries them.

## Tick 83, 2026-09-23 11:40, build day, ladder item 5 and a gate that failed

**A gate went red with nothing changed, so per section 3 the tick became the
gate, and then the ladder task got done as well.** Both published pages live and
green.

**`check:input`, and two wrong fixes before the right one.** It failed at 253,
258, 269 and 278 ms against a 250 ms budget, on the committed tree as much as on
mine, so it was not my change. The docstring calls the budget "deliberately far
above what the fix achieves", and it was, when every case was 32 kilobytes or
smaller and the worst reading was 60 ms. A 128 kilobyte case was added later and
nobody revisited the number.

The first fix, a median of five, made it green at 2 ms. **That was the
tokenizer's cache answering four times out of five**: every spaces-removed case
showed a 30 to 70 fold gap between its first run and its median. I would have
shipped a gate that passed while the thing it guards had not been run. Each
repetition now uses a different string, which misses the cache and changes
nothing about the shape, and the honest median is 254 ms.

The second wrong fix is raising the budget to fit 254, which is how a budget
stops meaning anything. What the original fix achieved was turning a quadratic
scan into a linear one, and **linear is a rate**, so each case is held to
milliseconds per kilobyte now: 1.4 to 2.8 measured, 4 allowed, with the absolute
one second ceiling kept because the original disaster was 21,574 ms. Both halves
proved to bite separately.

**WM-F9, the oldest open medium, closed.** Every thumbnail divided by its own
peak, so all twenty four rendered their hottest cell at full chroma. The field
peaks for the test sentence run from **18 to 94 percent**: the head that had
learned almost nothing looked exactly as decisive as the head that had learned
the most. `DrawOptions` takes a `max`, `cubePeak` computes it once, the grid
passes it and the large canvas keeps its own.

**And the gate I wrote nine ticks ago had to be rewritten, which is the part
worth keeping.** It asserted every thumbnail was as bright as the same head on
the large canvas. That held only while both normalised the same way, and it went
wrong the moment the grid stopped: 22 of 24 are now legitimately dimmer. The
purpose survives the proxy. It was never about the large canvas, it was that no
cell is dropped and that the panels can be compared, so it now asserts the
brightest thumbnail is the head holding the strongest link and that the spread
across the grid is visible. Control: "the brightest thumbnail is head 0 and the
strongest link is in head 14", exit 1.

**The same mistake twice in one day.** The first two attempts at that control
reported green. I reverted the caller, piped `npm run build`, read the tail, and
never saw that `tsc` had failed on a now unused variable, so `dist` still held
the fixed page and the gate was measuring the thing it was meant to prove
broken. Piping a build and reading the tail hides its exit code, which is the
same family as the `a || b` masking at tick 61 and the `grep -c` at tick 46.

**Gates:** build clean, verify 11 of 11 in 236.5s. Eight commits on `daily`.

**Next:** tomorrow is a refinement day and the first push after 09:00 carries
them.

## Tick 84, 2026-09-23 12:40, the audit, by hand, over today's eight commits

**Perspective: the deep reviewer, third pass, scoped to what is new.** D12's
repeat rule, and the subject is the 1,065 insertions across 18 files that went
in between `e95ea90`, which is live, and `55ab3a5`: the streaming download, the
progress bar, max pooling, the shared grid scale, four new gates and two
rewritten ones. All of it written between 01:00 and 12:30 today and read by
nobody.

`audits/watch-it-think-2026-09-23-deep-reviewer-3.md`. One medium, two low, and
three things I expected to find that are not there.

**F1, medium, and it is one line.** Nothing ties
`meta.quantisation.bytesInt8` to `public/model/router.int8.onnx`. They agree
today at 5,284,077 and nothing asserts it. That did not matter until this
morning: `Router.load` now divides received bytes by that recorded number to
draw the bar, so a re-export that updated the graph and not the record gives
every visitor a bar that overshoots or stops short, and the only thing that would
notice is `check:progress`, through a browser, complaining about a stream ending
at the wrong number rather than about two files disagreeing.

**F2 and F3, low.** The progress callback can report more than the total if they
ever diverge, which puts `aria-valuenow` above `aria-valuemax`. And
`check:claims` still names a disk size "bytes over the wire", which is the exact
conflation fixed on the page eleven hours ago, sitting in the gate's own claim
list. No reader is misled, the README's two uses are both correct, but the next
person to read that gate is.

**Three things checked and clear, and saying so is half the value.** `cubePeak`
walks `cube.raw`, and if the model padded to `maxLen` the grid would be scaled by
a value no field displays, dimming all twenty four invisibly. It does not pad:
the tensors are `[1, ids.length]`. Hand buffering the download looked like three
live copies of 5.28 MB; measured through CDP across a whole load, **peak JS heap
5.5 MB and settled 5.3**, because the chunks are collected promptly and
onnxruntime's copy lives in wasm memory. And the pooling indices are in bounds
for every `q` and `k`.

**Nothing fixed this tick**, per section 2. F1 is the next tick and it is free.

**Eight commits on `daily`.** Tomorrow is a refinement day and the first push
after 09:00 carries them.

## Tick 85, 2026-09-23 13:40, build day, ladder item 5

**WM-F8, F13 and F15, the oldest open medium, and this time it was not stale.**
Both published pages live and green, no open highs, `chunkline`'s release work
done, so item 5: oldest audit first, which is the first measurement audit.

**All three are the same defect in three places: something transcribed sitting
where everything around it was measured.**

`meta.json` shipped the training config verbatim, carrying `dropout: 0.1`. An
exported ONNX graph has no dropout in it at all, because dropout is a training
time regulariser that leaves no node behind, so a reader was told the shipped
model has something it does not have. `config` now holds what describes the
graph and `trainingOnly` holds what describes the run. Kept rather than dropped:
it is true of the run that produced the weights.

The ship decision stopped being taken on rounded numbers. `delta` was the
difference of two values already rounded to two places and `ship_int8` compared
that to the budget. The real difference is 74.5793 minus 74.5320, which is
0.0473 and was reported as 0.05, so rounding could move the decision quantity by
0.01 either way. It cannot change this outcome, where the cost is a twentieth of
the budget, but a threshold written to be trusted at the boundary has to be
exact there.

Two pointers now point somewhere. `quantize.py` said "fp32, and the README says
why" when there was no README; there is one now and it still says nothing about
fp32, so the message names the section to write it in. `.gitignore` said "npm
run capture of the model is tools/export_onnx.py", written when there was no
`npm run capture`. **There is one now and it records the page as a GIF**, so the
sentence had gone from pointing at nothing to pointing at a real command that
does something else, which is worse.

**`check:meta` gains two assertions**, and the second is the one worth having:
"trained from random init" lives in four files sourced from one literal that no
gate touched. `meta.json`, `index.html`, `package.json`, `src/lib/router.ts`.
Four copies of a claim drift one at a time, and this is the claim the repository
rests on. Controls: dropout put back in `config` fails by name, and
`index.html` drifted to "trained from scratch" fails naming the file, both exit
1.

**Gates:** build clean, verify 11 of 11 in 123.4s. Nine commits on `daily`.

**Next:** WD3-F1, the one line tying the recorded model size to the shipped file.

## Tick 86, 2026-09-23 14:40, build day, ladder item 5

**The oldest open medium, and it had been found twice.** WH-F5 and WH-F6, from
the hostile stranger pass of 21 September, and WHS2-F2 and F3 from the hostile
stranger pass of the 23rd are the same two defects. They were found again
because the first pair was never closed. Both published pages live and green.

**With scripts off** the page said `loading the model` and would have said it
for as long as the visitor stayed, told to exactly the people most likely to
have turned scripts off on purpose. There is a `<noscript>` now, and it hides
the status line rather than sitting beside it, because two sentences that
contradict each other are worse than either.

**With the graph killed** the status line said so honestly and everything else
forgot what it was: an empty paragraph, an empty footer, and six chips that
still looked like buttons and answered nothing.

**The fix is structural and it improves the ordinary visit too.** `meta.json` is
10 KB and now loads before the 5.28 MB graph, so the description under the
headline arrives in about a hundred milliseconds rather than after the whole
download, and it is there whatever happens to the graph. A failed load disables
the box and the chips and says why.

**`check:degraded`** drives both states rather than reading the markup, because
`<noscript>` in the source says nothing about what the built bundle serves.
Against the page as it shipped, all three assertions fire.

**Its first version failed against a page that was already correct.** It read
`textContent`, which includes the status line hidden by the noscript style rule,
where its own docstring promises to read what a visitor is looking at.
`innerText` now.

**And a piped build hid its reason for the third time today.** The first control
attempt reported a failed build and I read the exit code without the message:
`check:counts` was red because registering `check:degraded` made the workflow's
prose wrong, which is exactly what that gate is for. Two of today's three
wasted controls are the same habit, `npm run build > /dev/null`, and the fix is
to print the build's own failing line rather than its exit code.

**Gates:** build clean, verify 12 of 12 in 127.6s. Twenty three now.

**Next:** WD3-F1, the one line tying the recorded model size to the shipped file.
Ten commits on `daily`.

## Tick 87, 2026-09-23 15:40, build day, ladder item 5

**WH-F7 and WH-F8, the oldest open medium, and both were one line.**
`el.input.value.trim()`, which disagrees with Python in both directions. Both
published pages live and green.

**It strips U+FEFF**, and twenty lines of `tokenizer.ts` exist because Python's
`str.strip()` does not. A sentence pasted out of a file carries a byte order
mark, Python keeps it and makes a token of it, `PY_SPACE` was built to match, and
the page stripped it before the tokenizer ever saw it. `"\uFEFFhello"` reached
the model byte for byte identical to `"hello"`.

**It does not strip U+0085 or U+001C to U+001F**, which Python calls whitespace.
One of those alone survived the empty check and reached the model as `<cls>`
alone, and the page printed a verdict, a race with bars and twenty five flat
squares captioned "strongest single link 100 percent".

`hasWords` asks the tokenizer, which is whose question it is. The input is no
longer trimmed at all, and `Router.run` refuses on **words** rather than on ids,
because an input that normalises to nothing still produces the one `<cls>` id
and the old guard never fired for it.

**One of the two new assertions would not have caught anything, and saying so is
the work.** The `check:input` half asserts the tokenizer keeps the mark. The
tokenizer always kept it: the page was the broken end. That half is worth having
as the other end of the contract, and its comment now says plainly that it never
would have caught this. The assertion that would have is in `check:degraded`,
driven through the box: 3 positions against 2. Against the page as it was, both
new page assertions fail, "smalltalk.greet" and "2 positions either way".

**A fourth wasted control today, and a new reason.** The first attempt reported
a failed build I did not read: my own new gate code had a type error,
`codePointAt(0)` possibly undefined, so `dist` was stale and the gate measured
the fixed page. Then the next attempt failed because reverting `tokenizer.ts`
removed the export the gate imports. The control now refuses to run at all if
the build did not succeed, and prints why.

**Gates:** build clean, verify 12 of 12 in 145.5s. Eleven commits on `daily`.

**Next:** WD3-F1, the one line tying the recorded model size to the shipped file.

## Tick 88, 2026-09-23 16:40, the audit, by hand, looking at the page

**Perspective: the design eye, second pass.** D12's repeat rule, and its subject
changed more than any other since 22 September: the thumbnails went from twenty
four panels each scaled to itself to twenty four on one scale, which is a
different picture, and nobody had looked at it as a designer. Both published
pages live and green.

`audits/watch-it-think-2026-09-23-design-eye-2.md`. One medium, one low.

**F1, and it is the cost of this afternoon's fix.** The ramp is linear in the
value, `L = 0.18 + v * 0.62`, which was fine while every panel reached the top
of its own ramp. With one scale across the cube a head whose strongest link is 5
percent against a peak of 94 is drawn at `L = 0.21` against a background of
`0.18`. Measured peak luminance across the twenty four, dimmest first:

```
46 61 62 63 67 72 86 88 90 98 102 106 114 121 122 124 132 133 142 142 146 146 164 166
```

The bottom six are near black. The grid's whole job is that picking the head
that watches the verb is the activity, and a third of it can no longer be picked
from. **The shared scale fixed the unfair comparison and broke the reading, in
the same commit, and both are true.**

The fix is not a return to per field scaling. A curve between the value and the
ramp, `v ** 0.5`, maps 0.053 to 0.23 and 0.94 to 0.97: order preserved exactly,
every panel still comparable, the weak ones legible. The exact figure is already
printed on every label so nothing is lost, and the caption has to state the
curve, because an undeclared transform on a heat map is the other kind of
dishonest.

**F2, low.** 170 pixels of nothing under the thumbnail column at 1280, where the
six rows end above the large field. It reads as an alignment accident.

**What holds:** the scale works as information, row one is visibly the brightest
band and row three the dimmest and that was invisible yesterday; the progress bar
is the right amount of nothing; the four style exceptions are all being kept.

**Nothing fixed this tick**, per section 2. Eleven commits on `daily`.

## Tick 89, 2026-09-23 17:40, build day, ladder item 5

**WH-F9 and WH-F11, the oldest open medium.** Both published pages live and
green. F10 of the same finding, emoji split into code points, is left and said
so: it needs grapheme clustering for display while the model keeps seeing code
points, and that is its own piece of work.

**The axis went blank exactly when it was fullest.** Every continuation piece
read `..`, so "the hash is 9f86d081884c7d659a2feaa0c55ad015 ok" gave 35 chips of
which **29 said nothing**, under a caption that says rows are the token doing the
looking. The pieces were in the vocabulary all along: `tokenText` reverses it
lazily and `labelAt` shows the piece, with the first piece of a word still
showing the word as typed so the axis lines up with the chips above it.

**A zero width space drew a chip with nothing in it**, and an empty chip can
still be handed a slot tag: the audit pasted one into "hello" and got "hel", an
orange chip carrying B-TOPIC with no word in front of it, and "lo".
`visibleLabel` shows anything with no ink as its code point.

**Found while reading that code and fixed with it:** the tag row was built with
`innerHTML` from a token the visitor typed. Nothing exploitable, and the reason
is an accident rather than a defence: the word regex splits an injected tag
across several chips in several spans. A property of a regex written for another
purpose, one edit from not holding, and `textContent` plus a real element costs
two lines.

**The gate's second assertion was wrong first, in the finding's own shape.** It
tested for an empty string, and a chip holding a zero width space has a text
length of one, so it passed against the page that draws it as an empty sliver.
It measures the rendered width of the text node now, which is what "draws
nothing" means. That is the sixth self caught gate error today and every one has
been the same family: measuring a proxy instead of the thing.

**And the heredoc mangled a regex again.** The invisible character class arrived
with a literal U+FEFF and U+200B to U+200F inside it: it worked, and the source
contained six invisible characters in a rule about invisible characters. Written
as escapes now, with a comment saying why.

**Gates:** build clean, verify 12 of 12 in 144.6s. Twelve commits on `daily`.

## Tick 90, 2026-09-23 18:40, build day, the queue itself

**The ladder sent me to WH-F12 and it was the fifth stale entry today, so the
tick became the queue.** Both published pages live and green.

**WH-F12 was fixed and gated, and neither was recorded.** Measured rather than
read: on an emulated Pixel 5 with `hover: hover` false and `pointer: coarse`
true, a tap on an axis chip sets `is-focus` and `aria-pressed`, the chips are
real `<button>` elements, and `check:keyboard` already asserts that a tap pins a
token and a second tap lets go. The audit described plain `<li>` with no
tabindex. That is two versions of the page ago.

**Five stale entries in one day is not bad luck, it is a broken instrument.**
T25, T26 in part, T31 in part, T68 and now T34. Every one cost part of a tick to
discover, and the queue is what the ladder reads to choose. So the open list was
swept against the tree, entry by entry, with the artefact each one names:

```
T6  drawRace present           T7  wordTags present        T8  Greek samples present
T9  footer written             T34 tap works and is gated  T44 README says how to install playwright
T48 .github/workflows present  T51 .capture ignored        T52 FLIP, animate, stillMoving all present
```

Nine closed. The rest were checked and are real: no favicon, no
`docs/AUDITS.md`, no `.gitattributes`, `eval(plain)` still in `check:draw`.

**The sweep found a live defect, which is the point of sweeping.** The README
told a reader to run `npm run verify` for "ten browser gates" when there are
twelve, and `check:counts` was watching the workflow header and the publish
document and not the file most people actually read. It reads all three now, and
holds the README only to the browser count because that is the only one it
states.

**And `check:progress` was flaky, which I would have called a defect an hour
ago.** One run in several failed with "the status line moved by up to 74.4px".
Not a defect: `describe()` now fills the standfirst about a hundred milliseconds
in, so the paragraph above the box gains text while the download runs and pushes
the line down. That is a page assembling itself, which the assertion already
excludes for the sample chips, and it was racing the new one. The resting
position waits for the standfirst too. A flaky assertion is worse than a strict
one, because a strict one gets fixed and a flaky one gets muted.

**Gates:** build clean, verify 12 of 12 in 147.8s, and `check:progress` run three
times consecutively to prove the flake is gone. Thirteen commits on `daily`.

## Paused, 2026-09-23 19:45

The owner paused the loop and will re-arm it tomorrow for the push. The hourly
job `e9fee66f` is cancelled, so nothing fires until it is re-armed.

**State at the pause.** Thirteen commits on `daily`, none of them pushed,
because the build day's two pushes were spent on the release itself at 01:05 and
the contract says the next push belongs to the refinement day's first tick after
09:00. `main` is at `e95ea90`, which is what is live and green. Working tree
clean.

**What the thirteen are**, oldest first: the licence file saying MIT again; the
page printing what it downloaded rather than what is on disk; progress during
the download; max pooling on a downscale; the progress bar not outliving its own
failure; every percentage in the README accounted for; the tokenizer budgeted by
rate; one scale across the twenty four thumbnails; `meta.json` describing the
graph rather than the training run; the page saying what is true with no scripts
and no model; the input contract asking the tokenizer instead of `trim`; every
chip naming its token; and the README held to the gate count.

**When it is re-armed, the first tick after 09:00 does the squash and push**, per
section 4: one commit on `main`, the day's story rather than a list of subjects,
then watch the deploy. `RELEASE-PLAN.md` and D15 put `chunkline` on the 25th,
and its spec, both corpora and its display passage are measured and frozen in
`specs/`, so that build day starts with the page and nothing else.

**Open and worth reading first:** `audits/watch-it-think-2026-09-23-design-eye-2.md`,
whose one thing is that the shared grid scale made the page honest and made a
third of it unreadable in the same commit, and the curve that fixes it without
going back.

## Tick 91, 2026-09-24 11:04, REFINEMENT day, the first push

**The loop was re-armed by the owner and the day's first push is done.** D15
puts the 24th as `watch-it-think`'s refinement day, and it is past 09:00, so
section 4's first push was due.

**One thing went in before the push rather than after it, deliberately.** The
thirteen commits waiting on `daily` contained yesterday's shared grid scale,
which the design pass had already found makes a third of the thumbnails
unreadable. Pushing a regression I had already logged, to fix it in a second
push an hour later, is worse than pushing once with it fixed. So WDE2-F1 went
first and the release carries fourteen.

**The curve.** `sqrt` between the value and the ramp maps 0.053 to 0.23 and 0.94
to 0.97, so every panel keeps its place in the order and the weak ones become
readable. The caption says the curve is there, and `check:draw` asserts the
sentence as well as the pixels, because an undeclared transform on a heat map is
the other kind of dishonest.

**The floor was chosen from two readings on the same sentence**, not from the
audit's: 40 with the linear ramp, 75 with the curve, floor at 58. A floor at 70
would have had five points of room above the real reading, which is the mistake
this repository has made once with a timing budget and once with a character
budget. Measuring the failing case was worth the two minutes.

**The push.** Fourteen squashed into `b090561` on `main`, author Nikos Broikos,
no trailer. The message is the day's story rather than a list of subjects: what a
visitor gets that they did not have yesterday, then what is in the repository
rather than on the page, then the five new gates.

`e95ea90..b090561`. Deploy watched. `daily` reset onto the new `main`, tree
clean.

**The day's account:** eleven findings closed, five gates added, twenty three
now. Six of the day's controls were wrong first and every one is recorded as
such, because a control that passes against the broken code is worth less than
no control at all.

**Deploy, 11:11:46.** `completed success` on `b090561`, first attempt. Live page
verified in a browser rather than by status code:

```
footer      8.24 MB over the wire, 1803 ms to load
standfirst  5,086,061 parameters, trained from nothing, 6 layers...
curve declared  true    thumbnails  24    axis chips saying nothing  0
no page or console errors
```

**8.24 MB is the number the page measured for itself**, and yesterday it would
have printed 5.28, which was the graph's size on disk under the words "over the
wire". The gate that now holds it predicted 8.19 from the files and the host
sent 8.23 on the 23rd. Three independent readings of the same quantity inside
0.05 MB of each other.

**Zero axis chips saying nothing**, where the same sentence gave 29 of 35
yesterday.

## Tick 92, 2026-09-24 11:55, refinement day, the audit

**Loop re-armed by the owner, hourly at :13, job `45685c0e`.** Both published
pages live and green, `watch-it-think` on `b090561` from this morning's push.
Tick 92 is a fourth tick, so the audit comes before the ladder.

**Perspective: the maintainer in six months, second pass.** D12's repeat rule,
and the subject is what grew: five gates and roughly 1,400 lines of tooling went
in yesterday and the last maintainer pass was the 22nd, before any of it.

`audits/watch-it-think-2026-09-24-maintainer-2.md`. One medium, two low.

**F1.** There are **4,747 lines of tooling guarding 1,925 lines of page**, and
nothing anywhere tells a newcomer how many gates there are, which run before the
build, what `WIT_URL` does, or how to add one. Every gate's own docstring is
good; there is no document above them. The ratio is defensible because the whole
claim of this project is that its numbers are checked, but only if somebody can
see the shape of it in a minute, and right now the shape is reconstructed by
reading twenty three files.

**F2, low.** Eleven gates repeat the same server preamble, twelve define their
own `fail`, thirteen launch their own chromium, eight repeat the boot wait. Not
duplication that breaks anything: duplication that makes each gate look more
bespoke than it is, which is F1's cause.

**F3, low, and it is a negative result worth keeping.** The twelve browser gates
run in series and each pays for its own browser. Measured: 149.3 seconds total,
cheapest gate 3.0, so roughly 36 seconds of the 149 is launch and boot, about a
quarter. The top four are 82 seconds and intrinsic, because they throttle the
network deliberately. **Sharing one browser is not worth doing**, and that is
recorded so the next person does not spend a day finding out.

**Nothing is dead**, which is worth saying for a repository that grew this fast:
every export in `src/lib/` is referenced by both the page and the gates.

**Nothing fixed this tick**, per section 2. One push used of the day's three.

## Tick 93, 2026-09-24 12:21, refinement day, ladder item 4

**The one thing that could still have eaten tomorrow's build day is proved.**
Both published pages live and green, no open highs, one push used of three.
`chunkline` builds tomorrow, so item 4.

**The question the spec could not answer by reasoning.** Its risk 1 was that
setting two long columns is a typography job, and underneath that was a
technical unknown nobody had tested: the boundaries are **character offsets**,
and a rule has to land at the right height on rendered, wrapped text. If a
`Range` over the text node did not give usable rectangles, the page's central
picture would have had to be redesigned on the build day.

**It does.** A throwaway page, now kept as `specs/chunkline-drawing-probe.html`,
loads the frozen passage, places a rule at every committed offset with
`range.getBoundingClientRect()`, and was screenshotted at 1280:

```
budget 512    5 English rules,  8 Greek
budget 128   20 English rules, 35 Greek
68 rules across two budgets, none landed badly
columns 4,622 px and 5,166 px tall
```

None landed badly means no zero height rectangle, no negative offset, every rule
on the line its character sits on. The technique is four lines.

**And it showed two things the spec had not anticipated, both about copy rather
than code.** The columns are about five thousand pixels tall, and the comparison
a reader needs, that the first English rule falls much further down than the
first Greek one, is visible without scrolling at all: everything below rewards
scrolling rather than requiring it. And the Greek column is **12 percent taller
for the same number of characters**, 11,874 against 11,899, because Greek sets
wider, so a reader counting rules per column is seeing tokenization and
typography at once. The caption gives both character counts for that reason.

**Nothing to commit to a project repository:** the output is the spec and the
probe, both in the workspace, which is not a repository. `watch-it-think` is
clean at `b090561`.

**Tomorrow is a build day** and everything upstream of the page now exists: the
claim, both corpora, the numbers audited and corrected, the passage chosen by a
stated rule, the boundary offsets precomputed for four budgets, and the drawing
technique demonstrated.

## Tick 94, 2026-09-24 13:21, refinement day, ladder item 5

**WH-F14 and WH-F16 closed, and a gate was found asserting nothing.** F13 of the
same finding was already fixed. Both published pages live and green.

**The visible half.** Every visit logged a 404 for `favicon.ico` before the
visitor had done anything, and the first thing a suspicious reader does is open
the console. The icon is inline, a data URI, so there is no second request: the
page's own picture at sixteen pixels, an attention field in the scale hue with
one cell in flame. The footer reported a minute long download as "61452 ms to
load", and a load over a second reads as seconds now. The status line
pluralises.

**The assertion written for the 404 could never have caught it.** Measured:
headless chromium does not request `/favicon.ico` at all, so no gate driving it
can see that response. The declaration is asserted in `check:first-screen`
instead, which is the cause rather than the symptom, and `check:weight` keeps a
404 assertion for everything else with a note saying what it does not cover.

**And the assertion written for the duration was dead in a way that took
`cat -A` to see.** Its regex was `/<BS>\d{4,} ms<BS>/`, where `<BS>` is a literal
backspace byte, 0x08. It was meant to be `\b`. The escape had been written
through a shell heredoc and arrived as the control character it names, so the
pattern required an actual backspace either side of the digits: it matched
nothing, and it looked correct in an editor and in `grep`.

**Third time in one day the same shell handling corrupted an escape here.** The
other two were visible rather than dangerous: a character class in
`tokenizer.ts` holding six real invisible characters, and two test inputs
carrying a literal U+FEFF and U+200B. A scan found four files affected.

**`check:source` is the gate for it.** An invisible character in source is always
a mistake: if one is wanted it is written as an escape, which is readable,
diffable and survives every tool that touches the file. It scans `src`, `tools`
and `index.html` for C0 controls, the zero width and directional marks, and the
byte order mark.

**It caught its own file on its first run**, which is the best demonstration it
could have had, and then caught the backspace when the corruption was put back
deliberately: "tools/check-progress.mjs:216 carries U+0008".

**Pushed**, second of the day's three, `b090561..6364ef0`. The duration
assertion was dead in the published build too, so this was not only new work.
Build clean, verify 12 of 12 in 96.7s, twenty four gates. `daily` reset, tree
clean.

## Tick 95, 2026-09-24 14:30, the shape changed

**The owner changed the instruction: build every project, then optimise and fix
them, then audit on rotation, with a second session auditing in parallel.**
Three things were set up before any code.

**`BUILD-PROMPT.md`, the contract v3.** Thirty minute ticks. It supersedes
`LOOP-PROMPT.md` for anything unpublished and leaves `MAINTAIN-PROMPT.md` in
charge of anything public. Its ladder puts a broken published page first and an
unbuilt project fifth, and section 3.2 defines **when a project is done enough to
leave**: the build passes with its own gates, every number is produced by a
command or pinned, it has been looked at in a browser at 1280 and 390, the README
leads with claim then picture then method, and there is a gate for the defect it
most plausibly ships with, with a control. A tick that leaves a project says
which of those five it fails.

**The loop is `0cc2842e`, every 30 minutes.**

**The auditor session is briefed.** `broikos-github-ai-projects-auditor`. The
division does not bend: it reads, measures and files findings into
`audits/inbox/`; it never edits, commits or pushes. This session fixes, and every
fix ships with the gate that would have caught it. It was told the four defects
this workspace keeps producing, so it knows what to hunt: a gate that passes for
the wrong reason, a number no command produces, a picture gone stale, an
assertion measuring a proxy.

**Then `chunkline` was built.** Vite, TypeScript, `gpt-tokenizer`, no backend.
Two columns, a budget slider, a vocabulary picker, and every cut drawn as a rule
across the text at the character it falls after.

- **The boundaries are recomputed in the browser** rather than read from the file
  that holds them, because a page drawing a committed answer is a picture of a
  measurement rather than a measurement.
- **Offsets come from decoding the whole prefix**, not from summing token
  lengths. A token is bytes; a Greek word is often several tokens whose byte
  boundaries fall inside a character, so the naive sum drifts.
- **The vocabularies load one at a time, and the first version did not.**
  Importing both at the top put **2.9 MB of javascript** into the first visit of
  a page whose whole subject is what tokens cost, and the comment in that file
  argued for it without the number. o200k at boot, cl100k when picked.

**It works and the argument lands twice.** At 512 tokens the same two articles
give 6 English chunks and 9 Greek on o200k, and **6 and 21 on cl100k**. Looked at
at 1400 and 390: no console errors, and the first Greek rule is visible at the
fold while the English column has none yet, which is the picture.

**Of section 3.2's five, it fails three:** no README yet, no gates of its own
beyond `check:source`, and `check:boundaries` is registered in `package.json` but
not written. It has been looked at in a browser, and its numbers all come from
the generated corpus.

**Next:** the gates and the README.

## Tick 96, 2026-09-24 14:00, chunkline, ladder item 5

**`check:boundaries`, the gate this project exists to have.** Inbox was empty at
the top of the tick; both published pages live and green.

**It holds three things to one answer it computes itself:** the committed
offsets, the tokenizer, and the rules the page actually drew. Each of the three
ways they can disagree has happened to a project here: a page that draws the
committed answer and stops measuring, a page that measures while the file goes
stale, and both being right with the rules at the wrong height.

**The third end is the one worth the code.** Each rule's y is read back and the
browser is asked which character sits on that line, because a rule at the right
height for the wrong character passes a count check and is still a lie.

101 committed offsets against `o200k`, then four budgets against both
vocabularies through the browser. Two controls, one per end: an offset moved by
40 characters fails the file check, and every rule drawn nine pixels low gives
"20 rules are not on the line of the character they cut after" on the first
budget it reaches.

**And the build was lying.** `npm run check` chained `check:claims` and
`check:conditions`, neither of which existed, so `npm run build` failed while
`vite build` alone succeeded. The chain names only what exists now. Worth
recording as the shape of the defect rather than the defect: a build that claims
to run gates it does not have.

**`chunkline` still fails two of the five in section 3.2:** no README, and no
`check:claims` or `check:conditions`, which need the README to check.

## Tick 96, addendum: the auditor's first pass

**It found two highs on a published project, so the next tick is not building.**
`audits/watch-it-think-2026-09-24-measurement-2.md`, ten findings, high 2,
medium 4, low 4, on `6364ef0`, measured against the live host and in a scratch
clone with every mutation applied one at a time.

**F1, high, and it is mine from yesterday.** The footer sums `encodedBodySize`,
which is a response's body size wherever it came from, **cache included**. So a
returning visitor is told 8.24 MB came over the wire when nothing did. I fixed a
number that was wrong in one direction and made it wrong in another.

**F2, high.** Two gate counts in the README are wrong and `check:counts` exempts
the README from exactly the assertions that would have caught them. I wrote that
exemption yesterday.

**F3 is the one that matters most for what this project claims.** The full build
exits 0 with "3 disagreements", "7 layers, 5 attention heads" and a changed alt
text percentage in front of it. The gate that holds this project's numbers
cannot fail on three of its twenty four claims. That is the promise the whole
repository rests on.

The division held exactly as intended: a second pair of eyes found in one pass
what I had not seen while writing it.

## Tick 97, 2026-09-24 15:20, watch-it-think, ladder item 2

**The auditor's F1, and it is the second time this sentence has been wrong.**
Both published pages live and green. `chunkline`'s own audit arrived in the same
window and is queued behind this, because a claim a published page cannot
reproduce outranks an unpublished project.

**What it was.** The footer summed `encodedBodySize`, which is a response's body
size wherever it came from, cache included. The auditor reloaded the live page:
the footer still said 8.24 MB when nothing had been fetched. **8.24 MB in 278 ms
is 237 Mbit/s.** The host sends `Cache-Control: max-age=600`, so every return
inside ten minutes printed a download that did not happen.

**And it is my correction that broke it.** This line printed the int8 graph's
size on disk under the words "over the wire" until yesterday, when I made it
print what the browser recorded. I only ever measured a cold visit, so I traded
one wrong number for another and wrote a comment claiming "nothing is stored, so
nothing can go stale". The browser stores it.

`transferSize` is 0 for a cache hit and includes headers otherwise. And when the
total is nothing the footer says so rather than printing 0.00 MB, because a
visit served entirely from cache is the interesting case: it is the argument for
shipping a model to the browser rather than calling an API.

**`check:weight` could not have caught either version.** It compared the footer
against `encodedBodySize` summed on the same page, which is the page's own
formula recomputed, in a browser whose cache is empty: it could not disagree with
the footer and it never met a warm cache. It now loads twice in one context and
holds the second visit's printed figure against CDP's
`Network.loadingFinished`, which is what the network stack received and owes
nothing to the page. Two independent numbers rather than one number twice.

Control, the page counting the cache again: "on a second visit the footer says
18.7 MB over the wire and the network stack received 14.24 MB", exit 1.

**The auditor also filed on `chunkline`,** one high and four mediums, and its F3
is the finding I asked for and did not expect. The mid word rate, which the spec
called "the real difference in boundary quality", is a property of cutting every
512 token ids. Under LangChain's own recursive splitter it is **0 of 164 Greek
boundaries inside a word against 92**, while the ratio that carries the other
half of the argument, 55.5 percent, survives both unchanged. The page's second
number describes a chunker nobody runs.

**Gates:** build clean, verify 12 of 12 in 98.8s.

## Tick 98, 2026-09-24 14:30, watch-it-think, ladder item 3

**The auditor's F2, the last open high, and it took three attempts to gate
properly.** Inbox empty, both published pages live and green.

**What was wrong.** The README said "Eight gates run on every build" above a
table of eight, three of which run only in verify, and "nine file gates" in the
command block. Twelve run before the bundle and twelve in a browser. It is the
section called "Why you can believe them".

**`check:counts` exempted the README** from both assertions, on a premise I
wrote yesterday that it "does not quote the total or the build count". It quotes
the build count twice. The exemption then printed `ok README.md says twenty
four, twelve in build and twelve in verify`, a sentence about the README that
was not true of it.

**The half that did run had a hole the audit measured**: "near, in either order,
within 120 characters" let the verify count satisfy the build check whenever both
were twelve, so `docs/PUBLISH.md` mutated to "eleven in npm run build" passed.

**Three attempts, and the two failures are the lesson.**

1. Binding each number to its own phrase closed the audit's mutation, and the
   control restoring the README's "nine file gates" still passed: the gate asks
   whether a **correct** sentence exists, which is not whether an incorrect one
   does, and the README said both.
2. Collecting every nearby number closed that and broke the other way: it caught
   "About two minutes" as a claim about `npm run verify`. A gate that fires on
   prose gets muted.
3. The number has to be **about gates** to count as a claim about gates. Three
   shapes, all three that these files actually use.

Three controls, all exit 1: the README's old "nine file gates", the audit's exact
PUBLISH mutation that used to pass, and "ten browser gates".

**Gates:** build clean, verify 12 of 12 in 102.2s. Two commits on `daily`, one
push left today.

**No highs left on a published project.** Next is `chunkline`'s own high: its
corpus cannot be reproduced.

## Tick 99, 2026-09-24 15:00, chunkline, ladder item 2

**The repository now holds the text its numbers were measured on.** Inbox empty,
both published pages live and green, no highs left on either.

**The defect.** Every rate the page printed came from eight Wikipedia articles
fetched by a script outside the repository, which recorded revision ids and saved
no text. Nothing here could produce those numbers again. The auditor ran the same
processing a day later, found two English articles edited since, and got a
different answer: **13 of 105 boundaries inside a word where the file said 10 of
105**, and 256,155 characters where it said 256,414. Both honest measurements, of
different documents.

**The fix is structural.** 648 KB of prose is committed, which CC BY-SA 4.0
allows with attribution, each article carrying its revision id, the timestamp of
that revision, the date it was fetched, a link to it and its sha256.
`tools/build-corpus.mjs` fetches and writes it, **and writes the rates from that
text in the same run**, so the two cannot come from different days.

**`check:corpus` fired on its first run and reproduced the auditor's numbers
exactly and independently:** 13 of 105, 17 of 108, 256,155 characters. That is
the strongest kind of agreement, two implementations arriving at the same place
from different directions.

**Both share `tools/rates.mjs`.** A gate that recomputes a number with its own
copy of the formula is checking that two files agree about a bug.

**Controls:** a rate edited by hand fails naming the field; three words changed
in the corpus text fails on the article's hash.

The page's figures moved with it because it reads them: English is 4.76
characters a token now rather than 4.75, Greek unchanged at 2.64 because no
Greek article was edited.

**`chunkline` still fails two of the five in section 3.2:** no README, and no
`check:claims` or `check:conditions`. `check:boundaries` is green and is still
run by nothing, which is the auditor's F6 and the next tick.

## Tick 100, 2026-09-24 15:30, chunkline, ladder item 5, plus the day's last push

**The day's third and last push went out first**, carrying ticks 97 and 98:
`6364ef0..c0c2297`. Both were numbers the auditor caught and, in both cases, the
gate written to hold that number could not have failed. The live page had been
telling returning visitors that 8.24 MB arrived when nothing had, and that is
now fixed in front of people rather than in a branch.

**Then the auditor's F6 on `chunkline`: the gate this project exists to have was
run by nothing.** `npm run build` ran `check:source` alone, `npm run verify` did
not exist, and `check:claims` and `check:conditions` were registered pointing at
files that were never written. A gate outside the build is a gate somebody has
to remember.

`verify` collects it now, on the `serve.mjs` pattern: one preview on an OS
assigned port, proved byte for byte against `dist/index.html`. One gate today,
and the file exists anyway, because the reason this one was outside the build is
that nothing collected it. The two dead script entries are deleted rather than
left pointing at intentions.

**And the gate was describing a check it did not run.** Its header says it takes
a rule's y and asks which character sits on that line. It computed exactly that,
with a binary search per rule, then **discarded it with `void drawn`** while a
second, weaker comparison ran instead. The search is the assertion now, in one
round trip per language per budget rather than two calls per rule, which took it
from 4.2 seconds to 2.9. The count check is back above it with the reason it
exists written down.

**Control, the auditor's own:** rules moved to the top of their line rather than
the bottom fails at the first budget it reaches, 20 English and 35 Greek at 128.
Its numbers, reproduced here exactly.

**`chunkline` still fails two of the five:** no README, and no claims gate. Both
are the same next tick, because a claims gate needs a README to check.

## Loop rewritten for depth, 2026-09-24 18:10

The owner asked for a loop that does deep work every tick rather than a change
and a commit. `BUILD-PROMPT.md` gains **section 2b, what a tick has to contain**,
and the cron prompt is rewritten around it: `9a6b374a`, still every 30 minutes.

**The six, and each one is drawn from something in this devlog rather than from
a theory of good practice:**

1. **Measure first.** No fix without a number. "The ramp is too dark" produced an
   argument; "peak luminance 46 to 166 against a background of 6, and 40 against
   75 with the curve" produced a floor with a reason.
2. **Fix the class, not the instance.** Search every project for the same shape
   before committing. One corrupted escape became a scan that found four files
   and a gate. Skipped, it costs a later tick: the same two findings were filed
   twice, two days apart, because the first pair was fixed as instances.
3. **A gate whose control fails.** Restore the broken state, run it, keep the
   output. **If the control passes the gate is wrong**, which has happened nine
   times here and not once was the gate right, and the prompt now says to confirm
   the build succeeded before trusting any control, because three of those nine
   were a stale `dist`.
4. **Kill a hypothesis.** Name one thing checked and found clean. Two negative
   results in this devlog have already saved a later tick a day of work.
5. **The reader.** What a visitor or a recruiter now sees, or why this tick was
   invisible to them and right anyway. The code is the portfolio and a week of
   invisible ticks is a week that does not show.
6. **Name the next task.** So the following tick starts from a decision rather
   than a reread.

**And a definition that was missing:** a tick that produced no measurement is a
noop that has not admitted it.

Section 9's report shape now lists all eight things to compress into six lines,
with the instruction to say which part is missing rather than quietly dropping
it, because a report that omits the control is how a tick with no control gets
written up as a tick with one.

## Tick 101, 2026-09-24 16:09, chunkline, ladder item 5

**Measured first:** the page rendered **nine figures a reader could check and
none of them was held by anything**. `check:corpus` proved the rates come from
the committed text; nothing connected the rates to what was on screen. A page
reads its numbers at build time, and a file can be right while the sentence built
from it is wrong. Inbox empty, both published pages live and green.

**The headline went before the README**, because a README should not repeat a
claim I already know is falsifiable. "Every chunk size in every RAG tutorial is
an English number" dies to one link: LangChain's own tutorial chunks at 1,000
**characters**, and a character budget holds the same amount of Greek as English.
It names a real default now, LlamaIndex's 1,024 `cl100k` tokens, and the claim is
stronger for being narrower: **4,731 characters of English and 1,157 of Greek**.

**The README has a section for what the project does not claim.** Cutting every
512 token ids puts 92 of 164 Greek boundaries inside a word against 13 of 105
English; LangChain's recursive splitter over the same text at the same budget
puts both at zero. The separator fixes where the cut lands and gives the Greek
chunk no more text, which is why the page leads with how much fits.

**Two gates, one list of expectations.** `check:claims` holds eleven README
figures and refuses any ratio the corpus does not produce, because looking for
the right answer does not notice a wrong one beside it. `check:page` holds six
rendered figures, both revision ids and both character counts, reading
`innerText` because the question is what a visitor sees. They import the same
list: two lists of what a number should be drift, and the gate then checks that
two files agree about a mistake.

**The page gate was wrong first, in this repository's favourite way.** It held
the page to the README's spelling, `1.80x`, against a page that correctly says
"1.8 times". A gate about phrasing rather than a fact, the fifth of those. It
derives the page's own formatting now.

**Controls, each verified to have applied before being believed.** `4.09x`
changed to `3.51x` fails twice, once for the missing figure and once for the
invented one. The standfirst's ratio shifted by 0.4 fails the page gate by name.
A third was written and discarded because its `sed` never matched, which is the
whole reason the contract now says to check that the mutation landed.

**The class, searched across all three projects:** `tokenlab` has a README claims
gate and **nothing that reads its rendered page**, and that page renders fifteen
checkable figures including four prices. Same shape, queued for `tokenlab`
rather than fixed here, because one task per tick.

**Killed:** the hypothesis that `check:corpus` already covered this. It holds
`corpus.json` to `corpus-text.json` and never opens the page or the README, so
every rendered figure could have drifted with it green.

**The reader:** a recruiter opening this repository now meets a claim with a
number in it, a table with the condition attached, and a section saying what the
project does not claim, instead of no README at all.

**`chunkline` fails one of the five:** no picture at the top, because
`npm run capture` does not exist yet. That is the next tick, and it is also what
makes the README's opening what it should be.

---

## 2026-09-24 17:09, tick 102: the picture at the top, and the gate that keeps it honest

**Ladder item 5**, `chunkline`, the one remaining condition of section 3.2: the
README led with a comment saying the picture would arrive when `npm run capture`
existed. It did not exist.

**Measured first.** Characters before the first image: `tokenlab` 555,
`watch-it-think` 412, `chunkline` none at all. Then where the picture would even
have to point, because a still of this page at its default budget shows no cuts:
at 512 tokens the first English rule is 1,503 pixels down. Choreographed against
that table rather than framed by eye:

| budget | tokenizer | English rules | Greek rules | first English | first Greek |
|---|---|---|---|---|---|
| 1024 | o200k | 2 | 4 | 2407 | 1715 |
| 128 | o200k | 20 | 35 | 785 | 678 |
| 128 | cl100k | 20 | **83** | 785 | 625 |

The last two rows are the recording: the budget held still while only the
vocabulary changes, Greek going 35 cuts to 83 while English does not move.

**The class.** The sweep found the real finding. `tokenlab` is published, its
`shatter.gif` had no `capture.json` and no gate, and its palette was replaced
wholesale at 18:35 on 21 September. The recording was remade at 18:38. Three
minutes. The picture is honest by sequencing, not by process, and nothing in the
repository would have said a word about the version of that afternoon where the
second commit did not happen. Both projects have `check:capture` now, comparing
the paint, the words and the numbers on screen.

**Controls, each with the build's exit code checked first.** `chunkline`: the
flame to `#00c2ff` fails on `paint.--flame`; the headline replaced fails on
`words.headline`; `draw(lang, cuts.slice(0, -1))` fails on
`state.englishRules: filmed 20, page is 19`. That third one passed `npm run
build` clean, because the page's own text still said 21 chunks and 84: only a
gate that counts drawn rules sees it. `tokenlab`: `--ink` back to
`oklch(0.17 0.014 265)`, the value of 21 September, fails on `paint.--ink` and
`paint.wash`.

**Two gates were wrong and their controls said so.** `chunkline`'s waited for the
Greek rule count to equal the expected number, which reads like a wait and
behaves like an assertion, so it died with a bare `TimeoutError` naming no rules
and no picture. `tokenlab`'s then failed against a page that was correct: it
settled on the fractured chip count, final the instant the stage redraws, and
read the token figure, which counts itself up. Measured after the switch:
250ms tokens=79, 500ms tokens=82, chips 6 throughout. Both wait on the whole
state now.

**Found while running those controls, and bigger than the tick.** `serve.mjs`
killed its server by calling `spawn`, asynchronously, from a `process.on('exit')`
handler. An exit handler runs after the event loop has drained, so that kill was
queued into a loop that had already finished and never started once, since the
file was written. Counted on this machine: **65 live `vite preview` processes**,
62 of them from these projects. They pushed it far enough that `spawn` itself
began failing with `UNKNOWN`, inside a `finally`, replacing the result of the
gate that had just computed it. Two control runs were lost that way before the
cause was clear. `spawnSync` now, idempotent, wrapped so cleanup can never become
the error the caller sees, plus SIGINT and SIGTERM. Fixed in
`chunkline/tools/serve.mjs`, `watch-it-think/tools/serve.mjs` and
`watch-it-think/tools/capture.mjs`; `tokenlab` gained `serve.mjs` with the fix
already in it. Proved: zero servers before a run, zero after.

**Killed:** the hypothesis the sweep started from, that `tokenlab`'s picture was
already stale like `watch-it-think`'s had been. The gif's last commit is
`e6797b6` at 18:38:04, three minutes after the palette commit, and nothing has
touched `src/` or `index.html` since. The picture is current. The gate is for
next time, not this time.

**Weight, measured rather than copied.** 69 frames at 880 wide, undithered: 64
colours 4.99 MB, 32 colours 3.84, 16 colours 2.21. Not linear, and the reason is
that playwright records lossy webm, so two frames of a still page are no longer
identical and GIF pays for everything that changes. A small palette quantises
that noise away. `docs/cuts.gif` ships at 2.40 MB, looked at at 1:1, Greek and
Latin both crisp.

**The reader:** `chunkline`'s README opens with the claim and then eight seconds
of the argument happening, caused by a control they can watch being used. Both
published pages keep the pictures they have, with something that now fails if
they stop being true.

**`chunkline` fails none of the five.** Build passes and runs its own gates;
every number is produced by a command and gated, thirteen claims now; looked at
at 1280 and 390; the README leads with claim, picture, method; `check:capture`
has three controls and `check:boundaries` has its own.

**Next tick:** `chunkline` is due to publish tomorrow per D15, so the next tick
is the release preparation, `docs/PUBLISH.md` with its description, topics and
homepage. One finding logged on the way: 1px of horizontal overflow at 390,
`scrollWidth 391` against `clientWidth 390`, most likely `.rule`'s
`left: -1.25rem; right: -1.25rem` against the card padding.

---

## 2026-09-24 17:19, tick 103: the ladder was reading from a queue nobody checked

**Ladder item 3**, an open finding at `severity: high`, published projects first.
It produced three on `watch-it-think`. All three were false.

**Measured first**, each with one command:

| id | filed | claim | what the tree says |
|---|---|---|---|
| WE-F3 | 09-21 | "There is nowhere to click", no workflow, no Pages, repo 404s | `pages.yml` present, live URL returns 200 |
| WR-F1 | 09-22 | "The About box is empty" | description, homepage and ten topics set |
| WR2-F1 | 09-22 | `check:capture` records eight colours and a font, so it cannot see words | it records `headline` and `standfirst`, and refuses a record lacking either |

The cost is not the reading. Item 3 sits above "build the next project", so three
dead entries outranked real work for three days.

**How deep it goes, measured rather than assumed.** A seeded sample of fourteen
open mediums, drawn rather than chosen: ten could be settled by command, of which
**three were stale and seven were real**. WR2-F2 claims 760 characters before the
picture where the README has 412. WH-F5 and WH-F9 were both closed by gates that
now exist and run, `check:degraded` and `visibleLabel`. Still open and confirmed
live: RC-F11 (`tokenlab` has zero `og:` tags and no `rel="icon"`, so a forwarded
link is a blank card and the tab has no icon), WM2-F10, WD-F10, DR-F10, WP-F9,
WM2-F8, WM2-F11.

**The class, and the first answer was wrong.** The tidy explanation was a cohort
invalidated at a stroke by publication. The dates refuse it: every finding on
both projects was filed on or before the day it went public, and `tokenlab` has
all 34 of its highs closed against `watch-it-think`'s 37 with three missed. No
cohort effect. A hand doing it project by project, stopping three short on one of
the two passes, which is a better argument for a gate than the tidy one was.

**`tools/check-queue.mjs`**, and it fails in both directions, because both have
happened here:

- open, and its probe says it no longer reproduces: close it
- **fixed, and its probe says it still reproduces**: it was never fixed

The second is the one nobody looks for. 133 entries are marked fixed across the
two published projects and until now not one was ever asked again.

**The ratchet.** 142 findings were open and almost none had a probe. A gate that
fails 142 times on its first run gets commented out on its second, so the count
of unprobed open findings is held in `state/queue-cap.json` at **132**, and the
cap may only fall. Adding an unprobed finding fails; adding a probe and not
lowering the cap fails too, which is what makes it a ratchet and not a ceiling.

**Four controls, all firing:**

```
WE-F3 re-opened     FAIL 1 finding disagrees with the tree
                         watch-it-think WE-F3 is open and no longer reproduces
RC-F11 marked fixed FAIL tokenlab RC-F11 is marked fixed and still reproduces
a new unprobed open FAIL 133 open findings have no probe, and the cap is 132
a probe, cap unmoved FAIL the cap is 132 and only 131 open findings are unprobed
```

**Killed:** the hypothesis that the queue is rotten generally and the ladder
cannot be trusted at all. Seven of the ten mediums that could be settled still
reproduce, and after this sweep **both published projects have zero open highs**,
34 and 37 respectively all closed. The rot was three entries at the top, not a
rotten queue.

**Also killed, and it was mine:** the first version of the gate's own header
blamed publication for the staleness. It is a claim in a file in a workspace whose
whole discipline is that claims are true, and the dates do not support it. It has
been corrected in place rather than left as the better story.

**The reader:** nothing. This tick is invisible to a visitor and to a recruiter,
and that was the right call, because the thing it repaired is what chooses the
work every future tick does. A loop picking its next task from three entries that
stopped being true on 22 September is a loop spending real hours on nothing.

**Six closed, five probed, cap set.** Open went 142 to 137, of which 132 are
unprobed and capped.

**Next tick:** `chunkline` has no `docs/PUBLISH.md` and it publishes tomorrow per
D15. `RELEASE-PLAN.md` step 1 needs the description, topics and homepage written
before the release tick, not during it, and that is the one thing standing
between tomorrow's tick and a clean publication. Ladder item 5, `agentscope`,
comes after it.

---

## 2026-09-24 17:50, tick 104: agentscope's spec, and the gate for it failed its own first control

**Ladder item 5**, the next project that does not exist. Section 3.1 says a spec
is written the tick before the project is started, so this tick is that spec.

**Measured first, because the dataset is this workspace.** `agentscope` is a
failure taxonomy built from the devlog, so the first question is how big the
devlog is. `BUILD-PROMPT.md` says "95 devlog entries and 27 audits"; D15 says "70
ticks, 21 audits, 13 decisions". Both were true when written. Today:
`specs/agentscope-corpus.mjs` counts **107 entries, 106 of them ticks, to tick
103, 2026-09-20 to 2026-09-24**, 28 audits and 15 decisions.

**Six modes, derived rather than invented**, each admitted only with a mechanism,
two independent occurrences, and at least one entry carrying pasted output or a
commit:

| mode | entries | with a run |
|---|---|---|
| the record that outlived what it described | 23 | 13 |
| the escape that arrived as a byte | 9 | 6 |
| the exit code the shell threw away | 8 | 6 |
| the control that passes against the broken code | 4 | 3 |
| the cleanup that could not run | 4 | 3 |
| measuring whatever answered | 3 | 2 |

42 of 107 entries touch at least one. All six clear the two-run bar.

**The finding the spec is built on.** The lesson this log repeats most is the
control that passes against broken code, and the contract stated it as **nine
times** in section 2b and **eight times** in section 6, same file, adding that
every one is in the devlog. The devlog carries four entries whose text records
it, one of which says six of that day's controls were wrong first, so the corpus
supports four to twelve against a unit nobody defined. An agent whose contract
opens with "every number on a page is produced by a command" carried its most
repeated lesson as a number no command could produce.

**And then the gate for that spec passed its own first control.** Changing the
spec to say 108 entries: `exit 0`. The claim was the bare string `107`, checked
with `includes`, and the document says 107 three more times. The comment four
lines above that assertion already said a failure must name the claim "rather
than printing a bare integer nobody can place". Written, and not done, in the
same file, in the same minute, in a gate about an agent that writes a lesson and
repeats it. So the tick's real work became the assertion, per section 2b.

**The class, swept across every project.** 17 claims in the two published
projects were held as bare values. Measured against the README that has to
satisfy them:

```
watch-it-think  layers  value 6   occurs 19 times in README.md
                heads   value 4   occurs 23 times
                maxLen  value 64  occurs  3 times
                intents value 44  occurs  2 times
```

The first two could not fail under any edit whatsoever. Side by side against a
README rewritten to claim **8 layers and 12 attention heads** while `meta.json`
still says 6 and 4:

```
the gate as it was   25 claims in README.md check out against meta.json   exit 0
the gate as it is    FAIL layers, as the architecture line says it: the
                          measurement says "6 layers" and the README does not
                     FAIL heads, as the architecture line says it: the
                          measurement says "4 attention heads" and ...
                                                                     exit 1
```

Fixed and pushed as `5c89d36`. The context length is now held twice because the
README states it twice.

**Killed:** that `chunkline` has the same defect. It does not. Its four rate
claims are four significant figures each, occurring exactly once in the README,
and its two revision claims are 8 and 10 digits. **Zero claims short enough to
collide.** Safe by accident rather than design, which is why the shape was still
worth removing from its sibling.

**Six controls, all firing:** the spec figure drifting; an invented figure added
beside correct ones ("250 entries"); a mode dropping below two runs; the bare
count returning to the contract; the pointer to the counting command being
removed; and the architecture rewrite above.

**Also fixed, in the contract itself.** Both counts are gone, replaced by the
command that produces them, and `agentscope-check.mjs` fails if either returns or
if the pointer to the command goes. Its first version cited the two contract
lines by **line number**, which survives exactly until a paragraph is added above
them; it checks by phrase now.

**Mode two, three times in one session.** Writing that phrase-based check through
a heredoc ate its escapes again and compiled a regex broken across three lines.
The taxonomy's own second mode, in the file that guards the taxonomy. Repaired by
byte sequence, since the text tools could not match what the file actually held.

**The reader:** nothing new today, except that `watch-it-think`'s README can no
longer describe a model that is not the one shipped. That is invisible until the
day it is not, which is the argument for it.

**`agentscope` fails all five of section 3.2**, as it must: the project does not
exist yet. The spec exists, measured and gated, which is what this tick's ladder
item asked for.

**Next tick:** `chunkline`'s `docs/PUBLISH.md`, unchanged from yesterday's naming
and now more urgent. It publishes tomorrow per D15, `RELEASE-PLAN.md` step 1
needs the description, topics and homepage written before the release tick rather
than during it, and today's ladder walked past it twice because the ladder is
right that a release not due today is not today's work.
