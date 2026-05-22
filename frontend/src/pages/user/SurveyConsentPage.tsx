import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, CheckSquare, Square, ArrowRight } from 'lucide-react'
import { surveyService } from '../../services/survey.service'
import { Survey } from '../../types'

export default function SurveyConsentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [consented, setConsented] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) surveyService.getSurvey(id).then(setSurvey).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!survey) return <div className="card text-center py-12 text-surface-500">Survey not found</div>

  const defaultConsent = `This study collects face perception ratings for academic research purposes. 
Your participation is voluntary and anonymous. You may withdraw at any time without penalty. 
Data collected will be used solely for research and will not be shared with third parties.
By proceeding, you confirm you are 18+ years of age and consent to participation.`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
          <span>Step 2 of 3</span>
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <div key={i} className={`h-1 w-8 rounded-full ${i <= 2 ? 'bg-brand-500' : 'bg-surface-700'}`} />
            ))}
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold text-surface-100">Informed Consent</h1>
        <p className="text-surface-500 mt-1">Please review and provide your consent to proceed</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card border border-brand-500/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="font-semibold text-surface-100">Research Consent Form</h2>
            <p className="text-xs text-surface-500">{survey.title}</p>
          </div>
        </div>
        <div className="bg-surface-800 rounded-xl p-4 max-h-64 overflow-y-auto">
          <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-line">
            {survey.settings.rules.consentText || defaultConsent}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <button
          onClick={() => setConsented(!consented)}
          className="flex items-start gap-3 w-full text-left"
        >
          <div className="mt-0.5 shrink-0">
            {consented
              ? <CheckSquare className="w-5 h-5 text-brand-400" />
              : <Square className="w-5 h-5 text-surface-500" />
            }
          </div>
          <p className="text-sm text-surface-300 leading-relaxed">
            I have read and understood the informed consent form. I voluntarily agree to participate
            in this study. I am 18 years of age or older.
          </p>
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex gap-3">
        <button
          onClick={() => navigate(`/survey/${id}/rules`)}
          className="btn-secondary flex-1"
        >
          Back
        </button>
        <button
          onClick={() => consented && navigate(`/survey/${id}/rate`)}
          disabled={!consented}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          Begin Survey <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  )
}
