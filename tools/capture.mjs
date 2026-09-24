/**
 * Record the page making its argument, for the top of the README.
 *
 *   npm run capture
 *
 * A grid of marks is a still image until somebody picks a mode, and then it is
 * the point: five rows dim, one stays, and the marks left on screen are the same
 * failure a hundred entries apart. That is not describable in a sentence a
 * recruiter will read, so it is recorded.
 *
 * Choreographed against measured geometry rather than framed by eye. Taken on
 * 2026-09-24, viewport 1280 wide, page 1400 tall:
 *
 *   mode cards   492 to 647
 *   status line  671
 *   the grid     711 to 1041, six rows at 711 767 824 880 936 993
 *   caption      1065
 *
 * So the frame scrolls to 400, which puts the cards, the status line, the whole
 * grid and the top of the caption on one screen, and nothing in the recording is
 * off the edge.
 *
 * The recording ends on `green-control`, whose four followable marks sit at
 * x=176, 891, 1041 and 1190. That spread is the argument: the workspace wrote
 * this lesson into its own contract in bold, twice, and then made the mistake
 * three more times a hundred entries later.
 *
 * It takes its server from tools/serve.mjs, so the page being filmed is proved
 * byte for byte against dist/index.html first. `tokenlab`'s capture assumed
 * somebody had already run `npm run dev` and died with ERR_CONNECTION_REFUSED on
 * the afternoon that repository was published.
 *
 * And it writes down what the page looked like while it filmed, into
 * docs/capture.json, because a GIF cannot go stale loudly. `check:capture` is
 * the thing that fails.
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, renameSync, rmSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { serve } from './serve.mjs'
import { lookAt, FINAL_MODE } from './capture-state.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(root, 'docs/agentscope.gif')
const WORK = resolve(root, '.capture')

const SIZE = { width: 1280, height: 900 }
const FPS = 8
const WIDTH = 880
const SCROLL = 400

rmSync(WORK, { recursive: true, force: true })
mkdirSync(WORK, { recursive: true })

const server = await serve()
let looked
let seconds

try {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 1,
    recordVideo: { dir: WORK, size: SIZE },
  })
  const videoStart = Date.now()

  const page = await context.newPage()
  await page.goto(server.url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelectorAll('.mark').length > 0, null, { timeout: 60_000 })

  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), SCROLL)
  await page.waitForTimeout(500)

  const startedAt = Date.now()

  // Open on all six rows, which is the log as a whole: mostly fine, with
  // failures scattered through it.
  await page.waitForTimeout(1400)

  // Then the gesture. Five rows dim and one stays.
  await page.click(`.mode[data-mode="${FINAL_MODE}"]`)
  await page.waitForTimeout(2200)

  /*
   * And then the proof, which is the part a taxonomy usually cannot offer:
   * open the most recent of those marks and the real entry is there, with its
   * commit. Clicking the last followable mark rather than the first, because
   * the argument is that this kept happening, not that it once happened.
   */
  const marks = page.locator(`.row[data-mode="${FINAL_MODE}"] .mark--run`)
  const n = await marks.count()
  if (n > 0) await marks.nth(n - 1).click()
  await page.waitForTimeout(3000)

  looked = await page.evaluate(lookAt)
  seconds = (Date.now() - startedAt) / 1000

  // A recording of the wrong state is worse than no recording, and it costs a
  // minute to find out here rather than in a gate tomorrow.
  if (looked.state.selected !== FINAL_MODE) {
    console.error(`FAIL  the recording ends on ${JSON.stringify(looked.state.selected)}, not ${FINAL_MODE}`)
    process.exit(1)
  }
  if (!looked.state.entryOpen) {
    console.error('FAIL  the recording ends with no entry open, and the entry is the proof')
    process.exit(1)
  }

  /*
   * And the proof has to be in shot.
   *
   * The entry's meta line is where the commit hash is, and a commit hash is the
   * difference between a taxonomy and a list of opinions. Measured on the frame
   * this records: the heading sits at 806 to 828 and the meta at 834 to 872 in a
   * 900 pixel viewport. Twenty eight pixels of margin. A heading that wraps to
   * two lines pushes the hash off the bottom, and the recording would still look
   * fine and would no longer show the one thing it is evidence of.
   */
  const proof = await page.evaluate(() => {
    const meta = document.querySelector('.entry__meta')
    if (!meta) return null
    const b = meta.getBoundingClientRect()
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), vp: window.innerHeight, text: meta.textContent ?? '' }
  })
  if (!proof || proof.bottom > proof.vp || proof.top < 0) {
    console.error('FAIL  the entry meta line is not in frame, so the recording does not show the commit')
    console.error(`      meta at ${proof?.top} to ${proof?.bottom} in a ${proof?.vp} pixel viewport`)
    process.exit(1)
  }
  if (!/commits [0-9a-f]{7}/.test(proof.text)) {
    console.error('FAIL  the entry the recording opens names no commit, and the commit is the proof')
    console.error(`      meta reads ${JSON.stringify(proof.text.slice(0, 90))}`)
    process.exit(1)
  }

  await context.close()
  await browser.close()

  const video = readdirSync(WORK).find((f) => f.endsWith('.webm'))
  if (!video) {
    console.error('FAIL  playwright wrote no video')
    process.exit(1)
  }
  const webm = resolve(WORK, video)

  // Before ffmpeg, not after. watch-it-think's first capture died pointing at
  // its own output directory.
  mkdirSync(resolve(root, 'docs'), { recursive: true })

  const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })
  const palette = resolve(WORK, 'palette.png')
  const filters = `fps=${FPS},scale=${WIDTH}:-1:flags=lanczos`

  const LEAD_IN = 0.4
  const offset = Math.max(0, (startedAt - videoStart) / 1000 - LEAD_IN)
  const trim = ['-ss', String(offset)]

  /*
   * Sixteen colours, undithered, at eight frames a second. Measured in
   * `chunkline` on the same kind of frame and the reasoning carries: playwright
   * records lossy webm, so two frames of a still page are not identical and GIF
   * pays for everything that changes. A small palette quantises that noise away
   * and the held frames go back to being still. This page is flatter than
   * chunkline's: one background, one card surface, three greys and one accent.
   */
  ff([...trim, '-i', webm, '-vf', `${filters},palettegen=max_colors=16:stats_mode=diff`, palette])
  ff([
    ...trim, '-i', webm,
    '-i', palette,
    '-lavfi', `${filters}[x];[x][1:v]paletteuse=dither=none`,
    '-loop', '0',
    OUT,
  ])

  renameSync(webm, resolve(root, 'docs/agentscope.webm'))
  rmSync(WORK, { recursive: true, force: true })

  writeFileSync(
    resolve(root, 'docs/capture.json'),
    JSON.stringify({ recorded: new Date().toISOString().slice(0, 10), mode: FINAL_MODE, looked }, null, 2) + String.fromCharCode(10),
  )
} finally {
  server.stop()
}

const { size } = await import('node:fs').then((m) => m.promises.stat(OUT))
console.log(`docs/agentscope.gif   ${(size / 1e6).toFixed(2)} MB at ${FPS} fps, ${WIDTH}px wide`)
console.log(`docs/agentscope.webm  kept alongside it, for anywhere that takes video`)
console.log(
  `ends on ${looked.state.selected}: ${looked.state.selectedRuns} followable marks in that row, ` +
    `entry open, ${seconds.toFixed(1)}s of action`,
)
