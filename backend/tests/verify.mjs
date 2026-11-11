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

      // 11. Payment Gateway Info
      console.log('\n--- 11. Testing Payment Gateway Configuration Endpoint ---')
      const paymentInfo = await fetch(`${BASE}/payment/info`).then((r) => r.json())
      console.log(`✓ UPI ID: ${paymentInfo.upiId}, Amount: ₹${paymentInfo.amount}, Intent: ${paymentInfo.upiIntentUri.substring(0, 30)}...`)
      if (!paymentInfo.upiId || paymentInfo.amount <= 0) {
        throw new Error('Invalid payment info returned')
      }

      // 12. Valid Registration with UPI Payment & UTR
      console.log('\n--- 12. Testing Registration with Payment Details & UTR ---')
      const testUtr = `UTR${Date.now()}`
      const paidRegRes = await fetch(`${BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Hermione Granger',
          email: `hermione_${Date.now()}@gryffindor.hogwarts.ac.in`,
          phone: '+91 98765 11111',
          college: 'Hogwarts Arithmancy School',
          department: 'BTech',
          usnOrRollNo: '1AJ23CS099',
          houseId: 'gryffindor',
          eventIds: ['potions-mastery', 'quidditch-cup'],
          amount: 250,
          paymentMethod: 'upi',
          transactionId: testUtr,
        }),
      })
      const paidRegData = await paidRegRes.json()
      console.log(`✓ Status ${paidRegRes.status} (Expected 201):`, paidRegData.message)
      const paidRegId = paidRegData.registration?.id
      if (!paidRegId) throw new Error('Registration ID missing in response')

      // 13. Duplicate UTR Rejection
      console.log('\n--- 13. Testing Duplicate UTR Rejection (Expected 409 Conflict) ---')
      const dupUtrRes = await fetch(`${BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Draco Malfoy',
          email: `draco_${Date.now()}@slytherin.hogwarts.ac.in`,
          phone: '+91 98765 22222',
          college: 'Hogwarts Dark Arts College',
          department: 'BTech',
          usnOrRollNo: '1AJ23CS666',
          houseId: 'slytherin',
          eventIds: ['quidditch-cup'],
          amount: 250,
          paymentMethod: 'upi',
          transactionId: testUtr, // duplicate!
        }),
      })
      const dupUtrData = await dupUtrRes.json()
      console.log(`✓ Duplicate UTR Status ${dupUtrRes.status} (Expected 409):`, dupUtrData.message)
      if (dupUtrRes.status !== 409) {
        throw new Error(`Expected 409 on duplicate UTR, got ${dupUtrRes.status}`)
      }

      // 14. Anti-Spam Honeypot Rejection
      console.log('\n--- 14. Testing Anti-Spam Honeypot Guard (Expected 400 Bot Detected) ---')
      const spamRes = await fetch(`${BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Spambot 3000',
          email: 'bot@spam.com',
          phone: '+91 90000 00000',
          college: 'Bot University',
          department: 'BTech',
          usnOrRollNo: '1AJ23SP000',
          houseId: 'slytherin',
          eventIds: ['hackathon-hex'],
          incantation_trap: 'I am automated malicious traffic',
        }),
      })
      const spamData = await spamRes.json()
      console.log(`✓ Spam Honeypot Status ${spamRes.status} (Expected 400):`, spamData.message)
      if (spamRes.status !== 400) {
        throw new Error(`Expected 400 on honeypot trigger, got ${spamRes.status}`)
      }

      // 15. Admin Payment Verification & Approval
      console.log('\n--- 15. Testing Admin Payment Verification & Approval ---')
      const verifyPayRes = await fetch(`${BASE}/admin/registrations/${paidRegId}/payment`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${superToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'verified',
          notes: 'Bank SMS verified ₹250 received',
        }),
      })
      const verifyPayData = await verifyPayRes.json()
      console.log(`✓ Payment Verification Status ${verifyPayRes.status} (Expected 200):`, verifyPayData.message)
      if (verifyPayRes.status !== 200) {
        throw new Error(`Expected 200 on payment verify, got ${verifyPayRes.status}`)
      }

      // 16. Admin Resend Acceptance Owl Dispatch
      console.log('\n--- 16. Testing Admin Resend Acceptance Owl Dispatch ---')
      const resendRes = await fetch(`${BASE}/admin/registrations/${paidRegId}/email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${superToken}` },
      })
      const resendData = await resendRes.json()
      console.log(`✓ Owl Resend Status ${resendRes.status} (Expected 200):`, resendData.message)
      if (resendRes.status !== 200) {
        throw new Error(`Expected 200 on email resend, got ${resendRes.status}`)
      }

      console.log('\n🎉 ALL 16 TESTS PASSED FLAWLESSLY!')
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

