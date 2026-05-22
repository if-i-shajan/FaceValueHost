import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, User, Mail, Lock, Hash, Users, Globe } from 'lucide-react'
import { authService } from '../../services/auth.service'
import toast from 'react-hot-toast'

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Bangladesh','Belgium',
  'Brazil','Canada','Chile','China','Colombia','Czech Republic','Denmark','Egypt','Finland',
  'France','Germany','Ghana','Greece','Hungary','India','Indonesia','Iran','Iraq','Ireland',
  'Israel','Italy','Japan','Jordan','Kenya','South Korea','Lebanon','Malaysia','Mexico',
  'Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines',
  'Poland','Portugal','Romania','Russia','Saudi Arabia','Senegal','South Africa','Spain',
  'Sri Lanka','Sweden','Switzerland','Syria','Thailand','Tunisia','Turkey','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Venezuela','Vietnam','Yemen',
]

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', age: '', gender: '', country: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.gender) return toast.error('Please select your gender')
    const age = parseInt(form.age)
    if (isNaN(age) || age < 18 || age > 99) return toast.error('Age must be between 18 and 99')
    setLoading(true)
    try {
      await authService.register({ ...form, age })
      toast.success('Account created! Welcome to FaceRater.')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 mesh-bg flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 
            flex items-center justify-center shadow-2xl shadow-brand-900/40">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-surface-100">Create Account</h1>
            <p className="text-surface-500 text-sm mt-1">Join the research community</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input type="text" value={form.name} onChange={set('name')}
                  placeholder="Jane Smith" className="input-field pl-10" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="you@example.com" className="input-field pl-10" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input type="password" value={form.password} onChange={set('password')}
                  placeholder="Min. 8 characters" className="input-field pl-10" required minLength={8} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-surface-300 mb-1.5 block">Age *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input type="number" value={form.age} onChange={set('age')}
                    placeholder="25" className="input-field pl-10" required min={18} max={99} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-300 mb-1.5 block">Gender *</label>
                <select value={form.gender} onChange={set('gender')} className="input-field" required>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-300 mb-1.5 block">
                Country <span className="text-surface-600">(optional)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <select value={form.country} onChange={set('country')} className="input-field pl-10">
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                : 'Create Account'
              }
            </button>
          </form>
          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
