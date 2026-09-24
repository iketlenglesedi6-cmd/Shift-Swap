const express = require('express')
const { ObjectId } = require('mongodb')
const database = require('../database')
const { validateShift } = require('../utils/validation')
const { requireAuth } = require('../utils/auth')

const router = express.Router()
router.use(requireAuth)
const collection = () => database.getDb().collection('shifts')

function validId(id, response) {
  if (ObjectId.isValid(id)) return true
  response.status(400).json({ error: 'A valid shift id is required' })
  return false
}

router.get('/', async (request, response, next) => {
  try {
    const filter = {}
    if (request.query.department) filter.department = request.query.department
    if (request.query.employeeEmail) filter.employeeEmail = request.query.employeeEmail.toLowerCase()
    if (request.query.swappable !== undefined) {
      if (!['true', 'false'].includes(request.query.swappable)) return response.status(400).json({ error: 'swappable must be true or false' })
      filter.isSwappable = request.query.swappable === 'true'
    }
    response.json(await collection().find(filter).sort({ shiftDate: 1, startTime: 1 }).toArray())
  } catch (error) { next(error) }
})

router.get('/:id', async (request, response, next) => {
  if (!validId(request.params.id, response)) return
  try {
    const shift = await collection().findOne({ _id: new ObjectId(request.params.id) })
    if (!shift) return response.status(404).json({ error: 'Shift not found' })
    response.json(shift)
  } catch (error) { next(error) }
})

router.post('/', async (request, response, next) => {
  const errors = validateShift(request.body)
  if (errors.length) return response.status(400).json({ errors })
  try {
    const shift = { ...request.body, employeeEmail: request.body.employeeEmail.trim().toLowerCase(), createdAt: new Date(), updatedAt: new Date() }
    const result = await collection().insertOne(shift)
    response.status(201).location(`/api/shifts/${result.insertedId}`).json({ message: 'Shift created and ready for a fair trade.', id: result.insertedId, data: { ...shift, _id: result.insertedId } })
  } catch (error) { next(error) }
})

router.put('/:id', async (request, response, next) => {
  if (!validId(request.params.id, response)) return
  const errors = validateShift(request.body)
  if (errors.length) return response.status(400).json({ errors })
  try {
    const update = { ...request.body, employeeEmail: request.body.employeeEmail.trim().toLowerCase(), updatedAt: new Date() }
    const result = await collection().updateOne({ _id: new ObjectId(request.params.id) }, { $set: update })
    if (!result.matchedCount) return response.status(404).json({ error: 'Shift not found' })
    response.status(204).send()
  } catch (error) { next(error) }
})

router.delete('/:id', async (request, response, next) => {
  if (!validId(request.params.id, response)) return
  try {
    const result = await collection().deleteOne({ _id: new ObjectId(request.params.id) })
    if (!result.deletedCount) return response.status(404).json({ error: 'Shift not found' })
    response.status(204).send()
  } catch (error) { next(error) }
})

module.exports = router
