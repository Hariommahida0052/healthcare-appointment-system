import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiGrid, FiUsers, FiCalendar, FiDollarSign, FiCheckCircle, 
  FiXCircle, FiTrendingUp, FiActivity, FiArrowUpRight, FiMoreVertical 
} from 'react-icons/fi';
import API from '../../api/axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/admin/dashboard/stats');
      setStats(data.stats);
      setRecentAppointments(data.recentAppointments);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Patients', value: stats?.totalPatients || 0, icon: <FiUsers />, color: '#3b82f6', trend: '+12%' },
    { title: 'Total Revenue', value: `₹${stats?.totalRevenue || 0}`, icon: <FiDollarSign />, color: '#10b981', trend: '+18%' },
    { title: 'Appointments', value: stats?.totalAppointments || 0, icon: <FiCalendar />, color: '#8b5cf6', trend: '+5%' },
    { title: 'Pending Approval', value: stats?.pendingDoctors || 0, icon: <FiActivity />, color: '#f59e0b', trend: 'Critical' },
  ];

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="admin-container">
      {/* Sidebar - Professional Style */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <FiGrid /> <span>Admin Panel</span>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active"><FiActivity /> Overview</button>
          <button className="nav-item"><FiUsers /> Doctors</button>
          <button className="nav-item"><FiUsers /> Patients</button>
          <button className="nav-item"><FiCalendar /> Appointments</button>
          <button className="nav-item"><FiDollarSign /> Payments</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="heading-md">System Overview</h1>
            <p className="text-secondary">Welcome back, Administrator</p>
          </div>
          <div className="admin-profile-mini">
            <div className="admin-avatar">AD</div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          {statCards.map((card, i) => (
            <motion.div 
              key={i} 
              className="stat-card-modern"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="stat-card-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                {card.icon}
              </div>
              <div className="stat-card-info">
                <p className="stat-card-title">{card.title}</p>
                <h2 className="stat-card-value">{card.value}</h2>
              </div>
              <div className={`stat-card-trend ${card.trend.includes('+') ? 'up' : 'warning'}`}>
                {card.trend} <FiArrowUpRight />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Dashboard Section */}
        <div className="dashboard-content-grid">
          {/* Recent Activity Table */}
          <section className="dashboard-section card-modern">
            <div className="section-title-box">
              <h3 className="heading-sm">Recent Appointments</h3>
              <button className="btn-text">View All</button>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appt) => (
                    <tr key={appt._id}>
                      <td>
                        <div className="table-user">
                          <div className="mini-avatar">{appt.patient?.fullName?.charAt(0)}</div>
                          <span>{appt.patient?.fullName}</span>
                        </div>
                      </td>
                      <td>Dr. {appt.doctor?.fullName}</td>
                      <td>{new Date(appt.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge-modern ${appt.status}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td><button className="icon-btn"><FiMoreVertical /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pending Doctors Approval */}
          <section className="dashboard-section card-modern">
            <div className="section-title-box">
              <h3 className="heading-sm">Pending Verifications</h3>
              <span className="badge badge-warning">{stats?.pendingDoctors} New</span>
            </div>
            <div className="pending-list">
              {/* Dummy data for visual if none pending */}
              {stats?.pendingDoctors === 0 ? (
                <div className="empty-state">
                  <FiCheckCircle style={{ fontSize: 32, color: 'var(--accent)' }} />
                  <p>All doctors verified</p>
                </div>
              ) : (
                <p>Visit Doctor Management to approve/reject.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
