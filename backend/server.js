const express = require('express')
const app = express()
const userRoutes = require('./routes/userRoutes')
// const cookieParser = require('cookie-parser')
const cookieParser = require('cookie-parser')

require('dotenv').config()

app.use(express.json())
app.use(cookieParser())
app.use('/api/users',userRoutes)
app.use('/api/events', eventRoutes);
const connectDB = require('./config/db')
const PORT = process.env.PORT
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    })
})
