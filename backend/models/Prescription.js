const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medications: [{
    name:         { type: String, required: true },   // "Paracetamol"
    dosage:       { type: String, default: '' },      // "500mg"
    frequency:    { type: String, default: '' },      // "Twice daily"
    duration:     { type: String, default: '' },      // "7 days"
    instructions: { type: String, default: '' }       // "After meals"
  }],
  diagnosis: {
    type: String,
    default: ''
  },
  advice: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
