import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { authService } from './services/auth.service'
import { useAuthStore } from './store'

// Layouts
import UserLayout from './components/user/UserLayout'
import AdminLayout from './components/admin/AdminLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// User pages
import UserDashboard from './pages/user/UserDashboard'
import SurveyListPage from './pages/user/SurveyListPage'
import SurveyRulesPage from './pages/user/SurveyRulesPage'
import SurveyConsentPage from './pages/user/SurveyConsentPage'
import SurveyRatingPage from './pages/user/SurveyRatingPage'
import SurveyCompletePage from './pages/user/SurveyCompletePage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSurveys from './pages/admin/AdminSurveys'
import AdminSurveyEdit from './pages/admin/AdminSurveyEdit'
import AdminParticipants from './pages/admin/AdminParticipants'
import AdminPhotoManager from './pages/admin/AdminPhotoManager'
import AdminResults from './pages/admin/AdminResults'
import AdminReports from './pages/admin/AdminReports'
import AdminSettings from './pages/admin/AdminSettings'

// Guards
import ProtectedRoute from './components/shared/ProtectedRoute'
import AdminRoute from './components/shared/AdminRoute'
import LoadingScreen from './components/shared/LoadingScreen'

export default function App() {
  const { setAuthUser, setUserProfile, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    const unsub = authService.onAuthStateChange(async (user) => {
      setAuthUser(user)
      if (user) {
        try {
          const profile = await authService.getUserProfile(user.id)
          setUserProfile(profile)
        } catch (err) {
          console.error('Failed to load user profile', err)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  if (isLoading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={<LoginPage defaultMode="user" showToggle={false} showAltLink />}
        />
        <Route
          path="/admin/login"
          element={<LoginPage defaultMode="admin" showToggle={false} showRegisterLink={false} showAltLink />}
        />
        <Route path="/register" element={<RegisterPage />} />

        {/* User Routes */}
        <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/surveys" element={<SurveyListPage />} />
          <Route path="/survey/:id/rules" element={<SurveyRulesPage />} />
          <Route path="/survey/:id/consent" element={<SurveyConsentPage />} />
          <Route path="/survey/:id/rate" element={<SurveyRatingPage />} />
          <Route path="/survey/:id/complete" element={<SurveyCompletePage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/surveys" element={<AdminSurveys />} />
          <Route path="/admin/surveys/:id/edit" element={<AdminSurveyEdit />} />
          <Route path="/admin/participants" element={<AdminParticipants />} />
          <Route path="/admin/photos" element={<AdminPhotoManager />} />
          <Route path="/admin/results" element={<AdminResults />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
