import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, CheckCircle, Clock, TrendingUp, ArrowRight, Star } from 'lucide-react'
import { useAuthStore } from '../../store'
import { surveyService } from '../../services/survey.service'
import { Survey, Participant } from '../../types'

export default function UserDashboard() {
  const { userProfile } = useAuthStore()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s] = await Promise.all([surveyService.getActiveSurveys()])
        setSurveys(s)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = [
    { label: 'Active Surveys', value: surveys.length, icon: ClipboardList, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Completed', value: participants.filter(p => p.status === 'completed').length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'In Progress', value: participants.filter(p => p.status === 'in-progress').length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Quality Score', value: `${userProfile?.qualityScore ?? 100}%`, icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-surface-100">
          Welcome back, <span className="gradient-text">{userProfile?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-surface-500 mt-1">Ready to contribute to scientific research today?</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="stat-card"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold font-display text-surface-100">{loading ? '—' : stat.value}</p>
            <p className="text-sm text-surface-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Active Surveys */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-surface-100">Available Surveys</h2>
          <Link to="/surveys" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-5 bg-surface-800 rounded w-1/3 mb-3" />
                <div className="h-3 bg-surface-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : surveys.length === 0 ? (
          <div className="card text-center py-12">
            <ClipboardList className="w-12 h-12 text-surface-700 mx-auto mb-3" />
            <p className="text-surface-400 font-medium">No active surveys available</p>
            <p className="text-surface-600 text-sm mt-1">Check back later for new research opportunities</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {surveys.slice(0, 4).map((survey, i) => (
              <motion.div
                key={survey.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-surface-100 mb-1">{survey.title}</h3>
                    <p className="text-sm text-surface-500 line-clamp-2">{survey.description}</p>
                  </div>
                  <span className="badge-success ml-3 shrink-0">Active</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 text-xs text-surface-600">
                    <span>{survey.photoIds?.length ?? 0} images</span>
                    <span>•</span>
                    <span>{survey.settings?.estimatedDuration || '~20 min'}</span>
                  </div>
                  <Link
                    to={`/survey/${survey.id}/rules`}
                    className="btn-primary py-1.5 px-4 text-sm"
                  >
                    Start
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
