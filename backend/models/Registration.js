const mongoose = require('mongoose');
require('dotenv').config();

const registrationSchema = new mongoose.Schema({
    eventId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Event',
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    ieeeId: {
        type: String 
    },
    paymentScreenshot: {
        type: String
    },
    registeredAt:{
        type:Date,
        default:Date.now
    }
})

module.exports =  mongoose.model('Registration',registrationSchema)