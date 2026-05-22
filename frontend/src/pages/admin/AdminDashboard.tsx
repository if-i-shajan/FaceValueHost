import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, ClipboardList, CheckCircle, AlertTriangle, Image,
  TrendingUp, Clock, BarChart2, ArrowRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { surveyService } from '../../services/survey.service'
import { Survey, SurveyAnalytics } from '../../types'

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#818cf8', '#c4b5fd']

export default function AdminDashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const svs = await surveyService.getSurveys()
      setSurveys(svs)
      if (svs.length > 0) {
        const a = await surveyService.getSurveyAnalytics(svs[0].id)
        setAnalytics(a)
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalParticipants = surveys.reduce((s, sv) => s + sv.participantCount, 0)
  const totalCompleted = surveys.reduce((s, sv) => s + sv.completedCount, 0)
  const activeSurveys = surveys.filter(s => s.status === 'active').length

  const statCards = [
    { label: 'Total Participants', value: totalParticipants, icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10', change: '+12%' },
    { label: 'Completed', value: totalCompleted, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', change: '+8%' },
    { label: 'Active Surveys', value: activeSurveys, icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-500/10', change: '0' },
    { label: 'Flagged', value: analytics?.suspiciousParticipants ?? 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', change: '-2%' },
    { label: 'Avg Rating', value: analytics?.averageRating.toFixed(1) ?? '—', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', change: '' },
    { label: 'Dropout Rate', value: analytics ? `${analytics.dropoutRate.toFixed(1)}%` : '—', icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10', change: '' },
  ]

  const ratingData = analytics
    ? Object.entries(analytics.ratingDistribution).map(([r, c]) => ({ rating: `${r}`, count: c }))
    : []

  const genderData = analytics
    ? Object.entries(analytics.genderBreakdown).map(([name, value]) => ({ name, value }))
    : [{ name: 'Male', value: 45 }, { name: 'Female', value: 50 }, { name: 'Other', value: 5 }]

  const lineData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    participants: Math.floor(Math.random() * 50) + 10,
    completions: Math.floor(Math.random() * 40) + 5,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-100">Research Overview</h1>
          <p className="text-surface-500 text-sm mt-0.5">Monitor platform activity and research quality</p>
        </div>
        <Link to="/admin/surveys" className="btn-primary flex items-center gap-2 text-sm">
          Manage Surveys <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="stat-card"
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} style={{ width: 18, height: 18 }} />
            </div>
            <p className="text-xl font-bold font-display text-surface-100">{loading ? '—' : stat.value}</p>
            <p className="text-xs text-surface-500 mt-0.5">{stat.label}</p>
            {stat.change && (
              <p className={`text-xs mt-1 font-medium ${stat.change.startsWith('+') ? 'text-emerald-400' : stat.change.startsWith('-') ? 'text-red-400' : 'text-surface-600'}`}>
                {stat.change}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participation trend */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-surface-100 mb-4">Participation Trend (7 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="participants" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} name="Participants" />
              <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Completions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gender breakdown */}
        <div className="card">
          <h3 className="font-semibold text-surface-100 mb-4">Gender Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" paddingAngle={3}>
                {genderData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {genderData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-surface-400">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Rating distribution */}
      {ratingData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-surface-100 mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="rating" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent surveys */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-surface-100">Recent Surveys</h3>
          <Link to="/admin/surveys" className="text-sm text-brand-400 hover:text-brand-300">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-12 bg-surface-800 rounded-xl animate-pulse" />)
          ) : surveys.slice(0, 5).map(survey => (
            <div key={survey.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50">
              <div>
                <p className="text-sm font-medium text-surface-100">{survey.title}</p>
                <p className="text-xs text-surface-500">{survey.participantCount} participants</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${survey.status === 'active' ? 'badge-success' : survey.status === 'paused' ? 'badge-warning' : 'badge-info'}`}>
                  {survey.status}
                </span>
                <Link to={`/admin/surveys/${survey.id}/edit`} className="text-xs text-brand-400 hover:text-brand-300">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
