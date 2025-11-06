const express = require('express')
require('dotenv').config()
const connectToDb = require('./config/db')
const authRouter = require('./routes/userAuth.routes')
const eventRouter = require('./routes/event.routes')
const registrationRouter = require('./routes/registration.routes')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const app = express()

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"],
}));



app.use(express.json())
app.use(cookieParser())

const baseApi = '/api/v1'

// ✅ Step 3: Register routes AFTER CORS
app.use(`${baseApi}/auth`, authRouter)
app.use(`${baseApi}/events`, eventRouter)
app.use(`${baseApi}/registrations`, registrationRouter)

if (process.env.NODE_ENV !== 'test') {
  connectToDb().then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port http://localhost:${process.env.PORT}`)
    })
  }).catch((err) => {
    console.log('Error connecting to server', err)
  })
}

module.exports = app
