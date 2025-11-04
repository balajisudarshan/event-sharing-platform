const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Increase timeout for first run (downloads MongoDB binary)
  jest.setTimeout(120000);
  
  // Close any existing mongoose connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Create and start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect mongoose to the memory server
  await mongoose.connect(mongoUri);
  
  console.log('✅ MongoDB Memory Server connected for testing');
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Global test utilities
global.testUtils = {
  // Generate valid ObjectId
  generateObjectId: () => new mongoose.Types.ObjectId().toString(),
  
  // Wait for async operations
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Clean database between tests if needed
  cleanDatabase: async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
};
