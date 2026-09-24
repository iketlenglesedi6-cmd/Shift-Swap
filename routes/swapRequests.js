const express = require('express')
const { ObjectId } = require('mongodb')
const database = require('../database')
const { validateSwap } = require('../utils/validation')
const { requireAuth } = require('../utils/auth')

const router = express.Router()
router.use(requireAuth)
const swaps = () => database.getDb().collection('swapRequests')
const shifts = () => database.getDb().collection('shifts')

function validId(id, response) {
  if (ObjectId.isValid(id)) return true
  response.status(400).json({ error: 'A valid swap request id is required' })
  return false
}

async function verifyShifts(body) {
  const [offered, requested] = await Promise.all([
    shifts().findOne({ _id: new ObjectId(body.offeredShiftId) }),
    shifts().findOne({ _id: new ObjectId(body.requestedShiftId) })
  ])
  if (!offered || !requested) return 'One or both referenced shifts do not exist'
  if (!offered.isSwappable || !requested.isSwappable) return 'Both shifts must be marked swappable before a trade can be proposed'
  if (offered.employeeEmail === requested.employeeEmail) return 'A person cannot trade a shift with themself'
  return null
}

router.get('/', async (request, response, next) => {
  try {
    const filter = request.query.status ? { status: request.query.status } : {}
    response.json(await swaps().find(filter).sort({ createdAt: -1 }).toArray())
  } catch (error) { next(error) }
})

router.get('/:id', async (request, response, next) => {
  if (!validId(request.params.id, response)) return
  try {
    const swap = await swaps().findOne({ _id: new ObjectId(request.params.id) })
    if (!swap) return response.status(404).json({ error: 'Swap request not found' })
    response.json(swap)
  } catch (error) { next(error) }
})

router.post('/', async (request, response, next) => {
  const errors = validateSwap(request.body)
  if (errors.length) return response.status(400).json({ errors })
  try {
    const shiftError = await verifyShifts(request.body)
    if (shiftError) return response.status(400).json({ error: shiftError })
    const swap = {
      ...request.body,
      requesterEmail: request.body.requesterEmail.trim().toLowerCase(),
      recipientEmail: request.body.recipientEmail.trim().toLowerCase(),
      status: request.body.status || 'proposed',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const result = await swaps().insertOne(swap)
    response.status(201).location(`/api/swaps/${result.insertedId}`).json({ message: 'Swap proposed. Empathy is key.', id: result.insertedId, data: { ...swap, _id: result.insertedId } })
  } catch (error) { next(error) }
})

router.put('/:id', async (request, response, next) => {
  if (!validId(request.params.id, response)) return
  const errors = validateSwap(request.body)
  if (errors.length) return response.status(400).json({ errors })
  try {
    const existing = await swaps().findOne({ _id: new ObjectId(request.params.id) })
    if (!existing) return response.status(404).json({ error: 'Swap request not found' })
    const shiftError = await verifyShifts(request.body)
    if (shiftError) return response.status(400).json({ error: shiftError })
    const update = {
      ...request.body,
      requesterEmail: request.body.requesterEmail.trim().toLowerCase(),
      recipientEmail: request.body.recipientEmail.trim().toLowerCase(),
      status: request.body.status || 'proposed',
      updatedAt: new Date()
    }
    await swaps().updateOne({ _id: existing._id }, { $set: update })
    response.status(204).send()
  } catch (error) { next(error) }
})

router.delete('/:id', async (request, response, next) => {
  if (!validId(request.params.id, response)) return
  try {
    const result = await swaps().deleteOne({ _id: new ObjectId(request.params.id) })
    if (!result.deletedCount) return response.status(404).json({ error: 'Swap request not found' })
    response.status(204).send()
  } catch (error) { next(error) }
})

module.exports = router
