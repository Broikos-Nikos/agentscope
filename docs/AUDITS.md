# The audits

Commit messages cite identifiers like `AGLIC-F1`. This is what they refer to.

Three audit passes and the workspace sweeps. The passes were run by a separate
agent against one assigned perspective, with no write access to this project.

**25 findings, 13 closed, 12 open**, across the 3 perspectives that produced them.

Held to the workspace queue this project is built from by
`tools/check-audit-status.mjs`, which fails if a row here says anything the
queue does not.

## `AME`, measurement

The measurement auditor: is every number reproducible, is the sample size stated,
is any comparison unfair. Filed 2026-09-26, with an appendix of hand labels for
all 108 entries added the same morning at this session's request.

5 findings, 2 closed.

| id | severity | status | finding |
|---|---|---|---|
| `AME-F1` | high | fixed, tick 191 | Nearly half the mode records are a word used in another sense |
| `AME-F2` | high | fixed, tick 191 | "All six clear the bar only from entry 80" is decided by a false positive and a byte count |
| `AME-F3` | medium | open | "With a run" is true of 85 of 108 entries and is not tied to the mode |
| `AME-F4` | medium | open | "108 entries across 107 ticks, to tick 104" |
| `AME-F5` | low | open | The claims gate holds the table and the headline, not the prose around them |

## `AHS`, hostile stranger

The hostile stranger: somebody who did not build this, on a phone, on a slow
connection, with the keyboard, trying to make it fall over. Filed 2026-09-26.

4 findings, 2 closed.

| id | severity | status | finding |
|---|---|---|---|
| `AHS-F1` | high | fixed, tick 193 | On a phone a mark is 2.3 pixels wide, so nobody can open the entry they mean |
| `AHS-F2` | medium | open | A second click while the log is downloading can open the wrong entry |
| `AHS-F3` | medium | open | When the log fails to download, the panel says "fetching the log" for the rest of the visit |
| `AHS-F4` | medium | fixed, tick 193 | From the keyboard, an opened entry is 645 Tab presses away |

## `ARC`, recruiter

The recruiter: ten seconds on the page, then two minutes if the ten seconds
earned them. Filed 2026-09-26.

4 findings, 1 closed.

| id | severity | status | finding |
|---|---|---|---|
| `ARC-F1` | high | fixed, tick 194 | Nothing a recruiter reads in ten seconds says the agent is an AI |
| `ARC-F2` | medium | open | Between the headline and the picture sits the project's private vocabulary |
| `ARC-F3` | medium | open | The picture cannot be read on a phone, and it opens below the headline |
| `ARC-F4` | medium | open | Nothing is written for the About box |

## `self`, swept from elsewhere (not an audit pass)

Not a perspective and not an agent. Findings raised against this project while
a class found somewhere else in the workspace was being swept across all eight,
kept here because commit messages cite them like any other.

12 findings, 8 closed.

| id | severity | status | finding |
|---|---|---|---|
| `AREL-F1` | high | fixed, tick 195 | The project due to publish had neither a Pages workflow nor a publish document |
| `ACAP-F1` | medium | open | capture.mjs hands the committed GIF to ffmpeg and closes its browser outside a finally |
| `ACON-F1` | medium | fixed, tick 176 | Six mode buttons are bounded at 1.27:1 |
| `AGLIC-F1` | medium | fixed, tick 118 | The README claims MIT and the repository carries no LICENSE file and no gate holding the claim |
| `AGRP-F1` | medium | fixed, tick 182 | serve.mjs kills a process group the spawn never creates, so cleanup off Windows leaves the server running |
| `AHEAD-F1` | medium | open | The h1 ships empty and is written by script, so a slow or blocked load has no headline at all |
| `ASIZE-F1` | medium | open | The README says the entry text is 319 KB and the file is 326 KB, and nothing measures it |
| `APRE-F2` | medium | fixed, tick 173 | Picking a mode rebuilt every mark on the page to change three attributes and one sentence |
| `AGIF-F1` | low | open | The loop runs 6.88 seconds, above the five and a half tokenlab settled on |
| `ALAB-F1` | low | fixed, tick 191 | The page headline and the README counted different things and nothing compared them |
| `APRE-F1` | low | fixed, tick 165 | npm run verify started a server and handed the same missing browser to every gate in turn |
| `AREACH-F1` | low | fixed, tick 193 | The new list put data-entry on every row, which is the entry panel own hook |
