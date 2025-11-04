const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const baseUrl = '/api/v1/registrations';

describe('Registration API Tests', () => {
  let userToken, ieeeUserToken, superAdminToken, tempAdminToken;
  let userId, ieeeUserId, superAdminId, tempAdminId;
  let generalEventId, ieeeEventId, paidEventId;
  let registrationId;

  const testUsers = {
    user: {
      name: 'Regular User',
      email: 'reguser@test.com',
      password: 'UserPass123!',
      branch: 'CSE',
      year: 2,
      isIEEE: false
    },
    ieeeUser: {
      name: 'IEEE Member',
      email: 'ieeemember@test.com',
      password: 'IEEEPass123!',
      branch: 'ECE',
      year: 3,
      isIEEE: true,
      IEEE_ID: 'IEEE12345'
    },
    superAdmin: {
      name: 'Super Admin',
      email: 'sadmin@test.com',
      password: 'AdminPass123!',
      role: 'SUPER_ADMIN',
      branch: 'CSE',
      year: 4
    },
    tempAdmin: {
      name: 'Temp Admin',
      email: 'tadmin@test.com',
      password: 'TempPass123!',
      role: 'TEMP_ADMIN',
      promotedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      branch: 'AIDS',
      year: 3
    }
  };

  beforeAll(async () => {
    // Clear database
    await User.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});

    // Register users
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUsers.user);
    userId = userRes.body.user._id;

    const ieeeUserRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUsers.ieeeUser);
    ieeeUserId = ieeeUserRes.body.user._id;

    const superAdminRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUsers.superAdmin);
    superAdminId = superAdminRes.body.user._id;

    const tempAdminRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUsers.tempAdmin);
    tempAdminId = tempAdminRes.body.user._id;

    // Login users
    const userLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUsers.user.email, password: testUsers.user.password });
    userToken = userLogin.body.token;

    const ieeeLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUsers.ieeeUser.email, password: testUsers.ieeeUser.password });
    ieeeUserToken = ieeeLogin.body.token;

    const superAdminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUsers.superAdmin.email, password: testUsers.superAdmin.password });
    superAdminToken = superAdminLogin.body.token;

    const tempAdminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUsers.tempAdmin.email, password: testUsers.tempAdmin.password });
    tempAdminToken = tempAdminLogin.body.token;

    // Create events
    const generalEvent = {
      title: 'Free General Workshop',
      description: 'This is a free general workshop open to all students',
      type: 'GENERAL',
      location: 'Main Hall',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 100
    };

    const generalEventRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(generalEvent);
    generalEventId = generalEventRes.body.data._id;

    const ieeeEvent = {
      title: 'IEEE Technical Seminar',
      description: 'Technical seminar for IEEE members on latest technologies',
      type: 'IEEE',
      location: 'Conference Room A',
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 50
    };

    const ieeeEventRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(ieeeEvent);
    ieeeEventId = ieeeEventRes.body.data._id;

    const paidEvent = {
      title: 'Paid Workshop on AI',
      description: 'Advanced AI workshop requiring payment for registration',
      type: 'GENERAL',
      location: 'Lab 101',
      startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 30
    };

    const paidEventRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(paidEvent);
    paidEventId = paidEventRes.body.data._id;

    // Create a dummy image file for testing
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const testImagePath = path.join(uploadsDir, 'test-payment.jpg');
    if (!fs.existsSync(testImagePath)) {
      // Create a valid minimal JPEG image (1x1 pixel red)
      const validJpeg = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
        0x37, 0xFF, 0xD9
      ]);
      fs.writeFileSync(testImagePath, validJpeg);
    }
  });

  afterAll(async () => {
    // Clean up test files
    const testImagePath = path.join(__dirname, '..', 'uploads', 'test-payment.jpg');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  describe('POST /events/:id/register - Register for Event', () => {
    test('Should register IEEE user for IEEE event without payment', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${ieeeEventId}/register`)
        .set('Authorization', `Bearer ${ieeeUserToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body.registration).toHaveProperty('status', 'REGISTERED');
      expect(response.body.registration.payment).toHaveProperty('mode', 'NONE');
      expect(response.body.registration).toHaveProperty('event', ieeeEventId);
      expect(response.body.registration).toHaveProperty('user', ieeeUserId);
    });

    test('Should register regular user for GENERAL event with payment screenshot', async () => {
      const testImagePath = path.join(__dirname, '..', 'uploads', 'test-payment.jpg');
      
      const response = await request(app)
        .post(`${baseUrl}/events/${paidEventId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body.registration).toHaveProperty('status', 'PENDING_PAYMENT');
      expect(response.body.registration.payment).toHaveProperty('mode', 'ONLINE');
      expect(response.body.registration.payment).toHaveProperty('screenshotUrl');
      
      registrationId = response.body.registration._id;
    });

    test('Should fail to register without payment screenshot for paid event', async () => {
      // Create another user for this test
      const anotherUser = {
        name: 'Another User',
        email: 'another@test.com',
        password: 'Pass123!',
        branch: 'ECE',
        year: 2
      };

      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send(anotherUser);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: anotherUser.email, password: anotherUser.password });
      
      const anotherToken = loginRes.body.token;

      const response = await request(app)
        .post(`${baseUrl}/events/${generalEventId}/register`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Payment screenshot required');
    });

    test('Should fail to register for same event twice', async () => {
      const testImagePath = path.join(__dirname, '..', 'uploads', 'test-payment.jpg');

      const response = await request(app)
        .post(`${baseUrl}/events/${paidEventId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', testImagePath)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Already registered');
    });

    test('Should fail to register for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      const testImagePath = path.join(__dirname, '..', 'uploads', 'test-payment.jpg');
      
      const response = await request(app)
        .post(`${baseUrl}/events/${fakeEventId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', testImagePath)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Event not found');
    });

    test('Should fail to register without authentication', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${generalEventId}/register`)
        .expect(401);
    });

    test('Should fail if admin tries to register (not USER role)', async () => {
      const testImagePath = path.join(__dirname, '..', 'uploads', 'test-payment.jpg');
      
      const response = await request(app)
        .post(`${baseUrl}/events/${generalEventId}/register`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('image', testImagePath)
        .expect(403);
    });
  });

  describe('POST /events/:id/spot-register - Spot Registration', () => {
    test('Should create spot registration successfully', async () => {
      // Create a new user for spot registration
      const spotUser = {
        name: 'Spot User',
        email: 'spot@test.com',
        password: 'SpotPass123!',
        branch: 'MECH',
        year: 1
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(spotUser);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: spotUser.email, password: spotUser.password });
      
      const spotToken = loginRes.body.token;

      const response = await request(app)
        .post(`${baseUrl}/events/${generalEventId}/spot-register`)
        .set('Authorization', `Bearer ${spotToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Spot registration recorded successfully');
      expect(response.body.registration).toHaveProperty('status', 'AWAITING_CONFIRMATION');
      expect(response.body.registration.payment).toHaveProperty('mode', 'OFFLINE');
    });

    test('Should fail spot registration if already registered', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${ieeeEventId}/spot-register`)
        .set('Authorization', `Bearer ${ieeeUserToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Already registered');
    });

    test('Should fail spot registration for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`${baseUrl}/events/${fakeEventId}/spot-register`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Event not found');
    });

    test('Should fail spot registration without authentication', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${generalEventId}/spot-register`)
        .expect(401);
    });

    test('Should fail if admin tries spot registration', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${generalEventId}/spot-register`)
        .set('Authorization', `Bearer ${tempAdminToken}`)
        .expect(403);
    });
  });

  describe('PATCH /registrations/:regId/status - Update Registration Status', () => {
    let testRegistrationId;

    beforeEach(async () => {
      // Clean up first to ensure fresh state
      await Registration.deleteMany({});
      
      // Create a registration to update in each test
      const regResponse = await request(app)
        .post(`${baseUrl}/events/${ieeeEventId}/register`)
        .set('Authorization', `Bearer ${ieeeUserToken}`);
      testRegistrationId = regResponse.body.registration._id;
    });

    afterEach(async () => {
      // Clean up the test registration
      await Registration.deleteMany({});
    });

    test('Should update registration status by SUPER_ADMIN', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/registrations/${testRegistrationId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'REGISTERED' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Status updated successfully');
      expect(response.body.registration).toHaveProperty('status', 'REGISTERED');
    });

    test('Should update registration status by TEMP_ADMIN', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/registrations/${testRegistrationId}/status`)
        .set('Authorization', `Bearer ${tempAdminToken}`)
        .send({ status: 'PENDING_PAYMENT' })
        .expect(200);

      expect(response.body.registration).toHaveProperty('status', 'PENDING_PAYMENT');
    });

    test('Should fail to update with invalid status', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/registrations/${testRegistrationId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid status');
    });

    test('Should fail to update non-existent registration', async () => {
      const fakeRegId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .patch(`${baseUrl}/registrations/${fakeRegId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'REGISTERED' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Registration not found');
    });

    test('Should fail to update status as USER', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/registrations/${testRegistrationId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'REGISTERED' })
        .expect(403);
    });

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/registrations/${testRegistrationId}/status`)
        .send({ status: 'REGISTERED' })
        .expect(401);
    });
  });

  describe('GET /users/:id/registrations - Get User Registrations', () => {
    test('Should get own registrations', async () => {
      const response = await request(app)
        .get(`${baseUrl}/users/${userId}/registrations`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('registrations');
      expect(Array.isArray(response.body.registrations)).toBe(true);
    });

    test('Should get IEEE user registrations', async () => {
      // First create a registration for IEEE user
      await request(app)
        .post(`${baseUrl}/events/${ieeeEventId}/register`)
        .set('Authorization', `Bearer ${ieeeUserToken}`);

      const response = await request(app)
        .get(`${baseUrl}/users/${ieeeUserId}/registrations`)
        .set('Authorization', `Bearer ${ieeeUserToken}`)
        .expect(200);

      expect(response.body.registrations.length).toBeGreaterThan(0);
      expect(response.body.registrations[0]).toHaveProperty('event');
      expect(response.body.registrations[0].event).toHaveProperty('title');
    });

    test('Should get other user registrations as admin', async () => {
      const response = await request(app)
        .get(`${baseUrl}/users/${userId}/registrations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('registrations');
    });

    test('Should return empty array for user with no registrations', async () => {
      // Create a new user with no registrations
      const newUser = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'NewPass123!',
        branch: 'CIVIL',
        year: 4
      };

      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);
      
      const newUserId = regRes.body.user._id;

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: newUser.email, password: newUser.password });
      
      const newUserToken = loginRes.body.token;

      const response = await request(app)
        .get(`${baseUrl}/users/${newUserId}/registrations`)
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.count).toBe(0);
      expect(response.body.registrations).toHaveLength(0);
    });

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .get(`${baseUrl}/users/${userId}/registrations`)
        .expect(401);
    });
  });

  describe('DELETE /events/:id/registrations/:userId - Cancel Registration', () => {
    test('Should cancel own registration', async () => {
      // First create a registration to cancel
      const testImagePath = path.join(__dirname, '..', 'uploads', 'test-payment.jpg');
      const createResponse = await request(app)
        .post(`${baseUrl}/events/${paidEventId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', testImagePath)
        .expect(201);

      expect(createResponse.body).toHaveProperty('registration');

      const response = await request(app)
        .delete(`${baseUrl}/events/${paidEventId}/registrations/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Registration cancelled successfully');
    });

    test('Should fail to cancel non-existent registration', async () => {
      // Don't create any registration, just try to cancel
      const response = await request(app)
        .delete(`${baseUrl}/events/${paidEventId}/registrations/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Registration not found');
    });

    test('Should fail to cancel registration for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`${baseUrl}/events/${fakeEventId}/registrations/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Registration not found');
    });

    test('Should cancel registration as admin', async () => {
      // First create a registration
      await request(app)
        .post(`${baseUrl}/events/${ieeeEventId}/register`)
        .set('Authorization', `Bearer ${ieeeUserToken}`);

      const response = await request(app)
        .delete(`${baseUrl}/events/${ieeeEventId}/registrations/${ieeeUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Registration cancelled successfully');
    });

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/events/${generalEventId}/registrations/${userId}`)
        .expect(401);
    });
  });

  describe('Event Registration Count', () => {
    test('Should increment registeredCount on registration', async () => {
      // Create new event
      const newEvent = {
        title: 'Count Test Event',
        description: 'Event to test registration count functionality',
        type: 'GENERAL',
        location: 'Test Hall',
        startDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 20
      };

      const eventRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newEvent);
      
      const testEventId = eventRes.body.data._id;

      // Check initial count
      const initialEvent = await request(app)
        .get(`/api/v1/events/${testEventId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(initialEvent.body.data.registeredCount).toBe(0);

      // Register new user
      const countTestUser = {
        name: 'Count Test User',
        email: 'counttest@test.com',
        password: 'CountPass123!',
        branch: 'EEE',
        year: 2
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(countTestUser);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: countTestUser.email, password: countTestUser.password });
      
      const countTestToken = loginRes.body.token;
      const testImagePath = path.join(__dirname, '..', 'uploads', 'test-payment.jpg');

      // Register for event
      await request(app)
        .post(`${baseUrl}/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${countTestToken}`)
        .attach('image', testImagePath);

      // Check updated count
      const updatedEvent = await request(app)
        .get(`/api/v1/events/${testEventId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(updatedEvent.body.data.registeredCount).toBe(1);
    });
  });
});
