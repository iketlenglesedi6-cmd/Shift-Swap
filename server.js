require('dotenv').config()
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const database = require('./database')
const shiftsRouter = require('./routes/shifts')
const swapsRouter = require('./routes/swapRequests')
const authRouter = require('./routes/auth')
const openapi = require('./docs/openapi')

const app = express()
const port = process.env.PORT || 3000
app.use(express.json())
app.use((request, response, next) => {
  request.cookies = Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const separator = part.indexOf('=')
    return [decodeURIComponent(part.slice(0, separator).trim()), decodeURIComponent(part.slice(separator + 1).trim())]
  }))
  response.cookie = (name, value, options = {}) => {
    const attributes = [`${name}=${encodeURIComponent(value)}`, 'Path=' + (options.path || '/'), 'SameSite=' + (options.sameSite || 'Lax')]
    if (options.maxAge) attributes.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`)
    if (options.httpOnly) attributes.push('HttpOnly')
    if (options.secure) attributes.push('Secure')
    response.append('Set-Cookie', attributes.join('; '))
  }
  response.clearCookie = (name, options = {}) => response.append('Set-Cookie', `${name}=; Path=${options.path || '/'}; Max-Age=0; HttpOnly; SameSite=Lax`)
  next()
})
app.get('/', (request, response) => response.json({ message: 'Shift Swap Exchange is running. Visit /api-docs to explore the API.' }))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'Shift Swap Exchange Docs' }))
app.use('/api/auth', authRouter)
app.use('/api/shifts', shiftsRouter)
app.use('/api/swaps', swapsRouter)
app.use((request, response) => response.status(404).json({ error: 'Route not found' }))
app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ error: 'Something went wrong while processing the request.' })
})

async function start() {
  try { await database.initDb(); app.listen(port, () => console.log(`Server listening on port ${port}`)) }
  catch (error) { console.error(`Unable to start server: ${error.message}`); process.exit(1) }
}
start()
module.exports = app
