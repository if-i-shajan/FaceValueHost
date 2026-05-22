import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Play, Pause, Eye, Search, ClipboardList } from 'lucide-react'
import { surveyService } from '../../services/survey.service'
import { Survey } from '../../types'
import toast from 'react-hot-toast'

export default function AdminSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const load = async () => {
    const data = await surveyService.getSurveys()
    setSurveys(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = surveys.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newTitle.trim()) return toast.error('Title required')
    try {
      const id = await surveyService.createSurvey({
        title: newTitle,
        description: newDesc,
        status: 'draft',
        photoIds: [],
        settings: {
          ratingScale: '1-10',
          randomizeOrder: true,
          photosPerPerson: 3,
          mandatoryViewingTime: 3,
          skipSettings: { enabled: true, maxSkips: 5, skipDelay: 0, reappearLater: false, cooldownSeconds: 0 },
          prevPhotoSettings: { enabled: false, maxPrev: 0 },
          breakSettings: { enabled: true, breakAfterCount: 20, breakDurationSeconds: 120, allowSkipAfterSeconds: 30, message: 'Take a short break to rest your eyes.' },
          attentionChecks: [],
          rules: {
            instructions: 'Rate each face image on the provided scale based on your first impression.',
            ratingGuidelines: 'Use the full scale. 1 = least attractive, 10 = most attractive.',
            viewingTimePolicy: 'Each image must be viewed for at least 3 seconds before rating.',
            skipPolicy: 'You may skip up to 5 images during this survey.',
            prevPhotoPolicy: 'You cannot go back to previous images.',
            breakPolicy: 'A break screen will appear every 20 images.',
            estimatedDuration: '~20-30 minutes',
            consentText: 'Your participation is voluntary and anonymous. Data will be used for academic research.',
            warningMessages: [],
          },
          antiFastRating: {
            enabled: true,
            minimumRatingTimeMs: 1000,
            identicalRatingThreshold: 5,
            maxSkipRate: 0.3,
            penaltyAction: 'warn',
            cooldownSeconds: 5,
          },
          allowResume: true,
        },
      })
      toast.success('Survey created!')
      setCreating(false)
      setNewTitle('')
      setNewDesc('')
      load()
    } catch {
      toast.error('Failed to create survey')
    }
  }

  const handleToggleStatus = async (survey: Survey) => {
    const newStatus = survey.status === 'active' ? 'paused' : 'active'
    await surveyService.updateSurvey(survey.id, { status: newStatus })
    toast.success(`Survey ${newStatus}`)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this survey? This cannot be undone.')) return
    await surveyService.deleteSurvey(id)
    toast.success('Survey deleted')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-100">Surveys</h1>
          <p className="text-surface-500 text-sm">Manage your research surveys</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Survey
        </button>
      </div>

      {/* Create modal */}
      {creating && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="card w-full max-w-md">
            <h2 className="font-display text-xl font-bold text-surface-100 mb-4">Create Survey</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-surface-300 mb-1.5 block">Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Survey title" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-300 mb-1.5 block">Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Brief description..." className="input-field h-24 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCreating(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} className="btn-primary flex-1">Create</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input type="text" placeholder="Search surveys..." value={search}
          onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList className="w-14 h-14 text-surface-700 mx-auto mb-4" />
          <p className="text-surface-400 font-medium">No surveys found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((survey, i) => (
            <motion.div key={survey.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card hover:border-surface-700 transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-surface-100">{survey.title}</h3>
                    <span className={`badge ${
                      survey.status === 'active' ? 'badge-success' :
                      survey.status === 'paused' ? 'badge-warning' :
                      survey.status === 'completed' ? 'badge-info' : 'badge-info'
                    }`}>{survey.status}</span>
                  </div>
                  <p className="text-sm text-surface-500 truncate">{survey.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-surface-600">
                    <span>{survey.photoIds?.length ?? 0} photos</span>
                    <span>{survey.participantCount} participants</span>
                    <span>{survey.completedCount} completed</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleToggleStatus(survey)}
                    className={`btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 ${
                      survey.status === 'active' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                    {survey.status === 'active'
                      ? <><Pause className="w-3.5 h-3.5" />Pause</>
                      : <><Play className="w-3.5 h-3.5" />Activate</>}
                  </button>
                  <Link to={`/admin/surveys/${survey.id}/edit`}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button onClick={() => handleDelete(survey.id)}
                    className="btn-danger py-1.5 px-3 text-xs flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
