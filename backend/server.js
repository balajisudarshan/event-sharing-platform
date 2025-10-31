const express = require('express')
require('dotenv').config()
const connectToDb = require('./config/db')
const app = express()
connectToDb().then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Server running on port ${process.env.PORT}`)
    })
}).catch((err)=>{
    console.log('Error connecting to server',err)
})
