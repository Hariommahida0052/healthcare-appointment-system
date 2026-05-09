const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────
// @route   POST /api/payments/create-session
// @desc    Create a Stripe Checkout Session for an appointment
// @access  Private (Patient only)
//
// HOW IT WORKS:
// 1. Patient clicks "Pay Now" in frontend
// 2. We create a Stripe Checkout Session with appointment details
// 3. Return the Stripe session URL to the frontend
// 4. Frontend redirects patient to Stripe's hosted payment page
// ─────────────────────────────────────────────────────────
const createCheckoutSession = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'fullName')
      .populate('patient', 'fullName email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the patient of this appointment can pay
    if (appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this appointment' });
    }

    // Don't allow duplicate payment
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This appointment is already paid' });
    }

    // Get doctor's consultation fee from their profile
    const doctorProfile = await DoctorProfile.findOne({ user: appointment.doctor._id });
    const consultationFee = doctorProfile?.consultationFee || 500; // default ₹500

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: appointment.patient.email,

      // What the patient is paying for
      line_items: [
        {
          price_data: {
            currency: 'inr',                  // Change to 'usd' if needed
            product_data: {
              name: `Consultation with Dr. ${appointment.doctor.fullName}`,
              description: `Date: ${new Date(appointment.date).toDateString()} | Slot: ${appointment.timeSlot} | Type: ${appointment.type}`,
            },
            unit_amount: consultationFee * 100,  // Stripe needs amount in paise (₹500 = 50000 paise)
          },
          quantity: 1,
        },
      ],

      // Where to redirect after payment
      success_url: `${process.env.CLIENT_URL}/payment-success?appointmentId=${appointmentId}`,
      cancel_url: `${process.env.CLIENT_URL}/patient/appointments`,

      // Store appointment ID so we can find it in the webhook
      metadata: {
        appointmentId: appointmentId.toString(),
        patientId: req.user._id.toString(),
        doctorId: appointment.doctor._id.toString(),
        amount: consultationFee.toString(),
      },
    });

    // Save a pending payment record in our DB
    await Payment.create({
      appointment: appointmentId,
      patient: req.user._id,
      doctor: appointment.doctor._id,
      amount: consultationFee,
      currency: 'inr',
      stripeSessionId: session.id,
      status: 'pending',
    });

    // Return the Stripe session URL to the frontend
    res.json({
      sessionId: session.id,
      sessionUrl: session.url,   // Frontend will redirect patient here
    });

  } catch (error) {
    console.error('createCheckoutSession error:', error.message);
    res.status(500).json({ message: 'Failed to create payment session' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   POST /api/payments/webhook
// @desc    Stripe Webhook — called automatically by Stripe after payment
// @access  Public (called by Stripe, not by our frontend)
//
// HOW IT WORKS:
// After patient pays on Stripe, Stripe sends a POST request to this route
// We verify the signature (to confirm it's really from Stripe)
// Then update our appointment status to 'confirmed' and payment to 'paid'
// ─────────────────────────────────────────────────────────
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the event came from Stripe (not a fake request)
    event = stripe.webhooks.constructEvent(
      req.body,                              // raw body (not JSON parsed!)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the payment success event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const { appointmentId, patientId, doctorId, amount } = session.metadata;

      // Update appointment: confirmed + paid
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentId: session.payment_intent,
      });

      // Update payment record: successful
      await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: 'successful',
          stripePaymentIntentId: session.payment_intent,
        }
      );

      console.log(`✅ Payment successful for appointment: ${appointmentId}`);

    } catch (dbError) {
      console.error('Error updating DB after payment:', dbError.message);
    }
  }

  // Tell Stripe we received the event
  res.json({ received: true });
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/payments/history
// @desc    Get payment history for logged-in patient
// @access  Private (Patient only)
// ─────────────────────────────────────────────────────────
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ patient: req.user._id })
      .populate('appointment', 'date timeSlot status type')
      .populate('doctor', 'fullName avatar')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('getPaymentHistory error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   POST /api/payments/refund/:appointmentId
// @desc    Admin or Doctor initiates a refund
// @access  Private (Admin or Doctor only)
// ─────────────────────────────────────────────────────────
const refundPayment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'No payment found for this appointment to refund' });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: appointment.paymentId,
    });

    // Update appointment and payment records
    await Appointment.findByIdAndUpdate(appointmentId, {
      paymentStatus: 'refunded',
      status: 'cancelled',
    });

    await Payment.findOneAndUpdate(
      { appointment: appointmentId },
      { status: 'refunded' }
    );

    res.json({ message: 'Refund processed successfully', refund });
  } catch (error) {
    console.error('refundPayment error:', error.message);
    res.status(500).json({ message: 'Refund failed: ' + error.message });
  }
};

module.exports = {
  createCheckoutSession,
  stripeWebhook,
  getPaymentHistory,
  refundPayment,
};
