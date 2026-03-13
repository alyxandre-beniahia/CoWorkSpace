import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { EmailVerificationPage } from '@/pages/EmailVerificationPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { EspacesPage } from '@/pages/EspacesPage'
import { AdminPage } from '@/pages/AdminPage'
import { AdminMembresPage } from '@/pages/AdminMembresPage'
import { AdminEspacesPage } from '@/pages/AdminEspacesPage'
import { AdminLayout } from '@/components/AdminLayout'
import { SpaceDetailPage } from '@/pages/SpaceDetailPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="espaces" element={<EspacesPage />} />
            <Route path="espaces/:id" element={<SpaceDetailPage />} />
            <Route
              path="profil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminPage />} />
              <Route path="membres" element={<AdminMembresPage />} />
              <Route path="espaces" element={<AdminEspacesPage />} />
            </Route>
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/verification-email" element={<EmailVerificationPage />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="/reset-mot-de-passe" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
