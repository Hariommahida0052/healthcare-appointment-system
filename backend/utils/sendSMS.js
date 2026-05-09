const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS via Twilio
 * @param {string} toPhone  - Patient's phone number e.g. "+919876543210"
 * @param {string} message  - SMS message text
 */
const sendSMS = async (toPhone, message) => {
  try {
    // Skip SMS if phone number is not provided or Twilio not configured
    if (!toPhone || !process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
        console.log(`📱 [SMS SKIPPED - Twilio not configured] To: ${toPhone} | Msg: ${message}`);
        return;
      }
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,   // Your Twilio number
      to: toPhone,                       // Patient's phone
    });

    console.log(`📱 SMS sent to ${toPhone} | SID: ${result.sid}`);
  } catch (error) {
    // Don't crash the app if SMS fails — just log it
    console.error(`📱 SMS failed to ${toPhone}:`, error.message);
  }
};

/**
 * Send Booking Confirmation SMS
 */
const sendBookingConfirmedSMS = async (phone, doctorName, date, timeSlot) => {
  const message = `✅ Your appointment with Dr. ${doctorName} is confirmed!\nDate: ${new Date(date).toDateString()}\nTime: ${timeSlot}\n- Healthcare App`;
  await sendSMS(phone, message);
};

/**
 * Send Appointment Reminder SMS (1 hour before)
 */
const sendReminderSMS = async (phone, doctorName, timeSlot, videoLink) => {
  const message = `⏰ Reminder: Your appointment with Dr. ${doctorName} starts in 1 hour at ${timeSlot}.\n${videoLink ? `Join: ${videoLink}` : ''}\n- Healthcare App`;
  await sendSMS(phone, message);
};

/**
 * Send Cancellation SMS
 */
const sendCancellationSMS = async (phone, doctorName, date) => {
  const message = `❌ Your appointment with Dr. ${doctorName} on ${new Date(date).toDateString()} has been cancelled.\n- Healthcare App`;
  await sendSMS(phone, message);
};

module.exports = {
  sendBookingConfirmedSMS,
  sendReminderSMS,
  sendCancellationSMS,
};
