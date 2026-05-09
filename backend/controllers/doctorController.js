const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Review = require('../models/Review');
const { generateFreeSlots } = require('../utils/slotGenerator');

// ─────────────────────────────────────────────────────────
// @route   GET /api/doctors
// @desc    Get all approved doctors (public - no login needed)
// @access  Public
// ─────────────────────────────────────────────────────────
const getAllDoctors = async (req, res) => {
  try {
    // Find all users who are approved doctors
    const doctors = await User.find({ role: 'doctor', isApproved: true, isActive: true })
      .select('-password');

    // For each doctor, attach their profile info
    const doctorsWithProfiles = await Promise.all(
      doctors.map(async (doctor) => {
        const profile = await DoctorProfile.findOne({ user: doctor._id });
        return {
          _id: doctor._id,
          fullName: doctor.fullName,
          email: doctor.email,
          avatar: doctor.avatar,
          specialization: profile?.specialization || '',
          experience: profile?.experience || 0,
          consultationFee: profile?.consultationFee || 0,
          hospital: profile?.hospital || '',
          rating: profile?.rating || 0,
          totalReviews: profile?.totalReviews || 0,
          languages: profile?.languages || [],
        };
      })
    );

    res.json(doctorsWithProfiles);
  } catch (error) {
    console.error('getAllDoctors error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/doctors/search?specialization=&name=&city=
// @desc    Search/filter doctors
// @access  Public
// ─────────────────────────────────────────────────────────
const searchDoctors = async (req, res) => {
  try {
    const { specialization, name } = req.query;

    // Build the query for DoctorProfile
    let profileQuery = {};
    if (specialization) {
      profileQuery.specialization = { $regex: specialization, $options: 'i' };
    }

    // Find matching profiles
    const profiles = await DoctorProfile.find(profileQuery).populate({
      path: 'user',
      match: {
        isApproved: true,
        isActive: true,
        ...(name && { fullName: { $regex: name, $options: 'i' } }),
      },
      select: '-password',
    });

    // Filter out profiles where user didn't match
    const results = profiles
      .filter((p) => p.user !== null)
      .map((p) => ({
        _id: p.user._id,
        fullName: p.user.fullName,
        avatar: p.user.avatar,
        specialization: p.specialization,
        experience: p.experience,
        consultationFee: p.consultationFee,
        hospital: p.hospital,
        rating: p.rating,
        totalReviews: p.totalReviews,
        languages: p.languages,
      }));

    res.json(results);
  } catch (error) {
    console.error('searchDoctors error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/doctors/:id
// @desc    Get single doctor full profile + reviews
// @access  Public
// ─────────────────────────────────────────────────────────
const getDoctorById = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).select('-password');
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const profile = await DoctorProfile.findOne({ user: doctor._id });
    const reviews = await Review.find({ doctor: doctor._id })
      .populate('patient', 'fullName avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      _id: doctor._id,
      fullName: doctor.fullName,
      email: doctor.email,
      avatar: doctor.avatar,
      profile,
      reviews,
    });
  } catch (error) {
    console.error('getDoctorById error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/doctors/:id/availability?date=2026-05-10
// @desc    Get available time slots for a doctor on a specific date
// @access  Public
// ─────────────────────────────────────────────────────────
const getDoctorAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Please provide a date (YYYY-MM-DD)' });
    }

    const profile = await DoctorProfile.findOne({ user: req.params.id });
    if (!profile) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const freeSlots = await generateFreeSlots(req.params.id, profile.availability, date);

    res.json({
      date,
      doctorId: req.params.id,
      slotDuration: profile.availability[0]?.slotDuration || 30,
      availableSlots: freeSlots,
    });
  } catch (error) {
    console.error('getDoctorAvailability error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/doctors/profile
// @desc    Doctor updates their own profile
// @access  Private (Doctor only)
// ─────────────────────────────────────────────────────────
const updateDoctorProfile = async (req, res) => {
  try {
    const {
      fullName, phone, gender, avatar,
      specialization, qualifications, experience,
      consultationFee, bio, languages, hospital
    } = req.body;

    // Update base User fields
    await User.findByIdAndUpdate(req.user._id, {
      fullName: fullName || req.user.fullName,
      phone: phone || req.user.phone,
      gender: gender || req.user.gender,
      avatar: avatar || req.user.avatar,
    });

    // Update or create DoctorProfile
    const profile = await DoctorProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        specialization, qualifications, experience,
        consultationFee, bio, languages, hospital
      },
      { new: true, upsert: true }
    );

    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('updateDoctorProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/doctors/availability
// @desc    Doctor sets their weekly availability schedule
// @access  Private (Doctor only)
// ─────────────────────────────────────────────────────────
const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ message: 'Please provide availability as an array' });
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { user: req.user._id },
      { availability },
      { new: true, upsert: true }
    );

    res.json({ message: 'Availability updated successfully', availability: profile.availability });
  } catch (error) {
    console.error('updateAvailability error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/doctors/my-appointments
// @desc    Get all appointments for the logged-in doctor
// @access  Private (Doctor only)
// ─────────────────────────────────────────────────────────
const getDoctorAppointments = async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'fullName email phone avatar')
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('getDoctorAppointments error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllDoctors,
  searchDoctors,
  getDoctorById,
  getDoctorAvailability,
  updateDoctorProfile,
  updateAvailability,
  getDoctorAppointments,
};
