# API Test Suite Documentation

This directory contains comprehensive test suites for all API endpoints in the Event Sharing Platform backend.

## Test Files

### 1. `auth.test.js` - Authentication API Tests
Tests for user authentication and authorization endpoints.

**Endpoints Tested:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get user profile
- `POST /api/v1/auth/promote/:role/:userId` - Promote user role

**Test Scenarios:**
- ✅ Register new USER, SUPER_ADMIN, and IEEE member
- ✅ Duplicate email rejection
- ✅ Login with valid/invalid credentials
- ✅ Get profile with/without token
- ✅ Promote USER to TEMP_ADMIN with date validation
- ✅ Promote USER to SUPER_ADMIN
- ✅ Authorization checks for promotion

### 2. `event.test.js` - Event Management API Tests
Tests for event CRUD operations and queries.

**Endpoints Tested:**
- `GET /api/v1/events` - Get all events with filters
- `GET /api/v1/events/:id` - Get event by ID
- `POST /api/v1/events` - Create new event
- `PUT /api/v1/events/:id` - Update event
- `DELETE /api/v1/events/:id` - Delete event
- `GET /api/v1/events/:id/registrations` - Get event registrations

**Test Scenarios:**
- ✅ Create GENERAL and IEEE events
- ✅ Role-based authorization (SUPER_ADMIN, TEMP_ADMIN, USER)
- ✅ Input validation (title, description, dates, type)
- ✅ Filter by type (IEEE/GENERAL), upcoming status
- ✅ Search functionality
- ✅ Pagination
- ✅ Update event (own events for TEMP_ADMIN)
- ✅ Delete event with permission checks
- ✅ View registrations (organizer/admin only)

### 3. `registration.test.js` - Registration API Tests
Tests for event registration and management.

**Endpoints Tested:**
- `POST /api/v1/registrations/events/:id/register` - Register for event
- `POST /api/v1/registrations/events/:id/spot-register` - Spot registration
- `PATCH /api/v1/registrations/registrations/:regId/status` - Update registration status
- `DELETE /api/v1/registrations/events/:id/registrations/:userId` - Cancel registration
- `GET /api/v1/registrations/users/:id/registrations` - Get user registrations

**Test Scenarios:**
- ✅ IEEE member registration without payment
- ✅ Regular user registration with payment screenshot
- ✅ Payment screenshot upload validation
- ✅ Duplicate registration prevention
- ✅ Spot registration (OFFLINE payment)
- ✅ Status updates by admins
- ✅ Registration cancellation
- ✅ View own/other user registrations
- ✅ Event registeredCount increment/decrement

## Setup Instructions

### Prerequisites
1. Node.js (v14 or higher)
2. MongoDB (local instance or connection string)
3. All backend dependencies installed

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies (including dev dependencies):
```bash
npm install
```

This will install:
- `jest` - Testing framework
- `supertest` - HTTP assertions
- `cross-env` - Environment variable management
- `mongodb-memory-server` - In-memory MongoDB for testing

### Environment Setup

The tests use a separate test database to avoid affecting your development data.

**Option 1: Using .env.test (Recommended)**
The `.env.test` file is already configured with test settings:
```env
NODE_ENV=test
PORT=5001
MONGO_TEST_URI=mongodb://localhost:27017/event-platform-test
JWT_SECRET=test_jwt_secret_key_for_testing_only_123456789
```

**Option 2: Using MongoDB Memory Server**
For completely isolated testing without a MongoDB instance, the tests can use mongodb-memory-server (already configured in setup.js).

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (for development)
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test Suites

**Authentication Tests Only:**
```bash
npm run test:auth
```

**Event Tests Only:**
```bash
npm run test:events
```

**Registration Tests Only:**
```bash
npm run test:registrations
```

### Run Individual Test File
```bash
npx jest tests/auth.test.js
```

## Test Output

