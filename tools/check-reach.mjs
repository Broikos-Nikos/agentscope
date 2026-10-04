/**
 * The entry a reader wants is reachable by a thumb and by a keyboard.
 *
 *   npm run check:reach
 *
 * AHS-F1 and AHS-F4. The grid was the only way into an entry, and it is a
 * picture, not a control. Measured at tick 193 before the change:
 *
 *     viewport    mark width   mark height   grid starts at   fold
 *     1280x800       9.67         25.59          y 711         800
 *     390x844        2.31         18.39          y 1008        844
 *     360x640        2.03         18.39          y 1026        640
 *
 *     654 tab stops on the page, 648 of them marks
 *     13 Tab presses reach the first flame mark, Enter opens its entry,
 *     and 642 more reach anything inside it
 *
 * WCAG 2.5.8 asks for 24 by 24. A fingertip covers ten of those marks and the
 * flame ones sit among grey, so on a phone a reader can see that a mode recurs
 * and cannot open the occurrence they are looking at. From a keyboard they can
 * open one and not read it.
 *
 * Picking a mode now lists its entries: full width rows, 44 pixels minimum,
 * tick and heading, at most ten because the largest mode has ten records. The
 * marks leave the tab order and the grid goes back to being the picture.
 *
 * ## What this holds
 *
 *   1. Every row in the list is at least 44 by 44 at 1280, 390 and 360, which
 *      is the target size AAA asks for and comfortably over the 24 of AA.
 *   2. The list has one row per record in the chosen mode, and each one opens
 *      the entry it names.
 *   3. The page's tab stops stay in two figures. 648 buttons in a picture is
 *      not a keyboard path, it is a wall.
 *   4. Opening an entry moves focus into it. Enter on a row, and the next thing
 *      a screen reader reads is the entry's heading.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const corpus = JSON.parse(readFileSync(resolve(root, 'src/generated/corpus.json'), 'utf8'))

let failed = 0
const fail = (what, detail) => {
  failed++
  console.error(`FAIL  ${what}`)
  if (detail) console.error(`      ${detail}`)
}

/* AAA, because this is the only control on the page and it is a list of rows,
   where a bigger target costs nothing. AA's 24 is the floor, not the aim. */
const TARGET = 44

const { serve, useShared } = await import('./serve.mjs')
const server = process.env.AGENTSCOPE_URL ? await useShared(process.env.AGENTSCOPE_URL) : await serve()

try {
  const browser = await chromium.launch()

  for (const [w, h] of [
    [1280, 800],
    [390, 844],
    [360, 640],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.goto(server.url)
    await page.waitForFunction(() => document.querySelectorAll('.mode').length > 0, null, { timeout: 180_000 })
    await page.locator('.mode').first().click()
    await page.waitForTimeout(400)

    const seen = await page.evaluate(() => {
      const picks = [...document.querySelectorAll('.pick')]
      const boxes = picks.map((p) => p.getBoundingClientRect())
      return {
        picks: picks.length,
        minWidth: Math.min(...boxes.map((b) => b.width)),
        minHeight: Math.min(...boxes.map((b) => b.height)),
        stops: document.querySelectorAll(
          'a[href], button:not([tabindex="-1"]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ).length,
        markWidth: +(document.querySelector('.mark')?.getBoundingClientRect().width ?? 0).toFixed(2),
      }
    })

    if (seen.picks === 0) {
      fail(`at ${w}x${h} picking a mode lists nothing, so the grid is still the only way in`)
    } else if (seen.minWidth < TARGET || seen.minHeight < TARGET) {
      fail(
        `at ${w}x${h} the smallest row is ${seen.minWidth.toFixed(1)} by ${seen.minHeight.toFixed(1)}, under ${TARGET}`,
        `the marks are ${seen.markWidth} wide here, which is why the list exists`,
      )
    } else {
      console.log(
        `  ok      at ${w}x${h}: ${seen.picks} rows, none smaller than ${seen.minWidth.toFixed(0)} by ${seen.minHeight.toFixed(0)}, ` +
          `against marks ${seen.markWidth} wide`,
      )
    }

    if (seen.stops > 60) {
      fail(
        `at ${w}x${h} the page has ${seen.stops} tab stops`,
        'a picture of 648 buttons is not a keyboard path. The marks belong out of the tab order and the list belongs in it.',
      )
    } else {
      console.log(`  ok      at ${w}x${h}: ${seen.stops} tab stops, not ${corpus.entries.length * corpus.modes.length}`)
    }
    await page.close()
  }

  /* The list is the mode's own records, and each row opens what it names. */
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(server.url)
  await page.waitForFunction(() => document.querySelectorAll('.mode').length > 0, null, { timeout: 180_000 })

  for (const mode of corpus.modes.slice(0, 3)) {
    await page.click(`.mode[data-mode="${mode.id}"]`)
    await page.waitForTimeout(300)
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('.pick')].map((p) => ({
        at: Number(p.dataset.pick),
        text: p.textContent?.replace(/\s+/g, ' ').trim().slice(0, 40) ?? '',
      })),
    )
    if (rows.length !== mode.entries) {
      fail(`${mode.id} records ${mode.entries} entries and the list shows ${rows.length}`)
    } else if (rows.some((r, i) => r.at !== mode.at[i])) {
      fail(`${mode.id}: the list is not the mode's own entries`, `list ${rows.map((r) => r.at).join(',')} against ${mode.at.join(',')}`)
    } else {
      console.log(`  ok      ${mode.id}: ${rows.length} rows, each the entry it names`)
    }
    /* Toggle off so the next mode starts clean, which is what a reader does. */
    await page.click(`.mode[data-mode="${mode.id}"]`)
    await page.waitForTimeout(200)
  }

  /* And opening one puts the reader in it. */
  await page.click('.mode')
  await page.waitForTimeout(300)
  await page.locator('.pick').first().click()
  await page.waitForTimeout(1200)
  const landed = await page.evaluate(() => {
    const panel = document.querySelector('article[data-entry]')
    const active = document.activeElement
    return {
      inside: Boolean(panel && active && panel.contains(active)),
      on: active?.tagName?.toLowerCase() ?? '',
      heading: panel?.querySelector('h2')?.textContent?.slice(0, 50) ?? '',
    }
  })
  if (!landed.inside) {
    fail(
      `opening an entry leaves focus outside it, on <${landed.on}>`,
      'A keyboard reader who opens an entry and has to walk to it has not opened it.',
    )
  } else {
    console.log(`  ok      opening an entry puts focus on its <${landed.on}>, "${landed.heading}"`)
  }

  await browser.close()
} finally {
  server.stop()
}

if (failed > 0) {
  console.error('\nA picture that is also the only control is a control nobody on a phone can use.')
  process.exit(1)
}

console.log('reach: the chosen mode lists its entries, a thumb can hit them, and opening one lands the reader in it')
