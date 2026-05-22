import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, ClipboardList, LogOut, User, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store'
import { authService } from '../../services/auth.service'
import toast from 'react-hot-toast'

export default function UserLayout() {
  const { userProfile } = useAuthStore()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await authService.logout()
    toast.success('Logged out successfully')
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/surveys', label: 'Surveys', icon: ClipboardList },
  ]

  const isRatingPage = location.pathname.includes('/rate')

  if (isRatingPage) {
    return (
      <div className="min-h-screen bg-surface-950">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-950 mesh-bg">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-surface-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 
              flex items-center justify-center shadow-lg shadow-brand-900/30">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-display font-semibold text-surface-100">FaceRater</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${location.pathname === item.path
                    ? 'bg-brand-600/15 text-brand-300'
                    : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:block">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-800 
                transition-all text-sm text-surface-300"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/30 
                flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <span className="hidden sm:block font-medium">{userProfile?.name?.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-surface-700 
                  shadow-xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-surface-700">
                  <p className="text-sm font-medium text-surface-100">{userProfile?.name}</p>
                  <p className="text-xs text-surface-500 truncate">{userProfile?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 
                    hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
