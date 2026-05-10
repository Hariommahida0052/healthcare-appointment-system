import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiStar, FiMapPin, FiClock, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import './DoctorsPage.css';

const specialties = ['Cardiology', 'Neurology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Psychiatry', 'Gynecology', 'General Medicine'];

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpec]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const url = selectedSpec ? `/doctors/search?specialization=${selectedSpec}` : '/doctors/search';
      const { data } = await API.get(url);
      setDoctors(data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => 
    doc.fullName.toLowerCase().includes(search.toLowerCase()) ||
    doc.doctorProfile?.specialization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper doctors-page">
      <div className="container">
        
        {/* Header Section */}
        <div className="doctors-header">
          <motion.h1 
            className="heading-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Find Your <span className="text-gradient">Specialist</span>
          </motion.h1>
          <p className="text-secondary">Book an appointment with top-rated doctors across various specialties.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="search-filter-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or specialty..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            <FiFilter /> Filters
          </button>
        </div>

        {/* Specialties Filter */}
        <div className="specialties-scroll">
          <button 
            className={`spec-pill ${selectedSpec === '' ? 'active' : ''}`}
            onClick={() => setSelectedSpec('')}
          >
            All
          </button>
          {specialties.map(spec => (
            <button 
              key={spec}
              className={`spec-pill ${selectedSpec === spec ? 'active' : ''}`}
              onClick={() => setSelectedSpec(spec)}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        <div className="doctors-grid">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="skeleton-card"></div>)
          ) : (
            <AnimatePresence>
              {filteredDoctors.map((doc, index) => (
                <motion.div 
                  key={doc._id}
                  className="doctor-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                >
                  <div className="doc-card-top">
                    <div className="doc-avatar-large">
                      {doc.avatar ? <img src={doc.avatar} alt={doc.fullName} /> : doc.fullName.charAt(0)}
                    </div>
                    <div className="doc-info">
                      <h3 className="doc-name">Dr. {doc.fullName}</h3>
                      <p className="doc-spec">{doc.doctorProfile?.specialization}</p>
                      <div className="doc-rating">
                        <FiStar className="star-icon" /> 
                        <span>4.8 (120+ reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="doc-card-details">
                    <div className="doc-detail-item">
                      <FiMapPin /> <span>{doc.doctorProfile?.hospital || 'City Hospital'}</span>
                    </div>
                    <div className="doc-detail-item">
                      <FiClock /> <span>Available Tomorrow</span>
                    </div>
                  </div>

                  <div className="doc-card-footer">
                    <div className="doc-price">
                      <span className="price-label">Fee</span>
                      <span className="price-value">₹{doc.doctorProfile?.fees || 500}</span>
                    </div>
                    <Link to={`/doctors/${doc._id}`} className="btn btn-primary btn-sm">
                      Book Now <FiChevronRight />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {!loading && filteredDoctors.length === 0 && (
          <div className="no-results">
            <h3>No doctors found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;
