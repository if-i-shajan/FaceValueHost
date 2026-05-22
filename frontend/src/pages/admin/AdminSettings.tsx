import { useState } from 'react'
import { Settings, Bell, Shield, Database, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [photoIdFormat, setPhotoIdFormat] = useState({ prefix: 'img', separator: '_', startNum: 1, digitLength: 4 })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success('Settings saved')
    setSaving(false)
  }

  const previewId = `${photoIdFormat.prefix}${photoIdFormat.separator}${String(photoIdFormat.startNum).padStart(photoIdFormat.digitLength, '0')}`

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-100">Settings</h1>
        <p className="text-surface-500 text-sm">Platform configuration</p>
      </div>

      {/* Photo ID Format */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-brand-400" />
          </div>
          <h2 className="font-semibold text-surface-100">Photo ID Auto-Generation</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-surface-300 mb-1.5 block">Prefix</label>
            <input value={photoIdFormat.prefix} onChange={e => setPhotoIdFormat(f => ({ ...f, prefix: e.target.value }))}
              placeholder="img" className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-300 mb-1.5 block">Separator</label>
            <input value={photoIdFormat.separator} onChange={e => setPhotoIdFormat(f => ({ ...f, separator: e.target.value }))}
              placeholder="_" className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-300 mb-1.5 block">Starting Number</label>
            <input type="number" value={photoIdFormat.startNum} min={1}
              onChange={e => setPhotoIdFormat(f => ({ ...f, startNum: parseInt(e.target.value) }))}
              className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-300 mb-1.5 block">Digit Length</label>
            <input type="number" value={photoIdFormat.digitLength} min={1} max={8}
              onChange={e => setPhotoIdFormat(f => ({ ...f, digitLength: parseInt(e.target.value) }))}
              className="input-field" />
          </div>
        </div>
        <div className="bg-surface-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-sm text-surface-500">Preview:</span>
          <code className="text-brand-300 font-mono text-sm">{previewId}</code>
        </div>
      </div>

      {/* Security */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="font-semibold text-surface-100">Security</h2>
        </div>
        <p className="text-sm text-surface-400">
          Admin accounts are managed in Supabase. Set the user's <span className="text-surface-200">role</span> to
          <span className="text-surface-200"> admin</span> in the <code className="text-brand-300 font-mono text-xs">users</code>
          table.
        </p>
        <div className="bg-surface-800 rounded-xl px-4 py-3">
          <p className="text-xs text-surface-500 font-mono">
            update users set role = 'admin' where email = 'admin@example.com';
          </p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  )
}
