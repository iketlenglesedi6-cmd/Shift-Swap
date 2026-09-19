const test = require('node:test')
const assert = require('node:assert/strict')
const { validateShift, validateSwap } = require('../utils/validation')

const validShift = {
  employeeName: 'Amina Patel', employeeEmail: 'amina@example.com', role: 'Registered Nurse', department: 'Emergency',
  shiftDate: '2027-12-10', startTime: '07:00', endTime: '15:00', location: 'Main Hospital', isSwappable: true
}

test('accepts a complete future shift', () => {
  assert.deepEqual(validateShift(validShift), [])
})

test('rejects a past shift and invalid time order', () => {
  const errors = validateShift({ ...validShift, shiftDate: '2020-01-01', endTime: '06:00' })
  assert.equal(errors.some((error) => error.includes('future date')), true)
  assert.equal(errors.includes('endTime must be after startTime'), true)
})

test('rejects a self-swap and invalid urgency', () => {
  const errors = validateSwap({
    offeredShiftId: '507f1f77bcf86cd799439011', requestedShiftId: '507f1f77bcf86cd799439011', requesterName: 'Amina', requesterEmail: 'amina@example.com',
    recipientName: 'Amina', recipientEmail: 'amina@example.com', reason: 'Need time off', urgency: 'emergency'
  })
  assert.equal(errors.includes('A shift cannot be swapped for itself'), true)
  assert.equal(errors.some((error) => error.includes('urgency must be one of')), true)
})
