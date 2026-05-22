import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store'
import LoadingScreen from './LoadingScreen'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuthStore()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  if (role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
