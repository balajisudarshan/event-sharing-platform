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
      studentId: 'STU001',
      branch: 'CSE',
      year: 2,
      isIEEE: false
    },
    ieeeUser: {
      name: 'IEEE Member',
      email: 'ieeemember@test.com',
      password: 'IEEEPass123!',
      studentId: 'STU002',
      branch: 'ECE',
      year: 3,
      isIEEE: true,
      IEEE_ID: 'IEEE12345'
    },
    superAdmin: {
      name: 'Super Admin',
      email: 'sadmin@test.com',
      password: 'AdminPass123!',
      studentId: 'STU003',
      role: 'SUPER_ADMIN',
      branch: 'CSE',
      year: 4
    },
    tempAdmin: {
      name: 'Temp Admin',
      email: 'tadmin@test.com',
      password: 'TempPass123!',
      studentId: 'STU004',
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
    const freeEvent = {
      title: 'Free General Workshop',
      description: 'This is a free workshop open to all students',
      type: 'FREE',
      location: 'Main Hall',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 100
    };

    const freeEventRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(freeEvent);
    generalEventId = freeEventRes.body.data._id;

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

    // No need for dummy image file anymore - using payment_transaction_id
  });

  describe('POST /events/:id/register - Register for Event', () => {
    test('Should register IEEE user for IEEE event without payment', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${ieeeEventId}/register`)
        .set('Authorization', `Bearer ${ieeeUserToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body.registration).toHaveProperty('status', 'REGISTERED');
      expect(response.body.registration).toHaveProperty('event', ieeeEventId);
      expect(response.body.registration).toHaveProperty('user', ieeeUserId);
    });

    test('Should register user for FREE event without payment', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${generalEventId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body.registration).toHaveProperty('status', 'REGISTERED');
    });

    test('Should register regular user for GENERAL paid event with payment_transaction_id', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${paidEventId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ payment_transaction_id: 'TXN123456789' })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body.registration).toHaveProperty('status', 'AWAITING_CONFIRMATION');
      expect(response.body.registration).toHaveProperty('payment_transaction_id', 'TXN123456789');
      
      registrationId = response.body.registration._id;
    });

    test('Should fail to register without payment_transaction_id for paid event', async () => {
      // Create another user for this test
      const anotherUser = {
        name: 'Another User',
        email: 'another@test.com',
        password: 'Pass123!',
        studentId: 'STU005',
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
        .post(`${baseUrl}/events/${paidEventId}/register`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Payment id required');
    });

    test('Should fail to register for same event twice', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${paidEventId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ payment_transaction_id: 'TXN987654321' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Already registered');
    });

    test('Should fail to register for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`${baseUrl}/events/${fakeEventId}/register`)
        .set('Authorization', `Bearer ${ieeeUserToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Event not found');
    });

    test('Should fail to register without authentication', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${generalEventId}/register`)
        .expect(401);
    });

    test('Should fail if admin tries to register (not USER role)', async () => {
      const response = await request(app)
        .post(`${baseUrl}/events/${generalEventId}/register`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(403);
    });
  });

  // Spot registration feature is currently disabled
  // describe('POST /events/:id/spot-register - Spot Registration', () => {
  //   ...tests commented out
  // });

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
        .send({ status: 'AWAITING_CONFIRMATION' })
        .expect(200);

      expect(response.body.registration).toHaveProperty('status', 'AWAITING_CONFIRMATION');
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
        studentId: 'STU006',
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
      // First create a registration to cancel (use FREE event, no payment needed)
      await request(app)
        .post(`${baseUrl}/events/${generalEventId}/register`)
        .set('Authorization', `Bearer ${ieeeUserToken}`);

      const response = await request(app)
        .delete(`${baseUrl}/events/${generalEventId}/registrations/${ieeeUserId}`)
        .set('Authorization', `Bearer ${ieeeUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Registration cancelled successfully');
    });

    test('Should fail to cancel non-existent registration', async () => {
      // Try to cancel own non-existent registration (use the authenticated user's own ID)
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
      // First create a new registration for testing
      const tempUser = {
        name: 'Temp Cancel User',
        email: 'tempcancel@test.com',
        password: 'TempPass123!',
        studentId: 'STU009',
        branch: 'CSE',
        year: 2
      };

      await request(app).post('/api/v1/auth/register').send(tempUser);
      const tempLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: tempUser.email, password: tempUser.password });
      
      const tempUserId = tempLoginRes.body.user._id;
      const tempToken = tempLoginRes.body.token;

      // Register for FREE event (no payment needed)
      await request(app)
        .post(`${baseUrl}/events/${generalEventId}/register`)
        .set('Authorization', `Bearer ${tempToken}`);

      // Admin cancels the registration
      const response = await request(app)
        .delete(`${baseUrl}/events/${generalEventId}/registrations/${tempUserId}`)
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
      // Create new FREE event
      const newEvent = {
        title: 'Count Test Event',
        description: 'Event to test registration count functionality',
        type: 'FREE',
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
        studentId: 'STU010',
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

      // Register for event (no payment needed for FREE event)
      await request(app)
        .post(`${baseUrl}/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${countTestToken}`);

      // Check updated count
      const updatedEvent = await request(app)
        .get(`/api/v1/events/${testEventId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(updatedEvent.body.data.registeredCount).toBe(1);
    });
  });
});
