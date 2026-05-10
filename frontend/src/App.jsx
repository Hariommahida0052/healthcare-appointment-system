import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages — Public
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Pages — Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorsPage from './pages/patient/DoctorsPage';
import DoctorProfilePage from './pages/patient/DoctorProfilePage';
import BookAppointmentPage from './pages/patient/BookAppointmentPage';
import MyAppointmentsPage from './pages/patient/MyAppointmentsPage';
import PatientProfilePage from './pages/patient/PatientProfilePage';
import PaymentSuccessPage from './pages/patient/PaymentSuccessPage';

// Pages — Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import DoctorProfileEditPage from './pages/doctor/DoctorProfileEditPage';
import AvailabilityPage from './pages/doctor/AvailabilityPage';

// Pages — Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDoctorsPage from './pages/admin/AdminDoctorsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';

// Shared
import ConsultationPage from './pages/ConsultationPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout
import Navbar from './components/layout/Navbar';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* ── Public Routes ─────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Patient Routes ────────────────────────── */}
          <Route path="/patient/dashboard" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/doctors/:id" element={<DoctorProfilePage />} />
          <Route path="/book/:doctorId" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <BookAppointmentPage />
            </ProtectedRoute>
          } />
          <Route path="/patient/appointments" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MyAppointmentsPage />
            </ProtectedRoute>
          } />
          <Route path="/patient/profile" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/payment-success" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PaymentSuccessPage />
            </ProtectedRoute>
          } />

          {/* ── Doctor Routes ─────────────────────────── */}
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/doctor/appointments" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorAppointmentsPage />
            </ProtectedRoute>
          } />
          <Route path="/doctor/profile" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorProfileEditPage />
            </ProtectedRoute>
          } />
          <Route path="/doctor/availability" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <AvailabilityPage />
            </ProtectedRoute>
          } />

          {/* ── Admin Routes ──────────────────────────── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/doctors" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDoctorsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/appointments" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAppointmentsPage />
            </ProtectedRoute>
          } />

          {/* ── Shared ───────────────────────────────── */}
          <Route path="/consultation/:roomId" element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <ConsultationPage />
            </ProtectedRoute>
          } />

          {/* ── Fallback ─────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
