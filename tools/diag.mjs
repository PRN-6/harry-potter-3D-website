/**
 * Prints what the page actually fetched and what it logged.
 *
 * A black canvas with no console output is the hardest thing to debug in
 * the browser, so this dumps the resource timings (which shows whether the
 * 38 MB GLB was actually downloaded, and how long it took) plus every
 * console message and error.
 *
 *   node tools/diag.mjs <url> [waitMs]
 */
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [url = 'http://localhost:5177/', waitMs = '30000'] = process.argv.slice(2)

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = mkdtempSync(join(tmpdir(), 'chrome-diag-'))
const port = 9400 + Math.floor(Math.random() * 200)

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--window-size=1440,900',
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

const ws = new WebSocket(await getWsUrl())
let id = 0
const pending = new Map()
const lines = []
const failures = []
const requests = []
const responses = []

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
    return
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = (msg.params.args ?? [])
      .map((a) => a.value ?? a.description ?? '')
      .join(' ')
    lines.push(`[${msg.params.type}] ${text}`)
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    lines.push(
      `[EXCEPTION] ${msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text}`,
    )
  }
  if (msg.method === 'Log.entryAdded') {
    lines.push(`[${msg.params.entry.level}] ${msg.params.entry.text}`)
  }
  if (msg.method === 'Network.loadingFailed') {
    failures.push(`${msg.params.type} ${msg.params.errorText} ${msg.params.blockedReason ?? ''}`)
  }
  if (msg.method === 'Network.requestWillBeSent') {
    requests.push(msg.params.request.url)
  }
  if (msg.method === 'Network.responseReceived') {
    responses.push(
      `${msg.params.response.status} ${(msg.params.response.url || '').split('/').pop()} ${Math.round(msg.params.response.encodedDataLength / 1024)}kB`,
    )
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
await send('Network.enable')
await send('Page.navigate', { url })

await sleep(Number(waitMs))

const probe = await send('Runtime.evaluate', {
  expression: `JSON.stringify({
    resources: performance.getEntriesByType('resource')
      .filter(r => r.name.includes('glb') || r.name.includes('models'))
      .map(r => ({ name: r.name.split('/').pop(), bytes: r.transferSize, dur: Math.round(r.duration), size: r.decodedBodySize })),
    canvas: !!document.querySelector('canvas'),
    canvasSize: (() => { const c = document.querySelector('canvas'); return c ? c.width + 'x' + c.height : null })(),
    scrollHeight: document.documentElement.scrollHeight,
    loaderText: document.body.innerText.slice(0, 200),
  })`,
  returnByValue: true,
})

console.log('PROBE:', probe.result?.result?.value)
console.log('\nNETWORK FAILURES:', failures.length ? failures : '(none)')
console.log('\nREQUESTS:')
for (const r of requests) console.log('  ' + r)
console.log('\nRESPONSES:')
for (const r of responses) console.log('  ' + r)
console.log('\nCONSOLE:')
for (const line of lines) console.log('  ' + line)
if (!lines.length) console.log('  (nothing logged)')

ws.close()
chrome.kill()
process.exit(0)
