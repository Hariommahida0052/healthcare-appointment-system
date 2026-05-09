const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointmentById,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  markNoShow,
  addNotes,
  validateVideoRoom,
} = require('../controllers/appointmentController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All appointment routes require login
router.use(protect);

// ── Patient Routes ──────────────────────────────────────
// Create a new appointment
router.post('/', authorize('patient'), createAppointment);

// Cancel appointment (patient or doctor can cancel)
router.put('/:id/cancel', authorize('patient', 'doctor', 'admin'), cancelAppointment);

// ── Doctor Routes ───────────────────────────────────────
// Confirm a pending appointment
router.put('/:id/confirm', authorize('doctor'), confirmAppointment);

// Mark appointment as completed (after consultation)
router.put('/:id/complete', authorize('doctor'), completeAppointment);

// Mark patient as no-show
router.put('/:id/no-show', authorize('doctor'), markNoShow);

// Add/update consultation notes
router.put('/:id/notes', authorize('doctor'), addNotes);

// ── Shared Routes (Patient + Doctor + Admin) ─────────────
// Get single appointment details
router.get('/:id', getAppointmentById);

// Validate and get video room info
router.get('/room/:roomId', validateVideoRoom);

module.exports = router;
