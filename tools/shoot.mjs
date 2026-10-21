/**
 * Renders the site headlessly and writes a screenshot.
 *
 * Uses the Chrome DevTools Protocol over a WebSocket so no extra npm
 * dependency (puppeteer) is needed.
 *
 *   node tools/shoot.mjs <url> <out.png> [width] [height] [waitMs]
 */
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [url = 'http://localhost:5173/', out = 'shot.png', w = '1440', h = '900', waitMs = '9000'] =
  process.argv.slice(2)

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = mkdtempSync(join(tmpdir(), 'chrome-shot-'))
const port = 9222 + Math.floor(Math.random() * 500)

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${w},${h}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      const tabs = await res.json()
      const page = tabs.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  throw new Error('Chrome DevTools did not come up')
}

const wsUrl = await getWsUrl()
const ws = new WebSocket(wsUrl)
let id = 0
const pending = new Map()

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
})

await new Promise((r) => ws.addEventListener('open', r, { once: true }))

function send(method, params = {}) {
  const msgId = ++id
  ws.send(JSON.stringify({ id: msgId, method, params }))
  return new Promise((resolve) => pending.set(msgId, resolve))
}

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: 1,
  mobile: Number(w) < 600,
})

await send('Page.navigate', { url })
await sleep(Number(waitMs))

// Optionally scroll an element into view before shooting.
const scrollTo = process.env.SHOT_SCROLL_TO
if (scrollTo) {
  await send('Runtime.evaluate', {
    expression: `document.querySelector(${JSON.stringify(scrollTo)})?.scrollIntoView({block:'start'})`,
  })
  await sleep(Number(process.env.SHOT_SCROLL_WAIT ?? 2500))
}

// Or scroll to an absolute pixel offset.
const scrollY = process.env.SHOT_SCROLL_Y
if (scrollY) {
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({ top: ${Number(scrollY)}, behavior: 'instant' })`,
  })
  await sleep(Number(process.env.SHOT_SCROLL_WAIT ?? 2500))
}

// Collect anything the page logged, so runtime errors are visible.
const logs = await send('Runtime.evaluate', {
  expression:
    'JSON.stringify({ title: document.title, h1: document.querySelector("h1")?.textContent, sections: document.querySelectorAll("section").length, canvas: !!document.querySelector("canvas"), scrollY: Math.round(window.scrollY) })',
  returnByValue: true,
})
console.log('PAGE:', logs.result?.result?.value)

const shot = await send('Page.captureScreenshot', {
  format: 'png',
  // SHOT_FULL=1 captures the whole scrollable page; otherwise just the
  // viewport, which is what you want for inspecting a single section.
  captureBeyondViewport: process.env.SHOT_FULL === '1',
})
if (shot.result?.data) {
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'))
  console.log('WROTE', out)
} else {
  console.error('NO SCREENSHOT', JSON.stringify(shot).slice(0, 400))
}

ws.close()
chrome.kill()
process.exit(0)
