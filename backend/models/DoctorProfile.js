const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true,
    default: 'General Physician'
  },
  qualifications: [String],       // ['MBBS', 'MD']
  experience: {
    type: Number,
    default: 0                    // years
  },
  consultationFee: {
    type: Number,
    default: 500                  // in ₹
  },
  bio: {
    type: String,
    default: ''
  },
  languages: [String],
  hospital: {
    type: String,
    default: ''
  },
  availability: [{
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    startTime: String,            // "09:00"
    endTime: String,              // "17:00"
    slotDuration: {
      type: Number,
      default: 30                 // minutes
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
