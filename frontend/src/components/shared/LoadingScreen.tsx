import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center mesh-bg">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 
            flex items-center justify-center shadow-2xl shadow-brand-900/50">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-brand-500/20 animate-ping" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="font-display text-xl font-semibold text-surface-100">FaceRater</h2>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-brand-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
