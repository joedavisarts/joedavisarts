import { createClient } from '@supabase/supabase-js'
import { AwsClient } from 'aws4fetch'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const cookie = req.headers.cookie || ''
  const match = cookie.match(/tccg_session=([^;]+)/)

  if (!match) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const token = match[1]

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    const aws = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      region: 'auto',
      service: 's3'
    })

    const expiresIn = 3600
    const urls = {}

    // Generate signed URLs for all 72 pages
    for (let i = 1; i <= 72; i++) {
      const padded = String(i).padStart(2, '0')
      const fileUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${padded}.jpg`

      const url = new URL(fileUrl)
      url.searchParams.set('X-Amz-Expires', expiresIn.toString())

      const signed = await aws.sign(
        new Request(url.toString(), { method: 'GET' }),
        { aws: { signQuery: true } }
      )

      urls[padded] = signed.url
    }

    return res.status(200).json(urls)

  } catch (err) {
    console.error('Reader URLs error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
