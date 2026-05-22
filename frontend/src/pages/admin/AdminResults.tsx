// AdminResults.tsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { surveyService } from '../../services/survey.service'
import { photoService } from '../../services/photo.service'
import { Survey, Photo, Rating } from '../../types'

export function AdminResults() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selected, setSelected] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { surveyService.getSurveys().then(setSurveys) }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    Promise.all([
      photoService.getPhotos(selected),
      surveyService.getRatings(selected),
    ]).then(([ph, r]) => { setPhotos(ph); setRatings(r); setLoading(false) })
  }, [selected])

  const photoStats = photos.map(photo => {
    const pr = ratings.filter(r => r.photoId === photo.id && !r.isSkipped).map(r => r.rating)
    const avg = pr.length ? pr.reduce((a,b) => a+b,0)/pr.length : 0
    return { id: photo.id.slice(-6), avg: parseFloat(avg.toFixed(2)), count: pr.length }
  }).sort((a,b) => b.avg - a.avg)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-100">Results</h1>
          <p className="text-surface-500 text-sm">Per-image rating analysis</p>
        </div>
        <select value={selected} onChange={e => setSelected(e.target.value)} className="input-field w-48">
          <option value="">Select survey...</option>
          {surveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>

      {selected && !loading && photoStats.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-surface-100 mb-4">Average Rating per Image (Top 20)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={photoStats.slice(0,20)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="id" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
              <Bar dataKey="avg" fill="#6366f1" radius={[4,4,0,0]} name="Avg Rating" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selected && !loading && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-surface-800">
                {['Photo ID', 'Avg Rating', 'Ratings Count', 'Min', 'Max'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {photoStats.map(s => (
                  <tr key={s.id} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-surface-300">{s.id}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${s.avg >= 7 ? 'text-emerald-400' : s.avg >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                        {s.avg.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-400">{s.count}</td>
                    <td className="px-4 py-3 text-surface-400">—</td>
                    <td className="px-4 py-3 text-surface-400">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selected && (
        <div className="card text-center py-16">
          <p className="text-surface-400">Select a survey to view results</p>
        </div>
      )}
    </div>
  )
}

export default AdminResults
