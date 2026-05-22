import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ClipboardList, Users, Image, BarChart2,
  FileText, Settings, LogOut, ChevronLeft, ChevronRight, Menu,
  Activity, Bell
} from 'lucide-react'
import { useAuthStore, useAdminUIStore } from '../../store'
import { authService } from '../../services/auth.service'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/surveys', label: 'Surveys', icon: ClipboardList },
  { path: '/admin/participants', label: 'Participants', icon: Users },
  { path: '/admin/photos', label: 'Photo Manager', icon: Image },
  { path: '/admin/results', label: 'Results', icon: BarChart2 },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { userProfile } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useAdminUIStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authService.logout()
    toast.success('Logged out')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        className="relative flex flex-col glass border-r border-surface-800 shrink-0 z-40"
        style={{ minHeight: '100vh' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 
            flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/30">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <p className="font-display font-semibold text-surface-100 text-sm">FaceRater</p>
                <p className="text-xs text-brand-400 font-medium">Admin Panel</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                  active
                    ? 'bg-brand-600/15 text-brand-300 border border-brand-500/20'
                    : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800'
                )}
              >
                <item.icon className={clsx('shrink-0', sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-surface-800 p-3 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-medium text-surface-100 truncate">{userProfile?.name}</p>
              <p className="text-xs text-surface-500 truncate">{userProfile?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 
              hover:bg-red-500/10 transition-all"
          >
            <LogOut className={clsx('shrink-0', sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4')} />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm font-medium">
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-800 border 
            border-surface-700 flex items-center justify-center hover:bg-surface-700 
            transition-all z-50 shadow-lg"
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3 h-3 text-surface-400" />
            : <ChevronLeft className="w-3 h-3 text-surface-400" />
          }
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 glass border-b border-surface-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-semibold text-surface-100">
              {navItems.find(n => location.pathname.startsWith(n.path))?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-surface-800 flex items-center justify-center 
              hover:bg-surface-700 transition-all relative">
              <Bell className="w-4 h-4 text-surface-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 
              flex items-center justify-center">
              <span className="text-sm font-semibold text-brand-300">
                {userProfile?.name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
