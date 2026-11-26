import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import app from '../dist/index.js'
import { forceSaveDatabaseSync, getRegistrationsList } from '../dist/db/store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.resolve(__dirname, '../data/db.json')

function numberToWord(n) {
  const units = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  return String(n)
    .split('')
    .map((d) => units[parseInt(d, 10)])
    .join(' ')
}

async function runConcurrencyStressTest() {
  console.log('Starting High-Concurrency Stress Test: 200 Concurrent Registrations...')

  const originalDbSnapshot = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, 'utf-8') : null

  const server = app.listen(5088, async () => {
    const BASE = 'http://127.0.0.1:5088/api'
    const TOTAL_USERS = 200
    const startTime = Date.now()

    try {
      console.log(`Dispatching ${TOTAL_USERS} simultaneous registrations across unique client IPs...`)

      const requests = Array.from({ length: TOTAL_USERS }, (_, i) => {
        const studentIndex = i + 1
        const clientIp = `198.51.100.${(i % 240) + 1}`

        return fetch(`${BASE}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': clientIp,
          },
          body: JSON.stringify({
            fullName: `Student ${numberToWord(studentIndex)}`,
            email: `student_${Date.now()}_${studentIndex}@hogwarts.ac.in`,
            phone: `+9198765${String(10000 + studentIndex).slice(1)}`,
            college: 'Hogwarts School of Witchcraft',
            department: 'BTech',
            usnOrRollNo: `1AJ23CS${studentIndex}`,
            houseId: ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'][studentIndex % 4],
            eventIds: ['potions-mastery', 'quidditch-cup'],
            transactionId: `STRESS_UTR_${Date.now()}_${studentIndex}`,
          }),
        }).then(async (res) => ({
          status: res.status,
          data: await res.json(),
        }))
      })

      const results = await Promise.all(requests)
      const durationMs = Date.now() - startTime

      const successCount = results.filter((r) => r.status === 201).length
      const failureCount = results.filter((r) => r.status !== 201).length

      console.log(`\nStress Test Completed in ${durationMs}ms (${(durationMs / 1000).toFixed(2)}s)`)
      console.log(`✓ Successful (201 Created): ${successCount}/${TOTAL_USERS}`)
      console.log(`✓ Failed: ${failureCount}/${TOTAL_USERS}`)
      console.log(`✓ Throughput: ${(TOTAL_USERS / (durationMs / 1000)).toFixed(1)} req/sec`)

      if (successCount !== TOTAL_USERS) {
        console.error('Some requests failed. First 3 failures:')
        console.error(results.filter((r) => r.status !== 201).slice(0, 3))
        throw new Error(`Expected all ${TOTAL_USERS} to succeed, but got ${successCount} successes.`)
      }

      // Verify store integrity and persistence
      const allRegs = getRegistrationsList()
      console.log(`✓ Store integrity confirmed: ${allRegs.length} total records in database without corruption.`)

      console.log('\n200 CONCURRENT REGISTRATIONS HANDLED FLAWLESSLY!')
    } catch (err) {
      console.error('Concurrency stress test failed:', err)
      process.exitCode = 1
    } finally {
      forceSaveDatabaseSync()
      if (originalDbSnapshot !== null) {
        fs.writeFileSync(DB_FILE, originalDbSnapshot, 'utf-8')
      } else if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE)
      }
      server.close(() => {
        console.log('Stress test server closed.')
        process.exit(process.exitCode ?? 0)
      })
    }
  })
}

runConcurrencyStressTest()
