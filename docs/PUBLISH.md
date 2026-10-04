# Publishing agentscope

Everything the repository needs to exist on GitHub, written down before the
repository is created so that creating it is a transcription rather than a
series of small decisions taken at the API.

Written at tick 195, eight days after the date `D15` gave this project, because
the release could not have happened on that date: there was no
`.github/workflows/pages.yml` in the tree, so turning Pages on would have
published nothing, and no file said what the About box should contain.

## The About box

**Description**, 350 characters or fewer, and it has to carry the number:

> For five days an AI coding agent built seven projects and kept a development
> log while it worked. Six kinds of failure recur in it, 32 times across 108
> entries, every one written up as a lesson before it happened again. Every mark
> on the page opens the entry behind it.

**Homepage**: `https://broikos-nikos.github.io/agentscope/`

**Topics**, ten, the maximum GitHub shows without a fold:

```
ai-agents  llm  developer-tools  failure-analysis  observability
data-visualization  reproducible-research  typescript  case-study  logs
```

`ai-agents` and `failure-analysis` are the two that matter. Somebody looking for
what this measures, how an agent behaves across a long run of its own work, is
searching one or the other, and the thing nobody else has published is the
corpus underneath: one agent's unedited log with every occurrence labelled by
hand.

The topics name the category and not the tool, which is `D22`.

## Settings

- **Public**, no wiki, no projects, no discussions. Issues on: a repository that
  publishes a count read by hand should be reachable by somebody who thinks the
  reading is wrong.
- **Pages**: source GitHub Actions, not a branch. The workflow builds, gates and
  deploys, and a branch source would publish whatever was committed regardless
  of whether the gates passed.
- **No default community files.** The MIT LICENSE is committed already, and
  `check:licence` fails if the README claims a licence the tree does not carry.

## The order, and why this order

1. **Create the repository** with the description, homepage and topics above, so
   the About box is never empty. `watch-it-think` shipped with an empty one and a
   recruiter audit filed it as a high finding: the ten second screen had no
   sentence on it.
2. **Push `main` with the whole history.** Fifteen commits, every one authored
   `Nikos Broikos <broikos.nikolaos@gmail.com>`, none co-authored. The history is
   the argument here more than anywhere else: it shows a count produced by
   matching words being replaced by a count produced by reading, and the page
   losing eighteen of its marks as a result.
3. **Turn Pages on** and let the workflow run. Nothing is deployed by hand.
4. **Open the live URL in a browser** and look at it, at 1280 and at 390. A 200
   from `curl` is not the same as a page that renders, and this page's whole
   argument is a picture.
5. **Second push**: add the live link to the README, which is the one thing that
   cannot be written before the repository exists.

## What is in the repository that a reader should know about

- **`data/devlog.md`**, 327,443 bytes of normalised text, sha256
  `c9fff21422b7...`, frozen 2026-09-24. It is this workspace's own development
  log, committed rather than referenced, because the first version of a sibling
  project recorded revision ids and no text and the source moved within a day.
- **`data/labels.json`**, every record read by hand with the sentence that shows
  it, and every candidate the phrase matcher found and the reading rejected with
  the sentence it matched in. The counts on the page come from this file.
  `check:labels` holds it to the log.

## What is deliberately not in the repository

- **No `dist`.** It is gitignored; the workflow builds it.
- **No `.capture`.** The recording's working directory, also gitignored.
- **No tool name anywhere.** `D22`: one run of one agent cannot carry a claim
  about a product, and `check:plain` fails if a tool is named in the README or
  the meta description.

## After it is live

`MAINTAIN-PROMPT.md` takes over for this repository the moment it exists, and
`BUILD-PROMPT.md` stops applying to it. Twelve findings are open on the queue,
none of them high, and the first maintenance tick checks the deploy, opens the
page and works that queue.
