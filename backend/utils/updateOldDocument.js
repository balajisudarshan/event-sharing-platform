const User = require('../models/User')
const connectToDb = require('../config/db')
require('dotenv').config()
connectToDb()
async function updateOldUsers() {
    
    await User.updateMany(
      { isVerified: { $exists: false } },
      { $set: { isVerified: false } }
    )
    console.log("updated old users")
    process.exit()
  }
  
  updateOldUsers().catch(err => {
    console.log(err)
    process.exit()
  })