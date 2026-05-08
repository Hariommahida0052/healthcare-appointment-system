const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true                 // "Blood Report - March 2026"
  },
  type: {
    type: String,
    enum: ['report', 'scan', 'prescription', 'other'],
    default: 'report'
  },
  fileUrl: {
    type: String,
    required: true                 // Cloudinary URL
  },
  filePublicId: {
    type: String,
    default: ''                    // Cloudinary public ID for deletion
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
