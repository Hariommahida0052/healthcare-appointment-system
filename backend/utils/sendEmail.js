const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // your Gmail address
    pass: process.env.EMAIL_PASS,   // Gmail App Password (not your normal password)
  },
});

/**
 * Send Appointment Confirmation Email to Patient
 * Called after: payment success (webhook) OR doctor confirmation
 */
const sendConfirmationEmail = async ({ patientEmail, patientName, doctorName, date, timeSlot, type, videoRoomId }) => {
  const videoLink = type === 'online'
    ? `<p>🎥 <strong>Video Consultation Link:</strong> <a href="${process.env.CLIENT_URL}/consultation/${videoRoomId}">Join Here</a></p>`
    : '';

  const mailOptions = {
    from: `"Healthcare App" <${process.env.EMAIL_USER}>`,
    to: patientEmail,
    subject: '✅ Appointment Confirmed — Healthcare App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb;">🏥 Appointment Confirmed!</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment has been successfully confirmed. Here are the details:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background:#f1f5f9;">
            <td style="padding:8px; border:1px solid #e2e8f0;"><strong>Doctor</strong></td>
            <td style="padding:8px; border:1px solid #e2e8f0;">Dr. ${doctorName}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e2e8f0;"><strong>Date</strong></td>
            <td style="padding:8px; border:1px solid #e2e8f0;">${new Date(date).toDateString()}</td>
          </tr>
          <tr style="background:#f1f5f9;">
            <td style="padding:8px; border:1px solid #e2e8f0;"><strong>Time Slot</strong></td>
            <td style="padding:8px; border:1px solid #e2e8f0;">${timeSlot}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e2e8f0;"><strong>Type</strong></td>
            <td style="padding:8px; border:1px solid #e2e8f0;">${type === 'online' ? '🌐 Online Video' : '🏥 In-Person'}</td>
          </tr>
        </table>
        ${videoLink}
        <p style="color:#64748b; font-size:13px;">You will receive a reminder 1 hour before your appointment.</p>
        <hr/>
        <p style="color:#94a3b8; font-size:12px;">Healthcare App | Do not reply to this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Confirmation email sent to ${patientEmail}`);
};

/**
 * Send Appointment Reminder Email (1 hour before)
 */
const sendReminderEmail = async ({ patientEmail, patientName, doctorName, date, timeSlot, type, videoRoomId }) => {
  const videoLink = type === 'online'
    ? `<p>🎥 <strong>Join your video call:</strong> <a href="${process.env.CLIENT_URL}/consultation/${videoRoomId}">Click Here</a></p>`
    : '';

  const mailOptions = {
    from: `"Healthcare App" <${process.env.EMAIL_USER}>`,
    to: patientEmail,
    subject: '⏰ Reminder: Your Appointment is in 1 Hour!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #f59e0b;">⏰ Appointment Reminder</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment with <strong>Dr. ${doctorName}</strong> starts in <strong>1 hour</strong>!</p>
        <p><strong>Time Slot:</strong> ${timeSlot}</p>
        <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
        ${videoLink}
        <p style="color:#64748b; font-size:13px;">Please be ready 5 minutes before your appointment.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Reminder email sent to ${patientEmail}`);
};

/**
 * Send Cancellation Email
 */
const sendCancellationEmail = async ({ patientEmail, patientName, doctorName, date, timeSlot, cancelReason }) => {
  const mailOptions = {
    from: `"Healthcare App" <${process.env.EMAIL_USER}>`,
    to: patientEmail,
    subject: '❌ Appointment Cancelled — Healthcare App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #ef4444;">❌ Appointment Cancelled</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${new Date(date).toDateString()}</strong> at <strong>${timeSlot}</strong> has been cancelled.</p>
        <p><strong>Reason:</strong> ${cancelReason || 'Not specified'}</p>
        <p>Please book a new appointment if needed.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Cancellation email sent to ${patientEmail}`);
};

/**
 * Send Prescription Ready Email
 */
const sendPrescriptionEmail = async ({ patientEmail, patientName, doctorName }) => {
  const mailOptions = {
    from: `"Healthcare App" <${process.env.EMAIL_USER}>`,
    to: patientEmail,
    subject: '💊 Your Prescription is Ready — Healthcare App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #10b981;">💊 Prescription Ready</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Dr. <strong>${doctorName}</strong> has written your prescription. You can view it in your dashboard.</p>
        <a href="${process.env.CLIENT_URL}/patient/prescriptions" style="display:inline-block; background:#2563eb; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; margin-top:12px;">View Prescription</a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Prescription email sent to ${patientEmail}`);
};

module.exports = {
  sendConfirmationEmail,
  sendReminderEmail,
  sendCancellationEmail,
  sendPrescriptionEmail,
};
