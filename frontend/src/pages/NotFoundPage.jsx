import { Link } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

const NotFoundPage = () => (
  <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <div className="text-center">
      <FiAlertTriangle style={{ fontSize: 64, color: 'var(--warning)', marginBottom: 24 }} />
      <h1 className="heading-lg" style={{ marginBottom: 12 }}>404 — Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  </div>
);

export default NotFoundPage;
