import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Save, ArrowLeft, Settings, Image, Users, Shield, Coffee, Eye } from 'lucide-react'
import { surveyService } from '../../services/survey.service'
import { Survey, SurveySettings } from '../../types'
import toast from 'react-hot-toast'

export default function AdminSurveyEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    if (id) surveyService.getSurvey(id).then(s => { setSurvey(s); setLoading(false) })
  }, [id])

  const update = (path: string[], value: any) => {
    setSurvey(prev => {
      if (!prev) return prev
      const clone = JSON.parse(JSON.stringify(prev))
      let obj = clone
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]]
      obj[path[path.length - 1]] = value
      return clone
    })
  }

  const handleSave = async () => {
    if (!survey) return
    setSaving(true)
    try {
      await surveyService.updateSurvey(survey.id, survey)
      toast.success('Survey saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!survey) return <div className="card text-center py-12 text-surface-500">Survey not found</div>

  const s = survey.settings

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'rules', label: 'Rules', icon: Shield },
    { id: 'rating', label: 'Rating', icon: Image },
    { id: 'behavior', label: 'Behavior', icon: Users },
    { id: 'antiCheat', label: 'Anti-Cheat', icon: Eye },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/surveys')}
            className="w-9 h-9 rounded-xl bg-surface-800 flex items-center justify-center hover:bg-surface-700 transition-all">
            <ArrowLeft className="w-4 h-4 text-surface-400" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-surface-100">{survey.title}</h1>
            <p className="text-surface-500 text-sm">Survey Settings</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900 p-1 rounded-xl border border-surface-800 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id ? 'bg-brand-600/20 text-brand-300' : 'text-surface-400 hover:text-surface-200'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

        {/* General */}
        {activeTab === 'general' && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-surface-100">General Settings</h2>
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">Title</label>
              <input value={survey.title} onChange={e => setSurvey(p => p ? { ...p, title: e.target.value } : p)}
                className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">Description</label>
              <textarea value={survey.description} onChange={e => setSurvey(p => p ? { ...p, description: e.target.value } : p)}
                className="input-field h-24 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-surface-300 mb-1.5 block">Status</label>
                <select value={survey.status} onChange={e => setSurvey(p => p ? { ...p, status: e.target.value as any } : p)}
                  className="input-field">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-300 mb-1.5 block">Photos per Person</label>
                <input type="number" value={s.photosPerPerson} min={1} max={20}
                  onChange={e => update(['settings', 'photosPerPerson'], parseInt(e.target.value))}
                  className="input-field" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={s.randomizeOrder}
                onChange={e => update(['settings', 'randomizeOrder'], e.target.checked)}
                id="randomize" className="w-4 h-4 rounded accent-brand-500" />
              <label htmlFor="randomize" className="text-sm text-surface-300">Randomize photo order per participant</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={s.allowResume}
                onChange={e => update(['settings', 'allowResume'], e.target.checked)}
                id="resume" className="w-4 h-4 rounded accent-brand-500" />
              <label htmlFor="resume" className="text-sm text-surface-300">Allow survey resume after interruption</label>
            </div>
          </div>
        )}

        {/* Rules */}
        {activeTab === 'rules' && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-surface-100">Rules & Instructions</h2>
            {[
              { key: 'instructions', label: 'Survey Instructions' },
              { key: 'ratingGuidelines', label: 'Rating Guidelines' },
              { key: 'viewingTimePolicy', label: 'Viewing Time Policy' },
              { key: 'skipPolicy', label: 'Skip Policy' },
              { key: 'breakPolicy', label: 'Break Policy' },
              { key: 'estimatedDuration', label: 'Estimated Duration' },
              { key: 'consentText', label: 'Consent Text' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-sm font-medium text-surface-300 mb-1.5 block">{label}</label>
                <textarea value={(s.rules as any)[key]} rows={3}
                  onChange={e => update(['settings', 'rules', key], e.target.value)}
                  className="input-field resize-none" />
              </div>
            ))}
          </div>
        )}

        {/* Rating */}
        {activeTab === 'rating' && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-surface-100">Rating Configuration</h2>
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">Rating Scale</label>
              <select value={s.ratingScale} onChange={e => update(['settings', 'ratingScale'], e.target.value)}
                className="input-field">
                <option value="1-5">1–5 Scale</option>
                <option value="1-10">1–10 Scale (Recommended)</option>
                <option value="slider">Slider</option>
                <option value="emoji">Emoji Scale</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">
                Mandatory Viewing Time (seconds)
              </label>
              <input type="number" value={s.mandatoryViewingTime} min={0} max={30}
                onChange={e => update(['settings', 'mandatoryViewingTime'], parseInt(e.target.value))}
                className="input-field" />
              <p className="text-xs text-surface-600 mt-1">0 = no minimum viewing time</p>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">
                Previous Photo Navigation
              </label>
              <select value={s.prevPhotoSettings.enabled ? String(s.prevPhotoSettings.maxPrev) : 'disabled'}
                onChange={e => {
                  const val = e.target.value
                  if (val === 'disabled') update(['settings', 'prevPhotoSettings'], { enabled: false, maxPrev: 0 })
                  else update(['settings', 'prevPhotoSettings'], { enabled: true, maxPrev: val === 'unlimited' ? 'unlimited' : parseInt(val) })
                }}
                className="input-field">
                <option value="disabled">Disabled</option>
                <option value="1">Last 1 photo</option>
                <option value="3">Last 3 photos</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>
          </div>
        )}

        {/* Behavior */}
        {activeTab === 'behavior' && (
          <div className="space-y-4">
            <div className="card space-y-4">
              <h2 className="font-semibold text-surface-100">Skip Settings</h2>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={s.skipSettings.enabled}
                  onChange={e => update(['settings', 'skipSettings', 'enabled'], e.target.checked)}
                  id="skipEnabled" className="w-4 h-4 rounded accent-brand-500" />
                <label htmlFor="skipEnabled" className="text-sm text-surface-300">Allow skipping images</label>
              </div>
              {s.skipSettings.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-surface-300 mb-1.5 block">Max Skips</label>
                    <input type="number" value={s.skipSettings.maxSkips} min={0}
                      onChange={e => update(['settings', 'skipSettings', 'maxSkips'], parseInt(e.target.value))}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-300 mb-1.5 block">Skip Delay (s)</label>
                    <input type="number" value={s.skipSettings.skipDelay} min={0}
                      onChange={e => update(['settings', 'skipSettings', 'skipDelay'], parseInt(e.target.value))}
                      className="input-field" />
                  </div>
                </div>
              )}
            </div>

            <div className="card space-y-4">
              <h2 className="font-semibold text-surface-100">Break Settings</h2>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={s.breakSettings.enabled}
                  onChange={e => update(['settings', 'breakSettings', 'enabled'], e.target.checked)}
                  id="breakEnabled" className="w-4 h-4 rounded accent-brand-500" />
                <label htmlFor="breakEnabled" className="text-sm text-surface-300">Enable automatic breaks</label>
              </div>
              {s.breakSettings.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-surface-300 mb-1.5 block">Break Every (photos)</label>
                    <input type="number" value={s.breakSettings.breakAfterCount} min={5}
                      onChange={e => update(['settings', 'breakSettings', 'breakAfterCount'], parseInt(e.target.value))}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-300 mb-1.5 block">Break Duration (s)</label>
                    <input type="number" value={s.breakSettings.breakDurationSeconds} min={30}
                      onChange={e => update(['settings', 'breakSettings', 'breakDurationSeconds'], parseInt(e.target.value))}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-300 mb-1.5 block">Allow Skip After (s)</label>
                    <input type="number" value={s.breakSettings.allowSkipAfterSeconds} min={0}
                      onChange={e => update(['settings', 'breakSettings', 'allowSkipAfterSeconds'], parseInt(e.target.value))}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-300 mb-1.5 block">Break Message</label>
                    <input value={s.breakSettings.message}
                      onChange={e => update(['settings', 'breakSettings', 'message'], e.target.value)}
                      className="input-field" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Anti-cheat */}
        {activeTab === 'antiCheat' && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-surface-100">Anti-Cheating Protection</h2>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={s.antiFastRating.enabled}
                onChange={e => update(['settings', 'antiFastRating', 'enabled'], e.target.checked)}
                id="antiEnabled" className="w-4 h-4 rounded accent-brand-500" />
              <label htmlFor="antiEnabled" className="text-sm text-surface-300">Enable anti-fast-rating detection</label>
            </div>
            {s.antiFastRating.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-surface-300 mb-1.5 block">Min Rating Time (ms)</label>
                  <input type="number" value={s.antiFastRating.minimumRatingTimeMs} min={500}
                    onChange={e => update(['settings', 'antiFastRating', 'minimumRatingTimeMs'], parseInt(e.target.value))}
                    className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-300 mb-1.5 block">Identical Rating Threshold</label>
                  <input type="number" value={s.antiFastRating.identicalRatingThreshold} min={3}
                    onChange={e => update(['settings', 'antiFastRating', 'identicalRatingThreshold'], parseInt(e.target.value))}
                    className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-300 mb-1.5 block">Penalty Action</label>
                  <select value={s.antiFastRating.penaltyAction}
                    onChange={e => update(['settings', 'antiFastRating', 'penaltyAction'], e.target.value)}
                    className="input-field">
                    <option value="warn">Warning Only</option>
                    <option value="cooldown">Cooldown Timer</option>
                    <option value="disqualify">Disqualify</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-300 mb-1.5 block">Cooldown (s)</label>
                  <input type="number" value={s.antiFastRating.cooldownSeconds} min={0}
                    onChange={e => update(['settings', 'antiFastRating', 'cooldownSeconds'], parseInt(e.target.value))}
                    className="input-field" />
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
