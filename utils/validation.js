const { ObjectId } = require('mongodb')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const urgencyValues = ['low', 'normal', 'urgent']
const statusValues = ['proposed', 'negotiating', 'accepted', 'rejected', 'cancelled', 'completed']

function requiredString(value, field, errors, maxLength = 500) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${field} is required`)
  else if (value.trim().length > maxLength) errors.push(`${field} must be ${maxLength} characters or fewer`)
}

function validFutureDate(value) {
  const date = new Date(`${value}T23:59:59.999Z`)
  return typeof value === 'string' && !Number.isNaN(date.getTime()) && date > new Date()
}

function validateShift(body) {
  const errors = []
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ['A shift object is required']
  requiredString(body.employeeName, 'employeeName', errors, 100)
  requiredString(body.employeeEmail, 'employeeEmail', errors, 254)
  requiredString(body.role, 'role', errors, 100)
  requiredString(body.department, 'department', errors, 100)
  requiredString(body.location, 'location', errors, 150)
  if (typeof body.employeeEmail === 'string' && !emailPattern.test(body.employeeEmail.trim())) errors.push('employeeEmail must be a valid email address')
  if (!validFutureDate(body.shiftDate)) errors.push('shiftDate must be a valid future date; time travel is not supported yet')
  if (typeof body.startTime !== 'string' || !timePattern.test(body.startTime)) errors.push('startTime must use 24-hour HH:MM format')
  if (typeof body.endTime !== 'string' || !timePattern.test(body.endTime)) errors.push('endTime must use 24-hour HH:MM format')
  if (timePattern.test(body.startTime || '') && timePattern.test(body.endTime || '') && body.startTime >= body.endTime) errors.push('endTime must be after startTime')
  if (typeof body.isSwappable !== 'boolean') errors.push('isSwappable must be true or false')
  if (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.length > 1000)) errors.push('notes must be a string of 1000 characters or fewer')
  return errors
}

function validateSwap(body) {
  const errors = []
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ['A swap request object is required']
  for (const field of ['offeredShiftId', 'requestedShiftId']) {
    if (!ObjectId.isValid(body[field])) errors.push(`${field} must be a valid MongoDB ObjectId`)
  }
  if (body.offeredShiftId && body.offeredShiftId === body.requestedShiftId) errors.push('A shift cannot be swapped for itself')
  requiredString(body.requesterName, 'requesterName', errors, 100)
  requiredString(body.requesterEmail, 'requesterEmail', errors, 254)
  requiredString(body.recipientName, 'recipientName', errors, 100)
  requiredString(body.recipientEmail, 'recipientEmail', errors, 254)
  requiredString(body.reason, 'reason', errors, 1000)
  for (const field of ['requesterEmail', 'recipientEmail']) {
    if (typeof body[field] === 'string' && !emailPattern.test(body[field].trim())) errors.push(`${field} must be a valid email address`)
  }
  if (!urgencyValues.includes(body.urgency)) errors.push(`urgency must be one of: ${urgencyValues.join(', ')}`)
  if (body.status !== undefined && !statusValues.includes(body.status)) errors.push(`status must be one of: ${statusValues.join(', ')}`)
  if (body.context !== undefined && (typeof body.context !== 'string' || body.context.length > 1000)) errors.push('context must be a string of 1000 characters or fewer')
  return errors
}

module.exports = { validateShift, validateSwap, urgencyValues, statusValues }
