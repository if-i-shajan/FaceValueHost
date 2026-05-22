import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckSquare, Square, ArrowRight, Clock, Eye, AlertTriangle, Coffee } from 'lucide-react'
import { surveyService } from '../../services/survey.service'
import { Survey } from '../../types'

export default function SurveyRulesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) surveyService.getSurvey(id).then(setSurvey).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!survey) return <div className="card text-center py-12 text-surface-500">Survey not found</div>

  const rules = survey.settings.rules

  const sections = [
    { icon: Eye, title: 'Instructions', content: rules.instructions || 'Rate each face image carefully on the provided scale.' },
    { icon: Clock, title: 'Viewing Time', content: rules.viewingTimePolicy || `You must view each image for at least ${survey.settings.mandatoryViewingTime} seconds before rating.` },
    { icon: ArrowRight, title: 'Rating Guidelines', content: rules.ratingGuidelines || 'Rate based on your overall impression. There are no right or wrong answers.' },
    { icon: AlertTriangle, title: 'Skip Policy', content: rules.skipPolicy || `You may skip up to ${survey.settings.skipSettings.maxSkips} images.` },
    { icon: Coffee, title: 'Breaks', content: rules.breakPolicy || `A break will occur every ${survey.settings.breakSettings.breakAfterCount} images to prevent fatigue.` },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
          <span>Step 1 of 3</span>
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <div key={i} className={`h-1 w-8 rounded-full ${i === 1 ? 'bg-brand-500' : 'bg-surface-700'}`} />
            ))}
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold text-surface-100">{survey.title}</h1>
        <p className="text-surface-500 mt-1">Please read the following instructions carefully</p>
      </motion.div>

      <div className="space-y-3">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center shrink-0 mt-0.5">
                <section.icon className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-100 mb-1">{section.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{section.content}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {rules.estimatedDuration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              <span className="font-medium">Estimated duration:</span> {rules.estimatedDuration}
            </p>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <button
          onClick={() => setAgreed(!agreed)}
          className="flex items-start gap-3 w-full text-left"
        >
          <div className="mt-0.5 shrink-0">
            {agreed
              ? <CheckSquare className="w-5 h-5 text-brand-400" />
              : <Square className="w-5 h-5 text-surface-500" />
            }
          </div>
          <p className="text-sm text-surface-300 leading-relaxed">
            I have read and understood all instructions. I agree to participate honestly
            and understand that my data will be used for academic research purposes.
          </p>
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <button
          onClick={() => agreed && navigate(`/survey/${id}/consent`)}
          disabled={!agreed}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          Continue to Consent <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  )
}
