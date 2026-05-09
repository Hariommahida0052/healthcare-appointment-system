const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  searchDoctors,
  getDoctorById,
  getDoctorAvailability,
  updateDoctorProfile,
  updateAvailability,
  getDoctorAppointments,
} = require('../controllers/doctorController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// ── Public Routes (No login required) ──────────────────
router.get('/', getAllDoctors);                          // GET /api/doctors
router.get('/search', searchDoctors);                   // GET /api/doctors/search?specialization=&name=
router.get('/:id', getDoctorById);                      // GET /api/doctors/:id
router.get('/:id/availability', getDoctorAvailability); // GET /api/doctors/:id/availability?date=

// ── Private Routes (Doctor only) ───────────────────────
router.put('/profile', protect, authorize('doctor'), updateDoctorProfile);        // PUT /api/doctors/profile
router.put('/availability', protect, authorize('doctor'), updateAvailability);    // PUT /api/doctors/availability
router.get('/my-appointments', protect, authorize('doctor'), getDoctorAppointments); // GET /api/doctors/my-appointments

module.exports = router;
