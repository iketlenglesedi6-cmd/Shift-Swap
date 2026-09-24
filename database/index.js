const { MongoClient } = require('mongodb')

let db
let client

async function initDb() {
  if (db) return db

  const { MONGODB_URI, MONGODB_DATABASE } = process.env
  if (!MONGODB_URI || !MONGODB_DATABASE) {
    throw new Error('MONGODB_URI and MONGODB_DATABASE must be set in .env')
  }

  client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
  await client.connect()
  db = client.db(MONGODB_DATABASE)
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ githubId: 1 }, { unique: true, sparse: true }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  ])
  console.log(`Connected to MongoDB database: ${MONGODB_DATABASE}`)
  return db
}

function getDb() {
  if (!db) throw new Error('Database has not been initialized')
  return db
}

async function closeDb() {
  if (client) await client.close()
  client = undefined
  db = undefined
}

module.exports = { initDb, getDb, closeDb }
