const mongoose = require('mongoose')
require('dotenv').config()

// 😏 MongoDB ra babu… ready kadha? Connection pettaam ra!
const connectToDb = async()=>{
    await mongoose.connect(process.env.MONGO_URI).then(()=>{
        //  Ayyayyoo! MongoDB connect ayyindhi ra anna, chakkaga nadusthundi!
        console.log('Connected to Mongo DB')
    }).catch((err)=>{
        // Abbo ra babu! MongoDB edho kotha drama start chesindhi…
        console.log("Error connecting to Mongo DB", err)
        // Ippudu appudike exit avvali ra, lekapothe system explode ayipothundi!
        process.exit(1)
    })
}

// 🤝 Export chesthaam ra—inka vere file lo use cheddam, chill!
module.exports = connectToDb
