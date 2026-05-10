const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  getAllUsers,
  deactivateUser,
  activateUser,
  getAllAppointments,
  getAllPayments,
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes require login + admin role
router.use(protect, authorize('admin'));

// ── Dashboard ───────────────────────────────────────────
// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', getDashboardStats);

// ── Doctor Management ───────────────────────────────────
// GET  /api/admin/doctors/pending        → list unapproved doctors
// PUT  /api/admin/doctors/:id/approve    → approve a doctor
// PUT  /api/admin/doctors/:id/reject     → reject a doctor
router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:id/approve', approveDoctor);
router.put('/doctors/:id/reject', rejectDoctor);

// ── User Management ─────────────────────────────────────
// GET  /api/admin/users?role=&search=&page=  → list all users
// PUT  /api/admin/users/:id/deactivate       → deactivate user
// PUT  /api/admin/users/:id/activate         → re-activate user
router.get('/users', getAllUsers);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/users/:id/activate', activateUser);

// ── Appointments ─────────────────────────────────────────
// GET /api/admin/appointments?status=&page=
router.get('/appointments', getAllAppointments);

// ── Payments / Revenue ───────────────────────────────────
// GET /api/admin/payments?page=
router.get('/payments', getAllPayments);

module.exports = router;
