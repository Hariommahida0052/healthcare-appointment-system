import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiUser, FiBriefcase, FiMapPin, FiDollarSign, FiInfo, FiCamera } from 'react-icons/fi';
import API from '../../api/axios';
import './DoctorProfileEditPage.css';

const DoctorProfileEditPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    specialization: '',
    experience: '',
    fees: '',
    hospital: '',
    bio: '',
    avatar: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get('/doctors/me');
      setProfile({
        fullName: data.user.fullName,
        phone: data.user.phone || '',
        specialization: data.specialization || '',
        experience: data.experience || '',
        fees: data.fees || '',
        hospital: data.hospital || '',
        bio: data.bio || '',
        avatar: data.user.avatar || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await API.put('/doctors/profile', profile);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper profile-edit-page">
      <div className="container narrow-container">
        
        <div className="profile-header-edit">
          <h1 className="heading-md">Edit Professional Profile</h1>
          <p className="text-secondary">Keep your information up-to-date for patients.</p>
        </div>

        <motion.form 
          className="profile-form card-modern"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
        >
          {/* Avatar Upload Placeholder */}
          <div className="avatar-upload-section">
            <div className="avatar-preview-large">
              {profile.avatar ? <img src={profile.avatar} alt="Profile" /> : profile.fullName.charAt(0)}
              <div className="camera-overlay"><FiCamera /></div>
            </div>
            <p className="text-muted">Click to change photo</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input type="text" name="fullName" value={profile.fullName} onChange={handleChange} className="form-input input-with-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-wrapper">
                <FiBriefcase className="input-icon" />
                <input type="text" name="phone" value={profile.phone} onChange={handleChange} className="form-input input-with-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Specialization</label>
              <select name="specialization" value={profile.specialization} onChange={handleChange} className="form-input">
                <option value="">Select Specialty</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="General Medicine">General Medicine</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input type="number" name="experience" value={profile.experience} onChange={handleChange} className="form-input" placeholder="e.g. 10" />
            </div>

            <div className="form-group">
              <label className="form-label">Consultation Fee (₹)</label>
              <div className="input-wrapper">
                <FiDollarSign className="input-icon" />
                <input type="number" name="fees" value={profile.fees} onChange={handleChange} className="form-input input-with-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Hospital / Clinic</label>
              <div className="input-wrapper">
                <FiMapPin className="input-icon" />
                <input type="text" name="hospital" value={profile.hospital} onChange={handleChange} className="form-input input-with-icon" />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Professional Bio</label>
            <div className="input-wrapper">
              <FiInfo className="input-icon" style={{ top: 15, transform: 'none' }} />
              <textarea 
                name="bio" 
                value={profile.bio} 
                onChange={handleChange} 
                className="form-input input-with-icon" 
                rows="4" 
                placeholder="Brief description of your expertise..."
              ></textarea>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={saving}>
            {saving ? <span className="spinner-sm"></span> : <><FiSave /> Save Changes</>}
          </button>
        </motion.form>

      </div>
    </div>
  );
};

export default DoctorProfileEditPage;
