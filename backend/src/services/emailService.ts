import nodemailer, { type Transporter } from 'nodemailer'
import { Registration } from '../models/types.js'

const smtpHost = process.env.SMTP_HOST?.trim()
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
const smtpUser = process.env.SMTP_USER?.trim()
const smtpPass = process.env.SMTP_PASS?.trim()
const smtpFrom = process.env.SMTP_FROM?.trim() || '"Hogwarts High Council" <astrix2027@hogwarts.ac.in>'

const isSmtpConfigured = Boolean(smtpHost && smtpUser && smtpPass)

let transporter: Transporter | null = null

if (isSmtpConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
    console.log(`✉️ [Owl Post Service] Connected to SMTP server ${smtpHost}:${smtpPort}`)
  } catch (err) {
    console.warn('⚠️ [Owl Post Warning] Could not initialize SMTP transporter:', err)
  }
} else {
  console.log('📬 [Owl Post Service] SMTP credentials not set in .env; running in Test Preview mode (letters logged to console).')
}

export interface EmailDispatchResult {
  sent: boolean
  mode: 'live_smtp' | 'test_preview'
  messageId?: string
  error?: string
}

function generateAcceptanceLetterHtml(r: Registration): string {
  const houseColor =
    r.houseId === 'gryffindor'
      ? '#ae1c28'
      : r.houseId === 'slytherin'
      ? '#0a5c36'
      : r.houseId === 'ravenclaw'
      ? '#0e1a40'
      : '#ecb939'

  const houseCrestEmoji =
    r.houseId === 'gryffindor' ? '🦁' : r.houseId === 'slytherin' ? '🐍' : r.houseId === 'ravenclaw' ? '🦅' : '🦡'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hogwarts Acceptance Letter — AJ-ASTRIX 2K27</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0502; font-family: 'Cinzel', Georgia, serif; color: #f5eedc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0502; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Parchment Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #170d06; border: 2px solid #d4af37; border-radius: 16px; box-shadow: 0 0 40px rgba(212, 175, 55, 0.25); overflow: hidden;">
          
          <!-- Header Seal Banner -->
          <tr>
            <td align="center" style="padding: 30px 20px 20px 20px; border-bottom: 1px solid rgba(212, 175, 55, 0.3); background-color: #100803;">
              <div style="font-size: 38px; margin-bottom: 8px;">⚡</div>
              <h1 style="margin: 0; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; color: #ffd700; font-weight: 900;">
                AJ-ASTRIX 2K27
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #d4a373;">
                Hogwarts College of Wizardry & Engineering Festival
              </p>
              <div style="margin-top: 10px; font-size: 11px; font-style: italic; color: #a89f91;">
                Headmaster: Professor Albus Dumbledore · Order of Merlin, 1st Class
              </div>
            </td>
          </tr>

          <!-- Letter Body -->
          <tr>
            <td style="padding: 30px 35px 25px 35px; line-height: 1.7; font-size: 14px; color: #eae0d0;">
              <p style="margin-top: 0; font-size: 16px; font-weight: bold; color: #ffd700;">
                Dear ${r.fullName},
              </p>

              <p>
                We are delighted to inform you that you have been officially admitted to the 
                <strong>AJ-ASTRIX 2K27 Grand Festival</strong>. The Sorting Hat has placed you into:
              </p>

              <!-- House Crest Card -->
              <div style="text-align: center; margin: 25px 0; padding: 18px; border: 1px solid ${houseColor}; border-radius: 12px; background-color: #0d0603;">
                <span style="font-size: 32px;">${houseCrestEmoji}</span>
                <h2 style="margin: 6px 0 2px 0; color: #ffd700; letter-spacing: 3px; font-size: 20px; text-transform: uppercase;">
                  ${r.houseId.toUpperCase()}
                </h2>
                <div style="font-size: 11px; color: #c9a44c; letter-spacing: 1px;">
                  +5 Points awarded to your House in the House Cup! 🏆
                </div>
              </div>

              <!-- Official Entry Pass Details Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background-color: #0d0703; border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 8px; margin-bottom: 25px; font-size: 12px;">
                <tr>
                  <td style="color: #c9a44c; border-bottom: 1px solid #2a1608;">Registration ID:</td>
                  <td style="font-weight: bold; color: #ffffff; border-bottom: 1px solid #2a1608; font-family: monospace;">${r.id}</td>
                </tr>
                <tr>
                  <td style="color: #c9a44c; border-bottom: 1px solid #2a1608;">Institution / College:</td>
                  <td style="color: #ffffff; border-bottom: 1px solid #2a1608;">${r.college} (${r.department || 'General'})</td>
                </tr>
                <tr>
                  <td style="color: #c9a44c; border-bottom: 1px solid #2a1608;">Festival Dates:</td>
                  <td style="color: #ffffff; border-bottom: 1px solid #2a1608;">25 & 26 October 2027</td>
                </tr>
                <tr>
                  <td style="color: #c9a44c; border-bottom: 1px solid #2a1608;">Venues:</td>
                  <td style="color: #ffffff; border-bottom: 1px solid #2a1608;">The Great Hall, Alchemy Dungeons & Quidditch Pitch</td>
                </tr>
                <tr>
                  <td style="color: #c9a44c; border-bottom: 1px solid #2a1608;">Registered Events:</td>
                  <td style="color: #ffffff; border-bottom: 1px solid #2a1608;">${r.eventIds.length > 0 ? r.eventIds.join(', ') : 'All-Access Symposium Pass'}</td>
                </tr>
                <tr>
                  <td style="color: #c9a44c;">Payment Status:</td>
                  <td style="font-weight: bold; color: ${r.paymentStatus === 'verified' ? '#4ade80' : '#facc15'};">
                    ${r.paymentStatus.toUpperCase()} (₹${r.amount}) ${r.transactionId ? `· UTR: ${r.transactionId}` : ''}
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #bbb;">
                Please present this owl dispatch or your <strong>Registration ID (${r.id})</strong> at the 
                arrival desk (Platform 9¾ / Gatekeeper Desk) to claim your physical badge and house lanyard.
              </p>

              <!-- Sign-off -->
              <div style="margin-top: 30px; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 15px;">
                <p style="margin: 0; font-size: 13px; color: #ffd700;">Yours sincerely,</p>
                <p style="margin: 4px 0 0 0; font-weight: bold; color: #ffffff;">Professor Minerva McGonagall</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #c9a44c; font-style: italic;">
                  Deputy Headmistress & Festival High Council
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 15px; background-color: #080402; border-top: 1px solid rgba(212, 175, 55, 0.2); font-size: 11px; color: #8c8273;">
              "Help will always be given at Hogwarts to those who ask for it." · AJ-ASTRIX 2K27
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Dispatches the official Hogwarts Acceptance Letter & Fest Entry Pass.
 */
export async function sendAcceptanceEmail(registration: Registration): Promise<EmailDispatchResult> {
  const subject = `✦ Hogwarts Acceptance Letter & Entry Pass · AJ-ASTRIX 2K27 [${registration.id}]`
  const html = generateAcceptanceLetterHtml(registration)

  if (isSmtpConfigured && transporter) {
    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to: registration.email,
        subject,
        html,
      })
      console.log(`✉️ [Owl Post Sent] Dispatched to ${registration.email} (MessageID: ${info.messageId})`)
      return { sent: true, mode: 'live_smtp', messageId: info.messageId }
    } catch (err: any) {
      console.error(`❌ [Owl Post Error] Failed to send email to ${registration.email}:`, err)
      return { sent: false, mode: 'live_smtp', error: err.message }
    }
  }

  // Fallback: Test Preview Mode
  console.log(`\n📬 ================= [OWL POST LETTER DISPATCH (PREVIEW)] =================`)
  console.log(`To: ${registration.fullName} <${registration.email}>`)
  console.log(`Subject: ${subject}`)
  console.log(`Registration ID: ${registration.id} | House: ${registration.houseId.toUpperCase()}`)
  console.log(`Payment Status: ${registration.paymentStatus.toUpperCase()} (₹${registration.amount}) | UTR: ${registration.transactionId || 'None'}`)
  console.log(`===========================================================================\n`)

  return { sent: true, mode: 'test_preview' }
}

