const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async()=>{
    await mongoose.connect(process.env.MONGO_URI).then(()=>{
        console.log('MongoDB connected successfully');
    }).catch((Err)=>{
        console.log('MongoDB connection failed',Err);
    })
}

module.exports = connectDB;