### Successful Test Run Example:
```
PASS  tests/auth.test.js
  Authentication API Tests
    POST /register - User Registration
      ✓ Should register a new USER successfully (245ms)
      ✓ Should register a SUPER_ADMIN successfully (123ms)
      ✓ Should fail to register with duplicate email (89ms)
    POST /login - User Login
      ✓ Should login USER successfully (156ms)
      ✓ Should fail to login with wrong password (112ms)
    ...

Test Suites: 3 passed, 3 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        12.456s
```

### Coverage Report Example:
```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   92.45 |    85.32 |   94.11 |   93.12 |
 controllers/       |   95.23 |    88.45 |   96.15 |   95.67 |
  userAuth.controller.js  |   98.50 |    92.30 |  100.00 |   98.75 |
  event.controller.js     |   94.20 |    86.50 |   95.00 |   94.85 |
  registration.controller.js | 93.00 |    85.60 |   93.50 |   93.25 |
--------------------|---------|----------|---------|---------|-------------------
```

## Test Data

The tests use realistic dummy data that matches your schema:

### Sample User Data:
```javascript
{
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'Password123!',
  branch: 'CSE',
  year: 2,
  isIEEE: false
}
```

### Sample Event Data:
```javascript
{
  title: 'Tech Conference 2025',
  description: 'Comprehensive tech conference...',
  type: 'GENERAL',
  location: 'Main Auditorium',
  startDate: '2025-11-13T00:00:00.000Z',
  endDate: '2025-11-15T00:00:00.000Z',
  capacity: 100
}
```

### Sample Registration Data:
- IEEE member registration (auto-approved)
- Regular user registration with payment screenshot
- Spot registration with offline payment

## Debugging Tests

### Enable Verbose Output:
```bash
npm test -- --verbose
```

### Run Single Test:
```bash
npm test -- -t "Should register a new USER successfully"
```

### Debug with Node Inspector:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

## Common Issues & Solutions

### Issue 1: MongoDB Connection Error
**Error:** `MongoNetworkError: failed to connect to server`
**Solution:** Ensure MongoDB is running locally or update `MONGO_TEST_URI` in `.env.test`

### Issue 2: Port Already in Use
**Error:** `EADDRINUSE: address already in use`
**Solution:** Change `PORT` in `.env.test` to an unused port (e.g., 5002)

### Issue 3: Tests Timeout
**Error:** `Timeout - Async callback was not invoked within the 5000ms timeout`
**Solution:** Increase timeout in `jest.config.js` or specific test:
```javascript
jest.setTimeout(30000); // 30 seconds
```

### Issue 4: Cloudinary Upload Failures
**Solution:** Tests use mock image files. Ensure `uploads/` directory exists or mock Cloudinary in tests.

## Test Coverage Goals

Current test coverage targets:
- **Statements:** > 90%
- **Branches:** > 85%
- **Functions:** > 90%
- **Lines:** > 90%

## Best Practices

1. **Isolation:** Each test suite creates its own test data and cleans up after
2. **Authentication:** Tests use actual JWT tokens from login responses
3. **Database:** Tests use separate test database to avoid data corruption
4. **Cleanup:** Database is cleared before each test suite
5. **Realistic Data:** All test data matches production schema requirements

## Continuous Integration

To integrate with CI/CD pipelines (GitHub Actions, GitLab CI, etc.):

```yaml
# Example GitHub Actions workflow
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
      working-directory: ./backend
    - name: Run tests
      run: npm test
      working-directory: ./backend
```

## Contributing

When adding new endpoints:
1. Create corresponding test cases
2. Follow existing test structure
3. Ensure all CRUD operations are tested
4. Test both success and failure scenarios
5. Validate authorization checks
6. Run full test suite before committing

## Test Statistics

Total Endpoints Tested: **15+**
Total Test Cases: **45+**
Average Test Execution Time: **10-15 seconds**

## Support

For issues or questions about tests:
1. Check this README first
2. Review test output for specific error messages
3. Ensure MongoDB is running and accessible
4. Verify all dependencies are installed
5. Check environment variables in `.env.test`
