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
  servers: [
    { url: 'https://shift-swap-6vpe.onrender.com', description: 'Production Render server' },
    { url: 'http://localhost:3000', description: 'Local development server' }
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'opaque token from /api/auth/login' } },
    schemas: {
      Registration: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', maxLength: 100, example: 'Amina Patel' }, email: { type: 'string', format: 'email', example: 'amina@example.com' }, password: { type: 'string', minLength: 10, maxLength: 128, format: 'password', example: 'strong-passphrase' } } },
      Login: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } }
    }
  },
  paths: {
    '/api/auth/github': { get: { tags: ['Authentication'], summary: 'Begin GitHub OAuth sign-in', description: 'Redirects to GitHub for consent. GitHub returns to /api/auth/github/callback, which responds with an API bearer token.', responses: { '302': { description: 'Redirect to GitHub authorization' }, '500': basicResponses['500'] } } },
    '/api/auth/github/callback': { get: { tags: ['Authentication'], summary: 'GitHub OAuth callback', parameters: [{ name: 'code', in: 'query', required: true, schema: { type: 'string' } }, { name: 'state', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Bearer token and user profile' }, '400': { description: 'Invalid OAuth state or missing authorization code' }, '401': { description: 'GitHub authorization was rejected' }, '500': basicResponses['500'] } } },
    '/api/auth/register': { post: { tags: ['Authentication'], summary: 'Create an account (password is stored as a salted scrypt hash)', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Registration' } } } }, responses: { '201': { description: 'Account created' }, '400': basicResponses['400'], '409': { description: 'Email already registered' }, '500': basicResponses['500'] } } },
    '/api/auth/login': { post: { tags: ['Authentication'], summary: 'Log in and receive a seven-day bearer token', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Login' } } } }, responses: { '200': { description: 'Bearer token and user profile' }, '400': basicResponses['400'], '401': { description: 'Invalid credentials' }, '500': basicResponses['500'] } } },
    '/api/auth/logout': { post: { tags: ['Authentication'], summary: 'Log out and revoke the current token', security: [{ bearerAuth: [] }], responses: { '204': { description: 'Token revoked' }, '401': { description: 'Missing or invalid token' }, '500': basicResponses['500'] } } },
    '/api/auth/me': { get: { tags: ['Authentication'], summary: 'Get the current account profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Current user profile' }, '401': { description: 'Missing or invalid token' }, '500': basicResponses['500'] } } },
    '/api/shifts': { get: { tags: ['Shifts'], summary: 'List shifts', security: [{ bearerAuth: [] }], parameters: [{ name: 'department', in: 'query', schema: { type: 'string' } }, { name: 'employeeEmail', in: 'query', schema: { type: 'string' } }, { name: 'swappable', in: 'query', schema: { type: 'boolean' } }], responses: { '200': { description: 'Shift list' }, '401': { description: 'Authentication required' }, '400': basicResponses['400'], '500': basicResponses['500'] } }, post: { tags: ['Shifts'], summary: 'Create a shift', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: shift } } }, responses: { '201': { description: 'Shift created' }, '401': { description: 'Authentication required' }, ...basicResponses } } },
    '/api/shifts/{id}': { get: { tags: ['Shifts'], summary: 'Get one shift', security: [{ bearerAuth: [] }], parameters: [id], responses: { '200': { description: 'Shift' }, '401': { description: 'Authentication required' }, ...basicResponses } }, put: { tags: ['Shifts'], summary: 'Replace a shift', security: [{ bearerAuth: [] }], parameters: [id], requestBody: { required: true, content: { 'application/json': { schema: shift } } }, responses: { '204': { description: 'Shift updated' }, '401': { description: 'Authentication required' }, ...basicResponses } }, delete: { tags: ['Shifts'], summary: 'Delete a shift', security: [{ bearerAuth: [] }], parameters: [id], responses: { '204': { description: 'Shift deleted' }, '401': { description: 'Authentication required' }, ...basicResponses } } },
    '/api/swaps': { get: { tags: ['Swap Requests'], summary: 'List swap requests', security: [{ bearerAuth: [] }], parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Swap request list' }, '401': { description: 'Authentication required' }, '500': basicResponses['500'] } }, post: { tags: ['Swap Requests'], summary: 'Propose a shift swap', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: swap } } }, responses: { '201': { description: 'Swap proposed' }, '401': { description: 'Authentication required' }, ...basicResponses } } },
    '/api/swaps/{id}': { get: { tags: ['Swap Requests'], summary: 'Get one swap request', security: [{ bearerAuth: [] }], parameters: [id], responses: { '200': { description: 'Swap request' }, '401': { description: 'Authentication required' }, ...basicResponses } }, put: { tags: ['Swap Requests'], summary: 'Replace a swap request', security: [{ bearerAuth: [] }], parameters: [id], requestBody: { required: true, content: { 'application/json': { schema: swap } } }, responses: { '204': { description: 'Swap updated' }, '401': { description: 'Authentication required' }, ...basicResponses } }, delete: { tags: ['Swap Requests'], summary: 'Delete a swap request', security: [{ bearerAuth: [] }], parameters: [id], responses: { '204': { description: 'Swap deleted' }, '401': { description: 'Authentication required' }, ...basicResponses } } }
  }
}
