const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// ─────────────────────────────────────────────────────────
// @route   GET /api/patients/profile
// @desc    Get logged-in patient's profile
// @access  Private (Patient only)
// ─────────────────────────────────────────────────────────
const getPatientProfile = async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('-password');
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/patients/profile
// @desc    Update logged-in patient's profile
// @access  Private (Patient only)
// ─────────────────────────────────────────────────────────
const updatePatientProfile = async (req, res) => {
  try {
    const { fullName, phone, gender, dateOfBirth, address, avatar } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, gender, dateOfBirth, address, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    console.error('updatePatientProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/patients/appointments
// @desc    Get all appointments of the logged-in patient
// @access  Private (Patient only)
// ─────────────────────────────────────────────────────────
const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'fullName avatar email')
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('getPatientAppointments error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/patients/prescriptions
// @desc    Get all prescriptions received by the patient
// @access  Private (Patient only)
// ─────────────────────────────────────────────────────────
const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.user._id })
      .populate('doctor', 'fullName avatar')
      .populate('appointment', 'date timeSlot')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error('getPatientPrescriptions error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/patients/medical-records
// @desc    Get all medical records uploaded by the patient
// @access  Private (Patient only)
// ─────────────────────────────────────────────────────────
const getMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.user._id })
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error('getMedicalRecords error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   POST /api/patients/medical-records
// @desc    Upload a new medical record (file URL from Cloudinary)
// @access  Private (Patient only)
// ─────────────────────────────────────────────────────────
const uploadMedicalRecord = async (req, res) => {
  try {
    const { title, type, fileUrl, filePublicId, notes } = req.body;

    if (!title || !fileUrl) {
      return res.status(400).json({ message: 'Title and file URL are required' });
    }

    const record = await MedicalRecord.create({
      patient: req.user._id,
      uploadedBy: req.user._id,
      title,
      type: type || 'report',
      fileUrl,
      filePublicId: filePublicId || '',
      notes: notes || '',
    });

    res.status(201).json({ message: 'Medical record uploaded', record });
  } catch (error) {
    console.error('uploadMedicalRecord error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   DELETE /api/patients/medical-records/:id
// @desc    Delete a medical record
// @access  Private (Patient only)
// ─────────────────────────────────────────────────────────
const deleteMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Make sure only the owner can delete
    if (record.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await record.deleteOne();
    res.json({ message: 'Medical record deleted' });
  } catch (error) {
    console.error('deleteMedicalRecord error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getPatientAppointments,
  getPatientPrescriptions,
  getMedicalRecords,
  uploadMedicalRecord,
  deleteMedicalRecord,
};