/**
 * Dispatches payment verified confirmation email when an admin approves the payment receipt.
 */
export async function sendPaymentVerifiedEmail(registration: Registration): Promise<EmailDispatchResult> {
  const subject = `✓ Payment Verified & Sealed · AJ-ASTRIX 2K27 [${registration.id}]`
  const html = `
    <div style="background-color: #120904; color: #f5eedc; font-family: Georgia, serif; padding: 25px; border-radius: 12px; border: 1px solid #d4af37; max-width: 550px; margin: auto;">
      <h2 style="color: #4ade80; margin-top: 0;">⚡ Payment Confirmed & Verified</h2>
      <p>Dear ${registration.fullName},</p>
      <p>Your payment receipt of <strong>₹${registration.amount}</strong> for the AJ-ASTRIX 2K27 Grand Festival has been officially verified and approved by the Hogwarts High Council.</p>
      <div style="background: #080402; padding: 12px; border-radius: 8px; border: 1px solid #332010; font-family: monospace; font-size: 13px;">
        Registration ID: ${registration.id}<br>
        Transaction Ref (UTR): ${registration.transactionId || 'Verified'}<br>
        House: ${registration.houseId.toUpperCase()}
      </div>
      <p>We eagerly await your arrival at the Great Hall!</p>
      <p style="font-size: 12px; color: #a09080;">— The Hogwarts High Council</p>
    </div>
  `

  if (isSmtpConfigured && transporter) {
    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to: registration.email,
        subject,
        html,
      })
      return { sent: true, mode: 'live_smtp', messageId: info.messageId }
    } catch (err: any) {
      return { sent: false, mode: 'live_smtp', error: err.message }
    }
  }

  console.log(`📬 [Owl Post Verified Notification] Payment verified for ${registration.email}`)
  return { sent: true, mode: 'test_preview' }
}
