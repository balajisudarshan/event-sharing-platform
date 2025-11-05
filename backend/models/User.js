const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['USER', 'TEMP_ADMIN', 'SUPER_ADMIN'],
    default: 'USER'
  },
  promotedUntil: {
    type: Date
  },
  isIEEE: {
    type: Boolean,
    default: false
  },
  IEEE_ID: {
    type: String,
    unique: true,
    sparse: true,
    default: undefined 
  },
  branch: {
    type: String,
    enum: ['CSE', 'AIDS', 'ECE', 'EEE', 'CIVIL', 'MECH'],
    required: true
  },
  year: {
    type: Number,
    min: 1,
    max: 4
  }
}, { timestamps: true });




userSchema.pre("save", function (next) {
  
  if (this.IEEE_ID === null || this.IEEE_ID === '') {
    this.IEEE_ID = undefined;
  }
  
  if (this.isIEEE && !this.IEEE_ID) {
    const err = new Error("IEEE ID is required");
    return next(err);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
