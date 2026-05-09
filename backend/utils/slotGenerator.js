/**
 * Slot Generator Utility
 * ---------------------
 * Given a doctor's availability schedule and a specific date,
 * this function returns an array of available (free) time slots.
 *
 * Example output: ["09:00", "09:30", "10:00", "10:30", ...]
 */

const Appointment = require('../models/Appointment');

/**
 * Convert "HH:MM" string to total minutes from midnight
 * e.g. "09:30" => 570
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert total minutes back to "HH:MM" string
 * e.g. 570 => "09:30"
 */
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * Main function: Generate free slots for a doctor on a given date
 *
 * @param {string} doctorId   - MongoDB ObjectId of the doctor
 * @param {Array}  availability - Doctor's weekly schedule array from DoctorProfile
 * @param {string} dateStr    - Date string e.g. "2026-05-10"
 * @returns {Array} freeSlots - Array of available time strings e.g. ["09:00", "09:30"]
 */
const generateFreeSlots = async (doctorId, availability, dateStr) => {
  // Get the day name (e.g. "Mon", "Tue") from the given date
  const date = new Date(dateStr);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[date.getDay()];

  // Find the doctor's schedule for that day
  const daySchedule = availability.find(
    (slot) => slot.day === dayName && slot.isAvailable
  );

  // If doctor is not available on this day, return empty array
  if (!daySchedule) return [];

  const { startTime, endTime, slotDuration } = daySchedule;
  const start = timeToMinutes(startTime);  // e.g. 540 (09:00)
  const end = timeToMinutes(endTime);      // e.g. 1020 (17:00)
  const duration = slotDuration || 30;    // default 30 minutes

  // Generate ALL possible slots for the day
  const allSlots = [];
  for (let time = start; time + duration <= end; time += duration) {
    allSlots.push(minutesToTime(time));
  }

  // Fetch already booked appointments for this doctor on this date
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['cancelled'] }  // ignore cancelled appointments
  });

  // Extract booked start times e.g. ["09:00", "10:30"]
  const bookedTimes = bookedAppointments.map((appt) => {
    return appt.timeSlot.split(' - ')[0]; // "09:00 - 09:30" => "09:00"
  });

  // Return only slots that are NOT booked
  const freeSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));

  return freeSlots;
};

module.exports = { generateFreeSlots };
