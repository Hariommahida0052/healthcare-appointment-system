const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const { sendConfirmationEmail } = require('../utils/sendEmail');

// ─────────────────────────────────────────────────────────
// @route   GET /api/admin/dashboard/stats
// @desc    Get overall system statistics for admin dashboard
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    // Run all DB queries in parallel for speed
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      pendingDoctors,
      todayAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenueResult,
      recentAppointments,
      recentPayments,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient', isActive: true }),
      User.countDocuments({ role: 'doctor', isApproved: true, isActive: true }),
      Appointment.countDocuments(),
      User.countDocuments({ role: 'doctor', isApproved: false }),
      Appointment.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Payment.aggregate([
        { $match: { status: 'successful' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Appointment.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patient', 'fullName avatar')
        .populate('doctor', 'fullName avatar'),
      Payment.find({ status: 'successful' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patient', 'fullName')
        .populate('doctor', 'fullName'),
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    res.json({
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        pendingDoctors,
        todayAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
      },
      recentAppointments,
      recentPayments,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/admin/doctors/pending
// @desc    Get all doctors waiting for admin approval
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────
const getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await User.find({
      role: 'doctor',
      isApproved: false,
      isActive: true,
    }).select('-password').sort({ createdAt: -1 });

    // Attach their profile info
    const result = await Promise.all(
      pendingDoctors.map(async (doc) => {
        const profile = await DoctorProfile.findOne({ user: doc._id });
        return {
          _id: doc._id,
          fullName: doc.fullName,
          email: doc.email,
          phone: doc.phone,
          avatar: doc.avatar,
          createdAt: doc.createdAt,
          specialization: profile?.specialization || 'Not specified',
          qualifications: profile?.qualifications || [],
          experience: profile?.experience || 0,
          hospital: profile?.hospital || '',
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error('getPendingDoctors error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/admin/doctors/:id/approve
// @desc    Admin approves a doctor registration
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────
const approveDoctor = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.isApproved) {
      return res.status(400).json({ message: 'Doctor is already approved' });
    }

    doctor.isApproved = true;
    await doctor.save();

    // Send approval email to doctor
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"Healthcare App" <${process.env.EMAIL_USER}>`,
        to: doctor.email,
        subject: '✅ Your Doctor Account has been Approved!',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
            <h2 style="color:#10b981;">🎉 Congratulations, Dr. ${doctor.fullName}!</h2>
            <p>Your account on <strong>Healthcare App</strong> has been approved by our admin team.</p>
            <p>You can now log in and start accepting patient appointments.</p>
            <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:12px;">Login to Dashboard</a>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Approval email failed:', emailErr.message);
    }

    res.json({ message: `Dr. ${doctor.fullName} has been approved successfully`, doctor });
  } catch (error) {
    console.error('approveDoctor error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/admin/doctors/:id/reject
// @desc    Admin rejects a doctor registration with a reason
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────
const rejectDoctor = async (req, res) => {
  try {
    const { reason } = req.body;
    const doctor = await User.findById(req.params.id);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Deactivate the account instead of deleting it
    doctor.isActive = false;
    await doctor.save();

    // Send rejection email
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"Healthcare App" <${process.env.EMAIL_USER}>`,
        to: doctor.email,
        subject: '❌ Doctor Account Registration Update',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
            <h2 style="color:#ef4444;">Account Not Approved</h2>
            <p>Dear Dr. ${doctor.fullName},</p>
            <p>Unfortunately, your registration on Healthcare App was not approved at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>Please contact support for more information.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Rejection email failed:', emailErr.message);
    }

    res.json({ message: `Dr. ${doctor.fullName}'s registration has been rejected` });
  } catch (error) {
    console.error('rejectDoctor error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/admin/users?role=&search=&page=
// @desc    Get all users with optional filters and pagination
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    // Build query filter
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('getAllUsers error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/deactivate
// @desc    Admin deactivates a user account (soft delete)
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent admin from deactivating their own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: `${user.fullName}'s account has been deactivated` });
  } catch (error) {
    console.error('deactivateUser error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/activate
// @desc    Admin re-activates a deactivated user account
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = true;
    await user.save();

    res.json({ message: `${user.fullName}'s account has been activated` });
  } catch (error) {
    console.error('activateUser error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/admin/appointments?status=&page=
// @desc    Get all appointments in the system with filters
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────
const getAllAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, totalCount] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'fullName email avatar')
        .populate('doctor', 'fullName email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(query),
    ]);

    res.json({
      appointments,
      totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('getAllAppointments error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/admin/payments?page=
// @desc    Get all payment records + revenue summary
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, totalCount, revenueResult] = await Promise.all([
      Payment.find()
        .populate('patient', 'fullName email')
        .populate('doctor', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'successful' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalTransactions: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      payments,
      totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
      currentPage: Number(page),
      revenue: {
        totalRevenue: revenueResult[0]?.totalRevenue || 0,
        totalSuccessfulTransactions: revenueResult[0]?.totalTransactions || 0,
      },
    });
  } catch (error) {
    console.error('getAllPayments error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  getAllUsers,
  deactivateUser,
  activateUser,
  getAllAppointments,
  getAllPayments,
};
