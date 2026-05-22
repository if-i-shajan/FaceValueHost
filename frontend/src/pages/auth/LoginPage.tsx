import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, Activity, LogIn } from 'lucide-react'
import { authService } from '../../services/auth.service'
import toast from 'react-hot-toast'

type LoginMode = 'user' | 'admin'

interface LoginPageProps {
  defaultMode?: LoginMode
  showToggle?: boolean
  showRegisterLink?: boolean
  showAltLink?: boolean
}

export default function LoginPage({
  defaultMode = 'user',
  showToggle = true,
  showRegisterLink = true,
  showAltLink = true,
}: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(defaultMode === 'admin')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { role } = await authService.login(email, password)
      if (isAdminMode && role !== 'admin') {
        await authService.logout()
        toast.error('This account does not have admin access')
        return
      }
      toast.success('Welcome back!')
      navigate(role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const altLink = isAdminMode
    ? { to: '/login', label: 'User sign in' }
    : { to: '/admin/login', label: 'Admin sign in' }

  return (
    <div className="min-h-screen bg-surface-950 mesh-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 
            flex items-center justify-center shadow-2xl shadow-brand-900/40">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-surface-100">FaceRater</h1>
            <p className="text-surface-500 text-sm mt-1">Research Platform</p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-surface-100">
                {isAdminMode ? 'Admin Sign In' : 'Sign In'}
              </h2>
              <p className="text-surface-500 text-sm mt-1">
                {isAdminMode ? 'Access admin dashboard' : 'Access your research account'}
              </p>
            </div>
          </div>

          {/* Admin Toggle Button */}
          {showToggle && (
            <button
              type="button"
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`w-full mb-4 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isAdminMode
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-surface-800 text-surface-400 border border-surface-700 hover:bg-surface-700'
                }`}
            >
              {isAdminMode ? '🔒 Admin Mode - Switch to User' : '👤 User Mode - Switch to Admin'}
            </button>
          )}

          {!showToggle && showAltLink && (
            <p className="text-center text-sm text-surface-500 mb-4">
              {isAdminMode ? 'Not an admin?' : 'Admin access?'}{' '}
              <Link to={altLink.to} className="text-brand-400 hover:text-brand-300 font-medium">
                {altLink.label}
              </Link>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : (
                <><LogIn className="w-4 h-4" />{isAdminMode ? 'Admin Sign In' : 'Sign In'}</>
              )}
            </button>

          </form>

          {showRegisterLink && (
            <p className="text-center text-sm text-surface-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Register</Link>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-surface-600 mt-6">
          Scientific-grade face perception research platform
        </p>
      </motion.div>
    </div>
  )
}
