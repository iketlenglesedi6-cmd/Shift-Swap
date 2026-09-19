require('dotenv').config()
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const database = require('./database')
const shiftsRouter = require('./routes/shifts')
const swapsRouter = require('./routes/swapRequests')
const openapi = require('./docs/openapi')

const app = express()
const port = process.env.PORT || 3000
app.use(express.json())
app.get('/', (request, response) => response.json({ message: 'Shift Swap Exchange is running. Visit /api-docs to explore the API.' }))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'Shift Swap Exchange Docs' }))
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
