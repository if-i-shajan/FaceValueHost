import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, AlertTriangle, CheckCircle, Clock, Flag } from 'lucide-react'
import { surveyService } from '../../services/survey.service'
import { Survey, Participant } from '../../types'

export default function AdminParticipants() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { surveyService.getSurveys().then(setSurveys) }, [])

  useEffect(() => {
    if (!selectedSurvey) return
    setLoading(true)
    surveyService.getParticipants(selectedSurvey).then(p => {
      setParticipants(p)
      setLoading(false)
    })
  }, [selectedSurvey])

  const filtered = participants.filter(p => {
    const matchSearch = p.userId.includes(search) || p.id.includes(search)
    const matchFilter =
      filter === 'all' ? true :
      filter === 'completed' ? p.status === 'completed' :
      filter === 'in-progress' ? p.status === 'in-progress' :
      filter === 'flagged' ? p.isSuspicious : true
    return matchSearch && matchFilter
  })

  const statusBadge = (p: Participant) => {
    if (p.isSuspicious) return <span className="badge-danger flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Flagged</span>
    if (p.status === 'completed') return <span className="badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" />Completed</span>
    if (p.status === 'in-progress') return <span className="badge-warning flex items-center gap-1"><Clock className="w-3 h-3" />In Progress</span>
    return <span className="badge-info">{p.status}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-100">Participants</h1>
          <p className="text-surface-500 text-sm">Monitor participant activity and data quality</p>
        </div>
        <select value={selectedSurvey} onChange={e => setSelectedSurvey(e.target.value)} className="input-field w-48">
          <option value="">Select survey...</option>
          {surveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>

      {selectedSurvey && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: participants.length, color: 'text-brand-400' },
              { label: 'Completed', value: participants.filter(p => p.status === 'completed').length, color: 'text-emerald-400' },
              { label: 'Active', value: participants.filter(p => p.status === 'in-progress').length, color: 'text-amber-400' },
              { label: 'Flagged', value: participants.filter(p => p.isSuspicious).length, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="stat-card text-center">
                <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID..." className="input-field pl-10" />
            </div>
            <div className="flex gap-1 bg-surface-900 p-1 rounded-xl border border-surface-800">
              {['all', 'completed', 'in-progress', 'flagged'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all capitalize ${filter === f ? 'bg-brand-600/20 text-brand-300' : 'text-surface-500 hover:text-surface-300'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-800">
                    {['Participant ID', 'Status', 'Progress', 'Quality Score', 'Flags', 'Started'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-surface-500 font-medium text-xs uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 bg-surface-800 rounded animate-pulse" /></td></tr>
                    ))
                  ) : filtered.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-all">
                      <td className="px-4 py-3 font-mono text-xs text-surface-300">{p.id.slice(0, 12)}…</td>
                      <td className="px-4 py-3">{statusBadge(p)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-surface-800 rounded-full h-1.5">
                            <div className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${p.photoOrder.length ? (p.completedPhotoIds.length / p.photoOrder.length) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs text-surface-500">
                            {p.completedPhotoIds.length}/{p.photoOrder.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm ${p.qualityScore >= 80 ? 'text-emerald-400' : p.qualityScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {p.qualityScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.suspiciousFlags?.length > 0 ? (
                          <span className="flex items-center gap-1 text-red-400 text-xs">
                            <Flag className="w-3 h-3" />
                            {p.suspiciousFlags.length}
                          </span>
                        ) : (
                          <span className="text-surface-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-500">
                        {p.startedAt ? new Date((p.startedAt as any)?.seconds * 1000).toLocaleDateString() : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {!loading && filtered.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-surface-700 mx-auto mb-3" />
                  <p className="text-surface-500">No participants found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedSurvey && (
        <div className="card text-center py-16">
          <Users className="w-14 h-14 text-surface-700 mx-auto mb-4" />
          <p className="text-surface-400 font-medium">Select a survey to view participants</p>
        </div>
      )}
    </div>
  )
}
