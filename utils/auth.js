const { randomBytes, scrypt: scryptCallback, timingSafeEqual, createHash } = require('node:crypto')
const { promisify } = require('node:util')
const database = require('../database')

const scrypt = promisify(scryptCallback)
const users = () => database.getDb().collection('users')
const sessions = () => database.getDb().collection('sessions')

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, 64)
  return `${salt}:${derived.toString('hex')}`
}

async function verifyPassword(password, stored) {
  const [salt, key] = (stored || '').split(':')
  if (!salt || !key) return false
  const actual = await scrypt(password, salt, 64)
  const expected = Buffer.from(key, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function tokenHash(token) { return createHash('sha256').update(token).digest('hex') }

async function requireAuth(request, response, next) {
  try {
    const header = request.get('authorization') || ''
    const match = header.match(/^Bearer\s+(.+)$/i)
    if (!match) return response.status(401).json({ error: 'Bearer token required' })
    const session = await sessions().findOne({ tokenHash: tokenHash(match[1]), expiresAt: { $gt: new Date() } })
    if (!session) return response.status(401).json({ error: 'Invalid or expired token' })
    const user = await users().findOne({ _id: session.userId }, { projection: { passwordHash: 0 } })
    if (!user) return response.status(401).json({ error: 'Account no longer exists' })
    request.user = user
    request.sessionToken = match[1]
    next()
  } catch (error) { next(error) }
}

async function createAccessToken(userId) {
  const token = randomBytes(32).toString('base64url')
  await sessions().insertOne({ tokenHash: tokenHash(token), userId, createdAt: new Date(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
  return token
}

module.exports = { users, sessions, hashPassword, verifyPassword, tokenHash, createAccessToken, requireAuth }
