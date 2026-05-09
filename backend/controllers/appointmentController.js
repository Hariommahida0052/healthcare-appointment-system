const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const { generateFreeSlots } = require('../utils/slotGenerator');
const { v4: uuidv4 } = require('uuid');

// ─────────────────────────────────────────────────────────
// @route   POST /api/appointments
// @desc    Patient creates a new appointment (status: pending, payment: unpaid)
// @access  Private (Patient only)
// ─────────────────────────────────────────────────────────
const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, type, symptoms } = req.body;

    // --- Basic Validation ---
    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Doctor, date and time slot are required' });
    }

    // --- Check doctor exists and is approved ---
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.isApproved) {
      return res.status(404).json({ message: 'Doctor not found or not approved' });
    }

    // --- Get doctor's availability schedule ---
    const profile = await DoctorProfile.findOne({ user: doctorId });
    if (!profile) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // --- Check the requested slot is actually free (prevent double booking) ---
    const freeSlots = await generateFreeSlots(doctorId, profile.availability, date);
    const requestedTime = timeSlot.split(' - ')[0]; // "09:00 - 09:30" → "09:00"

    if (!freeSlots.includes(requestedTime)) {
      return res.status(409).json({
        message: 'This time slot is already booked or unavailable. Please choose another slot.'
      });
    }

    // --- Build the formatted timeSlot string "HH:MM - HH:MM" ---
    const slotDuration = profile.availability[0]?.slotDuration || 30;
    const [startHour, startMin] = requestedTime.split(':').map(Number);
    const endTotalMins = startHour * 60 + startMin + slotDuration;
    const endTime = `${Math.floor(endTotalMins / 60).toString().padStart(2, '0')}:${(endTotalMins % 60).toString().padStart(2, '0')}`;
    const formattedSlot = `${requestedTime} - ${endTime}`;

    // --- Create the appointment ---
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date: new Date(date),
      timeSlot: formattedSlot,
      type: type || 'online',
      symptoms: symptoms || '',
      status: 'pending',
      paymentStatus: 'unpaid',
      videoRoomId: uuidv4(),  // unique room ID for WebRTC video call
    });

    // Populate doctor and patient info before returning
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'fullName email avatar')
      .populate('patient', 'fullName email avatar phone');

    res.status(201).json({
      message: 'Appointment created successfully. Please complete payment to confirm.',
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error('createAppointment error:', error.message);
    res.status(500).json({ message: 'Server error while creating appointment' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/appointments/:id
// @desc    Get a single appointment by ID
// @access  Private (Patient or Doctor of that appointment)
// ─────────────────────────────────────────────────────────
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'fullName email avatar phone')
      .populate('patient', 'fullName email avatar phone')
      .populate('prescription');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the patient or doctor of this appointment can view it (or admin)
    const isOwner =
      appointment.patient._id.toString() === req.user._id.toString() ||
      appointment.doctor._id.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('getAppointmentById error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/appointments/:id/confirm
// @desc    Doctor confirms a pending appointment
// @access  Private (Doctor only)
// ─────────────────────────────────────────────────────────
const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the assigned doctor can confirm
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: `Cannot confirm an appointment with status: ${appointment.status}` });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    res.json({ message: 'Appointment confirmed successfully', appointment });
  } catch (error) {
    console.error('confirmAppointment error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/appointments/:id/cancel
// @desc    Patient or Doctor cancels an appointment
// @access  Private (Patient or Doctor)
// ─────────────────────────────────────────────────────────
const cancelAppointment = async (req, res) => {
  try {
    const { cancelReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the patient or doctor of this appointment can cancel
    const isOwner =
      appointment.patient.toString() === req.user._id.toString() ||
      appointment.doctor.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot cancel an appointment with status: ${appointment.status}` });
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = cancelReason || 'No reason provided';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    console.error('cancelAppointment error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/appointments/:id/complete
// @desc    Doctor marks appointment as completed
// @access  Private (Doctor only)
// ─────────────────────────────────────────────────────────
const completeAppointment = async (req, res) => {
  try {
    const { notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed appointments can be marked as completed' });
    }

    appointment.status = 'completed';
    appointment.notes = notes || '';
    await appointment.save();

    res.json({ message: 'Appointment marked as completed', appointment });
  } catch (error) {
    console.error('completeAppointment error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/appointments/:id/no-show
// @desc    Doctor marks patient as no-show
// @access  Private (Doctor only)
// ─────────────────────────────────────────────────────────
const markNoShow = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'no-show';
    await appointment.save();

    res.json({ message: 'Appointment marked as no-show', appointment });
  } catch (error) {
    console.error('markNoShow error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/appointments/:id/notes
// @desc    Doctor adds/updates consultation notes
// @access  Private (Doctor only)
// ─────────────────────────────────────────────────────────
const addNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.notes = notes;
    await appointment.save();

    res.json({ message: 'Notes updated', appointment });
  } catch (error) {
    console.error('addNotes error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/appointments/room/:roomId
// @desc    Validate access to a video consultation room
// @access  Private (Patient or Doctor of that appointment)
// ─────────────────────────────────────────────────────────
const validateVideoRoom = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ videoRoomId: req.params.roomId })
      .populate('doctor', 'fullName avatar')
      .populate('patient', 'fullName avatar');

    if (!appointment) {
      return res.status(404).json({ message: 'Video room not found' });
    }

    // Only the assigned patient or doctor can join
    const isOwner =
      appointment.patient._id.toString() === req.user._id.toString() ||
      appointment.doctor._id.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({ message: 'You are not authorized to join this room' });
    }

    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: 'This appointment is not confirmed yet' });
    }

    res.json({
      roomId: req.params.roomId,
      appointment,
      role: req.user.role,  // tells the frontend if user is 'patient' or 'doctor'
    });
  } catch (error) {
    console.error('validateVideoRoom error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAppointment,
  getAppointmentById,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  markNoShow,
  addNotes,
  validateVideoRoom,
};
