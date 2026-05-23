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

  // Get session token from cookie
  const cookie = req.headers.cookie || ''
  const match = cookie.match(/tccg_session=([^;]+)/)

  if (!match) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const token = match[1]

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    // Generate a signed Cloudflare R2 URL (expires in 1 hour)
    const aws = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      region: 'auto',
      service: 's3'
    })

    const expiresIn = 3600 // 1 hour in seconds
    const bucketUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/guide.pdf`

    const url = new URL(bucketUrl)
    url.searchParams.set('X-Amz-Expires', expiresIn.toString())

    const signed = await aws.sign(
      new Request(url.toString(), { method: 'GET' }),
      { aws: { signQuery: true } }
    )

    return res.status(200).json({ url: signed.url })

  } catch (err) {
    console.error('Reader URL error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
