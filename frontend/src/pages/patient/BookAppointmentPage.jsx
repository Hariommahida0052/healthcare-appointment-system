import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiVideo, FiUsers, FiCreditCard, FiArrowLeft } from 'react-icons/fi';
import API from '../../api/axios';
import './BookAppointmentPage.css';

const BookAppointmentPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [type, setType] = useState('online');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDoctorAndSlots();
  }, [date]);

  const fetchDoctorAndSlots = async () => {
    try {
      setLoading(true);
      const [docRes, slotsRes] = await Promise.all([
        API.get(`/doctors/${doctorId}`),
        API.get(`/appointments/slots/${doctorId}?date=${date}`)
      ]);
      setDoctor(docRes.data);
      setSlots(slotsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) return alert('Please select a time slot');
    
    try {
      setBookingLoading(true);
      // 1. Create Appointment
      const { data: appt } = await API.post('/appointments/book', {
        doctorId,
        date,
        timeSlot: selectedSlot,
        type
      });

      // 2. Create Payment Session
      const { data: session } = await API.post('/payments/create-session', {
        appointmentId: appt.appointment._id
      });

      // 3. Redirect to Stripe
      window.location.href = session.url;
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading && !doctor) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper book-page">
      <div className="container narrow-container">
        <button className="btn-back" onClick={() => navigate(-1)}><FiArrowLeft /> Back</button>

        <motion.div 
          className="booking-card card-modern"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="booking-header">
            <div className="doc-mini-profile">
              <div className="doc-avatar-sm">{doctor?.user?.fullName.charAt(0)}</div>
              <div>
                <h3>Dr. {doctor?.user?.fullName}</h3>
                <p>{doctor?.specialization}</p>
              </div>
            </div>
            <div className="fee-badge">₹{doctor?.fees}</div>
          </div>

          <div className="booking-body">
            {/* Date Selection */}
            <div className="form-group">
              <label className="form-label">Select Date</label>
              <div className="input-wrapper">
                <FiCalendar className="input-icon" />
                <input 
                  type="date" 
                  className="form-input input-with-icon" 
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Type Selection */}
            <div className="type-selector">
              <button 
                className={`type-btn ${type === 'online' ? 'active' : ''}`}
                onClick={() => setType('online')}
              >
                <FiVideo /> Online Video
              </button>
              <button 
                className={`type-btn ${type === 'in-person' ? 'active' : ''}`}
                onClick={() => setType('in-person')}
              >
                <FiUsers /> In-Person
              </button>
            </div>

            {/* Slots Grid */}
            <div className="slots-section">
              <label className="form-label">Available Slots</label>
              <div className="slots-grid-booking">
                {slots.length === 0 ? (
                  <p className="no-slots">No slots available for this date.</p>
                ) : (
                  slots.map(slot => (
                    <button 
                      key={slot}
                      className={`slot-item-btn ${selectedSlot === slot ? 'active' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="booking-summary">
              <div className="summary-row">
                <span>Consultation Fee</span>
                <span>₹{doctor?.fees}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{doctor?.fees}</span>
              </div>
            </div>

            <button 
              className="btn btn-primary w-full btn-lg" 
              onClick={handleBooking}
              disabled={bookingLoading || !selectedSlot}
            >
              {bookingLoading ? <span className="spinner-sm"></span> : <><FiCreditCard /> Pay & Confirm</>}
            </button>
            
            <p className="payment-notice">
              🔒 Secure payment powered by Stripe. You will be redirected.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
