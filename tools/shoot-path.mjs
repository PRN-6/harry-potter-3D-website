/**
 * Screenshots the scroll-driven camera at every keyframe.
 *
 * The site's whole content is a 3D hall whose camera follows the scroll, so
 * a single screenshot proves very little. This walks the page through the
 * scroll positions and writes one PNG per stop, which is the only way to
 * check that every shot on the camera path actually frames something.
 *
 *   node tools/shoot-path.mjs <url> <outDir> [width] [height] [stops] [waitMs]
 */
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [url = 'http://localhost:5177/', outDir = 'shots', w = '1440', h = '900', stops = '8', waitMs = '40000'] =
  process.argv.slice(2)

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = mkdtempSync(join(tmpdir(), 'chrome-path-'))
const port = 9700 + Math.floor(Math.random() * 200)

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
await send('Runtime.enable')
await send('Log.enable')

// Surface anything the page logs. A silent black canvas is nearly
// impossible to debug otherwise.
const consoleLines = []
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = (msg.params.args ?? [])
      .map((a) => a.value ?? a.description ?? a.unserializableValue ?? '')
      .join(' ')
    consoleLines.push(`[${msg.params.type}] ${text}`)
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    consoleLines.push(
      `[error] ${msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text}`,
    )
  }
  if (msg.method === 'Log.entryAdded') {
    consoleLines.push(`[${msg.params.entry.level}] ${msg.params.entry.text}`)
  }
})

await send('Emulation.setDeviceMetricsOverride', {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: 1,
  mobile: Number(w) < 600,
})

await send('Page.navigate', { url })

// Wait for the model to download and the scene to settle.
console.log(`waiting ${waitMs}ms for the model…`)
await sleep(Number(waitMs))

mkdirSync(outDir, { recursive: true })

const n = Number(stops)
for (let i = 0; i < n; i++) {
  const t = n === 1 ? 0 : i / (n - 1)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo({ top: ${t} * max, behavior: 'instant' })
      return Math.round(window.scrollY)
    })()`,
  })
  // Let the camera ease into the new position.
  await sleep(2500)

  const name = join(outDir, `path-${String(i).padStart(2, '0')}.png`)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  if (shot.result?.data) {
    writeFileSync(name, Buffer.from(shot.result.data, 'base64'))
    console.log(`WROTE ${name}  (scroll ${Math.round(t * 100)}%)`)
  } else {
    console.error('NO SCREENSHOT at', i, JSON.stringify(shot).slice(0, 200))
  }
}

ws.close()
chrome.kill()

if (consoleLines.length) {
  console.log('\nPAGE CONSOLE')
  for (const line of consoleLines.slice(0, 60)) console.log('  ' + line)
} else {
  console.log('\nPAGE CONSOLE — (nothing logged)')
}

process.exit(0)
