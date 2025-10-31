const express = require('express')
require('dotenv').config()
const connectToDb = require('./config/db')
const authRouter = require('./routes/userAuth.routes')
const cors = require('cors')
const app = express()

app.use(express.json())
app.use(cors())

// 😎 auth routes ekkada register chestham ra babu eswar
app.use('/api/v1/auth', authRouter)

connectToDb().then(() => {
    // 🚀 Server start ayyindi le boss, sound ostundi port lo
    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`)
    })
}).catch((err) => {
    // 💀 MongoDB edho drama chesthundi ra, check chesuko
    console.log('Error connecting to server', err)
})
