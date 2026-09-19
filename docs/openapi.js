const shift = {
  type: 'object', required: ['employeeName', 'employeeEmail', 'role', 'department', 'shiftDate', 'startTime', 'endTime', 'location', 'isSwappable'],
  properties: {
    employeeName: { type: 'string', example: 'Amina Patel' }, employeeEmail: { type: 'string', format: 'email', example: 'amina@example.com' },
    role: { type: 'string', example: 'Registered Nurse' }, department: { type: 'string', example: 'Emergency' }, shiftDate: { type: 'string', format: 'date', example: '2026-12-10' },
    startTime: { type: 'string', example: '07:00' }, endTime: { type: 'string', example: '15:00' }, location: { type: 'string', example: 'Main Hospital' }, isSwappable: { type: 'boolean', example: true }, notes: { type: 'string', example: 'Can trade for an evening shift.' }
  }
}
const swap = {
  type: 'object', required: ['offeredShiftId', 'requestedShiftId', 'requesterName', 'requesterEmail', 'recipientName', 'recipientEmail', 'reason', 'urgency'],
  properties: {
    offeredShiftId: { type: 'string', example: '507f1f77bcf86cd799439011' }, requestedShiftId: { type: 'string', example: '507f191e810c19729de860ea' },
    requesterName: { type: 'string', example: 'Amina Patel' }, requesterEmail: { type: 'string', format: 'email' }, recipientName: { type: 'string', example: 'Jon Kim' }, recipientEmail: { type: 'string', format: 'email' },
    reason: { type: 'string', example: 'Medical appointment.' }, context: { type: 'string', example: 'I can cover a weekend shift next month.' }, urgency: { type: 'string', enum: ['low', 'normal', 'urgent'] }, status: { type: 'string', enum: ['proposed', 'negotiating', 'accepted', 'rejected', 'cancelled', 'completed'] }
  }
}
const id = { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
const basicResponses = { '400': { description: 'Invalid input' }, '404': { description: 'Resource not found' }, '500': { description: 'Unexpected server error' } }
module.exports = {
  openapi: '3.0.3', info: { title: 'Shift Swap Exchange API', version: '1.0.0', description: 'A human-centered API for proposing and managing workplace shift swaps.' },
  servers: [{ url: 'http://localhost:3000', description: 'Local server' }],
  paths: {
    '/api/shifts': { get: { tags: ['Shifts'], summary: 'List shifts', parameters: [{ name: 'department', in: 'query', schema: { type: 'string' } }, { name: 'employeeEmail', in: 'query', schema: { type: 'string' } }, { name: 'swappable', in: 'query', schema: { type: 'boolean' } }], responses: { '200': { description: 'Shift list' }, '400': basicResponses['400'], '500': basicResponses['500'] } }, post: { tags: ['Shifts'], summary: 'Create a shift', requestBody: { required: true, content: { 'application/json': { schema: shift } } }, responses: { '201': { description: 'Shift created' }, ...basicResponses } } },
    '/api/shifts/{id}': { get: { tags: ['Shifts'], summary: 'Get one shift', parameters: [id], responses: { '200': { description: 'Shift' }, ...basicResponses } }, put: { tags: ['Shifts'], summary: 'Replace a shift', parameters: [id], requestBody: { required: true, content: { 'application/json': { schema: shift } } }, responses: { '204': { description: 'Shift updated' }, ...basicResponses } }, delete: { tags: ['Shifts'], summary: 'Delete a shift', parameters: [id], responses: { '204': { description: 'Shift deleted' }, ...basicResponses } } },
    '/api/swaps': { get: { tags: ['Swap Requests'], summary: 'List swap requests', parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Swap request list' }, '500': basicResponses['500'] } }, post: { tags: ['Swap Requests'], summary: 'Propose a shift swap', requestBody: { required: true, content: { 'application/json': { schema: swap } } }, responses: { '201': { description: 'Swap proposed' }, ...basicResponses } } },
    '/api/swaps/{id}': { get: { tags: ['Swap Requests'], summary: 'Get one swap request', parameters: [id], responses: { '200': { description: 'Swap request' }, ...basicResponses } }, put: { tags: ['Swap Requests'], summary: 'Replace a swap request', parameters: [id], requestBody: { required: true, content: { 'application/json': { schema: swap } } }, responses: { '204': { description: 'Swap updated' }, ...basicResponses } }, delete: { tags: ['Swap Requests'], summary: 'Delete a swap request', parameters: [id], responses: { '204': { description: 'Swap deleted' }, ...basicResponses } } }
  }
}
