import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Star, Home, BarChart2 } from 'lucide-react'
import { useSurveySessionStore, useAuthStore } from '../../store'
import { surveyService } from '../../services/survey.service'

export default function SurveyCompletePage() {
  const { id } = useParams<{ id: string }>()
  const sessionStore = useSurveySessionStore()
  const { userProfile } = useAuthStore()

  useEffect(() => {
    // Mark participant as completed
    if (sessionStore.participantId) {
      surveyService.updateParticipant(sessionStore.participantId, {
        status: 'completed',
        completedAt: new Date(),
      } as any)
    }
    sessionStore.resetSession()
  }, [])

  const rated = sessionStore.completedIds.length
  const skipped = sessionStore.skippedIds.length

  return (
    <div className="min-h-screen bg-surface-950 mesh-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
          className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 
            flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="font-display text-3xl font-bold text-surface-100 mb-2">
            Survey Complete!
          </h1>
          <p className="text-surface-400">
            Thank you for your contribution to scientific research,{' '}
            <span className="text-surface-200 font-medium">{userProfile?.name?.split(' ')[0]}</span>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4 my-8"
        >
          {[
            { label: 'Images Rated', value: rated, icon: Star, color: 'text-brand-400' },
            { label: 'Skipped', value: skipped, icon: BarChart2, color: 'text-amber-400' },
            { label: 'Quality Score', value: `${userProfile?.qualityScore ?? 100}%`, icon: CheckCircle, color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="card text-center py-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
              <p className="font-display text-xl font-bold text-surface-100">{stat.value}</p>
              <p className="text-xs text-surface-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3"
        >
          <Link to="/surveys" className="btn-secondary flex-1 flex items-center justify-center gap-2">
            More Surveys
          </Link>
          <Link to="/dashboard" className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
