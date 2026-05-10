import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiCalendar, FiVideo, FiShield, FiArrowRight, FiStar } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import './HomePage.css';

const features = [
  { icon: <FiSearch />, title: 'Find Specialists', desc: 'Search doctors by specialty, name, or location instantly.' },
  { icon: <FiCalendar />, title: 'Easy Booking', desc: 'Book appointments in seconds with real-time slot availability.' },
  { icon: <FiVideo />, title: 'Video Consultation', desc: 'Consult your doctor from the comfort of your home via HD video.' },
  { icon: <FiShield />, title: 'Secure & Private', desc: 'Your medical data is encrypted and fully protected.' },
];

const specialties = ['Cardiology', 'Neurology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Psychiatry', 'Gynecology', 'General Medicine'];

const stats = [
  { value: '500+', label: 'Expert Doctors' },
  { value: '50K+', label: 'Happy Patients' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Support Available' },
];

const HomePage = () => {
  return (
    <div className="home-page">

      {/* ── Hero Section ─────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-glow"></div>
        <div className="container hero-content">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="hero-badge">
              <FiStar /> Trusted by 50,000+ patients
            </div>
            <h1 className="heading-xl">
              Your Health,<br />
              <span className="text-gradient">Our Priority</span>
            </h1>
            <p className="hero-subtitle">
              Connect with top-rated doctors, book appointments instantly,
              and consult via video from anywhere — all in one platform.
            </p>
            <div className="hero-actions">
              <Link to="/doctors" className="btn btn-primary btn-lg">
                Find a Doctor <FiArrowRight />
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg">
                Get Started Free
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="hero-card-main">
              <div className="doctor-card-preview">
                <div className="doctor-avatar-hero">DR</div>
                <div>
                  <p className="doctor-name-hero">Dr. Priya Sharma</p>
                  <p className="doctor-spec-hero">Cardiologist • ⭐ 4.9</p>
                </div>
                <span className="badge badge-success">Available</span>
              </div>
              <div className="slot-preview">
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Today's Slots</p>
                <div className="slot-chips">
                  {['10:00', '11:30', '14:00', '15:30'].map(t => (
                    <span key={t} className="slot-chip">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="hero-card-floating">
              <FiVideo style={{ color: 'var(--primary-light)', fontSize: 20 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Video Consultation</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Consult from home</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="container">
          <div className="stats-bar">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                className="stat-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <span className="stat-value text-gradient">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────── */}
      <section className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="heading-lg">Why Choose <span className="text-gradient">HealthCare?</span></h2>
            <p className="section-subtitle">Everything you need for seamless healthcare, in one platform.</p>
          </div>
          <div className="grid-4" style={{ marginTop: 48 }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="feature-card card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specialties Section ──────────────────── */}
      <section className="specialties-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="heading-lg">Browse by <span className="text-gradient">Specialty</span></h2>
            <p className="section-subtitle">Find the right specialist for your needs.</p>
          </div>
          <div className="specialties-grid">
            {specialties.map((spec, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to={`/doctors?specialization=${spec}`} className="specialty-chip">
                  <MdLocalHospital />
                  {spec}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="heading-lg">Ready to take control of your health?</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, marginBottom: 32 }}>
              Join thousands of patients managing their healthcare smartly.
            </p>
            <div className="flex gap-4 justify-center" style={{ flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
              <Link to="/doctors" className="btn btn-secondary btn-lg">Explore Doctors</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="navbar-logo">
              <MdLocalHospital className="logo-icon" />
              <span>Health<span className="logo-accent">Care</span></span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              © 2026 HealthCare App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
