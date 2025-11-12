const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

const baseUrl = '/api/v1/auth';

describe('Authentication API Tests', () => {
  let server;
  const testUsers = {
    user: {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123!',
      studentId: 'STU101',
      branch: 'CSE',
      year: 2,
      isIEEE: false
    },
    superAdmin: {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: 'AdminPass123!',
      studentId: 'STU102',
      role: 'SUPER_ADMIN',
      branch: 'CSE',
      year: 4,
      isIEEE: true,
      IEEE_ID: 'IEEE001'
    },
    ieeeUser: {
      name: 'IEEE Member',
      email: 'ieee@example.com',
      password: 'IEEEPass123!',
      studentId: 'STU103',
      branch: 'ECE',
      year: 3,
      isIEEE: true,
      IEEE_ID: 'IEEE002'
    }
  };

  let userToken, superAdminToken, userId, superAdminId;

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  describe('POST /register - User Registration', () => {
    test('Should register a new USER successfully', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(testUsers.user)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body.user).toHaveProperty('email', testUsers.user.email);
      expect(response.body.user).toHaveProperty('name', testUsers.user.name);
      expect(response.body.user).toHaveProperty('role', 'USER');
      expect(response.body.user).not.toHaveProperty('password');
      
      userId = response.body.user._id;
    });

    test('Should register a SUPER_ADMIN successfully', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(testUsers.superAdmin)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body.user).toHaveProperty('role', 'SUPER_ADMIN');
      expect(response.body.user).toHaveProperty('IEEE_ID', 'IEEE001');
      
      superAdminId = response.body.user._id;
    });

    test('Should register an IEEE member successfully', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(testUsers.ieeeUser)
        .expect(201);

      expect(response.body.user).toHaveProperty('isIEEE', true);
      expect(response.body.user).toHaveProperty('IEEE_ID', 'IEEE002');
    });

    test('Should fail to register with duplicate email', async () => {
      // First register the user
      await request(app)
        .post(`${baseUrl}/register`)
        .send(testUsers.user)
        .expect(201);

      // Try to register again with same email
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(testUsers.user)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'User already exist');
    });

    test('Should fail to register without required fields', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send({
          name: 'Incomplete User',
          email: 'incomplete@example.com'
          // Missing password and other required fields
        })
        .expect(500);
    });

    test('Should register user with different branch', async () => {
      const aidsBranchUser = {
        name: 'AIDS Student',
        email: 'aids@example.com',
        password: 'AIDSPass123!',
        studentId: 'STU104',
        branch: 'AIDS',
        year: 1
      };

      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(aidsBranchUser)
        .expect(201);

      expect(response.body.user).toHaveProperty('branch', 'AIDS');
    });
  });

  describe('POST /login - User Login', () => {
    beforeEach(async () => {
      // Register users for login tests
      await request(app).post(`${baseUrl}/register`).send(testUsers.user);
      await request(app).post(`${baseUrl}/register`).send(testUsers.superAdmin);
    });

    test('Should login USER successfully', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: testUsers.user.email,
          password: testUsers.user.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', testUsers.user.email);
      expect(response.body.user).not.toHaveProperty('password');
      
      userToken = response.body.token;
    });

    test('Should login SUPER_ADMIN successfully', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: testUsers.superAdmin.email,
          password: testUsers.superAdmin.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('role', 'SUPER_ADMIN');
      
      superAdminToken = response.body.token;
    });

    test('Should fail to login with wrong password', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: testUsers.user.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid password');
    });

    test('Should fail to login with non-existent email', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!'
        })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });

    test('Should fail to login without credentials', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({})
        .expect(404);
    });
  });

  describe('GET /me - Get User Profile', () => {
    let testUserToken;

    beforeEach(async () => {
      // Register and login a user for profile tests
      await request(app).post(`${baseUrl}/register`).send(testUsers.user);
      const loginRes = await request(app)
        .post(`${baseUrl}/login`)
        .send({ email: testUsers.user.email, password: testUsers.user.password });
      testUserToken = loginRes.body.token;
    });

    test('Should get user profile with valid token', async () => {
      const response = await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('email', testUsers.user.email);
      expect(response.body.user).toHaveProperty('name', testUsers.user.name);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('Should fail to get profile without token', async () => {
      const response = await request(app)
        .get(`${baseUrl}/me`)
        .expect(401);
    });

    test('Should fail to get profile with invalid token', async () => {
      const response = await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);
    });
  });

  describe('POST /promote/:role/:userId - Promote User', () => {
    let testUserId, testSuperAdminToken, testUserToken;

    beforeEach(async () => {
      // Register users for promotion tests
      const userRes = await request(app).post(`${baseUrl}/register`).send(testUsers.user);
      testUserId = userRes.body.user._id;
      
      const superAdminRes = await request(app).post(`${baseUrl}/register`).send(testUsers.superAdmin);
      const userLogin = await request(app)
        .post(`${baseUrl}/login`)
        .send({ email: testUsers.user.email, password: testUsers.user.password });
      testUserToken = userLogin.body.token;

      const superAdminLogin = await request(app)
        .post(`${baseUrl}/login`)
        .send({ email: testUsers.superAdmin.email, password: testUsers.superAdmin.password });
      testSuperAdminToken = superAdminLogin.body.token;
    });

    test('Should promote USER to TEMP_ADMIN by SUPER_ADMIN', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const response = await request(app)
        .post(`${baseUrl}/promote/TEMP_ADMIN/${testUserId}`)
        .set('Authorization', `Bearer ${testSuperAdminToken}`)
        .send({
          until: futureDate.toISOString()
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User promoted to TEMP_ADMIN');
    });

    test('Should promote USER to SUPER_ADMIN', async () => {
      // First create a new user to promote
      const newUser = {
        name: 'User To Promote',
        email: 'promote@example.com',
        password: 'Password123!',
        studentId: 'STU105',
        branch: 'CSE',
        year: 4
      };

      const registerResponse = await request(app)
        .post(`${baseUrl}/register`)
        .send(newUser);

      const newUserId = registerResponse.body.user._id;

      const response = await request(app)
        .post(`${baseUrl}/promote/SUPER_ADMIN/${newUserId}`)
        .set('Authorization', `Bearer ${testSuperAdminToken}`)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User promoted to SUPER_ADMIN');
    });

    test('Should fail to promote without SUPER_ADMIN role', async () => {
      const response = await request(app)
        .post(`${baseUrl}/promote/TEMP_ADMIN/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    test('Should fail to promote to TEMP_ADMIN without until date', async () => {
      const response = await request(app)
        .post(`${baseUrl}/promote/TEMP_ADMIN/${testUserId}`)
        .set('Authorization', `Bearer ${testSuperAdminToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Until date is required for TEMP_ADMIN');
    });

    test('Should fail to promote with past date', async () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const response = await request(app)
        .post(`${baseUrl}/promote/TEMP_ADMIN/${testUserId}`)
        .set('Authorization', `Bearer ${testSuperAdminToken}`)
        .send({
          until: pastDate.toISOString()
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Until date must be in the future');
    });

    test('Should fail to promote with date beyond 30 days', async () => {
      const farFutureDate = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000); // 31 days
      
      const response = await request(app)
        .post(`${baseUrl}/promote/TEMP_ADMIN/${testUserId}`)
        .set('Authorization', `Bearer ${testSuperAdminToken}`)
        .send({
          until: farFutureDate.toISOString()
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Until date must be within 30 days');
    });

    test('Should fail to promote non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`${baseUrl}/promote/SUPER_ADMIN/${fakeUserId}`)
        .set('Authorization', `Bearer ${testSuperAdminToken}`)
        .send({})
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('POST /logout - User Logout', () => {
    test('Should logout successfully', async () => {
      const response = await request(app)
        .post(`${baseUrl}/logout`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
    });
  });
});
