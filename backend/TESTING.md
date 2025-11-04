# Quick Start Guide - Running API Tests

## Installation

Run this command in the backend directory:

```powershell
npm install
```

## Running Tests

### 1. Run All Tests
```powershell
npm test
```

### 2. Run Specific Test Suite

**Authentication Tests:**
```powershell
npm run test:auth
```

**Event Tests:**
```powershell
npm run test:events
```

**Registration Tests:**
```powershell
npm run test:registrations
```

### 3. Run with Coverage Report
```powershell
npm run test:coverage
```

### 4. Watch Mode (Auto-rerun on file changes)
```powershell
npm run test:watch
```

## Prerequisites

Make sure MongoDB is running:
```powershell
# Check if MongoDB is running
mongosh
```

If MongoDB is not running, start it:
```powershell
# Windows - Start MongoDB service
net start MongoDB
```

## What Gets Tested

✅ **Authentication (auth.test.js)**
- User registration (USER, TEMP_ADMIN, SUPER_ADMIN, IEEE members)
- User login/logout
- Get user profile
- Promote user roles

✅ **Events (event.test.js)**
- Create events (GENERAL & IEEE)
- Get all events with filters (type, upcoming, search, pagination)
- Get event by ID
- Update events
- Delete events
- Get event registrations

✅ **Registrations (registration.test.js)**
- Register for event (with/without payment screenshot)
- IEEE member auto-approval
- Spot registration
- Update registration status
- Cancel registration
- Get user registrations
- Registration count tracking

## Expected Output

```
PASS  tests/auth.test.js (8.234s)
PASS  tests/event.test.js (10.456s)
PASS  tests/registration.test.js (12.789s)

Test Suites: 3 passed, 3 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        31.479s
```

## Troubleshooting

**Error: Cannot find module 'jest'**
```powershell
npm install
```

**Error: MongoDB connection failed**
- Make sure MongoDB is running
- Check MONGO_TEST_URI in .env.test

**Error: Port already in use**
- Change PORT in .env.test to a different number

## Test Database

Tests use a separate database: `event-platform-test`
- Your production data is safe
- Test database is cleaned before each test suite
- All test data is automatically created

## Next Steps

After successful test run:
1. Review test coverage: Open `coverage/index.html` in browser
2. Check which tests passed/failed
3. Add new tests for new features
4. Integrate with CI/CD pipeline

## Need Help?

Check the detailed README: `tests/README.md`
