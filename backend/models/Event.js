const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    department:{
        type:String,
        required:true
    },
    eventDate:{
        type:Date,
        required:true
    },
    deadLine:{
        type:Date,
        required:true
    },
    imageUrl:{
        type:String
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model('Event',eventSchema);