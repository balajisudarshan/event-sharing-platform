const express = require('express')
require('dotenv').config()
const connectToDb = require('./config/db')
const authRouter = require('./routes/userAuth.routes')
const eventRouter = require('./routes/event.routes')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const app = express()

app.use(express.json())
app.use(cors())
app.use(cookieParser())
const baseApi = '/api/v1';
// 😎 auth routes ekkada register chestham ra babu eswar
app.use(`${baseApi}/auth`, authRouter)
//event routes ekkada register chestham ra babu balu
app.use(`${baseApi}/events`, eventRouter)
connectToDb().then(() => {
    // 🚀 Server start ayyindi le boss, sound ostundi port lo
    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`)
    })
}).catch((err) => {
    // 💀 MongoDB edho drama chesthundi ra, check chesuko
    console.log('Error connecting to server', err)
})
