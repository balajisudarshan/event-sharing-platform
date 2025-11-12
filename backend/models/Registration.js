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
        enum: ['REGISTERED', 'AWAITING_CONFIRMATION'],
        default: 'AWAITING_CONFIRMATION',
        required: true
    },
    payment_transaction_id:{
        type:String
    },
        
    
},{timestamps: true});

// manaki duplicates vaddu raa
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);