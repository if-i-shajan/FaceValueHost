import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SkipForward, ChevronLeft, AlertTriangle, Check, Coffee, Timer } from 'lucide-react'
import { surveyService } from '../../services/survey.service'
import { photoService, resolvePhotoUrl } from '../../services/photo.service'
import { useAuthStore, useSurveySessionStore } from '../../store'
import { Survey, Photo, Participant } from '../../types'
import toast from 'react-hot-toast'

// ─── Sub-components ─────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0
  return (
    <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  )
}

function ViewingTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (remaining <= 0) { onDone(); return }
    const t = setInterval(() => setRemaining(r => r - 1), 1000)
    return () => clearInterval(t)
  }, [remaining])
  return (
    <div className="flex items-center gap-2 text-sm text-amber-400">
      <Timer className="w-4 h-4 animate-pulse" />
      <span>Observe for {remaining}s</span>
    </div>
  )
}

function BreakScreen({ duration, onContinue, message }: { duration: number; onContinue: () => void; message: string }) {
  const [remaining, setRemaining] = useState(duration)
  const [canSkip, setCanSkip] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setRemaining(r => {
      if (r <= 1) { clearInterval(t); return 0 }
      return r - 1
    }), 1000)
    const skipTimer = setTimeout(() => setCanSkip(true), 30000)
    return () => { clearInterval(t); clearTimeout(skipTimer) }
  }, [])
  useEffect(() => { if (remaining === 0) onContinue() }, [remaining])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-surface-950 flex items-center justify-center"
    >
      <div className="text-center space-y-6 max-w-sm px-6">
        <div className="w-20 h-20 rounded-full bg-brand-600/15 border border-brand-500/30 
          flex items-center justify-center mx-auto">
          <Coffee className="w-10 h-10 text-brand-400" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-surface-100 mb-2">Time for a Break</h2>
          <p className="text-surface-400 text-sm">{message || 'Rest your eyes and take a moment to relax.'}</p>
        </div>
        <div className="text-5xl font-display font-bold text-brand-400">
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
        </div>
        <div className="w-full bg-surface-800 rounded-full h-2">
          <motion.div
            className="h-full bg-brand-500 rounded-full"
            animate={{ width: `${((duration - remaining) / duration) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        {canSkip && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onContinue}
            className="btn-primary"
          >
            Continue Now
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

function WarningDialog({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="card max-w-sm w-full border border-amber-500/30"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="font-semibold text-surface-100">Please Slow Down</h3>
        </div>
        <p className="text-sm text-surface-400 mb-4">{message}</p>
        <button onClick={onClose} className="btn-primary w-full">I Understand</button>
      </motion.div>
    </motion.div>
  )
}

function RatingSuccess({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 600); return () => clearTimeout(t) }, [])
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
    >
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
        <Check className="w-10 h-10 text-emerald-400" />
      </div>
    </motion.div>
  )
}

// ─── Main Rating Page ──────────────────────────────────────

export default function SurveyRatingPage() {
  const { id: surveyId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userProfile } = useAuthStore()
  const sessionStore = useSurveySessionStore()

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [photos, setPhotos] = useState<Map<string, Photo>>(new Map())
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [canRate, setCanRate] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [photoKey, setPhotoKey] = useState(0)
  const ratingStartTime = useRef<number>(Date.now())

  // Init survey
  useEffect(() => {
    if (!surveyId || !userProfile) return
    const init = async () => {
      const [sv, photosArr] = await Promise.all([
        surveyService.getSurvey(surveyId),
        photoService.getPhotos(surveyId),
      ])
      if (!sv) { navigate('/surveys'); return }
      setSurvey(sv)
      const photoMap = new Map(photosArr.filter(p => p.status === 'approved').map(p => [p.id, p]))
      setPhotos(photoMap)
      // Resume or create participant
      const p = await surveyService.getOrCreateParticipant(surveyId, userProfile.uid)
      setParticipant(p)
      // Restore session from participant data
      if (!sessionStore.surveyId || sessionStore.surveyId !== surveyId) {
        sessionStore.setSurveySession({
          surveyId,
          participantId: p.id,
          currentIndex: p.currentIndex,
          photoOrder: p.photoOrder,
          completedIds: p.completedPhotoIds,
          skippedIds: p.skippedPhotoIds,
          skipCount: p.skippedPhotoIds.length,
        })
      }
      setLoading(false)
    }
    init().catch(err => { toast.error('Failed to load survey'); navigate('/surveys') })
  }, [surveyId, userProfile])

  const currentPhotoId = sessionStore.photoOrder[sessionStore.currentIndex]
  const currentPhoto = photos.get(currentPhotoId)
  const totalPhotos = sessionStore.photoOrder.length
  const viewingTime = survey?.settings.mandatoryViewingTime ?? 3

  // Reset timer when photo changes
  useEffect(() => {
    setCanRate(false)
    setSelectedRating(null)
    setImgLoaded(false)
    setPhotoKey(k => k + 1)
    ratingStartTime.current = Date.now()
  }, [sessionStore.currentIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!canRate || showWarning) return
      const key = parseInt(e.key)
      if (!isNaN(key) && key >= 1 && key <= (survey?.settings.ratingScale === '1-5' ? 5 : 10)) {
        handleRating(key)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [canRate, showWarning, survey])

  // Check if survey complete
  useEffect(() => {
    if (!loading && sessionStore.currentIndex >= totalPhotos && totalPhotos > 0) {
      navigate(`/survey/${surveyId}/complete`)
    }
  }, [sessionStore.currentIndex, totalPhotos, loading])

  const checkAntiCheat = (rating: number): boolean => {
    const cfg = survey?.settings.antiFastRating
    if (!cfg?.enabled) return true
    const elapsed = Date.now() - ratingStartTime.current
    if (elapsed < cfg.minimumRatingTimeMs) {
      setWarningMessage(`You are rating too quickly. Please carefully observe the image before rating.`)
      setShowWarning(true)
      // Reduce quality score
      surveyService.updateParticipant(participant!.id, {
        suspiciousFlags: [
          ...(participant?.suspiciousFlags || []),
          { type: 'fast-rating', count: 1, timestamp: new Date(), details: `Rated in ${elapsed}ms` }
        ]
      })
      return false
    }
    if (
      sessionStore.consecutiveIdenticalRatings >= (cfg.identicalRatingThreshold ?? 5) &&
      rating === sessionStore.lastRating
    ) {
      setWarningMessage('You have been selecting the same rating repeatedly. Please rate each image individually.')
      setShowWarning(true)
      return false
    }
    return true
  }

  const handleRating = useCallback(async (rating: number) => {
    if (!canRate || !participant || !currentPhotoId || showSuccess) return
    if (!checkAntiCheat(rating)) return

    setSelectedRating(rating)
    sessionStore.recordRating(rating)

    try {
      await surveyService.submitRating({
        surveyId: surveyId!,
        participantId: participant.id,
        userId: userProfile!.uid,
        photoId: currentPhotoId,
        personId: currentPhoto?.personId || '',
        rating,
        responseTimeMs: Date.now() - ratingStartTime.current,
        isSkipped: false,
        editHistory: [],
      })
      setShowSuccess(true)
      // Auto advance after success animation
      setTimeout(() => {
        setShowSuccess(false)
        sessionStore.markCompleted(currentPhotoId)
        // Update participant in DB
        surveyService.updateParticipant(participant.id, {
          currentIndex: sessionStore.currentIndex + 1,
          completedPhotoIds: [...sessionStore.completedIds, currentPhotoId],
        })
        // Check if break needed
        const settings = survey!.settings.breakSettings
        if (settings.enabled && (sessionStore.completedIds.length + 1) % settings.breakAfterCount === 0) {
          sessionStore.setSurveySession({ isOnBreak: true })
        }
      }, 600)
    } catch {
      toast.error('Failed to submit rating')
    }
  }, [canRate, participant, currentPhotoId, sessionStore, survey, showSuccess])

  const handleSkip = useCallback(async () => {
    if (!participant || !currentPhotoId) return
    const maxSkips = survey?.settings.skipSettings.maxSkips ?? 5
    if (sessionStore.skipCount >= maxSkips) {
      toast.error('Skip limit reached')
      return
    }
    await surveyService.submitRating({
      surveyId: surveyId!,
      participantId: participant.id,
      userId: userProfile!.uid,
      photoId: currentPhotoId,
      personId: currentPhoto?.personId || '',
      rating: 0,
      responseTimeMs: 0,
      isSkipped: true,
      editHistory: [],
    })
    sessionStore.markSkipped(currentPhotoId)
    await surveyService.updateParticipant(participant.id, {
      currentIndex: sessionStore.currentIndex + 1,
      skippedPhotoIds: [...sessionStore.skippedIds, currentPhotoId],
    })
  }, [participant, currentPhotoId, sessionStore, survey])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (sessionStore.isOnBreak && survey) {
    return (
      <BreakScreen
        duration={survey.settings.breakSettings.breakDurationSeconds}
        onContinue={() => sessionStore.setSurveySession({ isOnBreak: false })}
        message={survey.settings.breakSettings.message}
      />
    )
  }

  const scale = survey?.settings.ratingScale === '1-5' ? 5 : 10
  const skipSettings = survey?.settings.skipSettings
  const canSkip = skipSettings?.enabled && sessionStore.skipCount < (skipSettings.maxSkips ?? 5)
  const processedPhotoUrl = currentPhoto ? resolvePhotoUrl(currentPhoto.processedUrl) : ''
  const fallbackPhotoUrl = currentPhoto ? resolvePhotoUrl(currentPhoto.originalUrl) : ''
  const resolvedPhotoUrl = processedPhotoUrl || fallbackPhotoUrl

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-surface-800">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-sm text-surface-500 shrink-0">
            {sessionStore.currentIndex + 1} / {totalPhotos}
          </span>
          <div className="flex-1">
            <ProgressBar current={sessionStore.currentIndex} total={totalPhotos} />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {skipSettings?.enabled && (
            <span className="text-xs text-surface-600">
              Skips: {sessionStore.skipCount}/{skipSettings.maxSkips}
            </span>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
        {/* Image */}
        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-surface-900 border border-surface-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={photoKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: imgLoaded ? 1 : 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {resolvedPhotoUrl ? (
                <img
                  src={resolvedPhotoUrl}
                  alt="Rate this face"
                  className="w-full h-full object-cover"
                  onLoad={() => setImgLoaded(true)}
                  onError={(e) => {
                    const img = e.currentTarget
                    if (fallbackPhotoUrl && img.dataset.fallback !== '1' && img.src !== fallbackPhotoUrl) {
                      img.dataset.fallback = '1'
                      img.src = fallbackPhotoUrl
                      return
                    }
                    setImgLoaded(true)
                  }}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-surface-600 text-sm">
                  Image unavailable
                </div>
              )}
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {showSuccess && <RatingSuccess onDone={() => setShowSuccess(false)} />}
          </AnimatePresence>
        </div>

        {/* Viewing timer */}
        {imgLoaded && !canRate && viewingTime > 0 && (
          <ViewingTimer
            key={photoKey}
            seconds={viewingTime}
            onDone={() => setCanRate(true)}
          />
        )}
        {viewingTime === 0 && imgLoaded && !canRate && (() => { setCanRate(true); return null })()}

        {/* Rating buttons */}
        <motion.div
          animate={{ opacity: canRate ? 1 : 0.35 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-sm text-surface-500">
            {canRate ? 'Select your rating' : 'Viewing...'}
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({ length: scale }, (_, i) => i + 1).map(n => (
              <motion.button
                key={n}
                onClick={() => handleRating(n)}
                disabled={!canRate}
                whileTap={{ scale: canRate ? 0.9 : 1 }}
                className={
                  selectedRating === n
                    ? 'rating-btn-selected'
                    : 'rating-btn-default'
                }
              >
                {n}
              </motion.button>
            ))}
          </div>
          {scale === 10 && (
            <div className="flex items-center justify-between w-full max-w-xs text-xs text-surface-600">
              <span>1 = Least attractive</span>
              <span>10 = Most attractive</span>
            </div>
          )}
        </motion.div>

        {/* Skip */}
        {canSkip && (
          <button
            onClick={handleSkip}
            disabled={!canRate}
            className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-300 
              transition-all disabled:opacity-40"
          >
            <SkipForward className="w-4 h-4" />
            Skip this image
          </button>
        )}
      </main>

      {/* Warning */}
      <AnimatePresence>
        {showWarning && (
          <WarningDialog
            message={warningMessage}
            onClose={() => setShowWarning(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
