const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true               // "10:00 - 10:30"
  },
  type: {
    type: String,
    enum: ['online', 'in-person'],
    default: 'online'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  symptoms: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''                  // doctor's notes after appointment
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentId: {
    type: String,
    default: ''                  // Stripe payment intent ID
  },
  videoRoomId: {
    type: String,
    default: ''                  // unique room ID for WebRTC
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    default: null
  },
  cancelReason: {
    type: String,
    default: ''
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
