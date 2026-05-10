import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './AuthPages.css';

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', gender: 'Male', role: 'patient'
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      const { data } = await API.post('/auth/register', form);
      login(data.user, data.token);
      const routes = { patient: '/patient/dashboard', doctor: '/doctor/dashboard' };
      navigate(routes[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow"></div>

      <motion.div
        className="auth-card auth-card-wide"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-logo">
          <MdLocalHospital />
          <span>Health<span className="logo-accent">Care</span></span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join thousands managing their health smarter</p>

        {/* Role Selector */}
        <div className="role-selector">
          <button
            type="button"
            id="role-patient"
            className={`role-btn ${form.role === 'patient' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'patient' })}
          >
            🧑‍⚕️ I'm a Patient
          </button>
          <button
            type="button"
            id="role-doctor"
            className={`role-btn ${form.role === 'doctor' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'doctor' })}
          >
            👨‍⚕️ I'm a Doctor
          </button>
        </div>

        {error && (
          <div className="auth-error">
            <FiAlertCircle /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="grid-2">
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input
                  id="reg-fullname"
                  type="text"
                  name="fullName"
                  placeholder="Dr. John Smith"
                  value={form.fullName}
                  onChange={handleChange}
                  className="form-input input-with-icon"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-wrapper">
                <FiPhone className="input-icon" />
                <input
                  id="reg-phone"
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                  className="form-input input-with-icon"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                id="reg-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="form-input input-with-icon"
              />
            </div>
          </div>

          <div className="grid-2">
            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  className="form-input input-with-icon input-with-icon-right"
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Gender */}
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                id="reg-gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {form.role === 'doctor' && (
            <div className="doctor-notice">
              ℹ️ Doctor accounts require admin approval before you can accept bookings.
            </div>
          )}

          <button id="reg-submit" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner-sm"></span> : `Create ${form.role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
