export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Clear the session cookie
  res.setHeader('Set-Cookie', [
    'tccg_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  ])

  return res.status(200).json({ ok: true })
}
