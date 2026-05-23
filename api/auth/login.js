import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (error || !data.session) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Set session cookie — HttpOnly so JS can't read it
    res.setHeader('Set-Cookie', [
      `tccg_session=${data.session.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 24 * 7}`
    ])

    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
