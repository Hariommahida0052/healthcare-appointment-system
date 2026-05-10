import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiVideo, FiMapPin, FiCheckCircle, FiXCircle, FiMoreVertical } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import './MyAppointmentsPage.css';

const MyAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await API.get('/patients/appointments');
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(appt => {
    if (filter === 'all') return true;
    return appt.status === filter;
  });

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper appointments-page">
      <div className="container">
        
        <header className="page-header">
          <h1 className="heading-lg">My <span className="text-gradient">Appointments</span></h1>
          <div className="filter-tabs">
            {['all', 'confirmed', 'pending', 'cancelled'].map(status => (
              <button 
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </header>

        <div className="appointments-grid-detailed">
          <AnimatePresence mode='popLayout'>
            {filteredAppointments.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state-full">
                <FiCalendar style={{ fontSize: 64, color: 'var(--text-muted)' }} />
                <h3>No appointments found</h3>
                <p>You haven't booked any appointments in this category yet.</p>
                <Link to="/doctors" className="btn btn-primary">Find a Doctor</Link>
              </motion.div>
            ) : (
              filteredAppointments.map((appt, i) => (
                <motion.div 
                  key={appt._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`appointment-card-detailed ${appt.status}`}
                >
                  <div className="appt-card-header">
                    <div className="appt-doc-info">
                      <div className="mini-avatar">{appt.doctor?.fullName?.charAt(0)}</div>
                      <div>
                        <h4>Dr. {appt.doctor?.fullName}</h4>
                        <p>{appt.doctor?.doctorProfile?.specialization || 'Specialist'}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${appt.status}`}>{appt.status}</span>
                  </div>

                  <div className="appt-card-body">
                    <div className="appt-info-item">
                      <FiCalendar /> <span>{new Date(appt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="appt-info-item">
                      <FiClock /> <span>{appt.timeSlot}</span>
                    </div>
                    <div className="appt-info-item">
                      {appt.type === 'online' ? <><FiVideo /> Online Consultation</> : <><FiMapPin /> In-Person Visit</>}
                    </div>
                  </div>

                  <div className="appt-card-footer">
                    {appt.status === 'confirmed' && appt.type === 'online' && (
                      <Link to={`/consultation/${appt.videoRoomId}`} className="btn btn-primary btn-sm w-full">Join Video Call</Link>
                    )}
                    {appt.status === 'pending' && (
                      <p className="wait-msg">Awaiting doctor confirmation...</p>
                    )}
                    {appt.status === 'cancelled' && (
                      <p className="cancel-msg">This appointment was cancelled.</p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default MyAppointmentsPage;
