/**
 * What the recording is a recording of, in one place.
 *
 * `capture.mjs` films the page and writes this down; `check-capture.mjs` drives
 * the page to the same state and compares. One function, used by both, so the
 * gate can never end up checking that two descriptions agree about a mistake.
 *
 * Three projects in this workspace learned the same lesson to get here.
 * `watch-it-think` shipped a recording of a green page for two days after the
 * page became flame and blue, under a README sentence calling it the real page,
 * and nothing failed because a GIF cannot go stale loudly. Its first fix
 * recorded eight colours and a typeface, and then passed over a recording
 * showing a headline that had been rewritten. `tokenlab`'s picture was correct
 * only because the capture happened to be re-run three minutes after its palette
 * was replaced.
 *
 * So this records the paint, the words **and** the numbers on screen. For this
 * page the numbers are what the picture is: a reader counts marks in a row.
 */

/**
 * The mode the recording ends on, and why this one.
 *
 * `green-control` is the argument. It is this workspace's most repeated lesson,
 * written into the build contract twice in bold, and its marks sit at x=176 and
 * again at 891, 1041 and 1190: the same mistake at the start of the log and
 * three more times near the end, a hundred entries after it was written down.
 * Selecting it dims the other five rows and leaves that spread alone on screen,
 * which is the whole claim of the project in one gesture.
 */
export const FINAL_MODE = 'green-control'

/**
 * Read the page. Runs inside the browser, in both tools.
 *
 * Wider than a palette on purpose. A gate written about a stale picture has to
 * look at everything a reader can see in the picture, and that includes the
 * count of marks, because a recording showing five marks over a page that now
 * draws six is a lie no matter what colour it is.
 */
export function lookAt() {
  const s = getComputedStyle(document.documentElement)
  const paint = {}
  for (const k of ['--ink', '--lift', '--edge', '--text', '--dim', '--faint', '--flame', '--flame-bright']) {
    paint[k] = s.getPropertyValue(k).trim()
  }
  paint.bodyFont = getComputedStyle(document.body).fontFamily
  paint.wash = getComputedStyle(document.body).backgroundColor

  const text = (sel) => document.querySelector(sel)?.textContent?.trim() ?? ''

  const words = {
    headline: text('[data-headline]'),
    wordmark: text('.wordmark'),
    status: text('[data-status]'),
  }

  const selectedRow = document.querySelector('.mode[aria-pressed="true"]')?.dataset?.mode ?? ''
  const state = {
    selected: selectedRow,
    rows: document.querySelectorAll('.row').length,
    columns: document.querySelectorAll('.row .mark').length / Math.max(1, document.querySelectorAll('.row').length),
    filled: document.querySelectorAll('.mark--on, .mark--run').length,
    /* The list the chosen mode opens, which is the page's way into an entry
       since AHS-F1. A recording the README calls the real page has to show the
       control a visitor uses, and three gates in this workspace have now been
       caught pinning everything except the thing that changed. */
    picks: document.querySelectorAll('.pick').length,
    runs: document.querySelectorAll('.mark--run').length,
    // The selected row's own marks, which is what the reader is looking at when
    // the recording stops.
    selectedRuns: selectedRow
      ? document.querySelectorAll(`.row[data-mode="${selectedRow}"] .mark--run`).length
      : 0,
    entryOpen: !document.querySelector('[data-entry]')?.hidden,
  }

  return { paint, words, state }
}
