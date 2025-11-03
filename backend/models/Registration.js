const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const registrationSchema = new Schema({
    event:{
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user:{
        type:Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    status:{
        type: String,
        enum: ['REGISTERED', 'PENDING_PAYMENT', 'AWAITING_CONFIRMATION'],
        default: 'PENDING_PAYMENT',
        required: true
    },
    payment:{
        mode:{
            type: String,
            enum:['ONLINE', 'OFFLINE', 'NONE'],
            default: 'NONE'
        },
        screenshotUrl:{
            type: String
        }
    }
},{timestamps: true});

// ☆*: .｡. o(≧▽≦)o .｡.:*☆ manaki duplicates vaddu raa
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);