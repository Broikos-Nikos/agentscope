# The audits

Commit messages cite identifiers like `AGLIC-F1`. This is what they refer to.

No audit pass has been run against this project yet. Every finding here was
raised by a sweep of a class found in another project in the same workspace,
which is why the identifiers read `ACON` and `APRE` rather than a perspective.

**9 findings, 5 closed, 4 open**, across the 0 perspectives that produced them.

Held to the workspace queue this project is built from by
`tools/check-audit-status.mjs`, which fails if a row here says anything the
queue does not. Until tick 164 this file did not exist, and an identifier in a
sibling project's commit log pointed at nothing a reader could open.

## `self`, swept from elsewhere (not an audit pass)

Not a perspective and not an agent. Findings raised against this project while
a class found somewhere else in the workspace was being swept across all eight,
kept here because commit messages cite them like any other.

9 findings, 5 closed.

| id | severity | status | finding |
|---|---|---|---|
| `ACAP-F1` | medium | open | capture.mjs hands the committed GIF to ffmpeg and closes its browser outside a finally |
| `ACON-F1` | medium | fixed, tick 176 | Six mode buttons are bounded at 1.27:1 |
| `AGLIC-F1` | medium | fixed, tick 118 | The README claims MIT and the repository carries no LICENSE file and no gate holding the claim |
| `AGRP-F1` | medium | fixed, tick 182 | serve.mjs kills a process group the spawn never creates, so cleanup off Windows leaves the server running |
| `AHEAD-F1` | medium | open | The h1 ships empty and is written by script, so a slow or blocked load has no headline at all |
| `ASIZE-F1` | medium | open | The README says the entry text is 319 KB and the file is 326 KB, and nothing measures it |
| `APRE-F2` | medium | fixed, tick 173 | Picking a mode rebuilt every mark on the page to change three attributes and one sentence |
| `AGIF-F1` | low | open | The loop runs 6.88 seconds, above the five and a half tokenlab settled on |
| `APRE-F1` | low | fixed, tick 165 | npm run verify started a server and handed the same missing browser to every gate in turn |
