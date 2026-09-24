const express = require('express')
const { randomBytes, createHmac, timingSafeEqual } = require('node:crypto')
const { users, sessions, hashPassword, verifyPassword, tokenHash, createAccessToken, requireAuth } = require('../utils/auth')

const router = express.Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/register', async (request, response, next) => {
  try {
    const { name, email, password } = request.body || {}
    const errors = []
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) errors.push('name is required and must be at most 100 characters')
    if (typeof email !== 'string' || !emailPattern.test(email.trim())) errors.push('A valid email is required')
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) errors.push('password must be 10 to 128 characters')
    if (errors.length) return response.status(400).json({ errors })
    const normalizedEmail = email.trim().toLowerCase()
    if (await users().findOne({ email: normalizedEmail })) return response.status(409).json({ error: 'An account with that email already exists' })
    const user = { name: name.trim(), email: normalizedEmail, passwordHash: await hashPassword(password), createdAt: new Date() }
    const result = await users().insertOne(user)
    response.status(201).json({ id: result.insertedId, name: user.name, email: user.email })
  } catch (error) {
    if (error.code === 11000) return response.status(409).json({ error: 'An account with that email already exists' })
    next(error)
  }
})

router.post('/login', async (request, response, next) => {
  try {
    const { email, password } = request.body || {}
    if (typeof email !== 'string' || typeof password !== 'string') return response.status(400).json({ error: 'email and password are required' })
    const user = await users().findOne({ email: email.trim().toLowerCase() })
    if (!user || !(await verifyPassword(password, user.passwordHash))) return response.status(401).json({ error: 'Invalid email or password' })
    const token = await createAccessToken(user._id)
    response.json({ token, tokenType: 'Bearer', expiresIn: 604800, user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) { next(error) }
})

function oauthStateSignature(state) {
  const secret = process.env.AUTH_STATE_SECRET
  if (!secret) throw new Error('AUTH_STATE_SECRET must be configured for GitHub OAuth')
  return createHmac('sha256', secret).update(state).digest('base64url')
}

router.get('/github', (request, response, next) => {
  try {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CALLBACK_URL) throw new Error('GITHUB_CLIENT_ID and GITHUB_CALLBACK_URL must be configured')
    const state = randomBytes(24).toString('base64url')
    const signature = oauthStateSignature(state)
    response.cookie('github_oauth_state', `${state}.${signature}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/github/callback'
    })
    const destination = new URL('https://github.com/login/oauth/authorize')
    destination.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID)
    destination.searchParams.set('redirect_uri', process.env.GITHUB_CALLBACK_URL)
    destination.searchParams.set('scope', 'read:user user:email')
    destination.searchParams.set('state', state)
    response.redirect(destination.toString())
  } catch (error) { next(error) }
})

router.get('/github/callback', async (request, response, next) => {
  try {
    if (request.query.error) return response.status(401).json({ error: 'GitHub authorization was not completed' })
    const [savedState, savedSignature] = (request.cookies?.github_oauth_state || '').split('.')
    const state = request.query.state
    if (typeof state !== 'string' || !savedState || !savedSignature || state !== savedState) return response.status(400).json({ error: 'Invalid OAuth state' })
    const expected = Buffer.from(oauthStateSignature(savedState))
    const received = Buffer.from(savedSignature)
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return response.status(400).json({ error: 'Invalid OAuth state signature' })
    response.clearCookie('github_oauth_state', { path: '/api/auth/github/callback' })
    if (typeof request.query.code !== 'string') return response.status(400).json({ error: 'GitHub authorization code is missing' })

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code: request.query.code, redirect_uri: process.env.GITHUB_CALLBACK_URL })
    })
    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) return response.status(401).json({ error: 'GitHub could not authenticate this account' })

    const githubHeaders = { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Shift-Swap-Exchange' }
    const profileResponse = await fetch('https://api.github.com/user', { headers: githubHeaders })
    if (!profileResponse.ok) throw new Error('Unable to retrieve GitHub profile')
    const profile = await profileResponse.json()
    let email = profile.email
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', { headers: githubHeaders })
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json()
        email = emails.find((entry) => entry.primary && entry.verified)?.email
      }
    }
    email = (email || `${profile.login}@users.noreply.github.com`).toLowerCase()
    const displayName = (profile.name || profile.login).slice(0, 100)
    const user = await users().findOneAndUpdate(
      { githubId: profile.id },
      { $set: { name: displayName, email }, $setOnInsert: { githubId: profile.id, createdAt: new Date() } },
      { upsert: true, returnDocument: 'after', projection: { passwordHash: 0 } }
    )
    const token = await createAccessToken(user._id)
    response.json({ token, tokenType: 'Bearer', expiresIn: 604800, user: { id: user._id, name: user.name, email: user.email }, message: 'Authenticated with GitHub OAuth. Use this token with Swagger Authorize.' })
  } catch (error) { next(error) }
})

router.post('/logout', requireAuth, async (request, response, next) => {
  try {
    await sessions().deleteOne({ tokenHash: tokenHash(request.sessionToken) })
    response.status(204).send()
  } catch (error) { next(error) }
})

router.get('/me', requireAuth, (request, response) => response.json({ id: request.user._id, name: request.user.name, email: request.user.email }))

module.exports = router
