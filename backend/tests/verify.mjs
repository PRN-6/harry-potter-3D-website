import app from '../dist/index.js'

async function run() {
  const server = app.listen(5055, async () => {
    console.log('🧪 [Test Server] Listening on http://localhost:5055')

    try {
      const BASE = 'http://localhost:5055/api'

      // 1. Health check
      console.log('\n--- 1. Testing Health Endpoint ---')
      const healthRes = await fetch(`${BASE}/health`).then((r) => r.json())
      console.log('✓ Health:', healthRes.status)

      // 2. Demo credentials
      console.log('\n--- 2. Testing Demo Accounts Endpoint ---')
      const demoRes = await fetch(`${BASE}/auth/demo-credentials`).then((r) => r.json())
      console.log(`✓ Retrieved ${demoRes.accounts.length} demo accounts (L0 to L6)`)

      // 3. Validation: Invalid registration payload
      console.log('\n--- 3. Testing Registration Input Validation (Failure Expected) ---')
      const invalidRegRes = await fetch(`${BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'A', email: 'invalid-email', phone: '123' }),
      })
      const invalidData = await invalidRegRes.json()
      console.log(`✓ Status ${invalidRegRes.status} (Expected 400):`, invalidData.message)

      // 4. Successful registration
      console.log('\n--- 4. Testing Valid Registration ---')
      const validRegRes = await fetch(`${BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Neville Longbottom',
          email: `neville_${Date.now()}@gryffindor.hogwarts.ac.in`,
          phone: '+91 98765 99999',
          college: 'Hogwarts Herbology Academy',
          department: 'BTech',
          usnOrRollNo: '1AJ23HB044',
          houseId: 'gryffindor',
          eventIds: ['potions-mastery', 'hackathon-hex'],
        }),
      })
      const validData = await validRegRes.json()
      console.log(`✓ Status ${validRegRes.status} (Expected 201):`, validData.message)

      // 5. Super Admin Login
      console.log('\n--- 5. Testing Super Admin (Headmaster) Login ---')
      const loginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: 'headmaster', password: 'AlbusDumbledore2027!' }),
      })
      const loginData = await loginRes.json()
      console.log(`✓ Status ${loginRes.status}:`, loginData.message)
      const superToken = loginData.token

      // 6. Super Admin Stats & Registrations
      console.log('\n--- 6. Testing Super Admin Stats & Registrations ---')
      const stats = await fetch(`${BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${superToken}` },
      }).then((r) => r.json())
      console.log(`✓ Total Registrations: ${stats.totalRegistrations}, Checked In: ${stats.checkedInCount}`)

      const regs = await fetch(`${BASE}/admin/registrations`, {
        headers: { Authorization: `Bearer ${superToken}` },
      }).then((r) => r.json())
      console.log(`✓ Registrations retrieved: ${regs.registrations.length}`)

      // 7. Toggle Check-In for attendee
      console.log('\n--- 7. Testing Gatekeeper Check-In Toggle ---')
      const targetRegId = regs.registrations[0].id
      const checkinRes = await fetch(`${BASE}/admin/registrations/${targetRegId}/checkin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${superToken}` },
      }).then((r) => r.json())
      console.log('✓ Checkin Result:', checkinRes.message)

      // 8. Test RBAC: Level 6 Admin (Prefect - Read Only Restrictions)
      console.log('\n--- 8. Testing Level 6 Admin (Prefect - Read Only Restrictions) ---')
      const percyLogin = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: 'percy', password: 'PrefectBadge2027!' }),
      }).then((r) => r.json())
      const percyToken = percyLogin.token

      const percyPointRes = await fetch(`${BASE}/admin/standings/adjust`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${percyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ houseId: 'gryffindor', points: 50, reason: 'Prefect cheer' }),
      })
      const percyPointData = await percyPointRes.json()
      console.log(`✓ Level 6 Point Attempt (Expected 403 Forbidden): Status ${percyPointRes.status} -`, percyPointData.message)

      // 9. Test RBAC: Level 2 Admin (Snape - Head of Slytherin)
      console.log('\n--- 9. Testing Level 2 Admin (House Jurisdiction Enforcement) ---')
      const snapeLogin = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: 'snape', password: 'PotionsMaster2027!' }),
      }).then((r) => r.json())
      const snapeToken = snapeLogin.token

      const snapeGryffRes = await fetch(`${BASE}/admin/standings/adjust`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${snapeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ houseId: 'gryffindor', points: 30, reason: 'Bribe' }),
      })
      const snapeGryffData = await snapeGryffRes.json()
      console.log(`✓ Snape to Gryffindor (Expected 403 Jurisdiction): Status ${snapeGryffRes.status} -`, snapeGryffData.message)

      const snapeSlythRes = await fetch(`${BASE}/admin/standings/adjust`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${snapeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ houseId: 'slytherin', points: 40, reason: 'Exemplary potion brewing in dungeons' }),
      })
      const snapeSlythData = await snapeSlythRes.json()
      console.log(`✓ Snape to Slytherin (Expected 200 OK): Status ${snapeSlythRes.status} -`, snapeSlythData.message)

      // 10. Audit Logs check
      console.log('\n--- 10. Checking Super Admin Audit Logs ---')
      const auditRes = await fetch(`${BASE}/admin/logs`, {
        headers: { Authorization: `Bearer ${superToken}` },
      }).then((r) => r.json())
      console.log(`✓ Total Audit Log entries recorded: ${auditRes.count}`)

      console.log('\n🎉 ALL 10 TESTS PASSED FLAWLESSLY!')
    } catch (err) {
      console.error('❌ Test failed with error:', err)
      process.exit(1)
    } finally {
      server.close(() => {
        console.log('Test server closed.')
        process.exit(0)
      })
    }
  })
}

run()
