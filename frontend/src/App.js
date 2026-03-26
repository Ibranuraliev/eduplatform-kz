import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ApplyTeacherPage from './pages/ApplyTeacherPage';
import TrialLessonPage from './pages/TrialLessonPage';
import CoursesPage from './pages/CoursesPage';
import CoursePage from './pages/CoursePage';
import CourseCatalogPage from './pages/CourseCatalogPage';
import LessonPage from './pages/LessonPage';
import VacanciesPage from './pages/VacanciesPage';
import ChatPage from './pages/ChatPage';

function RoleRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CoursePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lessons/:id" element={<Navigate to="/login" />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/apply-teacher" element={<ApplyTeacherPage />} />
        <Route path="/catalog" element={<CourseCatalogPage />} />
        <Route path="/trial" element={<TrialLessonPage />} />
        <Route path="/vacancies" element={<VacanciesPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // Redirect based on role
  return (
    <Routes>
      <Route path="/" element={<CoursesPage />} />
      <Route path="/courses/:id" element={<CoursePage />} />
      <Route path="/lessons/:id" element={<LessonPage />} />
      <Route path="/catalog" element={<CourseCatalogPage />} />
      <Route path="/apply-teacher" element={<ApplyTeacherPage />} />
      <Route path="/vacancies" element={<VacanciesPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/dashboard" element={
        user.role === 'student' ? <StudentDashboard /> :
        user.role === 'teacher' ? <TeacherDashboard /> :
        user.role === 'hr' ? <ManagerDashboard /> :
        <AdminDashboard />
      } />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
