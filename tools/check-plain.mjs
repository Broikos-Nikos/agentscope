/**
 * What built this log is on the screen before anybody scrolls.
 *
 *   npm run check:plain
 *
 * ARC-F1. Counted before tick 194, in the whole README: "AI" 0, "LLM" 0,
 * "model" 0, "Claude" 0, "agent" 3. Above the fold at 1280x800 and at 390x844:
 * "AI" 0. The opening a recruiter got was
 *
 *     An agent wrote down six failures 32 times in 108 entries, and kept making them.
 *     A development log, kept by the thing it was about, for five days and 108 entries.
 *
 * and "an agent" could be an estate agent while "the thing it was about" is a
 * riddle to solve before knowing what the project is. The fact that makes this
 * worth stopping for, that an AI coding agent kept a log of its own mistakes
 * while it built six other things and made them again, was not on the screen.
 *
 * ## What this holds
 *
 *   1. The headline, the first paragraph of the README and the meta description
 *      each say "AI". That is the word the recruiter pass said has to be there,
 *      and the one a reader scans for.
 *   2. It is above the fold at 1280x800 and at 390x844, in the text a reader
 *      meets without scrolling, because a word in a paragraph below the picture
 *      is a word nobody read.
 *   3. No tool is named. The category is the claim this project can support; the
 *      tool is a detail the whole workspace leaves out, including in its
 *      commits, and the frozen corpus names none either. D22 records why, and
 *      this is what stops the decision being quietly reversed by an edit.
 *
 * The words are counted with a plain regex over text, not with `\\b` inside a
 * template literal, which is a backspace character and has already cost this
 * workspace one gate that asserted nothing.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

let failed = 0
const fail = (what, detail) => {
  failed++
  console.error(`FAIL  ${what}`)
  if (detail) console.error(`      ${detail}`)
}

const WORD = (text, word) => (text.match(new RegExp(String.raw`\b` + word + String.raw`\b`, 'gi')) ?? []).length

/* Tool names this workspace does not use. Not a blocklist of vendors: a list of
   the things somebody would reach for if they wanted the page to sound more
   impressive than it can prove. */
const TOOLS = ['Claude', 'Copilot', 'Cursor', 'Anthropic', 'ChatGPT', 'Codex', 'Devin']

const readme = readFileSync(resolve(root, 'README.md'), 'utf8')
const opening = readme.split(/\n#{1,3} |\n---/)[0] + readme.split('\n').slice(0, 12).join('\n')

if (WORD(opening, 'AI') === 0) {
  fail(
    'the README opening does not say "AI"',
    `counted in the first twelve lines: AI ${WORD(opening, 'AI')}, LLM ${WORD(opening, 'LLM')}, agent ${WORD(opening, 'agent')}. ` +
      'A reader who cannot tell this apart from an HR metaphor does not scroll.',
  )
} else {
  console.log(`  ok      the README opening says "AI" ${WORD(opening, 'AI')} times in its first twelve lines`)
}

const named = TOOLS.filter((t) => WORD(readme, t) > 0)
if (named.length > 0) {
  fail(
    `the README names a tool: ${named.join(', ')}`,
    'The category is what this project can support. D22: the tool is left out here as it is everywhere else in this workspace.',
  )
} else {
  console.log(`  ok      the README names none of the ${TOOLS.length} tools, only what kind of thing it was`)
}

const { serve, useShared } = await import('./serve.mjs')
const server = process.env.AGENTSCOPE_URL ? await useShared(process.env.AGENTSCOPE_URL) : await serve()

try {
  const browser = await chromium.launch()
  for (const [w, h] of [
    [1280, 800],
    [390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.goto(server.url)
    await page.waitForFunction(() => document.querySelectorAll('[data-mark]').length > 0, null, { timeout: 180_000 })
    await page.waitForTimeout(500)

    const seen = await page.evaluate(() => {
      const out = []
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let t = walk.nextNode(); t; t = walk.nextNode()) {
        const s = t.textContent.trim()
        if (!s) continue
        const r = t.parentElement.getBoundingClientRect()
        if (r.top + window.scrollY < window.innerHeight) out.push(s)
      }
      return {
        text: out.join(' ').replace(/\s+/g, ' '),
        description: document.querySelector('meta[name=description]')?.content ?? '',
      }
    })

    if (WORD(seen.text, 'AI') === 0) {
      fail(
        `at ${w}x${h} nothing above the fold says "AI"`,
        `${seen.text.length} characters are on the first screen and none of them is the word a reader scans for: ` +
          JSON.stringify(seen.text.slice(0, 90)),
      )
    } else {
      console.log(`  ok      at ${w}x${h} the first screen says "AI" ${WORD(seen.text, 'AI')} times`)
    }

    if (w === 1280) {
      if (WORD(seen.description, 'AI') === 0) {
        fail('the meta description does not say "AI"', 'It is the whole of what a forwarded link shows.')
      } else {
        console.log('  ok      the meta description says "AI", which is all a forwarded link shows')
      }
      const inMeta = TOOLS.filter((t) => WORD(seen.description, t) > 0)
      if (inMeta.length > 0) fail(`the meta description names a tool: ${inMeta.join(', ')}`)
    }
    await page.close()
  }
  await browser.close()
} finally {
  server.stop()
}

if (failed > 0) {
  console.error('\nA reader who cannot tell in ten seconds what made this log does not get to the part that is interesting.')
  process.exit(1)
}

console.log('plain: the first screen, the README and the meta description all say what kind of thing wrote this')
