import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiVideo, FiFileText, FiArrowRight, FiUser, FiActivity } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await API.get('/patients/appointments');
      setAppointments(data.slice(0, 3)); // Only show top 3 on dashboard
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper patient-dashboard">
      <div className="container">
        
        {/* Welcome Header */}
        <header className="dashboard-header">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="heading-lg">Hello, <span className="text-gradient">{user.fullName}</span></h1>
            <p className="text-secondary">Have a great day and stay healthy!</p>
          </motion.div>
          <Link to="/doctors" className="btn btn-primary">
            Book Appointment <FiCalendar />
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="stats-row">
          <div className="stat-box-modern">
            <div className="stat-icon-box blue"><FiCalendar /></div>
            <div>
              <p className="stat-label">Total Appointments</p>
              <h3 className="stat-value">{appointments.length}</h3>
            </div>
          </div>
          <div className="stat-box-modern">
            <div className="stat-icon-box green"><FiActivity /></div>
            <div>
              <p className="stat-label">Health Records</p>
              <h3 className="stat-value">12</h3>
            </div>
          </div>
          <div className="stat-box-modern">
            <div className="stat-icon-box purple"><FiUser /></div>
            <div>
              <p className="stat-label">Profile Status</p>
              <h3 className="stat-value">Healthy</h3>
            </div>
          </div>
        </div>

        <div className="dashboard-main-grid">
          {/* Upcoming Appointments */}
          <section className="dashboard-card card-modern">
            <div className="card-header">
              <h3 className="heading-sm">Upcoming Appointments</h3>
              <Link to="/patient/appointments" className="btn-text">View All <FiArrowRight /></Link>
            </div>
            
            <div className="appointments-list">
              {appointments.length === 0 ? (
                <div className="empty-appointments">
                  <p>No upcoming appointments found.</p>
                  <Link to="/doctors" className="btn btn-secondary btn-sm">Find a Doctor</Link>
                </div>
              ) : (
                appointments.map((appt, i) => (
                  <motion.div 
                    key={appt._id} 
                    className="appointment-item-modern"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="appt-date-box">
                      <span className="appt-month">{new Date(appt.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="appt-day">{new Date(appt.date).getDate()}</span>
                    </div>
                    <div className="appt-details">
                      <h4 className="appt-doc-name">Dr. {appt.doctor?.fullName}</h4>
                      <p className="appt-time"><FiClock /> {appt.timeSlot}</p>
                    </div>
                    <div className="appt-type-badge">
                      {appt.type === 'online' ? <><FiVideo /> Video</> : <><FiActivity /> Clinic</>}
                    </div>
                    {appt.status === 'confirmed' && appt.type === 'online' && (
                      <Link to={`/consultation/${appt.videoRoomId}`} className="btn btn-primary btn-sm join-btn">
                        Join Call
                      </Link>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Quick Actions / Notifications */}
          <section className="dashboard-card card-modern secondary-card">
            <h3 className="heading-sm">Quick Actions</h3>
            <div className="quick-actions-grid">
              <button className="action-btn-modern">
                <FiFileText /> <span>Medical Records</span>
              </button>
              <button className="action-btn-modern">
                <FiUser /> <span>Edit Profile</span>
              </button>
              <button className="action-btn-modern">
                <FiActivity /> <span>Lab Results</span>
              </button>
            </div>

            <div className="health-tip-box">
              <h4 className="tip-title">Daily Health Tip</h4>
              <p className="tip-text">Drink at least 8 glasses of water daily to keep your body hydrated and healthy.</p>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;
