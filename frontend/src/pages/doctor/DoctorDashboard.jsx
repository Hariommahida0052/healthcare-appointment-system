import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiVideo, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await API.get('/doctors/appointments');
      setAppointments(data.slice(0, 5));
      const total = data.length;
      const pending = data.filter(a => a.status === 'pending').length;
      const completed = data.filter(a => a.status === 'completed').length;
      setStats({ total, pending, completed });
    } catch (err) {
      console.error('Error fetching doctor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await API.put(`/appointments/${id}/status`, { status });
      fetchData(); // Refresh
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper doctor-dashboard">
      <div className="container">
        
        <header className="dashboard-header">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="heading-lg">Welcome, <span className="text-gradient">Dr. {user.fullName}</span></h1>
            <p className="text-secondary">You have {stats.pending} pending appointments today.</p>
          </motion.div>
          <div className="header-actions">
            <Link to="/doctor/availability" className="btn btn-secondary">Set Availability</Link>
            <Link to="/doctor/profile" className="btn btn-primary">Edit Profile</Link>
          </div>
        </header>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card-doc">
            <div className="stat-doc-icon blue"><FiCalendar /></div>
            <div>
              <h3>{stats.total}</h3>
              <p>Total Bookings</p>
            </div>
          </div>
          <div className="stat-card-doc">
            <div className="stat-doc-icon yellow"><FiClock /></div>
            <div>
              <h3>{stats.pending}</h3>
              <p>Pending Today</p>
            </div>
          </div>
          <div className="stat-card-doc">
            <div className="stat-doc-icon green"><FiCheckCircle /></div>
            <div>
              <h3>{stats.completed}</h3>
              <p>Completed</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-grid-doc">
          
          {/* Recent Appointments */}
          <section className="dashboard-card-doc">
            <div className="card-header-doc">
              <h3 className="heading-sm">Recent Appointments</h3>
              <Link to="/doctor/appointments" className="btn-text">View All <FiArrowRight /></Link>
            </div>

            <div className="appointments-table-wrapper">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign:'center', padding:40}}>No appointments found.</td></tr>
                  ) : (
                    appointments.map((appt, i) => (
                      <motion.tr 
                        key={appt._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <td>
                          <div className="patient-cell">
                            <div className="mini-avatar">{appt.patient?.fullName.charAt(0)}</div>
                            <span>{appt.patient?.fullName}</span>
                          </div>
                        </td>
                        <td>{appt.timeSlot}</td>
                        <td>
                          <span className={`type-tag ${appt.type}`}>
                            {appt.type === 'online' ? <FiVideo /> : <FiUsers />} {appt.type}
                          </span>
                        </td>
                        <td><span className={`badge-modern ${appt.status}`}>{appt.status}</span></td>
                        <td>
                          <div className="action-btns-doc">
                            {appt.status === 'pending' && (
                              <>
                                <button className="icon-btn-doc green" title="Confirm" onClick={() => handleStatusChange(appt._id, 'confirmed')}><FiCheckCircle /></button>
                                <button className="icon-btn-doc red" title="Cancel" onClick={() => handleStatusChange(appt._id, 'cancelled')}><FiXCircle /></button>
                              </>
                            )}
                            {appt.status === 'confirmed' && appt.type === 'online' && (
                              <Link to={`/consultation/${appt.videoRoomId}`} className="btn btn-primary btn-sm">Join Call</Link>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Quick Stats/Summary */}
          <section className="dashboard-card-doc secondary">
            <h3 className="heading-sm">Daily Schedule</h3>
            <div className="schedule-summary">
              <div className="schedule-item">
                <span className="dot blue"></span>
                <span>Morning: 10:00 AM - 1:00 PM</span>
              </div>
              <div className="schedule-item">
                <span className="dot green"></span>
                <span>Evening: 4:00 PM - 8:00 PM</span>
              </div>
            </div>
            <div className="card-notice">
              <p>Tip: Confirm your pending appointments at least 2 hours in advance.</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};

export default DoctorDashboard;
