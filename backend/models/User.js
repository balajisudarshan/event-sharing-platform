const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:['USER','TEMP_ADMIN','SUPER_ADMIN'],
        default:'USER'
    },
    promotedUntil:{
        type:Date|null
    },
    isIEEE:{
        type:Boolean,
        default:false
    },
    branch:{
        type:String,
        enum:['CSE','AIDS','ECE','EEE','CIVIL','MECH'],
        required:true
    },
    year:{
        type:String,
        min:1,
        max:4
    }
},{timeStamps:true})

module.exports = new mongoose.model('User',userSchema)