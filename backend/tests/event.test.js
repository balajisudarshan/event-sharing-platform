const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Event = require('../models/Event');

const baseUrl = '/api/v1/events';

describe('Event API Tests', () => {
  let superAdminToken, tempAdminToken, userToken;
  let superAdminId, tempAdminId, userId;
  let eventId, ieeeEventId;

  const testUsers = {
    superAdmin: {
      name: 'Super Admin',
      email: 'superadmin@test.com',
      password: 'AdminPass123!',
      studentId: 'STU201',
      role: 'SUPER_ADMIN',
      branch: 'CSE',
      year: 4
    },
    tempAdmin: {
      name: 'Temp Admin',
      email: 'tempadmin@test.com',
      password: 'TempPass123!',
      studentId: 'STU202',
      role: 'TEMP_ADMIN',
      promotedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      branch: 'ECE',
      year: 3
    },
    user: {
      name: 'Regular User',
      email: 'user@test.com',
      password: 'UserPass123!',
      studentId: 'STU203',
      branch: 'AIDS',
      year: 2
    }
  };

  const testEvent = {
    title: 'Tech Conference 2025',
    description: 'This is a comprehensive tech conference covering AI, ML, and Cloud Computing topics',
    type: 'GENERAL',
    location: 'Main Auditorium, Building A',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days from now
    capacity: 100,
    thumbnail: 'https://example.com/thumbnail.jpg',
    qrCode: 'https://example.com/qrcode.jpg'
  };

  const ieeeEvent = {
    title: 'IEEE Workshop on Robotics',
    description: 'Advanced robotics workshop for IEEE members covering autonomous systems and control',
    type: 'IEEE',
    location: 'Robotics Lab, Building C',
    startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    capacity: 50
  };

  beforeAll(async () => {
    // Clear database
    await User.deleteMany({});
    await Event.deleteMany({});

    // Register users
    const superAdminRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUsers.superAdmin);
    superAdminId = superAdminRes.body.user._id;

    const tempAdminRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUsers.tempAdmin);
    tempAdminId = tempAdminRes.body.user._id;

    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUsers.user);
    userId = userRes.body.user._id;

    // Login users
    const superAdminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUsers.superAdmin.email,
        password: testUsers.superAdmin.password
      });
    superAdminToken = superAdminLogin.body.token;

    const tempAdminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUsers.tempAdmin.email,
        password: testUsers.tempAdmin.password
      });
    tempAdminToken = tempAdminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUsers.user.email,
        password: testUsers.user.password
      });
    userToken = userLogin.body.token;
  });

  describe('POST / - Create Event', () => {
    test('Should create GENERAL event by SUPER_ADMIN', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(testEvent)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Event created successfully');
      expect(response.body.data).toHaveProperty('title', testEvent.title);
      expect(response.body.data).toHaveProperty('type', 'GENERAL');
      expect(response.body.data).toHaveProperty('capacity', 100);
      expect(response.body.data).toHaveProperty('registeredCount', 0);
      expect(response.body.data.organizer.toString()).toBe(superAdminId);
      
      eventId = response.body.data._id;
    });

    test('Should create IEEE event by TEMP_ADMIN', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${tempAdminToken}`)
        .send(ieeeEvent)
        .expect(201);

      expect(response.body.data).toHaveProperty('type', 'IEEE');
      expect(response.body.data).toHaveProperty('capacity', 50);
      
      ieeeEventId = response.body.data._id;
    });

    test('Should fail to create event without authentication', async () => {
      const response = await request(app)
        .post(baseUrl)
        .send(testEvent)
        .expect(401);
    });

    test('Should fail to create event with USER role', async () => {
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .send(testEvent)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Forbidden - Permission ledu ra mawa');
    });

    test('Should fail to create event with short title', async () => {
      const invalidEvent = { ...testEvent, title: 'AI' };
      
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidEvent)
        .expect(400);

      expect(response.body.message).toContain('Title');
    });

    test('Should fail to create event with short description', async () => {
      const invalidEvent = { ...testEvent, description: 'Short' };
      
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidEvent)
        .expect(400);

      expect(response.body.message).toContain('Description');
    });

    test('Should fail to create event with invalid type', async () => {
      const invalidEvent = { ...testEvent, type: 'INVALID_TYPE' };
      
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidEvent)
        .expect(400);

      expect(response.body.message).toContain('Type');
    });

    test('Should fail to create event with endDate before startDate', async () => {
      const invalidEvent = {
        ...testEvent,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidEvent)
        .expect(400);

      expect(response.body.message).toContain('endDate must be after startDate');
    });

    test('Should create event without optional fields', async () => {
      const minimalEvent = {
        title: 'Minimal Event',
        description: 'This is a minimal event with only required fields',
        type: 'GENERAL',
        location: 'Room 101',
        startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 50 // capacity is actually required in the model
      };

      const response = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(minimalEvent)
        .expect(201);

      expect(response.body.data).toHaveProperty('title', 'Minimal Event');
    });
  });

  describe('GET / - Get All Events', () => {
    test('Should get all events with authentication', async () => {
      const response = await request(app)
        .get(baseUrl)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('total');
    });

    test('Should filter events by type=IEEE', async () => {
      const response = await request(app)
        .get(`${baseUrl}?type=IEEE`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.every(event => event.type === 'IEEE')).toBe(true);
    });

    test('Should filter events by type=GENERAL', async () => {
      const response = await request(app)
        .get(`${baseUrl}?type=GENERAL`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.every(event => event.type === 'GENERAL')).toBe(true);
    });

    test('Should filter upcoming events', async () => {
      const response = await request(app)
        .get(`${baseUrl}?upcoming=true`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.every(event => 
        new Date(event.startDate) >= new Date()
      )).toBe(true);
    });

    test('Should search events by title', async () => {
      const response = await request(app)
        .get(`${baseUrl}?search=Tech`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Should paginate events', async () => {
      const response = await request(app)
        .get(`${baseUrl}?page=1&limit=2`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .get(baseUrl)
        .expect(401);
    });
  });

  describe('GET /:id - Get Event By ID', () => {
    test('Should get event by valid ID', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('_id', eventId);
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('organizer');
    });

    test('Should fail to get non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`${baseUrl}/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Event not found');
    });

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${eventId}`)
        .expect(401);
    });
  });

  describe('PUT /:id - Update Event', () => {
    test('Should update event by SUPER_ADMIN', async () => {
      const updates = {
        title: 'Updated Tech Conference 2025',
        capacity: 150
      };

      const response = await request(app)
        .put(`${baseUrl}/${eventId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Event updated successfully');
      expect(response.body.data).toHaveProperty('title', 'Updated Tech Conference 2025');
      expect(response.body.data).toHaveProperty('capacity', 150);
    });

    test('Should update own event by TEMP_ADMIN', async () => {
      const updates = {
        description: 'Updated robotics workshop description with new topics'
      };

      const response = await request(app)
        .put(`${baseUrl}/${ieeeEventId}`)
        .set('Authorization', `Bearer ${tempAdminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.description).toContain('Updated robotics');
    });

    test('Should fail to update event without authorization', async () => {
      const response = await request(app)
        .put(`${baseUrl}/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Hacked Event' })
        .expect(403);
    });

    test('Should fail to update non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`${baseUrl}/${fakeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ title: 'Update' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Event not found');
    });

    test("Should fail for TEMP_ADMIN to update another admin's event", async () => {
      const response = await request(app)
        .put(`${baseUrl}/${eventId}`)
        .set('Authorization', `Bearer ${tempAdminToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);
    });
  });

  describe('GET /:id/registrations - Get Event Registrations', () => {
    test('Should get registrations for own event by organizer', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${eventId}/registrations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Should get registrations by SUPER_ADMIN', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${ieeeEventId}/registrations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    test('Should fail to get registrations by non-organizer USER', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${eventId}/registrations`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test('Should paginate registrations', async () => {
      const response = await request(app)
        .get(`${baseUrl}/${eventId}/registrations?page=1&limit=10`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 10);
    });
  });

  describe('DELETE /:id - Delete Event', () => {
    test('Should delete own event by TEMP_ADMIN', async () => {
      // Create a new event for deletion
      const eventToDelete = {
        title: 'Event To Delete',
        description: 'This event will be deleted in the test',
        type: 'GENERAL',
        location: 'Test Location',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 30
      };

      const createResponse = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${tempAdminToken}`)
        .send(eventToDelete);

      const deleteEventId = createResponse.body.data._id;

      const response = await request(app)
        .delete(`${baseUrl}/${deleteEventId}`)
        .set('Authorization', `Bearer ${tempAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Event deleted successfully');
    });

    test('Should delete any event by SUPER_ADMIN', async () => {
      // Create event to delete
      const eventToDelete = {
        title: 'Another Event To Delete',
        description: 'This event will be deleted by super admin',
        type: 'IEEE',
        location: 'Test Location',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 40
      };

      const createResponse = await request(app)
        .post(baseUrl)
        .set('Authorization', `Bearer ${tempAdminToken}`)
        .send(eventToDelete);

      const deleteEventId = createResponse.body.data._id;

      const response = await request(app)
        .delete(`${baseUrl}/${deleteEventId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Event deleted successfully');
    });

    test('Should fail to delete event without authorization', async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test("Should fail for TEMP_ADMIN to delete another admin's event", async () => {
      const response = await request(app)
        .delete(`${baseUrl}/${eventId}`)
        .set('Authorization', `Bearer ${tempAdminToken}`)
        .expect(403);
    });

    test('Should fail to delete non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`${baseUrl}/${fakeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Event not found');
    });
  });
});
