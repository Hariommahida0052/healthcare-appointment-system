const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  stripeWebhook,
  getPaymentHistory,
  refundPayment,
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// ── IMPORTANT: Stripe Webhook must use raw body (not JSON parsed) ──
// This route must be defined BEFORE express.json() parses the body
// We handle this in server.js by using express.raw() for this route
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),  // raw body for Stripe signature verification
  stripeWebhook
);

// ── Protected Routes ────────────────────────────────────

// Patient creates a checkout session → gets Stripe URL
router.post('/create-session', protect, authorize('patient'), createCheckoutSession);

// Patient views their payment history
router.get('/history', protect, authorize('patient'), getPaymentHistory);

// Admin or Doctor initiates a refund
router.post('/refund/:appointmentId', protect, authorize('admin', 'doctor'), refundPayment);

module.exports = router;
