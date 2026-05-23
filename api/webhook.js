import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const email = session.customer_details?.email

    if (!email) {
      return res.status(400).json({ error: 'No email found' })
    }

    try {
      const password = generatePassword()

      // Create user in Supabase
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (createError && !createError.message.includes('already registered')) {
        throw createError
      }

      // If user already exists (bought twice), reset their password
      if (createError?.message.includes('already registered')) {
        const { data: existing } = await supabase.auth.admin.listUsers()
        const existingUser = existing.users.find(u => u.email === email)
        if (existingUser) {
          await supabase.auth.admin.updateUserById(existingUser.id, { password })
        }
      }

      // Send welcome email via Resend
      await resend.emails.send({
        from: 'The Crowned Confidence Guide <hello@joedavisarts.com>',
        to: email,
        subject: 'Your Crowned Confidence Guide is ready ♛',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Crowned Confidence Guide</title>
</head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:#3a0d0c;padding:40px 40px 32px;text-align:center;border-radius:4px 4px 0 0;">
              <p style="font-family:Georgia,serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.5);margin:0 0 8px;">The</p>
              <p style="font-family:Georgia,serif;font-size:32px;font-weight:bold;letter-spacing:4px;color:#ffffff;margin:0;text-transform:uppercase;">Crowned</p>
              <p style="font-family:Georgia,serif;font-size:18px;font-weight:normal;letter-spacing:6px;color:#cab84c;margin:0;text-transform:uppercase;">Confidence</p>
              <p style="font-family:Georgia,serif;font-size:20px;font-style:italic;color:rgba(255,255,255,0.6);margin:4px 0 0;">Guide</p>
              <p style="font-size:20px;color:#cab84c;margin:16px 0 0;">♛</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #f0ebe0;border-right:1px solid #f0ebe0;">
              <p style="font-size:22px;color:#3a0d0c;font-family:Georgia,serif;font-style:italic;margin:0 0 20px;">Your guide is ready.</p>
              <p style="font-size:15px;color:#555;line-height:1.8;margin:0 0 24px;font-weight:300;">
                Thank you for your purchase. Everything you need to walk into your pageant journey with confidence, clarity, and purpose is now waiting for you.
              </p>

              <!-- CREDENTIALS BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f4;border:1px solid #f0ebe0;border-left:3px solid #cab84c;border-radius:2px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#cab84c;margin:0 0 12px;">Your Login Details</p>
                    <p style="font-size:13px;color:#555;margin:0 0 6px;font-weight:300;">Email: <strong style="color:#1c1c1c;font-weight:500;">${email}</strong></p>
                    <p style="font-size:13px;color:#555;margin:0;font-weight:300;">Password: <strong style="color:#1c1c1c;font-weight:500;font-family:monospace;font-size:15px;">${password}</strong></p>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="https://joedavisarts.com/tccg/login" style="display:inline-block;background:#3a0d0c;color:#faf8f4;font-size:14px;font-weight:500;letter-spacing:0.5px;padding:15px 40px;border-radius:2px;text-decoration:none;">
                      Start Reading →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#999;line-height:1.7;margin:0;font-weight:300;">
                Keep these details safe — you'll need them each time you sign in. If you ever have trouble accessing your guide, reply to this email and we'll sort it out.
              </p>
            </td>
          </tr>

          <!-- QUOTE -->
          <tr>
            <td style="background:#f0ebe0;padding:28px 40px;border-left:1px solid #e8e0d0;border-right:1px solid #e8e0d0;">
              <p style="font-family:Georgia,serif;font-size:16px;font-style:italic;color:#3a0d0c;text-align:center;margin:0 0 8px;line-height:1.5;">
                "The crown may shine on stage, but the work begins long before."
              </p>
              <p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#cab84c;text-align:center;margin:0;font-weight:500;">
                The Crowned Confidence Guide
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#3a0d0c;padding:24px 40px;text-align:center;border-radius:0 0 4px 4px;">
              <p style="font-size:11px;color:rgba(255,255,255,0.3);margin:0;font-weight:300;">
                © 2026 T'Dane Gordon. All rights reserved.<br/>
                <a href="https://joedavisarts.com/tccg" style="color:rgba(202,184,76,0.6);text-decoration:none;">joedavisarts.com/tccg</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
      })

      return res.status(200).json({ ok: true })

    } catch (err) {
      console.error('Webhook processing error:', err)
      return res.status(500).json({ error: 'Processing failed' })
    }
  }

  return res.status(200).json({ received: true })
}
