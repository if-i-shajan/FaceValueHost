import { useEffect, useState } from 'react'
import { FileText, Download, BarChart2 } from 'lucide-react'
import { surveyService } from '../../services/survey.service'
import { reportService } from '../../services/report.service'
import { Survey } from '../../types'
import toast from 'react-hot-toast'

export default function AdminReports() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selected, setSelected] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => { surveyService.getSurveys().then(setSurveys) }, [])

  const handleExportCSV = async () => {
    if (!selected) return toast.error('Select a survey first')
    setExporting(true)
    try {
      const csv = await reportService.exportCSV(selected)
      const survey = surveys.find(s => s.id === selected)
      reportService.downloadCSV(csv, `${survey?.title ?? 'survey'}-ratings.csv`)
      toast.success('CSV exported!')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-100">Reports</h1>
        <p className="text-surface-500 text-sm">Export research data for analysis</p>
      </div>

      <div className="card">
        <label className="text-sm font-medium text-surface-300 mb-1.5 block">Select Survey</label>
        <select value={selected} onChange={e => setSelected(e.target.value)} className="input-field">
          <option value="">Select a survey...</option>
          {surveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-hover flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-100">CSV Export</h3>
            <p className="text-sm text-surface-500 mt-1">
              Rows = photos, columns = participants. Includes avg, median, mode, std deviation, min, max.
            </p>
          </div>
          <button onClick={handleExportCSV} disabled={!selected || exporting}
            className="btn-primary flex items-center gap-2 self-start">
            {exporting
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>

        <div className="card-hover flex flex-col gap-4 opacity-60">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-100">PDF Report</h3>
            <p className="text-sm text-surface-500 mt-1">
              Full research report with charts, demographic analysis, and suspicious behavior analysis.
            </p>
          </div>
          <button disabled className="btn-secondary flex items-center gap-2 self-start">
            <Download className="w-4 h-4" /> Export PDF <span className="badge-info ml-2">Coming Soon</span>
          </button>
        </div>
      </div>
    </div>
  )
}
