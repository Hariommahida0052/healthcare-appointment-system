const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendReminderEmail } = require('../utils/sendEmail');
const { sendReminderSMS } = require('../utils/sendSMS');

/**
 * Reminder Cron Job
 * -----------------
 * Runs every 15 minutes.
 * Finds all confirmed appointments starting within the next hour
 * that haven't had a reminder sent yet.
 * Sends email + SMS reminder to the patient.
 */
const startReminderCron = () => {
  // Runs every 15 minutes: '0,15,30,45 * * * *'
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ [CRON] Checking for upcoming appointments...');

    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);        // now + 1 hour
      const oneHourFifteen = new Date(now.getTime() + 75 * 60 * 1000);      // now + 1 hour 15 min

      // Find appointments that:
      // 1. Are confirmed (payment done, doctor confirmed)
      // 2. Start within the next 60–75 minutes (our cron window)
      // 3. Haven't had a reminder sent yet
      const upcomingAppointments = await Appointment.find({
        status: 'confirmed',
        reminderSent: false,
        date: { $gte: oneHourLater, $lte: oneHourFifteen },
      })
        .populate('patient', 'fullName email phone')
        .populate('doctor', 'fullName');

      console.log(`⏰ [CRON] Found ${upcomingAppointments.length} appointment(s) needing reminders`);

      for (const appointment of upcomingAppointments) {
        const { patient, doctor, date, timeSlot, type, videoRoomId } = appointment;

        // Send Email Reminder
        if (patient.email) {
          await sendReminderEmail({
            patientEmail: patient.email,
            patientName: patient.fullName,
            doctorName: doctor.fullName,
            date,
            timeSlot,
            type,
            videoRoomId,
          });
        }

        // Send SMS Reminder
        if (patient.phone) {
          const videoLink = type === 'online'
            ? `${process.env.CLIENT_URL}/consultation/${videoRoomId}`
            : null;

          await sendReminderSMS(
            patient.phone,
            doctor.fullName,
            timeSlot,
            videoLink
          );
        }

        // Mark reminder as sent so we don't send it again
        await Appointment.findByIdAndUpdate(appointment._id, { reminderSent: true });

        console.log(`✅ [CRON] Reminder sent for appointment: ${appointment._id}`);
      }
    } catch (error) {
      console.error('❌ [CRON] Error in reminder job:', error.message);
    }
  });

  console.log('✅ Reminder cron job started (runs every 15 minutes)');
};

module.exports = { startReminderCron };
