const express = require('express')
const app = express()
const userRoutes = require('./routes/userRoutes')
require('dotenv').config()

app.use(express.json())
app.use('/api/users',userRoutes)
const connectDB = require('./config/db')
const PORT = process.env.PORT
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
})
