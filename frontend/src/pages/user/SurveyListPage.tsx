import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, ClipboardList, Clock, Users, ArrowRight } from 'lucide-react'
import { surveyService } from '../../services/survey.service'
import { Survey } from '../../types'

export default function SurveyListPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    surveyService.getActiveSurveys().then(setSurveys).finally(() => setLoading(false))
  }, [])

  const filtered = surveys.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-100">Available Surveys</h1>
        <p className="text-surface-500 mt-1">Participate in ongoing research studies</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          type="text"
          placeholder="Search surveys..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList className="w-14 h-14 text-surface-700 mx-auto mb-4" />
          <p className="text-surface-300 font-medium text-lg">No surveys found</p>
          <p className="text-surface-600 text-sm mt-1">Try a different search or check back later</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((survey, i) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card-hover flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-surface-100">{survey.title}</h3>
                  <span className="badge-success">Active</span>
                </div>
                <p className="text-sm text-surface-500 mb-3">{survey.description}</p>
                <div className="flex items-center gap-4 text-xs text-surface-600">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {survey.photoIds?.length ?? 0} images
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {survey.settings?.estimatedDuration || '~20 min'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {survey.participantCount} participants
                  </span>
                </div>
              </div>
              <Link
                to={`/survey/${survey.id}/rules`}
                className="btn-primary flex items-center gap-2 shrink-0"
              >
                Start Survey <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
