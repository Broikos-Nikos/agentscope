/**
 * The picture at the top of the README is a picture of this page.
 *
 *   npm run check:capture
 *
 * Every other gate here reads source, a count or the rendered DOM. None of them
 * can see that `docs/agentscope.gif` has become a photograph of a page that no
 * longer exists, and the README underneath says, in as many words, that it is
 * the real page.
 *
 * Paid for three times already in this workspace. `watch-it-think` shipped a
 * recording of a green page for two days after its palette became flame and
 * blue, and a recruiter audit found it in ten seconds. Its first fix recorded
 * eight colours and a typeface, so it then passed over a recording showing a
 * headline that had since been rewritten. `tokenlab`'s picture was correct only
 * because the capture happened to be re-run three minutes after its palette was
 * replaced, which is luck rather than a process.
 *
 * So the recording writes down the paint, the words and the numbers, and this
 * drives the page back to the filmed state and compares all three. The numbers
 * matter most here: the picture's content is a row of marks and a count in a
 * status line, and a reader can sit and count them off the image.
 */

import { readFileSync, existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { lookAt, FINAL_MODE } from './capture-state.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const record = resolve(root, 'docs/capture.json')
const gif = resolve(root, 'docs/agentscope.gif')

let failed = 0
const fail = (what, detail) => {
  failed++
  console.error(`FAIL  ${what}`)
  if (detail) console.error(`      ${detail}`)
}

if (!existsSync(gif)) {
  console.error('FAIL  docs/agentscope.gif is missing, and the README leads with it')
  process.exit(1)
}
if (!existsSync(record)) {
  console.error('FAIL  docs/capture.json is missing, so nothing records what the page looked like when it was filmed')
  console.error('      run npm run capture')
  process.exit(1)
}

const was = JSON.parse(readFileSync(record, 'utf8'))

/*
 * A record written by an older tool is refused, not partly believed. Comparing
 * whichever keys happen to be present means that the day the capture learns to
 * write down something new, this goes on passing without it.
 */
for (const part of ['paint', 'words', 'state']) {
  if (!was.looked || typeof was.looked[part] !== 'object') {
    fail(`docs/capture.json records no ${part}, so it was made before this gate read ${part}`, 'Run npm run capture.')
  }
}
if (failed > 0) process.exit(1)

if (was.mode !== FINAL_MODE) {
  fail(`the recording ends on ${was.mode} and this gate checks ${FINAL_MODE}`)
}

const { serve, useShared } = await import('./serve.mjs')
const server = process.env.AGENTSCOPE_URL ? await useShared(process.env.AGENTSCOPE_URL) : await serve()

try {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(server.url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelectorAll('[data-mark]').length > 0, null, { timeout: 60_000 })

  /*
   * Drive the page to the state the camera was pointed at. Comparing the
   * recording's last frame against the page's default would fail on the
   * selection and the open entry every single time, which is a gate that has to
   * be ignored to be used.
   */
  await page.click(`.mode[data-mode="${FINAL_MODE}"]`)
  const marks = page.locator(`[data-row][data-mode="${FINAL_MODE}"] .mark--run`)
  const n = await marks.count()
  if (n > 0) await marks.nth(n - 1).click()

  /*
   * Wait for stillness, on the whole state, never for a value. A wait that waits
   * for the expected number is an assertion wearing a wait's clothes, and when
   * it is wrong it fails with a timeout that names nothing. `chunkline`'s
   * control proved that, and `tokenlab`'s proved the other half: settling on one
   * part while another is still moving fails a page that is correct.
   */
  {
    const read = async () => JSON.stringify((await page.evaluate(lookAt)).state)
    const deadline = Date.now() + 30_000
    let last = await read()
    for (;;) {
      await page.waitForTimeout(300)
      const now = await read()
      if (now === last || Date.now() > deadline) break
      last = now
    }
  }

  const now = await page.evaluate(lookAt)

  const drifted = []
  for (const part of ['paint', 'words', 'state']) {
    for (const [k, v] of Object.entries(was.looked[part])) {
      if (now[part][k] !== v) {
        drifted.push(`${part}.${k}: filmed ${JSON.stringify(v)}, page is ${JSON.stringify(now[part][k])}`)
      }
    }
  }

  if (drifted.length > 0) {
    fail(
      `the page has changed in ${drifted.length} way${drifted.length === 1 ? '' : 's'} since the recording was made on ${was.recorded}`,
      drifted.join(String.fromCharCode(10) + '      ') +
        String.fromCharCode(10) + '      Run npm run capture. The README calls this the real page.',
    )
  } else {
    console.log(
      `  ok      the recording of ${was.recorded} is of this page: ${was.looked.state.rows} rows, ` +
        `${was.looked.state.filled} filled marks, ${was.looked.state.selectedRuns} followable in ${was.mode}, entry open`,
    )
  }

  await browser.close()
} finally {
  server.stop()
}

/*
 * The README claims the picture is the real page. If that sentence goes, this
 * gate guards nothing and should say so rather than keep printing ok. Matched
 * with `includes` on a flattened README: the version of this in
 * `watch-it-think` used a regular expression and twice tested my memory of the
 * wording rather than the wording.
 */
const readme = readFileSync(resolve(root, 'README.md'), 'utf8').replace(/\s+/g, ' ')
const CLAIM = 'That is the real page in a real browser, recorded by `npm run capture`'
if (!readme.includes(CLAIM)) {
  fail('the README no longer claims the picture is the real page, so this gate is guarding nothing', `looked for: ${JSON.stringify(CLAIM)}`)
} else {
  console.log('  ok      the README makes the claim this gate exists to keep true')
}

const mb = statSync(gif).size / 1e6
if (mb > 1.5) {
  fail(`docs/agentscope.gif is ${mb.toFixed(2)} MB`, 'fewer frames and a shorter run, not a better encoder')
} else {
  console.log(`  ok      docs/agentscope.gif is ${mb.toFixed(2)} MB`)
}

if (failed > 0) {
  console.error('\nThe picture at the top is the only thing most people will look at.')
  process.exit(1)
}

console.log('capture: the picture shows the page that exists, and the README can say so')
