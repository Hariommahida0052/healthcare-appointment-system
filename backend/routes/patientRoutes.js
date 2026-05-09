const express = require('express');
const router = express.Router();
const {
  getPatientProfile,
  updatePatientProfile,
  getPatientAppointments,
  getPatientPrescriptions,
  getMedicalRecords,
  uploadMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/patientController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes below require login + patient role
router.use(protect, authorize('patient'));

router.get('/profile', getPatientProfile);                      // GET  /api/patients/profile
router.put('/profile', updatePatientProfile);                   // PUT  /api/patients/profile
router.get('/appointments', getPatientAppointments);            // GET  /api/patients/appointments
router.get('/prescriptions', getPatientPrescriptions);          // GET  /api/patients/prescriptions
router.get('/medical-records', getMedicalRecords);              // GET  /api/patients/medical-records
router.post('/medical-records', uploadMedicalRecord);           // POST /api/patients/medical-records
router.delete('/medical-records/:id', deleteMedicalRecord);     // DELETE /api/patients/medical-records/:id

module.exports = router;
